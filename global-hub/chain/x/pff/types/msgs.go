package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

// Message types for the pff module
const (
	TypeMsgPFFVerification = "pff_verification"
)

var _ sdk.Msg = &MsgPFFVerification{}

// MsgPFFVerification defines a message for PFF (Presence Factor Fabric) verification
type MsgPFFVerification struct {
	// Citizen is the address of the citizen being verified
	Citizen string `protobuf:"bytes,1,opt,name=citizen,proto3" json:"citizen,omitempty"`
	
	// PFFHash is the hashed biometric data
	PFFHash string `protobuf:"bytes,2,opt,name=pff_hash,json=pffHash,proto3" json:"pff_hash,omitempty"`
	
	// RequesterDID is the DID of the entity requesting verification
	// Format: did:sovrn:{country}:{identifier}
	// Used to route 50% of fees to the correct National_Spoke_Pool
	RequesterDID string `protobuf:"bytes,3,opt,name=requester_did,json=requesterDID,proto3" json:"requester_did,omitempty"`
	
	// LivenessData contains anti-spoofing verification data
	LivenessData string `protobuf:"bytes,4,opt,name=liveness_data,json=livenessData,proto3" json:"liveness_data,omitempty"`
	
	// Context describes the verification scenario (e.g., "airport_security")
	Context string `protobuf:"bytes,5,opt,name=context,proto3" json:"context,omitempty"`
}

// NewMsgPFFVerification creates a new MsgPFFVerification instance
func NewMsgPFFVerification(
	citizen string,
	pffHash string,
	requesterDID string,
	livenessData string,
	context string,
) *MsgPFFVerification {
	return &MsgPFFVerification{
		Citizen:      citizen,
		PFFHash:      pffHash,
		RequesterDID: requesterDID,
		LivenessData: livenessData,
		Context:      context,
	}
}

// Route implements the sdk.Msg interface
func (msg MsgPFFVerification) Route() string { return RouterKey }

// Type implements the sdk.Msg interface
func (msg MsgPFFVerification) Type() string { return TypeMsgPFFVerification }

// GetSigners implements the sdk.Msg interface
func (msg MsgPFFVerification) GetSigners() []sdk.AccAddress {
	citizen, err := sdk.AccAddressFromBech32(msg.Citizen)
	if err != nil {
		panic(err)
	}
	return []sdk.AccAddress{citizen}
}

// GetSignBytes implements the sdk.Msg interface
func (msg MsgPFFVerification) GetSignBytes() []byte {
	bz := ModuleCdc.MustMarshalJSON(&msg)
	return sdk.MustSortJSON(bz)
}

// ValidateBasic implements the sdk.Msg interface
func (msg MsgPFFVerification) ValidateBasic() error {
	// Validate citizen address
	_, err := sdk.AccAddressFromBech32(msg.Citizen)
	if err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid citizen address: %s", err)
	}

	// Validate PFF hash
	if len(msg.PFFHash) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "pff_hash cannot be empty")
	}

	// Validate requester DID
	if len(msg.RequesterDID) == 0 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "requester_did cannot be empty")
	}

	// Validate DID format: did:sovrn:{country}:{identifier}
	if err := ValidateDID(msg.RequesterDID); err != nil {
		return sdkerrors.Wrapf(sdkerrors.ErrInvalidRequest, "invalid DID format: %s", err)
	}

	// Context is optional but should not be too long
	if len(msg.Context) > 100 {
		return sdkerrors.Wrap(sdkerrors.ErrInvalidRequest, "context too long (max 100 characters)")
	}

	return nil
}

// VerificationRecord stores a PFF verification event
type VerificationRecord struct {
	Citizen      string `protobuf:"bytes,1,opt,name=citizen,proto3" json:"citizen,omitempty"`
	PFFHash      string `protobuf:"bytes,2,opt,name=pff_hash,json=pffHash,proto3" json:"pff_hash,omitempty"`
	RequesterDID string `protobuf:"bytes,3,opt,name=requester_did,json=requesterDID,proto3" json:"requester_did,omitempty"`
	Context      string `protobuf:"bytes,4,opt,name=context,proto3" json:"context,omitempty"`
	Timestamp    int64  `protobuf:"varint,5,opt,name=timestamp,proto3" json:"timestamp,omitempty"`
	BlockHeight  int64  `protobuf:"varint,6,opt,name=block_height,json=blockHeight,proto3" json:"block_height,omitempty"`
}

// GetVerificationRecordKey returns the store key for a verification record
func GetVerificationRecordKey(citizen sdk.AccAddress, blockHeight int64) []byte {
	return append([]byte("verification:"), append(citizen.Bytes(), sdk.Uint64ToBigEndian(uint64(blockHeight))...)...)
}

