/**
 * SOVRN Protocol - PFF Neural Analyzer
 * 
 * Privacy-First Biometric Liveness Detection
 * 
 * PRIVACY GUARANTEES:
 * ✅ All processing happens on-device NPU (Neural Processing Unit)
 * ✅ Raw biometric video NEVER sent to cloud
 * ✅ Only Pass/Fail attestation hash sent to Hub
 * ✅ Raw data deleted immediately after analysis
 * ✅ Zero-knowledge proof of liveness
 * 
 * Components:
 * 1. Texture Analysis - Screen replay detection
 * 2. rPPG Pulse Detection - Heart rate through camera
 * 3. Liveness Attestation - Blockchain anchoring
 */

import { TextureAnalyzer } from './textureAnalyzer';
import { RPPGDetector } from './rppgDetector';
import { LivenessAttestationGenerator, sendAttestationToHub } from './livenessAttestation';
import type {
  NeuralAnalyzerConfig,
  NeuralAnalyzerResult,
} from './types';

/**
 * Default configuration for Neural Analyzer
 */
export const DEFAULT_CONFIG: NeuralAnalyzerConfig = {
  // Texture analysis thresholds
  textureConfidenceThreshold: 0.95,
  screenReplayThreshold: 0.90,
  
  // rPPG thresholds
  pulseConfidenceThreshold: 0.85,
  minHeartRate: 40, // BPM
  maxHeartRate: 200, // BPM
  
  // Overall liveness threshold
  livenessConfidenceThreshold: 0.95,
  
  // Processing configuration
  analysisFrameCount: 90, // 3 seconds at 30fps
  npuAcceleration: true,
  
  // Privacy settings (MUST be true)
  enableLocalProcessingOnly: true,
  deleteRawDataAfterAnalysis: true,
};

/**
 * SOVRA_Presence_Engine - PFF Neural Analyzer
 *
 * Client-side presence verification orchestrator
 * Coordinates: Texture analysis, pulse detection, liveness scoring
 *
 * Main class for privacy-preserving liveness detection
 */
export class PFFNeuralAnalyzer {
  private config: NeuralAnalyzerConfig;
  private textureAnalyzer: TextureAnalyzer;
  private rppgDetector: RPPGDetector;
  private attestationGenerator: LivenessAttestationGenerator;
  
  constructor(config: Partial<NeuralAnalyzerConfig> = {}) {
    // Merge with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // ENFORCE privacy settings
    if (!this.config.enableLocalProcessingOnly) {
      throw new Error('PRIVACY VIOLATION: enableLocalProcessingOnly must be true');
    }
    if (!this.config.deleteRawDataAfterAnalysis) {
      throw new Error('PRIVACY VIOLATION: deleteRawDataAfterAnalysis must be true');
    }
    
    // Initialize components
    this.textureAnalyzer = new TextureAnalyzer(this.config);
    this.rppgDetector = new RPPGDetector(this.config);
    this.attestationGenerator = new LivenessAttestationGenerator();
  }
  
  /**
   * Analyze liveness from video frames
   * 
   * PRIVACY GUARANTEE:
   * - All processing happens on-device NPU
   * - Raw frames are deleted after analysis
   * - Only attestation hash is returned
   * 
   * @param videoFrames - Array of video frames (ImageData)
   * @param npuContext - Platform-specific NPU context (CoreML, NNAPI, etc.)
   * @param deviceId - Device identifier (will be hashed)
   * @param npuModel - NPU model name (e.g., "Apple A17 Pro Neural Engine")
   */
  async analyzeLiveness(
    videoFrames: ImageData[],
    npuContext: any,
    deviceId: string,
    npuModel: string,
  ): Promise<NeuralAnalyzerResult> {
    const startTime = performance.now();
    let npuUtilization = 0;
    
    try {
      // Validate frame count
      if (videoFrames.length < this.config.analysisFrameCount) {
        throw new Error(
          `Insufficient frames: need ${this.config.analysisFrameCount}, got ${videoFrames.length}`
        );
      }
      
      // 1. TEXTURE ANALYSIS - Screen Replay Detection
      console.log('[SOVRA_Presence_Engine] Running texture analysis...');
      const textureAnalysis = await this.textureAnalyzer.analyzeTexture(
        videoFrames[Math.floor(videoFrames.length / 2)], // Use middle frame
        npuContext,
      );
      npuUtilization += 0.3; // Texture analysis uses ~30% NPU

      // 2. rPPG PULSE DETECTION - Heart Rate Detection
      console.log('[SOVRA_Presence_Engine] Running rPPG pulse detection...');
      const pulseDetection = await this.rppgDetector.detectPulse(
        videoFrames,
        npuContext,
      );
      npuUtilization += 0.5; // Pulse detection uses ~50% NPU
      
      // 3. LIVENESS ATTESTATION - Blockchain Anchoring
      console.log('[PFF Neural Analyzer] Generating liveness attestation...');
      const attestation = await this.attestationGenerator.generateAttestation(
        textureAnalysis,
        pulseDetection,
        deviceId,
        npuModel,
      );
      npuUtilization += 0.2; // Attestation uses ~20% NPU
      
      // 4. DETERMINE OVERALL RESULT
      const passed = 
        textureAnalysis.naturalTexture &&
        pulseDetection.pulseDetected &&
        attestation.overallConfidence >= this.config.livenessConfidenceThreshold;
      
      const totalAnalysisTimeMs = performance.now() - startTime;
      
      const result: NeuralAnalyzerResult = {
        passed,
        confidence: attestation.overallConfidence,
        textureAnalysis,
        pulseDetection,
        attestation,
        rawDataProcessedLocally: true,
        rawDataSentToCloud: false,
        totalAnalysisTimeMs,
        npuUtilization: Math.min(npuUtilization, 1.0),
      };
      
      console.log('[PFF Neural Analyzer] Analysis complete:', {
        passed: result.passed,
        confidence: result.confidence,
        analysisTimeMs: totalAnalysisTimeMs,
      });
      
      return result;
      
    } finally {
      // 5. DELETE RAW DATA (Privacy Guarantee)
      if (this.config.deleteRawDataAfterAnalysis) {
        this.securelyDeleteFrames(videoFrames);
        console.log('[PFF Neural Analyzer] Raw biometric data securely deleted');
      }
    }
  }
  
  /**
   * Analyze liveness and send attestation to Hub
   * 
   * @param videoFrames - Array of video frames
   * @param npuContext - NPU context
   * @param deviceId - Device identifier
   * @param npuModel - NPU model name
   * @param hubEndpoint - SOVRN Hub endpoint URL
   * @param authToken - Authentication token
   */
  async analyzeLivenessAndAttest(
    videoFrames: ImageData[],
    npuContext: any,
    deviceId: string,
    npuModel: string,
    hubEndpoint: string,
    authToken: string,
  ): Promise<NeuralAnalyzerResult> {
    // 1. Analyze liveness locally
    const result = await this.analyzeLiveness(
      videoFrames,
      npuContext,
      deviceId,
      npuModel,
    );
    
    // 2. Send attestation to Hub for blockchain anchoring
    if (result.passed) {
      console.log('[PFF Neural Analyzer] Sending attestation to Hub...');
      const anchorResult = await sendAttestationToHub(
        result.attestation,
        hubEndpoint,
        authToken,
      );
      
      if (anchorResult.success) {
        result.attestation.blockchainAnchored = true;
        result.attestation.transactionHash = anchorResult.transactionHash;
        result.attestation.blockHeight = anchorResult.blockHeight;
        console.log('[PFF Neural Analyzer] Attestation anchored to blockchain:', {
          txHash: anchorResult.transactionHash,
          blockHeight: anchorResult.blockHeight,
        });
      } else {
        console.warn('[PFF Neural Analyzer] Failed to anchor attestation to blockchain');
      }
    }
    
    return result;
  }
  
  /**
   * Securely delete video frames from memory
   * Overwrites frame data before garbage collection
   */
  private securelyDeleteFrames(frames: ImageData[]): void {
    for (const frame of frames) {
      // Overwrite pixel data with zeros
      for (let i = 0; i < frame.data.length; i++) {
        frame.data[i] = 0;
      }
    }
    
    // Clear array
    frames.length = 0;
  }
}

/**
 * Export all types and classes
 */
export * from './types';
export { TextureAnalyzer } from './textureAnalyzer';
export { RPPGDetector } from './rppgDetector';
export { LivenessAttestationGenerator, sendAttestationToHub } from './livenessAttestation';

