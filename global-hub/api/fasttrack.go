package api

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sovrn-protocol/sovrn/hub/api/billing"
	"github.com/sovrn-protocol/sovrn/hub/api/cache"
	"github.com/sovrn-protocol/sovrn/hub/api/zkproof"
)

// FastTrackService provides high-performance traveler verification
// with ZK-proof privacy, temporal trust caching, and revenue events
type FastTrackService struct {
	// zkEngine handles Zero-Knowledge Proof verification with National Spokes
	zkEngine *zkproof.ZKProofEngine
	
	// trustCache provides 24-hour temporal trust caching
	trustCache *cache.TemporalTrustCache
	
	// revenueEngine handles billing events for carriers
	revenueEngine *billing.RevenueEventEngine
	
	// Performance target: sub-second response time
	targetResponseTime time.Duration
}

// VerifyTravelerRequest contains biometric hash and carrier information
type VerifyTravelerRequest struct {
	BiometricHash  string
	CarrierID      string
	CheckpointType string
	FlightNumber   string
	RequestID      string
}

// VerifyTravelerResponse contains verification result and trust information
type VerifyTravelerResponse struct {
	Success          bool
	TrustScore       int32
	TrustLevel       string
	Cached           bool
	CacheExpiresAt   string
	VerificationID   string
	ResponseTimeMs   int64
	ZKPProofValid    bool
	BillingEventID   string
	Message          string
}

// NewFastTrackService creates a new fast-track service
func NewFastTrackService(
	zkEngine *zkproof.ZKProofEngine,
	trustCache *cache.TemporalTrustCache,
	revenueEngine *billing.RevenueEventEngine,
) *FastTrackService {
	return &FastTrackService{
		zkEngine:           zkEngine,
		trustCache:         trustCache,
		revenueEngine:      revenueEngine,
		targetResponseTime: 1 * time.Second, // Sub-second target
	}
}

// VerifyTraveler performs privacy-preserving biometric verification
// This is the main entry point for fast-track verification
func (fts *FastTrackService) VerifyTraveler(
	ctx context.Context,
	req *VerifyTravelerRequest,
) (*VerifyTravelerResponse, error) {
	startTime := time.Now()
	
	// Generate verification ID
	verificationID := uuid.New().String()
	
	// 1. Check Temporal Trust Cache (24-hour cache)
	if cachedEntry, exists := fts.trustCache.Get(ctx, req.BiometricHash); exists {
		// CACHE HIT: Sub-millisecond response!
		responseTime := time.Since(startTime).Milliseconds()
		
		// Update cache with new checkpoint
		fts.trustCache.Update(ctx, req.BiometricHash, req.CheckpointType, req.CarrierID)
		
		// Create billing event (1 SOV charge)
		billingEvent, _ := fts.revenueEngine.CreateBillingEvent(
			ctx,
			req.CarrierID,
			verificationID,
			req.CheckpointType,
		)
		
		return &VerifyTravelerResponse{
			Success:          true,
			TrustScore:       cachedEntry.TrustScore,
			TrustLevel:       cachedEntry.TrustLevel,
			Cached:           true,
			CacheExpiresAt:   cachedEntry.ExpiresAt.Format(time.RFC3339),
			VerificationID:   verificationID,
			ResponseTimeMs:   responseTime,
			ZKPProofValid:    true, // Already validated in initial verification
			BillingEventID:   billingEvent.EventID,
			Message:          fmt.Sprintf("Verified from temporal cache (zero-latency, checkpoint: %s)", req.CheckpointType),
		}, nil
	}
	
	// 2. CACHE MISS: Perform ZK-Proof Handshake with National Spoke
	// This asks: "Does this hash exist?" WITHOUT revealing identity
	spokeID := fts.determineSpokeID(req.CarrierID)
	
	zkResponse, err := fts.zkEngine.VerifyWithSpoke(req.BiometricHash, spokeID)
	if err != nil {
		return &VerifyTravelerResponse{
			Success:        false,
			TrustScore:     0,
			TrustLevel:     "very_low",
			Cached:         false,
			VerificationID: verificationID,
			ResponseTimeMs: time.Since(startTime).Milliseconds(),
			ZKPProofValid:  false,
			Message:        fmt.Sprintf("ZK-proof verification failed: %v", err),
		}, nil
	}
	
	// 3. Check if hash exists in spoke registry
	if !zkResponse.Exists {
		return &VerifyTravelerResponse{
			Success:        false,
			TrustScore:     0,
			TrustLevel:     "very_low",
			Cached:         false,
			VerificationID: verificationID,
			ResponseTimeMs: time.Since(startTime).Milliseconds(),
			ZKPProofValid:  true,
			Message:        "Traveler not found in registry",
		}, nil
	}
	
	// 4. Calculate Trust Score from privacy-preserving indicators
	trustScore, trustLevel := fts.calculateTrustScore(zkResponse.TrustIndicators)
	
	// 5. Cache the result for 24 hours (Temporal Trust)
	cacheEntry := &cache.TrustCacheEntry{
		BiometricHash:     req.BiometricHash,
		TrustScore:        trustScore,
		TrustLevel:        trustLevel,
		VerificationID:    verificationID,
		VerifiedAt:        time.Now(),
		VerificationCount: 1,
		Checkpoints:       []string{req.CheckpointType},
		CarrierIDs:        []string{req.CarrierID},
	}
	
	if err := fts.trustCache.Set(ctx, cacheEntry); err != nil {
		// Log error but don't fail the verification
		fmt.Printf("Failed to cache trust entry: %v\n", err)
	}
	
	// 6. Create Billing Event (1 SOV charge to carrier)
	billingEvent, err := fts.revenueEngine.CreateBillingEvent(
		ctx,
		req.CarrierID,
		verificationID,
		req.CheckpointType,
	)
	if err != nil {
		// Log error but don't fail the verification
		fmt.Printf("Failed to create billing event: %v\n", err)
	}
	
	// 7. Calculate total response time
	responseTime := time.Since(startTime).Milliseconds()
	
	// 8. Check if we met performance target
	if responseTime > fts.targetResponseTime.Milliseconds() {
		fmt.Printf("WARNING: Response time %dms exceeded target %dms\n", 
			responseTime, fts.targetResponseTime.Milliseconds())
	}
	
	return &VerifyTravelerResponse{
		Success:          true,
		TrustScore:       trustScore,
		TrustLevel:       trustLevel,
		Cached:           false,
		CacheExpiresAt:   cacheEntry.ExpiresAt.Format(time.RFC3339),
		VerificationID:   verificationID,
		ResponseTimeMs:   responseTime,
		ZKPProofValid:    true,
		BillingEventID:   billingEvent.EventID,
		Message:          fmt.Sprintf("Live verification completed and cached (checkpoint: %s)", req.CheckpointType),
	}, nil
}

// GetTrustStatus checks if a traveler has valid cached trust
func (fts *FastTrackService) GetTrustStatus(
	ctx context.Context,
	biometricHash string,
	carrierID string,
) (*TrustStatusResponse, error) {
	// Check cache
	entry, exists := fts.trustCache.Get(ctx, biometricHash)
	if !exists {
		return &TrustStatusResponse{
			HasValidTrust: false,
			Message:       "No cached trust found",
		}, nil
	}

	return &TrustStatusResponse{
		HasValidTrust:     true,
		TrustScore:        entry.TrustScore,
		TrustLevel:        entry.TrustLevel,
		CacheExpiresAt:    entry.ExpiresAt.Format(time.RFC3339),
		VerificationCount: int32(entry.VerificationCount),
		LastVerifiedAt:    entry.VerifiedAt.Format(time.RFC3339),
		Message:           "Valid cached trust found",
	}, nil
}

// TrustStatusResponse contains cached trust information
type TrustStatusResponse struct {
	HasValidTrust     bool
	TrustScore        int32
	TrustLevel        string
	CacheExpiresAt    string
	VerificationCount int32
	LastVerifiedAt    string
	Message           string
}

// InvalidateTrust manually invalidates cached trust
func (fts *FastTrackService) InvalidateTrust(
	ctx context.Context,
	biometricHash string,
	reason string,
) error {
	return fts.trustCache.Delete(ctx, biometricHash)
}

// calculateTrustScore computes trust score from privacy-preserving indicators
// These indicators are AGGREGATED/BUCKETED to prevent identity inference
func (fts *FastTrackService) calculateTrustScore(indicators map[string]string) (int32, string) {
	score := int32(0)

	// Factor 1: Verification History (0-40 points)
	switch indicators["verification_count"] {
	case "very_high": // 50+ verifications
		score += 40
	case "high": // 20-49 verifications
		score += 35
	case "medium": // 10-19 verifications
		score += 25
	case "low": // 5-9 verifications
		score += 15
	case "very_low": // 1-4 verifications
		score += 10
	default: // none
		score += 0
	}

	// Factor 2: Recency (0-30 points)
	switch indicators["last_verified"] {
	case "very_recent": // < 1 hour
		score += 30
	case "recent": // < 6 hours
		score += 25
	case "moderate": // < 24 hours
		score += 20
	case "old": // < 1 week
		score += 10
	default: // never
		score += 0
	}

	// Factor 3: Risk Level (0-30 points)
	switch indicators["risk_level"] {
	case "very_low":
		score += 30
	case "low":
		score += 25
	case "medium":
		score += 15
	case "high":
		score += 5
	case "very_high":
		score += 0
	default: // unknown
		score += 15
	}

	// Determine trust level
	var trustLevel string
	switch {
	case score >= 85:
		trustLevel = "very_high"
	case score >= 70:
		trustLevel = "high"
	case score >= 50:
		trustLevel = "medium"
	case score >= 30:
		trustLevel = "low"
	default:
		trustLevel = "very_low"
	}

	return score, trustLevel
}

// determineSpokeID determines which National Spoke to query based on carrier
// In production, this would use a routing table or DID resolution
func (fts *FastTrackService) determineSpokeID(carrierID string) string {
	// Mock implementation: Extract spoke from carrier ID
	// Format: "airline:AA" -> "nigeria", "airport:LOS" -> "nigeria"

	// In production, use a routing table:
	// - "airline:AA" (American Airlines) -> "usa"
	// - "airline:BA" (British Airways) -> "uk"
	// - "airport:LOS" (Lagos) -> "nigeria"
	// - "airport:NBO" (Nairobi) -> "kenya"

	// For now, default to Nigeria
	return "nigeria"
}

// GetServiceStats returns service statistics
func (fts *FastTrackService) GetServiceStats(ctx context.Context) map[string]interface{} {
	cacheStats := fts.trustCache.GetStats()
	revenueStats := fts.revenueEngine.GetRevenueStats(ctx)

	return map[string]interface{}{
		"cache":   cacheStats,
		"revenue": revenueStats,
		"performance": map[string]interface{}{
			"target_response_time_ms": fts.targetResponseTime.Milliseconds(),
		},
	}
}

