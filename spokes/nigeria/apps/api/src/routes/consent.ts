import { Router, Request, Response } from 'express';
import { ConsentRequest, ConsentResponse, ApiError } from '@sovrn/shared';
import { supabase } from '../config/supabase';
import { mintTokensForConsent } from '../services/tokenMinting';

const router = Router();

/**
 * POST /v1/consent
 * Receive biometric signature and log consent
 * Requires: X-API-KEY header
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const entity = (req as any).entity; // Set by apiKeyAuth middleware
    const body: ConsentRequest = req.body;

    // Validate request body
    if (!body.challenge_token || !body.biometric_signature || !body.pff_hash) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Missing required fields: challenge_token, biometric_signature, and pff_hash are required',
        code: 'MISSING_FIELDS'
      };
      res.status(400).json(error);
      return;
    }

    // Verify challenge token is valid (in a real implementation, check Redis/cache)
    // For now, we'll proceed assuming the token is valid if provided

    // Get citizen ID from pff_hash
    const { data: citizen, error: citizenError } = await supabase
      .from('citizen_registry')
      .select('id')
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

    // Log the consent
    const { data: consentLog, error: consentError } = await supabase
      .from('consent_logs')
      .insert({
        citizen_id: citizen.id,
        requester_id: entity.id,
        data_scope: 'user_requested', // Should come from the original verify request
        biometric_signature: body.biometric_signature,
        status: 'granted'
      })
      .select()
      .single();

    if (consentError || !consentLog) {
      console.error('Consent log error:', consentError);
      const error: ApiError = {
        error: 'Internal Server Error',
        message: 'Failed to log consent',
        code: 'CONSENT_LOG_ERROR'
      };
      res.status(500).json(error);
      return;
    }

    // ========================================================================
    // USAGE-BASED VALUE LOGIC: Automatically mint SOV tokens upon consent
    // ========================================================================
    const mintResult = await mintTokensForConsent(
      citizen.id,
      consentLog.id,
      body.biometric_signature
    );

    if (!mintResult.success) {
      console.error('Token minting failed:', mintResult.error);
      // Don't fail the consent operation if minting fails
      // Log the error but continue with the response
    }

    const response: ConsentResponse = {
      success: true,
      consent_id: consentLog.id,
      message: mintResult.success
        ? 'Consent granted and SOV tokens minted successfully'
        : 'Consent granted (token minting failed)'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Consent route error:', error);
    const apiError: ApiError = {
      error: 'Internal Server Error',
      message: 'Failed to process consent request',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(apiError);
  }
});

export default router;
