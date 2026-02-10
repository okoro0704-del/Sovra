/**
 * Sovereign Secret: audit endpoints run only if x-sovryn-key matches SOVRYN_SECRET.
 * Set SOVRYN_SECRET in environment (e.g. Netlify Environment Variables).
 */

import { Request, Response, NextFunction } from 'express';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sovryn-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export function requireSovrynSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.SOVRYN_SECRET;
  const key = req.headers['x-sovryn-key'] as string | undefined;

  if (!secret) {
    next();
    return;
  }

  if (!key || key !== secret) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid x-sovryn-key (must match SOVRYN_SECRET)',
      code: 'SOVRYN_SECRET_REQUIRED',
    });
    return;
  }

  next();
}
