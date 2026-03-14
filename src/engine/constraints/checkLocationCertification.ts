import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

export async function checkLocationCertification(ctx: AssignmentContext): Promise<ConstraintResult> {
  const result = await query(
    `SELECT ul.decertified_at, l.name as location_name, u.first_name, u.last_name
     FROM locations l, users u
     LEFT JOIN user_locations ul ON ul.user_id = u.id AND ul.location_id = $2
     WHERE l.id = $2 AND u.id = $1`,
    [ctx.userId, ctx.shift.locationId]
  );

  if (result.rows.length === 0) {
    return {
      constraint: 'LOCATION_CERTIFICATION',
      passed: false,
      severity: 'error',
      message: 'User or location not found',
      details: {},
    };
  }

  const { decertified_at, location_name, first_name, last_name } = result.rows[0];

  // Check if user_locations row exists (decertified_at will be null if active, undefined if no row)
  const hasRow = result.rows[0].hasOwnProperty('decertified_at') &&
    await query(
      'SELECT 1 FROM user_locations WHERE user_id = $1 AND location_id = $2',
      [ctx.userId, ctx.shift.locationId]
    ).then(r => r.rows.length > 0);

  if (!hasRow) {
    return {
      constraint: 'LOCATION_CERTIFICATION',
      passed: false,
      severity: 'error',
      message: `${first_name} ${last_name} is not certified to work at ${location_name}`,
      details: {
        locationName: location_name,
        userName: `${first_name} ${last_name}`,
      },
    };
  }

  if (decertified_at) {
    return {
      constraint: 'LOCATION_CERTIFICATION',
      passed: false,
      severity: 'error',
      message: `${first_name} ${last_name}'s certification at ${location_name} was revoked on ${new Date(decertified_at).toLocaleDateString()}`,
      details: {
        locationName: location_name,
        decertifiedAt: decertified_at,
      },
    };
  }

  return {
    constraint: 'LOCATION_CERTIFICATION',
    passed: true,
    severity: 'error',
    message: `Certified at ${location_name}`,
    details: { location: location_name },
  };
}
