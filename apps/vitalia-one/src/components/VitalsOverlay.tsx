/**
 * VitalsOverlay.tsx
 * 
 * Real-time vital signs display with medical alerts
 * 
 * Features:
 * - BPM, SpO2, Respiratory Rate display
 * - Medical Alert UI state for critical values
 * - Color-coded status indicators
 * 
 * "Your heartbeat knows what's wrong."
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { VitalSigns, VitalAlert, VitalStatus } from '@vitalia/pff-engine/src/VitalsMonitor';

interface VitalsOverlayProps {
  vitals: VitalSigns | null;
  alerts: VitalAlert[];
  status: VitalStatus;
  onAlertPress?: () => void;
}

export function VitalsOverlay({ vitals, alerts, status, onAlertPress }: VitalsOverlayProps) {
  if (!vitals) {
    return null;
  }

  const statusColor = getStatusColor(status);
  const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL');
  const warningAlerts = alerts.filter(a => a.type === 'WARNING');

  return (
    <View style={styles.container}>
      {/* Vital Signs Grid */}
      <View style={styles.vitalsGrid}>
        {/* BPM */}
        <View style={styles.vitalCard}>
          <Text style={styles.vitalIcon}>💓</Text>
          <Text style={styles.vitalValue}>{vitals.bpm}</Text>
          <Text style={styles.vitalLabel}>BPM</Text>
          <View style={[styles.statusDot, { backgroundColor: getBPMColor(vitals.bpm) }]} />
        </View>

        {/* SpO2 */}
        <View style={styles.vitalCard}>
          <Text style={styles.vitalIcon}>🫁</Text>
          <Text style={styles.vitalValue}>
            {vitals.spO2 > 0 ? vitals.spO2 : '--'}
          </Text>
          <Text style={styles.vitalLabel}>SpO₂ %</Text>
          <View style={[styles.statusDot, { backgroundColor: getSpO2Color(vitals.spO2) }]} />
        </View>

        {/* Respiratory Rate */}
        <View style={styles.vitalCard}>
          <Text style={styles.vitalIcon}>🌬️</Text>
          <Text style={styles.vitalValue}>{vitals.respiratoryRate}</Text>
          <Text style={styles.vitalLabel}>Breaths/min</Text>
          <View style={[styles.statusDot, { backgroundColor: getRespColor(vitals.respiratoryRate) }]} />
        </View>

        {/* HRV */}
        <View style={styles.vitalCard}>
          <Text style={styles.vitalIcon}>📊</Text>
          <Text style={styles.vitalValue}>{vitals.hrv}</Text>
          <Text style={styles.vitalLabel}>HRV</Text>
          <View style={[styles.statusDot, { backgroundColor: '#00D4AA' }]} />
        </View>
      </View>

      {/* Medical Alerts */}
      {alerts.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: statusColor }]}
          onPress={onAlertPress}
        >
          <Text style={styles.alertIcon}>
            {status === 'CRITICAL' ? '🚨' : '⚠️'}
          </Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {status === 'CRITICAL' ? 'MEDICAL ALERT' : 'HEALTH WARNING'}
            </Text>
            <Text style={styles.alertMessage}>
              {criticalAlerts.length > 0
                ? criticalAlerts[0].message
                : warningAlerts[0].message}
            </Text>
            <Text style={styles.alertAction}>Tap for details →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Signal Quality Indicator */}
      <View style={styles.qualityBar}>
        <Text style={styles.qualityLabel}>Signal Quality</Text>
        <View style={styles.qualityBarContainer}>
          <View
            style={[
              styles.qualityBarFill,
              { width: `${vitals.signalQuality}%`, backgroundColor: getQualityColor(vitals.signalQuality) },
            ]}
          />
        </View>
        <Text style={styles.qualityValue}>{vitals.signalQuality}%</Text>
      </View>
    </View>
  );
}

// ============ HELPER FUNCTIONS ============

function getStatusColor(status: VitalStatus): string {
  switch (status) {
    case 'CRITICAL':
      return '#FF0000';
    case 'WARNING':
      return '#FFA500';
    case 'NORMAL':
      return '#00D4AA';
    default:
      return '#8B92B0';
  }
}

function getBPMColor(bpm: number): string {
  if (bpm < 50 || bpm > 110) return '#FF0000'; // Critical
  if (bpm < 60 || bpm > 100) return '#FFA500'; // Warning
  return '#00D4AA'; // Normal
}

function getSpO2Color(spO2: number): string {
  if (spO2 === 0) return '#8B92B0'; // No data
  if (spO2 < 92) return '#FF0000'; // Critical
  if (spO2 < 95) return '#FFA500'; // Warning
  return '#00D4AA'; // Normal
}

function getRespColor(rate: number): string {
  if (rate < 10 || rate > 24) return '#FFA500'; // Warning
  return '#00D4AA'; // Normal
}

function getQualityColor(quality: number): string {
  if (quality < 50) return '#FF0000';
  if (quality < 70) return '#FFA500';
  return '#00D4AA';
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { padding: 16 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  vitalCard: {
    width: '48%',
    backgroundColor: '#1E2749',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginRight: '2%',
    alignItems: 'center',
    position: 'relative',
  },
  vitalIcon: { fontSize: 24, marginBottom: 8 },
  vitalValue: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  vitalLabel: { fontSize: 12, color: '#8B92B0' },
  statusDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  alertIcon: { fontSize: 32, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  alertMessage: { fontSize: 12, color: '#FFFFFF', marginBottom: 4 },
  alertAction: { fontSize: 11, color: '#FFFFFF', opacity: 0.8 },
  qualityBar: { flexDirection: 'row', alignItems: 'center' },
  qualityLabel: { fontSize: 12, color: '#8B92B0', marginRight: 8, width: 80 },
  qualityBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#1E2749',
    borderRadius: 3,
    overflow: 'hidden',
  },
  qualityBarFill: { height: '100%', borderRadius: 3 },
  qualityValue: { fontSize: 12, color: '#8B92B0', marginLeft: 8, width: 40, textAlign: 'right' },
});

