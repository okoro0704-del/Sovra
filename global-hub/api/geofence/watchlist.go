package geofence

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"time"
)

/**
 * SOVRA_Sovereign_Kernel - Watchlist Monitoring & Security Alerts
 * 
 * Core ledger security function for monitoring flagged DIDs in sensitive zones
 * Implements encrypted Signal_Security_Forces event system
 */

// WatchlistService manages DID watchlists and security alerts
type WatchlistService struct {
	// In production, load from secure database
	watchlist       map[string]WatchlistEntry
	encryptionKey   []byte // AES-256 key for encrypting alerts
	alertChannel    chan SecurityAlert
}

// WatchlistEntry represents a flagged DID
type WatchlistEntry struct {
	DID             string
	Reason          string
	ThreatLevel     string // "low", "medium", "high", "critical"
	AddedBy         string // Agency/authority that added the DID
	AddedAt         time.Time
	ExpiresAt       *time.Time // Optional expiration
	Metadata        map[string]string
}

// SecurityAlert represents an encrypted alert to security forces
type SecurityAlert struct {
	AlertID         string
	AlertType       string // "watchlist_scan", "impossible_travel", "fraud_detected"
	Timestamp       time.Time
	
	// Subject information (encrypted)
	DID             string
	ThreatLevel     string
	
	// Location information (encrypted)
	Latitude        float64
	Longitude       float64
	LocationName    string
	SecurityZone    string
	
	// Context
	Reason          string
	VerificationID  string
	
	// Encryption
	EncryptedPayload string
	IV              string // Initialization vector for AES
}

// NewWatchlistService creates a new watchlist service
func NewWatchlistService(encryptionKey []byte) *WatchlistService {
	if len(encryptionKey) != 32 {
		panic("encryption key must be 32 bytes for AES-256")
	}
	
	return &WatchlistService{
		watchlist:     loadWatchlist(),
		encryptionKey: encryptionKey,
		alertChannel:  make(chan SecurityAlert, 100),
	}
}

// IsOnWatchlist checks if a DID is on the watchlist
func (ws *WatchlistService) IsOnWatchlist(did string) (bool, *WatchlistEntry) {
	entry, exists := ws.watchlist[did]
	
	if !exists {
		return false, nil
	}
	
	// Check if entry has expired
	if entry.ExpiresAt != nil && time.Now().After(*entry.ExpiresAt) {
		return false, nil
	}
	
	return true, &entry
}

// CheckAndAlert monitors for watchlist DIDs in security zones
func (ws *WatchlistService) CheckAndAlert(
	ctx context.Context,
	did string,
	latitude float64,
	longitude float64,
	locationName string,
	securityZone *SecurityZone,
	verificationID string,
) error {
	
	// Check if DID is on watchlist
	onWatchlist, entry := ws.IsOnWatchlist(did)
	
	if !onWatchlist {
		return nil // Not on watchlist - no alert needed
	}
	
	// Check if we're in a monitored security zone
	if securityZone == nil || !securityZone.WatchlistMonitoring {
		return nil // Not in monitored zone
	}
	
	// CRITICAL: Watchlist DID detected in security zone
	// Trigger encrypted Signal_Security_Forces event
	
	alert := SecurityAlert{
		AlertID:        fmt.Sprintf("alert_%d", time.Now().UnixNano()),
		AlertType:      "watchlist_scan",
		Timestamp:      time.Now(),
		DID:            did,
		ThreatLevel:    entry.ThreatLevel,
		Latitude:       latitude,
		Longitude:      longitude,
		LocationName:   locationName,
		SecurityZone:   securityZone.GetZoneInfo(),
		Reason:         fmt.Sprintf("Watchlist DID detected: %s", entry.Reason),
		VerificationID: verificationID,
	}
	
	// Encrypt the alert
	encryptedAlert, err := ws.encryptAlert(&alert)
	if err != nil {
		return fmt.Errorf("failed to encrypt alert: %w", err)
	}
	
	alert.EncryptedPayload = encryptedAlert.EncryptedPayload
	alert.IV = encryptedAlert.IV
	
	// Send to alert channel (async)
	select {
	case ws.alertChannel <- alert:
		// Alert sent successfully
	default:
		// Channel full - log error but don't block
		return fmt.Errorf("alert channel full - alert may be lost")
	}
	
	return nil
}

// encryptAlert encrypts sensitive alert data using AES-256-GCM
func (ws *WatchlistService) encryptAlert(alert *SecurityAlert) (*SecurityAlert, error) {
	// Create payload with sensitive data
	payload := map[string]interface{}{
		"did":             alert.DID,
		"threat_level":    alert.ThreatLevel,
		"latitude":        alert.Latitude,
		"longitude":       alert.Longitude,
		"location_name":   alert.LocationName,
		"security_zone":   alert.SecurityZone,
		"reason":          alert.Reason,
		"verification_id": alert.VerificationID,
		"timestamp":       alert.Timestamp.Format(time.RFC3339),
	}
	
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	
	// Create AES cipher
	block, err := aes.NewCipher(ws.encryptionKey)
	if err != nil {
		return nil, err
	}
	
	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	
	// Generate random nonce/IV
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	
	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, payloadJSON, nil)
	
	alert.EncryptedPayload = base64.StdEncoding.EncodeToString(ciphertext)
	alert.IV = base64.StdEncoding.EncodeToString(nonce)

	return alert, nil
}

// GetAlertChannel returns the channel for receiving security alerts
// Security forces can subscribe to this channel for real-time alerts
func (ws *WatchlistService) GetAlertChannel() <-chan SecurityAlert {
	return ws.alertChannel
}

// AddToWatchlist adds a DID to the watchlist
func (ws *WatchlistService) AddToWatchlist(entry WatchlistEntry) {
	ws.watchlist[entry.DID] = entry
}

// RemoveFromWatchlist removes a DID from the watchlist
func (ws *WatchlistService) RemoveFromWatchlist(did string) {
	delete(ws.watchlist, did)
}

// loadWatchlist loads the watchlist from database
// In production, this would query a secure database
func loadWatchlist() map[string]WatchlistEntry {
	// MOCK DATA - In production, load from secure database
	watchlist := make(map[string]WatchlistEntry)

	// Example watchlist entries
	watchlist["did:sovra:nigeria:suspect_001"] = WatchlistEntry{
		DID:         "did:sovra:nigeria:suspect_001",
		Reason:      "Suspected terrorist activity",
		ThreatLevel: "critical",
		AddedBy:     "Nigerian State Security Service",
		AddedAt:     time.Now().Add(-30 * 24 * time.Hour),
		ExpiresAt:   nil, // No expiration
		Metadata: map[string]string{
			"case_id": "NSS-2025-1234",
			"notes":   "High-priority target",
		},
	}

	watchlist["did:sovra:nigeria:suspect_002"] = WatchlistEntry{
		DID:         "did:sovra:nigeria:suspect_002",
		Reason:      "Kidnapping suspect",
		ThreatLevel: "high",
		AddedBy:     "Nigerian Police Force",
		AddedAt:     time.Now().Add(-15 * 24 * time.Hour),
		ExpiresAt:   nil,
		Metadata: map[string]string{
			"case_id": "NPF-2025-5678",
		},
	}

	return watchlist
}

