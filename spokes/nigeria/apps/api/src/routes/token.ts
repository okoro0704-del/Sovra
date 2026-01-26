import { Router, Request, Response } from 'express';
import { TokenMintRequest, TokenMintResponse, ApiError } from '@sovrn/shared';
import { mintTokensForConsent, getCitizenBalance } from '../services/tokenMinting';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /v1/token/mint
 * Manually trigger token minting (admin/system use)
 * Requires: X-API-KEY header
 */
router.post('/mint', async (req: Request, res: Response) => {
  try {
    const entity = (req as any).entity;
    const body: TokenMintRequest = req.body;

    // Validate request
    if (!body.citizen_id || !body.consent_id) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Missing required fields: citizen_id and consent_id are required',
        code: 'MISSING_FIELDS'
      };
      res.status(400).json(error);
      return;
    }

    // Verify citizen exists
    const { data: citizen, error: citizenError } = await supabase
      .from('citizen_registry')
      .select('id')
      .eq('id', body.citizen_id)
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

    // Verify consent exists
    const { data: consent, error: consentError } = await supabase
      .from('consent_logs')
      .select('id, biometric_signature')
      .eq('id', body.consent_id)
      .single();

    if (consentError || !consent) {
      const error: ApiError = {
        error: 'Not Found',
        message: 'Consent log not found',
        code: 'CONSENT_NOT_FOUND'
      };
      res.status(404).json(error);
      return;
    }

    // Mint tokens
    const mintResult = await mintTokensForConsent(
      body.citizen_id,
      body.consent_id,
      consent.biometric_signature,
      body.amount
    );

    if (!mintResult.success) {
      const error: ApiError = {
        error: 'Internal Server Error',
        message: mintResult.error || 'Failed to mint tokens',
        code: 'MINTING_FAILED'
      };
      res.status(500).json(error);
      return;
    }

    // Get updated balance
    const balanceResult = await getCitizenBalance(body.citizen_id);

    const response: TokenMintResponse = {
      success: true,
      minting_event_id: mintResult.mintingEvent?.id,
      amount_minted: mintResult.mintingEvent?.amount,
      new_balance: balanceResult.balance?.balance,
      message: 'SOV tokens minted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Token mint route error:', error);
    const apiError: ApiError = {
      error: 'Internal Server Error',
      message: 'Failed to process token minting request',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(apiError);
  }
});

/**
 * GET /v1/token/balance/:citizenId
 * Get token balance for a citizen
 * Requires: X-API-KEY header
 */
router.get('/balance/:citizenId', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;

    if (!citizenId) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Citizen ID is required',
        code: 'MISSING_CITIZEN_ID'
      };
      res.status(400).json(error);
      return;
    }

    // Get balance
    const balanceResult = await getCitizenBalance(citizenId);

    if (!balanceResult.success) {
      const error: ApiError = {
        error: 'Internal Server Error',
        message: balanceResult.error || 'Failed to fetch balance',
        code: 'BALANCE_FETCH_FAILED'
      };
      res.status(500).json(error);
      return;
    }

    res.status(200).json({
      success: true,
      balance: balanceResult.balance
    });
  } catch (error) {
    console.error('Token balance route error:', error);
    const apiError: ApiError = {
      error: 'Internal Server Error',
      message: 'Failed to fetch token balance',
      code: 'INTERNAL_ERROR'
    };
    res.status(500).json(apiError);
  }
});

export default router;

