import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as skillService from '../services/skill';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);

// List skills
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await skillService.listSkills(req.user!.organizationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create skill
router.post('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
    const result = await skillService.createSkill(req.user!.organizationId, name);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Delete skill
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await skillService.deleteSkill(param(req, 'id'), req.user!.organizationId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
