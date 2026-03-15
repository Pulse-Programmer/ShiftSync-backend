import { query } from '../db/pool';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { generateInviteToken } from './auth';
import { sendInvitationEmail } from './email';

export async function createInvitation(data: {
  organizationId: string;
  email: string;
  role: 'manager' | 'staff';
  locationIds?: string[];
  skillIds?: string[];
  invitedBy: string;
  inviterRole: string;
  inviterLocationIds: string[];
}) {
  // Managers can only invite staff, and only to their own locations
  if (data.inviterRole === 'manager') {
    if (data.role !== 'staff') {
      throw new AppError(403, 'Managers can only invite staff members');
    }

    const requestedLocations = data.locationIds || [];
    const unauthorized = requestedLocations.filter(id => !data.inviterLocationIds.includes(id));
    if (unauthorized.length > 0) {
      throw new AppError(403, 'You can only invite staff to locations you manage');
    }
  }

  // Check if there's already a pending invitation for this email in this org
  const existing = await query(
    `SELECT id FROM invitations
     WHERE organization_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
    [data.organizationId, data.email]
  );
  if (existing.rows.length > 0) {
    throw new AppError(409, 'A pending invitation already exists for this email');
  }

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [data.email]
  );
  if (existingUser.rows.length > 0) {
    throw new AppError(409, 'A user with this email already exists');
  }

  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.invitationExpiryDays);

  const result = await query(
    `INSERT INTO invitations (organization_id, email, role, location_ids, skill_ids, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.organizationId,
      data.email,
      data.role,
      data.locationIds || [],
      data.skillIds || [],
      token,
      data.invitedBy,
      expiresAt,
    ]
  );

  const invitation = result.rows[0];

  await sendInvitationEmail(data.email, data.role, token, expiresAt);

  return invitation;
}

export async function listInvitations(
  organizationId: string,
  inviterRole: string,
  inviterId: string,
  pagination?: { limit: number; offset: number }
) {
  let whereSql = 'WHERE i.organization_id = $1';
  const whereParams: any[] = [organizationId];

  if (inviterRole === 'manager') {
    whereSql += ' AND i.invited_by = $2';
    whereParams.push(inviterId);
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM invitations i ${whereSql}`,
    whereParams
  );
  const total = parseInt(countResult.rows[0].total);

  const params = [...whereParams];
  let sql = `
    SELECT i.*, u.first_name as invited_by_name, u.last_name as invited_by_last_name
    FROM invitations i
    LEFT JOIN users u ON i.invited_by = u.id
    ${whereSql}
    ORDER BY i.created_at DESC
  `;

  if (pagination) {
    const paramIdx = params.length + 1;
    sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(pagination.limit, pagination.offset);
  }

  const result = await query(sql, params);
  return { data: result.rows, total };
}

export async function revokeInvitation(id: string, organizationId: string) {
  const result = await query(
    `DELETE FROM invitations
     WHERE id = $1 AND organization_id = $2 AND accepted_at IS NULL
     RETURNING id`,
    [id, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Invitation not found or already accepted');
  }
}

export async function resendInvitation(id: string, organizationId: string) {
  const newToken = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.invitationExpiryDays);

  const result = await query(
    `UPDATE invitations
     SET token = $1, expires_at = $2
     WHERE id = $3 AND organization_id = $4 AND accepted_at IS NULL
     RETURNING *`,
    [newToken, expiresAt, id, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Invitation not found or already accepted');
  }

  const invitation = result.rows[0];

  await sendInvitationEmail(invitation.email, invitation.role, newToken, expiresAt);

  return invitation;
}
