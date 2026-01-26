package geofence

import (
	"context"
	"fmt"
	"time"
)

/**
 * SOVRA_Sovereign_Kernel - Geofenced Security Protocol Orchestrator
 * 
 * Core ledger security function that coordinates:
 * 1. Zone Logic - GPS coordinate checking
 * 2. Step-up Authentication - Enhanced PFF for high-risk zones
 * 3. Watchlist Monitoring - Instant alerts for flagged DIDs
 */

// GeofenceOrchestrator coordinates all geofencing security functions
type GeofenceOrchestrator struct {
	geofenceService *GeofenceService
	stepUpService   *StepUpAuthService
	watchlistService *WatchlistService
}

// VerificationRequest represents a PFF verification request with location
type VerificationRequest struct {
	VerificationID  string
	DID             string
	Latitude        float64
	Longitude       float64
	LocationName    string
	Timestamp       time.Time
	
	// PFF data
	BiometricHash   string
	LivenessData    []byte
	VideoFrames     []byte
	DepthData       []byte
}

// GeofenceCheckResult contains the complete geofencing analysis
type GeofenceCheckResult struct {
	// Zone detection
	InSecurityZone  bool
	SecurityZone    *SecurityZone
	
	// Step-up requirements
	RequiresStepUp  bool
	PFFLevel        PFFLevel
	Challenge       *MovementChallenge
	Require3DDepth  bool
	RequireMovement bool
	
	// Watchlist
	OnWatchlist     bool
	WatchlistEntry  *WatchlistEntry
	AlertTriggered  bool
	AlertID         string
	
	// Overall result
	Passed          bool
	Reason          string
	ProcessingTimeMs int64
}

// NewGeofenceOrchestrator creates a new geofence orchestrator
func NewGeofenceOrchestrator(encryptionKey []byte) *GeofenceOrchestrator {
	geofenceService := NewGeofenceService()
	stepUpService := NewStepUpAuthService(geofenceService)
	watchlistService := NewWatchlistService(encryptionKey)
	
	return &GeofenceOrchestrator{
		geofenceService:  geofenceService,
		stepUpService:    stepUpService,
		watchlistService: watchlistService,
	}
}

// PerformGeofenceCheck runs all geofencing security checks
func (go_orch *GeofenceOrchestrator) PerformGeofenceCheck(
	ctx context.Context,
	req *VerificationRequest,
) (*GeofenceCheckResult, error) {
	
	startTime := time.Now()
	
	// 1. ZONE LOGIC: Check if coordinates are in a security zone
	zone, inZone := go_orch.geofenceService.CheckSecurityZone(req.Latitude, req.Longitude)
	
	// 2. STEP-UP AUTHENTICATION: Determine PFF requirements
	stepUpReq, err := go_orch.stepUpService.CheckStepUpRequirement(
		ctx,
		req.Latitude,
		req.Longitude,
		req.DID,
	)
	if err != nil {
		return nil, fmt.Errorf("step-up check failed: %w", err)
	}
	
	// 3. WATCHLIST MONITORING: Check if DID is flagged
	onWatchlist, watchlistEntry := go_orch.watchlistService.IsOnWatchlist(req.DID)
	
	// 4. INSTANT ALERT: Trigger if watchlist DID in security zone
	alertTriggered := false
	alertID := ""
	
	if onWatchlist && inZone && zone.WatchlistMonitoring {
		err := go_orch.watchlistService.CheckAndAlert(
			ctx,
			req.DID,
			req.Latitude,
			req.Longitude,
			req.LocationName,
			zone,
			req.VerificationID,
		)
		
		if err == nil {
			alertTriggered = true
			alertID = fmt.Sprintf("alert_%d", time.Now().UnixNano())
		}
	}
	
	// 5. DETERMINE OVERALL RESULT
	passed := true
	reason := "Geofence check passed"
	
	// If in high-risk zone, verification must meet enhanced requirements
	if inZone && stepUpReq.Required {
		// Check if request includes required data
		if stepUpReq.Require3DDepth && len(req.DepthData) == 0 {
			passed = false
			reason = "3D depth data required for this security zone"
		}
		
		if stepUpReq.RequireMovement && len(req.VideoFrames) == 0 {
			passed = false
			reason = "Video frames required for movement challenge"
		}
	}
	
	processingTime := time.Since(startTime).Milliseconds()
	
	return &GeofenceCheckResult{
		InSecurityZone:   inZone,
		SecurityZone:     zone,
		RequiresStepUp:   stepUpReq.Required,
		PFFLevel:         stepUpReq.PFFLevel,
		Challenge:        stepUpReq.Challenge,
		Require3DDepth:   stepUpReq.Require3DDepth,
		RequireMovement:  stepUpReq.RequireMovement,
		OnWatchlist:      onWatchlist,
		WatchlistEntry:   watchlistEntry,
		AlertTriggered:   alertTriggered,
		AlertID:          alertID,
		Passed:           passed,
		Reason:           reason,
		ProcessingTimeMs: processingTime,
	}, nil
}

// GetAlertChannel returns the channel for security alerts
func (go_orch *GeofenceOrchestrator) GetAlertChannel() <-chan SecurityAlert {
	return go_orch.watchlistService.GetAlertChannel()
}

