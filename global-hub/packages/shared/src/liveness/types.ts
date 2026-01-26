/**
 * SOVRN Protocol - PFF Neural Analyzer Types
 * 
 * Privacy-First Biometric Liveness Detection
 * - All processing happens on-device (NPU)
 * - Raw biometric data NEVER leaves the device
 * - Only Pass/Fail attestation sent to Hub
 */

// ============================================================================
// Texture Analysis Types
// ============================================================================

/**
 * Screen Replay Detection Result
 * Detects tiny pixel artifacts when someone holds a phone up to camera
 */
export interface ScreenReplayAnalysis {
  // Detection result
  isScreenReplay: boolean;
  confidence: number; // 0.0 to 1.0
  
  // Artifact detection
  pixelGridDetected: boolean;
  moirePatternDetected: boolean;
  refreshRateArtifacts: boolean;
  
  // Screen characteristics
  screenPixelDensity?: number; // PPI if detected
  refreshRate?: number; // Hz if detected
  
  // Analysis metadata
  analysisTimeMs: number;
}

/**
 * Texture Analysis Result
 * AI-powered skin texture and micro-detail analysis
 */
export interface TextureAnalysis {
  // Overall result
  naturalTexture: boolean;
  confidence: number; // 0.0 to 1.0
  
  // Detailed metrics
  skinPoreDetection: number; // 0.0 to 1.0
  microWrinkleScore: number; // 0.0 to 1.0
  hairFollicleDetection: number; // 0.0 to 1.0
  skinImperfections: number; // 0.0 to 1.0
  
  // Screen replay detection
  screenReplay: ScreenReplayAnalysis;
  
  // Analysis metadata
  analysisTimeMs: number;
}

// ============================================================================
// rPPG Pulse Detection Types
// ============================================================================

/**
 * Remote Photoplethysmography (rPPG) Result
 * Detects heart rate through camera color sensors
 */
export interface RPPGPulseDetection {
  // Detection result
  pulseDetected: boolean;
  heartRate?: number; // BPM (beats per minute)
  confidence: number; // 0.0 to 1.0
  
  // Signal quality
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
  signalNoiseRatio: number; // dB
  
  // Pulse characteristics
  pulseWaveform?: number[]; // Raw pulse signal (normalized)
  heartRateVariability?: number; // RMSSD in ms
  
  // Color channel analysis
  redChannelStrength: number; // 0.0 to 1.0
  greenChannelStrength: number; // 0.0 to 1.0
  blueChannelStrength: number; // 0.0 to 1.0
  
  // Validation
  rhythmRegularity: number; // 0.0 to 1.0 (1.0 = very regular)
  biologicallyPlausible: boolean; // 40-200 BPM range
  
  // Analysis metadata
  analysisTimeMs: number;
  framesAnalyzed: number;
}

// ============================================================================
// Liveness Attestation Types
// ============================================================================

/**
 * Liveness Attestation Hash
 * Cryptographic proof of liveness verification
 */
export interface LivenessAttestation {
  // Attestation hash (SHA-256)
  attestationHash: string;
  
  // Verification result
  livenessConfirmed: boolean;
  overallConfidence: number; // 0.0 to 1.0
  
  // Component results (hashed, not raw data)
  textureHash: string; // Hash of texture analysis result
  pulseHash: string; // Hash of rPPG result
  
  // Device information (for attestation)
  deviceId: string; // Hashed device identifier
  npuModel: string; // Neural Processing Unit model
  
  // Timestamps
  captureTimestamp: number; // Unix timestamp (ms)
  analysisTimestamp: number; // Unix timestamp (ms)
  
  // Blockchain anchoring
  blockchainAnchored: boolean;
  transactionHash?: string; // Blockchain transaction hash
  blockHeight?: number; // Block number
}

/**
 * Neural Analyzer Result
 * Complete liveness analysis result
 */
export interface NeuralAnalyzerResult {
  // Overall result
  passed: boolean;
  confidence: number; // 0.0 to 1.0
  
  // Component analyses
  textureAnalysis: TextureAnalysis;
  pulseDetection: RPPGPulseDetection;
  
  // Liveness attestation
  attestation: LivenessAttestation;
  
  // Privacy guarantee
  rawDataProcessedLocally: true; // Always true
  rawDataSentToCloud: false; // Always false
  
  // Performance metrics
  totalAnalysisTimeMs: number;
  npuUtilization: number; // 0.0 to 1.0
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Neural Analyzer Configuration
 */
export interface NeuralAnalyzerConfig {
  // Texture analysis thresholds
  textureConfidenceThreshold: number; // Default: 0.95
  screenReplayThreshold: number; // Default: 0.90
  
  // rPPG thresholds
  pulseConfidenceThreshold: number; // Default: 0.85
  minHeartRate: number; // Default: 40 BPM
  maxHeartRate: number; // Default: 200 BPM
  
  // Overall liveness threshold
  livenessConfidenceThreshold: number; // Default: 0.95
  
  // Processing configuration
  analysisFrameCount: number; // Default: 90 frames (3 seconds at 30fps)
  npuAcceleration: boolean; // Default: true
  
  // Privacy settings
  enableLocalProcessingOnly: boolean; // Default: true (MUST be true)
  deleteRawDataAfterAnalysis: boolean; // Default: true
}

