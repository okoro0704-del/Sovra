/**
 * ExileVaultScreen.tsx - Sovereign Backup (Stateless Wealth) UI
 * 
 * "When infrastructure falls, the ledger remembers."
 * 
 * Features:
 * - View exile nation status
 * - View citizen exile status
 * - Access rebuild funds
 * - View virtual ledger
 * - Health record preservation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

interface ExileVaultScreenProps {
  navigation: any;
  route: any;
}

export default function ExileVaultScreen({ navigation, route }: ExileVaultScreenProps) {
  const [isExiled, setIsExiled] = useState(false);
  const [exileNation, setExileNation] = useState<any>(null);
  const [exileCitizen, setExileCitizen] = useState<any>(null);

  // Mock user data (in production, get from auth context)
  const mockUID = 'VITALIZED_UID_12345';
  const mockNationId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  useEffect(() => {
    loadExileStatus();
  }, []);

  const loadExileStatus = async () => {
    // In production, query ExileVault.sol
    // For now, simulate exile status
    const mockExileNation = {
      nationId: mockNationId,
      nationName: 'Test Nation',
      totalCitizens: 1000,
      destructionPercentage: 95,
      exiledAt: Date.now() - 86400000, // 1 day ago
      totalVaultBalance: 10000,
      totalHealthRecords: 1000,
      isActive: true,
      virtualLedgerHash: 'QmVirtualLedgerHash123',
    };

    const mockExileCitizen = {
      uid: mockUID,
      nationId: mockNationId,
      liquidVida: 10,
      lockedVida: 5,
      nvida: 100,
      healthRecordHash: 'QmHealthRecordHash456',
      healthCoverageActive: true,
      exiledAt: Date.now() - 86400000,
      canRebuild: true,
    };

    setIsExiled(true);
    setExileNation(mockExileNation);
    setExileCitizen(mockExileCitizen);
  };

  const accessRebuildFunds = (amount: number) => {
    Alert.alert(
      '🏗️ Access Rebuild Funds',
      `You are about to access ${amount} VIDA for rebuilding.\n\nThis will be deducted from your Exile-Vault balance.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            // In production, call ExileVault.sol accessRebuildFunds()
            Alert.alert(
              '✅ Funds Accessed',
              `${amount} VIDA has been transferred to your wallet for rebuilding.`
            );
          },
        },
      ]
    );
  };

  if (!isExiled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏛️ Exile-Vault</Text>
          <Text style={styles.subtitle}>"When infrastructure falls, the ledger remembers."</Text>
        </View>

        <View style={styles.noExileCard}>
          <Text style={styles.noExileTitle}>✅ No Exile Status</Text>
          <Text style={styles.noExileText}>
            Your nation is not in exile.{'\n\n'}
            The Exile-Vault system activates when a nation's infrastructure is 90%+ destroyed,
            preserving citizen wealth and health records for immediate rebuilding.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏛️ Exile-Vault</Text>
        <Text style={styles.subtitle}>"When infrastructure falls, the ledger remembers."</Text>
      </View>

      {/* Exile Status Card */}
      <View style={styles.exileCard}>
        <Text style={styles.cardTitle}>⚠️ NATION IN EXILE</Text>

        <View style={styles.exileInfo}>
          <Text style={styles.infoLabel}>Nation:</Text>
          <Text style={styles.infoValue}>{exileNation?.nationName}</Text>

          <Text style={styles.infoLabel}>Destruction:</Text>
          <Text style={styles.infoValue}>{exileNation?.destructionPercentage}%</Text>

          <Text style={styles.infoLabel}>Exiled Since:</Text>
          <Text style={styles.infoValue}>
            {new Date(exileNation?.exiledAt).toLocaleDateString()}
          </Text>

          <Text style={styles.infoLabel}>Total Citizens in Exile:</Text>
          <Text style={styles.infoValue}>{exileNation?.totalCitizens.toLocaleString()}</Text>

          <Text style={styles.infoLabel}>Total Vault Balance:</Text>
          <Text style={styles.infoValue}>{exileNation?.totalVaultBalance.toLocaleString()} Ѵ</Text>

          <Text style={styles.infoLabel}>Health Records Preserved:</Text>
          <Text style={styles.infoValue}>{exileNation?.totalHealthRecords.toLocaleString()}</Text>
        </View>
      </View>

      {/* Citizen Exile Status */}
      <View style={styles.citizenCard}>
        <Text style={styles.cardTitle}>👤 Your Exile Status</Text>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Liquid VIDA</Text>
            <Text style={styles.balanceValue}>{exileCitizen?.liquidVida} Ѵ</Text>
          </View>

          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Locked VIDA</Text>
            <Text style={styles.balanceValue}>{exileCitizen?.lockedVida} Ѵ</Text>
          </View>

          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>nVIDA</Text>
            <Text style={styles.balanceValue}>{exileCitizen?.nvida} ₦</Text>
          </View>
        </View>

        <View style={styles.healthStatus}>
          <Text style={styles.healthLabel}>Health Coverage:</Text>
          <Text style={[styles.healthValue, exileCitizen?.healthCoverageActive && styles.healthActive]}>
            {exileCitizen?.healthCoverageActive ? '✅ ACTIVE' : '❌ INACTIVE'}
          </Text>

          <Text style={styles.healthLabel}>Health Record Hash:</Text>
          <Text style={styles.healthHash}>{exileCitizen?.healthRecordHash?.substring(0, 20)}...</Text>
        </View>

        <View style={styles.guaranteeCard}>
          <Text style={styles.guaranteeTitle}>🛡️ 10 VIDA GUARANTEE</Text>
          <Text style={styles.guaranteeText}>
            Even if your nation is destroyed, you are guaranteed a minimum of 10 VIDA to rebuild your life.
            This is your sovereign right.
          </Text>
        </View>
      </View>

      {/* Rebuild Actions */}
      <View style={styles.rebuildCard}>
        <Text style={styles.cardTitle}>🏗️ Rebuild Funds</Text>

        <Text style={styles.rebuildText}>
          Access your Exile-Vault funds to rebuild your life in any country.
        </Text>

        <TouchableOpacity
          style={styles.rebuildButton}
          onPress={() => accessRebuildFunds(5)}
        >
          <Text style={styles.rebuildButtonText}>Access 5 VIDA for Rebuilding</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rebuildButton, styles.rebuildButtonSecondary]}
          onPress={() => accessRebuildFunds(10)}
        >
          <Text style={styles.rebuildButtonText}>Access 10 VIDA for Rebuilding</Text>
        </TouchableOpacity>
      </View>

      {/* Virtual Ledger */}
      <View style={styles.ledgerCard}>
        <Text style={styles.cardTitle}>📜 Virtual Ledger</Text>

        <Text style={styles.ledgerText}>
          Your nation's ledger is preserved in a virtual Exile-Vault, hosted on IPFS and the satellite mesh.
        </Text>

        <View style={styles.ledgerInfo}>
          <Text style={styles.ledgerLabel}>Ledger Hash:</Text>
          <Text style={styles.ledgerHash}>{exileNation?.virtualLedgerHash}</Text>
        </View>

        <TouchableOpacity style={styles.viewLedgerButton}>
          <Text style={styles.viewLedgerButtonText}>🔍 View Virtual Ledger</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>ℹ️ How Exile-Vault Works</Text>
        <Text style={styles.infoCardText}>
          1. Nation's infrastructure 90%+ destroyed{'\n'}
          2. DAO votes on exile activation (66% threshold){'\n'}
          3. Virtual Exile-Vault created on IPFS{'\n'}
          4. All citizen wealth preserved (10 VIDA minimum){'\n'}
          5. Health records preserved{'\n'}
          6. Citizens can access funds for rebuilding{'\n'}
          7. When nation rebuilt → Exile ends
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

  noExileCard: { backgroundColor: '#1E2749', marginHorizontal: 20, padding: 20, borderRadius: 12 },
  noExileTitle: { fontSize: 18, fontWeight: 'bold', color: '#00D4AA', marginBottom: 12 },
  noExileText: { fontSize: 14, color: '#8B9DC3', lineHeight: 22 },

  exileCard: { backgroundColor: '#FF6B35', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },

  exileInfo: { marginTop: 8 },
  infoLabel: { fontSize: 12, color: '#FFFFFF', marginTop: 8, opacity: 0.8 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },

  citizenCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },

  balanceContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: '#8B9DC3', marginBottom: 4 },
  balanceValue: { fontSize: 18, fontWeight: 'bold', color: '#00D4AA' },

  healthStatus: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#0A0E27' },
  healthLabel: { fontSize: 12, color: '#8B9DC3', marginTop: 8 },
  healthValue: { fontSize: 16, fontWeight: 'bold', color: '#FF6B35' },
  healthActive: { color: '#00D4AA' },
  healthHash: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },

  guaranteeCard: { backgroundColor: '#00D4AA', marginTop: 16, padding: 16, borderRadius: 8 },
  guaranteeTitle: { fontSize: 14, fontWeight: 'bold', color: '#000000', marginBottom: 8 },
  guaranteeText: { fontSize: 12, color: '#000000', lineHeight: 18 },

  rebuildCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  rebuildText: { fontSize: 14, color: '#8B9DC3', marginBottom: 16 },
  rebuildButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
  rebuildButtonSecondary: { backgroundColor: '#1E2749', borderWidth: 2, borderColor: '#00D4AA' },
  rebuildButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  ledgerCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12 },
  ledgerText: { fontSize: 14, color: '#8B9DC3', marginBottom: 16 },
  ledgerInfo: { marginBottom: 16 },
  ledgerLabel: { fontSize: 12, color: '#8B9DC3', marginBottom: 4 },
  ledgerHash: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
  viewLedgerButton: { backgroundColor: '#0A0E27', paddingVertical: 16, borderRadius: 12 },
  viewLedgerButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  infoCard: { backgroundColor: '#1E2749', marginHorizontal: 20, marginBottom: 24, padding: 20, borderRadius: 12 },
  infoCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoCardText: { fontSize: 14, color: '#8B9DC3', lineHeight: 22 },
});

