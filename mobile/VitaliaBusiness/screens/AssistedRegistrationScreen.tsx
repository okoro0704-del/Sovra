/**
 * Assisted Registration Screen
 * 
 * Agent-facilitated onboarding:
 * 1. Agent scans 3rd party's face (PFF scan)
 * 2. On LIFE_CONFIRMED, mints 20 VIDA (10 to user, 10 to vault)
 * 3. Creates Truth-Bundle for new user
 * 4. Agent receives commission
 * 
 * "Onboarding the nation, one heartbeat at a time."
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { createPffSession, PffScanResult, getStatusMessage } from '../../../heart/PffEngine';
import { registerUser } from '../../../api/SimpleWallet';

interface AssistedRegistrationScreenProps {
  navigation: any;
  agentData: any;
}

export default function AssistedRegistrationScreen({ navigation, agentData }: AssistedRegistrationScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [scanResult, setScanResult] = useState<PffScanResult | null>(null);
  const [progress, setProgress] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pffEngine = useRef(createPffSession());

  /**
   * Start assisted registration scan
   */
  const startAssistedScan = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setScanState('SCANNING');
    pffEngine.current.reset();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate scan (in production, use real camera)
    simulateScan();
  };

  /**
   * Simulate PFF scan
   */
  const simulateScan = () => {
    const interval = setInterval(() => {
      const currentProgress = pffEngine.current.getProgress();
      setProgress(currentProgress);

      if (pffEngine.current.isReady()) {
        clearInterval(interval);
        processScan();
      }
    }, 100);

    // Simulate frame processing
    setTimeout(() => {
      for (let i = 0; i < 150; i++) {
        const mockFrame = {
          data: new Uint8ClampedArray(640 * 480 * 4),
          width: 640,
          height: 480,
          timestamp: Date.now(),
        };
        const mockFaceRegion = { x: 200, y: 150, width: 240, height: 180 };
        pffEngine.current.processFrame(mockFrame, mockFaceRegion);
      }
    }, 100);
  };

  /**
   * Process scan result
   */
  const processScan = async () => {
    setScanState('PROCESSING');

    const result = pffEngine.current.analyzeScan();
    setScanResult(result);

    if (result.lifeStatus === 'LIFE_CONFIRMED') {
      await registerNewUser(result);
    } else {
      setScanState('FAILED');
      setTimeout(() => setScanState('IDLE'), 3000);
    }
  };

  /**
   * Register new user and mint VIDA
   */
  const registerNewUser = async (scanResult: PffScanResult) => {
    try {
      // Register user (mints 20 VIDA: 10 to user, 10 to vault)
      const registrationResult = await registerUser(phoneNumber, 10);

      if (registrationResult.success) {
        setScanState('SUCCESS');

        // Show success message
        Alert.alert(
          'Registration Complete!',
          `User registered successfully!\n\n` +
          `Phone: ${phoneNumber}\n` +
          `VIDA Minted: 20 Ѵ\n` +
          `User Balance: 10 Ѵ (₦10,000)\n` +
          `Vault Balance: 10 Ѵ\n\n` +
          `Agent Commission: ₦500`,
          [
            {
              text: 'Register Another',
              onPress: () => {
                setPhoneNumber('');
                setScanState('IDLE');
                setScanResult(null);
              },
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        setScanState('FAILED');
        Alert.alert('Registration Failed', registrationResult.message);
      }
    } catch (error) {
      console.error('[AssistedRegistration] Registration failed:', error);
      setScanState('FAILED');
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Assisted Registration</Text>
        <Text style={styles.subtitle}>Agent: {agentData?.agentName}</Text>
      </View>

      {/* Phone Number Input */}
      {scanState === 'IDLE' && (
        <View style={styles.inputContainer}>
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
      )}

      {/* Pulse Circle */}
      <View style={styles.pulseContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: scanState === 'SCANNING' ? pulseAnim : 1 }],
              backgroundColor: getScanColor(scanState),
            },
          ]}
        >
          <Text style={styles.pulseIcon}>{getScanIcon(scanState)}</Text>
        </Animated.View>
      </View>

      {/* Status Text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {scanResult ? getStatusMessage(scanResult) : getDefaultStatus(scanState)}
        </Text>
        {scanState === 'SCANNING' && (
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        )}
      </View>

      {/* Action Button */}
      {scanState === 'IDLE' && (
        <TouchableOpacity style={styles.button} onPress={startAssistedScan}>
          <Text style={styles.buttonText}>Start Pulse Scan</Text>
        </TouchableOpacity>
      )}

      {scanState === 'FAILED' && (
        <TouchableOpacity style={styles.retryButton} onPress={startAssistedScan}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📋 Registration Process</Text>
        <Text style={styles.infoText}>
          1. Enter customer's phone number{'\n'}
          2. Scan customer's face for heartbeat{'\n'}
          3. On success, 20 VIDA minted (10 User / 10 Vault){'\n'}
          4. You receive ₦500 commission
        </Text>
      </View>
    </View>
  );
}

// ============ HELPER FUNCTIONS ============

function getScanColor(state: string): string {
  switch (state) {
    case 'SCANNING': return '#FF6B35';
    case 'PROCESSING': return '#FFA500';
    case 'SUCCESS': return '#00FF00';
    case 'FAILED': return '#FF4444';
    default: return '#1E2749';
  }
}

function getScanIcon(state: string): string {
  switch (state) {
    case 'SCANNING': return '💚';
    case 'PROCESSING': return '⏳';
    case 'SUCCESS': return '✅';
    case 'FAILED': return '❌';
    default: return '👤';
  }
}

function getDefaultStatus(state: string): string {
  switch (state) {
    case 'IDLE': return 'Ready to scan customer';
    case 'SCANNING': return 'Scanning heartbeat...\n\nCustomer: hold still';
    case 'PROCESSING': return 'Verifying life signature...';
    case 'SUCCESS': return 'Registration complete!';
    case 'FAILED': return 'Scan failed. Please try again.';
    default: return '';
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    fontSize: 16,
    color: '#FF6B35',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B92B0',
    marginTop: 5,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B92B0',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1E2749',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  pulseCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseIcon: {
    fontSize: 72,
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButton: {
    backgroundColor: '#FF4444',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBox: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 20,
    backgroundColor: '#1E2749',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8B92B0',
    lineHeight: 22,
  },
});

export default AssistedRegistrationScreen;

