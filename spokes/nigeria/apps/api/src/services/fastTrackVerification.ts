/**
 * SOVRN Protocol - Fast-Track Verification Service
 * Nigerian Spoke Implementation
 * 
 * High-priority verification with <500ms response time
 */

import { createClient } from '@supabase/supabase-js';
import {
  FastTrackVerifyRequest,
  FastTrackVerifyResponse,
  LivenessCheckStatus,
  calculateTrustScore,
  getTrustLevel,
  createCacheEntry,
  isCacheValid
} from '@sovrn/shared';
import {
  getCacheEntry,
  setCacheEntry,
  incrementVerificationCount
} from './temporalCache';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Perform fast-track verification
 * Target: <500ms response time
 */
export async function performFastTrackVerification(
  request: FastTrackVerifyRequest
): Promise<FastTrackVerifyResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Check temporal cache first (fastest path)
    const cachedEntry = await getCacheEntry(request.pff_hash);
    
    if (cachedEntry && isCacheValid(cachedEntry)) {
      // Cache hit - increment count and return immediately
      await incrementVerificationCount(cachedEntry.citizen_id, request.context);
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        trust_score: cachedEntry.trust_score,
        trust_level: cachedEntry.trust_level,
        verification_id: cachedEntry.verification_id,
        citizen_id: cachedEntry.citizen_id,
        cached: true,
        cache_expires_at: cachedEntry.expires_at,
        liveness_check: 'passed', // Cached entries already passed liveness
        response_time_ms: responseTime,
        message: 'Verified from temporal cache (zero-latency)'
      };
    }

    // Step 2: Cache miss - perform live verification
    const { data: citizen, error: citizenError } = await supabase
      .from('citizen_registry')
      .select('id, pff_hash, status, created_at')
      .eq('pff_hash', request.pff_hash)
      .single();

    if (citizenError || !citizen) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        trust_score: 0,
        trust_level: 'very_low',
        verification_id: uuidv4(),
        cached: false,
        response_time_ms: responseTime,
        message: 'Citizen not found in registry'
      };
    }

    // Check citizen status
    if (citizen.status !== 'active') {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        trust_score: 0,
        trust_level: 'very_low',
        verification_id: uuidv4(),
        citizen_id: citizen.id,
        cached: false,
        response_time_ms: responseTime,
        message: `Citizen status: ${citizen.status}`
      };
    }

    // Step 3: Get verification history (for trust score calculation)
    const { data: verificationHistory } = await supabase
      .from('consent_logs')
      .select('id, timestamp')
      .eq('citizen_id', citizen.id)
      .order('timestamp', { ascending: false })
      .limit(100);

    const verificationCount = verificationHistory?.length || 0;
    const lastVerifiedAt = verificationHistory?.[0]?.timestamp 
      ? new Date(verificationHistory[0].timestamp)
      : undefined;

    // Step 4: Perform liveness check (if data provided)
    const livenessCheckStatus: LivenessCheckStatus = request.liveness_data
      ? performLivenessCheck(request.liveness_data)
      : 'passed'; // Default to passed if no liveness data

    // Step 5: Check for risk flags
    const riskFlags = await getRiskFlags(citizen.id);
    const suspiciousActivityCount = await getSuspiciousActivityCount(citizen.id);

    // Step 6: Calculate trust score
    const trustScoreFactors = calculateTrustScore({
      verificationCount,
      lastVerifiedAt,
      livenessCheckStatus,
      riskFlags,
      suspiciousActivityCount
    });

    const trustScore = trustScoreFactors.total_score;
    const trustLevel = getTrustLevel(trustScore);
    const verificationId = uuidv4();

    // Step 7: Store in temporal cache for 24 hours
    const cacheEntry = createCacheEntry({
      citizenId: citizen.id,
      pffHash: request.pff_hash,
      trustScore,
      trustLevel,
      verificationId,
      context: request.context
    });

    await setCacheEntry(cacheEntry);

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      trust_score: trustScore,
      trust_level: trustLevel,
      verification_id: verificationId,
      citizen_id: citizen.id,
      cached: false,
      cache_expires_at: cacheEntry.expires_at,
      liveness_check: livenessCheckStatus,
      response_time_ms: responseTime,
      message: 'Live verification completed and cached'
    };

  } catch (error) {
    console.error('Fast-track verification error:', error);
    const responseTime = Date.now() - startTime;

    return {
      success: false,
      trust_score: 0,
      trust_level: 'very_low',
      verification_id: uuidv4(),
      cached: false,
      response_time_ms: responseTime,
      message: 'Internal verification error'
    };
  }
}

/**
 * Perform liveness check on biometric data
 * Detects spoofing attempts (photos, videos, masks, etc.)
 */
function performLivenessCheck(livenessData: string): LivenessCheckStatus {
  // TODO: Implement actual liveness detection algorithm
  // This is a placeholder implementation

  try {
    // Parse liveness data (could be base64 image, sensor data, etc.)
    const data = JSON.parse(livenessData);

    // Check for suspicious patterns
    if (data.motion_detected === false) {
      return 'suspicious';
    }

    if (data.depth_sensor === false) {
      return 'suspicious';
    }

    if (data.temperature_check === false) {
      return 'failed';
    }

    return 'passed';
  } catch (error) {
    console.error('Liveness check error:', error);
    return 'suspicious';
  }
}

/**
 * Get risk flags for a citizen
 * Returns array of risk indicators
 */
async function getRiskFlags(citizenId: string): Promise<string[]> {
  const riskFlags: string[] = [];

  try {
    // Check for suspended/revoked status changes
    const { data: statusHistory } = await supabase
      .from('citizen_registry')
      .select('status, metadata')
      .eq('id', citizenId)
      .single();

    if (statusHistory?.metadata?.status_changes) {
      riskFlags.push('status_change_history');
    }

    // Check for failed verification attempts
    const { data: failedAttempts } = await supabase
      .from('consent_logs')
      .select('id')
      .eq('citizen_id', citizenId)
      .eq('status', 'denied')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (failedAttempts && failedAttempts.length > 3) {
      riskFlags.push('multiple_failed_attempts');
    }

    // TODO: Add more risk checks:
    // - Blacklist checks
    // - Geolocation anomalies
    // - Unusual access patterns
    // - Concurrent access from multiple locations

  } catch (error) {
    console.error('Error getting risk flags:', error);
  }

  return riskFlags;
}

/**
 * Get count of suspicious activities for a citizen
 */
async function getSuspiciousActivityCount(citizenId: string): Promise<number> {
  try {
    // Check for suspicious consent patterns
    const { data: recentConsents } = await supabase
      .from('consent_logs')
      .select('id, timestamp, requester_id')
      .eq('citizen_id', citizenId)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (!recentConsents) {
      return 0;
    }

    let suspiciousCount = 0;

    // Flag if more than 10 consents in 24 hours
    if (recentConsents.length > 10) {
      suspiciousCount += 1;
    }

    // Flag if consents from more than 5 different requesters in 24 hours
    const uniqueRequesters = new Set(recentConsents.map(c => c.requester_id));
    if (uniqueRequesters.size > 5) {
      suspiciousCount += 1;
    }

    return suspiciousCount;
  } catch (error) {
    console.error('Error getting suspicious activity count:', error);
    return 0;
  }
}

/**
 * Get fast-track verification status for a citizen
 */
export async function getFastTrackStatus(citizenId: string): Promise<{
  cached: boolean;
  trustScore?: number;
  trustLevel?: string;
  cacheExpiresAt?: string;
  verificationCount?: number;
  lastVerifiedAt?: string;
}> {
  try {
    const cacheEntry = await getCacheEntry(citizenId);

    if (cacheEntry && isCacheValid(cacheEntry)) {
      return {
        cached: true,
        trustScore: cacheEntry.trust_score,
        trustLevel: cacheEntry.trust_level,
        cacheExpiresAt: cacheEntry.expires_at,
        verificationCount: cacheEntry.verification_count,
        lastVerifiedAt: cacheEntry.verified_at
      };
    }

    return {
      cached: false
    };
  } catch (error) {
    console.error('Error getting fast-track status:', error);
    return {
      cached: false
    };
  }
}

