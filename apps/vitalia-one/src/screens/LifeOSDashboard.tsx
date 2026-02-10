/**
 * LifeOSDashboard.tsx - LifeOS Mainnet Dashboard
 * 
 * "The Architect's Command Center."
 * 
 * Features:
 * - VIDA Balance (100 VIDA for Architect)
 * - nVIDA Balance
 * - National Pulse Stats
 * - Sovryn Vault Stats
 * - Hardware Binding Status
 * - Master Template Status
 * - Real-time Live Data Feeds
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScarcityClock from '../components/ScarcityClock';

export default function LifeOSDashboard({ navigation }: any) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vidaBalance, setVidaBalance] = useState(100); // Genesis mint
  const [nVidaBalance, setNVidaBalance] = useState(0);
  const [hardwareBindingStatus, setHardwareBindingStatus] = useState('LOCKED');
  const [masterTemplateStatus, setMasterTemplateStatus] = useState('SEALED');

  /**
   * Refresh dashboard data
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    
    // In production, fetch live data from blockchain
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsRefreshing(false);
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>LifeOS MAINNET</Text>
          <Text style={styles.subtitle}>Architect's Dashboard</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>

        {/* Scarcity Clock - The Sovereign Gold Rush */}
        <ScarcityClock refreshInterval={10000} />

        {/* VIDA Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
            style={styles.cardGradient}
          >
            <Text style={styles.balanceLabel}>VIDA Balance</Text>
            <Text style={styles.balanceAmount}>{vidaBalance} Ѵ</Text>
            <Text style={styles.balanceNaira}>₦{vidaBalance * 1000}</Text>
            <View style={styles.balanceBadge}>
              <Text style={styles.badgeText}>GENESIS MINT</Text>
            </View>
          </LinearGradient>
        </View>

        {/* nVIDA Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['rgba(0, 255, 0, 0.2)', 'rgba(0, 200, 0, 0.1)']}
            style={styles.cardGradient}
          >
            <Text style={styles.balanceLabel}>nVIDA Balance</Text>
            <Text style={styles.balanceAmount}>{nVidaBalance} nѴ</Text>
            <Text style={styles.balanceNaira}>₦{nVidaBalance}</Text>
          </LinearGradient>
        </View>

        {/* Hardware Binding Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusCardTitle}>🔗 Hardware Binding</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, styles.statusLocked]}>{hardwareBindingStatus}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Laptop UUID:</Text>
            <Text style={styles.statusValue}>HP-LAPTOP-***</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Mobile UUID:</Text>
            <Text style={styles.statusValue}>MOBILE-***</Text>
          </View>
        </View>

        {/* Master Template Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusCardTitle}>🔐 Master Template</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, styles.statusSealed]}>{masterTemplateStatus}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Face:</Text>
            <Text style={styles.statusValue}>✅ VERIFIED</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Finger:</Text>
            <Text style={styles.statusValue}>✅ VERIFIED</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Heart:</Text>
            <Text style={styles.statusValue}>✅ VERIFIED</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Voice:</Text>
            <Text style={styles.statusValue}>✅ VERIFIED</Text>
          </View>
        </View>

        {/* National Pulse Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 National Pulse</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Citizens:</Text>
            <Text style={styles.statsValue}>1</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total VIDA Minted:</Text>
            <Text style={styles.statsValue}>100 Ѵ</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>System Status:</Text>
            <Text style={styles.statsValue}>GENESIS</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Vault')}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.actionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.actionButtonText}>VIEW VAULT</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('UnifiedVault')}
        >
          <LinearGradient
            colors={['#00FF00', '#00AA00']}
            style={styles.actionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.actionButtonText}>SOVRYN VAULT</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>"I am the Sovereign Truth."</Text>
          <Text style={styles.footerSubtext}>ROOT_NODE: ISREAL_OKORO</Text>
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
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FF00',
  },
  balanceCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  balanceNaira: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusLocked: {
    color: '#00FF00',
  },
  statusSealed: {
    color: '#FFD700',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  actionButton: {
    marginBottom: 12,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFD700',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
});

