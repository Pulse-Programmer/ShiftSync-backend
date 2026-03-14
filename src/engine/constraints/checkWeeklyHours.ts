import { DateTime } from 'luxon';
import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

const WARNING_THRESHOLD = 35;
const OVERTIME_THRESHOLD = 40;

export async function checkWeeklyHours(ctx: AssignmentContext): Promise<ConstraintResult> {
  const timezone = ctx.location.timezone;
  const shiftStart = DateTime.fromJSDate(ctx.shift.startTime, { zone: 'utc' }).setZone(timezone);

  // Calculate week boundaries (Sunday to Saturday in location timezone)
  const weekStart = shiftStart.startOf('week').minus({ days: 1 }); // Luxon weeks start Monday, adjust to Sunday
  const weekEnd = weekStart.plus({ days: 7 });

  const proposedHours = (ctx.shift.endTime.getTime() - ctx.shift.startTime.getTime()) / (1000 * 60 * 60);

  // Get total hours for this user in this work week (across ALL locations)
  const result = await query(
    `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND (s.start_time AT TIME ZONE $4)::date >= $2
     AND (s.start_time AT TIME ZONE $4)::date < $3
     AND sa.shift_id != $5
     ${ctx.excludeAssignmentId ? 'AND sa.id != $6' : ''}`,
    ctx.excludeAssignmentId
      ? [ctx.userId, weekStart.toISODate(), weekEnd.toISODate(), timezone, ctx.shiftId, ctx.excludeAssignmentId]
      : [ctx.userId, weekStart.toISODate(), weekEnd.toISODate(), timezone, ctx.shiftId]
  );

  const currentHours = parseFloat(result.rows[0].total_hours);
  const projectedTotal = currentHours + proposedHours;
  const overtimeHours = Math.max(0, projectedTotal - OVERTIME_THRESHOLD);

  if (projectedTotal >= OVERTIME_THRESHOLD) {
    return {
      constraint: 'WEEKLY_HOURS',
      passed: false,
      severity: 'error',
      message: `Would bring weekly total to ${projectedTotal.toFixed(1)} hours (${overtimeHours.toFixed(1)} hours overtime)`,
      details: {
        currentHours: Math.round(currentHours * 10) / 10,
        shiftHours: Math.round(proposedHours * 10) / 10,
        projectedTotal: Math.round(projectedTotal * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        threshold: OVERTIME_THRESHOLD,
        weekStart: weekStart.toISODate(),
        weekEnd: weekEnd.toISODate(),
      },
    };
  }

  if (projectedTotal >= WARNING_THRESHOLD) {
    return {
      constraint: 'WEEKLY_HOURS',
      passed: false,
      severity: 'warning',
      message: `Would bring weekly total to ${projectedTotal.toFixed(1)} hours (approaching ${OVERTIME_THRESHOLD}-hour overtime threshold)`,
      details: {
        currentHours: Math.round(currentHours * 10) / 10,
        shiftHours: Math.round(proposedHours * 10) / 10,
        projectedTotal: Math.round(projectedTotal * 10) / 10,
        threshold: WARNING_THRESHOLD,
        weekStart: weekStart.toISODate(),
        weekEnd: weekEnd.toISODate(),
      },
    };
  }

  return {
    constraint: 'WEEKLY_HOURS',
    passed: true,
    severity: 'warning',
    message: `${projectedTotal.toFixed(1)} weekly hours`,
    details: {
      currentHours: Math.round(currentHours * 10) / 10,
      projectedTotal: Math.round(projectedTotal * 10) / 10,
    },
  };
}
