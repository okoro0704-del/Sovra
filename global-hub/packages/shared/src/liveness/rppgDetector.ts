/**
 * TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
 * SOVRA_Presence_Engine - rPPG Pulse Detector
 *
 * Client-side biological presence verification
 *
 * Remote Photoplethysmography (rPPG)
 * - Detects heart rate through camera color sensors
 * - Analyzes subtle color changes in facial skin caused by blood flow
 * - Runs entirely on-device NPU
 *
 * Science: Blood volume changes cause tiny color variations in skin
 * Green channel is most sensitive to hemoglobin absorption
 */

import type {
  RPPGPulseDetection,
  NeuralAnalyzerConfig,
} from './types';

/**
 * rPPG Pulse Detector
 * Detects human pulse through camera without physical contact
 */
export class RPPGDetector {
  private config: NeuralAnalyzerConfig;
  private frameBuffer: ImageData[] = [];
  
  constructor(config: NeuralAnalyzerConfig) {
    this.config = config;
  }
  
  /**
   * Detect pulse using remote photoplethysmography
   * 
   * PRIVACY GUARANTEE: All processing happens on-device NPU
   * Raw video frames never leave the device
   * 
   * @param frames - Array of video frames (typically 90 frames = 3 seconds at 30fps)
   * @param npuContext - Platform-specific NPU context
   */
  async detectPulse(
    frames: ImageData[],
    npuContext: any,
  ): Promise<RPPGPulseDetection> {
    const startTime = performance.now();
    
    if (frames.length < 30) {
      // Need at least 1 second of video for reliable pulse detection
      return this.createFailedResult(startTime, frames.length, 'Insufficient frames');
    }
    
    // 1. Extract facial region of interest (ROI)
    const facialROI = await this.extractFacialROI(frames, npuContext);
    
    // 2. Extract color channel signals
    const colorSignals = await this.extractColorSignals(facialROI);
    
    // 3. Apply signal processing
    const processedSignal = await this.processSignal(colorSignals);
    
    // 4. Detect heart rate
    const heartRate = await this.detectHeartRate(processedSignal, frames.length);
    
    // 5. Calculate signal quality
    const signalQuality = this.assessSignalQuality(processedSignal);
    
    // 6. Validate biological plausibility
    const biologicallyPlausible = this.validateHeartRate(heartRate);
    
    // 7. Calculate confidence
    const confidence = this.calculateConfidence(
      signalQuality,
      biologicallyPlausible,
      processedSignal,
    );
    
    const pulseDetected = 
      heartRate !== null &&
      biologicallyPlausible &&
      confidence >= this.config.pulseConfidenceThreshold;
    
    const analysisTimeMs = performance.now() - startTime;
    
    return {
      pulseDetected,
      heartRate: heartRate ?? undefined,
      confidence,
      signalQuality: this.getSignalQualityLabel(signalQuality),
      signalNoiseRatio: signalQuality.snr,
      pulseWaveform: processedSignal.normalized,
      heartRateVariability: this.calculateHRV(processedSignal),
      redChannelStrength: colorSignals.red.strength,
      greenChannelStrength: colorSignals.green.strength,
      blueChannelStrength: colorSignals.blue.strength,
      rhythmRegularity: this.calculateRhythmRegularity(processedSignal),
      biologicallyPlausible,
      analysisTimeMs,
      framesAnalyzed: frames.length,
    };
  }
  
  /**
   * Extract facial region of interest
   * Focus on forehead and cheeks where pulse signal is strongest
   */
  private async extractFacialROI(
    frames: ImageData[],
    npuContext: any,
  ): Promise<ImageData[]> {
    // MOCK: In production, use face detection model (e.g., MediaPipe Face Mesh)
    // Extract forehead, left cheek, right cheek regions
    // These regions have good blood perfusion and minimal motion
    
    return frames; // Return full frames for mock
  }
  
  /**
   * Extract color channel signals from facial ROI
   * Green channel is most sensitive to blood volume changes
   */
  private async extractColorSignals(
    roiFrames: ImageData[],
  ): Promise<{
    red: { signal: number[]; strength: number };
    green: { signal: number[]; strength: number };
    blue: { signal: number[]; strength: number };
  }> {
    const redSignal: number[] = [];
    const greenSignal: number[] = [];
    const blueSignal: number[] = [];
    
    // Extract average color values from each frame
    for (const frame of roiFrames) {
      const { r, g, b } = this.getAverageColor(frame);
      redSignal.push(r);
      greenSignal.push(g);
      blueSignal.push(b);
    }
    
    return {
      red: { signal: redSignal, strength: this.calculateSignalStrength(redSignal) },
      green: { signal: greenSignal, strength: this.calculateSignalStrength(greenSignal) },
      blue: { signal: blueSignal, strength: this.calculateSignalStrength(blueSignal) },
    };
  }
  
  /**
   * Get average color from image data
   */
  private getAverageColor(imageData: ImageData): { r: number; g: number; b: number } {
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    
    return {
      r: r / pixelCount,
      g: g / pixelCount,
      b: b / pixelCount,
    };
  }
  
  /**
   * Calculate signal strength (standard deviation)
   */
  private calculateSignalStrength(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }
  
  /**
   * Process signal to extract pulse
   * Apply bandpass filter (0.7-4 Hz = 42-240 BPM)
   */
  private async processSignal(
    colorSignals: any,
  ): Promise<{ normalized: number[]; peaks: number[] }> {
    // Use green channel (most sensitive to hemoglobin)
    const signal = colorSignals.green.signal;
    
    // MOCK: In production, apply:
    // 1. Detrending (remove slow baseline drift)
    // 2. Bandpass filter (0.7-4 Hz for heart rate)
    // 3. Normalization
    
    // Simulate processed signal with periodic peaks
    const normalized = signal.map((v, i) => 
      Math.sin(i * 0.1) + Math.random() * 0.1
    );
    
    // Detect peaks
    const peaks = this.detectPeaks(normalized);
    
    return { normalized, peaks };
  }
  
  /**
   * Detect peaks in signal (heartbeats)
   */
  private detectPeaks(signal: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > 0) {
        peaks.push(i);
      }
    }
    return peaks;
  }
  
  /**
   * Detect heart rate from processed signal
   */
  private async detectHeartRate(
    processedSignal: { normalized: number[]; peaks: number[] },
    frameCount: number,
  ): Promise<number | null> {
    const { peaks } = processedSignal;
    
    if (peaks.length < 2) {
      return null; // Not enough peaks
    }
    
    // Calculate average time between peaks
    const peakIntervals = [];
    for (let i = 1; i < peaks.length; i++) {
      peakIntervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const avgInterval = peakIntervals.reduce((a, b) => a + b, 0) / peakIntervals.length;
    
    // Convert to BPM (assuming 30 fps)
    const fps = 30;
    const secondsPerBeat = avgInterval / fps;
    const heartRate = 60 / secondsPerBeat;
    
    return heartRate;
  }
  
  /**
   * Validate heart rate is biologically plausible
   */
  private validateHeartRate(heartRate: number | null): boolean {
    if (heartRate === null) return false;
    return heartRate >= this.config.minHeartRate && heartRate <= this.config.maxHeartRate;
  }
  
  // Additional helper methods...
  private assessSignalQuality(signal: any): { snr: number } {
    return { snr: 15 + Math.random() * 10 }; // Mock: 15-25 dB
  }
  
  private getSignalQualityLabel(quality: { snr: number }): 'excellent' | 'good' | 'fair' | 'poor' {
    if (quality.snr > 20) return 'excellent';
    if (quality.snr > 15) return 'good';
    if (quality.snr > 10) return 'fair';
    return 'poor';
  }
  
  private calculateHRV(signal: any): number {
    return 30 + Math.random() * 20; // Mock: 30-50 ms RMSSD
  }
  
  private calculateRhythmRegularity(signal: any): number {
    return 0.85 + Math.random() * 0.15; // Mock: 0.85-1.0
  }
  
  private calculateConfidence(quality: any, plausible: boolean, signal: any): number {
    if (!plausible) return 0.0;
    const baseConfidence = quality.snr / 25; // Normalize SNR to 0-1
    return Math.min(baseConfidence, 1.0);
  }
  
  private createFailedResult(startTime: number, frameCount: number, reason: string): RPPGPulseDetection {
    return {
      pulseDetected: false,
      confidence: 0.0,
      signalQuality: 'poor',
      signalNoiseRatio: 0,
      redChannelStrength: 0,
      greenChannelStrength: 0,
      blueChannelStrength: 0,
      rhythmRegularity: 0,
      biologicallyPlausible: false,
      analysisTimeMs: performance.now() - startTime,
      framesAnalyzed: frameCount,
    };
  }
}

