package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// TrustCacheEntry represents a cached traveler trust record
type TrustCacheEntry struct {
	BiometricHash    string            `json:"biometric_hash"`
	TrustScore       int32             `json:"trust_score"`
	TrustLevel       string            `json:"trust_level"`
	VerificationID   string            `json:"verification_id"`
	VerifiedAt       time.Time         `json:"verified_at"`
	ExpiresAt        time.Time         `json:"expires_at"`
	VerificationCount int              `json:"verification_count"`
	Checkpoints      []string          `json:"checkpoints"`
	CarrierIDs       []string          `json:"carrier_ids"`
}

// TemporalTrustCache provides 24-hour trust caching for sub-second verifications
type TemporalTrustCache struct {
	// In-memory cache for development
	// In production, use Redis or similar distributed cache
	cache map[string]*TrustCacheEntry
	mu    sync.RWMutex
	
	// TTL for cache entries (24 hours)
	ttl time.Duration
	
	// Cleanup interval for expired entries
	cleanupInterval time.Duration
}

// NewTemporalTrustCache creates a new temporal trust cache
func NewTemporalTrustCache(ttl time.Duration) *TemporalTrustCache {
	cache := &TemporalTrustCache{
		cache:           make(map[string]*TrustCacheEntry),
		ttl:             ttl,
		cleanupInterval: 5 * time.Minute,
	}
	
	// Start background cleanup goroutine
	go cache.cleanupExpired()
	
	return cache
}

// NewDefaultTemporalTrustCache creates a cache with 24-hour TTL
func NewDefaultTemporalTrustCache() *TemporalTrustCache {
	return NewTemporalTrustCache(24 * time.Hour)
}

// Set stores a trust entry in the cache
func (tc *TemporalTrustCache) Set(ctx context.Context, entry *TrustCacheEntry) error {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	
	// Set expiration time
	entry.ExpiresAt = time.Now().Add(tc.ttl)
	
	// Store in cache
	tc.cache[entry.BiometricHash] = entry
	
	return nil
}

// Get retrieves a trust entry from the cache
func (tc *TemporalTrustCache) Get(ctx context.Context, biometricHash string) (*TrustCacheEntry, bool) {
	tc.mu.RLock()
	defer tc.mu.RUnlock()
	
	entry, exists := tc.cache[biometricHash]
	if !exists {
		return nil, false
	}
	
	// Check if expired
	if time.Now().After(entry.ExpiresAt) {
		return nil, false
	}
	
	return entry, true
}

// Update increments verification count and adds checkpoint
func (tc *TemporalTrustCache) Update(
	ctx context.Context,
	biometricHash string,
	checkpointType string,
	carrierID string,
) error {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	
	entry, exists := tc.cache[biometricHash]
	if !exists {
		return fmt.Errorf("entry not found in cache")
	}
	
	// Check if expired
	if time.Now().After(entry.ExpiresAt) {
		return fmt.Errorf("entry expired")
	}
	
	// Increment verification count
	entry.VerificationCount++
	
	// Add checkpoint if not already present
	if !contains(entry.Checkpoints, checkpointType) {
		entry.Checkpoints = append(entry.Checkpoints, checkpointType)
	}
	
	// Add carrier ID if not already present
	if !contains(entry.CarrierIDs, carrierID) {
		entry.CarrierIDs = append(entry.CarrierIDs, carrierID)
	}
	
	return nil
}

// Delete removes a trust entry from the cache
func (tc *TemporalTrustCache) Delete(ctx context.Context, biometricHash string) error {
	tc.mu.Lock()
	defer tc.mu.Unlock()
	
	delete(tc.cache, biometricHash)
	return nil
}

// IsValid checks if a cached entry is still valid
func (tc *TemporalTrustCache) IsValid(ctx context.Context, biometricHash string) bool {
	entry, exists := tc.Get(ctx, biometricHash)
	if !exists {
		return false
	}
	
	return time.Now().Before(entry.ExpiresAt)
}

// GetStats returns cache statistics
func (tc *TemporalTrustCache) GetStats() map[string]interface{} {
	tc.mu.RLock()
	defer tc.mu.RUnlock()
	
	totalEntries := len(tc.cache)
	validEntries := 0
	expiredEntries := 0
	
	now := time.Now()
	for _, entry := range tc.cache {
		if now.Before(entry.ExpiresAt) {
			validEntries++
		} else {
			expiredEntries++
		}
	}
	
	return map[string]interface{}{
		"total_entries":   totalEntries,
		"valid_entries":   validEntries,
		"expired_entries": expiredEntries,
		"ttl_hours":       tc.ttl.Hours(),
	}
}

// cleanupExpired removes expired entries from the cache
func (tc *TemporalTrustCache) cleanupExpired() {
	ticker := time.NewTicker(tc.cleanupInterval)
	defer ticker.Stop()
	
	for range ticker.C {
		tc.mu.Lock()
		
		now := time.Now()
		for hash, entry := range tc.cache {
			if now.After(entry.ExpiresAt) {
				delete(tc.cache, hash)
			}
		}
		
		tc.mu.Unlock()
	}
}

// MarshalJSON serializes a cache entry to JSON
func (e *TrustCacheEntry) MarshalJSON() ([]byte, error) {
	type Alias TrustCacheEntry
	return json.Marshal(&struct {
		VerifiedAt string `json:"verified_at"`
		ExpiresAt  string `json:"expires_at"`
		*Alias
	}{
		VerifiedAt: e.VerifiedAt.Format(time.RFC3339),
		ExpiresAt:  e.ExpiresAt.Format(time.RFC3339),
		Alias:      (*Alias)(e),
	})
}

// contains checks if a string slice contains a value
func contains(slice []string, value string) bool {
	for _, item := range slice {
		if item == value {
			return true
		}
	}
	return false
}

