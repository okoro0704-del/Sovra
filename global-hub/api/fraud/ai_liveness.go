package fraud

import (
	"context"
	"fmt"
	"math/rand"
	"time"
)

// AILivenessScoring detects deepfakes and synthetic biometric data
// Uses AI-powered analysis to ensure scans come from real humans
type AILivenessScoring struct {
	// Deepfake detection threshold (99.9% = 0.999)
	confidenceThreshold float64
	
	// Random challenge generator
	rng *rand.Rand
}

// LivenessData contains biometric scan analysis
type LivenessData struct {
	// Deepfake confidence score (0.0 to 1.0)
	// 1.0 = 100% confident it's a real human
	// 0.0 = 100% confident it's synthetic/deepfake
	HumanTextureConfidence float64
	
	// Detailed analysis metrics
	SkinTextureScore      float64 // Micro-texture analysis
	BloodFlowDetected     bool    // Infrared blood flow detection
	MicroMovementScore    float64 // Natural micro-movements (breathing, pulse)
	DepthMapConsistency   float64 // 3D depth map consistency
	ReflectionAnalysis    float64 // Eye reflection analysis
	
	// Temporal consistency
	FrameConsistency      float64 // Consistency across video frames
	MotionNaturalness     float64 // Natural motion patterns
	
	// Challenge response (if previously challenged)
	ChallengeCompleted    bool
	ChallengeType         string
	ChallengeResponse     string
}

// LivenessResult contains the result of liveness analysis
type LivenessResult struct {
	Passed                bool
	RequiresChallenge     bool
	Rejected              bool
	Reason                string
	ConfidenceScore       float64
	DeepfakeRisk          string // "none", "low", "medium", "high", "critical"
	Challenge             *LivenessChallenge
	AnalysisDetails       map[string]float64
}

// LivenessChallenge contains a random challenge for the user
type LivenessChallenge struct {
	ChallengeID   string
	ChallengeType string // "look_direction", "blink_pattern", "smile", "head_tilt"
	Instructions  string
	ExpiresAt     time.Time
	Timeout       int // seconds
}

// NewAILivenessScoring creates a new AI liveness scorer
func NewAILivenessScoring() *AILivenessScoring {
	return &AILivenessScoring{
		confidenceThreshold: 0.999, // 99.9% threshold
		rng:                 rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// AnalyzeLiveness performs AI-powered deepfake detection
func (als *AILivenessScoring) AnalyzeLiveness(
	ctx context.Context,
	data *LivenessData,
) (*LivenessResult, error) {
	
	// Calculate overall confidence score
	confidenceScore := als.calculateConfidenceScore(data)
	
	// Determine deepfake risk level
	deepfakeRisk := als.assessDeepfakeRisk(confidenceScore)
	
	// Collect analysis details
	analysisDetails := map[string]float64{
		"human_texture_confidence": data.HumanTextureConfidence,
		"skin_texture_score":       data.SkinTextureScore,
		"micro_movement_score":     data.MicroMovementScore,
		"depth_map_consistency":    data.DepthMapConsistency,
		"reflection_analysis":      data.ReflectionAnalysis,
		"frame_consistency":        data.FrameConsistency,
		"motion_naturalness":       data.MotionNaturalness,
		"overall_confidence":       confidenceScore,
	}
	
	// CRITICAL: Reject if confidence is below threshold
	if confidenceScore < als.confidenceThreshold {
		// Generate random challenge
		challenge := als.generateRandomChallenge()
		
		return &LivenessResult{
			Passed:            false,
			RequiresChallenge: true,
			Rejected:          false,
			Reason:            fmt.Sprintf("Liveness confidence %.2f%% below threshold %.2f%% - random challenge required", confidenceScore*100, als.confidenceThreshold*100),
			ConfidenceScore:   confidenceScore,
			DeepfakeRisk:      deepfakeRisk,
			Challenge:         challenge,
			AnalysisDetails:   analysisDetails,
		}, nil
	}
	
	// CRITICAL: Reject if blood flow not detected
	if !data.BloodFlowDetected {
		return &LivenessResult{
			Passed:          false,
			RequiresChallenge: false,
			Rejected:        true,
			Reason:          "No blood flow detected - possible synthetic image or video",
			ConfidenceScore: confidenceScore,
			DeepfakeRisk:    "critical",
			AnalysisDetails: analysisDetails,
		}, nil
	}
	
	// Pass: High confidence, real human detected
	return &LivenessResult{
		Passed:          true,
		RequiresChallenge: false,
		Rejected:        false,
		Reason:          fmt.Sprintf("Liveness verified - %.2f%% confidence (threshold: %.2f%%)", confidenceScore*100, als.confidenceThreshold*100),
		ConfidenceScore: confidenceScore,
		DeepfakeRisk:    deepfakeRisk,
		AnalysisDetails: analysisDetails,
	}, nil
}

// calculateConfidenceScore computes overall liveness confidence
func (als *AILivenessScoring) calculateConfidenceScore(data *LivenessData) float64 {
	// Weighted average of all metrics
	weights := map[string]float64{
		"human_texture":   0.25,
		"skin_texture":    0.15,
		"micro_movement":  0.15,
		"depth_map":       0.15,
		"reflection":      0.10,
		"frame_consistency": 0.10,
		"motion_naturalness": 0.10,
	}
	
	score := 0.0
	score += data.HumanTextureConfidence * weights["human_texture"]
	score += data.SkinTextureScore * weights["skin_texture"]
	score += data.MicroMovementScore * weights["micro_movement"]
	score += data.DepthMapConsistency * weights["depth_map"]
	score += data.ReflectionAnalysis * weights["reflection"]
	score += data.FrameConsistency * weights["frame_consistency"]
	score += data.MotionNaturalness * weights["motion_naturalness"]
	
	return score
}

// assessDeepfakeRisk determines risk level based on confidence
func (als *AILivenessScoring) assessDeepfakeRisk(confidence float64) string {
	if confidence >= 0.999 {
		return "none"
	} else if confidence >= 0.99 {
		return "low"
	} else if confidence >= 0.95 {
		return "medium"
	} else if confidence >= 0.85 {
		return "high"
	}
	return "critical"
}

// generateRandomChallenge creates a random liveness challenge
func (als *AILivenessScoring) generateRandomChallenge() *LivenessChallenge {
	challenges := []struct {
		challengeType string
		instructions  string
		timeout       int
	}{
		{"look_left_blink_twice", "Look left, then blink twice", 10},
		{"look_right_smile", "Look right, then smile", 10},
		{"tilt_head_left", "Tilt your head to the left", 8},
		{"tilt_head_right", "Tilt your head to the right", 8},
		{"blink_three_times", "Blink three times slowly", 10},
		{"open_mouth_close", "Open your mouth, then close it", 8},
		{"look_up_down", "Look up, then look down", 10},
		{"smile_neutral", "Smile, then return to neutral expression", 10},
	}
	
	selected := challenges[als.rng.Intn(len(challenges))]
	
	return &LivenessChallenge{
		ChallengeID:   fmt.Sprintf("challenge-%d", time.Now().UnixNano()),
		ChallengeType: selected.challengeType,
		Instructions:  selected.instructions,
		ExpiresAt:     time.Now().Add(time.Duration(selected.timeout) * time.Second),
		Timeout:       selected.timeout,
	}
}

