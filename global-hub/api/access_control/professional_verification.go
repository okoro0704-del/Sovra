// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Professional Verification System
//
// Implements certification and verification for professional roles.
// Validates licenses with issuing authorities and manages professional registry.

package access_control

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ProfessionalRegistry manages certified professional registrations
type ProfessionalRegistry struct {
	professionals map[string]*CertifiedProfessional // professionalID -> professional
	didIndex      map[string]string                 // DID -> professionalID
	mu            sync.RWMutex
}

// NewProfessionalRegistry creates a new professional registry
func NewProfessionalRegistry() *ProfessionalRegistry {
	return &ProfessionalRegistry{
		professionals: make(map[string]*CertifiedProfessional),
		didIndex:      make(map[string]string),
	}
}

// RegisterProfessional registers a new certified professional
//
// REGISTRATION LOGIC:
// 1. Validate license with issuing authority (mock for now)
// 2. Create professional DID
// 3. Store professional record
// 4. Return certified professional
func (pr *ProfessionalRegistry) RegisterProfessional(
	ctx context.Context,
	country string,
	role ProfessionalRole,
	licenseNumber string,
	issuingAuthority string,
	licenseExpiry time.Time,
	specializations []string,
) (*CertifiedProfessional, error) {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	// 1. Verify license with issuing authority
	isValid, err := pr.verifyLicense(ctx, role, licenseNumber, issuingAuthority)
	if err != nil {
		return nil, fmt.Errorf("license verification failed: %w", err)
	}

	if !isValid {
		return nil, fmt.Errorf("invalid license: %s from %s", licenseNumber, issuingAuthority)
	}

	// 2. Generate professional ID and DID
	professionalID := uuid.New().String()
	did := FormatProfessionalDID(country, role, professionalID)

	// 3. Create professional record
	professional := &CertifiedProfessional{
		ProfessionalID:   professionalID,
		DID:              did,
		Role:             role,
		LicenseNumber:    licenseNumber,
		IssuingAuthority: issuingAuthority,
		LicenseExpiry:    licenseExpiry,
		VerificationDate: time.Now(),
		IsActive:         true,
		Specializations:  specializations,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// 4. Store in registry
	pr.professionals[professionalID] = professional
	pr.didIndex[did] = professionalID

	fmt.Printf("✅ Professional Registered\n")
	fmt.Printf("   DID: %s\n", did)
	fmt.Printf("   Role: %s\n", role.String())
	fmt.Printf("   License: %s\n", licenseNumber)
	fmt.Printf("   Authority: %s\n", issuingAuthority)

	return professional, nil
}

// verifyLicense verifies a professional's license with issuing authority
//
// INTEGRATION POINTS (for production):
// - Nigerian Bar Association API (lawyers)
// - ICAN API (auditors)
// - ARCON API (architects)
//
// For now, this is a mock implementation
func (pr *ProfessionalRegistry) verifyLicense(
	ctx context.Context,
	role ProfessionalRole,
	licenseNumber string,
	issuingAuthority string,
) (bool, error) {
	// Mock verification logic
	// In production, this would call external APIs

	switch role {
	case RoleLawyer:
		// Verify with Nigerian Bar Association
		if issuingAuthority != "Nigerian Bar Association" {
			return false, fmt.Errorf("invalid authority for lawyer: %s", issuingAuthority)
		}
		// Mock: Accept any license number starting with "NBA"
		if len(licenseNumber) < 3 || licenseNumber[:3] != "NBA" {
			return false, nil
		}

	case RoleAuditor:
		// Verify with ICAN (Institute of Chartered Accountants of Nigeria)
		if issuingAuthority != "ICAN" {
			return false, fmt.Errorf("invalid authority for auditor: %s", issuingAuthority)
		}
		// Mock: Accept any license number starting with "ICAN"
		if len(licenseNumber) < 4 || licenseNumber[:4] != "ICAN" {
			return false, nil
		}

	case RoleArchitect:
		// Verify with ARCON (Architects Registration Council of Nigeria)
		if issuingAuthority != "ARCON" {
			return false, fmt.Errorf("invalid authority for architect: %s", issuingAuthority)
		}
		// Mock: Accept any license number starting with "ARCON"
		if len(licenseNumber) < 5 || licenseNumber[:5] != "ARCON" {
			return false, nil
		}

	default:
		return false, fmt.Errorf("unknown role: %s", role)
	}

	return true, nil
}

// GetProfessionalByDID retrieves a professional by their DID
func (pr *ProfessionalRegistry) GetProfessionalByDID(ctx context.Context, did string) (*CertifiedProfessional, error) {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	professionalID, exists := pr.didIndex[did]
	if !exists {
		return nil, fmt.Errorf("professional not found: %s", did)
	}

	professional := pr.professionals[professionalID]
	return professional, nil
}

