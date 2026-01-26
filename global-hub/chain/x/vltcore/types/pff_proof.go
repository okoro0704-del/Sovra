// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - PFF Liveness Proof Types

package types

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// PFFLivenessProof represents a cryptographic proof of human vitality
// This is the core data structure that anchors blocks to real human presence
type PFFLivenessProof struct {
	// PFFHash is the SHA-256 hash of the biometric liveness data
	PFFHash string `json:"pff_hash"`

	// DID is the decentralized identifier of the verified human
	DID string `json:"did"`

	// Timestamp is when the liveness verification occurred
	Timestamp time.Time `json:"timestamp"`

	// LivenessScore is the AI-computed confidence score (0-100)
	LivenessScore uint8 `json:"liveness_score"`

	// Signature is the cryptographic signature of the proof
	Signature []byte `json:"signature"`

	// BlockHeight is the block where this proof was included
	BlockHeight int64 `json:"block_height"`

	// Used tracks if this proof has been used (prevents replay attacks)
	Used bool `json:"used"`
}

// NewPFFLivenessProof creates a new PFF liveness proof
func NewPFFLivenessProof(pffHash, did string, livenessScore uint8, signature []byte) PFFLivenessProof {
	return PFFLivenessProof{
		PFFHash:       pffHash,
		DID:           did,
		Timestamp:     time.Now(),
		LivenessScore: livenessScore,
		Signature:     signature,
		BlockHeight:   0,
		Used:          false,
	}
}

// Validate performs basic validation of the PFF liveness proof
func (p PFFLivenessProof) Validate() error {
	// Validate PFF hash format (must be 64-character hex string for SHA-256)
	if len(p.PFFHash) != 64 {
		return fmt.Errorf("invalid PFF hash length: expected 64, got %d", len(p.PFFHash))
	}

	if _, err := hex.DecodeString(p.PFFHash); err != nil {
		return fmt.Errorf("invalid PFF hash format: %w", err)
	}

	// Validate DID format (did:sovra:{country}:{identifier})
	if len(p.DID) < 10 || p.DID[:11] != "did:sovra:" {
		return fmt.Errorf("invalid DID format: must start with 'did:sovra:'")
	}

	// Validate liveness score (0-100)
	if p.LivenessScore > 100 {
		return fmt.Errorf("invalid liveness score: must be 0-100, got %d", p.LivenessScore)
	}

	// Validate signature exists
	if len(p.Signature) == 0 {
		return fmt.Errorf("signature is required")
	}

	// Validate timestamp is not in the future
	if p.Timestamp.After(time.Now()) {
		return fmt.Errorf("timestamp cannot be in the future")
	}

	// Validate timestamp is not too old (max 5 minutes)
	if time.Since(p.Timestamp) > 5*time.Minute {
		return fmt.Errorf("proof expired: timestamp is older than 5 minutes")
	}

	return nil
}

// IsExpired checks if the proof has expired (older than 5 minutes)
func (p PFFLivenessProof) IsExpired() bool {
	return time.Since(p.Timestamp) > 5*time.Minute
}

// GetProofID returns a unique identifier for this proof
func (p PFFLivenessProof) GetProofID() string {
	data := fmt.Sprintf("%s:%s:%d", p.PFFHash, p.DID, p.Timestamp.Unix())
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// DeepfakeVote represents a validator's vote on whether a PFF scan is a deepfake
type DeepfakeVote struct {
	// PFFHash is the hash being voted on
	PFFHash string `json:"pff_hash"`

	// Validator is the address of the validator node
	Validator sdk.ValAddress `json:"validator"`

	// IsDeepfake is true if the validator flags this as a potential deepfake
	IsDeepfake bool `json:"is_deepfake"`

	// Confidence is the validator's confidence in their vote (0-100)
	Confidence uint8 `json:"confidence"`

	// Timestamp is when the vote was cast
	Timestamp time.Time `json:"timestamp"`

	// Reason is an optional explanation for the vote
	Reason string `json:"reason,omitempty"`
}

// NewDeepfakeVote creates a new deepfake vote
func NewDeepfakeVote(pffHash string, validator sdk.ValAddress, isDeepfake bool, confidence uint8, reason string) DeepfakeVote {
	return DeepfakeVote{
		PFFHash:    pffHash,
		Validator:  validator,
		IsDeepfake: isDeepfake,
		Confidence: confidence,
		Timestamp:  time.Now(),
		Reason:     reason,
	}
}

// BlacklistEntry represents a globally blacklisted PFF hash
type BlacklistEntry struct {
	// PFFHash is the blacklisted hash
	PFFHash string `json:"pff_hash"`

	// Reason is why this hash was blacklisted
	Reason string `json:"reason"`

	// Timestamp is when the blacklist entry was created
	Timestamp time.Time `json:"timestamp"`

	// DeepfakeVotes is the number of validators that flagged this as deepfake
	DeepfakeVotes int `json:"deepfake_votes"`

	// TotalValidators is the total number of validators at time of blacklisting
	TotalValidators int `json:"total_validators"`

	// DID is the DID associated with this blacklisted proof (if known)
	DID string `json:"did,omitempty"`
}

