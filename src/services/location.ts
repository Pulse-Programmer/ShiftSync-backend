import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export async function listLocations(organizationId: string, requesterRole: string, requesterLocationIds: string[]) {
  let sql = 'SELECT * FROM locations WHERE organization_id = $1';
  const params: any[] = [organizationId];

  // Managers only see their assigned locations
  if (requesterRole === 'manager') {
    sql += ' AND id = ANY($2)';
    params.push(requesterLocationIds);
  }

  sql += ' ORDER BY name';

  const result = await query(sql, params);
  return result.rows;
}

export async function getLocationById(id: string, organizationId: string) {
  const result = await query(
    `SELECT l.*,
       (SELECT COUNT(*) FROM user_locations ul
        WHERE ul.location_id = l.id AND ul.decertified_at IS NULL) as certified_staff_count
     FROM locations l
     WHERE l.id = $1 AND l.organization_id = $2`,
    [id, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Location not found');
  }

  return result.rows[0];
}

export async function createLocation(organizationId: string, data: {
  name: string;
  address?: string;
  timezone: string;
  editCutoffHours?: number;
}) {
  const result = await query(
    `INSERT INTO locations (organization_id, name, address, timezone, edit_cutoff_hours)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [organizationId, data.name, data.address || null, data.timezone, data.editCutoffHours || 48]
  );

  return result.rows[0];
}

export async function updateLocation(id: string, organizationId: string, data: {
  name?: string;
  address?: string;
  timezone?: string;
  editCutoffHours?: number;
}) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.address !== undefined) {
    fields.push(`address = $${paramIndex++}`);
    values.push(data.address);
  }
  if (data.timezone !== undefined) {
    fields.push(`timezone = $${paramIndex++}`);
    values.push(data.timezone);
  }
  if (data.editCutoffHours !== undefined) {
    fields.push(`edit_cutoff_hours = $${paramIndex++}`);
    values.push(data.editCutoffHours);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(id, organizationId);

  const result = await query(
    `UPDATE locations SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Location not found');
  }

  return result.rows[0];
}

export async function getLocationStaff(locationId: string, organizationId: string) {
  // Verify location belongs to org
  const locCheck = await query(
    'SELECT id FROM locations WHERE id = $1 AND organization_id = $2',
    [locationId, organizationId]
  );
  if (locCheck.rows.length === 0) {
    throw new AppError(404, 'Location not found');
  }

  const result = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.desired_weekly_hours, u.is_active,
            ul.certified_at,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name))
              FILTER (WHERE s.id IS NOT NULL), '[]'
            ) as skills
     FROM users u
     JOIN user_locations ul ON u.id = ul.user_id
     LEFT JOIN user_skills us ON u.id = us.user_id
     LEFT JOIN skills s ON us.skill_id = s.id
     WHERE ul.location_id = $1
     AND ul.decertified_at IS NULL
     AND u.role = 'staff'
     AND u.is_active = true
     GROUP BY u.id, u.first_name, u.last_name, u.email, u.desired_weekly_hours, u.is_active, ul.certified_at
     ORDER BY u.last_name, u.first_name`,
    [locationId]
  );

  return result.rows;
}

export async function getOnDutyStaff(locationId: string) {
  const result = await query(
    `SELECT u.id, u.first_name, u.last_name, s.start_time, s.end_time, sk.name as skill
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN users u ON sa.user_id = u.id
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     WHERE s.location_id = $1
     AND sa.status = 'assigned'
     AND s.start_time <= NOW()
     AND s.end_time >= NOW()
     ORDER BY u.last_name, u.first_name`,
    [locationId]
  );
  return result.rows;
}
