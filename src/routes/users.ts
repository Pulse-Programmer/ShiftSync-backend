import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth';
import * as userService from '../services/user';
import * as availabilityService from '../services/availability';
import { param } from '../utils/params';
import { parsePagination, paginate } from '../utils/pagination';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticate);

// Get current user profile (must be before /:id to avoid conflict)
router.get('/me/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.getUserById(req.user!.userId, req.user!.organizationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// List users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pg = parsePagination(req, 50);
    const { data, total } = await userService.listUsers(
      req.user!.organizationId,
      req.user!.role,
      req.user!.locationIds,
      { limit: pg.pageSize, offset: pg.offset }
    );
    res.json(paginate(data, total, pg));
  } catch (err) {
    next(err);
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.getUserById(param(req, 'id'), req.user!.organizationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Update user
const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  desiredWeeklyHours: z.number().min(0).max(80).optional(),
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = param(req, 'id');

    // Staff can only update themselves
    if (req.user!.role === 'staff' && targetId !== req.user!.userId) {
      res.status(403).json({ error: 'Can only update your own profile' });
      return;
    }

    const data = updateSchema.parse(req.body);
    const result = await userService.updateUser(targetId, req.user!.organizationId, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Deactivate user
router.put('/:id/deactivate', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deactivateUser(param(req, 'id'), req.user!.organizationId);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

// Reactivate user
router.put('/:id/reactivate', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.reactivateUser(param(req, 'id'), req.user!.organizationId);
    res.json({ message: 'User reactivated' });
  } catch (err) {
    next(err);
  }
});

// Assign skill
router.post('/:id/skills', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skillId } = z.object({ skillId: z.uuid() }).parse(req.body);
    await userService.assignSkill(param(req, 'id'), skillId, req.user!.organizationId);
    res.status(201).json({ message: 'Skill assigned' });
  } catch (err) {
    next(err);
  }
});

// Remove skill
router.delete('/:id/skills/:skillId', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.removeSkill(param(req, 'id'), param(req, 'skillId'), req.user!.organizationId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Certify location
router.post('/:id/locations', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId } = z.object({ locationId: z.uuid() }).parse(req.body);

    // Managers can only certify for their own locations
    if (req.user!.role === 'manager' && !req.user!.locationIds.includes(locationId)) {
      res.status(403).json({ error: 'Can only certify for locations you manage' });
      return;
    }

    await userService.certifyLocation(param(req, 'id'), locationId, req.user!.organizationId);
    res.status(201).json({ message: 'Location certified' });
  } catch (err) {
    next(err);
  }
});

// Decertify location
router.put('/:id/locations/:locationId/decertify', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.decertifyLocation(param(req, 'id'), param(req, 'locationId'), req.user!.organizationId);
    res.json({ message: 'Location decertified' });
  } catch (err) {
    next(err);
  }
});

// --- Profile photo ---

// Upload profile photo
router.put('/:id/photo', upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = param(req, 'id');

    // Users can only upload their own photo; admins/managers can upload for others
    if (req.user!.role === 'staff' && targetId !== req.user!.userId) {
      res.status(403).json({ error: 'Can only update your own photo' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const result = await userService.updateProfilePhoto(targetId, req.user!.organizationId, req.file.buffer);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Delete profile photo
router.delete('/:id/photo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = param(req, 'id');

    if (req.user!.role === 'staff' && targetId !== req.user!.userId) {
      res.status(403).json({ error: 'Can only delete your own photo' });
      return;
    }

    await userService.removeProfilePhoto(targetId, req.user!.organizationId);
    res.json({ message: 'Photo removed' });
  } catch (err) {
    next(err);
  }
});

// --- Availability routes (nested under users) ---

// Get user's availability
router.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locationId = req.query.locationId as string | undefined;
    const result = await availabilityService.getAvailabilityByUser(param(req, 'id'), locationId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get effective availability for a date
router.get('/:id/availability/effective', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, locationId } = z.object({
      date: z.iso.date(),
      locationId: z.uuid(),
    }).parse(req.query);

    const result = await availabilityService.getEffectiveAvailability(param(req, 'id'), locationId, date);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create availability entry
const availabilitySchema = z.object({
  locationId: z.uuid(),
  type: z.enum(['recurring', 'exception']),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  specificDate: z.iso.date().optional(),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean().optional(),
});

router.post('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = param(req, 'id');

    // Staff can only set their own availability
    if (req.user!.role === 'staff' && targetId !== req.user!.userId) {
      res.status(403).json({ error: 'Can only set your own availability' });
      return;
    }

    const data = availabilitySchema.parse(req.body);
    const result = await availabilityService.createAvailability({
      userId: targetId,
      ...data,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Update availability entry
router.put('/:id/availability/:availabilityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = param(req, 'id');

    if (req.user!.role === 'staff' && targetId !== req.user!.userId) {
      res.status(403).json({ error: 'Can only update your own availability' });
      return;
    }

    const data = z.object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isAvailable: z.boolean().optional(),
    }).parse(req.body);

    const result = await availabilityService.updateAvailability(param(req, 'availabilityId'), targetId, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Delete availability entry
router.delete('/:id/availability/:availabilityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = param(req, 'id');

    if (req.user!.role === 'staff' && targetId !== req.user!.userId) {
      res.status(403).json({ error: 'Can only delete your own availability' });
      return;
    }

    await availabilityService.deleteAvailability(param(req, 'availabilityId'), targetId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
