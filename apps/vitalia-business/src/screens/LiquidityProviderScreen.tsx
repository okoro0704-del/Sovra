/**
 * Liquidity Provider Screen
 * 
 * Agent pays out cash for nVIDA
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';

export default function LiquidityProviderScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');

  const processPayout = () => {
    const amountNum = parseFloat(amount);
    
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter customer phone number');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter valid amount');
      return;
    }

    const commission = amountNum * 0.01;

    Alert.alert(
      'Confirm Payout',
      `Pay out ₦${amountNum.toLocaleString()} in cash?\n\nYour commission: ₦${commission.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executePayout(amountNum, commission) },
      ]
    );
  };

  const executePayout = async (amountNum: number, commission: number) => {
    // In production, transfer nVIDA
    await new Promise((resolve) => setTimeout(resolve, 1000));

    Alert.alert(
      'Payout Complete!',
      `Cash paid: ₦${amountNum.toLocaleString()}\nYour commission: ₦${commission.toLocaleString()}`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Liquidity Provider</Text>
        <Text style={styles.subtitle}>Pay out cash for nVIDA</Text>
      </View>

      <View style={styles.inputSection}>
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

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Cash Amount (₦)</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#8B92B0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
        {amount && !isNaN(parseFloat(amount)) && (
          <Text style={styles.commissionText}>
            Your commission: ₦{(parseFloat(amount) * 0.01).toLocaleString()}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.payoutButton} onPress={processPayout}>
        <Text style={styles.payoutButtonText}>Process Payout</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💰 How It Works</Text>
        <Text style={styles.infoText}>
          1. Enter customer phone number{'\n'}
          2. Enter cash amount to pay out{'\n'}
          3. System transfers nVIDA from customer{'\n'}
          4. Hand over physical cash{'\n'}
          5. You earn 1% commission
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27', paddingTop: 60, paddingHorizontal: 20 },
  header: { marginBottom: 40 },
  backButton: { fontSize: 16, color: '#FF6B35', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  inputSection: { marginBottom: 24 },
  inputLabel: { fontSize: 14, color: '#8B92B0', marginBottom: 12 },
  input: { backgroundColor: '#1E2749', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, color: '#FFFFFF' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E2749', borderRadius: 12, paddingHorizontal: 20 },
  currencySymbol: { fontSize: 24, color: '#FF6B35', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', paddingVertical: 16 },
  commissionText: { fontSize: 14, color: '#00D4AA', marginTop: 8, textAlign: 'right' },
  payoutButton: { backgroundColor: '#00D4AA', paddingVertical: 18, borderRadius: 12, marginBottom: 30 },
  payoutButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  infoBox: { padding: 20, backgroundColor: '#1E2749', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B92B0', lineHeight: 22 },
});

