/**
 * Assisted Registration Screen
 * 
 * Flow:
 * 1. Agent enters customer's phone number
 * 2. Agent uses camera to scan customer's face
 * 3. PFF Engine validates customer's pulse through agent's phone
 * 4. On success, mint 20 VIDA (10 User: 5 Liquid + 5 Locked, 10 Vault)
 * 5. Agent issues NFC 'Vitalia Life Card' to customer
 * 6. Agent receives ₦500 commission
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { processHeartbeat, resetWorkletState } from '@vitalia/pff-engine';
import { registerUser } from '@vitalia/contracts/src/SovereignChain';
import type { WorkletResult } from '@vitalia/pff-engine';

export default function AssistedRegistrationScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WorkletResult | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isWritingNFC, setIsWritingNFC] = useState(false);

  const device = useCameraDevice('front');

  /**
   * Start customer pulse scan
   */
  const startCustomerScan = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter customer phone number');
      return;
    }

    const permission = await Camera.requestCameraPermission();
    if (permission === 'denied') {
      Alert.alert('Camera Permission', 'Camera access required');
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
      onCustomerPulseConfirmed(result.bpm);
    }
  };

  /**
   * On customer pulse confirmed - Register and mint VIDA
   */
  const onCustomerPulseConfirmed = async (bpm: number) => {
    setIsScanning(false);
    setIsRegistering(true);

    try {
      // Register customer on Sovereign Chain
      const result = await registerUser(phoneNumber, bpm, true);

      setIsRegistering(false);

      // Show success and prompt for NFC card
      Alert.alert(
        'Customer Registered! ✅',
        `VIDA Minted: ${result.totalMinted} Ѵ\n\n` +
        `Customer Balance:\n` +
        `• Liquid: ${result.userLiquid} Ѵ\n` +
        `• Locked: ${result.userLocked} Ѵ\n\n` +
        `Vault: ${result.vaultAmount} Ѵ\n\n` +
        `Agent Commission: ₦500\n\n` +
        `Issue Vitalia Life Card?`,
        [
          { text: 'Skip', onPress: () => navigation.goBack() },
          { text: 'Issue Card', onPress: () => writeNFCCard(result.userId) },
        ]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
      setIsRegistering(false);
    }
  };

  /**
   * Write NFC Vitalia Life Card
   */
  const writeNFCCard = async (userId: string) => {
    setIsWritingNFC(true);

    try {
      // Initialize NFC
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Write user ID to NFC card
      const bytes = NfcManager.ndefHandler.encodeMessage([
        { tnf: 1, type: 'T', payload: `vitalia:${userId}` },
      ]);

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      Alert.alert(
        'Card Issued! 🎉',
        'Vitalia Life Card successfully written.\n\nCustomer can now use their card for instant access.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('NFC Error', 'Failed to write card. Please try again.');
    } finally {
      NfcManager.cancelTechnologyRequest();
      setIsWritingNFC(false);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Assisted Registration</Text>
          <Text style={styles.subtitle}>Register new customer</Text>
        </View>

        {!isScanning && !isRegistering && !isWritingNFC && (
          <>
            {/* Phone Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Customer Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+234-800-000-0000"
                placeholderTextColor="#8B92B0"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {/* Start Button */}
            <TouchableOpacity style={styles.startButton} onPress={startCustomerScan}>
              <Text style={styles.startButtonText}>Start Pulse Scan</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Scanning UI */}
        {isScanning && (
          <View style={styles.scanningOverlay}>
            <Text style={styles.scanningTitle}>Scanning Customer</Text>
            <Text style={styles.scanningStatus}>{getStatusMessage(scanResult?.status)}</Text>
            {scanResult?.bpm > 0 && (
              <Text style={styles.bpmText}>{scanResult.bpm} BPM</Text>
            )}
          </View>
        )}

        {/* Registering UI */}
        {isRegistering && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Minting VIDA...</Text>
          </View>
        )}

        {/* Writing NFC */}
        {isWritingNFC && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Writing Vitalia Life Card...</Text>
            <Text style={styles.loadingSubtext}>Hold card near phone</Text>
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
      return 'Position customer face in frame';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  overlay: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  overlayTransparent: { backgroundColor: 'rgba(10, 14, 39, 0.7)' },
  header: { marginBottom: 40 },
  backButton: { fontSize: 16, color: '#FF6B35', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  inputSection: { marginBottom: 30 },
  inputLabel: { fontSize: 14, color: '#8B92B0', marginBottom: 12 },
  input: { backgroundColor: '#1E2749', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, color: '#FFFFFF' },
  startButton: { backgroundColor: '#FF6B35', paddingVertical: 18, borderRadius: 12 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  scanningOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanningTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  scanningStatus: { fontSize: 16, color: '#8B92B0', marginBottom: 24 },
  bpmText: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA' },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 20, color: '#FFFFFF', marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: '#8B92B0', marginTop: 8 },
});

