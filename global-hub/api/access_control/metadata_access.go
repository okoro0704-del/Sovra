// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Consent-Based Metadata Access Control
//
// Implements read-access to encrypted citizen metadata with explicit user consent.
// Enables certified professionals to provide advisory services while preserving privacy.

package access_control

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/google/uuid"
)

// AccessConsent represents a citizen's consent for a professional to access their metadata
type AccessConsent struct {
	ConsentID        string    `json:"consent_id"`
	CitizenDID       string    `json:"citizen_did"`
	ProfessionalDID  string    `json:"professional_did"`
	ProfessionalRole ProfessionalRole `json:"professional_role"`
	GrantedFields    []string  `json:"granted_fields"`    // Specific metadata fields granted
	Purpose          string    `json:"purpose"`           // e.g., "Legal consultation on property dispute"
	ExpiresAt        time.Time `json:"expires_at"`        // Consent expiry (default: 30 days)
	GrantedAt        time.Time `json:"granted_at"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
	IsActive         bool      `json:"is_active"`
	BiometricSignature []byte  `json:"biometric_signature"` // Citizen's PFF signature
}

// IsValid checks if the consent is still valid
func (ac *AccessConsent) IsValid() bool {
	if !ac.IsActive {
		return false
	}
	if ac.RevokedAt != nil {
		return false
	}
	if time.Now().After(ac.ExpiresAt) {
		return false
	}
	return true
}

// CitizenMetadata represents encrypted citizen metadata
type CitizenMetadata struct {
	DID              string                 `json:"did"`
	EncryptedData    string                 `json:"encrypted_data"` // Base64-encoded encrypted JSON
	AvailableFields  []string               `json:"available_fields"`
	LastUpdated      time.Time              `json:"last_updated"`
}

// MetadataAccessResult represents the result of a metadata access request
type MetadataAccessResult struct {
	AccessID         string                 `json:"access_id"`
	CitizenDID       string                 `json:"citizen_did"`
	ProfessionalDID  string                 `json:"professional_did"`
	RequestedFields  []string               `json:"requested_fields"`
	GrantedFields    []string               `json:"granted_fields"`
	DecryptedData    map[string]interface{} `json:"decrypted_data,omitempty"`
	Status           string                 `json:"status"` // "success", "consent_required", "denied"
	DenialReason     string                 `json:"denial_reason,omitempty"`
	Timestamp        time.Time              `json:"timestamp"`
}

// MetadataAccessController manages consent-based metadata access
type MetadataAccessController struct {
	consents         map[string]*AccessConsent // consentID -> consent
	citizenMetadata  map[string]*CitizenMetadata // citizenDID -> metadata
	encryptionKey    []byte // AES-256 key for metadata encryption
	mu               sync.RWMutex
}

// NewMetadataAccessController creates a new metadata access controller
func NewMetadataAccessController(encryptionKey []byte) *MetadataAccessController {
	if len(encryptionKey) != 32 {
		panic("encryption key must be 32 bytes for AES-256")
	}

	return &MetadataAccessController{
		consents:        make(map[string]*AccessConsent),
		citizenMetadata: make(map[string]*CitizenMetadata),
		encryptionKey:   encryptionKey,
	}
}

// GrantConsent grants a professional access to specific metadata fields
//
// CONSENT LOGIC:
// 1. Citizen explicitly grants access to specific fields
// 2. Consent is time-limited (default: 30 days)
// 3. Consent can be revoked at any time
// 4. Biometric signature required for consent
func (mac *MetadataAccessController) GrantConsent(
	ctx context.Context,
	citizenDID string,
	professionalDID string,
	professionalRole ProfessionalRole,
	requestedFields []string,
	purpose string,
	biometricSignature []byte,
) (*AccessConsent, error) {
	mac.mu.Lock()
	defer mac.mu.Unlock()

	// Validate biometric signature
	if len(biometricSignature) == 0 {
		return nil, fmt.Errorf("biometric signature required for consent")
	}

	// Validate requested fields against professional's access scope
	allowedFields := professionalRole.GetAccessScope()
	grantedFields := []string{}

	for _, field := range requestedFields {
		if contains(allowedFields, field) {
			grantedFields = append(grantedFields, field)
		}
	}

	if len(grantedFields) == 0 {
		return nil, fmt.Errorf("no valid fields requested for role %s", professionalRole)
	}

	// Create consent record
	consent := &AccessConsent{
		ConsentID:          uuid.New().String(),
		CitizenDID:         citizenDID,
		ProfessionalDID:    professionalDID,
		ProfessionalRole:   professionalRole,
		GrantedFields:      grantedFields,
		Purpose:            purpose,
		ExpiresAt:          time.Now().Add(30 * 24 * time.Hour), // 30 days
		GrantedAt:          time.Now(),
		IsActive:           true,
		BiometricSignature: biometricSignature,
	}

	mac.consents[consent.ConsentID] = consent

	return consent, nil
}

// RevokeConsent revokes a previously granted consent
func (mac *MetadataAccessController) RevokeConsent(ctx context.Context, consentID string) error {
	mac.mu.Lock()
	defer mac.mu.Unlock()

	consent, exists := mac.consents[consentID]
	if !exists {
		return fmt.Errorf("consent not found: %s", consentID)
	}

	now := time.Now()
	consent.RevokedAt = &now
	consent.IsActive = false

	return nil
}

// RequestMetadataAccess requests access to citizen metadata with consent validation
//
// ACCESS CONTROL LOGIC:
// 1. Check if valid consent exists
// 2. Validate professional's license
// 3. Decrypt only the granted fields
// 4. Return filtered metadata
func (mac *MetadataAccessController) RequestMetadataAccess(
	ctx context.Context,
	citizenDID string,
	professionalDID string,
	professional *CertifiedProfessional,
	requestedFields []string,
) (*MetadataAccessResult, error) {
	mac.mu.RLock()
	defer mac.mu.RUnlock()

	result := &MetadataAccessResult{
		AccessID:        uuid.New().String(),
		CitizenDID:      citizenDID,
		ProfessionalDID: professionalDID,
		RequestedFields: requestedFields,
		Timestamp:       time.Now(),
	}

	// 1. Validate professional's license
	if !professional.IsLicenseValid() {
		result.Status = "denied"
		result.DenialReason = "Professional license expired or inactive"
		return result, fmt.Errorf("professional license invalid")
	}

	// 2. Find valid consent
	var validConsent *AccessConsent
	for _, consent := range mac.consents {
		if consent.CitizenDID == citizenDID &&
			consent.ProfessionalDID == professionalDID &&
			consent.IsValid() {
			validConsent = consent
			break
		}
	}

	if validConsent == nil {
		result.Status = "consent_required"
		result.DenialReason = "No valid consent found. Citizen must grant access first."
		return result, fmt.Errorf("consent required")
	}

	// 3. Filter requested fields by granted fields
	grantedFields := []string{}
	for _, field := range requestedFields {
		if contains(validConsent.GrantedFields, field) {
			grantedFields = append(grantedFields, field)
		}
	}

	if len(grantedFields) == 0 {
		result.Status = "denied"
		result.DenialReason = "Requested fields not covered by consent"
		return result, fmt.Errorf("no granted fields")
	}

	result.GrantedFields = grantedFields

	// 4. Get citizen metadata
	metadata, exists := mac.citizenMetadata[citizenDID]
	if !exists {
		result.Status = "denied"
		result.DenialReason = "Citizen metadata not found"
		return result, fmt.Errorf("metadata not found")
	}

	// 5. Decrypt metadata
	decryptedData, err := mac.decryptMetadata(metadata.EncryptedData)
	if err != nil {
		result.Status = "denied"
		result.DenialReason = fmt.Sprintf("Decryption failed: %v", err)
		return result, err
	}

	// 6. Filter decrypted data to only include granted fields
	filteredData := make(map[string]interface{})
	for _, field := range grantedFields {
		if value, exists := decryptedData[field]; exists {
			filteredData[field] = value
		}
	}

	result.DecryptedData = filteredData
	result.Status = "success"

	return result, nil
}

// StoreEncryptedMetadata stores encrypted citizen metadata
func (mac *MetadataAccessController) StoreEncryptedMetadata(
	ctx context.Context,
	citizenDID string,
	metadata map[string]interface{},
) error {
	mac.mu.Lock()
	defer mac.mu.Unlock()

	// Encrypt metadata
	encryptedData, err := mac.encryptMetadata(metadata)
	if err != nil {
		return fmt.Errorf("failed to encrypt metadata: %w", err)
	}

	// Extract available fields
	availableFields := make([]string, 0, len(metadata))
	for field := range metadata {
		availableFields = append(availableFields, field)
	}

	// Store encrypted metadata
	mac.citizenMetadata[citizenDID] = &CitizenMetadata{
		DID:             citizenDID,
		EncryptedData:   encryptedData,
		AvailableFields: availableFields,
		LastUpdated:     time.Now(),
	}

	return nil
}

// encryptMetadata encrypts metadata using AES-256-GCM
func (mac *MetadataAccessController) encryptMetadata(data map[string]interface{}) (string, error) {
	// Convert to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	// Create cipher
	block, err := aes.NewCipher(mac.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, jsonData, nil)

	// Encode to base64
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decryptMetadata decrypts metadata using AES-256-GCM
func (mac *MetadataAccessController) decryptMetadata(encryptedData string) (map[string]interface{}, error) {
	// Decode from base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return nil, err
	}

	// Create cipher
	block, err := aes.NewCipher(mac.encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// Extract nonce
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	// Parse JSON
	var data map[string]interface{}
	if err := json.Unmarshal(plaintext, &data); err != nil {
		return nil, err
	}

	return data, nil
}

// GetActiveConsents returns all active consents for a citizen
func (mac *MetadataAccessController) GetActiveConsents(ctx context.Context, citizenDID string) ([]*AccessConsent, error) {
	mac.mu.RLock()
	defer mac.mu.RUnlock()

	var activeConsents []*AccessConsent
	for _, consent := range mac.consents {
		if consent.CitizenDID == citizenDID && consent.IsValid() {
			activeConsents = append(activeConsents, consent)
		}
	}

	return activeConsents, nil
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

