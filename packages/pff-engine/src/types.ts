/**
 * PFF Engine Types
 */

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

/**
 * Worklet result (simplified for NPU processing)
 */
export interface WorkletResult {
  liveness: boolean;
  bpm: number;
  status: 'LIFE_CONFIRMED' | 'SPOOFING_DETECTED' | 'INVALID_BPM' | 'COLLECTING_DATA';
}

