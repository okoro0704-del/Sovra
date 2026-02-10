/**
 * SOVRYN Force Audit & Minting Release API
 * POST /v1/sovryn/audit - Manual Audit trigger (emergency release)
 * POST /v1/sovryn/pff/vitalized - PFF vitalization → chain handshake (SovereignMint; Architect 1.1+4.0 VIDA)
 * GET /v1/sovryn/balance - Architect balance (from citizens + chain); real-time after tx mined
 * GET /v1/sovryn/balance/:address - Real-time balance for any address
 */

import { Router, Request, Response } from 'express';
import { sovrynAuditRequest, sovrynAuditRequestForAll } from '../services/sovrynAudit';
import { onVitalizedTriggerChainHandshake } from '../services/chainHandshake';
import { getBalance } from '../blockchain/sovrynProvider';
import { getArchitectFromCitizens } from '../services/sovrynAudit';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /v1/sovryn/audit
 * Manual Audit: triggers sovrynAuditRequest() directly.
 * Use when automatic hook failed. Requires X-API-KEY.
 */
router.post('/audit', async (_req: Request, res: Response) => {
  try {
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
      });
      return;
    }

    res.status(200).json({
      success: true,
      assumedControl: false,
      message: result.error || 'Conditions not met for release (already completed or not vitalized)',
      architectUid: result.architectUid,
      mintingStatus: result.mintingStatus,
    });
  } catch (error) {
    console.error('SOVRYN audit route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error during SOVRYN audit request',
    });
  }
});

/**
 * POST /v1/sovryn/audit-all
 * Manual Audit (all): scan citizens where is_vitalized=true and minting_status=null,
 * trigger 11 VIDA minting for each, update minting_status=COMPLETED.
 */
router.post('/audit-all', async (_req: Request, res: Response) => {
  try {
    const result = await sovrynAuditRequestForAll();
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
    });
  } catch (error) {
    console.error('SOVRYN audit-all route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error during SOVRYN audit-all',
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });
  }
});

export default router;
