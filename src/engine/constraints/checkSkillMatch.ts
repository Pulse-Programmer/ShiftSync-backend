import { query } from '../../db/pool';
import { AssignmentContext, ConstraintResult } from '../types';

export async function checkSkillMatch(ctx: AssignmentContext): Promise<ConstraintResult> {
  // If no skill required, pass automatically
  if (!ctx.shift.requiredSkillId) {
    return {
      constraint: 'SKILL_MATCH',
      passed: true,
      severity: 'error',
      message: 'No specific skill required',
      details: {},
    };
  }

  const result = await query(
    `SELECT s.name as skill_name,
            EXISTS (
              SELECT 1 FROM user_skills us
              WHERE us.user_id = $1 AND us.skill_id = $2
            ) as has_skill,
            u.first_name, u.last_name
     FROM skills s, users u
     WHERE s.id = $2 AND u.id = $1`,
    [ctx.userId, ctx.shift.requiredSkillId]
  );

  if (result.rows.length === 0) {
    return {
      constraint: 'SKILL_MATCH',
      passed: false,
      severity: 'error',
      message: 'Required skill not found in system',
      details: { requiredSkillId: ctx.shift.requiredSkillId },
    };
  }

  const { skill_name, has_skill, first_name, last_name } = result.rows[0];

  if (!has_skill) {
    return {
      constraint: 'SKILL_MATCH',
      passed: false,
      severity: 'error',
      message: `${first_name} ${last_name} does not have the "${skill_name}" skill required for this shift`,
      details: {
        requiredSkill: skill_name,
        requiredSkillId: ctx.shift.requiredSkillId,
        userName: `${first_name} ${last_name}`,
      },
    };
  }

  return {
    constraint: 'SKILL_MATCH',
    passed: true,
    severity: 'error',
    message: `Has required skill: ${skill_name}`,
    details: { skill: skill_name },
  };
}
