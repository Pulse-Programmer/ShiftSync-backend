import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as invitationService from '../services/invitation';
import { param } from '../utils/params';

const router = Router();

const createSchema = z.object({
  email: z.email(),
  role: z.enum(['manager', 'staff']),
  locationIds: z.array(z.uuid()).optional(),
  skillIds: z.array(z.uuid()).optional(),
});

// All invitation routes require authentication
router.use(authenticate);

router.post('/', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const result = await invitationService.createInvitation({
      organizationId: req.user!.organizationId,
      email: data.email,
      role: data.role,
      locationIds: data.locationIds,
      skillIds: data.skillIds,
      invitedBy: req.user!.userId,
      inviterRole: req.user!.role,
      inviterLocationIds: req.user!.locationIds,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await invitationService.listInvitations(
      req.user!.organizationId,
      req.user!.role,
      req.user!.userId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await invitationService.revokeInvitation(param(req, 'id'), req.user!.organizationId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resend', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await invitationService.resendInvitation(param(req, 'id'), req.user!.organizationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
