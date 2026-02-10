/**
 * VitalizedGate - Higher Order Component
 * 
 * The Truth Gate: Locks app features behind heartbeat verification
 * 
 * - If no heartbeat detected → Show PULSE_LOCK screen
 * - If pulse verified → Unlock Vault and Bridge screens
 * 
 * "One pulse, one identity, one nation."
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { processHeartbeat, resetWorkletState } from './worklet';
import type { WorkletResult } from './types';

interface VitalizedGateProps {
  children: React.ReactNode;
  onLifeConfirmed?: (bpm: number) => void;
  onSpoofingDetected?: () => void;
}

/**
 * VitalizedGate HOC
 * 
 * Wraps protected screens and requires heartbeat verification
 */
export function VitalizedGate({ children, onLifeConfirmed, onSpoofingDetected }: VitalizedGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [scanResult, setScanResult] = useState<WorkletResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  
  const device = useCameraDevice('front');

  useEffect(() => {
    // Reset worklet state when component mounts
    resetWorkletState();
  }, []);

  // Handle scan result updates
  const handleScanResult = (result: WorkletResult) => {
    setScanResult(result);

    if (result.status === 'LIFE_CONFIRMED') {
      setIsVerified(true);
      setIsScanning(false);
      onLifeConfirmed?.(result.bpm);
    } else if (result.status === 'SPOOFING_DETECTED') {
      onSpoofingDetected?.();
    }
  };

  // Frame processor (runs on UI thread/NPU)
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (!isScanning) return;

    const result = processHeartbeat(frame);
    runOnJS(handleScanResult)(result);
  }, [isScanning]);

  // If verified, show protected content
  if (isVerified) {
    return <>{children}</>;
  }

  // Show PULSE_LOCK screen
  return (
    <View style={styles.container}>
      {/* Camera View */}
      {device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isScanning}
          frameProcessor={frameProcessor}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PULSE_LOCK</Text>
          <Text style={styles.subtitle}>Verifying your heartbeat...</Text>
        </View>

        {/* Pulse Circle */}
        <View style={styles.pulseContainer}>
          <View style={[styles.pulseCircle, getPulseStyle(scanResult?.status)]}>
            {scanResult?.status === 'COLLECTING_DATA' && (
              <ActivityIndicator size="large" color="#FFFFFF" />
            )}
            {scanResult?.status === 'LIFE_CONFIRMED' && (
              <Text style={styles.pulseIcon}>✓</Text>
            )}
            {scanResult?.status === 'SPOOFING_DETECTED' && (
              <Text style={styles.pulseIcon}>✗</Text>
            )}
            {scanResult?.status === 'INVALID_BPM' && (
              <Text style={styles.pulseIcon}>!</Text>
            )}
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getStatusMessage(scanResult?.status)}</Text>
          {scanResult?.bpm > 0 && (
            <Text style={styles.bpmText}>{scanResult.bpm} BPM</Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>• Position your face in the frame</Text>
          <Text style={styles.instructionText}>• Keep still for 5 seconds</Text>
          <Text style={styles.instructionText}>• Ensure good lighting</Text>
        </View>
      </View>
    </View>
  );
}

// ============ HELPERS ============

function getPulseStyle(status?: string) {
  switch (status) {
    case 'COLLECTING_DATA':
      return { backgroundColor: '#FFD700' };
    case 'LIFE_CONFIRMED':
      return { backgroundColor: '#00FF00' };
    case 'SPOOFING_DETECTED':
      return { backgroundColor: '#FF0000' };
    case 'INVALID_BPM':
      return { backgroundColor: '#FFA500' };
    default:
      return { backgroundColor: '#8B92B0' };
  }
}

function getStatusMessage(status?: string): string {
  switch (status) {
    case 'COLLECTING_DATA':
      return 'Collecting heartbeat data...';
    case 'LIFE_CONFIRMED':
      return 'LIFE CONFIRMED ✓';
    case 'SPOOFING_DETECTED':
      return 'Spoofing detected. Please use live camera.';
    case 'INVALID_BPM':
      return 'Invalid heartbeat. Please try again.';
    default:
      return 'Initializing...';
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 39, 0.85)',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B92B0',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  pulseIcon: {
    fontSize: 80,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  bpmText: {
    fontSize: 32,
    color: '#00D4AA',
    fontWeight: 'bold',
  },
  instructions: {
    paddingHorizontal: 40,
  },
  instructionText: {
    fontSize: 14,
    color: '#8B92B0',
    marginBottom: 8,
  },
});

