/**
 * @vitalia/pff-engine
 * 
 * Presence Factor Fabric - POS Algorithm for rPPG Heartbeat Detection
 * Optimized for Lagos 2026 Hardware (NPU Accelerated)
 * 
 * "One pulse, one identity, one nation."
 */

export { processHeartbeat, resetWorkletState } from './worklet';
export { PffEngine } from './PffEngine';
export { VitalizedGate } from './VitalizedGate';
export {
  extractVitalSigns,
  analyzeVitals,
  getVitalStatus,
  VitalStatus,
} from './VitalsMonitor';
export type {
  PffScanResult,
  VideoFrame,
  FaceRegion,
  SignalMetrics,
  RGBMean,
  WorkletResult,
} from './types';
export type {
  VitalSigns,
  VitalAlert,
} from './VitalsMonitor';

