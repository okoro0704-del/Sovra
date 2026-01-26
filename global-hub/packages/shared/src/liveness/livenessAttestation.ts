/**
 * SOVRA_Presence_Engine - Liveness Attestation
 *
 * Client-side attestation generation for presence verification
 *
 * Blockchain Anchoring for Liveness Verification
 * - Generates cryptographic hash of liveness result
 * - Sends attestation to SOVRA Hub for blockchain anchoring
 * - Provides tamper-proof proof of liveness verification
 *
 * PRIVACY GUARANTEE: Only hashes are sent, never raw biometric data
 */

import type {
  LivenessAttestation,
  TextureAnalysis,
  RPPGPulseDetection,
} from './types';

/**
 * Liveness Attestation Generator
 * Creates cryptographic proof of liveness verification
 */
export class LivenessAttestationGenerator {
  /**
   * Generate liveness attestation hash
   * 
   * PRIVACY GUARANTEE:
   * - Only hashes are generated, not raw biometric data
   * - Attestation can be verified without revealing biometric details
   * 
   * @param textureAnalysis - Texture analysis result
   * @param pulseDetection - rPPG pulse detection result
   * @param deviceId - Hashed device identifier
   * @param npuModel - Neural Processing Unit model name
   */
  async generateAttestation(
    textureAnalysis: TextureAnalysis,
    pulseDetection: RPPGPulseDetection,
    deviceId: string,
    npuModel: string,
  ): Promise<LivenessAttestation> {
    const captureTimestamp = Date.now();
    
    // 1. Hash texture analysis result (not raw image data)
    const textureHash = await this.hashTextureResult(textureAnalysis);
    
    // 2. Hash pulse detection result (not raw video data)
    const pulseHash = await this.hashPulseResult(pulseDetection);
    
    // 3. Determine overall liveness confirmation
    const livenessConfirmed = 
      textureAnalysis.naturalTexture &&
      pulseDetection.pulseDetected;
    
    // 4. Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      textureAnalysis,
      pulseDetection,
    );
    
    // 5. Generate attestation hash
    const attestationHash = await this.generateAttestationHash(
      textureHash,
      pulseHash,
      deviceId,
      captureTimestamp,
      livenessConfirmed,
      overallConfidence,
    );
    
    const analysisTimestamp = Date.now();
    
    return {
      attestationHash,
      livenessConfirmed,
      overallConfidence,
      textureHash,
      pulseHash,
      deviceId: await this.hashDeviceId(deviceId),
      npuModel,
      captureTimestamp,
      analysisTimestamp,
      blockchainAnchored: false, // Will be set to true after Hub anchors it
    };
  }
  
  /**
   * Hash texture analysis result
   * Creates deterministic hash of texture metrics (not raw image)
   */
  private async hashTextureResult(texture: TextureAnalysis): Promise<string> {
    const data = {
      naturalTexture: texture.naturalTexture,
      confidence: texture.confidence,
      skinPoreDetection: texture.skinPoreDetection,
      microWrinkleScore: texture.microWrinkleScore,
      hairFollicleDetection: texture.hairFollicleDetection,
      skinImperfections: texture.skinImperfections,
      screenReplay: {
        isScreenReplay: texture.screenReplay.isScreenReplay,
        confidence: texture.screenReplay.confidence,
      },
    };
    
    return await this.sha256(JSON.stringify(data));
  }
  
  /**
   * Hash pulse detection result
   * Creates deterministic hash of pulse metrics (not raw video)
   */
  private async hashPulseResult(pulse: RPPGPulseDetection): Promise<string> {
    const data = {
      pulseDetected: pulse.pulseDetected,
      heartRate: pulse.heartRate,
      confidence: pulse.confidence,
      signalQuality: pulse.signalQuality,
      biologicallyPlausible: pulse.biologicallyPlausible,
    };
    
    return await this.sha256(JSON.stringify(data));
  }
  
  /**
   * Generate attestation hash
   * Combines all components into single cryptographic hash
   */
  private async generateAttestationHash(
    textureHash: string,
    pulseHash: string,
    deviceId: string,
    timestamp: number,
    livenessConfirmed: boolean,
    confidence: number,
  ): Promise<string> {
    const data = {
      textureHash,
      pulseHash,
      deviceId,
      timestamp,
      livenessConfirmed,
      confidence: Math.round(confidence * 1000) / 1000, // 3 decimal places
      version: '1.0.0', // Attestation format version
    };
    
    return await this.sha256(JSON.stringify(data));
  }
  
  /**
   * Hash device identifier
   * Ensures device ID is anonymized
   */
  private async hashDeviceId(deviceId: string): Promise<string> {
    return await this.sha256(deviceId);
  }
  
  /**
   * Calculate overall confidence
   * Weighted average of texture and pulse confidence
   */
  private calculateOverallConfidence(
    texture: TextureAnalysis,
    pulse: RPPGPulseDetection,
  ): number {
    // Texture: 60% weight (more critical for anti-spoofing)
    // Pulse: 40% weight (confirms liveness)
    const overallConfidence = 
      texture.confidence * 0.6 +
      pulse.confidence * 0.4;
    
    return Math.round(overallConfidence * 1000) / 1000; // 3 decimal places
  }
  
  /**
   * SHA-256 hash function
   * Uses Web Crypto API (browser) or crypto module (Node.js)
   */
  private async sha256(message: string): Promise<string> {
    // Browser environment
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Node.js environment
    if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(message).digest('hex');
      } catch (e) {
        // Fallback to simple hash for mock
        return this.simpleMockHash(message);
      }
    }
    
    // Fallback for other environments
    return this.simpleMockHash(message);
  }
  
  /**
   * Simple mock hash for environments without crypto
   * NOT SECURE - only for development/testing
   */
  private simpleMockHash(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Send attestation to SOVRN Hub for blockchain anchoring
 */
export async function sendAttestationToHub(
  attestation: LivenessAttestation,
  hubEndpoint: string,
  authToken: string,
): Promise<{ success: boolean; transactionHash?: string; blockHeight?: number }> {
  try {
    const response = await fetch(`${hubEndpoint}/v1/liveness/attest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        attestation_hash: attestation.attestationHash,
        liveness_confirmed: attestation.livenessConfirmed,
        overall_confidence: attestation.overallConfidence,
        texture_hash: attestation.textureHash,
        pulse_hash: attestation.pulseHash,
        device_id: attestation.deviceId,
        npu_model: attestation.npuModel,
        capture_timestamp: attestation.captureTimestamp,
        analysis_timestamp: attestation.analysisTimestamp,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Hub returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      transactionHash: result.transaction_hash,
      blockHeight: result.block_height,
    };
  } catch (error) {
    console.error('Failed to send attestation to Hub:', error);
    return { success: false };
  }
}

