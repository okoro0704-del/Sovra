/**
 * SovrynWealthScreen.tsx - Sovryn Wealth Dashboard
 * 
 * "Your Bitcoin. Your Health. Your Sovereignty."
 * 
 * Components:
 * 1. DLLR Wallet - Display DLLR balance with Mint DLLR button
 * 2. Zero Loan Monitor - Active collateral, debt, liquidation alert
 * 3. PFF-Gated Actions - Withdraw/Borrow require Health Check + Presence Proof
 * 4. FastBTC Integration - Top Up button for BTC → RBTC conversion
 * 
 * Aesthetic: Obsidian & Gold theme with glowing DLLR symbol
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SovrynClient, RSK_MAINNET_CONFIG } from '@vitalia/contracts/sovryn/SovrynClient';
import { generatePresenceProof, withPresence } from '@vitalia/contracts/sovryn/PresenceGate';
import { verifyHealthCover, CoverageStatus } from '@vitalia/contracts';
import type { PresenceProof } from '@vitalia/contracts/sovryn/SovrynClient';

interface SovrynWealthScreenProps {
  navigation: any;
  route: any;
}

interface ZeroLoanData {
  collateralAmount: string; // RBTC
  debtAmount: string; // DLLR
  collateralRatio: number; // Percentage
  liquidationPrice: string; // USD
}

export default function SovrynWealthScreen({ navigation, route }: SovrynWealthScreenProps) {
  const [sovryn] = useState(() => new SovrynClient(RSK_MAINNET_CONFIG));
  
  // Wallet state
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [dllrBalance, setDllrBalance] = useState<string>('0.00');
  const [rbtcBalance, setRbtcBalance] = useState<string>('0.00');
  
  // Zero Loan state
  const [zeroLoan, setZeroLoan] = useState<ZeroLoanData | null>(null);
  const [liquidationRisk, setLiquidationRisk] = useState<'SAFE' | 'WARNING' | 'DANGER'>('SAFE');
  
  // Gating state
  const [presenceProof, setPresenceProof] = useState<PresenceProof | null>(null);
  const [healthCheckPassed, setHealthCheckPassed] = useState(false);
  const [actionsEnabled, setActionsEnabled] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Auto-load if wallet connected
    if (connected && address) {
      loadWealthData();
    }
  }, [connected, address]);

  useEffect(() => {
    // Enable actions only if both Health Check and Presence Proof are valid
    setActionsEnabled(healthCheckPassed && presenceProof !== null);
  }, [healthCheckPassed, presenceProof]);

  const connectWallet = async () => {
    try {
      setLoading(true);

      // In production, use actual wallet provider
      Alert.alert(
        '🔗 Connect Wallet',
        'Select your wallet to access Sovryn Wealth Dashboard',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'MetaMask',
            onPress: async () => {
              // Simulate wallet connection
              const mockAddress = '0x1234567890123456789012345678901234567890';
              setAddress(mockAddress);
              setConnected(true);

              await loadWealthData();

              Alert.alert('✅ Wallet Connected', `Address: ${mockAddress.substring(0, 10)}...`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('[SOVRYN WEALTH] Wallet connection failed:', error);
      Alert.alert('Error', 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const loadWealthData = async () => {
    try {
      setRefreshing(true);

      // Load DLLR balance
      const dllr = await sovryn.getDLLRBalance(address);
      setDllrBalance(dllr);

      // Load RBTC balance
      const balances = await sovryn.getBalances(address);
      setRbtcBalance(balances.rbtc);

      // Load Zero Loan data (mock for now)
      const mockLoan: ZeroLoanData = {
        collateralAmount: '0.5', // 0.5 RBTC
        debtAmount: '15000.00', // 15,000 DLLR
        collateralRatio: 150, // 150%
        liquidationPrice: '25000', // $25,000
      };
      setZeroLoan(mockLoan);

      // Calculate liquidation risk
      if (mockLoan.collateralRatio <= 110) {
        setLiquidationRisk('DANGER');
      } else if (mockLoan.collateralRatio <= 130) {
        setLiquidationRisk('WARNING');
      } else {
        setLiquidationRisk('SAFE');
      }
    } catch (error) {
      console.error('[SOVRYN WEALTH] Failed to load wealth data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const performHealthCheck = async () => {
    try {
      setLoading(true);

      Alert.alert(
        '🏥 Health Check Required',
        'To enable Sovryn actions, you must verify your health coverage status.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Health Check',
            onPress: async () => {
              // Navigate to health verification
              navigation.navigate('Health', {
                returnTo: 'SovrynWealth',
                onHealthCheckComplete: handleHealthCheckComplete,
              });
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheckComplete = async (result: any) => {
    if (result.status === CoverageStatus.COVERAGE_CONFIRMED) {
      setHealthCheckPassed(true);
      Alert.alert('✅ Health Check Passed', 'Your health coverage is active.');
    } else {
      setHealthCheckPassed(false);
      Alert.alert('❌ Health Check Failed', 'Health coverage verification failed.');
    }
  };

  const performPresenceProof = () => {
    Alert.alert(
      '🫀 Presence Proof Required',
      'To enable Sovryn actions, you must verify your physical presence using PFF heartbeat scan.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Scan',
          onPress: () => {
            navigation.navigate('Welcome', {
              returnTo: 'SovrynWealth',
              onScanComplete: handlePresenceProofGenerated,
            });
          },
        },
      ]
    );
  };

  const handlePresenceProofGenerated = async (scanResult: any) => {
    try {
      const proof = await generatePresenceProof(
        'VITALIZED_UID_12345', // In production, use actual UID
        scanResult,
        '0x1234567890123456789012345678901234567890123456789012345678901234' // In production, use actual private key
      );

      setPresenceProof(proof);

      Alert.alert(
        '✅ Presence Verified',
        `Your physical presence has been verified.\n\nBPM: ${scanResult.bpm}\nConfidence: ${(scanResult.confidence * 100).toFixed(1)}%\n\nSovryn actions are now enabled.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const openMintDLLR = () => {
    if (!actionsEnabled) {
      Alert.alert(
        '🔒 Actions Locked',
        'Complete Health Check and Presence Proof to enable Sovryn actions.',
        [
          { text: 'Health Check', onPress: performHealthCheck },
          { text: 'Presence Proof', onPress: performPresenceProof },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // Navigate to Sovryn Zero interface
    navigation.navigate('Sovryn', {
      action: 'openZeroLoan',
      presenceProof,
    });
  };

  const withdrawDLLR = async () => {
    if (!actionsEnabled) {
      Alert.alert(
        '🔒 Actions Locked',
        'Complete Health Check and Presence Proof to enable withdrawals.'
      );
      return;
    }

    Alert.alert(
      '💸 Withdraw DLLR',
      'Enter withdrawal amount:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              setLoading(true);

              // Execute withdrawal with presence gating
              const txHash = await withPresence(
                () => sovryn.trade({
                  fromToken: RSK_MAINNET_CONFIG.contracts.dllrToken,
                  toToken: RSK_MAINNET_CONFIG.contracts.rbtcToken,
                  amount: '100', // Mock amount
                  minReturn: '0.002',
                  deadline: Math.floor(Date.now() / 1000) + 600,
                }),
                presenceProof!
              );

              Alert.alert('✅ Withdrawal Complete', `Transaction: ${txHash.substring(0, 10)}...`);
              await loadWealthData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const borrowDLLR = async () => {
    if (!actionsEnabled) {
      Alert.alert(
        '🔒 Actions Locked',
        'Complete Health Check and Presence Proof to enable borrowing.'
      );
      return;
    }

    // Navigate to Sovryn Zero interface
    navigation.navigate('Sovryn', {
      action: 'borrow',
      presenceProof,
    });
  };

  const topUpWithFastBTC = () => {
    Alert.alert(
      '⚡ FastBTC Top Up',
      'Convert native BTC to RBTC (Smart Bitcoin) instantly using Sovryn FastBTC relay.\n\nThis feature connects to the Bitcoin network.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // In production, open FastBTC interface
            Alert.alert(
              '🔗 FastBTC Relay',
              'Send BTC to the following address:\n\nbc1q...\n\nYou will receive RBTC on RSK within 10 minutes.',
              [{ text: 'Copy Address' }, { text: 'Close' }]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0E27', '#1E2749']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>⚡ Sovryn Wealth</Text>
        <Text style={styles.headerSubtitle}>"Your Bitcoin. Your Health. Your Sovereignty."</Text>
      </LinearGradient>

      {!connected ? (
        /* Wallet Connection */
        <View style={styles.connectCard}>
          <Text style={styles.connectTitle}>Connect Wallet</Text>
          <Text style={styles.connectText}>
            Connect your wallet to access the Sovryn Wealth Dashboard.
          </Text>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={connectWallet}
            disabled={loading}
          >
            <Text style={styles.connectButtonText}>
              {loading ? '⏳ Connecting...' : '🔗 Connect Wallet'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* COMPONENT 1: DLLR WALLET */}
          <LinearGradient
            colors={['#1E2749', '#2A3458']}
            style={styles.dllrCard}
          >
            <View style={styles.dllrHeader}>
              <Text style={styles.dllrSymbol}>💵</Text>
              <Text style={styles.dllrTitle}>DLLR Wallet</Text>
            </View>

            <View style={styles.dllrBalanceContainer}>
              <Text style={styles.dllrBalanceLabel}>Balance</Text>
              <Text style={[styles.dllrBalance, styles.glowingText]}>
                ${parseFloat(dllrBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.dllrBalanceSubtext}>Sovryn Dollar (USD-pegged)</Text>
            </View>

            <TouchableOpacity
              style={[styles.mintButton, !actionsEnabled && styles.buttonDisabled]}
              onPress={openMintDLLR}
              disabled={!actionsEnabled || loading}
            >
              <Text style={styles.mintButtonText}>
                {actionsEnabled ? '⚡ Mint DLLR (Zero Loan)' : '🔒 Mint DLLR (Locked)'}
              </Text>
            </TouchableOpacity>

            <View style={styles.rbtcBalanceRow}>
              <Text style={styles.rbtcLabel}>RBTC Balance:</Text>
              <Text style={styles.rbtcValue}>{rbtcBalance} RBTC</Text>
            </View>
          </LinearGradient>

          {/* COMPONENT 2: ZERO LOAN MONITOR */}
          {zeroLoan && (
            <View style={styles.loanCard}>
              <Text style={styles.loanTitle}>⚡ Zero Loan Monitor</Text>
              <Text style={styles.loanSubtitle}>0% Interest • Bitcoin Collateral</Text>

              <View style={styles.loanMetrics}>
                <View style={styles.loanMetricItem}>
                  <Text style={styles.loanMetricLabel}>Active Collateral</Text>
                  <Text style={styles.loanMetricValue}>{zeroLoan.collateralAmount} RBTC</Text>
                  <Text style={styles.loanMetricSubtext}>
                    ≈ ${(parseFloat(zeroLoan.collateralAmount) * 50000).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.loanMetricItem}>
                  <Text style={styles.loanMetricLabel}>Current Debt</Text>
                  <Text style={styles.loanMetricValue}>${parseFloat(zeroLoan.debtAmount).toLocaleString()}</Text>
                  <Text style={styles.loanMetricSubtext}>DLLR</Text>
                </View>
              </View>

              {/* Liquidation Alert Progress Bar */}
              <View style={styles.liquidationContainer}>
                <View style={styles.liquidationHeader}>
                  <Text style={styles.liquidationTitle}>Liquidation Alert</Text>
                  <Text
                    style={[
                      styles.liquidationRatio,
                      liquidationRisk === 'DANGER' && styles.liquidationDanger,
                      liquidationRisk === 'WARNING' && styles.liquidationWarning,
                    ]}
                  >
                    {zeroLoan.collateralRatio}%
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(zeroLoan.collateralRatio, 200)}%` },
                      liquidationRisk === 'DANGER' && styles.progressBarDanger,
                      liquidationRisk === 'WARNING' && styles.progressBarWarning,
                      liquidationRisk === 'SAFE' && styles.progressBarSafe,
                    ]}
                  />
                </View>

                <View style={styles.liquidationLabels}>
                  <Text style={styles.liquidationLabel}>110% (Danger)</Text>
                  <Text style={styles.liquidationLabel}>130% (Warning)</Text>
                  <Text style={styles.liquidationLabel}>150%+ (Safe)</Text>
                </View>

                {liquidationRisk === 'DANGER' && (
                  <View style={styles.alertBox}>
                    <Text style={styles.alertText}>
                      ⚠️ CRITICAL: Add collateral immediately to avoid liquidation!
                    </Text>
                  </View>
                )}

                {liquidationRisk === 'WARNING' && (
                  <View style={[styles.alertBox, styles.alertBoxWarning]}>
                    <Text style={styles.alertText}>
                      ⚠️ WARNING: Collateral ratio approaching liquidation threshold.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* COMPONENT 3: PFF-GATED ACTIONS */}
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>🔐 Gated Actions</Text>
            <Text style={styles.actionsSubtitle}>
              Requires Health Check + Presence Proof
            </Text>

            {/* Gating Status */}
            <View style={styles.gatingStatus}>
              <View style={styles.gatingItem}>
                <Text style={styles.gatingLabel}>Health Check:</Text>
                <Text style={[styles.gatingValue, healthCheckPassed && styles.gatingPassed]}>
                  {healthCheckPassed ? '✅ Passed' : '❌ Required'}
                </Text>
              </View>

              <View style={styles.gatingItem}>
                <Text style={styles.gatingLabel}>Presence Proof:</Text>
                <Text style={[styles.gatingValue, presenceProof && styles.gatingPassed]}>
                  {presenceProof ? '✅ Verified' : '❌ Required'}
                </Text>
              </View>
            </View>

            {!actionsEnabled && (
              <View style={styles.unlockContainer}>
                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={performHealthCheck}
                  disabled={healthCheckPassed}
                >
                  <Text style={styles.unlockButtonText}>
                    {healthCheckPassed ? '✅ Health Check Complete' : '🏥 Start Health Check'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={performPresenceProof}
                  disabled={!!presenceProof}
                >
                  <Text style={styles.unlockButtonText}>
                    {presenceProof ? '✅ Presence Verified' : '🫀 Verify Presence'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, !actionsEnabled && styles.buttonDisabled]}
                onPress={withdrawDLLR}
                disabled={!actionsEnabled || loading}
              >
                <Text style={styles.actionButtonText}>
                  {actionsEnabled ? '💸 Withdraw' : '🔒 Withdraw'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, !actionsEnabled && styles.buttonDisabled]}
                onPress={borrowDLLR}
                disabled={!actionsEnabled || loading}
              >
                <Text style={styles.actionButtonText}>
                  {actionsEnabled ? '🏦 Borrow' : '🔒 Borrow'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* COMPONENT 4: FASTBTC INTEGRATION */}
          <View style={styles.fastBTCCard}>
            <Text style={styles.fastBTCTitle}>⚡ FastBTC Relay</Text>
            <Text style={styles.fastBTCSubtitle}>
              Convert native BTC to RBTC (Smart Bitcoin) instantly
            </Text>

            <View style={styles.fastBTCInfo}>
              <View style={styles.fastBTCInfoRow}>
                <Text style={styles.fastBTCInfoLabel}>Network:</Text>
                <Text style={styles.fastBTCInfoValue}>Bitcoin → Rootstock</Text>
              </View>

              <View style={styles.fastBTCInfoRow}>
                <Text style={styles.fastBTCInfoLabel}>Speed:</Text>
                <Text style={styles.fastBTCInfoValue}>~10 minutes</Text>
              </View>

              <View style={styles.fastBTCInfoRow}>
                <Text style={styles.fastBTCInfoLabel}>Fee:</Text>
                <Text style={styles.fastBTCInfoValue}>0.2%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.topUpButton}
              onPress={topUpWithFastBTC}
              disabled={loading}
            >
              <Text style={styles.topUpButtonText}>⚡ Top Up with BTC</Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🔐 Sovereign Wealth Protection</Text>
            <Text style={styles.infoText}>
              Your Sovryn wealth is protected by:
              {'\n'}• PFF Heartbeat Verification
              {'\n'}• Health Coverage Status
              {'\n'}• Bitcoin-Secured Smart Contracts
              {'\n'}• Zero-Knowledge Privacy
            </Text>
          </View>
        </>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      )}
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
  },

  // Connect Card
  connectCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
  },
  connectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  connectText: {
    fontSize: 14,
    color: '#8B9DC3',
    marginBottom: 20,
    lineHeight: 22,
  },
  connectButton: {
    backgroundColor: '#FFD700', // Gold
    paddingVertical: 16,
    borderRadius: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0E27', // Obsidian
    textAlign: 'center',
  },

  // DLLR Wallet Card
  dllrCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold border
  },
  dllrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dllrSymbol: {
    fontSize: 32,
    marginRight: 12,
  },
  dllrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
  },
  dllrBalanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dllrBalanceLabel: {
    fontSize: 14,
    color: '#8B9DC3',
    marginBottom: 8,
  },
  dllrBalance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 8,
  },
  glowingText: {
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dllrBalanceSubtext: {
    fontSize: 12,
    color: '#8B9DC3',
  },
  mintButton: {
    backgroundColor: '#FFD700', // Gold
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mintButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0E27', // Obsidian
    textAlign: 'center',
  },
  rbtcBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3458',
  },
  rbtcLabel: {
    fontSize: 14,
    color: '#8B9DC3',
  },
  rbtcValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Zero Loan Monitor
  loanCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
  },
  loanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 4,
  },
  loanSubtitle: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 20,
  },
  loanMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  loanMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  loanMetricLabel: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 8,
  },
  loanMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  loanMetricSubtext: {
    fontSize: 12,
    color: '#8B9DC3',
  },

  // Liquidation Alert
  liquidationContainer: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
  },
  liquidationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liquidationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  liquidationRatio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4AA', // Safe (green)
  },
  liquidationWarning: {
    color: '#FFD700', // Warning (gold)
  },
  liquidationDanger: {
    color: '#FF6B35', // Danger (red)
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#1E2749',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarSafe: {
    backgroundColor: '#00D4AA', // Green
  },
  progressBarWarning: {
    backgroundColor: '#FFD700', // Gold
  },
  progressBarDanger: {
    backgroundColor: '#FF6B35', // Red
  },
  liquidationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liquidationLabel: {
    fontSize: 10,
    color: '#8B9DC3',
  },
  alertBox: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  alertBoxWarning: {
    backgroundColor: '#FFD700',
  },
  alertText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Gated Actions Card
  actionsCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 4,
  },
  actionsSubtitle: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 20,
  },
  gatingStatus: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  gatingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gatingLabel: {
    fontSize: 14,
    color: '#8B9DC3',
  },
  gatingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35', // Red (not passed)
  },
  gatingPassed: {
    color: '#00D4AA', // Green (passed)
  },
  unlockContainer: {
    marginBottom: 20,
  },
  unlockButton: {
    backgroundColor: '#2A3458',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFD700', // Gold
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0E27', // Obsidian
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#2A3458',
    opacity: 0.5,
  },

  // FastBTC Card
  fastBTCCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold border
  },
  fastBTCTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold
    marginBottom: 4,
  },
  fastBTCSubtitle: {
    fontSize: 12,
    color: '#8B9DC3',
    marginBottom: 20,
  },
  fastBTCInfo: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  fastBTCInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fastBTCInfoLabel: {
    fontSize: 14,
    color: '#8B9DC3',
  },
  fastBTCInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topUpButton: {
    backgroundColor: '#FFD700', // Gold
    paddingVertical: 16,
    borderRadius: 12,
  },
  topUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0E27', // Obsidian
    textAlign: 'center',
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

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 39, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

