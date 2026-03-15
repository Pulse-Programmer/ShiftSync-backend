import { query } from '../db/pool';
import { AssignmentContext, ConstraintResult, ValidationResult, Override } from './types';
import { checkDoubleBooking } from './constraints/checkDoubleBooking';
import { checkRestPeriod } from './constraints/checkRestPeriod';
import { checkSkillMatch } from './constraints/checkSkillMatch';
import { checkLocationCertification } from './constraints/checkLocationCertification';
import { checkAvailability } from './constraints/checkAvailability';
import { checkDailyHours } from './constraints/checkDailyHours';
import { checkWeeklyHours } from './constraints/checkWeeklyHours';
import { checkConsecutiveDays } from './constraints/checkConsecutiveDays';
import { suggestAlternatives } from './suggester';

const ALL_CONSTRAINTS = [
  checkDoubleBooking,
  checkRestPeriod,
  checkSkillMatch,
  checkLocationCertification,
  checkAvailability,
  checkDailyHours,
  checkWeeklyHours,
  checkConsecutiveDays,
];

/**
 * Build an AssignmentContext from a shiftId and userId.
 * Pre-fetches shift and location data needed by all constraints.
 */
export async function buildContext(
  userId: string,
  shiftId: string,
  excludeAssignmentId?: string
): Promise<AssignmentContext> {
  const result = await query(
    `SELECT s.id, s.schedule_id, s.location_id, s.start_time, s.end_time,
            s.required_skill_id, l.timezone
     FROM shifts s
     JOIN locations l ON s.location_id = l.id
     WHERE s.id = $1`,
    [shiftId]
  );

  if (result.rows.length === 0) {
    throw new Error('Shift not found');
  }

  const row = result.rows[0];

  return {
    userId,
    shiftId,
    shift: {
      id: row.id,
      locationId: row.location_id,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      requiredSkillId: row.required_skill_id,
      scheduleId: row.schedule_id,
    },
    location: {
      id: row.location_id,
      timezone: row.timezone,
    },
    excludeAssignmentId,
  };
}

/**
 * Run all constraints against a proposed assignment.
 * Returns a ValidationResult with pass/fail status and detailed results.
 */
export async function validateAssignment(
  context: AssignmentContext,
  overrides?: Override[],
  skipSuggestions = false
): Promise<ValidationResult> {
  // Run all constraints in parallel
  const results = await Promise.all(
    ALL_CONSTRAINTS.map(fn => fn(context))
  );

  // Apply overrides: if an override exists for a failed constraint that is overridable,
  // mark it as passed (but keep the warning info)
  if (overrides && overrides.length > 0) {
    for (const result of results) {
      if (!result.passed && result.overridable) {
        const override = overrides.find(o => o.constraint === result.constraint);
        if (override) {
          result.passed = true;
          result.details.overrideReason = override.reason;
          result.details.overridden = true;
        }
      }
    }
  }

  // Determine overall validity: any failed error-severity constraint means invalid
  const hasErrors = results.some(
    r => !r.passed && r.severity === 'error'
  );

  const validationResult: ValidationResult = {
    valid: !hasErrors,
    results,
  };

  // If there are errors, suggest alternatives (but not recursively)
  if (hasErrors && !skipSuggestions) {
    try {
      const suggestions = await suggestAlternatives(context);
      validationResult.suggestions = suggestions;
    } catch {
      // Don't fail validation if suggestions fail
      validationResult.suggestions = [];
    }
  }

  return validationResult;
}
