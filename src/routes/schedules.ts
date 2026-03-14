import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as scheduleService from '../services/schedule';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);

// Get schedule for a location/week
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, weekStart } = z.object({
      locationId: z.uuid(),
      weekStart: z.iso.date(),
    }).parse(req.query);

    const result = await scheduleService.getSchedule(locationId, weekStart);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// List schedules for a location
router.get('/by-location/:locationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await scheduleService.getSchedulesByLocation(param(req, 'locationId'));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create draft schedule
router.post('/', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, weekStart } = z.object({
      locationId: z.uuid(),
      weekStart: z.iso.date(),
    }).parse(req.body);

    const result = await scheduleService.createSchedule(locationId, weekStart, req.user!.organizationId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Publish schedule
router.put('/:id/publish', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await scheduleService.publishSchedule(param(req, 'id'), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Unpublish schedule
router.put('/:id/unpublish', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scheduleId = param(req, 'id');
    const { locationId } = z.object({ locationId: z.uuid() }).parse(req.body);
    const result = await scheduleService.unpublishSchedule(scheduleId, locationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
