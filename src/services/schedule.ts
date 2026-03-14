import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export async function getSchedule(locationId: string, weekStart: string) {
  const result = await query(
    `SELECT s.*, l.name as location_name, l.timezone,
            u.first_name as published_by_first, u.last_name as published_by_last
     FROM schedules s
     JOIN locations l ON s.location_id = l.id
     LEFT JOIN users u ON s.published_by = u.id
     WHERE s.location_id = $1 AND s.week_start = $2`,
    [locationId, weekStart]
  );

  return result.rows[0] || null;
}

export async function createSchedule(locationId: string, weekStart: string, organizationId: string) {
  // Verify location belongs to org
  const locCheck = await query(
    'SELECT id FROM locations WHERE id = $1 AND organization_id = $2',
    [locationId, organizationId]
  );
  if (locCheck.rows.length === 0) {
    throw new AppError(404, 'Location not found');
  }

  try {
    const result = await query(
      `INSERT INTO schedules (location_id, week_start)
       VALUES ($1, $2)
       RETURNING *`,
      [locationId, weekStart]
    );
    return result.rows[0];
  } catch (err: any) {
    if (err.code === '23505') {
      throw new AppError(409, 'A schedule already exists for this location and week');
    }
    throw err;
  }
}

export async function publishSchedule(scheduleId: string, publishedBy: string) {
  const result = await query(
    `UPDATE schedules
     SET status = 'published', published_at = NOW(), published_by = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'draft'
     RETURNING *`,
    [scheduleId, publishedBy]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Schedule not found or already published');
  }

  return result.rows[0];
}

export async function unpublishSchedule(scheduleId: string, locationId: string) {
  // Check if any shifts are past the edit cutoff
  const cutoffCheck = await query(
    `SELECT s.id, s.start_time
     FROM shifts s
     JOIN schedules sc ON s.schedule_id = sc.id
     JOIN locations l ON sc.location_id = l.id
     WHERE s.schedule_id = $1
     AND s.start_time <= NOW() + (l.edit_cutoff_hours || ' hours')::interval`,
    [scheduleId]
  );

  if (cutoffCheck.rows.length > 0) {
    throw new AppError(400, 'Cannot unpublish: some shifts are within the edit cutoff window');
  }

  const result = await query(
    `UPDATE schedules
     SET status = 'draft', published_at = NULL, published_by = NULL, updated_at = NOW()
     WHERE id = $1 AND status = 'published'
     RETURNING *`,
    [scheduleId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Schedule not found or not published');
  }

  return result.rows[0];
}

export async function getSchedulesByLocation(locationId: string, limit: number = 8) {
  const result = await query(
    `SELECT s.*, l.name as location_name
     FROM schedules s
     JOIN locations l ON s.location_id = l.id
     WHERE s.location_id = $1
     ORDER BY s.week_start DESC
     LIMIT $2`,
    [locationId, limit]
  );
  return result.rows;
}
