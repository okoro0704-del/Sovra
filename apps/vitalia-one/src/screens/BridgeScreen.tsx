/**
 * Bridge Screen - Buy/Sell VIDA
 * 
 * Protected by VitalizedGate HOC
 * Simplified UI for non-crypto users
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { VitalizedGate } from '@vitalia/pff-engine/src/VitalizedGate';

function BridgeScreenContent({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'buy' | 'sell'>('sell');

  const handleTransaction = () => {
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      mode === 'sell' ? 'Sell VIDA' : 'Buy VIDA',
      `${mode === 'sell' ? 'Sell' : 'Buy'} ${amountNum} VIDA for ₦${amountNum * 1000}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executeTransaction(amountNum) },
      ]
    );
  };

  const executeTransaction = async (amountNum: number) => {
    // In production, call P2P Engine
    await new Promise((resolve) => setTimeout(resolve, 1000));

    Alert.alert(
      'Transaction Complete!',
      `Successfully ${mode === 'sell' ? 'sold' : 'bought'} ${amountNum} VIDA`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>The Bridge</Text>
        <Text style={styles.subtitle}>Buy or sell VIDA instantly</Text>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'sell' && styles.modeButtonActive]}
          onPress={() => setMode('sell')}
        >
          <Text style={[styles.modeButtonText, mode === 'sell' && styles.modeButtonTextActive]}>
            Sell VIDA
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'buy' && styles.modeButtonActive]}
          onPress={() => setMode('buy')}
        >
          <Text style={[styles.modeButtonText, mode === 'buy' && styles.modeButtonTextActive]}>
            Buy VIDA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Amount (VIDA)</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>Ѵ</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#8B92B0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
        {amount && !isNaN(parseFloat(amount)) && (
          <Text style={styles.conversionText}>
            ≈ ₦{(parseFloat(amount) * 1000).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Quick Amounts */}
      <View style={styles.quickAmounts}>
        <TouchableOpacity style={styles.quickButton} onPress={() => setAmount('1')}>
          <Text style={styles.quickButtonText}>1 Ѵ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => setAmount('5')}>
          <Text style={styles.quickButtonText}>5 Ѵ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => setAmount('10')}>
          <Text style={styles.quickButtonText}>10 Ѵ</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Button */}
      <TouchableOpacity style={styles.transactionButton} onPress={handleTransaction}>
        <Text style={styles.transactionButtonText}>
          {mode === 'sell' ? 'Sell Now' : 'Buy Now'}
        </Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>⚡ Instant Settlement</Text>
        <Text style={styles.infoText}>
          Transactions settle in less than 1 second.{'\n'}
          No gas fees. No slippage. Just instant.
        </Text>
      </View>
    </View>
  );
}

/**
 * Bridge Screen wrapped with VitalizedGate
 */
export default function BridgeScreen(props: any) {
  return (
    <VitalizedGate>
      <BridgeScreenContent {...props} />
    </VitalizedGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27', paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 30 },
  backButton: { fontSize: 16, color: '#FF6B35', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  modeToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 30, backgroundColor: '#1E2749', borderRadius: 12, padding: 4 },
  modeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: '#00D4AA' },
  modeButtonText: { fontSize: 16, color: '#8B92B0', fontWeight: '600' },
  modeButtonTextActive: { color: '#FFFFFF' },
  inputSection: { paddingHorizontal: 20, marginBottom: 24 },
  inputLabel: { fontSize: 14, color: '#8B92B0', marginBottom: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E2749', borderRadius: 12, paddingHorizontal: 20 },
  currencySymbol: { fontSize: 24, color: '#00D4AA', marginRight: 8 },
  input: { flex: 1, fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', paddingVertical: 16 },
  conversionText: { fontSize: 16, color: '#00D4AA', marginTop: 8, textAlign: 'right' },
  quickAmounts: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 30 },
  quickButton: { flex: 1, backgroundColor: '#1E2749', marginHorizontal: 4, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  quickButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  transactionButton: { backgroundColor: '#00D4AA', marginHorizontal: 20, paddingVertical: 18, borderRadius: 12, marginBottom: 30 },
  transactionButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  infoBox: { marginHorizontal: 20, padding: 20, backgroundColor: '#1E2749', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#00D4AA' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B92B0', lineHeight: 22 },
});

