/**
 * SentinelScreen.tsx - AI Symptom Checker
 * 
 * Chat-style interface for symptom selection and diagnosis
 * 
 * Features:
 * - Symptom selection by category
 * - Real-time PFF vitals integration
 * - Top 3 diagnosis results with probability scores
 * - Glass-box reasoning display
 * - Urgency indicators
 * 
 * "Glass-Box AI: We always explain WHY."
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { checkSymptoms, SYMPTOMS, type DiagnosisResult, type Symptom } from '@vitalia/contracts/src/logic/medical/SymptomChecker';
import { extractVitalSigns, type VitalSigns } from '@vitalia/pff-engine/src/VitalsMonitor';

interface SentinelScreenProps {
  navigation: any;
}

export default function SentinelScreen({ navigation }: SentinelScreenProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[] | null>(null);
  const [currentVitals, setCurrentVitals] = useState<VitalSigns | null>(null);
  const [step, setStep] = useState<'symptoms' | 'results'>('symptoms');

  // Mock user data (in production, get from user profile)
  const userAge = 28;
  const userWeight = 70;
  const userLocation = 'Lagos, Nigeria';

  // Mock PFF vitals (in production, get from real PFF scan)
  useEffect(() => {
    // Simulate getting vitals from PFF scan
    const mockVitals = extractVitalSigns(
      75, // BPM
      55, // HRV
      85, // Signal quality
      [0.5, 0.52, 0.48, 0.51, 0.49, 0.53, 0.47, 0.52, 0.5, 0.51] // Pulse signal
    );
    setCurrentVitals(mockVitals);
  }, []);

  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0 || !currentVitals) {
      return;
    }

    const results = checkSymptoms({
      symptoms: selectedSymptoms,
      vitals: currentVitals,
      age: userAge,
      weight: userWeight,
      location: userLocation,
    });

    setDiagnosisResults(results);
    setStep('results');
  };

  const resetAnalysis = () => {
    setSelectedSymptoms([]);
    setDiagnosisResults(null);
    setStep('symptoms');
  };

  // Group symptoms by category
  const symptomsByCategory = SYMPTOMS.reduce((acc, symptom) => {
    if (!acc[symptom.category]) {
      acc[symptom.category] = [];
    }
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<string, Symptom[]>);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🤖 Sentinel AI</Text>
        <Text style={styles.subtitle}>Glass-Box Medical Analysis</Text>
      </View>

      {step === 'symptoms' ? (
        <>
          {/* Symptom Selection */}
          <ScrollView style={styles.content}>
            <Text style={styles.instruction}>
              Select all symptoms you're experiencing:
            </Text>

            {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {getCategoryIcon(category)} {category.toUpperCase()}
                </Text>
                <View style={styles.symptomGrid}>
                  {symptoms.map(symptom => (
                    <TouchableOpacity
                      key={symptom.id}
                      style={[
                        styles.symptomButton,
                        selectedSymptoms.includes(symptom.id) && styles.symptomButtonSelected,
                      ]}
                      onPress={() => toggleSymptom(symptom.id)}
                    >
                      <Text
                        style={[
                          styles.symptomButtonText,
                          selectedSymptoms.includes(symptom.id) && styles.symptomButtonTextSelected,
                        ]}
                      >
                        {symptom.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Analyze Button */}
          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity
              style={[styles.analyzeButton, selectedSymptoms.length === 0 && styles.analyzeButtonDisabled]}
              onPress={analyzeSymptoms}
              disabled={selectedSymptoms.length === 0}
            >
              <Text style={styles.analyzeButtonText}>
                🔍 Analyze Symptoms
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Diagnosis Results */}
          <ScrollView style={styles.content}>
            <Text style={styles.resultsTitle}>📊 Analysis Results</Text>
            <Text style={styles.resultsSubtitle}>
              Based on {selectedSymptoms.length} symptoms and your vital signs
            </Text>

            {diagnosisResults?.map((result, index) => (
              <View key={result.disease.id} style={styles.resultCard}>
                {/* Rank Badge */}
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>

                {/* Disease Name */}
                <Text style={styles.diseaseName}>{result.disease.commonName}</Text>
                <Text style={styles.diseaseDescription}>{result.disease.description}</Text>

                {/* Probability Bar */}
                <View style={styles.probabilityContainer}>
                  <Text style={styles.probabilityLabel}>Probability</Text>
                  <View style={styles.probabilityBar}>
                    <View
                      style={[
                        styles.probabilityBarFill,
                        { width: `${result.probability}%`, backgroundColor: getProbabilityColor(result.probability) },
                      ]}
                    />
                  </View>
                  <Text style={styles.probabilityValue}>{result.probability}%</Text>
                </View>

                {/* Confidence & Urgency */}
                <View style={styles.metaRow}>
                  <View style={[styles.badge, styles.confidenceBadge]}>
                    <Text style={styles.badgeText}>
                      Confidence: {result.confidence.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.urgencyBadge, { backgroundColor: getUrgencyColor(result.urgency) }]}>
                    <Text style={styles.badgeText}>
                      {getUrgencyIcon(result.urgency)} {result.urgency.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Glass-Box Reasoning */}
                <View style={styles.reasoningSection}>
                  <Text style={styles.reasoningTitle}>💡 Why this diagnosis?</Text>
                  {result.reasoning.map((reason, idx) => (
                    <Text key={idx} style={styles.reasoningItem}>
                      • {reason}
                    </Text>
                  ))}
                </View>
              </View>
            ))}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerIcon}>⚠️</Text>
              <Text style={styles.disclaimerText}>
                This is an AI analysis, not a final medical diagnosis. Please consult a licensed healthcare provider for proper evaluation and treatment.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetAnalysis}>
              <Text style={styles.secondaryButtonText}>🔄 New Analysis</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('PharmacyBridge', { diagnosisResults })}
            >
              <Text style={styles.primaryButtonText}>💊 Get Medication Advice</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ============ HELPER FUNCTIONS ============

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    general: '🌡️',
    respiratory: '🫁',
    digestive: '🍽️',
    neurological: '🧠',
    skin: '🩹',
  };
  return icons[category] || '📋';
}

function getProbabilityColor(probability: number): string {
  if (probability > 70) return '#FF6B35';
  if (probability > 50) return '#FFA500';
  return '#00D4AA';
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical': return '#FF0000';
    case 'high': return '#FF6B35';
    case 'medium': return '#FFA500';
    case 'low': return '#00D4AA';
    default: return '#8B92B0';
  }
}

function getUrgencyIcon(urgency: string): string {
  switch (urgency) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return '✅';
    default: return '📋';
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1E2749' },
  backButton: { fontSize: 16, color: '#00D4AA', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B92B0' },
  content: { flex: 1, padding: 20 },
  instruction: { fontSize: 16, color: '#FFFFFF', marginBottom: 20 },
  categorySection: { marginBottom: 24 },
  categoryTitle: { fontSize: 14, fontWeight: 'bold', color: '#00D4AA', marginBottom: 12 },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomButton: {
    backgroundColor: '#1E2749',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  symptomButtonSelected: { backgroundColor: '#00D4AA', borderColor: '#00D4AA' },
  symptomButtonText: { fontSize: 14, color: '#FFFFFF' },
  symptomButtonTextSelected: { color: '#0A0E27', fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1E2749' },
  selectedCount: { fontSize: 14, color: '#8B92B0', marginBottom: 12, textAlign: 'center' },
  analyzeButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12 },
  analyzeButtonDisabled: { backgroundColor: '#1E2749', opacity: 0.5 },
  analyzeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27', textAlign: 'center' },
  resultsTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  resultsSubtitle: { fontSize: 14, color: '#8B92B0', marginBottom: 24 },
  resultCard: {
    backgroundColor: '#1E2749',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#00D4AA',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#0A0E27' },
  diseaseName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  diseaseDescription: { fontSize: 13, color: '#8B92B0', marginBottom: 16 },
  probabilityContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  probabilityLabel: { fontSize: 12, color: '#8B92B0', width: 70 },
  probabilityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#0A0E27',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  probabilityBarFill: { height: '100%', borderRadius: 4 },
  probabilityValue: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', width: 50, textAlign: 'right' },
  metaRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  confidenceBadge: { backgroundColor: '#0A0E27' },
  urgencyBadge: {},
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  reasoningSection: { marginTop: 8 },
  reasoningTitle: { fontSize: 14, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  reasoningItem: { fontSize: 13, color: '#FFFFFF', marginBottom: 4, lineHeight: 18 },
  disclaimer: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  disclaimerIcon: { fontSize: 24, marginRight: 12 },
  disclaimerText: { flex: 1, fontSize: 13, color: '#FFFFFF', lineHeight: 18 },
  secondaryButton: {
    backgroundColor: '#1E2749',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  primaryButton: { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 12 },
  primaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
});

