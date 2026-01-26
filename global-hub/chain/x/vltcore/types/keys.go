// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - Constants and Keys

package types

const (
	// ModuleName defines the module name
	ModuleName = "vltcore"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_vltcore"
)

// Store key prefixes
var (
	// PFFProofPrefix is the prefix for storing PFF liveness proofs
	PFFProofPrefix = []byte{0x01}

	// DeepfakeVotePrefix is the prefix for storing deepfake detection votes
	DeepfakeVotePrefix = []byte{0x02}

	// BlacklistPrefix is the prefix for storing globally blacklisted PFF hashes
	BlacklistPrefix = []byte{0x03}

	// ValidatorNodePrefix is the prefix for storing validator node registry
	ValidatorNodePrefix = []byte{0x04}
)

// Event types
const (
	EventTypeVitalityAnchor      = "vitality_anchor"
	EventTypeConsensusBlacklist  = "consensus_blacklist"
	EventTypeDeepfakeVote        = "deepfake_vote"
	EventTypePFFProofValidated   = "pff_proof_validated"
	EventTypePFFProofRejected    = "pff_proof_rejected"
)

// Attribute keys
const (
	AttributeKeyPFFHash       = "pff_hash"
	AttributeKeyBlockHeight   = "block_height"
	AttributeKeyValidator     = "validator"
	AttributeKeyDeepfakeVotes = "deepfake_votes"
	AttributeKeyTotalNodes    = "total_nodes"
	AttributeKeyReason        = "reason"
	AttributeKeyTimestamp     = "timestamp"
	AttributeKeyDID           = "did"
)

