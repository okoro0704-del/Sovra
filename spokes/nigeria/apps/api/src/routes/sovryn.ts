/**
 * SOVRYN Force Audit & Minting Release API
 * POST /v1/sovryn/audit - Manual Audit trigger (emergency release)
 * POST /v1/sovryn/pff/vitalized - PFF vitalization → chain handshake (SovereignMint; Architect 1.1+4.0 VIDA)
 * GET /v1/sovryn/balance - Architect balance (from citizens + chain); real-time after tx mined
 * GET /v1/sovryn/balance/:address - Real-time balance for any address
 */

import { Router, Request, Response } from 'express';
import { sovrynAuditRequest, sovrynAuditRequestForAll, sovrynAuditRequestForCitizen } from '../services/sovrynAudit';
import { onVitalizedTriggerChainHandshake } from '../services/chainHandshake';
import { getBalance } from '../blockchain/sovrynProvider';
import { getArchitectFromCitizens } from '../services/sovrynAudit';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /v1/sovryn/audit
 * Webhook (Supabase): reads citizen_hash from body, confirms citizen, mints 11 VIDA (5 User, 5 Nation, 1 Foundation), sets minting_status = COMPLETED.
 * Manual fallback: if no body, runs Architect-only sovrynAuditRequest().
 * Returns clear error + code (e.g. MINTING_FAILED) so PFF can show "Minting Retrying...".
 */
router.post('/audit', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const citizenHash = body.citizen_hash ?? body.citizenHash ?? '';
    const citizenUid = body.citizen_uid ?? body.citizen_uid ?? body.uid ?? '';

    if (citizenHash || citizenUid) {
      const result = await sovrynAuditRequestForCitizen(citizenHash || undefined, citizenUid || undefined);
      if (result.success) {
        res.status(200).json({
          success: true,
          message: '11 VIDA minted. 5 User, 5 Nation, 1 Foundation. minting_status = COMPLETED.',
          citizenUid: result.citizenUid,
          releaseId: result.releaseId,
          transactionHash: result.transactionHash,
          mintingStatus: result.mintingStatus,
          redirect_url: process.env.AUTH_REDIRECT || undefined,
        });
        return;
      }
      const status = result.code === 'CITIZEN_NOT_FOUND' ? 404 : result.code === 'CONDITIONS_NOT_MET' ? 400 : 500;
      res.status(status).json({
        success: false,
        message: result.error,
        code: result.code,
        citizenUid: result.citizenUid,
        mintingStatus: result.mintingStatus,
      });
      return;
    }

    const result = await sovrynAuditRequest();
    if (!result.success && !result.assumedControl) {
      res.status(400).json({
        success: false,
        message: result.error || 'SOVRYN audit failed',
        architectUid: result.architectUid,
      });
      return;
    }
    if (result.success && result.assumedControl) {
      res.status(200).json({
        success: true,
        message: 'SOVRYN assumed control. releaseVidaCap() executed. minting_status = COMPLETED.',
        architectUid: result.architectUid,
        releaseId: result.releaseId,
        mintingStatus: result.mintingStatus,
        warning: result.error || undefined,
        redirect_url: process.env.AUTH_REDIRECT || undefined,
      });
      return;
    }
    res.status(200).json({
      success: true,
      assumedControl: false,
      message: result.error || 'Conditions not met for release',
      architectUid: result.architectUid,
      mintingStatus: result.mintingStatus,
      redirect_url: process.env.AUTH_REDIRECT || undefined,
    });
  } catch (error) {
    console.error('SOVRYN audit route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error during SOVRYN audit request',
      code: 'MINTING_FAILED',
    });
  }
});

/**
 * POST /v1/sovryn/audit-all
 * Manual Audit (all): scan citizens where is_vitalized=true and minting_status=null,
 * trigger 11 VIDA minting for each, update minting_status=COMPLETED.
 * Query/body: country_code (optional) – which National Block to credit; defaults to user's detected location per citizen.
 */
router.post('/audit-all', async (req: Request, res: Response) => {
  try {
    const countryCode = (req.query.country_code as string) ?? (req.body?.country_code as string) ?? undefined;
    const result = await sovrynAuditRequestForAll({
      requestHeaders: req.headers as Record<string, string | undefined>,
      countryCodeOverride: countryCode,
    });
    const ok = result.success && result.failed === 0;
    res.status(ok ? 200 : 207).json({
      success: result.success,
      message:
        result.processed === 0
          ? 'No citizens with is_vitalized=true and minting_status=null'
          : `Processed ${result.processed}: ${result.succeeded} minted, ${result.failed} failed.`,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      results: result.results,
      error: result.error,
      code: result.failed > 0 ? 'MINTING_FAILED' : undefined,
      redirect_url: process.env.AUTH_REDIRECT || undefined,
    });
  } catch (error) {
    console.error('SOVRYN audit-all route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error during SOVRYN audit-all',
      code: 'MINTING_FAILED',
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });
  }
});

export default router;
