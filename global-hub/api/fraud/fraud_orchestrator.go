package fraud

import (
	"context"
	"fmt"
	"time"
)

// FraudOrchestrator coordinates all fraud detection mechanisms
// Integrates velocity checks, hardware attestation, and AI liveness scoring
type FraudOrchestrator struct {
	velocityCheck       *VelocityCheck
	hardwareAttestation *HardwareAttestation
	aiLiveness          *AILivenessScoring
}

// VerificationRequest contains all data needed for fraud detection
type VerificationRequest struct {
	// Identity
	DID               string
	BiometricHash     string
	
	// Location
	Latitude          float64
	Longitude         float64
	Location          string // Human-readable (e.g., "JFK Airport, New York")
	
	// Device attestation
	DeviceAttestation *DeviceAttestation
	
	// Liveness data
	LivenessData      *LivenessData
	
	// Context
	VerificationID    string
	Timestamp         time.Time
}

// FraudCheckResult contains the comprehensive fraud analysis result
type FraudCheckResult struct {
	// Overall result
	Passed            bool
	Rejected          bool
	RequiresStepUp    bool
	
	// Fraud detection results
	VelocityCheck     *VelocityCheckResult
	HardwareCheck     *AttestationResult
	LivenessCheck     *LivenessResult
	
	// Actions required
	StepUpMethod      string // "voice_biometric", "secondary_document", "manual_review"
	Challenge         *LivenessChallenge
	
	// Risk assessment
	OverallRiskLevel  string // "none", "low", "medium", "high", "critical"
	FraudFlags        []string
	
	// Metadata
	VerificationID    string
	Timestamp         time.Time
	ProcessingTimeMs  int64
}

// NewFraudOrchestrator creates a new fraud orchestrator
func NewFraudOrchestrator() *FraudOrchestrator {
	return &FraudOrchestrator{
		velocityCheck:       NewVelocityCheck(),
		hardwareAttestation: NewHardwareAttestation(),
		aiLiveness:          NewAILivenessScoring(),
	}
}

// PerformFraudCheck runs all fraud detection checks
func (fo *FraudOrchestrator) PerformFraudCheck(
	ctx context.Context,
	req *VerificationRequest,
) (*FraudCheckResult, error) {
	
	startTime := time.Now()
	fraudFlags := []string{}
	
	// 1. VELOCITY CHECK: Detect impossible travel
	velocityResult, err := fo.velocityCheck.CheckVelocity(
		ctx,
		req.DID,
		req.Latitude,
		req.Longitude,
		req.Location,
	)
	if err != nil {
		return nil, fmt.Errorf("velocity check failed: %w", err)
	}
	
	if velocityResult.RequiresStepUp {
		fraudFlags = append(fraudFlags, "IMPOSSIBLE_TRAVEL")
	}
	
	// 2. HARDWARE ATTESTATION: Verify secure hardware
	hardwareResult, err := fo.hardwareAttestation.VerifyAttestation(
		ctx,
		req.DeviceAttestation,
	)
	if err != nil {
		return nil, fmt.Errorf("hardware attestation failed: %w", err)
	}
	
	if hardwareResult.Rejected {
		fraudFlags = append(fraudFlags, hardwareResult.SecurityFlags...)
	}
	
	// 3. AI LIVENESS SCORING: Detect deepfakes
	livenessResult, err := fo.aiLiveness.AnalyzeLiveness(
		ctx,
		req.LivenessData,
	)
	if err != nil {
		return nil, fmt.Errorf("liveness analysis failed: %w", err)
	}
	
	if livenessResult.RequiresChallenge {
		fraudFlags = append(fraudFlags, "LOW_LIVENESS_CONFIDENCE")
	}
	if livenessResult.Rejected {
		fraudFlags = append(fraudFlags, "DEEPFAKE_DETECTED")
	}
	
	// Determine overall result
	passed := velocityResult.Passed && hardwareResult.Passed && livenessResult.Passed
	rejected := hardwareResult.Rejected || livenessResult.Rejected
	requiresStepUp := velocityResult.RequiresStepUp || livenessResult.RequiresChallenge
	
	// Determine step-up method
	stepUpMethod := ""
	var challenge *LivenessChallenge
	
	if velocityResult.RequiresStepUp {
		// Impossible travel requires voice biometric
		stepUpMethod = "voice_biometric"
	} else if livenessResult.RequiresChallenge {
		// Low liveness confidence requires random challenge
		stepUpMethod = "random_challenge"
		challenge = livenessResult.Challenge
	}
	
	// Calculate overall risk level
	overallRisk := fo.calculateOverallRisk(velocityResult, hardwareResult, livenessResult)
	
	processingTime := time.Since(startTime).Milliseconds()
	
	return &FraudCheckResult{
		Passed:           passed,
		Rejected:         rejected,
		RequiresStepUp:   requiresStepUp,
		VelocityCheck:    velocityResult,
		HardwareCheck:    hardwareResult,
		LivenessCheck:    livenessResult,
		StepUpMethod:     stepUpMethod,
		Challenge:        challenge,
		OverallRiskLevel: overallRisk,
		FraudFlags:       fraudFlags,
		VerificationID:   req.VerificationID,
		Timestamp:        time.Now(),
		ProcessingTimeMs: processingTime,
	}, nil
}

// calculateOverallRisk determines the highest risk level from all checks
func (fo *FraudOrchestrator) calculateOverallRisk(
	velocity *VelocityCheckResult,
	hardware *AttestationResult,
	liveness *LivenessResult,
) string {
	
	// Hardware rejection is critical
	if hardware.Rejected {
		return "critical"
	}
	
	// Deepfake detection is critical
	if liveness.Rejected {
		return "critical"
	}
	
	// Impossible travel is high risk
	if velocity.ImpossibleTravel {
		return "high"
	}
	
	// Low liveness confidence is medium risk
	if liveness.DeepfakeRisk == "high" || liveness.DeepfakeRisk == "critical" {
		return "high"
	}
	
	if liveness.DeepfakeRisk == "medium" {
		return "medium"
	}
	
	// Hardware trust level affects overall risk
	if hardware.TrustLevel == "low" {
		return "medium"
	}
	
	if hardware.TrustLevel == "medium" {
		return "low"
	}
	
	return "none"
}

