/**
 * SOVRN Protocol - Fast-Track Verification Service
 * Global Hub Implementation
 * 
 * Provides high-priority verification with trust scoring for clients
 * like Airport Security, Border Control, etc.
 */

import {
  TrustScoreFactors,
  TrustScoreLevel,
  LivenessCheckStatus,
  TemporalCacheEntry
} from './types';

/**
 * Calculate Trust Score (0-100 scale)
 * 
 * Scoring Breakdown:
 * - Verification History (0-30): Number and frequency of past verifications
 * - Recency (0-20): How recently the user was last verified
 * - Liveness Check (0-25): Real-time biometric liveness detection
 * - Risk Indicators (0-25): Anomaly detection, blacklist checks, etc.
 */
export function calculateTrustScore(params: {
  verificationCount: number;
  lastVerifiedAt?: Date;
  livenessCheckStatus?: LivenessCheckStatus;
  riskFlags: string[];
  suspiciousActivityCount: number;
}): TrustScoreFactors {
  const {
    verificationCount,
    lastVerifiedAt,
    livenessCheckStatus,
    riskFlags,
    suspiciousActivityCount
  } = params;

  // 1. Verification History Score (0-30 points)
  let verificationHistoryScore = 0;
  if (verificationCount >= 50) {
    verificationHistoryScore = 30;
  } else if (verificationCount >= 20) {
    verificationHistoryScore = 25;
  } else if (verificationCount >= 10) {
    verificationHistoryScore = 20;
  } else if (verificationCount >= 5) {
    verificationHistoryScore = 15;
  } else if (verificationCount >= 1) {
    verificationHistoryScore = 10;
  }

  // 2. Recency Score (0-20 points)
  let recencyScore = 0;
  if (lastVerifiedAt) {
    const hoursSinceLastVerification = (Date.now() - lastVerifiedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastVerification < 1) {
      recencyScore = 20; // Verified within last hour
    } else if (hoursSinceLastVerification < 6) {
      recencyScore = 15; // Verified within last 6 hours
    } else if (hoursSinceLastVerification < 24) {
      recencyScore = 10; // Verified within last 24 hours
    } else if (hoursSinceLastVerification < 168) {
      recencyScore = 5; // Verified within last week
    }
  }

  // 3. Liveness Check Score (0-25 points)
  let livenessCheckScore = 0;
  if (livenessCheckStatus === 'passed') {
    livenessCheckScore = 25;
  } else if (livenessCheckStatus === 'suspicious') {
    livenessCheckScore = 10;
  } else if (livenessCheckStatus === 'failed') {
    livenessCheckScore = 0;
  } else {
    // No liveness check performed
    livenessCheckScore = 15; // Neutral score
  }

  // 4. Risk Indicators Score (0-25 points)
  let riskIndicatorsScore = 25; // Start with perfect score
  
  // Deduct points for risk flags
  riskIndicatorsScore -= riskFlags.length * 5; // -5 points per risk flag
  
  // Deduct points for suspicious activity
  riskIndicatorsScore -= suspiciousActivityCount * 3; // -3 points per suspicious activity
  
  // Ensure minimum of 0
  riskIndicatorsScore = Math.max(0, riskIndicatorsScore);

  // Calculate total score
  const totalScore = verificationHistoryScore + recencyScore + livenessCheckScore + riskIndicatorsScore;

  return {
    verification_history_score: verificationHistoryScore,
    recency_score: recencyScore,
    liveness_check_score: livenessCheckScore,
    risk_indicators_score: riskIndicatorsScore,
    total_score: Math.min(100, Math.max(0, totalScore)) // Clamp between 0-100
  };
}

/**
 * Convert numeric trust score to trust level
 */
export function getTrustLevel(score: number): TrustScoreLevel {
  if (score >= 85) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'very_low';
}

/**
 * Check if a temporal cache entry is still valid
 */
export function isCacheValid(cacheEntry: TemporalCacheEntry): boolean {
  const expiresAt = new Date(cacheEntry.expires_at);
  return expiresAt > new Date();
}

/**
 * Create a new temporal cache entry
 * Valid for 24 hours from creation
 */
export function createCacheEntry(params: {
  citizenId: string;
  pffHash: string;
  trustScore: number;
  trustLevel: TrustScoreLevel;
  verificationId: string;
  context: string;
}): TemporalCacheEntry {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    citizen_id: params.citizenId,
    pff_hash: params.pffHash,
    trust_score: params.trustScore,
    trust_level: params.trustLevel,
    verification_id: params.verificationId,
    verified_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    verification_count: 1,
    contexts: [params.context]
  };
}

