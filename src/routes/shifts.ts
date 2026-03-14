import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as shiftService from '../services/shift';
import * as assignmentService from '../services/assignment';
import { param } from '../utils/params';

const router = Router();

router.use(authenticate);

// List shifts for a schedule
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scheduleId } = z.object({ scheduleId: z.uuid() }).parse(req.query);
    const result = await shiftService.getShiftsBySchedule(scheduleId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get shift by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await shiftService.getShiftById(param(req, 'id'));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create shift
const createShiftSchema = z.object({
  scheduleId: z.uuid(),
  locationId: z.uuid(),
  startTime: z.string(),
  endTime: z.string(),
  requiredSkillId: z.uuid().optional(),
  headcountNeeded: z.number().int().min(1),
  notes: z.string().optional(),
  timezone: z.string(),
});

router.post('/', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createShiftSchema.parse(req.body);
    const result = await shiftService.createShift(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Update shift
router.put('/:id', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      requiredSkillId: z.uuid().nullable().optional(),
      headcountNeeded: z.number().int().min(1).optional(),
      notes: z.string().optional(),
      timezone: z.string(),
    }).parse(req.body);

    const result = await shiftService.updateShift(param(req, 'id'), data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Delete shift
router.delete('/:id', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await shiftService.deleteShift(param(req, 'id'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- Assignments ---

// List assignments for a shift
router.get('/:id/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await assignmentService.getAssignmentsByShift(param(req, 'id'));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Preview assignment (dry-run constraint check)
router.post('/:id/assignments/preview', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = z.object({ userId: z.uuid() }).parse(req.body);
    const result = await assignmentService.previewAssignment(param(req, 'id'), userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Assign staff to shift
router.post('/:id/assignments', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, overrides } = z.object({
      userId: z.uuid(),
      overrides: z.array(z.object({
        constraint: z.string(),
        reason: z.string().min(1),
      })).optional(),
    }).parse(req.body);

    const result = await assignmentService.assignStaffToShift(
      param(req, 'id'),
      userId,
      req.user!.userId,
      overrides
    );

    if (!result.validation.valid) {
      res.status(409).json({
        error: 'Constraint violations prevent this assignment',
        validation: result.validation,
      });
      return;
    }

    res.status(201).json({
      assignment: result.assignment,
      validation: result.validation,
    });
  } catch (err) {
    next(err);
  }
});

// Unassign staff from shift
router.delete('/:shiftId/assignments/:userId', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assignmentService.unassignStaff(param(req, 'shiftId'), param(req, 'userId'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- User schedule view ---

// Get a user's schedule for a date range
router.get('/user/:userId/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = z.object({
      startDate: z.iso.date(),
      endDate: z.iso.date(),
    }).parse(req.query);

    const result = await shiftService.getUserSchedule(
      param(req, 'userId'),
      startDate,
      endDate,
      req.user!.role
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get location schedule view for a week
router.get('/location/:locationId/week', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekStart } = z.object({ weekStart: z.iso.date() }).parse(req.query);
    const result = await shiftService.getLocationScheduleView(param(req, 'locationId'), weekStart);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
