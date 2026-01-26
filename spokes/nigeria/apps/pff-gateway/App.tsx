import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { hashPFF } from '@sovrn/shared';

export default function App() {
  const [challengeToken, setChallengeToken] = useState<string>('');
  const [biometricData, setBiometricData] = useState<string>('');

  const handleBiometricCapture = async () => {
    try {
      // Check if device supports biometric authentication
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Error', 'Biometric authentication is not available on this device');
        return;
      }

      // Check available authentication types
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('Supported auth types:', types);

      // Authenticate using biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to verify your identity',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // In a real implementation, capture actual biometric data
        // For now, we'll simulate with a hash
        const simulatedBiometric = `biometric_${Date.now()}_${Math.random()}`;
        const hashedBiometric = hashPFF(simulatedBiometric);
        setBiometricData(hashedBiometric);
        Alert.alert('Success', 'Biometric data captured and hashed');
      } else {
        Alert.alert('Cancelled', 'Biometric authentication was cancelled');
      }
    } catch (error) {
      console.error('Biometric capture error:', error);
      Alert.alert('Error', 'Failed to capture biometric data');
    }
  };

  const handleSubmitConsent = () => {
    if (!challengeToken || !biometricData) {
      Alert.alert('Error', 'Please capture biometric data first');
      return;
    }

    // In a real implementation, send to API
    Alert.alert('Success', 'Consent submitted successfully');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>SOVRN PFF Gateway</Text>
      <Text style={styles.subtitle}>Identity Capture & Verification</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Challenge Token:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter challenge token from API"
          value={challengeToken}
          onChangeText={setChallengeToken}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Button
          title="Capture Biometric Data"
          onPress={handleBiometricCapture}
          color="#007AFF"
        />
        {biometricData ? (
          <Text style={styles.successText}>✓ Biometric data captured</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Button
          title="Submit Consent"
          onPress={handleSubmitConsent}
          disabled={!biometricData || !challengeToken}
          color="#34C759"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  successText: {
    marginTop: 8,
    color: '#34C759',
    fontSize: 14,
  },
});
