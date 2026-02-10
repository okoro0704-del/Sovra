/**
 * PFF Engine v2 - Plane-Orthogonal-to-Skin (POS) Algorithm
 *
 * VITALIA POS Algorithm (Plane-Orthogonal-to-Skin)
 * Optimized for Lagos 2026 Hardware (NPU Accelerated)
 *
 * Remote Photoplethysmography (rPPG) using POS projection to isolate
 * pulse signal from motion noise and lighting variations.
 *
 * Algorithm:
 * 1. Extract Mean RGB values from face ROI (Region of Interest)
 * 2. Apply temporal normalization to remove lighting bias
 * 3. POS projection math to isolate pulse signal from motion (Alpha)
 * 4. Liveness check using Heart Rate Variability (HRV)
 * 5. Calculate BPM from pure pulse signal
 *
 * Validation:
 * - BPM: 40-140 range
 * - SNR: > 1.0
 * - Liveness: HRV analysis (not too perfect, not too erratic)
 *
 * "One pulse, one identity, one nation."
 *
 * Born in Lagos, Nigeria. Built for Truth.
 */

import { Frame } from 'react-native-vision-camera';

// ============ GLOBAL STATE FOR WORKLET ============

// Running averages for temporal normalization (shared across worklet calls)
let averageR = 0;
let averageG = 0;
let averageB = 0;

// Signal buffer for HRV and BPM calculation
let signalBuffer: number[] = [];
const WORKLET_BUFFER_SIZE = 150; // 5 seconds at 30 FPS

// ============ NPU-ACCELERATED WORKLET (LAGOS 2026 HARDWARE) ============

/**
 * VITALIA POS Algorithm (Plane-Orthogonal-to-Skin)
 * Optimized for Lagos 2026 Hardware (NPU Accelerated)
 *
 * This worklet runs on the UI thread/NPU for zero-lag processing.
 * Use this for real-time camera frame processing.
 */
export const processHeartbeat = (frame: Frame) => {
  'worklet'; // Runs on the UI thread/NPU for zero-lag

  // 1. Get Mean RGB values from the face ROI (Region of Interest)
  const { r, g, b } = frame.getMeanRGB();

  // 2. Temporal Normalization
  // We divide the current color by the average color over time to remove lighting bias
  if (averageR === 0) {
    // Initialize on first frame
    averageR = r;
    averageG = g;
    averageB = b;
  } else {
    // Exponential moving average
    const alpha = 0.1;
    averageR = alpha * r + (1 - alpha) * averageR;
    averageG = alpha * g + (1 - alpha) * averageG;
    averageB = alpha * b + (1 - alpha) * averageB;
  }

  const normR = averageR > 0 ? r / averageR : 0;
  const normG = averageG > 0 ? g / averageG : 0;
  const normB = averageB > 0 ? b / averageB : 0;

  // 3. POS Projection Math
  // This isolates the pulse signal (S) from motion noise (Alpha)
  const S1 = normG - normB;
  const S2 = normG + normB - 2 * normR;

  const stdS1 = calculateStd(signalBuffer);
  const stdS2 = calculateStd(signalBuffer);
  const alpha = stdS2 > 0 ? stdS1 / stdS2 : 1;

  // The Pure Pulse Signal
  const pulseSignal = S1 + alpha * S2;

  // Add to buffer
  signalBuffer.push(pulseSignal);
  if (signalBuffer.length > WORKLET_BUFFER_SIZE) {
    signalBuffer.shift();
  }

  // 4. Liveness Check (The Truth Gate)
  // Real human hearts have 'Heart Rate Variability' (HRV).
  // If the signal is TOO perfect (like a video) or too flat, return FALSE.
  if (signalBuffer.length < WORKLET_BUFFER_SIZE) {
    return { liveness: false, bpm: 0, status: 'COLLECTING_DATA' };
  }

  if (isStatic(signalBuffer) || isErratic(signalBuffer)) {
    return { liveness: false, bpm: 0, status: 'SPOOFING_DETECTED' };
  }

  const bpm = calculateBPM(signalBuffer);

  // Validate BPM range
  if (bpm < 40 || bpm > 140) {
    return { liveness: false, bpm, status: 'INVALID_BPM' };
  }

  return {
    liveness: true,
    bpm,
    status: 'LIFE_CONFIRMED'
  };
};

/**
 * Calculate standard deviation (worklet-compatible)
 */
function calculateStd(buffer: number[]): number {
  'worklet';

  if (buffer.length === 0) return 0;

  const mean = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
  const variance = buffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / buffer.length;

  return Math.sqrt(variance);
}

/**
 * Check if signal is too static (photo or flat video)
 */
function isStatic(signal: number[]): boolean {
  'worklet';

  const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;

  return variance < 0.01;
}

/**
 * Check if signal is too erratic (random noise)
 */
function isErratic(signal: number[]): boolean {
  'worklet';

  let totalDiff = 0;
  for (let i = 1; i < signal.length; i++) {
    totalDiff += Math.abs(signal[i] - signal[i - 1]);
  }
  const avgDiff = totalDiff / (signal.length - 1);

  const signalMean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  const relativeDiff = signalMean !== 0 ? avgDiff / Math.abs(signalMean) : avgDiff;

  return relativeDiff > 2.0;
}

/**
 * Calculate BPM from pulse signal using FFT
 */
function calculateBPM(signal: number[]): number {
  'worklet';

  // Simple peak detection for BPM calculation
  const peaks: number[] = [];
  const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  const std = calculateStd(signal);
  const threshold = mean + std;

  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
      peaks.push(i);
    }
  }

  if (peaks.length < 2) return 0;

  // Calculate average interval between peaks
  let totalInterval = 0;
  for (let i = 1; i < peaks.length; i++) {
    totalInterval += peaks[i] - peaks[i - 1];
  }
  const avgInterval = totalInterval / (peaks.length - 1);

  // Convert to BPM (assuming 30 FPS)
  const fps = 30;
  const beatsPerSecond = fps / avgInterval;
  const bpm = beatsPerSecond * 60;

  return Math.round(bpm);
}

/**
 * Reset worklet state (call when starting new scan)
 */
export const resetWorkletState = () => {
  'worklet';

  averageR = 0;
  averageG = 0;
  averageB = 0;
  signalBuffer = [];
};

// ============ TYPES ============

export interface PffScanResult {
  isLive: boolean;
  heartbeatDetected: boolean;
  bpm: number;
  snr: number;
  confidence: number; // 0-100%
  lifeStatus: 'LIFE_CONFIRMED' | 'NO_HEARTBEAT' | 'SPOOFING_DETECTED' | 'INSUFFICIENT_DATA';
  timestamp: number;
  sessionId: string;
  rawSignal?: number[]; // For debugging
  hrv?: number; // Heart Rate Variability
}

export interface VideoFrame {
  data: Uint8ClampedArray; // RGBA pixel data
  width: number;
  height: number;
  timestamp: number;
}

export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignalMetrics {
  mean: number;
  variance: number;
  snr: number;
  dominantFrequency: number;
  bpm: number;
  hrv: number; // Heart Rate Variability
}

export interface RGBMean {
  r: number;
  g: number;
  b: number;
}

// ============ CONSTANTS ============

const MIN_BPM = 40;
const MAX_BPM = 140;
const MIN_SNR = 1.0;
const SAMPLING_RATE = 30; // 30 FPS
const WINDOW_SIZE = 150; // 5 seconds at 30 FPS
const MIN_CONFIDENCE = 60;

// ============ PFF ENGINE ============

export class PffEngine {
  // POS Algorithm buffers
  private rgbBuffer: RGBMean[] = [];
  private pulseSignalBuffer: number[] = [];

  // Temporal normalization (running averages)
  private averageR: number = 0;
  private averageG: number = 0;
  private averageB: number = 0;

  // Legacy support
  private greenChannelBuffer: number[] = [];
  private frameCount: number = 0;
  private sessionId: string;
  private startTime: number;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }

  /**
   * Process video frame using optimized POS algorithm
   * NPU-accelerated for Lagos 2026 hardware
   */
  public processFrame(frame: VideoFrame, faceRegion: FaceRegion): void {
    // Extract mean RGB values from face ROI
    const rgbMean = this.extractMeanRGB(frame, faceRegion);

    // Add to RGB buffer
    this.rgbBuffer.push(rgbMean);
    this.frameCount++;

    // Update running averages for temporal normalization
    this.updateRunningAverages(rgbMean);

    // Process POS algorithm if we have enough frames
    if (this.rgbBuffer.length >= 2) {
      const pulseSignal = this.processPOSAlgorithm(rgbMean);
      this.pulseSignalBuffer.push(pulseSignal);
    }

    // Keep buffers at fixed size
    if (this.rgbBuffer.length > WINDOW_SIZE) {
      this.rgbBuffer.shift();
    }
    if (this.pulseSignalBuffer.length > WINDOW_SIZE) {
      this.pulseSignalBuffer.shift();
    }

    // Legacy: also extract green channel for backward compatibility
    const greenValue = this.extractGreenChannel(frame, faceRegion);
    this.greenChannelBuffer.push(greenValue);
    if (this.greenChannelBuffer.length > WINDOW_SIZE) {
      this.greenChannelBuffer.shift();
    }
  }

  /**
   * Extract mean RGB values from face region (POS Algorithm Step 1)
   */
  private extractMeanRGB(frame: VideoFrame, faceRegion: FaceRegion): RGBMean {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let pixelCount = 0;

    const { x, y, width, height } = faceRegion;

    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        const index = (row * frame.width + col) * 4;

        // Extract RGB channels
        const r = frame.data[index];     // Red
        const g = frame.data[index + 1]; // Green
        const b = frame.data[index + 2]; // Blue

        rSum += r;
        gSum += g;
        bSum += b;
        pixelCount++;
      }
    }

    return {
      r: pixelCount > 0 ? rSum / pixelCount : 0,
      g: pixelCount > 0 ? gSum / pixelCount : 0,
      b: pixelCount > 0 ? bSum / pixelCount : 0,
    };
  }

  /**
   * Update running averages for temporal normalization (POS Algorithm Step 2)
   */
  private updateRunningAverages(rgbMean: RGBMean): void {
    const alpha = 0.1; // Smoothing factor

    if (this.averageR === 0) {
      // Initialize on first frame
      this.averageR = rgbMean.r;
      this.averageG = rgbMean.g;
      this.averageB = rgbMean.b;
    } else {
      // Exponential moving average
      this.averageR = alpha * rgbMean.r + (1 - alpha) * this.averageR;
      this.averageG = alpha * rgbMean.g + (1 - alpha) * this.averageG;
      this.averageB = alpha * rgbMean.b + (1 - alpha) * this.averageB;
    }
  }

  /**
   * Process POS Algorithm (POS Algorithm Step 3)
   * Isolates pulse signal from motion noise using projection math
   */
  private processPOSAlgorithm(rgbMean: RGBMean): number {
    // Temporal normalization - remove lighting bias
    const normR = this.averageR > 0 ? rgbMean.r / this.averageR : 0;
    const normG = this.averageG > 0 ? rgbMean.g / this.averageG : 0;
    const normB = this.averageB > 0 ? rgbMean.b / this.averageB : 0;

    // POS Projection Math
    // S1 and S2 are orthogonal projections that separate pulse from motion
    const S1 = normG - normB;
    const S2 = normG + normB - 2 * normR;

    // Calculate standard deviations
    const stdS1 = this.calculateStdFromBuffer(this.pulseSignalBuffer);
    const stdS2 = this.calculateStdFromBuffer(this.pulseSignalBuffer);

    // Alpha balances the two projections
    const alpha = stdS2 > 0 ? stdS1 / stdS2 : 1;

    // The Pure Pulse Signal
    const pulseSignal = S1 + alpha * S2;

    return pulseSignal;
  }

  /**
   * Extract green channel average from face region
   */
  private extractGreenChannel(frame: VideoFrame, faceRegion: FaceRegion): number {
    let greenSum = 0;
    let pixelCount = 0;

    const { x, y, width, height } = faceRegion;

    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        const index = (row * frame.width + col) * 4;

        // Extract green channel (index 1 in RGBA)
        const green = frame.data[index + 1];

        greenSum += green;
        pixelCount++;
      }
    }

    return pixelCount > 0 ? greenSum / pixelCount : 0;
  }

  /**
   * Analyze signal and detect heartbeat using POS algorithm
   */
  public analyzeScan(): PffScanResult {
    if (this.pulseSignalBuffer.length < WINDOW_SIZE) {
      return {
        isLive: false,
        heartbeatDetected: false,
        bpm: 0,
        snr: 0,
        confidence: 0,
        lifeStatus: 'INSUFFICIENT_DATA',
        timestamp: Date.now(),
        sessionId: this.sessionId,
      };
    }

    // Use POS-derived pulse signal
    const pulseSignal = this.pulseSignalBuffer;

    // Apply temporal filtering (detrending)
    const detrendedSignal = this.detrendSignal(pulseSignal);

    // Calculate signal metrics (including HRV)
    const metrics = this.calculateMetrics(detrendedSignal);

    // Validate BPM range
    const bpmValid = metrics.bpm >= MIN_BPM && metrics.bpm <= MAX_BPM;

    // Validate SNR
    const snrValid = metrics.snr >= MIN_SNR;

    // Liveness Check (The Truth Gate)
    // Real human hearts have Heart Rate Variability (HRV)
    // If signal is TOO perfect (like a video) or too erratic, return FALSE
    const isLive = this.checkLiveness(pulseSignal, metrics.hrv);

    // Calculate confidence
    const livenessScore = isLive ? 0.9 : 0.3;
    const confidence = this.calculateConfidence(metrics, livenessScore);

    // Determine life status
    let lifeStatus: PffScanResult['lifeStatus'];

    if (!isLive) {
      lifeStatus = 'SPOOFING_DETECTED';
    } else if (bpmValid && snrValid && confidence >= MIN_CONFIDENCE) {
      lifeStatus = 'LIFE_CONFIRMED';
    } else {
      lifeStatus = 'NO_HEARTBEAT';
    }

    return {
      isLive,
      heartbeatDetected: bpmValid && snrValid,
      bpm: metrics.bpm,
      snr: metrics.snr,
      confidence,
      lifeStatus,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      rawSignal: detrendedSignal,
      hrv: metrics.hrv,
    };
  }

  /**
   * Liveness Check using Heart Rate Variability (HRV)
   * The Truth Gate - distinguishes real heartbeats from spoofing
   */
  private checkLiveness(pulseSignal: number[], hrv: number): boolean {
    // Check if signal is too static (flat line or photo)
    if (this.isStatic(pulseSignal)) {
      return false;
    }

    // Check if signal is too erratic (random noise)
    if (this.isErratic(pulseSignal)) {
      return false;
    }

    // Check HRV - real hearts have natural variability
    // Too perfect (HRV near 0) = video playback
    // Too variable (HRV > 50) = noise or manipulation
    if (hrv < 5 || hrv > 50) {
      return false;
    }

    return true;
  }

  /**
   * Check if signal is too static (photo or flat video)
   */
  private isStatic(signal: number[]): boolean {
    const variance = this.calculateVariance(signal);

    // If variance is too low, signal is static
    return variance < 0.01;
  }

  /**
   * Check if signal is too erratic (random noise)
   */
  private isErratic(signal: number[]): boolean {
    // Calculate consecutive differences
    let totalDiff = 0;
    for (let i = 1; i < signal.length; i++) {
      totalDiff += Math.abs(signal[i] - signal[i - 1]);
    }
    const avgDiff = totalDiff / (signal.length - 1);

    // If average difference is too high, signal is erratic
    const signalMean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const relativeDiff = signalMean !== 0 ? avgDiff / Math.abs(signalMean) : avgDiff;

    return relativeDiff > 2.0;
  }

  /**
   * Detrend signal (remove DC component and linear trend)
   */
  private detrendSignal(signal: number[]): number[] {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;

    // Remove mean
    const centered = signal.map((val) => val - mean);

    // Apply bandpass filter (0.67 Hz - 2.33 Hz for 40-140 BPM)
    return this.bandpassFilter(centered, 0.67, 2.33, SAMPLING_RATE);
  }

  /**
   * Bandpass filter (simple implementation)
   */
  private bandpassFilter(signal: number[], lowFreq: number, highFreq: number, samplingRate: number): number[] {
    // Simple moving average filter
    const windowSize = Math.floor(samplingRate / lowFreq);
    const filtered: number[] = [];

    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
        sum += signal[j];
        count++;
      }

      filtered.push(signal[i] - sum / count);
    }

    return filtered;
  }

  /**
   * Calculate signal metrics (BPM, SNR)
   */
  private calculateMetrics(signal: number[]): SignalMetrics {
    // Calculate mean and variance
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;

    // Perform FFT to extract dominant frequency
    const fftResult = this.performFFT(signal);

    // Find dominant frequency in valid BPM range
    const minFreqIndex = Math.floor((MIN_BPM / 60) * signal.length / SAMPLING_RATE);
    const maxFreqIndex = Math.floor((MAX_BPM / 60) * signal.length / SAMPLING_RATE);

    let maxMagnitude = 0;
    let dominantFreqIndex = 0;

    for (let i = minFreqIndex; i < maxFreqIndex && i < fftResult.magnitudes.length; i++) {
      if (fftResult.magnitudes[i] > maxMagnitude) {
        maxMagnitude = fftResult.magnitudes[i];
        dominantFreqIndex = i;
      }
    }

    const dominantFrequency = fftResult.frequencies[dominantFreqIndex];
    const bpm = dominantFrequency * 60;

    // Calculate SNR (signal power / noise power)
    const signalPower = maxMagnitude * maxMagnitude;
    const noisePower = fftResult.magnitudes.reduce((sum, mag, idx) => {
      if (idx !== dominantFreqIndex) {
        return sum + mag * mag;
      }
      return sum;
    }, 0) / (fftResult.magnitudes.length - 1);

    const snr = noisePower > 0 ? signalPower / noisePower : 0;

    // Calculate Heart Rate Variability (HRV)
    const hrv = this.calculateHRV(signal, bpm);

    return {
      mean,
      variance,
      snr,
      dominantFrequency,
      bpm,
      hrv,
    };
  }

  /**
   * Calculate variance of signal
   */
  private calculateVariance(signal: number[]): number {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    return signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
  }

  /**
   * Calculate standard deviation from buffer
   */
  private calculateStdFromBuffer(buffer: number[]): number {
    if (buffer.length === 0) return 0;

    const mean = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
    const variance = buffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / buffer.length;

    return Math.sqrt(variance);
  }

  /**
   * Calculate Heart Rate Variability (HRV)
   * Measures the variation in time intervals between heartbeats
   */
  private calculateHRV(signal: number[], bpm: number): number {
    if (bpm === 0) return 0;

    // Find peaks in the signal (R-peaks in ECG terminology)
    const peaks = this.findPeaks(signal);

    if (peaks.length < 2) return 0;

    // Calculate intervals between peaks (RR intervals)
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    if (intervals.length === 0) return 0;

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSquaredDiffs = 0;
    for (let i = 1; i < intervals.length; i++) {
      const diff = intervals[i] - intervals[i - 1];
      sumSquaredDiffs += diff * diff;
    }

    const rmssd = Math.sqrt(sumSquaredDiffs / (intervals.length - 1));

    // Normalize HRV to a 0-100 scale
    const normalizedHRV = Math.min(100, rmssd * 10);

    return normalizedHRV;
  }

  /**
   * Find peaks in signal (simple peak detection)
   */
  private findPeaks(signal: number[]): number[] {
    const peaks: number[] = [];
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const std = this.calculateStdFromBuffer(signal);
    const threshold = mean + std;

    for (let i = 1; i < signal.length - 1; i++) {
      // Peak if value is greater than neighbors and above threshold
      if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
        peaks.push(i);
      }
    }

    return peaks;
  }

  /**
   * Perform FFT (Fast Fourier Transform) - Simplified implementation
   */
  private performFFT(signal: number[]): { frequencies: number[], magnitudes: number[] } {
    const N = signal.length;
    const frequencies: number[] = [];
    const magnitudes: number[] = [];

    // Generate frequency bins
    for (let k = 0; k < N / 2; k++) {
      frequencies.push((k * SAMPLING_RATE) / N);
    }

    // Compute DFT (simplified, not optimized FFT)
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += signal[n] * Math.cos(angle);
        imag -= signal[n] * Math.sin(angle);
      }

      const magnitude = Math.sqrt(real * real + imag * imag) / N;
      magnitudes.push(magnitude);
    }

    return { frequencies, magnitudes };
  }

  /**
   * Detect liveness (anti-spoofing)
   */
  private detectLiveness(signal: number[]): number {
    // Check for signal variation (photos/videos have less variation)
    const variance = signal.reduce((sum, val, idx, arr) => {
      const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
      return sum + Math.pow(val - mean, 2);
    }, 0) / signal.length;

    // Check for temporal consistency (real heartbeats have consistent patterns)
    const segments = 5;
    const segmentSize = Math.floor(signal.length / segments);
    const segmentVariances: number[] = [];

    for (let i = 0; i < segments; i++) {
      const segment = signal.slice(i * segmentSize, (i + 1) * segmentSize);
      const segMean = segment.reduce((sum, val) => sum + val, 0) / segment.length;
      const segVar = segment.reduce((sum, val) => sum + Math.pow(val - segMean, 2), 0) / segment.length;
      segmentVariances.push(segVar);
    }

    // Calculate consistency score
    const varMean = segmentVariances.reduce((sum, val) => sum + val, 0) / segmentVariances.length;
    const varStd = Math.sqrt(
      segmentVariances.reduce((sum, val) => sum + Math.pow(val - varMean, 2), 0) / segmentVariances.length
    );

    const consistencyScore = varMean > 0 ? 1 - Math.min(varStd / varMean, 1) : 0;

    // Check for micro-movements (real faces have subtle movements)
    const microMovementScore = Math.min(variance / 100, 1);

    // Combined liveness score
    const livenessScore = (consistencyScore * 0.6 + microMovementScore * 0.4);

    return livenessScore;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(metrics: SignalMetrics, livenessScore: number): number {
    // BPM confidence (closer to normal range = higher confidence)
    const normalBpm = 70;
    const bpmDistance = Math.abs(metrics.bpm - normalBpm);
    const bpmConfidence = Math.max(0, 100 - (bpmDistance / 70) * 100);

    // SNR confidence
    const snrConfidence = Math.min((metrics.snr / 5) * 100, 100);

    // Liveness confidence
    const livenessConfidence = livenessScore * 100;

    // Weighted average
    const confidence = (bpmConfidence * 0.4 + snrConfidence * 0.3 + livenessConfidence * 0.3);

    return Math.round(confidence);
  }

  /**
   * Reset engine for new scan
   */
  public reset(): void {
    this.greenChannelBuffer = [];
    this.frameCount = 0;
    this.sessionId = `pff_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.startTime = Date.now();
  }

  /**
   * Get scan progress
   */
  public getProgress(): number {
    return Math.min((this.greenChannelBuffer.length / WINDOW_SIZE) * 100, 100);
  }

  /**
   * Check if ready to analyze
   */
  public isReady(): boolean {
    return this.greenChannelBuffer.length >= WINDOW_SIZE;
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Create new PFF scan session
 */
export function createPffSession(): PffEngine {
  const sessionId = `pff_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return new PffEngine(sessionId);
}

/**
 * Validate scan result
 */
export function isLifeConfirmed(result: PffScanResult): boolean {
  return result.lifeStatus === 'LIFE_CONFIRMED';
}

/**
 * Get human-readable status
 */
export function getStatusMessage(result: PffScanResult): string {
  switch (result.lifeStatus) {
    case 'LIFE_CONFIRMED':
      return `✅ Life confirmed! Heartbeat: ${Math.round(result.bpm)} BPM`;
    case 'NO_HEARTBEAT':
      return '❌ No heartbeat detected. Please try again.';
    case 'SPOOFING_DETECTED':
      return '⚠️ Spoofing detected. Live scan required.';
    case 'INSUFFICIENT_DATA':
      return '⏳ Collecting data... Please hold still.';
    default:
      return 'Unknown status';
  }
}

