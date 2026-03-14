import { DateTime } from 'luxon';
import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export async function getAvailabilityByUser(userId: string, locationId?: string) {
  let sql = 'SELECT * FROM availability WHERE user_id = $1';
  const params: any[] = [userId];

  if (locationId) {
    sql += ' AND location_id = $2';
    params.push(locationId);
  }

  sql += ' ORDER BY type, day_of_week, specific_date, start_time';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Resolves effective availability for a user at a location on a specific date.
 * Exceptions fully replace recurring availability for that date.
 * Returns time windows where the user IS available.
 */
export async function getEffectiveAvailability(
  userId: string,
  locationId: string,
  date: string // YYYY-MM-DD
) {
  // Get location timezone
  const locResult = await query('SELECT timezone FROM locations WHERE id = $1', [locationId]);
  if (locResult.rows.length === 0) {
    throw new AppError(404, 'Location not found');
  }
  const timezone = locResult.rows[0].timezone;

  // Check for exceptions on this specific date
  const exceptions = await query(
    `SELECT start_time, end_time, is_available
     FROM availability
     WHERE user_id = $1 AND location_id = $2
     AND type = 'exception' AND specific_date = $3
     ORDER BY start_time`,
    [userId, locationId, date]
  );

  // If exceptions exist, they fully replace recurring rules for this date
  if (exceptions.rows.length > 0) {
    return {
      date,
      timezone,
      source: 'exception' as const,
      windows: exceptions.rows
        .filter((r: any) => r.is_available)
        .map((r: any) => ({
          start: r.start_time,
          end: r.end_time,
        })),
    };
  }

  // Fall back to recurring availability
  const dt = DateTime.fromISO(date, { zone: timezone });
  const dayOfWeek = dt.weekday % 7; // Luxon: 1=Mon..7=Sun → convert to 0=Sun..6=Sat

  const recurring = await query(
    `SELECT start_time, end_time, is_available
     FROM availability
     WHERE user_id = $1 AND location_id = $2
     AND type = 'recurring' AND day_of_week = $3
     ORDER BY start_time`,
    [userId, locationId, dayOfWeek]
  );

  return {
    date,
    timezone,
    source: 'recurring' as const,
    windows: recurring.rows
      .filter((r: any) => r.is_available)
      .map((r: any) => ({
        start: r.start_time,
        end: r.end_time,
      })),
  };
}

export async function createAvailability(data: {
  userId: string;
  locationId: string;
  type: 'recurring' | 'exception';
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}) {
  // Verify user has access to this location
  const certCheck = await query(
    `SELECT 1 FROM user_locations
     WHERE user_id = $1 AND location_id = $2 AND decertified_at IS NULL`,
    [data.userId, data.locationId]
  );
  if (certCheck.rows.length === 0) {
    throw new AppError(400, 'User is not certified at this location');
  }

  const result = await query(
    `INSERT INTO availability (user_id, location_id, type, day_of_week, specific_date, start_time, end_time, is_available)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.userId,
      data.locationId,
      data.type,
      data.type === 'recurring' ? data.dayOfWeek : null,
      data.type === 'exception' ? data.specificDate : null,
      data.startTime,
      data.endTime,
      data.isAvailable ?? true,
    ]
  );

  return result.rows[0];
}

export async function updateAvailability(
  id: string,
  userId: string,
  data: {
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
  }
) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.startTime !== undefined) {
    fields.push(`start_time = $${paramIndex++}`);
    values.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    fields.push(`end_time = $${paramIndex++}`);
    values.push(data.endTime);
  }
  if (data.isAvailable !== undefined) {
    fields.push(`is_available = $${paramIndex++}`);
    values.push(data.isAvailable);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  values.push(id, userId);

  const result = await query(
    `UPDATE availability SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Availability entry not found');
  }

  return result.rows[0];
}

export async function deleteAvailability(id: string, userId: string) {
  const result = await query(
    'DELETE FROM availability WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Availability entry not found');
  }
}
