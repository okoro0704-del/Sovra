// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Professional Role Tiers
//
// Implements certified professional DID types with consent-based metadata access.
// Enables high-level advisory services through role-based access control.

package access_control

import (
	"fmt"
	"time"
)

// ProfessionalRole represents the type of certified professional
type ProfessionalRole string

const (
	RoleLawyer     ProfessionalRole = "lawyer"
	RoleAuditor    ProfessionalRole = "auditor"
	RoleArchitect  ProfessionalRole = "architect"
)

// String returns the human-readable name of the role
func (pr ProfessionalRole) String() string {
	switch pr {
	case RoleLawyer:
		return "Certified Lawyer"
	case RoleAuditor:
		return "Certified Auditor"
	case RoleArchitect:
		return "Certified Architect"
	default:
		return "Unknown Role"
	}
}

// GetAccessScope returns the metadata fields this role can access
func (pr ProfessionalRole) GetAccessScope() []string {
	switch pr {
	case RoleLawyer:
		return []string{
			"legal_name",
			"citizenship_status",
			"legal_documents",
			"court_records",
			"property_ownership",
		}
	case RoleAuditor:
		return []string{
			"financial_records",
			"tax_compliance",
			"business_registration",
			"asset_declarations",
			"transaction_history",
		}
	case RoleArchitect:
		return []string{
			"property_ownership",
			"building_permits",
			"land_registry",
			"construction_approvals",
			"zoning_compliance",
		}
	default:
		return []string{}
	}
}

// CertifiedProfessional represents a verified professional with special access rights
type CertifiedProfessional struct {
	ProfessionalID   string           `json:"professional_id"`
	DID              string           `json:"did"`              // did:sovra:professional:{country}:{role}:{identifier}
	Role             ProfessionalRole `json:"role"`
	LicenseNumber    string           `json:"license_number"`
	IssuingAuthority string           `json:"issuing_authority"` // e.g., "Nigerian Bar Association"
	LicenseExpiry    time.Time        `json:"license_expiry"`
	VerificationDate time.Time        `json:"verification_date"`
	IsActive         bool             `json:"is_active"`
	Specializations  []string         `json:"specializations,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

// IsLicenseValid checks if the professional's license is still valid
func (cp *CertifiedProfessional) IsLicenseValid() bool {
	return cp.IsActive && time.Now().Before(cp.LicenseExpiry)
}

// GetAccessibleFields returns the metadata fields this professional can access
func (cp *CertifiedProfessional) GetAccessibleFields() []string {
	if !cp.IsLicenseValid() {
		return []string{} // Expired license = no access
	}
	return cp.Role.GetAccessScope()
}

// FormatDID creates a professional DID in the format:
// did:sovra:professional:{country}:{role}:{identifier}
func FormatProfessionalDID(country string, role ProfessionalRole, identifier string) string {
	return fmt.Sprintf("did:sovra:professional:%s:%s:%s", country, role, identifier)
}

// ProfessionalTier represents the certification tier and associated privileges
type ProfessionalTier struct {
	TierName        string           `json:"tier_name"`
	Role            ProfessionalRole `json:"role"`
	MinYearsOfPractice int           `json:"min_years_of_practice"`
	RequiredCertifications []string  `json:"required_certifications"`
	AccessLevel     int              `json:"access_level"` // 1 = basic, 2 = intermediate, 3 = advanced
	ConsultationFee int64            `json:"consultation_fee"` // uSOV
}

// GetProfessionalTiers returns the tier structure for each role
func GetProfessionalTiers() map[ProfessionalRole][]ProfessionalTier {
	return map[ProfessionalRole][]ProfessionalTier{
		RoleLawyer: {
			{
				TierName:        "Junior Lawyer",
				Role:            RoleLawyer,
				MinYearsOfPractice: 0,
				RequiredCertifications: []string{"Bar Association Membership"},
				AccessLevel:     1,
				ConsultationFee: 50_000_000, // 50 SOV
			},
			{
				TierName:        "Senior Lawyer",
				Role:            RoleLawyer,
				MinYearsOfPractice: 5,
				RequiredCertifications: []string{"Bar Association Membership", "Senior Advocate Certification"},
				AccessLevel:     2,
				ConsultationFee: 100_000_000, // 100 SOV
			},
		},
		RoleAuditor: {
			{
				TierName:        "Certified Auditor",
				Role:            RoleAuditor,
				MinYearsOfPractice: 0,
				RequiredCertifications: []string{"ICAN Membership", "Audit License"},
				AccessLevel:     1,
				ConsultationFee: 50_000_000, // 50 SOV
			},
			{
				TierName:        "Senior Auditor",
				Role:            RoleAuditor,
				MinYearsOfPractice: 7,
				RequiredCertifications: []string{"ICAN Fellowship", "Forensic Audit Certification"},
				AccessLevel:     2,
				ConsultationFee: 100_000_000, // 100 SOV
			},
		},
		RoleArchitect: {
			{
				TierName:        "Registered Architect",
				Role:            RoleArchitect,
				MinYearsOfPractice: 0,
				RequiredCertifications: []string{"ARCON Registration"},
				AccessLevel:     1,
				ConsultationFee: 50_000_000, // 50 SOV
			},
			{
				TierName:        "Principal Architect",
				Role:            RoleArchitect,
				MinYearsOfPractice: 10,
				RequiredCertifications: []string{"ARCON Fellowship", "Urban Planning Certification"},
				AccessLevel:     2,
				ConsultationFee: 100_000_000, // 100 SOV
			},
		},
	}
}

