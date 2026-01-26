package shared

// ============================================================================
// SOVRA Protocol - Branding and Protocol Constants
// ============================================================================

const (
	// PROTOCOL_NAME is the unified protocol name
	// SOVRA = Sovereign Presence Architecture
	PROTOCOL_NAME = "SOVRA"

	// PROTOCOL_FULL_NAME is the full protocol name
	PROTOCOL_FULL_NAME = "Sovereign Presence Architecture"

	// PROTOCOL_TAGLINE is the protocol tagline
	PROTOCOL_TAGLINE = "Unified Presence & Sovereignty Protocol"

	// COMPONENT_PFF is the Presence Factor Fabric component name
	COMPONENT_PFF = "PFF"

	// COMPONENT_SOVRN is the decentralized identity component name
	COMPONENT_SOVRN = "SOVRN"

	// TOKEN_NAME is the token name
	TOKEN_NAME = "SOV"

	// TOKEN_MICRO_DENOM is the micro denomination
	TOKEN_MICRO_DENOM = "uSOV"

	// PROTOCOL_VERSION is the current protocol version
	PROTOCOL_VERSION = "1.0.0"
)

// ============================================================================
// API Header Constants
// ============================================================================

const (
	// Verification Headers
	HEADER_VERIFICATION_SUCCESS = "SOVRA-Verification-Success"
	HEADER_VERIFICATION_STATUS  = "SOVRA-Verification-Status"
	HEADER_VERIFICATION_ID      = "SOVRA-Verification-ID"

	// Trust Score Headers
	HEADER_TRUST_SCORE = "SOVRA-Trust-Score"
	HEADER_TRUST_LEVEL = "SOVRA-Trust-Level"

	// Liveness Headers
	HEADER_LIVENESS_CONFIRMED   = "SOVRA-Liveness-Confirmed"
	HEADER_LIVENESS_CONFIDENCE  = "SOVRA-Liveness-Confidence"
	HEADER_LIVENESS_ATTESTATION = "SOVRA-Liveness-Attestation"

	// Fraud Detection Headers
	HEADER_FRAUD_CHECK_STATUS       = "SOVRA-Fraud-Check-Status"
	HEADER_FRAUD_RISK_LEVEL         = "SOVRA-Fraud-Risk-Level"
	HEADER_FRAUD_CHALLENGE_REQUIRED = "SOVRA-Fraud-Challenge-Required"

	// Billing Headers
	HEADER_BILLING_BALANCE        = "SOVRA-Billing-Balance"
	HEADER_BILLING_TRANSACTION_ID = "SOVRA-Billing-Transaction-ID"

	// Cache Headers
	HEADER_CACHE_STATUS     = "SOVRA-Cache-Status"
	HEADER_CACHE_EXPIRES_AT = "SOVRA-Cache-Expires-At"

	// Protocol Headers
	HEADER_PROTOCOL_VERSION = "SOVRA-Protocol-Version"
	HEADER_SPOKE_ID         = "SOVRA-Spoke-ID"
)

// ============================================================================
// Token Economics Constants
// ============================================================================

const (
	// SOV_TO_USOV is the conversion rate from SOV to uSOV
	SOV_TO_USOV = 1_000_000

	// DEFAULT_MINT_PER_VERIFICATION is the default amount minted per verification
	DEFAULT_MINT_PER_VERIFICATION = 10 // 10 uSOV

	// DEFAULT_VERIFICATION_FEE is the default verification fee
	DEFAULT_VERIFICATION_FEE = 5_000_000 // 5 SOV in uSOV
)

// ============================================================================
// Verification Pricing (Multi-Party Settlement)
// ============================================================================

const (
	// PRICE_AIRPORT_CHECKPOINT is the price for airport checkpoint verification
	PRICE_AIRPORT_CHECKPOINT = 1_000_000 // 1 SOV in uSOV

	// PRICE_BOARDING_GATE is the price for boarding gate verification
	PRICE_BOARDING_GATE = 10_000_000 // 10 SOV in uSOV

	// PRICE_DUAL_PURPOSE is the price for dual-purpose verification
	PRICE_DUAL_PURPOSE = 11_000_000 // 11 SOV in uSOV
)

// ============================================================================
// Fraud Detection Thresholds
// ============================================================================

const (
	// MAX_TRAVEL_SPEED_KMH is the maximum travel speed for velocity checks
	MAX_TRAVEL_SPEED_KMH = 990.0 // km/h

	// DEEPFAKE_CONFIDENCE_THRESHOLD is the minimum confidence for deepfake detection
	DEEPFAKE_CONFIDENCE_THRESHOLD = 0.999 // 99.9%

	// LIVENESS_CONFIDENCE_THRESHOLD is the minimum confidence for liveness detection
	LIVENESS_CONFIDENCE_THRESHOLD = 0.95 // 95%
)

// ============================================================================
// Cache Configuration
// ============================================================================

const (
	// CACHE_TTL_TRUST_SCORE is the TTL for trust score cache (24 hours in seconds)
	CACHE_TTL_TRUST_SCORE = 24 * 60 * 60

	// CACHE_TTL_VERIFICATION is the TTL for verification cache (1 hour in seconds)
	CACHE_TTL_VERIFICATION = 60 * 60
)

