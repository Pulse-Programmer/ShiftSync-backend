import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as overtimeService from '../services/overtime';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'manager'));

// Weekly overview for a location
router.get('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, weekStart } = z.object({
      locationId: z.uuid(),
      weekStart: z.iso.date(),
    }).parse(req.query);

    const result = await overtimeService.getWeeklyOverview(locationId, weekStart);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Detailed breakdown for one user
router.get('/user/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekStart } = z.object({ weekStart: z.iso.date() }).parse(req.query);
    const result = await overtimeService.getUserWeeklyDetail(param(req, 'id'), weekStart);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Overtime projections (includes draft schedules)
router.get('/projections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, weekStart } = z.object({
      locationId: z.uuid(),
      weekStart: z.iso.date(),
    }).parse(req.query);

    const result = await overtimeService.getOvertimeProjections(locationId, weekStart);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
