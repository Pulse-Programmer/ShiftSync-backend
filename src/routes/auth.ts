import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import * as authService from '../services/auth';

const router = Router();

const registerSchema = z.object({
  organizationName: z.string().min(1).max(200),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/accept-invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = acceptInviteSchema.parse(req.body);
    const result = await authService.acceptInvite(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
