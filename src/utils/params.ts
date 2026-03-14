import { Request } from 'express';

/**
 * Safely extract a route parameter as a string.
 * Express 5 types params as string | string[] — this handles both cases.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
