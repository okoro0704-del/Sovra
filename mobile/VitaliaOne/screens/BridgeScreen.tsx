/**
 * Bridge Screen - Simplified Buy/Sell VIDA
 * 
 * Features:
 * - One-tap sell VIDA for Naira
 * - Simple buy interface
 * - Instant settlement (< 1 second)
 * - NO crypto jargon
 * 
 * "The bridge between VIDA and Naira. Instant. Simple."
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
} from 'react-native';
import { easySell, formatNaira } from '../../../api/SimpleWallet';

interface BridgeScreenProps {
  navigation: any;
  userData: any;
}

export default function BridgeScreen({ navigation, userData }: BridgeScreenProps) {
  const [mode, setMode] = useState<'SELL' | 'BUY'>('SELL');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle sell VIDA
   */
  const handleSell = async () => {
    const nairaAmount = parseFloat(amount);

    if (isNaN(nairaAmount) || nairaAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const phoneNumber = userData?.phoneNumber || '+234-800-000-0000';
      const result = await easySell(phoneNumber, nairaAmount);

      if (result.success) {
        Alert.alert(
          'Success!',
          result.message,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle buy VIDA
   */
  const handleBuy = () => {
    Alert.alert('Coming Soon', 'Buy VIDA feature will be available soon.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>The Bridge</Text>
        <Text style={styles.subtitle}>Buy or Sell VIDA</Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'SELL' && styles.modeButtonActive]}
          onPress={() => setMode('SELL')}
        >
          <Text style={[styles.modeText, mode === 'SELL' && styles.modeTextActive]}>
            Sell VIDA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'BUY' && styles.modeButtonActive]}
          onPress={() => setMode('BUY')}
        >
          <Text style={[styles.modeText, mode === 'BUY' && styles.modeTextActive]}>
            Buy VIDA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {mode === 'SELL' ? 'Amount to Sell (Naira)' : 'Amount to Buy (Naira)'}
        </Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#8B92B0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Conversion Preview */}
        {amount && !isNaN(parseFloat(amount)) && (
          <View style={styles.conversionPreview}>
            <Text style={styles.conversionText}>
              ≈ {(parseFloat(amount) / 1000).toFixed(4)} VIDA
            </Text>
            <Text style={styles.conversionRate}>@ ₦1,000 per VIDA</Text>
          </View>
        )}
      </View>

      {/* Quick Amount Buttons */}
      <View style={styles.quickAmounts}>
        <TouchableOpacity style={styles.quickButton} onPress={() => setAmount('5000')}>
          <Text style={styles.quickButtonText}>₦5,000</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => setAmount('10000')}>
          <Text style={styles.quickButtonText}>₦10,000</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => setAmount('20000')}>
          <Text style={styles.quickButtonText}>₦20,000</Text>
        </TouchableOpacity>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
        onPress={mode === 'SELL' ? handleSell : handleBuy}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.actionButtonText}>
            {mode === 'SELL' ? 'Sell Now (Instant)' : 'Buy Now'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>⚡ Instant Settlement</Text>
        <Text style={styles.infoText}>
          {mode === 'SELL'
            ? 'Your Naira will be available instantly. No waiting, no fees.'
            : 'Buy VIDA instantly using your Naira balance.'}
        </Text>
      </View>
    </View>
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
    color: '#00D4AA',
    marginBottom: 20,
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
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#1E2749',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#00D4AA',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B92B0',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B92B0',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2749',
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#00D4AA',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  conversionPreview: {
    marginTop: 12,
    alignItems: 'center',
  },
  conversionText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  conversionRate: {
    fontSize: 12,
    color: '#8B92B0',
    marginTop: 4,
  },
  quickAmounts: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#1E2749',
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#00D4AA',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBox: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 20,
    backgroundColor: '#1E2749',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4AA',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8B92B0',
    lineHeight: 20,
  },
});

export default BridgeScreen;

