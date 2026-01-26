package types

import (
	"fmt"
	"strings"
)

// ValidateDID validates a DID (Decentralized Identifier) format
// Expected format: did:sovrn:{country}:{identifier}
// Example: did:sovrn:nigeria:airport_security_001
func ValidateDID(did string) error {
	parts := strings.Split(did, ":")
	
	if len(parts) < 4 {
		return fmt.Errorf("DID must have at least 4 parts separated by colons")
	}

	if parts[0] != "did" {
		return fmt.Errorf("DID must start with 'did'")
	}

	if parts[1] != "sovrn" {
		return fmt.Errorf("DID method must be 'sovrn'")
	}

	if len(parts[2]) == 0 {
		return fmt.Errorf("DID country code cannot be empty")
	}

	if len(parts[3]) == 0 {
		return fmt.Errorf("DID identifier cannot be empty")
	}

	return nil
}

// ParseDIDCountry extracts the country code from a DID
// Example: did:sovrn:nigeria:airport_security_001 -> "nigeria"
func ParseDIDCountry(did string) (string, error) {
	if err := ValidateDID(did); err != nil {
		return "", err
	}

	parts := strings.Split(did, ":")
	return parts[2], nil
}

// GetSpokePoolAddress returns the module account address for a country's spoke pool
// This is used to route 50% of verification fees to the correct National_Spoke_Pool
func GetSpokePoolAddress(country string) string {
	// Module account name format: spoke_pool_{country}
	return fmt.Sprintf("spoke_pool_%s", country)
}

