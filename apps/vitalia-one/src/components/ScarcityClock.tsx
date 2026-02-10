/**
 * ScarcityClock.tsx - The Sovereign Gold Rush Countdown
 * 
 * "The clock is ticking. The 10-unit era won't last forever."
 * 
 * This component displays the Scarcity Clock on the LifeOS Dashboard,
 * showing how many 10-unit slots remain before the Great Burn triggers
 * the permanent drop to 2-unit minting.
 * 
 * Features:
 * - Real-time countdown of remaining 10-unit slots
 * - Progress bar to 5B threshold
 * - Estimated time to Great Burn
 * - Visual urgency indicators
 * - Market cap display
 * - Burn progress tracking
 * 
 * Born in Lagos, Nigeria. Built for The Architect's Urgency.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'expo-linear-gradient';

// ============ TYPES ============

interface ScarcityClockData {
  remaining10UnitSlots: number;
  percentToThreshold: number;
  estimatedTimeToGreatBurn: number;
  isGreatBurnTriggered: boolean;
  currentSupply: string;
  marketCapUSD: string;
  burnProgress: {
    currentSupply: string;
    targetSupply: string;
    excessSupply: string;
    percentToEquilibrium: number;
  };
}

interface ScarcityClockProps {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

// ============ COMPONENT ============

export default function ScarcityClock({ refreshInterval = 10000 }: ScarcityClockProps) {
  const [data, setData] = useState<ScarcityClockData | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for urgency
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Fetch scarcity clock data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In production, call VidaCapGodcurrency contract
        // For now, simulate data
        const mockData: ScarcityClockData = {
          remaining10UnitSlots: 499_999_900, // ~500M slots remaining
          percentToThreshold: 0.02, // 0.02% to 5B
          estimatedTimeToGreatBurn: 499_999_900, // blocks
          isGreatBurnTriggered: false,
          currentSupply: '1000000', // 1M VIDA Cap
          marketCapUSD: '1000000000', // $1B
          burnProgress: {
            currentSupply: '1000000',
            targetSupply: '100000', // 100K citizens
            excessSupply: '900000',
            percentToEquilibrium: 5,
          },
        };
        setData(mockData);
      } catch (error) {
        console.error('[SCARCITY CLOCK] Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading Scarcity Clock...</Text>
      </View>
    );
  }

  const urgencyLevel = getUrgencyLevel(data.percentToThreshold);
  const urgencyColor = getUrgencyColor(urgencyLevel);

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⏰ SCARCITY CLOCK</Text>
        <Text style={styles.subtitle}>The Sovereign Gold Rush</Text>
      </View>

      {/* Main Display */}
      {!data.isGreatBurnTriggered ? (
        <>
          {/* Remaining Slots */}
          <Animated.View style={[styles.mainCard, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.label}>10-UNIT SLOTS REMAINING</Text>
            <Text style={[styles.bigNumber, { color: urgencyColor }]}>
              {formatNumber(data.remaining10UnitSlots)}
            </Text>
            <Text style={styles.description}>
              Register now to claim 10 VIDA Cap (5 for you / 5 for Nation)
            </Text>
          </Animated.View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress to 5B Threshold</Text>
              <Text style={styles.progressPercent}>{data.percentToThreshold.toFixed(2)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#48dbfb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.min(data.percentToThreshold, 100)}%` }]}
              />
            </View>
          </View>

          {/* Estimated Time */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Estimated Blocks to Great Burn</Text>
            <Text style={styles.infoValue}>{formatNumber(data.estimatedTimeToGreatBurn)}</Text>
          </View>

          {/* Urgency Warning */}
          <View style={[styles.warningCard, { borderColor: urgencyColor }]}>
            <Text style={[styles.warningText, { color: urgencyColor }]}>
              {getUrgencyMessage(urgencyLevel)}
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* Great Burn Triggered */}
          <View style={styles.burnTriggeredCard}>
            <Text style={styles.burnTriggeredTitle}>🔥 GREAT BURN TRIGGERED</Text>
            <Text style={styles.burnTriggeredText}>
              The 5B threshold has been reached.
            </Text>
            <Text style={styles.burnTriggeredText}>
              New mints: 2 VIDA Cap (1 Citizen / 1 Nation)
            </Text>
          </View>
        </>
      )}

      {/* Market Cap */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Supply</Text>
          <Text style={styles.statValue}>{formatNumber(parseInt(data.currentSupply))} VCAP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Market Cap</Text>
          <Text style={styles.statValue}>${formatNumber(parseInt(data.marketCapUSD))}</Text>
        </View>
      </View>

      {/* Burn Progress */}
      <View style={styles.burnProgressCard}>
        <Text style={styles.burnProgressTitle}>🔥 Burn-to-One Progress</Text>
        <View style={styles.burnProgressBar}>
          <View
            style={[
              styles.burnProgressFill,
              { width: `${data.burnProgress.percentToEquilibrium}%` },
            ]}
          />
        </View>
        <Text style={styles.burnProgressText}>
          {data.burnProgress.percentToEquilibrium.toFixed(1)}% to Equilibrium
        </Text>
        <Text style={styles.burnProgressSubtext}>
          Target: 1 VIDA Cap per verified citizen
        </Text>
      </View>
    </LinearGradient>
  );
}

// ============ HELPER FUNCTIONS ============

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toLocaleString();
}

function getUrgencyLevel(percentToThreshold: number): 'low' | 'medium' | 'high' | 'critical' {
  if (percentToThreshold < 25) return 'low';
  if (percentToThreshold < 50) return 'medium';
  if (percentToThreshold < 75) return 'high';
  return 'critical';
}

function getUrgencyColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low':
      return '#48dbfb'; // Blue
    case 'medium':
      return '#feca57'; // Yellow
    case 'high':
      return '#ff9ff3'; // Pink
    case 'critical':
      return '#ff6b6b'; // Red
  }
}

function getUrgencyMessage(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low':
      return '✅ Plenty of 10-unit slots available. Register at your convenience.';
    case 'medium':
      return '⚠️ 10-unit slots are filling up. Register soon to maximize your allocation.';
    case 'high':
      return '🔥 10-unit slots running low! Register now before the Great Burn.';
    case 'critical':
      return '🚨 FINAL CALL! 10-unit era ending soon. Register NOW or get only 2 units!';
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    letterSpacing: 1,
    marginBottom: 10,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#fff',
  },
  progressPercent: {
    fontSize: 14,
    color: '#48dbfb',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  burnTriggeredCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  burnTriggeredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 15,
  },
  burnTriggeredText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  burnProgressCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  burnProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
  },
  burnProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  burnProgressFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
  },
  burnProgressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  burnProgressSubtext: {
    fontSize: 12,
    color: '#aaa',
  },
});

