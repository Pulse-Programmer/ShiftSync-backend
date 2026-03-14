import { DateTime } from 'luxon';
import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

export async function checkConsecutiveDays(ctx: AssignmentContext): Promise<ConstraintResult> {
  const timezone = ctx.location.timezone;
  const shiftStart = DateTime.fromJSDate(ctx.shift.startTime, { zone: 'utc' }).setZone(timezone);
  const proposedDate = shiftStart.toISODate()!;

  // Get all distinct work dates in a 14-day window around the proposed date (across all locations)
  const result = await query(
    `SELECT DISTINCT (s.start_time AT TIME ZONE l.timezone)::date as work_date
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND (s.start_time AT TIME ZONE l.timezone)::date
         BETWEEN ($2::date - INTERVAL '7 days') AND ($2::date + INTERVAL '7 days')
     AND sa.shift_id != $3
     ${ctx.excludeAssignmentId ? 'AND sa.id != $4' : ''}
     ORDER BY work_date`,
    ctx.excludeAssignmentId
      ? [ctx.userId, proposedDate, ctx.shiftId, ctx.excludeAssignmentId]
      : [ctx.userId, proposedDate, ctx.shiftId]
  );

  // Build a set of work dates, including the proposed date
  const workDates = new Set<string>(
    result.rows.map((r: { work_date: Date }) => {
      // pg returns date objects for date type
      const d = new Date(r.work_date);
      return DateTime.fromJSDate(d).toISODate()!;
    })
  );
  workDates.add(proposedDate);

  // Count the longest consecutive streak that includes the proposed date
  let streak = 1;

  // Count backwards from proposed date
  let checkDate = DateTime.fromISO(proposedDate).minus({ days: 1 });
  while (workDates.has(checkDate.toISODate()!)) {
    streak++;
    checkDate = checkDate.minus({ days: 1 });
  }

  // Count forwards from proposed date
  checkDate = DateTime.fromISO(proposedDate).plus({ days: 1 });
  while (workDates.has(checkDate.toISODate()!)) {
    streak++;
    checkDate = checkDate.plus({ days: 1 });
  }

  if (streak >= 7) {
    return {
      constraint: 'CONSECUTIVE_DAYS',
      passed: false,
      severity: 'error',
      overridable: true,
      message: `This would be ${streak} consecutive days worked. A 7th consecutive day requires manager override with documented reason.`,
      details: {
        consecutiveDays: streak,
        proposedDate,
      },
    };
  }

  if (streak >= 6) {
    return {
      constraint: 'CONSECUTIVE_DAYS',
      passed: false,
      severity: 'warning',
      message: `This would be the ${streak}th consecutive day worked`,
      details: {
        consecutiveDays: streak,
        proposedDate,
      },
    };
  }

  return {
    constraint: 'CONSECUTIVE_DAYS',
    passed: true,
    severity: 'warning',
    message: `${streak} consecutive day(s)`,
    details: { consecutiveDays: streak },
  };
}
