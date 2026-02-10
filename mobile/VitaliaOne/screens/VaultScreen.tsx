/**
 * Vault Screen - VIDA/nVIDA Balance Dashboard
 * 
 * Features:
 * - Display VIDA balance (in Naira value)
 * - Display nVIDA balance
 * - Quick actions: Buy, Sell, Send
 * - Transaction history
 * 
 * "Your sovereign vault. Your wealth."
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { viewNairaValue, getTransactionHistory, formatNaira } from '../../../api/SimpleWallet';

interface VaultScreenProps {
  navigation: any;
  userData: any;
}

export default function VaultScreen({ navigation, userData }: VaultScreenProps) {
  const [balance, setBalance] = useState({ nairaValue: 0, vidaAmount: 0, lastUpdated: '' });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBalanceAndHistory();
  }, []);

  /**
   * Load balance and transaction history
   */
  const loadBalanceAndHistory = async () => {
    try {
      const phoneNumber = userData?.phoneNumber || '+234-800-000-0000';
      
      const balanceData = await viewNairaValue(phoneNumber);
      setBalance(balanceData);

      const historyData = await getTransactionHistory(phoneNumber, 10);
      setTransactions(historyData);
    } catch (error) {
      console.error('[VaultScreen] Load failed:', error);
    }
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadBalanceAndHistory();
    setRefreshing(false);
  };

  /**
   * Navigate to Bridge
   */
  const navigateToBridge = () => {
    navigation.navigate('Bridge');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4AA" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>The Vault</Text>
        <Text style={styles.subtitle}>Your Sovereign Wealth</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatNaira(balance.nairaValue)}</Text>
        <Text style={styles.balanceUpdated}>Updated: {balance.lastUpdated}</Text>

        {/* VIDA Breakdown */}
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>VIDA</Text>
            <Text style={styles.breakdownValue}>{balance.vidaAmount.toFixed(2)} Ѵ</Text>
            <Text style={styles.breakdownNaira}>{formatNaira(balance.vidaAmount * 1000)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>nVIDA</Text>
            <Text style={styles.breakdownValue}>{formatNaira(0)}</Text>
            <Text style={styles.breakdownNaira}>Stable</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToBridge}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionText}>Buy VIDA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={navigateToBridge}>
          <Text style={styles.actionIcon}>💸</Text>
          <Text style={styles.actionText}>Sell VIDA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📱</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Activity</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map((tx, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>{getTransactionIcon(tx.type)}</Text>
                <View>
                  <Text style={styles.transactionDescription}>{tx.description}</Text>
                  <Text style={styles.transactionDate}>{tx.date}</Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, { color: getAmountColor(tx.type) }]}>
                {tx.type === 'SENT' ? '-' : '+'}{formatNaira(Math.abs(tx.amount))}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🔐 Sovereign. ✅ Verified. ⚡ Biological.</Text>
      </View>
    </ScrollView>
  );
}

// ============ HELPER FUNCTIONS ============

function getTransactionIcon(type: string): string {
  switch (type) {
    case 'RECEIVED': return '📥';
    case 'SENT': return '📤';
    case 'SOLD': return '💸';
    default: return '💰';
  }
}

function getAmountColor(type: string): string {
  return type === 'SENT' ? '#FF4444' : '#00D4AA';
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B92B0',
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8B92B0',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 8,
  },
  balanceUpdated: {
    fontSize: 12,
    color: '#8B92B0',
  },
  breakdown: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A3458',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#2A3458',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#8B92B0',
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  breakdownNaira: {
    fontSize: 12,
    color: '#8B92B0',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1E2749',
    marginHorizontal: 5,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  historyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8B92B0',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E2749',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#8B92B0',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8B92B0',
  },
});

export default VaultScreen;

