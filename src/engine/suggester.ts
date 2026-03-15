import { query } from '../db/pool';
import { AssignmentContext, Suggestion } from './types';
import { buildContext, validateAssignment } from './validator';

const MAX_SUGGESTIONS = 5;

/**
 * Find alternative staff who could work a shift when the proposed assignment fails constraints.
 * Queries eligible candidates, runs each through the constraint engine in dry-run mode,
 * and returns the top candidates sorted by fewest warnings.
 */
export async function suggestAlternatives(
  context: AssignmentContext
): Promise<Suggestion[]> {
  // Find staff who are certified at this location and have the required skill
  let sql = `
    SELECT DISTINCT u.id, u.first_name, u.last_name
    FROM users u
    JOIN user_locations ul ON u.id = ul.user_id
  `;
  const params: any[] = [context.shift.locationId, context.userId];

  if (context.shift.requiredSkillId) {
    sql += ' JOIN user_skills us ON u.id = us.user_id AND us.skill_id = $3';
    params.push(context.shift.requiredSkillId);
  }

  sql += `
    WHERE ul.location_id = $1
    AND ul.decertified_at IS NULL
    AND u.role = 'staff'
    AND u.is_active = true
    AND u.id != $2
    LIMIT 20
  `;

  const result = await query(sql, params);

  // Run each candidate through the constraint engine
  const candidates: { suggestion: Suggestion; warningCount: number }[] = [];

  for (const row of result.rows) {
    try {
      // Build context for this candidate
      const candidateContext: AssignmentContext = {
        ...context,
        userId: row.id,
      };

      const validation = await validateAssignment(candidateContext, undefined, true);

      // Only suggest if no hard errors
      const errors = validation.results.filter(r => !r.passed && r.severity === 'error');
      if (errors.length === 0) {
        const warnings = validation.results.filter(r => !r.passed && r.severity === 'warning');
        candidates.push({
          suggestion: {
            userId: row.id,
            userName: `${row.first_name} ${row.last_name}`,
            reason: warnings.length === 0
              ? 'Has required skill and is available'
              : `Available (${warnings.length} warning${warnings.length > 1 ? 's' : ''})`,
          },
          warningCount: warnings.length,
        });
      }
    } catch {
      // Skip candidates that throw errors during validation
      continue;
    }
  }

  // Sort by fewest warnings, take top N
  candidates.sort((a, b) => a.warningCount - b.warningCount);

  return candidates.slice(0, MAX_SUGGESTIONS).map(c => c.suggestion);
}
