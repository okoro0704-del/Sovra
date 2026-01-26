// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - Genesis State

package types

// GenesisState defines the vltcore module's genesis state
type GenesisState struct {
	// Blacklist contains initially blacklisted PFF hashes
	Blacklist []BlacklistEntry `json:"blacklist"`
}

// DefaultGenesisState returns the default genesis state
func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Blacklist: []BlacklistEntry{},
	}
}

// Validate performs basic validation of genesis data
func (gs GenesisState) Validate() error {
	// Validate blacklist entries
	for _, entry := range gs.Blacklist {
		if len(entry.PFFHash) != 64 {
			return ErrInvalidPFFHash
		}
		if entry.Reason == "" {
			return ErrInvalidBlacklistReason
		}
	}

	return nil
}

