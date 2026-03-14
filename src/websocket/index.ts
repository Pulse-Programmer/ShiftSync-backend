import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db/pool';
import { JwtPayload } from '../types';

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initializeWebSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });

  // Auth middleware: verify JWT on connection
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      // Fetch location IDs
      const result = await query(
        'SELECT location_id FROM user_locations WHERE user_id = $1 AND decertified_at IS NULL',
        [decoded.userId]
      );

      (socket as any).user = {
        ...decoded,
        locationIds: result.rows.map((r: { location_id: string }) => r.location_id),
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`WebSocket connected: ${user.userId} (${user.role})`);

    // Join personal room
    socket.join(`user:${user.userId}`);

    // Join location rooms
    for (const locId of user.locationIds) {
      socket.join(`location:${locId}`);
      if (user.role === 'manager' || user.role === 'admin') {
        socket.join(`managers:${locId}`);
      }
    }

    socket.on('disconnect', () => {
      console.log(`WebSocket disconnected: ${user.userId}`);
    });
  });

  return io;
}

// --- Emit helpers used by services ---

export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToLocation(locationId: string, event: string, data: any) {
  io?.to(`location:${locationId}`).emit(event, data);
}

export function emitToManagers(locationId: string, event: string, data: any) {
  io?.to(`managers:${locationId}`).emit(event, data);
}
