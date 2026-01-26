package fraud

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// FraudHandlers provides HTTP endpoints for fraud detection
type FraudHandlers struct {
	orchestrator *FraudOrchestrator
}

// NewFraudHandlers creates new fraud detection HTTP handlers
func NewFraudHandlers(orchestrator *FraudOrchestrator) *FraudHandlers {
	return &FraudHandlers{
		orchestrator: orchestrator,
	}
}

// RegisterRoutes registers all fraud detection routes
func (h *FraudHandlers) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/v1/fraud/check", h.HandleFraudCheck)
	mux.HandleFunc("/v1/fraud/velocity", h.HandleVelocityCheck)
	mux.HandleFunc("/v1/fraud/hardware", h.HandleHardwareAttestation)
	mux.HandleFunc("/v1/fraud/liveness", h.HandleLivenessCheck)
	mux.HandleFunc("/v1/fraud/challenge/verify", h.HandleVerifyChallenge)
}

// HandleFraudCheck handles POST /v1/fraud/check
func (h *FraudHandlers) HandleFraudCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req VerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	// Set timestamp if not provided
	if req.Timestamp.IsZero() {
		req.Timestamp = time.Now()
	}
	
	ctx := context.Background()
	result, err := h.orchestrator.PerformFraudCheck(ctx, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// HandleVelocityCheck handles POST /v1/fraud/velocity
func (h *FraudHandlers) HandleVelocityCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		DID       string  `json:\"did\"`
		Latitude  float64 `json:\"latitude\"`
		Longitude float64 `json:\"longitude\"`
		Location  string  `json:\"location\"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	result, err := h.orchestrator.velocityCheck.CheckVelocity(
		ctx,
		req.DID,
		req.Latitude,
		req.Longitude,
		req.Location,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// HandleHardwareAttestation handles POST /v1/fraud/hardware
func (h *FraudHandlers) HandleHardwareAttestation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var attestation DeviceAttestation
	if err := json.NewDecoder(r.Body).Decode(&attestation); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	result, err := h.orchestrator.hardwareAttestation.VerifyAttestation(ctx, &attestation)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// HandleLivenessCheck handles POST /v1/fraud/liveness
func (h *FraudHandlers) HandleLivenessCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var livenessData LivenessData
	if err := json.NewDecoder(r.Body).Decode(&livenessData); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	ctx := context.Background()
	result, err := h.orchestrator.aiLiveness.AnalyzeLiveness(ctx, &livenessData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// HandleVerifyChallenge handles POST /v1/fraud/challenge/verify
func (h *FraudHandlers) HandleVerifyChallenge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		ChallengeID       string       `json:\"challenge_id\"`
		ChallengeResponse string       `json:\"challenge_response\"`
		LivenessData      LivenessData `json:\"liveness_data\"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	
	// Update liveness data with challenge completion
	req.LivenessData.ChallengeCompleted = true
	req.LivenessData.ChallengeResponse = req.ChallengeResponse
	
	ctx := context.Background()
	result, err := h.orchestrator.aiLiveness.AnalyzeLiveness(ctx, &req.LivenessData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"challenge_id":     req.ChallengeID,
		"challenge_passed": result.Passed,
		"liveness_result":  result,
	})
}

