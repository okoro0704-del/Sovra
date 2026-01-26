/**
 * Shared TypeScript types for SOVRN Protocol
 */

export type CitizenStatus = 'active' | 'suspended' | 'revoked';
export type EntityStatus = 'active' | 'suspended' | 'revoked';
export type ConsentStatus = 'granted' | 'denied' | 'expired';
export type TierLevel = 'tier1' | 'tier2' | 'tier3';

export interface CitizenRegistry {
  id: string;
  pff_hash: string;
  nin_hash: string;
  status: CitizenStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RegisteredEntity {
  id: string;
  org_name: string;
  tier_level: TierLevel;
  api_key_hash: string;
  admin_pff_hash: string;
  status: EntityStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConsentLog {
  id: string;
  citizen_id: string;
  requester_id: string;
  data_scope: string;
  biometric_signature: string;
  timestamp: string;
  status: ConsentStatus;
  metadata?: Record<string, any>;
}

export interface VerifyRequest {
  pff_hash: string;
  nin_hash?: string;
  requester_id: string;
  data_scope: string;
}

export interface VerifyResponse {
  success: boolean;
  challenge_token: string;
  expires_at: string;
  message?: string;
}

export interface ConsentRequest {
  challenge_token: string;
  biometric_signature: string;
  pff_hash: string;
}

export interface ConsentResponse {
  success: boolean;
  consent_id?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

// ============================================================================
// Fast-Track API Types
// ============================================================================

export type TrustScoreLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
export type LivenessCheckStatus = 'passed' | 'failed' | 'suspicious';
export type VerificationSource = 'cache' | 'live' | 'hub';

/**
 * Fast-Track Verification Request
 * For high-priority clients (Airport Security, Border Control, etc.)
 */
export interface FastTrackVerifyRequest {
  pff_hash: string;
  requester_id: string;
  context: string; // e.g., 'airport_security', 'border_control', 'hospital_emergency'
  liveness_data?: string; // Optional liveness check data
  priority_level?: 'critical' | 'high' | 'normal';
}

/**
 * Fast-Track Verification Response
 * Must be returned within 500ms
 */
export interface FastTrackVerifyResponse {
  success: boolean;
  trust_score: number; // 0-100 scale
  trust_level: TrustScoreLevel;
  verification_id: string;
  citizen_id?: string;
  cached: boolean; // True if from temporal cache
  cache_expires_at?: string; // ISO timestamp
  liveness_check?: LivenessCheckStatus;
  response_time_ms: number;
  message?: string;
}

/**
 * Trust Score Calculation Factors
 */
export interface TrustScoreFactors {
  verification_history_score: number; // 0-30 points
  recency_score: number; // 0-20 points
  liveness_check_score: number; // 0-25 points
  risk_indicators_score: number; // 0-25 points
  total_score: number; // 0-100
}

/**
 * Temporal Cache Entry
 * Stores verified user data for 24 hours
 */
export interface TemporalCacheEntry {
  citizen_id: string;
  pff_hash: string;
  trust_score: number;
  trust_level: TrustScoreLevel;
  verification_id: string;
  verified_at: string;
  expires_at: string;
  verification_count: number; // Number of verifications in cache period
  contexts: string[]; // List of contexts where verified
}

/**
 * Fast-Track Status Request
 */
export interface FastTrackStatusRequest {
  citizen_id: string;
  requester_id: string;
}

/**
 * Fast-Track Status Response
 */
export interface FastTrackStatusResponse {
  success: boolean;
  cached: boolean;
  trust_score?: number;
  trust_level?: TrustScoreLevel;
  cache_expires_at?: string;
  verification_count?: number;
  last_verified_at?: string;
  message?: string;
}

/**
 * Hub-Spoke Handshake Message
 * Asynchronous communication between Global Hub and Spokes
 */
export interface HubSpokeHandshake {
  message_id: string;
  spoke_id: string; // e.g., 'nigeria', 'kenya'
  message_type: 'verification_request' | 'verification_response' | 'cache_sync' | 'trust_update';
  payload: Record<string, any>;
  timestamp: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

// ============================================================================
// SOV Token Types
// ============================================================================

export type MintingEventType = 'pff_verification' | 'consent_granted' | 'manual_mint';
export type TokenTransactionType = 'mint' | 'transfer' | 'burn' | 'stake';

/**
 * SOV Token Balance
 * Tracks citizen token holdings
 */
export interface SovTokenBalance {
  id: string;
  citizen_id: string;
  balance: string; // Using string to handle large decimal numbers
  staked_balance: string;
  created_at: string;
  updated_at: string;
}

/**
 * SOV Token Minting Event
 * Records when and why SOV tokens are minted
 */
export interface SovMintingEvent {
  id: string;
  citizen_id: string;
  consent_id?: string; // Reference to the consent log that triggered minting
  event_type: MintingEventType;
  amount: string; // Amount of SOV minted
  pff_verification_hash?: string;
  metadata?: Record<string, any>;
  minted_at: string;
}

/**
 * SOV Token Transaction
 * General ledger for all token movements
 */
export interface SovTokenTransaction {
  id: string;
  from_citizen_id?: string; // null for minting
  to_citizen_id?: string; // null for burning
  transaction_type: TokenTransactionType;
  amount: string;
  reference_id?: string; // Reference to minting event, consent, etc.
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Token Minting Request
 * API request to mint tokens based on PFF verification
 */
export interface TokenMintRequest {
  citizen_id: string;
  consent_id: string;
  amount?: string; // Optional: allow override for manual minting
}

/**
 * Token Minting Response
 */
export interface TokenMintResponse {
  success: boolean;
  minting_event_id?: string;
  amount_minted?: string;
  new_balance?: string;
  message?: string;
}
