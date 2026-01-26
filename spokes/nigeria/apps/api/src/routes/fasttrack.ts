/**
 * SOVRN Protocol - Fast-Track API Routes
 * Nigerian Spoke Implementation
 * 
 * High-priority verification endpoints for clients like Airport Security
 * Target: <500ms response time
 */

import { Router, Request, Response } from 'express';
import {
  FastTrackVerifyRequest,
  FastTrackVerifyResponse,
  FastTrackStatusRequest,
  FastTrackStatusResponse
} from '@sovrn/shared';
import {
  performFastTrackVerification,
  getFastTrackStatus
} from '../services/fastTrackVerification';
import { validateApiKey } from '../middleware/apiKeyAuth';

const router = Router();

/**
 * POST /v1/fasttrack/verify
 * 
 * Perform fast-track PFF verification with trust score
 * Returns cached result if available (zero-latency)
 * Otherwise performs live verification and caches for 24 hours
 * 
 * Target: <500ms response time
 */
router.post('/verify', validateApiKey, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const body = req.body as FastTrackVerifyRequest;

    // Validate required fields
    if (!body.pff_hash || !body.requester_id || !body.context) {
      const responseTime = Date.now() - startTime;
      const response: FastTrackVerifyResponse = {
        success: false,
        trust_score: 0,
        trust_level: 'very_low',
        verification_id: '',
        cached: false,
        response_time_ms: responseTime,
        message: 'Missing required fields: pff_hash, requester_id, context'
      };
      return res.status(400).json(response);
    }

    // Perform fast-track verification
    const result = await performFastTrackVerification(body);

    // Log performance warning if >500ms
    if (result.response_time_ms > 500) {
      console.warn(`⚠️ Fast-track verification exceeded 500ms: ${result.response_time_ms}ms`);
    } else {
      console.log(`✅ Fast-track verification completed in ${result.response_time_ms}ms`);
    }

    // Return appropriate status code
    const statusCode = result.success ? 200 : 404;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Fast-track verify endpoint error:', error);
    const responseTime = Date.now() - startTime;
    
    const response: FastTrackVerifyResponse = {
      success: false,
      trust_score: 0,
      trust_level: 'very_low',
      verification_id: '',
      cached: false,
      response_time_ms: responseTime,
      message: 'Internal server error'
    };
    
    return res.status(500).json(response);
  }
});

/**
 * GET /v1/fasttrack/status/:citizenId
 * 
 * Check if a citizen has a valid cached verification
 * Returns cache status and trust score if available
 */
router.get('/status/:citizenId', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;
    const { requester_id } = req.query;

    if (!requester_id) {
      const response: FastTrackStatusResponse = {
        success: false,
        cached: false,
        message: 'Missing required query parameter: requester_id'
      };
      return res.status(400).json(response);
    }

    // Get fast-track status
    const status = await getFastTrackStatus(citizenId);

    const response: FastTrackStatusResponse = {
      success: true,
      cached: status.cached,
      trust_score: status.trustScore,
      trust_level: status.trustLevel,
      cache_expires_at: status.cacheExpiresAt,
      verification_count: status.verificationCount,
      last_verified_at: status.lastVerifiedAt,
      message: status.cached 
        ? 'Citizen has valid cached verification'
        : 'No cached verification found'
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Fast-track status endpoint error:', error);
    
    const response: FastTrackStatusResponse = {
      success: false,
      cached: false,
      message: 'Internal server error'
    };
    
    return res.status(500).json(response);
  }
});

/**
 * POST /v1/fasttrack/invalidate
 * 
 * Invalidate cached verification for a citizen
 * Used when citizen status changes or security concerns arise
 */
router.post('/invalidate', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { citizen_id, reason } = req.body;

    if (!citizen_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: citizen_id'
      });
    }

    // Import deleteCacheEntry dynamically to avoid circular dependency
    const { deleteCacheEntry } = await import('../services/temporalCache');
    const deleted = await deleteCacheEntry(citizen_id);

    console.log(`Cache invalidated for citizen ${citizen_id}. Reason: ${reason || 'Not specified'}`);

    return res.status(200).json({
      success: deleted,
      message: deleted 
        ? 'Cache invalidated successfully'
        : 'No cache entry found or deletion failed'
    });

  } catch (error) {
    console.error('Fast-track invalidate endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

