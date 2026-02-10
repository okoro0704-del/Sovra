/**
 * Welcome Screen - First Pulse Registration
 * 
 * Flow:
 * 1. User sees welcome message
 * 2. Initiates Master Pulse Scan
 * 3. On LIFE_CONFIRMED, calls onFirstPulse()
 * 4. Mints 20 VIDA (10 User: 5 Liquid + 5 Locked, 10 Vault)
 * 5. Navigates to Vault
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { processHeartbeat, resetWorkletState } from '@vitalia/pff-engine';
import { registerUser } from '@vitalia/contracts/src/SovereignChain';
import type { WorkletResult } from '@vitalia/pff-engine';

export default function WelcomeScreen({ navigation }: any) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WorkletResult | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const device = useCameraDevice('front');

  /**
   * Start Master Pulse Scan
   */
  const startMasterPulseScan = async () => {
    // Request camera permission
    const permission = await Camera.requestCameraPermission();
    
    if (permission === 'denied') {
      Alert.alert('Camera Permission', 'Camera access is required for heartbeat verification');
      return;
    }

    resetWorkletState();
    setIsScanning(true);
    setScanResult(null);
  };

  /**
   * Handle scan result
   */
  const handleScanResult = (result: WorkletResult) => {
    setScanResult(result);

    if (result.status === 'LIFE_CONFIRMED') {
      onFirstPulse(result.bpm);
    }
  };

  /**
   * On First Pulse - Register user and mint VIDA
   */
  const onFirstPulse = async (bpm: number) => {
    setIsScanning(false);
    setIsRegistering(true);

    try {
      // Register user on Sovereign Chain
      const result = await registerUser(
        '+234-800-000-0000', // In production, get from device
        bpm,
        true // liveness confirmed
      );

      // Show success message
      Alert.alert(
        'Welcome to Vitalia! 🎉',
        `VIDA Minted: ${result.totalMinted} Ѵ\n\n` +
        `Your Balance:\n` +
        `• Liquid: ${result.userLiquid} Ѵ (₦${result.userLiquid * 1000})\n` +
        `• Locked: ${result.userLocked} Ѵ (₦${result.userLocked * 1000})\n\n` +
        `Vault: ${result.vaultAmount} Ѵ\n\n` +
        `Your heartbeat is your identity.`,
        [
          {
            text: 'Enter Vault',
            onPress: () => navigation.replace('Vault'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
      setIsRegistering(false);
    }
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
        {!isScanning && !isRegistering && (
          <>
            {/* Welcome Message */}
            <View style={styles.header}>
              <Text style={styles.logo}>Ѵ</Text>
              <Text style={styles.title}>Welcome to Vitalia</Text>
              <Text style={styles.subtitle}>
                One pulse, one identity, one nation.
              </Text>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={startMasterPulseScan}
            >
              <Text style={styles.startButtonText}>Start Master Pulse Scan</Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.infoText}>
                Your heartbeat is your sovereign identity.{'\n'}
                No passwords. No keys. Just you.
              </Text>
            </View>
          </>
        )}

        {/* Scanning UI */}
        {isScanning && (
          <View style={styles.scanningOverlay}>
            <Text style={styles.scanningTitle}>Master Pulse Scan</Text>
            <Text style={styles.scanningStatus}>{getStatusMessage(scanResult?.status)}</Text>
            {scanResult?.bpm > 0 && (
              <Text style={styles.bpmText}>{scanResult.bpm} BPM</Text>
            )}
          </View>
        )}

        {/* Registering UI */}
        {isRegistering && (
          <View style={styles.registeringOverlay}>
            <Text style={styles.registeringText}>Minting your VIDA...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getStatusMessage(status?: string): string {
  switch (status) {
    case 'COLLECTING_DATA':
      return 'Hold still... Collecting heartbeat data';
    case 'LIFE_CONFIRMED':
      return 'LIFE CONFIRMED ✓';
    case 'SPOOFING_DETECTED':
      return 'Spoofing detected. Use live camera.';
    case 'INVALID_BPM':
      return 'Invalid heartbeat. Try again.';
    default:
      return 'Position your face in frame';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 20 },
  overlayTransparent: { backgroundColor: 'rgba(10, 14, 39, 0.7)' },
  header: { alignItems: 'center', marginTop: 40 },
  logo: { fontSize: 80, color: '#00D4AA', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8B92B0', textAlign: 'center' },
  startButton: { backgroundColor: '#00D4AA', paddingVertical: 20, borderRadius: 12, marginHorizontal: 20 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  info: { paddingHorizontal: 20 },
  infoText: { fontSize: 14, color: '#8B92B0', textAlign: 'center', lineHeight: 22 },
  scanningOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanningTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  scanningStatus: { fontSize: 16, color: '#8B92B0', marginBottom: 24 },
  bpmText: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA' },
  registeringOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  registeringText: { fontSize: 20, color: '#FFFFFF' },
});

