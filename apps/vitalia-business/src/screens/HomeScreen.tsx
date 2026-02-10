/**
 * Home Screen - Vitalia Business
 * 
 * Agent dashboard with quick actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Ѵ</Text>
        <Text style={styles.title}>Vitalia Business</Text>
        <Text style={styles.subtitle}>Agent Dashboard</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Registrations Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₦0</Text>
          <Text style={styles.statLabel}>Commission Earned</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardPrimary]}
          onPress={() => navigation.navigate('AssistedRegistration')}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionTitle}>Assisted Registration</Text>
          <Text style={styles.actionDescription}>
            Register new customer and mint VIDA
          </Text>
          <Text style={styles.actionCommission}>Commission: ₦500</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('LiquidityProvider')}
        >
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionTitle}>Liquidity Provider</Text>
          <Text style={styles.actionDescription}>
            Pay out cash for nVIDA
          </Text>
          <Text style={styles.actionCommission}>Commission: 1%</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔐 Agent Verified</Text>
        <Text style={styles.infoText}>
          You are authorized to onboard customers and provide liquidity.{'\n\n'}
          All transactions are recorded on the Sovereign Chain.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 30 },
  logo: { fontSize: 48, color: '#FF6B35', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#1E2749', padding: 20, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#00D4AA', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8B92B0', textAlign: 'center' },
  actions: { paddingHorizontal: 20, marginBottom: 30 },
  actionsTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  actionCard: { backgroundColor: '#1E2749', padding: 24, borderRadius: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#8B92B0' },
  actionCardPrimary: { borderLeftColor: '#FF6B35' },
  actionIcon: { fontSize: 40, marginBottom: 12 },
  actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  actionDescription: { fontSize: 14, color: '#8B92B0', marginBottom: 12, lineHeight: 20 },
  actionCommission: { fontSize: 14, color: '#00D4AA', fontWeight: '600' },
  infoBox: { marginHorizontal: 20, marginBottom: 40, padding: 20, backgroundColor: '#1E2749', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B92B0', lineHeight: 22 },
});

