/**
 * SOVRA Protocol - Branding and Protocol Constants
 */

// ============================================================================
// BRANDING CONSTANTS
// ============================================================================

/**
 * Protocol Name
 * SOVRA = Sovereign Presence Architecture
 */
export const PROTOCOL_NAME = 'SOVRA';

/**
 * Protocol Full Name
 */
export const PROTOCOL_FULL_NAME = 'Sovereign Presence Architecture';

/**
 * Protocol Tagline
 */
export const PROTOCOL_TAGLINE = 'Unified Presence & Sovereignty Protocol';

/**
 * Component Names
 */
export const COMPONENT_PFF = 'PFF'; // Presence Factor Fabric
export const COMPONENT_SOVRN = 'SOVRN'; // Decentralized Identity & Consent Management

/**
 * Token Name
 */
export const TOKEN_NAME = 'SOV';
export const TOKEN_MICRO_DENOM = 'uSOV';

// ============================================================================
// API HEADER CONSTANTS
// ============================================================================

/**
 * SOVRA API Headers
 * All custom API headers should use the SOVRA- prefix
 */
export const API_HEADERS = {
  // Verification Headers
  VERIFICATION_SUCCESS: 'SOVRA-Verification-Success',
  VERIFICATION_STATUS: 'SOVRA-Verification-Status',
  VERIFICATION_ID: 'SOVRA-Verification-ID',
  
  // Trust Score Headers
  TRUST_SCORE: 'SOVRA-Trust-Score',
  TRUST_LEVEL: 'SOVRA-Trust-Level',
  
  // Liveness Headers
  LIVENESS_CONFIRMED: 'SOVRA-Liveness-Confirmed',
  LIVENESS_CONFIDENCE: 'SOVRA-Liveness-Confidence',
  LIVENESS_ATTESTATION: 'SOVRA-Liveness-Attestation',
  
  // Fraud Detection Headers
  FRAUD_CHECK_STATUS: 'SOVRA-Fraud-Check-Status',
  FRAUD_RISK_LEVEL: 'SOVRA-Fraud-Risk-Level',
  FRAUD_CHALLENGE_REQUIRED: 'SOVRA-Fraud-Challenge-Required',
  
  // Billing Headers
  BILLING_BALANCE: 'SOVRA-Billing-Balance',
  BILLING_TRANSACTION_ID: 'SOVRA-Billing-Transaction-ID',
  
  // Cache Headers
  CACHE_STATUS: 'SOVRA-Cache-Status',
  CACHE_EXPIRES_AT: 'SOVRA-Cache-Expires-At',
  
  // Protocol Headers
  PROTOCOL_VERSION: 'SOVRA-Protocol-Version',
  SPOKE_ID: 'SOVRA-Spoke-ID',
} as const;

// ============================================================================
// PROTOCOL VERSION
// ============================================================================

export const PROTOCOL_VERSION = '1.0.0';

// ============================================================================
// TOKEN ECONOMICS CONSTANTS
// ============================================================================

/**
 * Token Denominations
 */
export const TOKEN_DENOMINATIONS = {
  SOV_TO_USOV: 1_000_000, // 1 SOV = 1,000,000 uSOV
  USOV_TO_SOV: 0.000001,  // 1 uSOV = 0.000001 SOV
} as const;

/**
 * Default Minting Rates (can be customized per spoke)
 */
export const DEFAULT_MINTING_RATES = {
  PFF_VERIFICATION: 1.0,  // 1 SOV per verification
  CONSENT_GRANTED: 1.0,   // 1 SOV per consent
} as const;

// ============================================================================
// VERIFICATION PRICING (Multi-Party Settlement)
// ============================================================================

/**
 * Verification Event Pricing in SOV
 */
export const VERIFICATION_PRICING = {
  AIRPORT_CHECKPOINT: 1,   // 1 SOV
  BOARDING_GATE: 10,       // 10 SOV
  DUAL_PURPOSE: 11,        // 11 SOV (split 20/80)
} as const;

// ============================================================================
// FRAUD DETECTION THRESHOLDS
// ============================================================================

/**
 * Fraud Detection Configuration
 */
export const FRAUD_DETECTION = {
  // Velocity Check
  MAX_TRAVEL_SPEED_KMH: 990,  // Maximum plane speed
  
  // AI Liveness
  DEEPFAKE_CONFIDENCE_THRESHOLD: 0.999,  // 99.9%
  LIVENESS_CONFIDENCE_THRESHOLD: 0.95,   // 95%
  
  // Hardware Attestation
  REQUIRE_SECURE_ENCLAVE: true,
  REJECT_EMULATORS: true,
  REJECT_ROOTED_DEVICES: true,
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Cache TTL Configuration
 */
export const CACHE_TTL = {
  TRUST_SCORE: 24 * 60 * 60 * 1000,  // 24 hours in milliseconds
  VERIFICATION: 60 * 60 * 1000,       // 1 hour in milliseconds
} as const;

