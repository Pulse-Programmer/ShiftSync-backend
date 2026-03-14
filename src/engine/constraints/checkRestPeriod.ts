import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

const MIN_REST_HOURS = 10;

export async function checkRestPeriod(ctx: AssignmentContext): Promise<ConstraintResult> {
  const excludeClause = ctx.excludeAssignmentId ? 'AND sa.id != $4' : '';
  const baseParams = [ctx.userId, ctx.shift.startTime, ctx.shift.endTime];
  if (ctx.excludeAssignmentId) baseParams.push(ctx.excludeAssignmentId);

  // Find the shift ending closest BEFORE the proposed start
  const beforeResult = await query(
    `SELECT s.end_time, s.id, l.name as location_name
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND s.end_time <= $2
     AND sa.shift_id != $3
     ${ctx.excludeAssignmentId ? 'AND sa.id != $4' : ''}
     ORDER BY s.end_time DESC LIMIT 1`,
    ctx.excludeAssignmentId
      ? [ctx.userId, ctx.shift.startTime, ctx.shiftId, ctx.excludeAssignmentId]
      : [ctx.userId, ctx.shift.startTime, ctx.shiftId]
  );

  // Find the shift starting closest AFTER the proposed end
  const afterResult = await query(
    `SELECT s.start_time, s.id, l.name as location_name
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND s.start_time >= $2
     AND sa.shift_id != $3
     ${ctx.excludeAssignmentId ? 'AND sa.id != $4' : ''}
     ORDER BY s.start_time ASC LIMIT 1`,
    ctx.excludeAssignmentId
      ? [ctx.userId, ctx.shift.endTime, ctx.shiftId, ctx.excludeAssignmentId]
      : [ctx.userId, ctx.shift.endTime, ctx.shiftId]
  );

  // Check gap before
  if (beforeResult.rows.length > 0) {
    const prevEnd = new Date(beforeResult.rows[0].end_time);
    const gapHours = (ctx.shift.startTime.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);

    if (gapHours < MIN_REST_HOURS) {
      return {
        constraint: 'REST_PERIOD',
        passed: false,
        severity: 'error',
        message: `Only ${gapHours.toFixed(1)} hours between end of shift at ${beforeResult.rows[0].location_name} and start of this shift (minimum ${MIN_REST_HOURS} hours required)`,
        details: {
          gapHours: Math.round(gapHours * 10) / 10,
          requiredHours: MIN_REST_HOURS,
          previousShiftId: beforeResult.rows[0].id,
          previousShiftEnd: prevEnd,
        },
      };
    }
  }

  // Check gap after
  if (afterResult.rows.length > 0) {
    const nextStart = new Date(afterResult.rows[0].start_time);
    const gapHours = (nextStart.getTime() - ctx.shift.endTime.getTime()) / (1000 * 60 * 60);

    if (gapHours < MIN_REST_HOURS) {
      return {
        constraint: 'REST_PERIOD',
        passed: false,
        severity: 'error',
        message: `Only ${gapHours.toFixed(1)} hours between end of this shift and start of shift at ${afterResult.rows[0].location_name} (minimum ${MIN_REST_HOURS} hours required)`,
        details: {
          gapHours: Math.round(gapHours * 10) / 10,
          requiredHours: MIN_REST_HOURS,
          nextShiftId: afterResult.rows[0].id,
          nextShiftStart: nextStart,
        },
      };
    }
  }

  return {
    constraint: 'REST_PERIOD',
    passed: true,
    severity: 'error',
    message: 'Sufficient rest period',
    details: {},
  };
}
