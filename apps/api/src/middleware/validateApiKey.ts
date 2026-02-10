/**
 * Global API: optional X-API-KEY check against env API_KEY (no DB).
 * For stricter auth, use registered_entities in a spoke.
 */

import { Request, Response, NextFunction } from 'express';

export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const envKey = process.env.API_KEY;
  if (!envKey) {
    next();
    return;
  }
  const key = req.headers['x-api-key'] as string | undefined;
  if (key !== envKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing X-API-KEY',
      code: 'INVALID_API_KEY',
    });
    return;
  }
  next();
}
