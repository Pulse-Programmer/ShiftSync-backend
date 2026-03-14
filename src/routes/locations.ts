import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as locationService from '../services/location';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);

// List locations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await locationService.listLocations(
      req.user!.organizationId,
      req.user!.role,
      req.user!.locationIds
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get location by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await locationService.getLocationById(param(req, 'id'), req.user!.organizationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create location
const createSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().optional(),
  timezone: z.string().min(1),
  editCutoffHours: z.number().int().min(0).optional(),
});

router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const result = await locationService.createLocation(req.user!.organizationId, data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Update location
router.put('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.partial().parse(req.body);
    const result = await locationService.updateLocation(param(req, 'id'), req.user!.organizationId, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get certified staff at location
router.get('/:id/staff', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await locationService.getLocationStaff(param(req, 'id'), req.user!.organizationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// On-duty now — who is currently working at this location
router.get('/:id/on-duty', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await locationService.getOnDutyStaff(param(req, 'id'));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
