import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { query, getClient } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
}

export async function register(data: {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if email already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing.rows.length > 0) {
      throw new AppError(409, 'Email already registered');
    }

    // Create organization
    const orgResult = await client.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [data.organizationName]
    );
    const organizationId = orgResult.rows[0].id;

    // Create admin user
    const passwordHash = await bcrypt.hash(data.password, config.bcryptSaltRounds);
    const userResult = await client.query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')
       RETURNING id, organization_id, email, first_name, last_name, role`,
      [organizationId, data.email, passwordHash, data.firstName, data.lastName]
    );

    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = generateToken({
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function login(email: string, password: string) {
  const result = await query(
    `SELECT id, organization_id, email, password_hash, first_name, last_name, role, is_active, profile_photo_url
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError(401, 'Invalid email or password');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError(401, 'Account has been deactivated');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    organizationId: user.organization_id,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      profilePhotoUrl: user.profile_photo_url,
    },
  };
}

export async function acceptInvite(data: {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Find and validate invitation
    const invResult = await client.query(
      `SELECT * FROM invitations
       WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
      [data.token]
    );

    if (invResult.rows.length === 0) {
      throw new AppError(400, 'Invalid, expired, or already accepted invitation');
    }

    const invitation = invResult.rows[0];

    // Check if email already registered
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [invitation.email]);
    if (existing.rows.length > 0) {
      throw new AppError(409, 'Email already registered');
    }

    // Create user
    const passwordHash = await bcrypt.hash(data.password, config.bcryptSaltRounds);
    const userResult = await client.query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, organization_id, email, first_name, last_name, role`,
      [invitation.organization_id, invitation.email, passwordHash, data.firstName, data.lastName, invitation.role]
    );
    const user = userResult.rows[0];

    // Assign location certifications
    const locationIds: string[] = invitation.location_ids || [];
    for (const locationId of locationIds) {
      await client.query(
        'INSERT INTO user_locations (user_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, locationId]
      );
    }

    // Assign skills
    const skillIds: string[] = invitation.skill_ids || [];
    for (const skillId of skillIds) {
      await client.query(
        'INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, skillId]
      );
    }

    // Mark invitation as accepted
    await client.query(
      'UPDATE invitations SET accepted_at = NOW() WHERE id = $1',
      [invitation.id]
    );

    await client.query('COMMIT');

    const token = generateToken({
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
