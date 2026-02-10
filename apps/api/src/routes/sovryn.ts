/**
 * SOVRYN Force Audit & Minting Release API (Global base: apps/api)
 * POST /v1/sovryn/audit - Manual Audit (single architect)
 * POST /v1/sovryn/audit-all - Manual Audit all; accepts country_code to set which National Block to credit (defaults to user's detected location per citizen)
 */

import { Router, Request, Response } from 'express';
import { sovrynAuditRequest, sovrynAuditRequestForAll } from '../services/sovrynAudit';

const router = Router();

/**
 * POST /v1/sovryn/audit
 * Optional: query or body country_code to override detected National Block for the architect.
 */
router.post('/audit', async (req: Request, res: Response) => {
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
        redirect_url: process.env.AUTH_REDIRECT || undefined,
      });
      return;
    }

    res.status(200).json({
      success: true,
      assumedControl: false,
      message: result.error || 'Conditions not met for release (already completed or not vitalized)',
      architectUid: result.architectUid,
      mintingStatus: result.mintingStatus,
      redirect_url: process.env.AUTH_REDIRECT || undefined,
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
 * Dynamic routing: accept country_code (query or body) to set which National Block to credit for all processed citizens.
 * If omitted, defaults to user's detected location per citizen (IP / sovereign_identity / metadata).
 */
router.post('/audit-all', async (req: Request, res: Response) => {
  try {
    const countryCode =
      (req.query.country_code as string) ?? (req.body?.country_code as string) ?? undefined;

    const result = await sovrynAuditRequestForAll({
      requestHeaders: req.headers as Record<string, string | undefined>,
      countryCodeOverride: countryCode || undefined,
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
      redirect_url: process.env.AUTH_REDIRECT || undefined,
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
