package liveness

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// LivenessHandlers provides HTTP endpoints for liveness attestation
type LivenessHandlers struct {
	attestationService *AttestationService
}

// NewLivenessHandlers creates new liveness attestation HTTP handlers
func NewLivenessHandlers(service *AttestationService) *LivenessHandlers {
	return &LivenessHandlers{
		attestationService: service,
	}
}

// RegisterRoutes registers all liveness attestation routes
func (h *LivenessHandlers) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/v1/liveness/attest", h.HandleAttestation)
	mux.HandleFunc("/v1/liveness/verify", h.HandleVerifyAttestation)
	mux.HandleFunc("/v1/liveness/query", h.HandleQueryAttestation)
}

// AttestationRequest represents a liveness attestation request
type AttestationRequest struct {
	AttestationHash    string  `json:"attestation_hash"`
	LivenessConfirmed  bool    `json:"liveness_confirmed"`
	OverallConfidence  float64 `json:"overall_confidence"`
	TextureHash        string  `json:"texture_hash"`
	PulseHash          string  `json:"pulse_hash"`
	DeviceID           string  `json:"device_id"`
	NPUModel           string  `json:"npu_model"`
	CaptureTimestamp   int64   `json:"capture_timestamp"`
	AnalysisTimestamp  int64   `json:"analysis_timestamp"`
}

// AttestationResponse represents the response after anchoring
type AttestationResponse struct {
	Success         bool   `json:"success"`
	TransactionHash string `json:"transaction_hash"`
	BlockHeight     int64  `json:"block_height"`
	AnchoredAt      int64  `json:"anchored_at"`
	Message         string `json:"message"`
}

// HandleAttestation handles POST /v1/liveness/attest
// Receives liveness attestation and anchors it to blockchain
func (h *LivenessHandlers) HandleAttestation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AttestationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	// Validate attestation
	if err := h.validateAttestation(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid attestation: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	// Anchor attestation to blockchain
	result, err := h.attestationService.AnchorAttestation(ctx, &req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to anchor attestation: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// HandleVerifyAttestation handles POST /v1/liveness/verify
// Verifies an attestation hash against blockchain
func (h *LivenessHandlers) HandleVerifyAttestation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		AttestationHash string `json:"attestation_hash"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	// Verify attestation
	result, err := h.attestationService.VerifyAttestation(ctx, req.AttestationHash)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to verify attestation: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// HandleQueryAttestation handles GET /v1/liveness/query?device_id=xxx
// Queries attestations for a device
func (h *LivenessHandlers) HandleQueryAttestation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		http.Error(w, "device_id parameter required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	// Query attestations
	attestations, err := h.attestationService.QueryAttestations(ctx, deviceID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to query attestations: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"device_id":    deviceID,
		"count":        len(attestations),
		"attestations": attestations,
	})
}

// validateAttestation validates the attestation request
func (h *LivenessHandlers) validateAttestation(req *AttestationRequest) error {
	// Validate attestation hash format
	if len(req.AttestationHash) != 64 {
		return fmt.Errorf("invalid attestation hash length: expected 64, got %d", len(req.AttestationHash))
	}

	// Validate confidence range
	if req.OverallConfidence < 0.0 || req.OverallConfidence > 1.0 {
		return fmt.Errorf("invalid confidence: must be between 0.0 and 1.0")
	}

	// Validate timestamps
	if req.CaptureTimestamp <= 0 || req.AnalysisTimestamp <= 0 {
		return fmt.Errorf("invalid timestamps")
	}

	// Verify attestation hash integrity
	expectedHash := h.calculateAttestationHash(req)
	if expectedHash != req.AttestationHash {
		return fmt.Errorf("attestation hash mismatch: integrity check failed")
	}

	return nil
}

// calculateAttestationHash recalculates the attestation hash for verification
func (h *LivenessHandlers) calculateAttestationHash(req *AttestationRequest) string {
	data := fmt.Sprintf("%s:%s:%s:%d:%t:%.3f",
		req.TextureHash,
		req.PulseHash,
		req.DeviceID,
		req.CaptureTimestamp,
		req.LivenessConfirmed,
		req.OverallConfidence,
	)

	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

