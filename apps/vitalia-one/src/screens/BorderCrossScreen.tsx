/**
 * BorderCrossScreen.tsx - Refugee Recovery Mode UI
 * 
 * "When borders close, the satellite opens."
 * 
 * Features:
 * - Display current location and border-cross status
 * - Show Temporary Vitalized Status
 * - Emergency vault access
 * - Satellite connection status
 * - UNHCR/NGO contact information
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { checkBorderCrossStatus, RefugeeStatus } from '@vitalia/contracts';

interface BorderCrossScreenProps {
  navigation: any;
  route: any;
}

export default function BorderCrossScreen({ navigation, route }: BorderCrossScreenProps) {
  const [refugeeStatus, setRefugeeStatus] = useState<RefugeeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user data (in production, get from auth context)
  const mockUID = 'VITALIZED_UID_12345';
  const mockHomeCountry = 'Nigeria';

  useEffect(() => {
    checkBorderStatus();
  }, []);

  const checkBorderStatus = async () => {
    setLoading(true);

    try {
      // Get current location (in production, use react-native-geolocation)
      const mockLocation = {
        latitude: 9.0820, // Abuja, Nigeria (inside home country)
        longitude: 7.5324,
      };

      // Simulate border cross for demo
      const borderCrossLocation = {
        latitude: 9.5, // Cameroon (outside home country)
        longitude: 13.0,
      };

      const status = await checkBorderCrossStatus(
        mockUID,
        mockHomeCountry,
        borderCrossLocation // Use borderCrossLocation to simulate refugee scenario
      );

      setRefugeeStatus(status);
    } catch (error) {
      console.error('[BORDER-CROSS] Error checking status:', error);
      Alert.alert('Error', 'Failed to check border-cross status');
    } finally {
      setLoading(false);
    }
  };

  const accessEmergencyVault = () => {
    if (!refugeeStatus?.emergencyVaultAccess.accessible) {
      Alert.alert('Not Available', 'Emergency vault access is not available');
      return;
    }

    Alert.alert(
      '🆘 Emergency Vault Access',
      `You have access to ${refugeeStatus.emergencyVaultAccess.liquid_vida} VIDA.\n\nThis is your sovereign wealth. Use it for:\n• Food and water\n• Shelter\n• Medical care\n• Safe passage\n\nYour identity cannot be erased.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Access Vault',
          onPress: () => {
            // In production, navigate to vault screen with emergency mode
            navigation.navigate('Vault', { emergencyMode: true });
          },
        },
      ]
    );
  };

  const contactUNHCR = () => {
    Alert.alert(
      '🆘 UNHCR Contact',
      'United Nations High Commissioner for Refugees\n\nEmergency Hotline: +41 22 739 8111\nEmail: hqpr00@unhcr.org\n\nLocal Office: [Based on current location]',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking border-cross status...</Text>
      </View>
    );
  }

  if (!refugeeStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load status</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛰️ Border-Cross Status</Text>
        <Text style={styles.subtitle}>"When borders close, the satellite opens."</Text>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Home Country:</Text>
          <Text style={styles.value}>{refugeeStatus.homeCountry}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Current Location:</Text>
          <Text style={styles.value}>{refugeeStatus.currentLocation.country}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Outside Home:</Text>
          <Text style={[styles.value, refugeeStatus.isOutsideHomeGeofence && styles.alertText]}>
            {refugeeStatus.isOutsideHomeGeofence ? '⚠️ YES' : '✅ NO'}
          </Text>
        </View>
      </View>

      {/* Refugee Status Card (only if outside home) */}
      {refugeeStatus.isOutsideHomeGeofence && (
        <>
          <View style={[styles.card, styles.refugeeCard]}>
            <Text style={styles.cardTitle}>🆘 Refugee Recovery Mode</Text>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Temporary Vitalized Status:</Text>
              <Text style={[styles.value, styles.successText]}>
                {refugeeStatus.temporaryVitalizedStatus ? '✅ ACTIVE' : '❌ INACTIVE'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Satellite Connected:</Text>
              <Text style={[styles.value, styles.successText]}>
                {refugeeStatus.satelliteConnected ? '✅ CONNECTED' : '❌ DISCONNECTED'}
              </Text>
            </View>

            {refugeeStatus.connectedSatellite && (
              <View style={styles.statusRow}>
                <Text style={styles.label}>Connected Satellite:</Text>
                <Text style={styles.valueSmall}>{refugeeStatus.connectedSatellite}</Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Text style={styles.label}>Emergency Vault:</Text>
              <Text style={[styles.value, styles.successText]}>
                {refugeeStatus.emergencyVaultAccess.liquid_vida} VIDA
              </Text>
            </View>

            {refugeeStatus.emergencyVaultAccess.expiresAt > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.label}>Access Expires:</Text>
                <Text style={styles.valueSmall}>
                  {new Date(refugeeStatus.emergencyVaultAccess.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Emergency Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.emergencyButton]}
              onPress={accessEmergencyVault}
            >
              <Text style={styles.actionButtonText}>🆘 Access Emergency Vault</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.unhcrButton]} onPress={contactUNHCR}>
              <Text style={styles.actionButtonText}>📞 Contact UNHCR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.refreshButton]}
              onPress={checkBorderStatus}
            >
              <Text style={styles.actionButtonText}>🔄 Refresh Status</Text>
            </TouchableOpacity>
          </View>

          {/* Information */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ Your Rights as a Refugee</Text>
            <Text style={styles.infoText}>
              • Your identity is preserved via satellite{'\n'}
              • Your wealth is accessible in any country{'\n'}
              • Your heartbeat is your passport{'\n'}
              • No government can erase you{'\n'}
              • Temporary status valid for 90 days{'\n'}
              • Contact UNHCR for legal protection
            </Text>
          </View>
        </>
      )}

      {/* Normal Status (inside home country) */}
      {!refugeeStatus.isOutsideHomeGeofence && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ You are in your home country</Text>
          <Text style={styles.infoText}>
            Border-Cross mode is only activated when you are outside your home country.
            {'\n\n'}
            If you need to flee due to war or conflict, the satellite will automatically grant you
            Temporary Vitalized Status and emergency vault access.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B9DC3', fontStyle: 'italic' },

  card: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  refugeeCard: { borderColor: '#FF6B35', borderWidth: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 14, color: '#8B9DC3' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  valueSmall: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', maxWidth: '50%', textAlign: 'right' },
  alertText: { color: '#FF6B35' },
  successText: { color: '#00D4AA' },

  actions: { marginHorizontal: 20, marginBottom: 24 },
  actionButton: { paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  emergencyButton: { backgroundColor: '#FF0000' },
  unhcrButton: { backgroundColor: '#0066CC' },
  refreshButton: { backgroundColor: '#1E2749' },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  infoCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 24, padding: 20, borderRadius: 12 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#8B9DC3', lineHeight: 22 },

  loadingText: { fontSize: 16, color: '#8B9DC3', textAlign: 'center', marginTop: 100 },
  errorText: { fontSize: 16, color: '#FF6B35', textAlign: 'center', marginTop: 100 },
});

