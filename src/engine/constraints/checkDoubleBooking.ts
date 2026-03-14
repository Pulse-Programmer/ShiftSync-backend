import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

export async function checkDoubleBooking(ctx: AssignmentContext): Promise<ConstraintResult> {
  const params: any[] = [
    ctx.userId,
    ctx.shift.startTime,
    ctx.shift.endTime,
    ctx.shiftId,
  ];

  let sql = `
    SELECT s.id, s.start_time, s.end_time, l.name as location_name
    FROM shift_assignments sa
    JOIN shifts s ON sa.shift_id = s.id
    JOIN locations l ON s.location_id = l.id
    WHERE sa.user_id = $1 AND sa.status = 'assigned'
    AND s.start_time < $3 AND s.end_time > $2
    AND sa.shift_id != $4
  `;

  if (ctx.excludeAssignmentId) {
    sql += ' AND sa.id != $5';
    params.push(ctx.excludeAssignmentId);
  }

  const result = await query(sql, params);

  if (result.rows.length > 0) {
    const conflict = result.rows[0];
    return {
      constraint: 'DOUBLE_BOOKING',
      passed: false,
      severity: 'error',
      message: `Already assigned to a shift at ${conflict.location_name} from ${new Date(conflict.start_time).toLocaleTimeString()} to ${new Date(conflict.end_time).toLocaleTimeString()} which overlaps with this shift`,
      details: {
        conflictingShiftId: conflict.id,
        conflictingLocation: conflict.location_name,
        conflictingStart: conflict.start_time,
        conflictingEnd: conflict.end_time,
      },
    };
  }

  return {
    constraint: 'DOUBLE_BOOKING',
    passed: true,
    severity: 'error',
    message: 'No scheduling conflicts',
    details: {},
  };
}
