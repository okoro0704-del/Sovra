/**
 * Vault Screen - VIDA/nVIDA Dashboard
 * 
 * Protected by VitalizedGate HOC
 * Shows user balance and quick actions
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { VitalizedGate } from '@vitalia/pff-engine/src/VitalizedGate';
import { getUserBalance } from '@vitalia/contracts/src/SovereignChain';

function VaultScreenContent({ navigation }: any) {
  const [balance, setBalance] = useState({ vidaLiquid: 0, vidaLocked: 0, nVida: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const userBalance = await getUserBalance('user_123'); // In production, get from auth
    setBalance(userBalance);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBalance();
    setRefreshing(false);
  };

  const totalVida = balance.vidaLiquid + balance.vidaLocked;
  const totalNaira = (balance.vidaLiquid * 1000) + (balance.nVida);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Ѵ</Text>
        <Text style={styles.title}>The Vault</Text>
      </View>

      {/* Total Balance */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>₦{totalNaira.toLocaleString()}</Text>
        <Text style={styles.totalSubtext}>{totalVida} VIDA + {balance.nVida} nVIDA</Text>
      </View>

      {/* VIDA Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VIDA (Ѵ)</Text>
        
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Liquid</Text>
            <Text style={styles.balanceAmount}>{balance.vidaLiquid} Ѵ</Text>
          </View>
          <Text style={styles.balanceNaira}>₦{(balance.vidaLiquid * 1000).toLocaleString()}</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Locked</Text>
            <Text style={styles.balanceAmount}>{balance.vidaLocked} Ѵ</Text>
          </View>
          <Text style={styles.balanceNaira}>₦{(balance.vidaLocked * 1000).toLocaleString()}</Text>
          <Text style={styles.lockedNote}>Unlocks over time</Text>
        </View>
      </View>

      {/* nVIDA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>nVIDA (Stable)</Text>
        
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>{balance.nVida} nVIDA</Text>
          </View>
          <Text style={styles.balanceNaira}>₦{balance.nVida.toLocaleString()} (1:1 NGN)</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => navigation.navigate('Bridge')}
        >
          <Text style={styles.actionButtonText}>Buy/Sell VIDA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonHealth]}
          onPress={() => navigation.navigate('Health')}
        >
          <Text style={styles.actionButtonText}>🏥 Health Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSentinel]}
          onPress={() => navigation.navigate('Sentinel')}
        >
          <Text style={styles.actionButtonText}>🤖 Sentinel AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonBorderCross]}
          onPress={() => navigation.navigate('BorderCross')}
        >
          <Text style={styles.actionButtonText}>🛰️ Border-Cross Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonWitness]}
          onPress={() => navigation.navigate('WitnessMode')}
        >
          <Text style={styles.actionButtonText}>⚖️ Witness Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonExile]}
          onPress={() => navigation.navigate('ExileVault')}
        >
          <Text style={styles.actionButtonText}>🏛️ Exile-Vault Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSovryn]}
          onPress={() => navigation.navigate('Sovryn')}
        >
          <Text style={styles.actionButtonText}>🏦 Sovryn DeFi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonUnified]}
          onPress={() => navigation.navigate('UnifiedVault')}
        >
          <Text style={styles.actionButtonText}>🏛️ Unified Vault</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Send Money</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔐 Your Vault is Protected</Text>
        <Text style={styles.infoText}>
          Your heartbeat unlocks this vault.{'\n'}
          No one else can access your VIDA.
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Vault Screen wrapped with VitalizedGate
 */
export default function VaultScreen(props: any) {
  return (
    <VitalizedGate
      onLifeConfirmed={(bpm) => console.log('Vault unlocked with BPM:', bpm)}
      onSpoofingDetected={() => console.log('Spoofing detected')}
    >
      <VaultScreenContent {...props} />
    </VitalizedGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 30 },
  logo: { fontSize: 48, color: '#00D4AA', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  totalCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 30, padding: 24, borderRadius: 16, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#8B92B0', marginBottom: 8 },
  totalAmount: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  totalSubtext: { fontSize: 14, color: '#8B92B0' },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  balanceCard: { backgroundColor: '#1E2749', padding: 20, borderRadius: 12, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  balanceLabel: { fontSize: 16, color: '#8B92B0' },
  balanceAmount: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  balanceNaira: { fontSize: 14, color: '#00D4AA' },
  lockedNote: { fontSize: 12, color: '#8B92B0', marginTop: 4 },
  actions: { marginHorizontal: 20, marginBottom: 24 },
  actionButton: { backgroundColor: '#1E2749', paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  actionButtonPrimary: { backgroundColor: '#00D4AA' },
  actionButtonHealth: { backgroundColor: '#FF6B35' },
  actionButtonSentinel: { backgroundColor: '#8B5CF6' },
  actionButtonBorderCross: { backgroundColor: '#0066CC' },
  actionButtonWitness: { backgroundColor: '#DC2626' },
  actionButtonExile: { backgroundColor: '#F59E0B' },
  actionButtonSovryn: { backgroundColor: '#10B981' },
  actionButtonUnified: { backgroundColor: '#FFD700' },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  infoBox: { marginHorizontal: 20, marginBottom: 40, padding: 20, backgroundColor: '#1E2749', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B92B0', lineHeight: 22 },
});

