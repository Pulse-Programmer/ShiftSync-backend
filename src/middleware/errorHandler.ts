import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    error: config.nodeEnv === 'development'
      ? err.message
      : 'Internal server error',
  });
}
