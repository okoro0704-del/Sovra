package fraud

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// HardwareAttestation verifies that PFF scans come from secure hardware
// Rejects scans from emulators, virtual machines, or rooted/jailbroken devices
type HardwareAttestation struct {
	// Trusted device fingerprints (in production, use hardware security module)
	trustedFingerprints map[string]bool
}

// DeviceAttestation contains device security information
type DeviceAttestation struct {
	// Device fingerprint (unique hardware identifier)
	DeviceFingerprint string
	
	// Secure Enclave attestation token (iOS: Secure Enclave, Android: StrongBox/TEE)
	AttestationToken string
	
	// Device type (e.g., "iPhone 14 Pro", "Samsung Galaxy S23")
	DeviceModel string
	
	// OS version
	OSVersion string
	
	// Security indicators
	HasSecureEnclave  bool
	IsRooted          bool
	IsJailbroken      bool
	IsEmulator        bool
	IsVirtualMachine  bool
	DeveloperModeOn   bool
	
	// Biometric hardware capabilities
	HasFaceID         bool
	HasTouchID        bool
	HasIrisScanner    bool
	HasFingerprintSensor bool
}

// AttestationResult contains the result of hardware verification
type AttestationResult struct {
	Passed           bool
	Rejected         bool
	Reason           string
	TrustLevel       string // "high", "medium", "low", "untrusted"
	SecurityFlags    []string
	DeviceFingerprint string
}

// NewHardwareAttestation creates a new hardware attestation checker
func NewHardwareAttestation() *HardwareAttestation {
	return &HardwareAttestation{
		trustedFingerprints: make(map[string]bool),
	}
}

// VerifyAttestation checks if the device is trusted and secure
func (ha *HardwareAttestation) VerifyAttestation(
	ctx context.Context,
	attestation *DeviceAttestation,
) (*AttestationResult, error) {
	
	securityFlags := []string{}
	
	// CRITICAL: Reject emulators and virtual machines
	if attestation.IsEmulator {
		return &AttestationResult{
			Passed:           false,
			Rejected:         true,
			Reason:           "Emulator detected - PFF scans must come from physical devices",
			TrustLevel:       "untrusted",
			SecurityFlags:    []string{"EMULATOR_DETECTED"},
			DeviceFingerprint: attestation.DeviceFingerprint,
		}, nil
	}
	
	if attestation.IsVirtualMachine {
		return &AttestationResult{
			Passed:           false,
			Rejected:         true,
			Reason:           "Virtual machine detected - PFF scans must come from physical devices",
			TrustLevel:       "untrusted",
			SecurityFlags:    []string{"VIRTUAL_MACHINE_DETECTED"},
			DeviceFingerprint: attestation.DeviceFingerprint,
		}, nil
	}
	
	// CRITICAL: Reject rooted/jailbroken devices
	if attestation.IsRooted {
		securityFlags = append(securityFlags, "ROOTED_DEVICE")
		return &AttestationResult{
			Passed:           false,
			Rejected:         true,
			Reason:           "Rooted device detected - compromised security",
			TrustLevel:       "untrusted",
			SecurityFlags:    securityFlags,
			DeviceFingerprint: attestation.DeviceFingerprint,
		}, nil
	}
	
	if attestation.IsJailbroken {
		securityFlags = append(securityFlags, "JAILBROKEN_DEVICE")
		return &AttestationResult{
			Passed:           false,
			Rejected:         true,
			Reason:           "Jailbroken device detected - compromised security",
			TrustLevel:       "untrusted",
			SecurityFlags:    securityFlags,
			DeviceFingerprint: attestation.DeviceFingerprint,
		}, nil
	}
	
	// CRITICAL: Require Secure Enclave for biometric operations
	if !attestation.HasSecureEnclave {
		securityFlags = append(securityFlags, "NO_SECURE_ENCLAVE")
		return &AttestationResult{
			Passed:           false,
			Rejected:         true,
			Reason:           "Secure Enclave not detected - biometric data must be processed in hardware security module",
			TrustLevel:       "untrusted",
			SecurityFlags:    securityFlags,
			DeviceFingerprint: attestation.DeviceFingerprint,
		}, nil
	}
	
	// WARNING: Developer mode enabled
	if attestation.DeveloperModeOn {
		securityFlags = append(securityFlags, "DEVELOPER_MODE_ON")
	}
	
	// Verify attestation token
	if !ha.verifyAttestationToken(attestation.AttestationToken, attestation.DeviceFingerprint) {
		securityFlags = append(securityFlags, "INVALID_ATTESTATION_TOKEN")
		return &AttestationResult{
			Passed:           false,
			Rejected:         true,
			Reason:           "Invalid attestation token - device authenticity cannot be verified",
			TrustLevel:       "untrusted",
			SecurityFlags:    securityFlags,
			DeviceFingerprint: attestation.DeviceFingerprint,
		}, nil
	}
	
	// Determine trust level
	trustLevel := ha.calculateTrustLevel(attestation, securityFlags)
	
	// Record trusted device
	ha.trustedFingerprints[attestation.DeviceFingerprint] = true
	
	return &AttestationResult{
		Passed:           true,
		Rejected:         false,
		Reason:           "Device attestation verified - secure hardware confirmed",
		TrustLevel:       trustLevel,
		SecurityFlags:    securityFlags,
		DeviceFingerprint: attestation.DeviceFingerprint,
	}, nil
}

// verifyAttestationToken validates the hardware attestation token
// In production, this would verify Apple's or Google's attestation signature
func (ha *HardwareAttestation) verifyAttestationToken(token string, deviceFingerprint string) bool {
	// MOCK: In production, verify with Apple/Google attestation APIs
	// - iOS: DeviceCheck API + App Attest
	// - Android: SafetyNet Attestation API / Play Integrity API
	
	if len(token) == 0 {
		return false
	}
	
	// Verify token format and signature
	expectedToken := ha.generateExpectedToken(deviceFingerprint)
	return token == expectedToken
}

// generateExpectedToken creates expected attestation token
func (ha *HardwareAttestation) generateExpectedToken(deviceFingerprint string) string {
	// MOCK: In production, this would be signed by Apple/Google
	hash := sha256.Sum256([]byte(deviceFingerprint + "sovrn-attestation"))
	return hex.EncodeToString(hash[:])
}

// calculateTrustLevel determines device trust level
func (ha *HardwareAttestation) calculateTrustLevel(attestation *DeviceAttestation, flags []string) string {
	if len(flags) > 0 {
		return "medium"
	}
	
	// High trust: Secure Enclave + biometric hardware
	if attestation.HasSecureEnclave && (attestation.HasFaceID || attestation.HasTouchID || attestation.HasIrisScanner) {
		return "high"
	}
	
	return "medium"
}

