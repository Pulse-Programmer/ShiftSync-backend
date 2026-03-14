import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as swapService from '../services/swap';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);

// Create swap or drop request
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      type: z.enum(['swap', 'drop']),
      assignmentId: z.uuid(),
      targetAssignmentId: z.uuid().optional(),
      reason: z.string().optional(),
    }).parse(req.body);

    const result = await swapService.createSwapRequest({
      ...data,
      requesterId: req.user!.userId,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// List swap requests
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await swapService.listSwapRequests({
      organizationId: req.user!.organizationId,
      status: req.query.status as string | undefined,
      locationId: req.query.locationId as string | undefined,
      userId: req.user!.userId,
      role: req.user!.role,
      userLocationIds: req.user!.locationIds,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get available shifts for pickup
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await swapService.getAvailableShiftsForPickup(
      req.user!.userId,
      req.user!.organizationId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Accept a swap (peer acceptance)
router.put('/:id/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await swapService.acceptSwap(param(req, 'id'), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Approve a swap (manager)
router.put('/:id/approve', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const result = await swapService.approveSwap(param(req, 'id'), req.user!.userId, reason);

    if (result.approved === false) {
      res.status(409).json({
        error: 'Constraint violations prevent this swap',
        validation: result.validation,
      });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Reject a swap (manager)
router.put('/:id/reject', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
    const result = await swapService.rejectSwap(param(req, 'id'), req.user!.userId, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Cancel a swap (requester)
router.put('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await swapService.cancelSwap(param(req, 'id'), req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Pick up a dropped shift
router.post('/:id/pickup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await swapService.pickupShift(param(req, 'id'), req.user!.userId);

    if (result.picked === false) {
      res.status(409).json({
        error: 'Constraint violations prevent picking up this shift',
        validation: result.validation,
      });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
