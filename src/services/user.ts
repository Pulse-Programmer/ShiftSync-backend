import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { uploadProfilePhoto, deleteProfilePhoto } from '../utils/cloudinary';

export async function listUsers(
  organizationId: string,
  requesterRole: string,
  requesterLocationIds: string[],
  pagination?: { limit: number; offset: number }
) {
  let whereSql = 'WHERE u.organization_id = $1';
  const params: any[] = [organizationId];

  // Managers only see staff at their locations
  if (requesterRole === 'manager') {
    whereSql += `
      AND (
        u.role = 'staff'
        AND EXISTS (
          SELECT 1 FROM user_locations ul2
          WHERE ul2.user_id = u.id
          AND ul2.decertified_at IS NULL
          AND ul2.location_id = ANY($2)
        )
      )
    `;
    params.push(requesterLocationIds);
  }

  // Count total matching rows
  const countResult = await query(
    `SELECT COUNT(DISTINCT u.id) as total FROM users u ${whereSql}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  let sql = `
    SELECT u.id, u.email, u.first_name, u.last_name, u.role,
           u.desired_weekly_hours, u.phone, u.is_active, u.profile_photo_url, u.created_at,
           COALESCE(
             json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name))
             FILTER (WHERE s.id IS NOT NULL), '[]'
           ) as skills,
           COALESCE(
             json_agg(DISTINCT jsonb_build_object(
               'id', l.id, 'name', l.name, 'timezone', l.timezone,
               'certified_at', ul.certified_at, 'decertified_at', ul.decertified_at
             )) FILTER (WHERE l.id IS NOT NULL AND ul.decertified_at IS NULL), '[]'
           ) as locations
    FROM users u
    LEFT JOIN user_skills us ON u.id = us.user_id
    LEFT JOIN skills s ON us.skill_id = s.id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    LEFT JOIN locations l ON ul.location_id = l.id
    ${whereSql}
    GROUP BY u.id ORDER BY u.last_name, u.first_name
  `;

  if (pagination) {
    const paramIdx = params.length + 1;
    sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(pagination.limit, pagination.offset);
  }

  const result = await query(sql, params);
  return { data: result.rows, total };
}

export async function getUserById(userId: string, organizationId: string) {
  const result = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
            u.desired_weekly_hours, u.phone, u.is_active, u.created_at,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name))
              FILTER (WHERE s.id IS NOT NULL), '[]'
            ) as skills,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object(
                'id', l.id, 'name', l.name, 'timezone', l.timezone,
                'certified_at', ul.certified_at, 'decertified_at', ul.decertified_at
              )) FILTER (WHERE l.id IS NOT NULL), '[]'
            ) as locations
     FROM users u
     LEFT JOIN user_skills us ON u.id = us.user_id
     LEFT JOIN skills s ON us.skill_id = s.id
     LEFT JOIN user_locations ul ON u.id = ul.user_id
     LEFT JOIN locations l ON ul.location_id = l.id
     WHERE u.id = $1 AND u.organization_id = $2
     GROUP BY u.id`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  return result.rows[0];
}

export async function updateUser(
  userId: string,
  organizationId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    desiredWeeklyHours?: number;
  }
) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.firstName !== undefined) {
    fields.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    fields.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.desiredWeeklyHours !== undefined) {
    fields.push(`desired_weekly_hours = $${paramIndex++}`);
    values.push(data.desiredWeeklyHours);
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId, organizationId);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}
     RETURNING id, email, first_name, last_name, role, desired_weekly_hours, phone, is_active`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  return result.rows[0];
}

export async function deactivateUser(userId: string, organizationId: string) {
  const result = await query(
    `UPDATE users SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }
}

export async function reactivateUser(userId: string, organizationId: string) {
  const result = await query(
    `UPDATE users SET is_active = true, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }
}

export async function assignSkill(userId: string, skillId: string, organizationId: string) {
  // Verify user and skill belong to the same org
  const userCheck = await query(
    'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const skillCheck = await query(
    'SELECT id FROM skills WHERE id = $1 AND organization_id = $2',
    [skillId, organizationId]
  );
  if (skillCheck.rows.length === 0) {
    throw new AppError(404, 'Skill not found');
  }

  await query(
    'INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, skillId]
  );
}

export async function removeSkill(userId: string, skillId: string, organizationId: string) {
  const userCheck = await query(
    'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const result = await query(
    'DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2 RETURNING user_id',
    [userId, skillId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Skill assignment not found');
  }
}

export async function certifyLocation(userId: string, locationId: string, organizationId: string) {
  const userCheck = await query(
    'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const locationCheck = await query(
    'SELECT id FROM locations WHERE id = $1 AND organization_id = $2',
    [locationId, organizationId]
  );
  if (locationCheck.rows.length === 0) {
    throw new AppError(404, 'Location not found');
  }

  // Upsert: if previously decertified, re-certify
  await query(
    `INSERT INTO user_locations (user_id, location_id, certified_at, decertified_at)
     VALUES ($1, $2, NOW(), NULL)
     ON CONFLICT (user_id, location_id)
     DO UPDATE SET decertified_at = NULL, certified_at = NOW()`,
    [userId, locationId]
  );
}

export async function decertifyLocation(userId: string, locationId: string, organizationId: string) {
  const userCheck = await query(
    'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const result = await query(
    `UPDATE user_locations SET decertified_at = NOW()
     WHERE user_id = $1 AND location_id = $2 AND decertified_at IS NULL
     RETURNING user_id`,
    [userId, locationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Active certification not found');
  }
}

export async function updateProfilePhoto(userId: string, organizationId: string, fileBuffer: Buffer) {
  const userCheck = await query(
    'SELECT id FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const url = await uploadProfilePhoto(fileBuffer, userId);

  await query(
    'UPDATE users SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2',
    [url, userId]
  );

  return { profilePhotoUrl: url };
}

export async function removeProfilePhoto(userId: string, organizationId: string) {
  const userCheck = await query(
    'SELECT id, profile_photo_url FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  if (userCheck.rows[0].profile_photo_url) {
    await deleteProfilePhoto(userId);
  }

  await query(
    'UPDATE users SET profile_photo_url = NULL, updated_at = NOW() WHERE id = $1',
    [userId]
  );
}
