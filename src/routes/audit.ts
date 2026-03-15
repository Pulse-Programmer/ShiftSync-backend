import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { authenticate, requireRole } from '../middleware/auth';
import * as auditService from '../services/audit';
import { param } from '../utils/params';
import { parsePagination, paginate } from '../utils/pagination';

const router = Router();

router.use(authenticate);

// Get shift history (manager+)
router.get('/shifts/:id', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await auditService.getShiftHistory(param(req, 'id'));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Query audit logs (admin only)
router.get('/', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pg = parsePagination(req, 50);
    const { data, total } = await auditService.queryAuditLogs({
      organizationId: req.user!.organizationId,
      entityType: req.query.entityType as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      locationId: req.query.locationId as string | undefined,
      limit: pg.pageSize,
      offset: pg.offset,
    });
    res.json(paginate(data, total, pg));
  } catch (err) {
    next(err);
  }
});

// Export audit logs as CSV (admin only)
router.get('/export', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = z.object({
      startDate: z.iso.date(),
      endDate: z.iso.date(),
    }).parse(req.query);

    const csv = await auditService.exportAuditLogs({
      organizationId: req.user!.organizationId,
      startDate,
      endDate,
      locationId: req.query.locationId as string | undefined,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_${startDate}_${endDate}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
