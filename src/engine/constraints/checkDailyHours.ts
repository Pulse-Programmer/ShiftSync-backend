import { DateTime } from 'luxon';
import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

const WARNING_THRESHOLD = 8;
const HARD_BLOCK_THRESHOLD = 12;

export async function checkDailyHours(ctx: AssignmentContext): Promise<ConstraintResult> {
  const timezone = ctx.location.timezone;
  const shiftStart = DateTime.fromJSDate(ctx.shift.startTime, { zone: 'utc' }).setZone(timezone);
  const shiftDate = shiftStart.toISODate()!;

  // Calculate proposed shift duration in hours
  const proposedHours = (ctx.shift.endTime.getTime() - ctx.shift.startTime.getTime()) / (1000 * 60 * 60);

  // Get existing hours for this user on this calendar day (in location timezone)
  const result = await query(
    `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND (s.start_time AT TIME ZONE l.timezone)::date = $2
     AND sa.shift_id != $3
     ${ctx.excludeAssignmentId ? 'AND sa.id != $4' : ''}`,
    ctx.excludeAssignmentId
      ? [ctx.userId, shiftDate, ctx.shiftId, ctx.excludeAssignmentId]
      : [ctx.userId, shiftDate, ctx.shiftId]
  );

  const currentHours = parseFloat(result.rows[0].total_hours);
  const projectedTotal = currentHours + proposedHours;

  if (projectedTotal > HARD_BLOCK_THRESHOLD) {
    return {
      constraint: 'DAILY_HOURS',
      passed: false,
      severity: 'error',
      message: `Would bring total to ${projectedTotal.toFixed(1)} hours on ${shiftDate} (exceeds ${HARD_BLOCK_THRESHOLD}-hour maximum)`,
      details: {
        currentHours: Math.round(currentHours * 10) / 10,
        shiftHours: Math.round(proposedHours * 10) / 10,
        projectedTotal: Math.round(projectedTotal * 10) / 10,
        threshold: HARD_BLOCK_THRESHOLD,
        date: shiftDate,
      },
    };
  }

  if (projectedTotal > WARNING_THRESHOLD) {
    return {
      constraint: 'DAILY_HOURS',
      passed: false,
      severity: 'warning',
      message: `Would bring total to ${projectedTotal.toFixed(1)} hours on ${shiftDate} (exceeds ${WARNING_THRESHOLD}-hour guideline)`,
      details: {
        currentHours: Math.round(currentHours * 10) / 10,
        shiftHours: Math.round(proposedHours * 10) / 10,
        projectedTotal: Math.round(projectedTotal * 10) / 10,
        threshold: WARNING_THRESHOLD,
        date: shiftDate,
      },
    };
  }

  return {
    constraint: 'DAILY_HOURS',
    passed: true,
    severity: 'warning',
    message: `${projectedTotal.toFixed(1)} hours on ${shiftDate}`,
    details: {
      currentHours: Math.round(currentHours * 10) / 10,
      projectedTotal: Math.round(projectedTotal * 10) / 10,
    },
  };
}
