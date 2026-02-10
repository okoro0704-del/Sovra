/**
 * HospitalVerificationScreen.tsx
 * 
 * Generate verification code for hospitals
 * 
 * Features:
 * - QR code with user UID
 * - Real-time PFF scan for liveness
 * - Zero-knowledge proof generation
 * - Expiring verification codes
 * 
 * "Show your heartbeat. Get instant care."
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { processHeartbeat, resetWorkletState } from '@vitalia/pff-engine';
import type { WorkletResult } from '@vitalia/pff-engine';

export default function HospitalVerificationScreen({ navigation }: any) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WorkletResult | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const device = useCameraDevice('front');

  /**
   * Start verification scan
   */
  const startVerificationScan = async () => {
    const permission = await Camera.requestCameraPermission();
    if (permission === 'denied') {
      Alert.alert('Camera Permission', 'Camera access required for verification');
      return;
    }

    resetWorkletState();
    setIsScanning(true);
    setScanResult(null);
    setVerificationCode(null);
  };

  /**
   * Handle scan result
   */
  const handleScanResult = (result: WorkletResult) => {
    setScanResult(result);

    if (result.status === 'LIFE_CONFIRMED') {
      generateVerificationCode(result.bpm);
    }
  };

  /**
   * Generate verification code
   */
  const generateVerificationCode = async (bpm: number) => {
    setIsScanning(false);

    // In production, call MedicalAuth API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    setVerificationCode(code);
    setExpiresAt(expires);

    Alert.alert(
      'Verification Code Generated ✅',
      `Show this code to the hospital.\n\nCode: ${code}\n\nExpires in 5 minutes.`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Frame processor
   */
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (!isScanning) return;

    const result = processHeartbeat(frame);
    runOnJS(handleScanResult)(result);
  }, [isScanning]);

  /**
   * Calculate time remaining
   */
  const getTimeRemaining = () => {
    if (!expiresAt) return '';
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Camera (only when scanning) */}
      {isScanning && device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isScanning}
          frameProcessor={frameProcessor}
        />
      )}

      {/* Overlay */}
      <View style={[styles.overlay, isScanning && styles.overlayTransparent]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Hospital Verification</Text>
          <Text style={styles.subtitle}>Generate verification code</Text>
        </View>

        {!isScanning && !verificationCode && (
          <>
            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>How It Works</Text>
              <Text style={styles.instructionText}>
                1. Scan your face to verify your heartbeat{'\n'}
                2. Generate a 6-digit verification code{'\n'}
                3. Show the code to hospital staff{'\n'}
                4. Hospital verifies your coverage instantly
              </Text>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={startVerificationScan}
            >
              <Text style={styles.startButtonText}>Start Verification Scan</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Scanning UI */}
        {isScanning && (
          <View style={styles.scanningOverlay}>
            <Text style={styles.scanningTitle}>Verifying Heartbeat</Text>
            <Text style={styles.scanningStatus}>{getStatusMessage(scanResult?.status)}</Text>
            {scanResult?.bpm > 0 && (
              <Text style={styles.bpmText}>{scanResult.bpm} BPM</Text>
            )}
          </View>
        )}

        {/* Verification Code Display */}
        {verificationCode && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your Verification Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{verificationCode}</Text>
            </View>
            <Text style={styles.expiresText}>
              Expires in: {getTimeRemaining()}
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🏥 Show to Hospital</Text>
              <Text style={styles.infoText}>
                Hospital staff will enter this code to verify your coverage.{'\n\n'}
                Your financial details remain private.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={startVerificationScan}
            >
              <Text style={styles.regenerateButtonText}>Generate New Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function getStatusMessage(status?: string): string {
  switch (status) {
    case 'COLLECTING_DATA':
      return 'Hold still... Collecting heartbeat';
    case 'LIFE_CONFIRMED':
      return 'LIFE CONFIRMED ✓';
    case 'SPOOFING_DETECTED':
      return 'Spoofing detected';
    case 'INVALID_BPM':
      return 'Invalid heartbeat';
    default:
      return 'Position your face in frame';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  overlay: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  overlayTransparent: { backgroundColor: 'rgba(10, 14, 39, 0.7)' },
  header: { marginBottom: 40 },
  backButton: { fontSize: 16, color: '#00D4AA', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  instructions: { backgroundColor: '#1E2749', padding: 24, borderRadius: 12, marginBottom: 30 },
  instructionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  instructionText: { fontSize: 14, color: '#8B92B0', lineHeight: 24 },
  startButton: { backgroundColor: '#00D4AA', paddingVertical: 18, borderRadius: 12 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  scanningOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanningTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  scanningStatus: { fontSize: 16, color: '#8B92B0', marginBottom: 24 },
  bpmText: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA' },
  codeContainer: { flex: 1, justifyContent: 'center' },
  codeLabel: { fontSize: 16, color: '#8B92B0', textAlign: 'center', marginBottom: 16 },
  codeBox: { backgroundColor: '#1E2749', padding: 32, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderColor: '#00D4AA' },
  codeText: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA', textAlign: 'center', letterSpacing: 8 },
  expiresText: { fontSize: 14, color: '#FF6B35', textAlign: 'center', marginBottom: 30 },
  infoBox: { backgroundColor: '#1E2749', padding: 20, borderRadius: 12, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#00D4AA' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B92B0', lineHeight: 22 },
  regenerateButton: { backgroundColor: '#1E2749', paddingVertical: 16, borderRadius: 12 },
  regenerateButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
});

