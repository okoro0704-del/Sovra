/**
 * VitalsMonitor.ts
 * 
 * Real-time vital signs extraction from PFF data
 * 
 * Metrics:
 * - BPM (Beats Per Minute)
 * - SpO2 (Blood Oxygen Saturation) - estimated from PPG signal
 * - Respiratory Rate - derived from HRV patterns
 * 
 * "Your heartbeat knows what's wrong."
 */

export interface VitalSigns {
  bpm: number;                    // Heart rate (40-140 normal)
  spO2: number;                   // Blood oxygen (92-100% normal)
  respiratoryRate: number;        // Breaths per minute (12-20 normal)
  hrv: number;                    // Heart rate variability
  signalQuality: number;          // 0-100 (quality of measurement)
  timestamp: number;
}

export interface VitalAlert {
  type: 'CRITICAL' | 'WARNING' | 'NORMAL';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  recommendation: string;
}

export enum VitalStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Extract vital signs from PFF scan result
 */
export function extractVitalSigns(
  bpm: number,
  hrv: number,
  signalQuality: number,
  pulseSignal: number[]
): VitalSigns {
  // Estimate SpO2 from pulse signal characteristics
  const spO2 = estimateSpO2(pulseSignal, signalQuality);
  
  // Estimate respiratory rate from HRV patterns
  const respiratoryRate = estimateRespiratoryRate(hrv, bpm);
  
  return {
    bpm,
    spO2,
    respiratoryRate,
    hrv,
    signalQuality,
    timestamp: Date.now(),
  };
}

/**
 * Estimate SpO2 from pulse signal
 * 
 * Method: Analyze AC/DC ratio of PPG signal
 * Note: This is an estimation. Clinical-grade oximeters use dual-wavelength LEDs.
 */
function estimateSpO2(pulseSignal: number[], signalQuality: number): number {
  if (pulseSignal.length < 10 || signalQuality < 50) {
    return 0; // Insufficient data
  }
  
  // Calculate AC component (pulse amplitude)
  const mean = pulseSignal.reduce((a, b) => a + b, 0) / pulseSignal.length;
  const ac = Math.sqrt(
    pulseSignal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pulseSignal.length
  );
  
  // Calculate DC component (baseline)
  const dc = mean;
  
  // AC/DC ratio (simplified model)
  const ratio = ac / dc;
  
  // Empirical mapping to SpO2 (calibrated for rPPG)
  // Normal ratio: 0.02-0.05 → SpO2: 95-100%
  // Low ratio: < 0.02 → SpO2: < 95%
  let spO2 = 100 - (0.05 - ratio) * 200;
  
  // Clamp to realistic range
  spO2 = Math.max(85, Math.min(100, spO2));
  
  // Adjust for signal quality
  if (signalQuality < 70) {
    spO2 = Math.max(0, spO2 - (70 - signalQuality) / 2);
  }
  
  return Math.round(spO2);
}

/**
 * Estimate respiratory rate from HRV
 * 
 * Method: Respiratory Sinus Arrhythmia (RSA)
 * Heart rate varies with breathing cycle
 */
function estimateRespiratoryRate(hrv: number, bpm: number): number {
  // Normal respiratory rate: 12-20 breaths/min
  // HRV correlates with respiratory rate
  
  // Simplified model: Higher HRV → Lower respiratory rate (relaxed breathing)
  const baseRate = 16; // Average respiratory rate
  const hrvFactor = (hrv - 50) / 100; // Normalize HRV around 50
  
  let respiratoryRate = baseRate - hrvFactor * 4;
  
  // Clamp to realistic range
  respiratoryRate = Math.max(8, Math.min(30, respiratoryRate));
  
  return Math.round(respiratoryRate);
}

/**
 * Analyze vital signs and generate alerts
 */
export function analyzeVitals(vitals: VitalSigns): VitalAlert[] {
  const alerts: VitalAlert[] = [];
  
  // Check SpO2
  if (vitals.spO2 > 0) { // Only check if we have valid data
    if (vitals.spO2 < 92) {
      alerts.push({
        type: 'CRITICAL',
        message: 'Low blood oxygen detected',
        metric: 'SpO2',
        value: vitals.spO2,
        threshold: 92,
        recommendation: 'Seek immediate medical attention. Low oxygen levels require urgent care.',
      });
    } else if (vitals.spO2 < 95) {
      alerts.push({
        type: 'WARNING',
        message: 'Blood oxygen slightly low',
        metric: 'SpO2',
        value: vitals.spO2,
        threshold: 95,
        recommendation: 'Monitor closely. Consider consulting a healthcare provider if symptoms persist.',
      });
    }
  }
  
  // Check Resting BPM
  if (vitals.bpm > 110) {
    alerts.push({
      type: 'CRITICAL',
      message: 'Elevated resting heart rate',
      metric: 'BPM',
      value: vitals.bpm,
      threshold: 110,
      recommendation: 'High resting heart rate detected. Seek medical evaluation if accompanied by other symptoms.',
    });
  } else if (vitals.bpm > 100) {
    alerts.push({
      type: 'WARNING',
      message: 'Heart rate slightly elevated',
      metric: 'BPM',
      value: vitals.bpm,
      threshold: 100,
      recommendation: 'Monitor your heart rate. Ensure adequate rest and hydration.',
    });
  } else if (vitals.bpm < 50) {
    alerts.push({
      type: 'WARNING',
      message: 'Low resting heart rate',
      metric: 'BPM',
      value: vitals.bpm,
      threshold: 50,
      recommendation: 'Low heart rate detected. This may be normal for athletes, but consult a doctor if you feel unwell.',
    });
  }
  
  // Check Respiratory Rate
  if (vitals.respiratoryRate > 24) {
    alerts.push({
      type: 'WARNING',
      message: 'Rapid breathing detected',
      metric: 'Respiratory Rate',
      value: vitals.respiratoryRate,
      threshold: 24,
      recommendation: 'Elevated breathing rate. Monitor for shortness of breath or chest discomfort.',
    });
  } else if (vitals.respiratoryRate < 10) {
    alerts.push({
      type: 'WARNING',
      message: 'Slow breathing detected',
      metric: 'Respiratory Rate',
      value: vitals.respiratoryRate,
      threshold: 10,
      recommendation: 'Low breathing rate. Ensure you are breathing normally.',
    });
  }
  
  return alerts;
}

/**
 * Get overall vital status
 */
export function getVitalStatus(alerts: VitalAlert[]): VitalStatus {
  if (alerts.some(a => a.type === 'CRITICAL')) {
    return VitalStatus.CRITICAL;
  }
  if (alerts.some(a => a.type === 'WARNING')) {
    return VitalStatus.WARNING;
  }
  return VitalStatus.NORMAL;
}

