/**
 * GenesisRegistrationScreen.tsx - Architect's Genesis Registration UI
 * 
 * "I am the Sovereign Truth."
 * 
 * Flow:
 * 1. Hardware Binding (HP Laptop + Mobile Device)
 * 2. Face Capture (3D Liveness)
 * 3. Fingerprint Capture (Ridge Pattern)
 * 4. Heart Capture (Baseline BPM/HRV)
 * 5. Voice Capture (Passphrase)
 * 6. Genesis Mint (100 VIDA)
 * 7. VLT Finality (ROOT_NODE_ESTABLISHED)
 * 8. Dashboard Activation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  performGenesisRegistration,
  type GenesisRegistration,
} from '@vitalia/contracts/src/GenesisRegistration';

type RegistrationStep =
  | 'IDLE'
  | 'HARDWARE_BINDING'
  | 'FACE_CAPTURE'
  | 'FINGER_CAPTURE'
  | 'HEART_CAPTURE'
  | 'VOICE_CAPTURE'
  | 'GENESIS_MINT'
  | 'VLT_FINALITY'
  | 'DASHBOARD_ACTIVATION'
  | 'COMPLETE';

export default function GenesisRegistrationScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('IDLE');
  const [registration, setRegistration] = useState<GenesisRegistration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Start Genesis Registration
   */
  const startGenesisRegistration = async () => {
    setIsProcessing(true);
    setCurrentStep('HARDWARE_BINDING');

    try {
      // Simulate architect's wallet address
      const architectAddress = '0xARCHITECT_ISREAL_OKORO';

      // Perform genesis registration
      const result = await performGenesisRegistration(architectAddress);

      setRegistration(result);
      setCurrentStep('COMPLETE');
      setIsProcessing(false);

      // Show success alert
      Alert.alert(
        '✅ GENESIS REGISTRATION COMPLETE',
        `ROOT_NODE: ESTABLISHED\n\n` +
        `Identity: ISREAL OKORO\n` +
        `Genesis Mint: 100 VIDA\n` +
        `Hardware Binding: LOCKED\n` +
        `Master Template: SEALED\n` +
        `Dashboard: ACTIVE\n\n` +
        `"I am the Sovereign Truth."`,
        [
          {
            text: 'Enter LifeOS Dashboard',
            onPress: () => navigation.replace('LifeOSDashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Genesis Registration Failed', error.message);
      setIsProcessing(false);
      setCurrentStep('IDLE');
    }
  };

  /**
   * Get step display name
   */
  const getStepName = (step: RegistrationStep): string => {
    const stepNames: Record<RegistrationStep, string> = {
      IDLE: 'Ready',
      HARDWARE_BINDING: 'Hardware Binding',
      FACE_CAPTURE: 'Face Capture (3D Liveness)',
      FINGER_CAPTURE: 'Fingerprint Capture',
      HEART_CAPTURE: 'Heart Capture (BPM/HRV)',
      VOICE_CAPTURE: 'Voice Capture (Passphrase)',
      GENESIS_MINT: 'Genesis Mint (100 VIDA)',
      VLT_FINALITY: 'VLT Finality',
      DASHBOARD_ACTIVATION: 'Dashboard Activation',
      COMPLETE: 'Complete',
    };
    return stepNames[step];
  };

  /**
   * Get step icon
   */
  const getStepIcon = (step: RegistrationStep): string => {
    const stepIcons: Record<RegistrationStep, string> = {
      IDLE: '🌟',
      HARDWARE_BINDING: '🔗',
      FACE_CAPTURE: '📸',
      FINGER_CAPTURE: '👆',
      HEART_CAPTURE: '❤️',
      VOICE_CAPTURE: '🎤',
      GENESIS_MINT: '💰',
      VLT_FINALITY: '📝',
      DASHBOARD_ACTIVATION: '🚀',
      COMPLETE: '✅',
    };
    return stepIcons[step];
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ARCHITECT'S GENESIS</Text>
          <Text style={styles.subtitle}>BLOCK 1 - ROOT_NODE</Text>
          <Text style={styles.architect}>ISREAL OKORO</Text>
        </View>

        {/* Current Step */}
        {currentStep !== 'IDLE' && currentStep !== 'COMPLETE' && (
          <View style={styles.currentStepCard}>
            <Text style={styles.stepIcon}>{getStepIcon(currentStep)}</Text>
            <Text style={styles.stepName}>{getStepName(currentStep)}</Text>
            <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
          </View>
        )}

        {/* Registration Complete */}
        {currentStep === 'COMPLETE' && registration && (
          <View style={styles.completeCard}>
            <Text style={styles.completeIcon}>✅</Text>
            <Text style={styles.completeTitle}>ROOT_NODE ESTABLISHED</Text>
            <View style={styles.completeDetails}>
              <Text style={styles.detailLabel}>Identity:</Text>
              <Text style={styles.detailValue}>{registration.architectName}</Text>
            </View>
            <View style={styles.completeDetails}>
              <Text style={styles.detailLabel}>Genesis Mint:</Text>
              <Text style={styles.detailValue}>{registration.genesisMint.amount} VIDA</Text>
            </View>
            <View style={styles.completeDetails}>
              <Text style={styles.detailLabel}>Hardware Binding:</Text>
              <Text style={styles.detailValue}>LOCKED</Text>
            </View>
            <View style={styles.completeDetails}>
              <Text style={styles.detailLabel}>Master Template:</Text>
              <Text style={styles.detailValue}>SEALED</Text>
            </View>
            <View style={styles.completeDetails}>
              <Text style={styles.detailLabel}>Dashboard:</Text>
              <Text style={styles.detailValue}>ACTIVE</Text>
            </View>
            <Text style={styles.passphrase}>"I am the Sovereign Truth."</Text>
          </View>
        )}

        {/* Start Button */}
        {currentStep === 'IDLE' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startGenesisRegistration}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FFD700']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>INITIALIZE GENESIS REGISTRATION</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔐 Genesis Registration</Text>
          <Text style={styles.infoText}>
            This is the ROOT_NODE registration for the Architect.{'\n\n'}
            The 4-Layer Master Template will be created:{'\n'}
            • Face (3D Liveness Geometry){'\n'}
            • Finger (Ridge Pattern){'\n'}
            • Heart (Baseline BPM/HRV){'\n'}
            • Voice (Passphrase){'\n\n'}
            Upon completion, 100 VIDA will be minted to the Architect's vault.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.8,
  },
  architect: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  currentStepCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stepName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 8,
  },
  completeCard: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  completeIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00FF00',
    textAlign: 'center',
    marginBottom: 20,
  },
  completeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  passphrase: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 20,
  },
  startButton: {
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 20,
  },
});

