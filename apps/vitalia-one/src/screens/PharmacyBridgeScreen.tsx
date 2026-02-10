/**
 * PharmacyBridgeScreen.tsx - Medication Advice Display
 * 
 * Displays WHO-approved OTC medication recommendations
 * 
 * Features:
 * - Medication list with dosage instructions
 * - General health advice
 * - Prominent ZK-signed disclaimer
 * - Pharmacist consultation prompt
 * 
 * "Safety First: Always consult a licensed pharmacist."
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { getMedicationAdvice, type MedicationAdvice } from '@vitalia/contracts/src/logic/medical/PharmacyBridge';
import type { DiagnosisResult } from '@vitalia/contracts/src/logic/medical/SymptomChecker';

interface PharmacyBridgeScreenProps {
  navigation: any;
  route: {
    params: {
      diagnosisResults: DiagnosisResult[];
    };
  };
}

export default function PharmacyBridgeScreen({ navigation, route }: PharmacyBridgeScreenProps) {
  const { diagnosisResults } = route.params;
  const [medicationAdvice, setMedicationAdvice] = useState<MedicationAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Mock user data (in production, get from user profile)
  const userAge = 28;
  const userWeight = 70;

  useEffect(() => {
    loadMedicationAdvice();
  }, []);

  const loadMedicationAdvice = async () => {
    setLoading(true);

    // Get advice for the top diagnosis
    const topDiagnosis = diagnosisResults[0];

    const advice = await getMedicationAdvice({
      diagnosis: topDiagnosis,
      age: userAge,
      weight: userWeight,
      allergies: [],
      currentMedications: [],
    });

    setMedicationAdvice(advice);
    setLoading(false);

    // If high/critical urgency, show alert
    if (!advice) {
      Alert.alert(
        '⚠️ Urgent Medical Attention Required',
        `Your condition (${topDiagnosis.disease.commonName}) requires immediate evaluation by a healthcare provider. Please visit a hospital or clinic as soon as possible.`,
        [
          { text: 'Find Hospital', onPress: () => navigation.navigate('Health') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  const acceptDisclaimer = () => {
    setDisclaimerAccepted(true);
  };

  const findPharmacist = () => {
    Alert.alert(
      '🏥 Find Nearby Pharmacist',
      'This feature will help you locate licensed pharmacists in your area.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>💊 Preparing medication advice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medicationAdvice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏥 Medical Attention Required</Text>
        </View>
        <View style={styles.urgentContainer}>
          <Text style={styles.urgentIcon}>🚨</Text>
          <Text style={styles.urgentTitle}>Immediate Care Needed</Text>
          <Text style={styles.urgentMessage}>
            Your symptoms require evaluation by a healthcare provider. We cannot provide medication advice for high-risk conditions.
          </Text>
          <TouchableOpacity style={styles.urgentButton} onPress={() => navigation.navigate('Health')}>
            <Text style={styles.urgentButtonText}>🏥 Find Hospital</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💊 Medication Advice</Text>
        <Text style={styles.subtitle}>WHO-Approved OTC Recommendations</Text>
      </View>

      {!disclaimerAccepted ? (
        /* Disclaimer Screen */
        <ScrollView style={styles.content}>
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerIcon}>⚠️</Text>
            <Text style={styles.disclaimerTitle}>IMPORTANT MEDICAL DISCLAIMER</Text>
            <Text style={styles.disclaimerText}>{medicationAdvice.disclaimer}</Text>

            <View style={styles.zkSignatureBox}>
              <Text style={styles.zkLabel}>🔐 ZK-Signed Attestation</Text>
              <Text style={styles.zkSignature}>{medicationAdvice.zkSignature.slice(0, 20)}...</Text>
              <Text style={styles.zkTimestamp}>
                Generated: {new Date(medicationAdvice.timestamp).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity style={styles.acceptButton} onPress={acceptDisclaimer}>
              <Text style={styles.acceptButtonText}>✓ I Understand - Show Recommendations</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Medication Advice Screen */
        <>
          <ScrollView style={styles.content}>
            {/* Condition Info */}
            <View style={styles.conditionCard}>
              <Text style={styles.conditionName}>{medicationAdvice.condition}</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(medicationAdvice.riskLevel) }]}>
                <Text style={styles.riskText}>Risk Level: {medicationAdvice.riskLevel.toUpperCase()}</Text>
              </View>
            </View>

            {/* Medications */}
            <Text style={styles.sectionTitle}>💊 Recommended Medications</Text>
            {medicationAdvice.medications.map((med, index) => (
              <View key={index} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <View style={[styles.availabilityBadge, { backgroundColor: med.availability === 'OTC' ? '#00D4AA' : '#FF6B35' }]}>
                    <Text style={styles.availabilityText}>{med.availability}</Text>
                  </View>
                </View>
                <Text style={styles.genericName}>Generic: {med.genericName}</Text>

                <View style={styles.dosageSection}>
                  <Text style={styles.dosageLabel}>📋 Dosage</Text>
                  <Text style={styles.dosageValue}>{med.dosage}</Text>
                </View>

                <View style={styles.dosageSection}>
                  <Text style={styles.dosageLabel}>⏰ Frequency</Text>
                  <Text style={styles.dosageValue}>{med.frequency}</Text>
                </View>

                <View style={styles.dosageSection}>
                  <Text style={styles.dosageLabel}>📅 Duration</Text>
                  <Text style={styles.dosageValue}>{med.duration}</Text>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>📝 Instructions</Text>
                  <Text style={styles.instructionsText}>{med.instructions}</Text>
                </View>

                {med.contraindications.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ Contraindications</Text>
                    <Text style={styles.warningText}>
                      Do not use if you have: {med.contraindications.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* General Advice */}
            <Text style={styles.sectionTitle}>💡 General Health Advice</Text>
            <View style={styles.adviceCard}>
              {medicationAdvice.generalAdvice.map((advice, index) => (
                <Text key={index} style={styles.adviceItem}>{advice}</Text>
              ))}
            </View>

            {/* Pharmacist Reminder */}
            <View style={styles.pharmacistReminder}>
              <Text style={styles.pharmacistIcon}>👨‍⚕️</Text>
              <Text style={styles.pharmacistText}>
                Remember: Consult a licensed pharmacist before purchasing any medication
              </Text>
            </View>
          </ScrollView>

          {/* Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.findPharmacistButton} onPress={findPharmacist}>
              <Text style={styles.findPharmacistButtonText}>🏥 Find Nearby Pharmacist</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ============ HELPER FUNCTIONS ============

function getRiskColor(riskLevel: string): string {
  return riskLevel === 'low' ? '#00D4AA' : '#FFA500';
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1E2749' },
  backButton: { fontSize: 16, color: '#00D4AA', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  content: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#FFFFFF' },
  urgentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  urgentIcon: { fontSize: 64, marginBottom: 20 },
  urgentTitle: { fontSize: 24, fontWeight: 'bold', color: '#FF0000', marginBottom: 16, textAlign: 'center' },
  urgentMessage: { fontSize: 16, color: '#FFFFFF', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  urgentButton: { backgroundColor: '#FF0000', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 },
  urgentButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  disclaimerContainer: { alignItems: 'center' },
  disclaimerIcon: { fontSize: 64, marginBottom: 20 },
  disclaimerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35', marginBottom: 20, textAlign: 'center' },
  disclaimerText: { fontSize: 14, color: '#FFFFFF', lineHeight: 22, marginBottom: 24 },
  zkSignatureBox: { backgroundColor: '#1E2749', padding: 16, borderRadius: 12, width: '100%', marginBottom: 24 },
  zkLabel: { fontSize: 12, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  zkSignature: { fontSize: 11, color: '#8B92B0', fontFamily: 'monospace', marginBottom: 4 },
  zkTimestamp: { fontSize: 11, color: '#8B92B0' },
  acceptButton: { backgroundColor: '#00D4AA', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%' },
  acceptButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27', textAlign: 'center' },
  conditionCard: { backgroundColor: '#1E2749', padding: 16, borderRadius: 12, marginBottom: 24 },
  conditionName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  riskBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start' },
  riskText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#00D4AA', marginBottom: 16 },
  medicationCard: { backgroundColor: '#1E2749', padding: 16, borderRadius: 12, marginBottom: 16 },
  medicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  medicationName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  availabilityBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  availabilityText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  genericName: { fontSize: 13, color: '#8B92B0', marginBottom: 12 },
  dosageSection: { marginBottom: 8 },
  dosageLabel: { fontSize: 12, color: '#8B92B0', marginBottom: 2 },
  dosageValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
  instructionsBox: { backgroundColor: '#0A0E27', padding: 12, borderRadius: 8, marginTop: 8 },
  instructionsTitle: { fontSize: 12, fontWeight: 'bold', color: '#00D4AA', marginBottom: 4 },
  instructionsText: { fontSize: 13, color: '#FFFFFF', lineHeight: 18 },
  warningBox: { backgroundColor: '#FF6B35', padding: 12, borderRadius: 8, marginTop: 8 },
  warningTitle: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  warningText: { fontSize: 12, color: '#FFFFFF', lineHeight: 16 },
  adviceCard: { backgroundColor: '#1E2749', padding: 16, borderRadius: 12, marginBottom: 16 },
  adviceItem: { fontSize: 14, color: '#FFFFFF', marginBottom: 8, lineHeight: 20 },
  pharmacistReminder: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pharmacistIcon: { fontSize: 32, marginRight: 12 },
  pharmacistText: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', lineHeight: 20 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1E2749' },
  findPharmacistButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12 },
  findPharmacistButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27', textAlign: 'center' },
});

