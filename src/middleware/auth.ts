import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db/pool';
import { JwtPayload, UserRole } from '../types';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Fetch user's location IDs
    const result = await query(
      `SELECT location_id FROM user_locations
       WHERE user_id = $1 AND decertified_at IS NULL`,
      [decoded.userId]
    );

    req.user = {
      ...decoded,
      locationIds: result.rows.map((r: { location_id: string }) => r.location_id),
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireLocationAccess(getLocationId: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admins have access to all locations
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const locationId = getLocationId(req);
    if (!locationId) {
      res.status(400).json({ error: 'Location ID required' });
      return;
    }

    if (!req.user.locationIds.includes(locationId)) {
      res.status(403).json({ error: 'No access to this location' });
      return;
    }

    next();
  };
}
