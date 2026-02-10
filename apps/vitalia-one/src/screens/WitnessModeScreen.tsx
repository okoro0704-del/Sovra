/**
 * WitnessModeScreen.tsx - Truth-Witness Network UI
 * 
 * "The heartbeat never lies. The witness never forgets."
 * 
 * Features:
 * - 10-second video capture for war-crime evidence
 * - PFF Truth-Hash attachment
 * - Satellite upload
 * - Global Defense DAO submission
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { captureWitnessEvidence, CrimeType, WitnessSubmission } from '@vitalia/contracts';

interface WitnessModeScreenProps {
  navigation: any;
  route: any;
}

export default function WitnessModeScreen({ navigation, route }: WitnessModeScreenProps) {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<WitnessSubmission | null>(null);

  // Mock user data (in production, get from auth context)
  const mockUID = 'VITALIZED_UID_12345';
  const mockName = 'Citizen Witness';
  const mockPFFHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const startRecording = () => {
    Alert.alert(
      '⚠️ Witness Mode',
      'You are about to record evidence of a potential war crime.\n\nThis video will be:\n• Attached to your PFF Truth-Hash\n• Uploaded to satellite\n• Submitted to Global Defense DAO\n• Used as indisputable evidence\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Recording',
          style: 'destructive',
          onPress: () => {
            setRecording(true);
            setRecordingTime(0);

            // Simulate 10-second recording
            const interval = setInterval(() => {
              setRecordingTime(prev => {
                if (prev >= 10) {
                  clearInterval(interval);
                  stopRecording();
                  return 10;
                }
                return prev + 1;
              });
            }, 1000);
          },
        },
      ]
    );
  };

  const stopRecording = () => {
    setRecording(false);

    // Simulate video blob creation
    const mockBlob = new Blob(['mock video data'], { type: 'video/mp4' });
    setVideoBlob(mockBlob);

    Alert.alert('Recording Complete', '10-second video captured. Ready to submit evidence.');
  };

  const submitEvidence = async () => {
    if (!videoBlob) {
      Alert.alert('Error', 'No video recorded');
      return;
    }

    Alert.alert(
      '📋 Evidence Details',
      'Please provide details about the war crime:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);

            try {
              // Get current location (in production, use react-native-geolocation)
              const mockLocation = {
                latitude: 6.5244,
                longitude: 3.3792,
                country: 'Nigeria',
              };

              const result = await captureWitnessEvidence(
                mockUID,
                mockName,
                mockPFFHash,
                videoBlob,
                mockLocation,
                CrimeType.CIVILIAN_ATTACK,
                'Lagos',
                'Unknown Aggressor',
                'Witnessed attack on civilian infrastructure'
              );

              setSubmission(result);

              Alert.alert(
                '✅ Evidence Submitted',
                `Your witness evidence has been:\n\n✅ PFF Truth-Hash verified\n✅ Uploaded to satellite\n✅ Submitted to Global Defense DAO\n\nProposal ID: ${result.proposalId?.substring(0, 10)}...\n\nYour testimony is now indisputable on-chain evidence.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('[WITNESS] Error submitting evidence:', error);
              Alert.alert('Error', 'Failed to submit evidence. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Witness Mode</Text>
        <Text style={styles.subtitle}>"The heartbeat never lies. The witness never forgets."</Text>
      </View>

      {/* Warning Card */}
      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>⚠️ IMPORTANT</Text>
        <Text style={styles.warningText}>
          Witness Mode is for documenting war crimes and human rights violations.
          {'\n\n'}
          Your evidence will be:
          {'\n'}• Attached to your PFF Truth-Hash
          {'\n'}• Uploaded to satellite (uncensorable)
          {'\n'}• Submitted to Global Defense DAO
          {'\n'}• Used as indisputable on-chain evidence
          {'\n\n'}
          False reports may result in penalties.
        </Text>
      </View>

      {/* Recording Status */}
      {!videoBlob && (
        <View style={styles.recordingCard}>
          <Text style={styles.cardTitle}>
            {recording ? '🔴 RECORDING' : '📹 Ready to Record'}
          </Text>

          {recording && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{recordingTime} / 10 seconds</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(recordingTime / 10) * 100}%` }]} />
              </View>
            </View>
          )}

          {!recording && (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Text style={styles.recordButtonText}>🔴 Start Recording (10s)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Video Preview */}
      {videoBlob && !submission && (
        <View style={styles.previewCard}>
          <Text style={styles.cardTitle}>✅ Video Captured</Text>

          <View style={styles.videoPreview}>
            <Text style={styles.videoPreviewText}>📹 10-second video ready</Text>
            <Text style={styles.videoSize}>{(videoBlob.size / 1024).toFixed(2)} KB</Text>
          </View>

          <View style={styles.evidenceInfo}>
            <Text style={styles.infoLabel}>Witness UID:</Text>
            <Text style={styles.infoValue}>{mockUID}</Text>

            <Text style={styles.infoLabel}>PFF Truth-Hash:</Text>
            <Text style={styles.infoValueSmall}>{mockPFFHash.substring(0, 20)}...</Text>

            <Text style={styles.infoLabel}>Timestamp:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submitEvidence}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? '⏳ Submitting to DAO...' : '📤 Submit Evidence'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              setVideoBlob(null);
              setRecordingTime(0);
            }}
          >
            <Text style={styles.retakeButtonText}>🔄 Retake Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submission Success */}
      {submission && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>✅ Evidence Submitted</Text>

          <View style={styles.successInfo}>
            <Text style={styles.successLabel}>Status:</Text>
            <Text style={styles.successValue}>
              {submission.evidence.verificationStatus}
            </Text>

            <Text style={styles.successLabel}>Satellite Upload:</Text>
            <Text style={styles.successValue}>
              {submission.satelliteUpload ? '✅ SUCCESS' : '❌ FAILED'}
            </Text>

            <Text style={styles.successLabel}>Proposal ID:</Text>
            <Text style={styles.successValueSmall}>
              {submission.proposalId?.substring(0, 20)}...
            </Text>

            <Text style={styles.successLabel}>Chain of Custody:</Text>
            {submission.evidence.chainOfCustody.map((entry, index) => (
              <Text key={index} style={styles.custodyEntry}>
                {index + 1}. {entry.action} ({new Date(entry.timestamp).toLocaleTimeString()})
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>ℹ️ How Witness Mode Works</Text>
        <Text style={styles.infoCardText}>
          1. Record 10-second video of war crime{'\n'}
          2. Video is attached to your PFF Truth-Hash{'\n'}
          3. Evidence uploaded to satellite (uncensorable){'\n'}
          4. Submitted to Global Defense DAO{'\n'}
          5. DAO votes on Aggressor-Lock{'\n'}
          6. Peace Oracle confirms evidence{'\n'}
          7. If 66% vote YES → Aggressor locked
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B9DC3', fontStyle: 'italic' },

  warningCard: { backgroundColor: '#FF6B35', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  warningTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  warningText: { fontSize: 14, color: '#FFFFFF', lineHeight: 22 },

  recordingCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },

  timerContainer: { alignItems: 'center' },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#FF0000', marginBottom: 16 },
  progressBar: { width: '100%', height: 8, backgroundColor: '#0A0E27', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF0000' },

  recordButton: { backgroundColor: '#FF0000', paddingVertical: 16, borderRadius: 12 },
  recordButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  previewCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  videoPreview: { backgroundColor: '#0A0E27', padding: 20, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  videoPreviewText: { fontSize: 16, color: '#FFFFFF', marginBottom: 8 },
  videoSize: { fontSize: 14, color: '#8B9DC3' },

  evidenceInfo: { marginBottom: 16 },
  infoLabel: { fontSize: 12, color: '#8B9DC3', marginTop: 8 },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  infoValueSmall: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },

  submitButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  submitButtonDisabled: { backgroundColor: '#1E2749' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  retakeButton: { backgroundColor: '#1E2749', paddingVertical: 16, borderRadius: 12 },
  retakeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  successCard: { backgroundColor: '#00D4AA', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 16, textAlign: 'center' },
  successInfo: { marginBottom: 16 },
  successLabel: { fontSize: 12, color: '#000000', marginTop: 8, fontWeight: 'bold' },
  successValue: { fontSize: 14, color: '#000000' },
  successValueSmall: { fontSize: 12, color: '#000000' },
  custodyEntry: { fontSize: 12, color: '#000000', marginLeft: 8, marginTop: 4 },

  doneButton: { backgroundColor: '#0A0E27', paddingVertical: 16, borderRadius: 12 },
  doneButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  infoCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 24, padding: 20, borderRadius: 12 },
  infoCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoCardText: { fontSize: 14, color: '#8B9DC3', lineHeight: 22 },
});

