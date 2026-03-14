import { query, getClient } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { buildContext, validateAssignment } from '../engine/validator';

const MAX_PENDING_REQUESTS = 3;

export async function createSwapRequest(data: {
  type: 'swap' | 'drop';
  assignmentId: string;
  targetAssignmentId?: string;
  reason?: string;
  requesterId: string;
}) {
  // Verify requester owns the assignment
  const assignment = await query(
    `SELECT sa.*, s.start_time, s.location_id
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     WHERE sa.id = $1 AND sa.user_id = $2 AND sa.status = 'assigned'`,
    [data.assignmentId, data.requesterId]
  );
  if (assignment.rows.length === 0) {
    throw new AppError(404, 'Assignment not found or you are not assigned to it');
  }

  // Check shift hasn't passed
  if (new Date(assignment.rows[0].start_time) <= new Date()) {
    throw new AppError(400, 'Cannot request swap/drop for a past shift');
  }

  // Check pending request limit
  const pendingCount = await query(
    `SELECT COUNT(*) as count FROM swap_requests
     WHERE requester_assignment_id IN (
       SELECT id FROM shift_assignments WHERE user_id = $1 AND status = 'assigned'
     )
     AND status IN ('pending_peer', 'pending_manager')`,
    [data.requesterId]
  );
  if (parseInt(pendingCount.rows[0].count) >= MAX_PENDING_REQUESTS) {
    throw new AppError(400, `Cannot have more than ${MAX_PENDING_REQUESTS} pending swap/drop requests`);
  }

  // For swaps, verify target assignment
  if (data.type === 'swap') {
    if (!data.targetAssignmentId) {
      throw new AppError(400, 'Target assignment is required for swap requests');
    }
    const target = await query(
      `SELECT sa.user_id FROM shift_assignments sa
       WHERE sa.id = $1 AND sa.status = 'assigned'`,
      [data.targetAssignmentId]
    );
    if (target.rows.length === 0) {
      throw new AppError(404, 'Target assignment not found');
    }
    if (target.rows[0].user_id === data.requesterId) {
      throw new AppError(400, 'Cannot swap with yourself');
    }
  }

  // Set expiry for drops: 24 hours before shift start
  const shiftStart = new Date(assignment.rows[0].start_time);
  const expiresAt = new Date(shiftStart.getTime() - 24 * 60 * 60 * 1000);

  const initialStatus = data.type === 'swap' ? 'pending_peer' : 'pending_manager';

  const result = await query(
    `INSERT INTO swap_requests (type, requester_assignment_id, target_assignment_id, status, requester_reason, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.type, data.assignmentId, data.targetAssignmentId || null, initialStatus, data.reason || null, expiresAt]
  );

  return result.rows[0];
}

export async function acceptSwap(swapId: string, acceptingUserId: string) {
  // Verify the accepting user is the target
  const swap = await query(
    `SELECT sr.*, sa.user_id as target_user_id
     FROM swap_requests sr
     JOIN shift_assignments sa ON sr.target_assignment_id = sa.id
     WHERE sr.id = $1 AND sr.status = 'pending_peer' AND sr.type = 'swap'`,
    [swapId]
  );

  if (swap.rows.length === 0) {
    throw new AppError(404, 'Swap request not found or not in pending_peer status');
  }

  if (swap.rows[0].target_user_id !== acceptingUserId) {
    throw new AppError(403, 'Only the target staff member can accept this swap');
  }

  const result = await query(
    `UPDATE swap_requests SET status = 'pending_manager', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [swapId]
  );

  return result.rows[0];
}

export async function approveSwap(swapId: string, managerId: string, managerReason?: string) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const swap = await client.query(
      `SELECT sr.*,
              req_sa.shift_id as requester_shift_id, req_sa.user_id as requester_user_id,
              tgt_sa.shift_id as target_shift_id, tgt_sa.user_id as target_user_id
       FROM swap_requests sr
       JOIN shift_assignments req_sa ON sr.requester_assignment_id = req_sa.id
       LEFT JOIN shift_assignments tgt_sa ON sr.target_assignment_id = tgt_sa.id
       WHERE sr.id = $1 AND sr.status = 'pending_manager'`,
      [swapId]
    );

    if (swap.rows.length === 0) {
      throw new AppError(404, 'Swap request not found or not pending manager approval');
    }

    const swapData = swap.rows[0];

    if (swapData.type === 'swap') {
      // Swap: requester takes target's shift, target takes requester's shift
      // Validate both new assignments via constraint engine
      const ctx1 = await buildContext(swapData.requester_user_id, swapData.target_shift_id, swapData.target_assignment_id);
      const v1 = await validateAssignment(ctx1);

      const ctx2 = await buildContext(swapData.target_user_id, swapData.requester_shift_id, swapData.requester_assignment_id);
      const v2 = await validateAssignment(ctx2);

      if (!v1.valid || !v2.valid) {
        await client.query('ROLLBACK');
        return {
          approved: false,
          validation: { requesterToTarget: v1, targetToRequester: v2 },
        };
      }

      // Perform the swap
      await client.query(
        `UPDATE shift_assignments SET user_id = $1, assigned_at = NOW() WHERE id = $2`,
        [swapData.requester_user_id, swapData.target_assignment_id]
      );
      await client.query(
        `UPDATE shift_assignments SET user_id = $1, assigned_at = NOW() WHERE id = $2`,
        [swapData.target_user_id, swapData.requester_assignment_id]
      );
    } else {
      // Drop with pickup: if someone picked it up
      if (swapData.target_user_id) {
        // Remove requester, assign to pickup user
        await client.query(
          `UPDATE shift_assignments SET user_id = $1, assigned_at = NOW() WHERE id = $2`,
          [swapData.target_user_id, swapData.requester_assignment_id]
        );
      } else {
        // Pure drop: just remove the assignment
        await client.query(
          `UPDATE shift_assignments SET status = 'removed', removed_at = NOW() WHERE id = $1`,
          [swapData.requester_assignment_id]
        );
      }
    }

    // Update swap request status
    await client.query(
      `UPDATE swap_requests SET status = 'approved', manager_id = $2, manager_reason = $3, updated_at = NOW()
       WHERE id = $1`,
      [swapId, managerId, managerReason || null]
    );

    await client.query('COMMIT');

    return { approved: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectSwap(swapId: string, managerId: string, reason: string) {
  const result = await query(
    `UPDATE swap_requests
     SET status = 'rejected', manager_id = $2, manager_reason = $3, updated_at = NOW()
     WHERE id = $1 AND status IN ('pending_peer', 'pending_manager')
     RETURNING *`,
    [swapId, managerId, reason]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Swap request not found or already resolved');
  }

  return result.rows[0];
}

export async function cancelSwap(swapId: string, requesterId: string) {
  const result = await query(
    `UPDATE swap_requests sr
     SET status = 'cancelled', updated_at = NOW()
     WHERE sr.id = $1
     AND sr.status IN ('pending_peer', 'pending_manager')
     AND sr.requester_assignment_id IN (
       SELECT id FROM shift_assignments WHERE user_id = $2
     )
     RETURNING *`,
    [swapId, requesterId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Swap request not found, already resolved, or not yours to cancel');
  }

  return result.rows[0];
}

export async function pickupShift(swapId: string, pickupUserId: string) {
  // Verify it's a drop request that's available for pickup
  const swap = await query(
    `SELECT sr.*, req_sa.shift_id
     FROM swap_requests sr
     JOIN shift_assignments req_sa ON sr.requester_assignment_id = req_sa.id
     WHERE sr.id = $1 AND sr.type = 'drop' AND sr.status = 'pending_manager'
     AND sr.target_user_id IS NULL
     AND (sr.expires_at IS NULL OR sr.expires_at > NOW())`,
    [swapId]
  );

  if (swap.rows.length === 0) {
    throw new AppError(404, 'Drop request not found, already claimed, or expired');
  }

  // Run constraint engine for the pickup user
  const context = await buildContext(pickupUserId, swap.rows[0].shift_id);
  const validation = await validateAssignment(context);

  if (!validation.valid) {
    return { picked: false, validation };
  }

  const result = await query(
    `UPDATE swap_requests SET target_user_id = $2, updated_at = NOW()
     WHERE id = $1 AND target_user_id IS NULL
     RETURNING *`,
    [swapId, pickupUserId]
  );

  if (result.rows.length === 0) {
    throw new AppError(409, 'Someone else already picked up this shift');
  }

  return { picked: true, swap: result.rows[0], validation };
}

export async function listSwapRequests(filters: {
  organizationId: string;
  status?: string;
  locationId?: string;
  userId?: string;
  role: string;
  userLocationIds: string[];
}) {
  // Expire stale drop requests lazily
  await query(
    `UPDATE swap_requests
     SET status = 'expired', updated_at = NOW()
     WHERE type = 'drop'
     AND status IN ('pending_peer', 'pending_manager')
     AND expires_at IS NOT NULL AND expires_at < NOW()`
  );

  let sql = `
    SELECT sr.*,
           req_u.first_name as requester_first, req_u.last_name as requester_last,
           tgt_u.first_name as target_first, tgt_u.last_name as target_last,
           s.start_time as shift_start, s.end_time as shift_end,
           l.name as location_name, l.timezone,
           sk.name as skill_name
    FROM swap_requests sr
    JOIN shift_assignments req_sa ON sr.requester_assignment_id = req_sa.id
    JOIN users req_u ON req_sa.user_id = req_u.id
    JOIN shifts s ON req_sa.shift_id = s.id
    JOIN locations l ON s.location_id = l.id
    LEFT JOIN skills sk ON s.required_skill_id = sk.id
    LEFT JOIN shift_assignments tgt_sa ON sr.target_assignment_id = tgt_sa.id
    LEFT JOIN users tgt_u ON COALESCE(sr.target_user_id, tgt_sa.user_id) = tgt_u.id
    WHERE l.organization_id = $1
  `;
  const params: any[] = [filters.organizationId];
  let paramIdx = 2;

  if (filters.status) {
    sql += ` AND sr.status = $${paramIdx++}`;
    params.push(filters.status);
  }

  if (filters.locationId) {
    sql += ` AND s.location_id = $${paramIdx++}`;
    params.push(filters.locationId);
  }

  // Managers only see swaps at their locations
  if (filters.role === 'manager') {
    sql += ` AND s.location_id = ANY($${paramIdx++})`;
    params.push(filters.userLocationIds);
  }

  // Staff only see their own swaps
  if (filters.role === 'staff' && filters.userId) {
    sql += ` AND (req_sa.user_id = $${paramIdx} OR sr.target_user_id = $${paramIdx})`;
    params.push(filters.userId);
    paramIdx++;
  }

  sql += ' ORDER BY sr.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

export async function getAvailableShiftsForPickup(
  userId: string,
  organizationId: string
) {
  const result = await query(
    `SELECT sr.id as swap_request_id, sr.requester_reason, sr.expires_at,
            s.start_time, s.end_time, s.required_skill_id,
            l.name as location_name, l.timezone,
            sk.name as skill_name,
            req_u.first_name as requester_first, req_u.last_name as requester_last
     FROM swap_requests sr
     JOIN shift_assignments req_sa ON sr.requester_assignment_id = req_sa.id
     JOIN shifts s ON req_sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     JOIN users req_u ON req_sa.user_id = req_u.id
     WHERE sr.type = 'drop'
     AND sr.status = 'pending_manager'
     AND sr.target_user_id IS NULL
     AND (sr.expires_at IS NULL OR sr.expires_at > NOW())
     AND s.start_time > NOW()
     AND l.organization_id = $1
     AND req_sa.user_id != $2
     -- Staff must be certified at the location
     AND EXISTS (
       SELECT 1 FROM user_locations ul
       WHERE ul.user_id = $2 AND ul.location_id = s.location_id AND ul.decertified_at IS NULL
     )
     -- Staff must have the required skill (if any)
     AND (s.required_skill_id IS NULL OR EXISTS (
       SELECT 1 FROM user_skills us
       WHERE us.user_id = $2 AND us.skill_id = s.required_skill_id
     ))
     ORDER BY s.start_time`,
    [organizationId, userId]
  );

  return result.rows;
}
