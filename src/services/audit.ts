import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export async function logAudit(data: {
  entityType: string;
  entityId: string;
  action: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  performedBy: string;
  ipAddress?: string;
  notes?: string;
}) {
  await query(
    `INSERT INTO audit_logs (entity_type, entity_id, action, before_state, after_state, performed_by, ip_address, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.entityType,
      data.entityId,
      data.action,
      data.beforeState ? JSON.stringify(data.beforeState) : null,
      data.afterState ? JSON.stringify(data.afterState) : null,
      data.performedBy,
      data.ipAddress || null,
      data.notes || null,
    ]
  );
}

export async function getShiftHistory(shiftId: string) {
  const result = await query(
    `SELECT al.*, u.first_name, u.last_name
     FROM audit_logs al
     LEFT JOIN users u ON al.performed_by = u.id
     WHERE al.entity_type = 'shift' AND al.entity_id = $1
     ORDER BY al.performed_at DESC`,
    [shiftId]
  );
  return result.rows;
}

export async function queryAuditLogs(filters: {
  organizationId: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}) {
  let sql = `
    SELECT al.*, u.first_name, u.last_name
    FROM audit_logs al
    LEFT JOIN users u ON al.performed_by = u.id
    WHERE u.organization_id = $1
  `;
  const params: any[] = [filters.organizationId];
  let paramIdx = 2;

  if (filters.entityType) {
    sql += ` AND al.entity_type = $${paramIdx++}`;
    params.push(filters.entityType);
  }

  if (filters.startDate) {
    sql += ` AND al.performed_at >= $${paramIdx++}::timestamptz`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    sql += ` AND al.performed_at < $${paramIdx++}::timestamptz`;
    params.push(filters.endDate);
  }

  if (filters.locationId) {
    // Filter by location: match shifts/assignments at this location
    sql += ` AND (
      (al.entity_type = 'shift' AND al.entity_id IN (SELECT id FROM shifts WHERE location_id = $${paramIdx}))
      OR (al.entity_type = 'assignment' AND al.entity_id IN (
        SELECT sa.id FROM shift_assignments sa JOIN shifts s ON sa.shift_id = s.id WHERE s.location_id = $${paramIdx}
      ))
      OR (al.entity_type = 'schedule' AND al.entity_id IN (SELECT id FROM schedules WHERE location_id = $${paramIdx}))
      OR al.entity_type NOT IN ('shift', 'assignment', 'schedule')
    )`;
    params.push(filters.locationId);
    paramIdx++;
  }

  sql += ` ORDER BY al.performed_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(filters.limit || 50, filters.offset || 0);

  const result = await query(sql, params);
  return result.rows;
}

export async function exportAuditLogs(filters: {
  organizationId: string;
  startDate: string;
  endDate: string;
  locationId?: string;
}): Promise<string> {
  const logs = await queryAuditLogs({
    ...filters,
    limit: 10000,
    offset: 0,
  });

  // Build CSV
  const headers = ['Date', 'Entity Type', 'Entity ID', 'Action', 'Performed By', 'Notes', 'Before State', 'After State'];
  const rows = logs.map((log: any) => [
    new Date(log.performed_at).toISOString(),
    log.entity_type,
    log.entity_id,
    log.action,
    `${log.first_name || ''} ${log.last_name || ''}`.trim(),
    (log.notes || '').replace(/"/g, '""'),
    log.before_state ? JSON.stringify(log.before_state).replace(/"/g, '""') : '',
    log.after_state ? JSON.stringify(log.after_state).replace(/"/g, '""') : '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((r: string[]) => r.map(v => `"${v}"`).join(',')),
  ].join('\n');

  return csv;
}
