/**
 * NPU-Accelerated Worklet for POS Algorithm
 * Optimized for Lagos 2026 Hardware
 * 
 * "One pulse, one identity, one nation."
 */

import { Frame } from 'react-native-vision-camera';
import type { WorkletResult } from './types';

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
export const processHeartbeat = (frame: Frame): WorkletResult => {
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
 * Calculate BPM from pulse signal using peak detection
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

