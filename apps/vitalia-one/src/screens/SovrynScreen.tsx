/**
 * SovrynScreen.tsx - Sovryn DeFi Integration UI
 * 
 * "My wealth is secured by my presence."
 * 
 * Features:
 * - DLLR (Sovryn Dollar) balance tracker
 * - Spot trading with PFF gating
 * - Lending/Borrowing with PFF gating
 * - Sovryn Zero (0% interest loans) with PFF gating
 * - Wallet connection (MetaMask, Defiant, Hardware)
 * 
 * Network: Rootstock (RSK) - Bitcoin-secured smart contracts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SovrynClient, RSK_MAINNET_CONFIG } from '@vitalia/contracts/sovryn/SovrynClient';
import { generatePresenceProof, withPresence } from '@vitalia/contracts/sovryn/PresenceGate';
import type { SovrynBalances, PresenceProof } from '@vitalia/contracts/sovryn/SovrynClient';

interface SovrynScreenProps {
  navigation: any;
  route: any;
}

export default function SovrynScreen({ navigation, route }: SovrynScreenProps) {
  const [sovryn] = useState(() => new SovrynClient(RSK_MAINNET_CONFIG));
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [balances, setBalances] = useState<SovrynBalances | null>(null);
  const [presenceProof, setPresenceProof] = useState<PresenceProof | null>(null);
  const [loading, setLoading] = useState(false);

  // Trade form
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeFromToken, setTradeFromToken] = useState('RBTC');
  const [tradeToToken, setTradeToToken] = useState('DLLR');

  // Lend form
  const [lendAmount, setLendAmount] = useState('');

  // Borrow form
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');

  useEffect(() => {
    // Auto-connect if wallet provider available
    // In production, detect MetaMask/Defiant
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);

      // In production, use actual wallet provider (MetaMask, Defiant)
      // For now, simulate connection
      Alert.alert(
        '🔗 Connect Wallet',
        'Select your wallet:\n\n• MetaMask\n• Defiant\n• Hardware Wallet',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'MetaMask',
            onPress: async () => {
              // Simulate wallet connection
              const mockAddress = '0x1234567890123456789012345678901234567890';
              setAddress(mockAddress);
              setConnected(true);

              // Load balances
              await loadBalances(mockAddress);

              Alert.alert('✅ Wallet Connected', `Address: ${mockAddress.substring(0, 10)}...`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('[SOVRYN] Wallet connection failed:', error);
      Alert.alert('Error', 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (addr: string) => {
    try {
      // In production, query actual Sovryn contracts
      // For now, use mock balances
      const mockBalances: SovrynBalances = {
        rbtc: '0.5',
        dllr: '1000.00',
        sov: '50.00',
        xusd: '500.00',
      };

      setBalances(mockBalances);
    } catch (error) {
      console.error('[SOVRYN] Failed to load balances:', error);
    }
  };

  const requestPresenceProof = () => {
    Alert.alert(
      '🫀 Biometric Verification Required',
      'To execute this transaction, you must verify your physical presence using PFF heartbeat scan.\n\nThis ensures your wealth is secured by your presence.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Scan',
          onPress: () => {
            // Navigate to heartbeat scan screen
            navigation.navigate('Welcome', {
              returnTo: 'Sovryn',
              onScanComplete: handlePresenceProofGenerated,
            });
          },
        },
      ]
    );
  };

  const handlePresenceProofGenerated = async (scanResult: any) => {
    try {
      // Generate presence proof from scan result
      const proof = await generatePresenceProof(
        'VITALIZED_UID_12345', // In production, use actual UID
        scanResult,
        '0x1234567890123456789012345678901234567890123456789012345678901234' // In production, use actual private key
      );

      setPresenceProof(proof);

      Alert.alert(
        '✅ Presence Verified',
        `Your physical presence has been verified.\n\nBPM: ${scanResult.bpm}\nConfidence: ${(scanResult.confidence * 100).toFixed(1)}%\n\nYou can now execute DeFi transactions.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const executeTrade = async () => {
    if (!presenceProof) {
      requestPresenceProof();
      return;
    }

    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Execute trade with presence gating
      const txHash = await withPresence(
        () =>
          sovryn.trade({
            fromToken: tradeFromToken,
            toToken: tradeToToken,
            amount: tradeAmount,
            minReturn: (parseFloat(tradeAmount) * 0.95).toString(), // 5% slippage
            deadline: Math.floor(Date.now() / 1000) + 600, // 10 minutes
          }),
        presenceProof
      );

      Alert.alert(
        '✅ Trade Executed',
        `Your trade has been executed.\n\nTransaction: ${txHash.substring(0, 10)}...\n\nAmount: ${tradeAmount} ${tradeFromToken} → ${tradeToToken}`
      );

      // Reload balances
      await loadBalances(address);

      // Clear form
      setTradeAmount('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏦 Sovryn DeFi</Text>
        <Text style={styles.subtitle}>"My wealth is secured by my presence."</Text>
      </View>

      {/* Wallet Connection */}
      {!connected ? (
        <View style={styles.connectCard}>
          <Text style={styles.connectTitle}>Connect Wallet</Text>
          <Text style={styles.connectText}>
            Connect your wallet to access Sovryn DeFi on Rootstock (RSK).
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
          {/* Balances */}
          <View style={styles.balancesCard}>
            <Text style={styles.cardTitle}>💰 Your Balances</Text>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>RBTC (Rootstock BTC)</Text>
              <Text style={styles.balanceValue}>{balances?.rbtc || '0.00'}</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>DLLR (Sovryn Dollar)</Text>
              <Text style={[styles.balanceValue, styles.dllrValue]}>
                ${balances?.dllr || '0.00'}
              </Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>SOV (Sovryn Token)</Text>
              <Text style={styles.balanceValue}>{balances?.sov || '0.00'}</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>XUSD (Stablecoin)</Text>
              <Text style={styles.balanceValue}>${balances?.xusd || '0.00'}</Text>
            </View>

            <Text style={styles.addressText}>
              Address: {address.substring(0, 10)}...{address.substring(address.length - 8)}
            </Text>

            {/* Sovryn Wealth Dashboard Button */}
            <TouchableOpacity
              style={styles.wealthButton}
              onPress={() => navigation.navigate('SovrynWealth')}
            >
              <Text style={styles.wealthButtonText}>💰 Sovryn Wealth Dashboard</Text>
            </TouchableOpacity>
          </View>

          {/* Presence Status */}
          <View style={[styles.presenceCard, presenceProof && styles.presenceCardActive]}>
            <Text style={styles.presenceTitle}>
              {presenceProof ? '✅ Presence Verified' : '⚠️ Presence Required'}
            </Text>
            <Text style={styles.presenceText}>
              {presenceProof
                ? `Your physical presence has been verified.\n\nBPM: ${presenceProof.bpm}\nExpires in: ${Math.floor((presenceProof.timestamp + 60000 - Date.now()) / 1000)}s`
                : 'All DeFi transactions require biometric verification.\n\nNo trade or loan without the heartbeat.'}
            </Text>

            {!presenceProof && (
              <TouchableOpacity style={styles.verifyButton} onPress={requestPresenceProof}>
                <Text style={styles.verifyButtonText}>🫀 Verify Presence</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Spot Trading */}
          <View style={styles.actionCard}>
            <Text style={styles.cardTitle}>📈 Spot Trading</Text>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>From:</Text>
              <TextInput
                style={styles.formInput}
                value={tradeFromToken}
                onChangeText={setTradeFromToken}
                placeholder="RBTC"
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>To:</Text>
              <TextInput
                style={styles.formInput}
                value={tradeToToken}
                onChangeText={setTradeToToken}
                placeholder="DLLR"
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Amount:</Text>
              <TextInput
                style={styles.formInput}
                value={tradeAmount}
                onChangeText={setTradeAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.actionButton, !presenceProof && styles.actionButtonDisabled]}
              onPress={executeTrade}
              disabled={loading || !presenceProof}
            >
              <Text style={styles.actionButtonText}>
                {loading ? '⏳ Executing...' : '🔄 Execute Trade'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lending */}
          <View style={styles.actionCard}>
            <Text style={styles.cardTitle}>💰 Lending</Text>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Amount to Lend:</Text>
              <TextInput
                style={styles.formInput}
                value={lendAmount}
                onChangeText={setLendAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.actionButton, !presenceProof && styles.actionButtonDisabled]}
              onPress={async () => {
                if (!presenceProof) {
                  requestPresenceProof();
                  return;
                }
                try {
                  setLoading(true);
                  const txHash = await withPresence(
                    () => sovryn.lend(RSK_MAINNET_CONFIG.contracts.dllrToken, lendAmount),
                    presenceProof
                  );
                  Alert.alert('✅ Lending Complete', `Transaction: ${txHash.substring(0, 10)}...`);
                  await loadBalances(address);
                  setLendAmount('');
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !presenceProof}
            >
              <Text style={styles.actionButtonText}>
                {loading ? '⏳ Lending...' : '💰 Lend Tokens'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Borrowing */}
          <View style={styles.actionCard}>
            <Text style={styles.cardTitle}>🏦 Borrowing</Text>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Borrow Amount:</Text>
              <TextInput
                style={styles.formInput}
                value={borrowAmount}
                onChangeText={setBorrowAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Collateral Amount:</Text>
              <TextInput
                style={styles.formInput}
                value={collateralAmount}
                onChangeText={setCollateralAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.actionButton, !presenceProof && styles.actionButtonDisabled]}
              onPress={async () => {
                if (!presenceProof) {
                  requestPresenceProof();
                  return;
                }
                try {
                  setLoading(true);
                  const txHash = await withPresence(
                    () =>
                      sovryn.borrow({
                        loanToken: RSK_MAINNET_CONFIG.contracts.dllrToken,
                        collateralToken: RSK_MAINNET_CONFIG.contracts.rbtcToken,
                        borrowAmount,
                        collateralAmount,
                      }),
                    presenceProof
                  );
                  Alert.alert('✅ Borrow Complete', `Transaction: ${txHash.substring(0, 10)}...`);
                  await loadBalances(address);
                  setBorrowAmount('');
                  setCollateralAmount('');
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !presenceProof}
            >
              <Text style={styles.actionButtonText}>
                {loading ? '⏳ Borrowing...' : '🏦 Borrow Tokens'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sovryn Zero (0% Interest Loans) */}
          <View style={styles.actionCard}>
            <Text style={styles.cardTitle}>⚡ Sovryn Zero (0% Interest)</Text>
            <Text style={styles.cardSubtitle}>
              Borrow at 0% interest with RBTC collateral
            </Text>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Collateral (RBTC):</Text>
              <TextInput
                style={styles.formInput}
                value={collateralAmount}
                onChangeText={setCollateralAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Loan Amount (DLLR):</Text>
              <TextInput
                style={styles.formInput}
                value={borrowAmount}
                onChangeText={setBorrowAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonZero, !presenceProof && styles.actionButtonDisabled]}
              onPress={async () => {
                if (!presenceProof) {
                  requestPresenceProof();
                  return;
                }
                try {
                  setLoading(true);
                  const txHash = await withPresence(
                    () =>
                      sovryn.openZeroLoan({
                        collateralToken: RSK_MAINNET_CONFIG.contracts.rbtcToken,
                        loanToken: RSK_MAINNET_CONFIG.contracts.dllrToken,
                        collateralAmount,
                        loanAmount: borrowAmount,
                        duration: 2419200, // 28 days
                      }),
                    presenceProof
                  );
                  Alert.alert('✅ Zero Loan Opened', `Transaction: ${txHash.substring(0, 10)}...`);
                  await loadBalances(address);
                  setBorrowAmount('');
                  setCollateralAmount('');
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !presenceProof}
            >
              <Text style={styles.actionButtonText}>
                {loading ? '⏳ Opening Loan...' : '⚡ Open 0% Loan'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B9DC3', fontStyle: 'italic' },

  connectCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  connectTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  connectText: { fontSize: 14, color: '#8B9DC3', marginBottom: 16, lineHeight: 22 },
  connectButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12 },
  connectButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  balancesCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  balanceLabel: { fontSize: 14, color: '#8B9DC3' },
  balanceValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  dllrValue: { color: '#00D4AA' },
  addressText: { fontSize: 12, color: '#8B9DC3', marginTop: 16, textAlign: 'center' },
  wealthButton: { backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  wealthButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27', textAlign: 'center' },

  presenceCard: { backgroundColor: '#FF6B35', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  presenceCardActive: { backgroundColor: '#00D4AA' },
  presenceTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  presenceText: { fontSize: 14, color: '#FFFFFF', lineHeight: 22, marginBottom: 16 },
  verifyButton: { backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 8 },
  verifyButtonText: { fontSize: 14, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center' },

  actionCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  cardSubtitle: { fontSize: 12, color: '#8B9DC3', marginBottom: 16, fontStyle: 'italic' },
  formRow: { marginBottom: 16 },
  formLabel: { fontSize: 14, color: '#8B9DC3', marginBottom: 8 },
  formInput: { backgroundColor: '#0A0E27', color: '#FFFFFF', padding: 12, borderRadius: 8, fontSize: 16 },
  actionButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  actionButtonZero: { backgroundColor: '#FFD700' },
  actionButtonDisabled: { backgroundColor: '#1E2749', opacity: 0.5 },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
});

