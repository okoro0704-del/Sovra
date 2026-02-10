/**
 * SecurityShieldScreen.tsx - Security & Shield Section
 * 
 * "Security is a choice, not a mandate."
 * 
 * Features:
 * - Locked Shield icon (glows when activated)
 * - Transparent pricing (0.1 ngVIDA)
 * - Manual activation trigger
 * - Status badges: "Standard Protection" vs "Sentinel Guarded"
 * 
 * Born in Lagos, Nigeria. Built for Humanity. 🇳🇬
 * Architect: ISREAL OKORO
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SentinelOptIn,
  getStatusBadge,
  getStatusDescription,
  formatActivationDate,
  ACTIVATION_FEE_STRING,
  FEATURE_INFO,
  type SentinelStatus,
  type ActivationCheck,
} from '@vitalia/contracts/src/SentinelOptIn';

interface SecurityShieldScreenProps {
  navigation: any;
}

export default function SecurityShieldScreen({ navigation }: SecurityShieldScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [sentinelStatus, setSentinelStatus] = useState<SentinelStatus | null>(null);
  const [activationCheck, setActivationCheck] = useState<ActivationCheck | null>(null);

  useEffect(() => {
    loadSentinelStatus();
  }, []);

  /**
   * Load Sentinel status
   */
  const loadSentinelStatus = async () => {
    try {
      setIsLoading(true);

      // In production, initialize with actual contract and signer
      // const sentinelOptIn = new SentinelOptIn(contractAddress, signer);
      // const status = await sentinelOptIn.getMyStatus();
      // const check = await sentinelOptIn.canIActivate();

      // Mock data for demonstration
      const status: SentinelStatus = {
        isActive: false,
        badge: 'Standard Protection',
        activatedAt: 0,
      };

      const check: ActivationCheck = {
        canActivate: true,
        reason: 'Ready to activate',
      };

      setSentinelStatus(status);
      setActivationCheck(check);
    } catch (error) {
      console.error('Failed to load Sentinel status:', error);
      Alert.alert('Error', 'Failed to load Sentinel status');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Sentinel activation (Manual Trigger)
   * 
   * ONLY executes upon deliberate user click on "Activate Sentinel" button
   */
  const handleActivateSentinel = async () => {
    // Show transparent pricing confirmation
    Alert.alert(
      '🛡️ Activate PFF Sentinel',
      `One-time activation fee: ${ACTIVATION_FEE_STRING}\n\n` +
      `This will upgrade your account to military-grade biometric security.\n\n` +
      `Do you want to proceed?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              setIsActivating(true);

              // In production, call actual contract
              // const sentinelOptIn = new SentinelOptIn(contractAddress, signer);
              // await sentinelOptIn.downloadSentinel();

              // Mock activation
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Update status
              setSentinelStatus({
                isActive: true,
                badge: 'Sentinel Guarded',
                activatedAt: Math.floor(Date.now() / 1000),
              });

              Alert.alert(
                '✅ Sentinel Activated',
                'Your account is now protected by PFF Sentinel with military-grade biometric security.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('Activation failed:', error);
              Alert.alert('Error', 'Failed to activate Sentinel');
            } finally {
              setIsActivating(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Security Status...</Text>
      </View>
    );
  }

  const isActive = sentinelStatus?.isActive || false;
  const shieldGlow = isActive;

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Security & Shield</Text>
          <Text style={styles.subtitle}>{FEATURE_INFO.metadata}</Text>
        </View>

        {/* Locked Shield Icon */}
        <View style={styles.shieldContainer}>
          <View style={[styles.shield, shieldGlow && styles.shieldGlow]}>
            <Text style={styles.shieldIcon}>{isActive ? '🛡️' : '🔒'}</Text>
          </View>
          {shieldGlow && (
            <View style={styles.glowRing}>
              <View style={styles.glowRingInner} />
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
          <Text style={[styles.statusBadgeText, isActive && styles.statusBadgeTextActive]}>
            {sentinelStatus?.badge}
          </Text>
        </View>

        {/* Feature Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.featureName}>{FEATURE_INFO.name}</Text>
          <Text style={styles.featureDescription}>{FEATURE_INFO.description}</Text>
          <Text style={styles.statusDescription}>
            {getStatusDescription(isActive)}
          </Text>
        </View>

        {/* Activation Info (if not active) */}
        {!isActive && (
          <View style={styles.activationCard}>
            <Text style={styles.activationTitle}>Upgrade to Sentinel</Text>
            <Text style={styles.activationDescription}>
              Get military-grade biometric security with:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✅ 4-Layer Biometric Authentication</Text>
              <Text style={styles.featureItem}>✅ Device-Bio-Chain Binding</Text>
              <Text style={styles.featureItem}>✅ Real-Time Threat Detection</Text>
              <Text style={styles.featureItem}>✅ Apple Tier-1 Security Standards</Text>
            </View>

            {/* Transparent Pricing */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>One-Time Activation Fee</Text>
              <Text style={styles.pricingAmount}>{ACTIVATION_FEE_STRING}</Text>
              <Text style={styles.pricingNote}>Non-refundable • Lifetime protection</Text>
            </View>

            {/* Activation Button (Manual Trigger) */}
            <TouchableOpacity
              style={[
                styles.activateButton,
                (!activationCheck?.canActivate || isActivating) && styles.activateButtonDisabled,
              ]}
              onPress={handleActivateSentinel}
              disabled={!activationCheck?.canActivate || isActivating}
            >
              {isActivating ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.activateButtonText}>Activate Sentinel</Text>
              )}
            </TouchableOpacity>

            {/* Activation Check Message */}
            {activationCheck && !activationCheck.canActivate && (
              <Text style={styles.errorMessage}>{activationCheck.reason}</Text>
            )}
          </View>
        )}

        {/* Activation Info (if active) */}
        {isActive && sentinelStatus && (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>✅ Sentinel Active</Text>
            <Text style={styles.activeDescription}>
              Your account is protected by military-grade biometric security.
            </Text>
            <View style={styles.activeInfo}>
              <Text style={styles.activeInfoLabel}>Activated On:</Text>
              <Text style={styles.activeInfoValue}>
                {formatActivationDate(sentinelStatus.activatedAt)}
              </Text>
            </View>
            <View style={styles.activeInfo}>
              <Text style={styles.activeInfoLabel}>Protection Level:</Text>
              <Text style={styles.activeInfoValue}>Military-Grade</Text>
            </View>
            <View style={styles.activeInfo}>
              <Text style={styles.activeInfoLabel}>Status:</Text>
              <Text style={styles.activeInfoValue}>🟢 ACTIVE</Text>
            </View>
          </View>
        )}

        {/* Security Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Security Features</Text>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🔐</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureRowTitle}>Biometric Authentication</Text>
              <Text style={styles.featureRowDescription}>
                {isActive ? '4-Layer (Face + Finger + Heart + Voice)' : 'Standard (Face + Finger)'}
              </Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureRowTitle}>Device Binding</Text>
              <Text style={styles.featureRowDescription}>
                {isActive ? 'Device-Bio-Chain (Laptop + Mobile)' : 'Single Device'}
              </Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureRowTitle}>Threat Detection</Text>
              <Text style={styles.featureRowDescription}>
                {isActive ? 'Real-Time AI Monitoring' : 'Basic Protection'}
              </Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureRowTitle}>Security Standard</Text>
              <Text style={styles.featureRowDescription}>
                {isActive ? 'Apple Tier-1 (Military-Grade)' : 'Standard Protection'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFD700',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#808080',
    fontStyle: 'italic',
  },
  shieldContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  shield: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#808080',
  },
  shieldGlow: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  shieldIcon: {
    fontSize: 60,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  glowRingInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    top: -10,
    left: -10,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderWidth: 1,
    borderColor: '#808080',
    marginBottom: 30,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#808080',
  },
  statusBadgeTextActive: {
    color: '#FFD700',
  },
  descriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featureName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 24,
  },
  statusDescription: {
    fontSize: 14,
    color: '#808080',
    lineHeight: 20,
  },
  activationCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  activationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  activationDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  pricingCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  pricingNote: {
    fontSize: 12,
    color: '#808080',
  },
  activateButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  activateButtonDisabled: {
    backgroundColor: '#404040',
  },
  activateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  activeCard: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  activeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: 12,
  },
  activeDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  activeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activeInfoLabel: {
    fontSize: 14,
    color: '#808080',
  },
  activeInfoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureRowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureRowDescription: {
    fontSize: 14,
    color: '#808080',
  },
});

