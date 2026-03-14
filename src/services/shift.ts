import { DateTime } from 'luxon';
import { query, getClient } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export async function getShiftsBySchedule(scheduleId: string) {
  const result = await query(
    `SELECT s.*, sk.name as skill_name, l.timezone,
            COALESCE(
              json_agg(
                jsonb_build_object(
                  'id', sa.id,
                  'userId', sa.user_id,
                  'firstName', u.first_name,
                  'lastName', u.last_name,
                  'status', sa.status,
                  'version', sa.version
                )
              ) FILTER (WHERE sa.id IS NOT NULL AND sa.status = 'assigned'), '[]'
            ) as assignments
     FROM shifts s
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
     LEFT JOIN users u ON sa.user_id = u.id
     JOIN locations l ON s.location_id = l.id
     WHERE s.schedule_id = $1
     GROUP BY s.id, sk.name, l.timezone
     ORDER BY s.start_time`,
    [scheduleId]
  );
  return result.rows;
}

export async function getShiftById(shiftId: string) {
  const result = await query(
    `SELECT s.*, sk.name as skill_name, l.timezone, l.name as location_name,
            l.edit_cutoff_hours, sc.status as schedule_status,
            COALESCE(
              json_agg(
                jsonb_build_object(
                  'id', sa.id,
                  'userId', sa.user_id,
                  'firstName', u.first_name,
                  'lastName', u.last_name,
                  'status', sa.status,
                  'version', sa.version
                )
              ) FILTER (WHERE sa.id IS NOT NULL AND sa.status = 'assigned'), '[]'
            ) as assignments
     FROM shifts s
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
     LEFT JOIN users u ON sa.user_id = u.id
     JOIN locations l ON s.location_id = l.id
     JOIN schedules sc ON s.schedule_id = sc.id
     WHERE s.id = $1
     GROUP BY s.id, sk.name, l.timezone, l.name, l.edit_cutoff_hours, sc.status`,
    [shiftId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Shift not found');
  }

  return result.rows[0];
}

export async function createShift(data: {
  scheduleId: string;
  locationId: string;
  startTime: string;
  endTime: string;
  requiredSkillId?: string;
  headcountNeeded: number;
  notes?: string;
  timezone: string;
}) {
  // Convert from location timezone to UTC for storage
  const startUtc = DateTime.fromISO(data.startTime, { zone: data.timezone }).toUTC().toISO();
  const endUtc = DateTime.fromISO(data.endTime, { zone: data.timezone }).toUTC().toISO();

  const result = await query(
    `INSERT INTO shifts (schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.scheduleId, data.locationId, startUtc, endUtc, data.requiredSkillId || null, data.headcountNeeded, data.notes || null]
  );

  return result.rows[0];
}

export async function updateShift(shiftId: string, data: {
  startTime?: string;
  endTime?: string;
  requiredSkillId?: string | null;
  headcountNeeded?: number;
  notes?: string;
  timezone: string;
}) {
  // Check edit cutoff
  const shift = await getShiftById(shiftId);

  if (shift.schedule_status === 'published') {
    const now = DateTime.now();
    const shiftStart = DateTime.fromJSDate(new Date(shift.start_time));
    const cutoffHours = shift.edit_cutoff_hours;
    const hoursUntilShift = shiftStart.diff(now, 'hours').hours;

    if (hoursUntilShift < cutoffHours) {
      throw new AppError(400, `Cannot edit: shift starts in ${Math.round(hoursUntilShift)} hours (cutoff is ${cutoffHours} hours)`);
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.startTime !== undefined) {
    const startUtc = DateTime.fromISO(data.startTime, { zone: data.timezone }).toUTC().toISO();
    fields.push(`start_time = $${paramIndex++}`);
    values.push(startUtc);
  }
  if (data.endTime !== undefined) {
    const endUtc = DateTime.fromISO(data.endTime, { zone: data.timezone }).toUTC().toISO();
    fields.push(`end_time = $${paramIndex++}`);
    values.push(endUtc);
  }
  if (data.requiredSkillId !== undefined) {
    fields.push(`required_skill_id = $${paramIndex++}`);
    values.push(data.requiredSkillId);
  }
  if (data.headcountNeeded !== undefined) {
    fields.push(`headcount_needed = $${paramIndex++}`);
    values.push(data.headcountNeeded);
  }
  if (data.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(data.notes);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(shiftId);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE shifts SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Shift not found');
    }

    // Auto-cancel pending swap requests on this shift's assignments
    const isMaterial = data.startTime !== undefined || data.endTime !== undefined ||
      data.requiredSkillId !== undefined;

    if (isMaterial) {
      await client.query(
        `UPDATE swap_requests
         SET status = 'cancelled', updated_at = NOW(),
             manager_reason = 'Shift was modified by manager'
         WHERE status IN ('pending_peer', 'pending_manager')
         AND requester_assignment_id IN (
           SELECT id FROM shift_assignments WHERE shift_id = $1 AND status = 'assigned'
         )`,
        [shiftId]
      );
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteShift(shiftId: string) {
  const shift = await getShiftById(shiftId);

  if (shift.schedule_status === 'published') {
    const now = DateTime.now();
    const shiftStart = DateTime.fromJSDate(new Date(shift.start_time));
    const hoursUntilShift = shiftStart.diff(now, 'hours').hours;

    if (hoursUntilShift < shift.edit_cutoff_hours) {
      throw new AppError(400, 'Cannot delete: shift is within the edit cutoff window');
    }
  }

  await query('DELETE FROM shifts WHERE id = $1', [shiftId]);
}

export async function getUserSchedule(userId: string, startDate: string, endDate: string, requesterRole: string) {
  // Staff can only see published schedules; managers/admins see all
  const statusFilter = requesterRole === 'staff'
    ? "AND sc.status = 'published'"
    : '';

  const result = await query(
    `SELECT s.*, l.name as location_name, l.timezone, sk.name as skill_name,
            sc.status as schedule_status
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     JOIN schedules sc ON s.schedule_id = sc.id
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND s.start_time >= $2 AND s.start_time < $3
     ${statusFilter}
     ORDER BY s.start_time`,
    [userId, startDate, endDate]
  );

  return result.rows;
}

export async function getLocationScheduleView(locationId: string, weekStart: string) {
  const result = await query(
    `SELECT s.*, sk.name as skill_name, l.timezone,
            COALESCE(
              json_agg(
                jsonb_build_object(
                  'id', sa.id,
                  'userId', sa.user_id,
                  'firstName', u.first_name,
                  'lastName', u.last_name,
                  'status', sa.status
                )
              ) FILTER (WHERE sa.id IS NOT NULL AND sa.status = 'assigned'), '[]'
            ) as assignments
     FROM shifts s
     JOIN schedules sc ON s.schedule_id = sc.id
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
     LEFT JOIN users u ON sa.user_id = u.id
     JOIN locations l ON s.location_id = l.id
     WHERE s.location_id = $1
     AND sc.week_start = $2
     GROUP BY s.id, sk.name, l.timezone
     ORDER BY s.start_time`,
    [locationId, weekStart]
  );

  return result.rows;
}
