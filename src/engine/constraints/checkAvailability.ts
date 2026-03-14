import { DateTime } from 'luxon';
import { getEffectiveAvailability } from '../../services/availability';
import { AssignmentContext, ConstraintResult } from '../types';

export async function checkAvailability(ctx: AssignmentContext): Promise<ConstraintResult> {
  const timezone = ctx.location.timezone;

  // Convert shift times to the location's timezone
  const shiftStart = DateTime.fromJSDate(ctx.shift.startTime, { zone: 'utc' }).setZone(timezone);
  const shiftEnd = DateTime.fromJSDate(ctx.shift.endTime, { zone: 'utc' }).setZone(timezone);

  // For overnight shifts, we need to check availability on both dates
  const startDate = shiftStart.toISODate()!;
  const endDate = shiftEnd.toISODate()!;

  const datesToCheck = [startDate];
  if (endDate !== startDate) {
    datesToCheck.push(endDate);
  }

  for (const date of datesToCheck) {
    const availability = await getEffectiveAvailability(ctx.userId, ctx.shift.locationId, date);

    // If no availability windows exist for this date, user is unavailable
    if (availability.windows.length === 0) {
      return {
        constraint: 'AVAILABILITY',
        passed: false,
        severity: 'error',
        message: `Not available on ${DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED)}. No availability set for this day.`,
        details: {
          date,
          source: availability.source,
          shiftStart: shiftStart.toISO(),
          shiftEnd: shiftEnd.toISO(),
        },
      };
    }

    // Determine which portion of the shift falls on this date
    let checkStart: DateTime;
    let checkEnd: DateTime;

    if (date === startDate && date === endDate) {
      // Shift is within one day
      checkStart = shiftStart;
      checkEnd = shiftEnd;
    } else if (date === startDate) {
      // First day of overnight shift: from shift start to midnight
      checkStart = shiftStart;
      checkEnd = DateTime.fromISO(date, { zone: timezone }).endOf('day');
    } else {
      // Second day of overnight shift: from midnight to shift end
      checkStart = DateTime.fromISO(date, { zone: timezone }).startOf('day');
      checkEnd = shiftEnd;
    }

    const checkStartTime = checkStart.toFormat('HH:mm:ss');
    const checkEndTime = checkEnd.toFormat('HH:mm:ss');

    // Check if the shift portion is covered by any availability window
    const covered = availability.windows.some((w: { start: string; end: string }) => {
      return w.start <= checkStartTime && w.end >= checkEndTime;
    });

    if (!covered) {
      const windowsStr = availability.windows
        .map((w: { start: string; end: string }) => `${w.start}-${w.end}`)
        .join(', ');

      return {
        constraint: 'AVAILABILITY',
        passed: false,
        severity: 'error',
        message: `Shift time (${checkStartTime}-${checkEndTime}) on ${DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED)} falls outside available hours (${windowsStr || 'none'})`,
        details: {
          date,
          shiftWindow: { start: checkStartTime, end: checkEndTime },
          availableWindows: availability.windows,
          source: availability.source,
        },
      };
    }
  }

  return {
    constraint: 'AVAILABILITY',
    passed: true,
    severity: 'error',
    message: 'Available during shift hours',
    details: {},
  };
}
