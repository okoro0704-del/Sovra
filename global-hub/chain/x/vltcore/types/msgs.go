// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// VLT_Core Security Module - Message Types

package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

const (
	TypeMsgSubmitDeepfakeVote = "submit_deepfake_vote"
)

var _ sdk.Msg = &MsgSubmitDeepfakeVote{}

// MsgSubmitDeepfakeVote represents a validator's vote on whether a PFF scan is a deepfake
type MsgSubmitDeepfakeVote struct {
	// PFFHash is the hash being voted on
	PFFHash string `json:"pff_hash"`

	// Validator is the address of the validator submitting the vote
	Validator string `json:"validator"`

	// IsDeepfake is true if the validator flags this as a potential deepfake
	IsDeepfake bool `json:"is_deepfake"`

	// Confidence is the validator's confidence in their vote (0-100)
	Confidence uint8 `json:"confidence"`

	// Reason is an optional explanation for the vote
	Reason string `json:"reason,omitempty"`
}

// NewMsgSubmitDeepfakeVote creates a new MsgSubmitDeepfakeVote
func NewMsgSubmitDeepfakeVote(pffHash, validator string, isDeepfake bool, confidence uint8, reason string) *MsgSubmitDeepfakeVote {
	return &MsgSubmitDeepfakeVote{
		PFFHash:    pffHash,
		Validator:  validator,
		IsDeepfake: isDeepfake,
		Confidence: confidence,
		Reason:     reason,
	}
}

// Route implements the sdk.Msg interface
func (msg MsgSubmitDeepfakeVote) Route() string { return RouterKey }

// Type implements the sdk.Msg interface
func (msg MsgSubmitDeepfakeVote) Type() string { return TypeMsgSubmitDeepfakeVote }

// GetSigners implements the sdk.Msg interface
func (msg MsgSubmitDeepfakeVote) GetSigners() []sdk.AccAddress {
	validator, err := sdk.ValAddressFromBech32(msg.Validator)
	if err != nil {
		panic(err)
	}
	// Convert ValAddress to AccAddress
	accAddr := sdk.AccAddress(validator)
	return []sdk.AccAddress{accAddr}
}

// GetSignBytes implements the sdk.Msg interface
func (msg MsgSubmitDeepfakeVote) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(&msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic implements the sdk.Msg interface
func (msg MsgSubmitDeepfakeVote) ValidateBasic() error {
	// Validate PFF hash
	if len(msg.PFFHash) != 64 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "invalid PFF hash length: must be 64 characters")
	}

	// Validate validator address
	if _, err := sdk.ValAddressFromBech32(msg.Validator); err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid validator address: %s", err)
	}

	// Validate confidence
	if msg.Confidence > 100 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "invalid confidence: must be 0-100")
	}

	return nil
}

