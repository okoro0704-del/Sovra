import { Router, Request, Response } from 'express';
import { VerifyRequest, VerifyResponse, ApiError } from '@sovrn/shared';
import { supabase } from '../config/supabase';
import { generateSecureToken } from '@sovrn/shared';

const router = Router();

/**
 * POST /v1/verify
 * Trigger a challenge to PFF Gateway
 * Requires: X-API-KEY header
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const entity = (req as any).entity; // Set by apiKeyAuth middleware
    const body: VerifyRequest = req.body;

    // Validate request body
    if (!body.pff_hash || !body.data_scope) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Missing required fields: pff_hash and data_scope are required',
        code: 'MISSING_FIELDS'
      };
      res.status(400).json(error);
      return;
    }

    // Verify citizen exists
    const { data: citizen, error: citizenError } = await supabase
      .from('citizen_registry')
      .select('id, status')
      .eq('pff_hash', body.pff_hash)
      .eq('status', 'active')
      .single();

    if (citizenError || !citizen) {
      const error: ApiError = {
        error: 'Not Found',
        message: 'Citizen not found or inactive',
        code: 'CITIZEN_NOT_FOUND'
      };
      res.status(404).json(error);
      return;
    }

    // Generate challenge token (expires in 5 minutes)
    const challengeToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store challenge token (in a real implementation, you'd use Redis or similar)
    // For now, we'll return it and the PFF Gateway should handle the challenge

    const response: VerifyResponse = {
      success: true,
      challenge_token: challengeToken,
      expires_at: expiresAt,
      message: 'Challenge generated. Please complete biometric verification via PFF Gateway.'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Verify route error:', error);
    const apiError: ApiError = {
      error: 'Internal Server Error',
      message: 'Failed to process verification request',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(apiError);
  }
});

export default router;
