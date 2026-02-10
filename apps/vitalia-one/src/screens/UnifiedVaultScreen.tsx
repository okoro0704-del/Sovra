/**
 * UnifiedVaultScreen.tsx - The Sovereign Vault View
 * 
 * "The Physical Key unlocks the Financial Vault."
 * 
 * This screen combines:
 * 1. National Pulse Stats (VIDA/nVIDA balances, vitalization status)
 * 2. Sovryn Zero Loan Balances (Bitcoin collateral, DLLR debt)
 * 3. Sovereign_Active Status (PFF presence verification)
 * 
 * Logic:
 * - If Sovereign_Active = false, the Sovryn vault is INVISIBLE
 * - User must complete PFF scan to unlock Bitcoin vault
 * - National Pulse stats always visible (biological identity)
 * - Sovryn stats only visible when present (financial vault)
 * 
 * "Your Bitcoin is physically attached to your presence."
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SovrynClient, RSK_MAINNET_CONFIG } from '@vitalia/contracts/sovryn/SovrynClient';
import {
  getSovereignSessionManager,
  initializeSovereignSession,
} from '@vitalia/contracts/sovryn/SovereignSession';
import { generatePresenceProof } from '@vitalia/contracts/sovryn/PresenceGate';
import { SovereignGateError } from '@vitalia/contracts/sovryn/TransactionInterceptor';

interface UnifiedVaultScreenProps {
  navigation: any;
  route: any;
}

interface NationalPulseStats {
  vidaBalance: string;
  nVidaBalance: string;
  liquidVida: string;
  lockedVida: string;
  isVitalized: boolean;
  vitalizedDate: string;
  totalCitizens: number;
}

interface SovrynVaultStats {
  collateralRBTC: string;
  debtDLLR: string;
  collateralRatio: number;
  dllrBalance: string;
  rbtcBalance: string;
}

export default function UnifiedVaultScreen({ navigation, route }: UnifiedVaultScreenProps) {
  const [sessionManager] = useState(() => getSovereignSessionManager());
  const [sovryn] = useState(() => new SovrynClient(RSK_MAINNET_CONFIG));

  // Session state
  const [sovereignActive, setSovereignActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<any>(null);

  // National Pulse stats (always visible)
  const [nationalStats, setNationalStats] = useState<NationalPulseStats>({
    vidaBalance: '10.00',
    nVidaBalance: '5000.00',
    liquidVida: '5.00',
    lockedVida: '5.00',
    isVitalized: true,
    vitalizedDate: '2026-01-15',
    totalCitizens: 1250000,
  });

  // Sovryn vault stats (only visible when Sovereign_Active = true)
  const [sovrynStats, setSovrynStats] = useState<SovrynVaultStats | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVaultData();

    // Update session status every second
    const interval = setInterval(() => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);
      setSovereignActive(status.sovereignActive);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadVaultData = async () => {
    try {
      setRefreshing(true);

      // Always load National Pulse stats (biological identity)
      // In production, fetch from SovereignChain contract
      setNationalStats({
        vidaBalance: '10.00',
        nVidaBalance: '5000.00',
        liquidVida: '5.00',
        lockedVida: '5.00',
        isVitalized: true,
        vitalizedDate: '2026-01-15',
        totalCitizens: 1250000,
      });

      // Only load Sovryn stats if Sovereign_Active = true
      if (sessionManager.isSovereignActive()) {
        const session = sessionManager.getSession();
        if (session) {
          // Load Sovryn balances
          const balances = await sovryn.getBalances(session.walletAddress);

          setSovrynStats({
            collateralRBTC: '0.5',
            debtDLLR: '15000.00',
            collateralRatio: 150,
            dllrBalance: balances.dllr,
            rbtcBalance: balances.rbtc,
          });
        }
      } else {
        // Vault is INVISIBLE
        setSovrynStats(null);
      }
    } catch (error) {
      console.error('[UNIFIED VAULT] Failed to load vault data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const unlockSovereignVault = () => {
    Alert.alert(
      '🔐 Unlock Sovereign Vault',
      'Your Bitcoin vault is currently invisible. Complete a PFF Presence Scan to unlock your Sovryn vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Scan Heartbeat',
          onPress: () => {
            navigation.navigate('Welcome', {
              returnTo: 'UnifiedVault',
              onScanComplete: handlePresenceScanComplete,
            });
          },
        },
      ]
    );
  };

  const handlePresenceScanComplete = async (scanResult: any) => {
    try {
      setLoading(true);

      // Generate presence proof
      const proof = await generatePresenceProof(
        'VITALIZED_UID_12345', // In production, use actual UID
        scanResult,
        '0x1234567890123456789012345678901234567890123456789012345678901234' // In production, use actual private key
      );

      // Initialize sovereign session
      await initializeSovereignSession(
        'VITALIZED_UID_12345',
        '0x1234567890123456789012345678901234567890', // In production, use actual wallet address
        proof
      );

      Alert.alert(
        '✅ Sovereign Vault Unlocked',
        `Your Bitcoin vault is now visible and accessible.\n\nBPM: ${scanResult.bpm}\nConfidence: ${(scanResult.confidence * 100).toFixed(1)}%\n\nSession expires in 5 minutes.`
      );

      // Reload vault data
      await loadVaultData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadVaultData} tintColor=\"#FFD700\" />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#0A0E27', '#1E2749']} style={styles.header}>
        <Text style={styles.headerTitle}>🏛️ Sovereign Vault</Text>
        <Text style={styles.headerSubtitle}>\"The Physical Key unlocks the Financial Vault.\"</Text>
      </LinearGradient>

      {/* Sovereign_Active Status */}
      <View style={[styles.statusCard, sovereignActive && styles.statusCardActive]}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{sovereignActive ? '🔓' : '🔒'}</Text>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {sovereignActive ? 'Vault Unlocked' : 'Vault Locked'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {sovereignActive
                ? `Session expires in ${sessionStatus?.timeRemaining || 0}s`
                : 'Complete PFF scan to unlock'}
            </Text>
          </View>
        </View>

        {!sovereignActive && (
          <TouchableOpacity style={styles.unlockButton} onPress={unlockSovereignVault}>
            <Text style={styles.unlockButtonText}>🫀 Unlock with Heartbeat</Text>
          </TouchableOpacity>
        )}

        {sovereignActive && sessionStatus && (
          <View style={styles.sessionInfo}>
            <View style={styles.sessionInfoRow}>
              <Text style={styles.sessionInfoLabel}>Presence Valid:</Text>
              <Text style={[styles.sessionInfoValue, sessionStatus.presenceValid && styles.sessionInfoValueActive]}>
                {sessionStatus.presenceValid ? '✅ Yes' : '❌ Expired'}
              </Text>
            </View>
            <View style={styles.sessionInfoRow}>
              <Text style={styles.sessionInfoLabel}>Time Remaining:</Text>
              <Text style={styles.sessionInfoValue}>{sessionStatus.presenceTimeRemaining}s</Text>
            </View>
          </View>
        )}
      </View>

      {/* SECTION 1: NATIONAL PULSE (Always Visible) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🇳🇬 National Pulse</Text>
        <Text style={styles.sectionSubtitle}>Biological Identity • Always Visible</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>VIDA Balance</Text>
            <Text style={styles.statValue}>Ѵ {nationalStats.vidaBalance}</Text>
            <Text style={styles.statSubtext}>
              Liquid: {nationalStats.liquidVida} • Locked: {nationalStats.lockedVida}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>nVIDA Balance</Text>
            <Text style={styles.statValue}>₦ {nationalStats.nVidaBalance}</Text>
            <Text style={styles.statSubtext}>1:1 NGN Peg</Text>
          </View>
        </View>

        <View style={styles.vitalizedInfo}>
          <Text style={styles.vitalizedLabel}>
            {nationalStats.isVitalized ? '✅ Vitalized' : '❌ Not Vitalized'}
          </Text>
          {nationalStats.isVitalized && (
            <Text style={styles.vitalizedDate}>Since {nationalStats.vitalizedDate}</Text>
          )}
        </View>

        <View style={styles.citizenCount}>
          <Text style={styles.citizenCountLabel}>Total Vitalized Citizens:</Text>
          <Text style={styles.citizenCountValue}>
            {nationalStats.totalCitizens.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* SECTION 2: SOVRYN VAULT (Only Visible when Sovereign_Active = true) */}
      {sovereignActive && sovrynStats ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>₿ Sovryn Vault</Text>
          <Text style={styles.sectionSubtitle}>Financial Vault • Presence Required</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Bitcoin Collateral</Text>
              <Text style={styles.statValue}>{sovrynStats.collateralRBTC} RBTC</Text>
              <Text style={styles.statSubtext}>
                ≈ ${(parseFloat(sovrynStats.collateralRBTC) * 50000).toLocaleString()}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DLLR Debt</Text>
              <Text style={styles.statValue}>${parseFloat(sovrynStats.debtDLLR).toLocaleString()}</Text>
              <Text style={styles.statSubtext}>0% Interest</Text>
            </View>
          </View>

          <View style={styles.collateralRatioContainer}>
            <Text style={styles.collateralRatioLabel}>Collateral Ratio:</Text>
            <Text
              style={[
                styles.collateralRatioValue,
                sovrynStats.collateralRatio < 130 && styles.collateralRatioDanger,
                sovrynStats.collateralRatio >= 130 &&
                  sovrynStats.collateralRatio < 150 &&
                  styles.collateralRatioWarning,
              ]}
            >
              {sovrynStats.collateralRatio}%
            </Text>
          </View>

          <View style={styles.balancesRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>DLLR Balance:</Text>
              <Text style={styles.balanceValue}>${sovrynStats.dllrBalance}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>RBTC Balance:</Text>
              <Text style={styles.balanceValue}>{sovrynStats.rbtcBalance} RBTC</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('SovrynWealth')}
          >
            <Text style={styles.manageButtonText}>💰 Manage Sovryn Vault</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.invisibleVaultCard}>
          <Text style={styles.invisibleVaultIcon}>👻</Text>
          <Text style={styles.invisibleVaultTitle}>Sovryn Vault Invisible</Text>
          <Text style={styles.invisibleVaultText}>
            Your Bitcoin vault is hidden until you complete a PFF Presence Scan.
            {'\n\n'}
            \"No presence, no vault. No heartbeat, no Bitcoin.\"
          </Text>
          <TouchableOpacity style={styles.invisibleVaultButton} onPress={unlockSovereignVault}>
            <Text style={styles.invisibleVaultButtonText}>🫀 Unlock Vault</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔐 Sovereign Vault Protection</Text>
        <Text style={styles.infoText}>
          Your vault combines biological and financial sovereignty:
          {'\n\n'}
          • National Pulse: Always visible (your biological identity)
          {'\n'}
          • Sovryn Vault: Only visible when present (your financial vault)
          {'\n'}
          • Session expires after 5 minutes of inactivity
          {'\n'}
          • Presence proof expires after 60 seconds
          {'\n\n'}
          \"Your Bitcoin is physically attached to your presence.\"
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27', // Obsidian
  },

  // Header
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B9DC3',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Sovereign_Active Status Card
  statusCard: {
    backgroundColor: '#FF6B35', // Red (locked)
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },
  statusCardActive: {
    backgroundColor: '#00D4AA', // Green (unlocked)
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  unlockButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionInfoLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  sessionInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sessionInfoValueActive: {
    color: '#FFD700', // Gold
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: '#8B9DC3',
  },

  // Vitalized Info
  vitalizedInfo: {
    backgroundColor: '#0A0E27',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  vitalizedLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 4,
  },
  vitalizedDate: {
    fontSize: 12,
    color: '#8B9DC3',
  },

  // Citizen Count
  citizenCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3458',
  },
  citizenCountLabel: {
    fontSize: 14,
    color: '#8B9DC3',
  },
  citizenCountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
  },

  // Collateral Ratio
  collateralRatioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  collateralRatioLabel: {
    fontSize: 14,
    color: '#8B9DC3',
  },
  collateralRatioValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D4AA', // Green (safe)
  },
  collateralRatioWarning: {
    color: '#FFD700', // Gold (warning)
  },
  collateralRatioDanger: {
    color: '#FF6B35', // Red (danger)
  },

  // Balances Row
  balancesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Manage Button
  manageButton: {
    backgroundColor: '#FFD700', // Gold
    paddingVertical: 14,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0E27', // Obsidian
    textAlign: 'center',
  },

  // Invisible Vault Card
  invisibleVaultCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A3458',
    borderStyle: 'dashed',
  },
  invisibleVaultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  invisibleVaultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B9DC3',
    marginBottom: 12,
  },
  invisibleVaultText: {
    fontSize: 14,
    color: '#8B9DC3',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  invisibleVaultButton: {
    backgroundColor: '#FFD700', // Gold
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  invisibleVaultButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0E27', // Obsidian
  },

  // Info Box
  infoBox: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8B9DC3',
    lineHeight: 22,
  },
});

