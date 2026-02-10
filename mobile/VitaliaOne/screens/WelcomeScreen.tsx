/**
 * Welcome Screen - Master Pulse Scan & Truth-Bundle Registration
 * 
 * Flow:
 * 1. User sees welcome message
 * 2. Initiates Master Pulse Scan (PFF Engine)
 * 3. On LIFE_CONFIRMED, registers Truth-Bundle
 * 4. Mints 20 VIDA (10 to user, 10 to vault)
 * 5. Navigates to Vault
 * 
 * "Your first heartbeat. Your sovereign identity."
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { createPffSession, PffScanResult } from '../../../heart/PffEngine';
import { registerUser } from '../../../api/SimpleWallet';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
  onRegistrationComplete: (userData: any) => void;
}

export default function WelcomeScreen({ navigation, onRegistrationComplete }: WelcomeScreenProps) {
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [scanResult, setScanResult] = useState<PffScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [cameraPermission, setCameraPermission] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pffEngine = useRef(createPffSession());

  useEffect(() => {
    requestCameraPermission();
    startPulseAnimation();
  }, []);

  /**
   * Request camera permission
   */
  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setCameraPermission(permission === 'authorized');
  };

  /**
   * Start pulse animation
   */
  const startPulseAnimation = () => {
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
  };

  /**
   * Start Master Pulse Scan
   */
  const startMasterPulseScan = async () => {
    setScanState('SCANNING');
    pffEngine.current.reset();

    // In production, process camera frames here
    // For now, simulate scan
    simulateScan();
  };

  /**
   * Simulate PFF scan (for development)
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
      // In production, this would be real camera frames
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
      // Register user and mint VIDA
      await registerTruthBundle(result);
    } else {
      setScanState('FAILED');
      setTimeout(() => setScanState('IDLE'), 3000);
    }
  };

  /**
   * Register Truth-Bundle and mint VIDA
   */
  const registerTruthBundle = async (scanResult: PffScanResult) => {
    try {
      // Get phone number (in production, from device or user input)
      const phoneNumber = '+234-800-000-0000';

      // Register user (mints 20 VIDA: 10 to user, 10 to vault)
      const registrationResult = await registerUser(phoneNumber, 10);

      if (registrationResult.success) {
        setScanState('SUCCESS');

        // Create user data
        const userData = {
          userId: scanResult.sessionId,
          phoneNumber,
          vidaBalance: 10,
          nVidaBalance: 0,
          isRegistered: true,
          truthBundleHash: scanResult.sessionId,
        };

        // Wait for success animation
        setTimeout(() => {
          onRegistrationComplete(userData);
          navigation.replace('Vault');
        }, 2000);
      } else {
        setScanState('FAILED');
      }
    } catch (error) {
      console.error('[WelcomeScreen] Registration failed:', error);
      setScanState('FAILED');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vitalia</Text>
        <Text style={styles.subtitle}>One pulse, one identity, one nation.</Text>
      </View>

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
        <Text style={styles.statusText}>{getStatusText(scanState, scanResult)}</Text>
        {scanState === 'SCANNING' && (
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        )}
      </View>

      {/* Action Button */}
      {scanState === 'IDLE' && (
        <TouchableOpacity style={styles.button} onPress={startMasterPulseScan}>
          <Text style={styles.buttonText}>Start Master Pulse Scan</Text>
        </TouchableOpacity>
      )}

      {scanState === 'FAILED' && (
        <TouchableOpacity style={styles.retryButton} onPress={startMasterPulseScan}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============ HELPER FUNCTIONS ============

function getScanColor(state: string): string {
  switch (state) {
    case 'SCANNING': return '#00D4AA';
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
    default: return '❤️';
  }
}

function getStatusText(state: string, result: PffScanResult | null): string {
  switch (state) {
    case 'IDLE': return 'Welcome to Vitalia\n\nPlace your face in the circle to begin';
    case 'SCANNING': return 'Scanning your heartbeat...\n\nHold still';
    case 'PROCESSING': return 'Verifying life signature...';
    case 'SUCCESS': return `Life Confirmed!\n\nHeartbeat: ${result?.bpm.toFixed(0)} BPM\n\nCreating your sovereign identity...`;
    case 'FAILED': return result?.lifeStatus === 'SPOOFING_DETECTED' 
      ? 'Spoofing detected\n\nLive scan required'
      : 'No heartbeat detected\n\nPlease try again';
    default: return '';
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B92B0',
    textAlign: 'center',
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
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseIcon: {
    fontSize: 80,
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default WelcomeScreen;

