import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as analyticsService from '../services/analytics';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'manager'));

// Fairness report
router.get('/fairness', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, startDate, endDate } = z.object({
      locationId: z.uuid(),
      startDate: z.iso.date(),
      endDate: z.iso.date(),
    }).parse(req.query);

    const result = await analyticsService.getFairnessReport(locationId, startDate, endDate);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Fairness score
router.get('/fairness-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, startDate, endDate } = z.object({
      locationId: z.uuid(),
      startDate: z.iso.date(),
      endDate: z.iso.date(),
    }).parse(req.query);

    const result = await analyticsService.getFairnessScore(locationId, startDate, endDate);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Staff shift history
router.get('/staff/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = z.object({
      startDate: z.iso.date(),
      endDate: z.iso.date(),
    }).parse(req.query);

    const result = await analyticsService.getStaffHistory(param(req, 'id'), startDate, endDate);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
