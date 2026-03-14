import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { buildContext, validateAssignment } from '../engine/validator';
import { Override, ValidationResult } from '../engine/types';

/**
 * Assign a staff member to a shift.
 * Runs the constraint engine first. Returns validation result if constraints fail.
 */
export async function assignStaffToShift(
  shiftId: string,
  userId: string,
  assignedBy: string,
  overrides?: Override[]
): Promise<{ assignment?: any; validation: ValidationResult }> {
  // Build context and validate
  const context = await buildContext(userId, shiftId);
  const validation = await validateAssignment(context, overrides);

  if (!validation.valid) {
    return { validation };
  }

  // Attempt to insert with conflict check (optimistic locking)
  const result = await query(
    `INSERT INTO shift_assignments (shift_id, user_id, assigned_by)
     SELECT $1, $2, $3
     WHERE NOT EXISTS (
       SELECT 1 FROM shift_assignments
       WHERE shift_id = $1 AND user_id = $2 AND status = 'assigned'
     )
     RETURNING *`,
    [shiftId, userId, assignedBy]
  );

  if (result.rows.length === 0) {
    throw new AppError(409, 'Staff member is already assigned to this shift');
  }

  return { assignment: result.rows[0], validation };
}

/**
 * Preview assignment constraints without actually assigning (dry-run).
 */
export async function previewAssignment(
  shiftId: string,
  userId: string
): Promise<ValidationResult> {
  const context = await buildContext(userId, shiftId);
  return validateAssignment(context);
}

/**
 * Remove a staff member from a shift.
 */
export async function unassignStaff(shiftId: string, userId: string) {
  const result = await query(
    `UPDATE shift_assignments
     SET status = 'removed', removed_at = NOW()
     WHERE shift_id = $1 AND user_id = $2 AND status = 'assigned'
     RETURNING *`,
    [shiftId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Assignment not found');
  }

  return result.rows[0];
}

/**
 * List assignments for a shift.
 */
export async function getAssignmentsByShift(shiftId: string) {
  const result = await query(
    `SELECT sa.*, u.first_name, u.last_name, u.email,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', sk.id, 'name', sk.name))
              FILTER (WHERE sk.id IS NOT NULL), '[]'
            ) as skills
     FROM shift_assignments sa
     JOIN users u ON sa.user_id = u.id
     LEFT JOIN user_skills us ON u.id = us.user_id
     LEFT JOIN skills sk ON us.skill_id = sk.id
     WHERE sa.shift_id = $1 AND sa.status = 'assigned'
     GROUP BY sa.id, u.first_name, u.last_name, u.email
     ORDER BY u.last_name, u.first_name`,
    [shiftId]
  );
  return result.rows;
}
