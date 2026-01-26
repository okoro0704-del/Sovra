// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Access Control HTTP Handlers
//
// Implements REST API endpoints for professional access control system.
// Handles consent management, metadata access, and consultation contracts.

package access_control

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// AccessControlHandlers manages HTTP handlers for access control
type AccessControlHandlers struct {
	registry              *ProfessionalRegistry
	metadataController    *MetadataAccessController
	consultationContract  *ConsultationSmartContract
}

// NewAccessControlHandlers creates new access control handlers
func NewAccessControlHandlers(
	registry *ProfessionalRegistry,
	metadataController *MetadataAccessController,
	consultationContract *ConsultationSmartContract,
) *AccessControlHandlers {
	return &AccessControlHandlers{
		registry:             registry,
		metadataController:   metadataController,
		consultationContract: consultationContract,
	}
}

// GrantConsentRequest represents a consent grant request
type GrantConsentRequest struct {
	CitizenDID         string   `json:"citizen_did"`
	ProfessionalDID    string   `json:"professional_did"`
	RequestedFields    []string `json:"requested_fields"`
	Purpose            string   `json:"purpose"`
	BiometricSignature string   `json:"biometric_signature"` // Base64-encoded
}

// GrantConsentResponse represents a consent grant response
type GrantConsentResponse struct {
	Success   bool           `json:"success"`
	ConsentID string         `json:"consent_id,omitempty"`
	ExpiresAt time.Time      `json:"expires_at,omitempty"`
	Error     string         `json:"error,omitempty"`
}

// HandleGrantConsent handles POST /v1/access-control/consent/grant
func (ach *AccessControlHandlers) HandleGrantConsent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GrantConsentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(GrantConsentResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid request: %v", err),
		})
		return
	}

	// Get professional to determine role
	professional, err := ach.registry.GetProfessionalByDID(context.Background(), req.ProfessionalDID)
	if err != nil {
		json.NewEncoder(w).Encode(GrantConsentResponse{
			Success: false,
			Error:   fmt.Sprintf("Professional not found: %v", err),
		})
		return
	}

	// Grant consent
	consent, err := ach.metadataController.GrantConsent(
		context.Background(),
		req.CitizenDID,
		req.ProfessionalDID,
		professional.Role,
		req.RequestedFields,
		req.Purpose,
		[]byte(req.BiometricSignature),
	)

	if err != nil {
		json.NewEncoder(w).Encode(GrantConsentResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to grant consent: %v", err),
		})
		return
	}

	json.NewEncoder(w).Encode(GrantConsentResponse{
		Success:   true,
		ConsentID: consent.ConsentID,
		ExpiresAt: consent.ExpiresAt,
	})
}

// HireProfessionalRequest represents a consultation hire request
type HireProfessionalRequest struct {
	CitizenDID      string `json:"citizen_did"`
	ProfessionalDID string `json:"professional_did"`
	ServiceType     string `json:"service_type"`
	Description     string `json:"description"`
}

// HireProfessionalResponse represents a consultation hire response
type HireProfessionalResponse struct {
	Success      bool      `json:"success"`
	ContractID   string    `json:"contract_id,omitempty"`
	Fee          int64     `json:"fee,omitempty"`
	EscrowLocked bool      `json:"escrow_locked,omitempty"`
	Error        string    `json:"error,omitempty"`
}

// HandleHireProfessional handles POST /v1/access-control/consultation/hire
func (ach *AccessControlHandlers) HandleHireProfessional(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req HireProfessionalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(HireProfessionalResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid request: %v", err),
		})
		return
	}

	// Get professional
	professional, err := ach.registry.GetProfessionalByDID(context.Background(), req.ProfessionalDID)
	if err != nil {
		json.NewEncoder(w).Encode(HireProfessionalResponse{
			Success: false,
			Error:   fmt.Sprintf("Professional not found: %v", err),
		})
		return
	}

	// Create consultation contract
	contract, err := ach.consultationContract.HireProfessional(
		context.Background(),
		req.CitizenDID,
		req.ProfessionalDID,
		professional,
		req.ServiceType,
		req.Description,
	)

	if err != nil {
		json.NewEncoder(w).Encode(HireProfessionalResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to hire professional: %v", err),
		})
		return
	}

	json.NewEncoder(w).Encode(HireProfessionalResponse{
		Success:      true,
		ContractID:   contract.ContractID,
		Fee:          contract.Fee,
		EscrowLocked: true,
	})
}

