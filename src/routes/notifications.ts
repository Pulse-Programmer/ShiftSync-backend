import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate } from '../middleware/auth';
import * as notificationService from '../services/notification';
import { param } from '../utils/params';
import { parsePagination, paginate } from '../utils/pagination';

const router = Router();

router.use(authenticate);

// Get notifications for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const pg = parsePagination(req, 20);

    const { data, total } = await notificationService.getNotifications(req.user!.userId, {
      unreadOnly,
      limit: pg.pageSize,
      offset: pg.offset,
    });
    res.json(paginate(data, total, pg));
  } catch (err) {
    next(err);
  }
});

// Get unread count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// Mark one as read
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(param(req, 'id'), req.user!.userId);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
});

// Get notification preferences
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.getNotificationPreferences(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Update notification preferences
router.put('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { preferences } = z.object({
      preferences: z.array(z.object({
        notificationType: z.string(),
        channel: z.enum(['in_app', 'email']),
        enabled: z.boolean(),
      })),
    }).parse(req.body);

    await notificationService.updateNotificationPreferences(req.user!.userId, preferences);
    res.json({ message: 'Preferences updated' });
  } catch (err) {
    next(err);
  }
});

export default router;
