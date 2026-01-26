import { Request, Response, NextFunction } from 'express';
import { hashApiKey } from '@sovrn/shared';
import { supabase } from '../config/supabase';

/**
 * Middleware to validate X-API-KEY header
 * Verifies the API key against registered entities in the database
 */
export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'X-API-KEY header is required',
      code: 'MISSING_API_KEY'
    });
    return;
  }

  try {
    // Hash the provided API key
    const apiKeyHash = hashApiKey(apiKey);

    // Query the database for a matching entity
    const { data: entity, error } = await supabase
      .from('registered_entities')
      .select('id, org_name, tier_level, status')
      .eq('api_key_hash', apiKeyHash)
      .eq('status', 'active')
      .single();

    if (error || !entity) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or inactive API key',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    // Attach entity information to request for use in routes
    (req as any).entity = entity;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate API key',
      code: 'VALIDATION_ERROR'
    });
  }
}
