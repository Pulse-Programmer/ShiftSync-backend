import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export async function listSkills(organizationId: string) {
  const result = await query(
    'SELECT * FROM skills WHERE organization_id = $1 ORDER BY name',
    [organizationId]
  );
  return result.rows;
}

export async function createSkill(organizationId: string, name: string) {
  try {
    const result = await query(
      'INSERT INTO skills (organization_id, name) VALUES ($1, $2) RETURNING *',
      [organizationId, name]
    );
    return result.rows[0];
  } catch (err: any) {
    if (err.code === '23505') { // unique_violation
      throw new AppError(409, `Skill "${name}" already exists`);
    }
    throw err;
  }
}

export async function deleteSkill(id: string, organizationId: string) {
  const result = await query(
    'DELETE FROM skills WHERE id = $1 AND organization_id = $2 RETURNING id',
    [id, organizationId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Skill not found');
  }
}
