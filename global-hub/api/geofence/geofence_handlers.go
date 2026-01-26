package geofence

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

/**
 * SOVRA_Sovereign_Kernel - Geofence API Handlers
 * 
 * HTTP endpoints for geofenced security protocol
 */

// GeofenceHandler handles HTTP requests for geofencing
type GeofenceHandler struct {
	orchestrator *GeofenceOrchestrator
}

// NewGeofenceHandler creates a new geofence handler
func NewGeofenceHandler(encryptionKey []byte) *GeofenceHandler {
	return &GeofenceHandler{
		orchestrator: NewGeofenceOrchestrator(encryptionKey),
	}
}

// CheckZoneRequest represents the request body for zone checking
type CheckZoneRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// CheckZoneResponse represents the response for zone checking
type CheckZoneResponse struct {
	InSecurityZone  bool          `json:"in_security_zone"`
	SecurityZone    *SecurityZone `json:"security_zone,omitempty"`
	RequiredPFFLevel int          `json:"required_pff_level"`
	Message         string        `json:"message"`
}

// VerifyWithGeofenceRequest represents a verification request with geofencing
type VerifyWithGeofenceRequest struct {
	VerificationID string  `json:"verification_id"`
	DID            string  `json:"did"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	LocationName   string  `json:"location_name"`
	BiometricHash  string  `json:"biometric_hash"`
	LivenessData   string  `json:"liveness_data"` // Base64 encoded
	VideoFrames    string  `json:"video_frames,omitempty"` // Base64 encoded
	DepthData      string  `json:"depth_data,omitempty"`   // Base64 encoded
}

// VerifyWithGeofenceResponse represents the verification response
type VerifyWithGeofenceResponse struct {
	Success          bool              `json:"success"`
	InSecurityZone   bool              `json:"in_security_zone"`
	SecurityZone     string            `json:"security_zone,omitempty"`
	RequiredPFFLevel int               `json:"required_pff_level"`
	Challenge        *MovementChallenge `json:"challenge,omitempty"`
	OnWatchlist      bool              `json:"on_watchlist"`
	AlertTriggered   bool              `json:"alert_triggered"`
	Message          string            `json:"message"`
	ProcessingTimeMs int64             `json:"processing_time_ms"`
}

// HandleCheckZone checks if coordinates are in a security zone
// POST /api/v1/geofence/check-zone
func (gh *GeofenceHandler) HandleCheckZone(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req CheckZoneRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Check security zone
	zone, inZone := gh.orchestrator.geofenceService.CheckSecurityZone(req.Latitude, req.Longitude)
	
	response := CheckZoneResponse{
		InSecurityZone:   inZone,
		RequiredPFFLevel: 1, // Default
		Message:          "Location not in security zone",
	}
	
	if inZone {
		response.SecurityZone = zone
		response.RequiredPFFLevel = zone.RequiredPFFLevel
		response.Message = fmt.Sprintf("Security zone detected: %s", zone.GetZoneInfo())
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleVerifyWithGeofence performs verification with geofencing checks
// POST /api/v1/geofence/verify
func (gh *GeofenceHandler) HandleVerifyWithGeofence(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req VerifyWithGeofenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Create verification request
	verifyReq := &VerificationRequest{
		VerificationID: req.VerificationID,
		DID:            req.DID,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		LocationName:   req.LocationName,
		BiometricHash:  req.BiometricHash,
		Timestamp:      time.Now(),
		// In production, decode base64 data
		LivenessData:   []byte(req.LivenessData),
		VideoFrames:    []byte(req.VideoFrames),
		DepthData:      []byte(req.DepthData),
	}
	
	// Perform geofence check
	result, err := gh.orchestrator.PerformGeofenceCheck(r.Context(), verifyReq)
	if err != nil {
		http.Error(w, fmt.Sprintf("Geofence check failed: %v", err), http.StatusInternalServerError)
		return
	}
	
	// Build response
	response := VerifyWithGeofenceResponse{
		Success:          result.Passed,
		InSecurityZone:   result.InSecurityZone,
		RequiredPFFLevel: int(result.PFFLevel),
		Challenge:        result.Challenge,
		OnWatchlist:      result.OnWatchlist,
		AlertTriggered:   result.AlertTriggered,
		Message:          result.Reason,
		ProcessingTimeMs: result.ProcessingTimeMs,
	}
	
	if result.SecurityZone != nil {
		response.SecurityZone = result.SecurityZone.GetZoneInfo()
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("SOVRA-Geofence-Check", "true")
	
	if result.AlertTriggered {
		w.Header().Set("SOVRA-Security-Alert", result.AlertID)
	}
	
	json.NewEncoder(w).Encode(response)
}

