package types

const (
	// ModuleName defines the module name
	ModuleName = "pff"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// QuerierRoute defines the module's query routing key
	QuerierRoute = ModuleName
)

// Event types
const (
	EventTypePFFVerification = "pff_verification"
	
	AttributeKeyCitizen      = "citizen"
	AttributeKeyPFFHash      = "pff_hash"
	AttributeKeyRequesterDID = "requester_did"
	AttributeKeyContext      = "context"
	AttributeKeySuccess      = "success"
)

