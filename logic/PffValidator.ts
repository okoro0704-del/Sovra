/**
 * PFF Validator - Remote Photoplethysmography (rPPG) Heartbeat Sensing
 * 
 * Presence Factor Fabric (PFF) - Biological Liveness Verification
 * Technology: rPPG (Remote Heartbeat Sensing via Camera)
 * 
 * This module validates human presence by detecting heartbeat through
 * subtle color changes in facial skin captured by mobile camera sensors.
 * 
 * Born in Lagos, Nigeria. Powered by Biology.
 */

// ============ TYPES ============

export interface RppgSignal {
  timestamp: number;
  redChannel: number[];
  greenChannel: number[];
  blueChannel: number[];
  frameRate: number;
}

export interface HeartbeatMetrics {
  bpm: number; // Beats per minute
  confidence: number; // 0-100
  signalQuality: number; // 0-100
  isLive: boolean;
}

export interface PffValidationResult {
  isValid: boolean;
  heartbeatDetected: boolean;
  metrics: HeartbeatMetrics;
  timestamp: number;
  sessionId: string;
  spoofingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  validationHash: string;
}

// ============ CONSTANTS ============

const VALID_BPM_RANGE = { min: 45, max: 180 }; // Normal human heart rate range
const MIN_CONFIDENCE_THRESHOLD = 75; // Minimum confidence for valid detection
const MIN_SIGNAL_QUALITY = 60; // Minimum signal quality
const ANALYSIS_WINDOW_SECONDS = 10; // Analyze 10 seconds of data
const TEMPORAL_CONSISTENCY_THRESHOLD = 0.85; // 85% consistency required

// ============ CORE VALIDATION ============

/**
 * Validate PFF using rPPG heartbeat detection
 * @param signal Raw rPPG signal from mobile camera
 * @param sessionId Unique session identifier
 * @returns Validation result with liveness determination
 */
export async function validatePff(
  signal: RppgSignal,
  sessionId: string
): Promise<PffValidationResult> {
  // Step 1: Extract heartbeat from rPPG signal
  const heartbeatMetrics = await extractHeartbeat(signal);

  // Step 2: Validate heartbeat is within human range
  const isValidBpm = isValidHeartRate(heartbeatMetrics.bpm);

  // Step 3: Check signal quality and confidence
  const hasGoodQuality =
    heartbeatMetrics.confidence >= MIN_CONFIDENCE_THRESHOLD &&
    heartbeatMetrics.signalQuality >= MIN_SIGNAL_QUALITY;

  // Step 4: Temporal consistency check (anti-spoofing)
  const spoofingRisk = assessSpoofingRisk(signal, heartbeatMetrics);

  // Step 5: Determine liveness
  const isLive =
    heartbeatMetrics.isLive &&
    isValidBpm &&
    hasGoodQuality &&
    spoofingRisk !== 'HIGH';

  // Step 6: Generate validation hash
  const validationHash = generateValidationHash(
    signal,
    heartbeatMetrics,
    sessionId
  );

  return {
    isValid: isLive,
    heartbeatDetected: heartbeatMetrics.bpm > 0,
    metrics: heartbeatMetrics,
    timestamp: Date.now(),
    sessionId,
    spoofingRisk,
    validationHash,
  };
}

// ============ HEARTBEAT EXTRACTION ============

/**
 * Extract heartbeat from rPPG signal using green channel analysis
 * @param signal Raw rPPG signal
 * @returns Heartbeat metrics
 */
async function extractHeartbeat(signal: RppgSignal): Promise<HeartbeatMetrics> {
  // Green channel is most sensitive to blood volume changes
  const greenChannel = signal.greenChannel;

  // Step 1: Detrend signal (remove DC component)
  const detrendedSignal = detrendSignal(greenChannel);

  // Step 2: Apply bandpass filter (0.75 Hz - 3 Hz = 45-180 BPM)
  const filteredSignal = bandpassFilter(
    detrendedSignal,
    signal.frameRate,
    VALID_BPM_RANGE.min / 60,
    VALID_BPM_RANGE.max / 60
  );

  // Step 3: Perform FFT to find dominant frequency
  const fftResult = performFFT(filteredSignal, signal.frameRate);

  // Step 4: Extract BPM from dominant frequency
  const bpm = fftResult.dominantFrequency * 60;

  // Step 5: Calculate confidence based on peak prominence
  const confidence = calculateConfidence(fftResult);

  // Step 6: Assess signal quality
  const signalQuality = assessSignalQuality(signal, filteredSignal);

  // Step 7: Determine liveness based on signal characteristics
  const isLive = isLiveSignal(filteredSignal, fftResult);

  return {
    bpm: Math.round(bpm),
    confidence: Math.round(confidence),
    signalQuality: Math.round(signalQuality),
    isLive,
  };
}

// ============ SIGNAL PROCESSING ============

/**
 * Remove DC component from signal (detrending)
 */
function detrendSignal(signal: number[]): number[] {
  const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  return signal.map((val) => val - mean);
}

/**
 * Apply bandpass filter to isolate heartbeat frequencies
 * @param signal Input signal
 * @param sampleRate Sample rate (Hz)
 * @param lowCutoff Low cutoff frequency (Hz)
 * @param highCutoff High cutoff frequency (Hz)
 */
function bandpassFilter(
  signal: number[],
  sampleRate: number,
  lowCutoff: number,
  highCutoff: number
): number[] {
  // Simplified bandpass filter implementation
  // In production, use a proper Butterworth or Chebyshev filter
  const filtered: number[] = [];

  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;

    // Moving average window
    const windowSize = Math.floor(sampleRate / ((lowCutoff + highCutoff) / 2));

    for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
      sum += signal[j];
      count++;
    }

    filtered.push(signal[i] - sum / count);
  }

  return filtered;
}

/**
 * Perform FFT to find dominant frequency (heartbeat)
 */
function performFFT(
  signal: number[],
  sampleRate: number
): { dominantFrequency: number; peakPower: number; spectrum: number[] } {
  // Simplified FFT implementation
  // In production, use a proper FFT library like fft.js
  const n = signal.length;
  const spectrum: number[] = [];

  // Calculate power spectrum
  for (let k = 0; k < n / 2; k++) {
    let real = 0;
    let imag = 0;

    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      real += signal[t] * Math.cos(angle);
      imag += signal[t] * Math.sin(angle);
    }

    const power = Math.sqrt(real * real + imag * imag);
    spectrum.push(power);
  }

  // Find dominant frequency
  let maxPower = 0;
  let maxIndex = 0;

  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > maxPower) {
      maxPower = spectrum[i];
      maxIndex = i;
    }
  }

  const dominantFrequency = (maxIndex * sampleRate) / n;

  return { dominantFrequency, peakPower: maxPower, spectrum };
}

/**
 * Calculate confidence based on FFT peak prominence
 */
function calculateConfidence(fftResult: {
  dominantFrequency: number;
  peakPower: number;
  spectrum: number[];
}): number {
  const { peakPower, spectrum } = fftResult;

  // Calculate average power
  const avgPower = spectrum.reduce((sum, val) => sum + val, 0) / spectrum.length;

  // Signal-to-noise ratio
  const snr = peakPower / (avgPower + 1e-10);

  // Convert SNR to confidence (0-100)
  const confidence = Math.min(100, (snr / 10) * 100);

  return confidence;
}

/**
 * Assess signal quality based on noise and consistency
 */
function assessSignalQuality(signal: RppgSignal, filteredSignal: number[]): number {
  // Calculate signal variance
  const mean = filteredSignal.reduce((sum, val) => sum + val, 0) / filteredSignal.length;
  const variance =
    filteredSignal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    filteredSignal.length;

  // Higher variance = better signal (more pronounced heartbeat)
  const varianceScore = Math.min(100, variance * 1000);

  // Check channel consistency (all channels should show similar patterns)
  const channelConsistency = calculateChannelConsistency(signal);

  // Combined quality score
  const quality = (varianceScore * 0.6 + channelConsistency * 0.4);

  return quality;
}

/**
 * Calculate consistency across RGB channels
 */
function calculateChannelConsistency(signal: RppgSignal): number {
  const { redChannel, greenChannel, blueChannel } = signal;

  // Calculate correlation between channels
  const rgCorr = calculateCorrelation(redChannel, greenChannel);
  const rbCorr = calculateCorrelation(redChannel, blueChannel);
  const gbCorr = calculateCorrelation(greenChannel, blueChannel);

  // Average correlation
  const avgCorr = (rgCorr + rbCorr + gbCorr) / 3;

  // Convert to 0-100 scale
  return (avgCorr + 1) * 50;
}

/**
 * Calculate correlation between two signals
 */
function calculateCorrelation(signal1: number[], signal2: number[]): number {
  const n = Math.min(signal1.length, signal2.length);

  const mean1 = signal1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const mean2 = signal2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = signal1[i] - mean1;
    const diff2 = signal2[i] - mean2;

    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  return numerator / (Math.sqrt(denom1 * denom2) + 1e-10);
}

/**
 * Determine if signal characteristics indicate live human
 */
function isLiveSignal(
  filteredSignal: number[],
  fftResult: { dominantFrequency: number; peakPower: number; spectrum: number[] }
): boolean {
  // Check 1: Dominant frequency is in valid BPM range
  const bpm = fftResult.dominantFrequency * 60;
  if (bpm < VALID_BPM_RANGE.min || bpm > VALID_BPM_RANGE.max) {
    return false;
  }

  // Check 2: Signal has sufficient power
  if (fftResult.peakPower < 0.1) {
    return false;
  }

  // Check 3: Signal shows natural variability (not synthetic)
  const variance =
    filteredSignal.reduce((sum, val) => sum + Math.pow(val, 2), 0) /
    filteredSignal.length;

  if (variance < 0.001) {
    return false; // Too uniform, likely synthetic
  }

  return true;
}

// ============ ANTI-SPOOFING ============

/**
 * Check if heart rate is within valid human range
 */
function isValidHeartRate(bpm: number): boolean {
  return bpm >= VALID_BPM_RANGE.min && bpm <= VALID_BPM_RANGE.max;
}

/**
 * Assess spoofing risk based on temporal consistency
 */
function assessSpoofingRisk(
  signal: RppgSignal,
  metrics: HeartbeatMetrics
): 'LOW' | 'MEDIUM' | 'HIGH' {
  // Check 1: Temporal consistency (heart rate should vary naturally)
  const temporalConsistency = checkTemporalConsistency(signal);

  // Check 2: Signal naturalness (should have organic variability)
  const signalNaturalness = checkSignalNaturalness(signal);

  // Check 3: Multi-channel validation (all channels should correlate)
  const channelValidity = calculateChannelConsistency(signal);

  // Calculate overall risk score
  const riskScore =
    temporalConsistency * 0.4 +
    signalNaturalness * 0.3 +
    channelValidity * 0.3;

  if (riskScore >= 80) return 'LOW';
  if (riskScore >= 60) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Check temporal consistency of heartbeat signal
 */
function checkTemporalConsistency(signal: RppgSignal): number {
  const { greenChannel, frameRate } = signal;

  // Divide signal into segments
  const segmentSize = Math.floor(frameRate * 2); // 2-second segments
  const segments: number[][] = [];

  for (let i = 0; i < greenChannel.length; i += segmentSize) {
    segments.push(greenChannel.slice(i, i + segmentSize));
  }

  if (segments.length < 2) return 50; // Not enough data

  // Calculate BPM for each segment
  const segmentBpms: number[] = [];

  for (const segment of segments) {
    if (segment.length < segmentSize / 2) continue;

    const detrended = detrendSignal(segment);
    const filtered = bandpassFilter(
      detrended,
      frameRate,
      VALID_BPM_RANGE.min / 60,
      VALID_BPM_RANGE.max / 60
    );
    const fft = performFFT(filtered, frameRate);
    segmentBpms.push(fft.dominantFrequency * 60);
  }

  // Calculate variance in BPM across segments
  const meanBpm = segmentBpms.reduce((sum, val) => sum + val, 0) / segmentBpms.length;
  const variance =
    segmentBpms.reduce((sum, val) => sum + Math.pow(val - meanBpm, 2), 0) /
    segmentBpms.length;

  // Natural heart rate should vary slightly (2-10 BPM variance)
  // Too consistent = spoofing, too variable = noise
  if (variance < 1) return 30; // Too consistent (likely replay attack)
  if (variance > 100) return 40; // Too variable (likely noise)

  return 100; // Natural variability
}

/**
 * Check signal naturalness (organic vs synthetic)
 */
function checkSignalNaturalness(signal: RppgSignal): number {
  const { greenChannel } = signal;

  // Check 1: Signal should have micro-variations (not perfectly smooth)
  const microVariations = calculateMicroVariations(greenChannel);

  // Check 2: Signal should have natural noise floor
  const noiseFloor = calculateNoiseFloor(greenChannel);

  // Combine scores
  const naturalness = (microVariations * 0.6 + noiseFloor * 0.4);

  return naturalness;
}

/**
 * Calculate micro-variations in signal (high-frequency components)
 */
function calculateMicroVariations(signal: number[]): number {
  let variations = 0;

  for (let i = 1; i < signal.length; i++) {
    variations += Math.abs(signal[i] - signal[i - 1]);
  }

  const avgVariation = variations / (signal.length - 1);

  // Natural signals have small but non-zero variations
  if (avgVariation < 0.001) return 20; // Too smooth (synthetic)
  if (avgVariation > 10) return 30; // Too noisy

  return 100; // Natural
}

/**
 * Calculate noise floor (background noise level)
 */
function calculateNoiseFloor(signal: number[]): number {
  const detrended = detrendSignal(signal);

  // Calculate standard deviation
  const mean = detrended.reduce((sum, val) => sum + val, 0) / detrended.length;
  const variance =
    detrended.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    detrended.length;
  const stdDev = Math.sqrt(variance);

  // Natural signals have moderate noise floor
  if (stdDev < 0.01) return 30; // Too clean (synthetic)
  if (stdDev > 5) return 40; // Too noisy

  return 100; // Natural noise floor
}

/**
 * Generate cryptographic validation hash
 */
function generateValidationHash(
  signal: RppgSignal,
  metrics: HeartbeatMetrics,
  sessionId: string
): string {
  // Create validation payload
  const payload = {
    sessionId,
    timestamp: signal.timestamp,
    bpm: metrics.bpm,
    confidence: metrics.confidence,
    signalQuality: metrics.signalQuality,
    // Include sample of signal for verification
    signalSample: signal.greenChannel.slice(0, 10),
  };

  // Generate hash (in production, use crypto.subtle.digest)
  const payloadString = JSON.stringify(payload);
  let hash = 0;

  for (let i = 0; i < payloadString.length; i++) {
    const char = payloadString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `pff_${Math.abs(hash).toString(16)}_${sessionId.slice(0, 8)}`;
}

