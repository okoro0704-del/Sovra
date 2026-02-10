/**
 * Liquidity Provider Screen
 * 
 * Agent pays out physical cash in exchange for nVIDA:
 * 1. Customer provides phone number
 * 2. Agent enters cash amount to pay out
 * 3. System transfers nVIDA from customer to agent
 * 4. Agent hands over physical cash
 * 5. Agent receives commission
 * 
 * "Cash in hand. nVIDA in wallet. Instant."
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { viewNairaValue, formatNaira } from '../../../api/SimpleWallet';

interface LiquidityProviderScreenProps {
  navigation: any;
  agentData: any;
}

export default function LiquidityProviderScreen({ navigation, agentData }: LiquidityProviderScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Check customer balance
   */
  const checkCustomerBalance = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    try {
      const balance = await viewNairaValue(phoneNumber);
      setCustomerBalance(balance);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch customer balance');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Process cash payout
   */
  const processCashPayout = async () => {
    const amount = parseFloat(cashAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash amount');
      return;
    }

    if (!customerBalance) {
      Alert.alert('Error', 'Please check customer balance first');
      return;
    }

    if (amount > customerBalance.nairaValue) {
      Alert.alert(
        'Insufficient Balance',
        `Customer only has ${formatNaira(customerBalance.nairaValue)}`
      );
      return;
    }

    // Confirm transaction
    Alert.alert(
      'Confirm Cash Payout',
      `Pay out ${formatNaira(amount)} in cash?\n\n` +
      `Customer: ${phoneNumber}\n` +
      `Your commission: ${formatNaira(amount * 0.01)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executePayou(amount) },
      ]
    );
  };

  /**
   * Execute payout
   */
  const executePayout = async (amount: number) => {
    setIsProcessing(true);

    try {
      // In production, call backend API to transfer nVIDA
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const commission = amount * 0.01; // 1% commission

      Alert.alert(
        'Payout Complete!',
        `Transaction successful!\n\n` +
        `Cash paid: ${formatNaira(amount)}\n` +
        `Your commission: ${formatNaira(commission)}\n\n` +
        `Please hand over the cash to the customer.`,
        [
          {
            text: 'New Transaction',
            onPress: () => {
              setPhoneNumber('');
              setCashAmount('');
              setCustomerBalance(null);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Liquidity Provider</Text>
        <Text style={styles.subtitle}>Agent: {agentData?.agentName}</Text>
      </View>

      {/* Customer Phone Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Customer Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Customer Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+234-800-000-0000"
            placeholderTextColor="#8B92B0"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkCustomerBalance}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.checkButtonText}>Check Balance</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer Balance */}
      {customerBalance && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Customer Balance</Text>
          <Text style={styles.balanceAmount}>{formatNaira(customerBalance.nairaValue)}</Text>
          <Text style={styles.balanceUpdated}>Updated: {customerBalance.lastUpdated}</Text>
        </View>
      )}

      {/* Cash Amount Input */}
      {customerBalance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Cash Payout Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount to Pay Out (Cash)</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#8B92B0"
                keyboardType="numeric"
                value={cashAmount}
                onChangeText={setCashAmount}
              />
            </View>
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            <TouchableOpacity style={styles.quickButton} onPress={() => setCashAmount('5000')}>
              <Text style={styles.quickButtonText}>₦5,000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => setCashAmount('10000')}>
              <Text style={styles.quickButtonText}>₦10,000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => setCashAmount('20000')}>
              <Text style={styles.quickButtonText}>₦20,000</Text>
            </TouchableOpacity>
          </View>

          {/* Commission Preview */}
          {cashAmount && !isNaN(parseFloat(cashAmount)) && (
            <View style={styles.commissionPreview}>
              <Text style={styles.commissionText}>
                Your commission: {formatNaira(parseFloat(cashAmount) * 0.01)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Process Button */}
      {customerBalance && (
        <TouchableOpacity
          style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
          onPress={processCashPayout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.processButtonText}>Process Cash Payout</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💰 How It Works</Text>
        <Text style={styles.infoText}>
          1. Check customer's nVIDA balance{'\n'}
          2. Enter cash amount to pay out{'\n'}
          3. System transfers nVIDA from customer to you{'\n'}
          4. Hand over physical cash to customer{'\n'}
          5. You earn 1% commission on each transaction
        </Text>
      </View>
    </ScrollView>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    fontSize: 16,
    color: '#FF6B35',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B92B0',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B92B0',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1E2749',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
  },
  checkButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: '#1E2749',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4AA',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8B92B0',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 8,
  },
  balanceUpdated: {
    fontSize: 12,
    color: '#8B92B0',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2749',
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#FF6B35',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#1E2749',
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commissionPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#2A3458',
    borderRadius: 8,
    alignItems: 'center',
  },
  commissionText: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: 'bold',
  },
  processButton: {
    backgroundColor: '#00D4AA',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  processButtonDisabled: {
    opacity: 0.6,
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBox: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#1E2749',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8B92B0',
    lineHeight: 22,
  },
});

export default LiquidityProviderScreen;

