import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { emitToUser } from '../websocket';
import { sendNotificationEmail } from './email';

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  // Check user's notification preferences
  const prefCheck = await query(
    `SELECT enabled FROM notification_preferences
     WHERE user_id = $1 AND notification_type = $2 AND channel = 'in_app'`,
    [data.userId, data.type]
  );

  // Default to enabled if no preference is set
  const enabled = prefCheck.rows.length === 0 || prefCheck.rows[0].enabled;

  if (!enabled) return null;

  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.userId, data.type, data.title, data.message, data.metadata ? JSON.stringify(data.metadata) : null]
  );

  const notification = result.rows[0];

  // Push via WebSocket
  emitToUser(data.userId, 'notification:new', notification);

  // Send email if user has email channel enabled
  const emailPref = await query(
    `SELECT enabled FROM notification_preferences
     WHERE user_id = $1 AND notification_type = $2 AND channel = 'email'`,
    [data.userId, data.type]
  );

  if (emailPref.rows.length > 0 && emailPref.rows[0].enabled) {
    const user = await query('SELECT email FROM users WHERE id = $1', [data.userId]);
    if (user.rows.length > 0) {
      await sendNotificationEmail(user.rows[0].email, data.title, data.message);
    }
  }

  return notification;
}

/**
 * Bulk-create notifications for multiple users (e.g., schedule published).
 */
export async function notifyMultiple(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  for (const userId of userIds) {
    await createNotification({ userId, type, title, message, metadata });
  }
}

export async function getNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number }
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options;

  let whereSql = 'WHERE user_id = $1';
  const countParams: any[] = [userId];

  if (unreadOnly) {
    whereSql += ` AND is_read = false`;
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM notifications ${whereSql}`,
    countParams
  );
  const total = parseInt(countResult.rows[0].total);

  let sql = `SELECT * FROM notifications ${whereSql}`;
  const params: any[] = [...countParams];
  let paramIdx = params.length + 1;

  sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { data: result.rows, total };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(result.rows[0].count);
}

export async function markAsRead(notificationId: string, userId: string) {
  const result = await query(
    `UPDATE notifications SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Notification not found');
  }
}

export async function markAllAsRead(userId: string) {
  await query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [userId]
  );
}

export async function getNotificationPreferences(userId: string) {
  const result = await query(
    'SELECT * FROM notification_preferences WHERE user_id = $1 ORDER BY notification_type, channel',
    [userId]
  );
  return result.rows;
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: { notificationType: string; channel: 'in_app' | 'email'; enabled: boolean }[]
) {
  for (const pref of preferences) {
    await query(
      `INSERT INTO notification_preferences (user_id, notification_type, channel, enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, notification_type, channel)
       DO UPDATE SET enabled = $4`,
      [userId, pref.notificationType, pref.channel, pref.enabled]
    );
  }
}
