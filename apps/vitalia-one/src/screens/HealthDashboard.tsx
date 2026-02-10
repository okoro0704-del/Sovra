/**
 * HealthDashboard.tsx
 * 
 * The Lifespan Clock
 * 
 * Features:
 * - 'Days of Life Extended' (based on PFF trends)
 * - 'Medical Coverage: Universal'
 * - Health-Stake contribution tracking
 * - Coverage verification for hospitals
 * 
 * "Your heartbeat funds your healthcare. Automatically."
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { VitalizedGate } from '@vitalia/pff-engine/src/VitalizedGate';

// ============ TYPES ============

interface HealthStats {
  coverageStatus: 'ACTIVE' | 'INACTIVE' | 'EMERGENCY';
  monthlyContribution: number;      // nVIDA deducted monthly
  totalContributed: number;         // Total nVIDA contributed
  coverageStartDate: number;        // Timestamp
  claimsUsed: number;               // Number of medical claims
  daysOfLifeExtended: number;       // Based on PFF trends
  heartRateVariability: number;     // HRV score (0-100)
  lastPFFScan: number;              // Timestamp
}

// ============ HEALTH DASHBOARD CONTENT ============

function HealthDashboardContent({ navigation }: any) {
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthStats();
  }, []);

  const loadHealthStats = async () => {
    // In production, fetch from HealthSovereign contract
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setHealthStats({
      coverageStatus: 'ACTIVE',
      monthlyContribution: 0.5,      // 0.5 nVIDA (~₦500)
      totalContributed: 6,           // 6 nVIDA (~₦6,000)
      coverageStartDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
      claimsUsed: 0,
      daysOfLifeExtended: 127,       // Based on PFF trends
      heartRateVariability: 78,      // HRV score
      lastPFFScan: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    });

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealthStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  const coverageDays = Math.floor(
    (Date.now() - healthStats!.coverageStartDate) / (1000 * 60 * 60 * 24)
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🏥</Text>
        <Text style={styles.title}>Health Sovereign</Text>
        <Text style={styles.subtitle}>Universal Medical Coverage</Text>
      </View>

      {/* The Lifespan Clock */}
      <View style={styles.lifespanCard}>
        <Text style={styles.lifespanLabel}>THE LIFESPAN CLOCK</Text>
        <View style={styles.lifespanRow}>
          <View style={styles.lifespanStat}>
            <Text style={styles.lifespanValue}>{healthStats!.daysOfLifeExtended}</Text>
            <Text style={styles.lifespanUnit}>Days of Life Extended</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.lifespanStat}>
            <Text style={styles.lifespanValue}>{healthStats!.heartRateVariability}</Text>
            <Text style={styles.lifespanUnit}>HRV Score</Text>
          </View>
        </View>
        <Text style={styles.lifespanNote}>
          Based on your heartbeat trends and health-stake contributions
        </Text>
      </View>

      {/* Coverage Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Coverage</Text>

        <View style={styles.coverageCard}>
          <View style={styles.coverageHeader}>
            <Text style={styles.coverageStatus}>
              ✅ {healthStats!.coverageStatus}
            </Text>
            <Text style={styles.coverageBadge}>UNIVERSAL</Text>
          </View>
          <Text style={styles.coverageText}>
            You are covered for all medical emergencies and treatments.
          </Text>
          <Text style={styles.coverageDetail}>
            Coverage active for {coverageDays} days
          </Text>
        </View>
      </View>

      {/* Health-Stake Contributions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health-Stake Contributions</Text>

        <View style={styles.contributionCard}>
          <View style={styles.contributionRow}>
            <Text style={styles.contributionLabel}>Monthly Contribution</Text>
            <Text style={styles.contributionValue}>
              {healthStats!.monthlyContribution} nVIDA
            </Text>
          </View>
          <Text style={styles.contributionNaira}>
            ≈ ₦{(healthStats!.monthlyContribution * 1000).toLocaleString()}
          </Text>
          <Text style={styles.contributionNote}>
            Automatically deducted from your Citizen Dividend (1%)
          </Text>
        </View>

        <View style={styles.contributionCard}>
          <View style={styles.contributionRow}>
            <Text style={styles.contributionLabel}>Total Contributed</Text>
            <Text style={styles.contributionValue}>
              {healthStats!.totalContributed} nVIDA
            </Text>
          </View>
          <Text style={styles.contributionNaira}>
            ≈ ₦{(healthStats!.totalContributed * 1000).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Medical Claims */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Claims</Text>

        <View style={styles.claimsCard}>
          <Text style={styles.claimsValue}>{healthStats!.claimsUsed}</Text>
          <Text style={styles.claimsLabel}>Claims Used</Text>
          <Text style={styles.claimsNote}>
            {healthStats!.claimsUsed === 0
              ? 'No claims yet. Stay healthy! 💪'
              : 'All claims covered by Global Medical Reserve'}
          </Text>
        </View>
      </View>

      {/* Hospital Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hospital Access</Text>

        <TouchableOpacity
          style={styles.verificationButton}
          onPress={() => navigation.navigate('HospitalVerification')}
        >
          <Text style={styles.verificationButtonText}>
            Generate Verification Code
          </Text>
        </TouchableOpacity>

        <Text style={styles.verificationNote}>
          Show this code to hospitals for instant coverage verification
        </Text>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔐 Privacy Protected</Text>
        <Text style={styles.infoText}>
          Hospitals can verify your coverage using Zero-Knowledge proofs.{'\n\n'}
          Your financial details remain private.{'\n'}
          Only your coverage status is shared.
        </Text>
      </View>

      {/* How It Works */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>⚡ How It Works</Text>
        <Text style={styles.infoText}>
          1. Every month, 1% of your Citizen Dividend is automatically deducted{'\n'}
          2. Funds go to the Global Medical Reserve{'\n'}
          3. You receive universal medical coverage{'\n'}
          4. Hospitals verify coverage via your heartbeat{'\n'}
          5. No paperwork. No denials. Just care.
        </Text>
      </View>
    </ScrollView>
  );
}

// ============ HEALTH DASHBOARD (WRAPPED WITH VITALIZED GATE) ============

export default function HealthDashboard(props: any) {
  return (
    <VitalizedGate>
      <HealthDashboardContent {...props} />
    </VitalizedGate>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  loadingContainer: { flex: 1, backgroundColor: '#0A0E27', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#8B92B0', marginTop: 16 },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 30 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  lifespanCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 30, padding: 24, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#00D4AA' },
  lifespanLabel: { fontSize: 12, fontWeight: 'bold', color: '#00D4AA', marginBottom: 16, letterSpacing: 1 },
  lifespanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  lifespanStat: { flex: 1, alignItems: 'center' },
  lifespanValue: { fontSize: 48, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  lifespanUnit: { fontSize: 12, color: '#8B92B0', textAlign: 'center' },
  divider: { width: 1, height: 60, backgroundColor: '#8B92B0', marginHorizontal: 16 },
  lifespanNote: { fontSize: 12, color: '#8B92B0', textAlign: 'center', lineHeight: 18 },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  coverageCard: { backgroundColor: '#1E2749', padding: 20, borderRadius: 12 },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  coverageStatus: { fontSize: 18, fontWeight: 'bold', color: '#00D4AA' },
  coverageBadge: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#FF6B35', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  coverageText: { fontSize: 14, color: '#FFFFFF', marginBottom: 8, lineHeight: 20 },
  coverageDetail: { fontSize: 12, color: '#8B92B0' },
  contributionCard: { backgroundColor: '#1E2749', padding: 20, borderRadius: 12, marginBottom: 12 },
  contributionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  contributionLabel: { fontSize: 16, color: '#8B92B0' },
  contributionValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  contributionNaira: { fontSize: 14, color: '#00D4AA', marginBottom: 8 },
  contributionNote: { fontSize: 12, color: '#8B92B0', lineHeight: 18 },
  claimsCard: { backgroundColor: '#1E2749', padding: 24, borderRadius: 12, alignItems: 'center' },
  claimsValue: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  claimsLabel: { fontSize: 16, color: '#8B92B0', marginBottom: 12 },
  claimsNote: { fontSize: 14, color: '#FFFFFF', textAlign: 'center', lineHeight: 20 },
  verificationButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  verificationButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  verificationNote: { fontSize: 12, color: '#8B92B0', textAlign: 'center' },
  infoBox: { marginHorizontal: 20, marginBottom: 24, padding: 20, backgroundColor: '#1E2749', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B92B0', lineHeight: 22 },
});

