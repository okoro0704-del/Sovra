/**
 * Sovereign Portal - Government Finance Dashboard
 * 
 * Real-time economic monitoring for National Finance Ministers.
 * 
 * Displays:
 * - Real-time FX Reserve (USD/NGN)
 * - National Dividend distribution totals
 * - Ghost Worker savings from payroll audits
 * - VIDA/nVIDA supply metrics
 * - Pendulum Governor status
 * 
 * "The era of opacity is over. The era of transparency has begun."
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Nations.
 */

import React, { useState, useEffect } from 'react';

// ============ TYPES ============

interface FxReserve {
  usdBalance: number;
  ngnBalance: number;
  eurBalance: number;
  totalReserveUSD: number;
  reserveRatio: number; // % backing
  lastUpdated: number;
}

interface DividendMetrics {
  totalDistributed: number; // Total nVIDA distributed
  governmentShare: number; // 50% to treasury
  citizenShare: number; // 50% to citizens
  totalCitizens: number;
  averagePerCitizen: number;
  lastDistribution: number;
}

interface GhostWorkerSavings {
  totalSavings: number; // Total nVIDA saved
  ghostWorkersDetected: number;
  totalAudits: number;
  savingsRate: number; // % of payroll saved
  lastAudit: number;
}

interface SupplyStatus {
  vidaSupply: number;
  nVidaSupply: number;
  burnRate: number;
  mintRate: number;
  isMintingActive: boolean;
  supplyHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

interface GovernanceStatus {
  isAutonomous: boolean;
  lastDecision: string;
  nextGovernanceCheck: number;
  pendulumStatus: string;
}

// ============ COMPONENT ============

export const SovereignPortal: React.FC = () => {
  const [fxReserve, setFxReserve] = useState<FxReserve | null>(null);
  const [dividendMetrics, setDividendMetrics] = useState<DividendMetrics | null>(null);
  const [ghostSavings, setGhostSavings] = useState<GhostWorkerSavings | null>(null);
  const [supplyStatus, setSupplyStatus] = useState<SupplyStatus | null>(null);
  const [governanceStatus, setGovernanceStatus] = useState<GovernanceStatus | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // ============ DATA FETCHING ============

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    // In production, fetch from blockchain and APIs
    setFxReserve({
      usdBalance: 50_000_000,
      ngnBalance: 40_000_000_000,
      eurBalance: 10_000_000,
      totalReserveUSD: 75_000_000,
      reserveRatio: 102.5,
      lastUpdated: Date.now(),
    });

    setDividendMetrics({
      totalDistributed: 500_000_000,
      governmentShare: 250_000_000,
      citizenShare: 250_000_000,
      totalCitizens: 10_000_000,
      averagePerCitizen: 25,
      lastDistribution: Date.now() - 86400000,
    });

    setGhostSavings({
      totalSavings: 15_000_000,
      ghostWorkersDetected: 3_450,
      totalAudits: 127,
      savingsRate: 8.5,
      lastAudit: Date.now() - 172800000,
    });

    setSupplyStatus({
      vidaSupply: 625_000_000,
      nVidaSupply: 2_500_000_000,
      burnRate: 2,
      mintRate: 0,
      isMintingActive: false,
      supplyHealth: 'HEALTHY',
    });

    setGovernanceStatus({
      isAutonomous: true,
      lastDecision: 'SUPPLY_STABILIZED',
      nextGovernanceCheck: Date.now() + 43200000,
      pendulumStatus: 'EQUILIBRIUM',
    });
  };

  // ============ FORMATTERS ============

  const formatCurrency = (amount: number, currency: string = 'nVIDA') => {
    if (currency === 'USD') return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (currency === 'NGN') return `₦${(amount / 1_000_000).toFixed(2)}M`;
    if (currency === 'EUR') return `€${(amount / 1_000_000).toFixed(2)}M`;
    return `Ѵ${(amount / 1_000_000).toFixed(2)}M`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // ============ RENDER ============

  if (!fxReserve || !dividendMetrics || !ghostSavings || !supplyStatus || !governanceStatus) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading Sovereign Portal...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🏛️ Sovereign Portal</h1>
        <p style={styles.subtitle}>National Economic Dashboard - Project Vitalia</p>
        <div style={styles.statusBadge}>
          <span style={{ ...styles.badge, backgroundColor: governanceStatus.isAutonomous ? '#10b981' : '#f59e0b' }}>
            {governanceStatus.isAutonomous ? '✅ Autonomous' : '⚠️ Manual'}
          </span>
          <span style={{ ...styles.badge, backgroundColor: getHealthColor(supplyStatus.supplyHealth) }}>
            {supplyStatus.supplyHealth}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* FX Reserve Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💵 Foreign Exchange Reserve</h2>
          <div style={styles.cardContent}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Total Reserve (USD)</span>
              <span style={styles.metricValue}>{formatCurrency(fxReserve.totalReserveUSD, 'USD')}</span>
            </div>
            <div style={styles.metricRow}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>USD Balance</span>
                <span style={styles.metricValueSmall}>{formatCurrency(fxReserve.usdBalance, 'USD')}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>NGN Balance</span>
                <span style={styles.metricValueSmall}>{formatCurrency(fxReserve.ngnBalance, 'NGN')}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>EUR Balance</span>
                <span style={styles.metricValueSmall}>{formatCurrency(fxReserve.eurBalance, 'EUR')}</span>
              </div>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Reserve Ratio</span>
              <span style={{ ...styles.metricValue, color: fxReserve.reserveRatio >= 100 ? '#10b981' : '#ef4444' }}>
                {formatPercentage(fxReserve.reserveRatio)}
              </span>
            </div>
            <div style={styles.timestamp}>Last Updated: {formatTimestamp(fxReserve.lastUpdated)}</div>
          </div>
        </div>

        {/* National Dividend Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💰 National Dividend Distribution</h2>
          <div style={styles.cardContent}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Total Distributed</span>
              <span style={styles.metricValue}>{formatCurrency(dividendMetrics.totalDistributed)}</span>
            </div>
            <div style={styles.metricRow}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Government Share (50%)</span>
                <span style={styles.metricValueSmall}>{formatCurrency(dividendMetrics.governmentShare)}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Citizen Share (50%)</span>
                <span style={styles.metricValueSmall}>{formatCurrency(dividendMetrics.citizenShare)}</span>
              </div>
            </div>
            <div style={styles.metricRow}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Total Citizens</span>
                <span style={styles.metricValueSmall}>{dividendMetrics.totalCitizens.toLocaleString()}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Avg per Citizen</span>
                <span style={styles.metricValueSmall}>{formatCurrency(dividendMetrics.averagePerCitizen)}</span>
              </div>
            </div>
            <div style={styles.timestamp}>Last Distribution: {formatTimestamp(dividendMetrics.lastDistribution)}</div>
          </div>
        </div>

        {/* Ghost Worker Savings Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>👻 Ghost Worker Savings</h2>
          <div style={styles.cardContent}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Total Savings</span>
              <span style={{ ...styles.metricValue, color: '#10b981' }}>{formatCurrency(ghostSavings.totalSavings)}</span>
            </div>
            <div style={styles.metricRow}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Ghost Workers Detected</span>
                <span style={styles.metricValueSmall}>{ghostSavings.ghostWorkersDetected.toLocaleString()}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Total Audits</span>
                <span style={styles.metricValueSmall}>{ghostSavings.totalAudits}</span>
              </div>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Savings Rate</span>
              <span style={{ ...styles.metricValue, color: '#10b981' }}>{formatPercentage(ghostSavings.savingsRate)}</span>
            </div>
            <div style={styles.timestamp}>Last Audit: {formatTimestamp(ghostSavings.lastAudit)}</div>
          </div>
        </div>

        {/* Supply Status Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 Supply Status</h2>
          <div style={styles.cardContent}>
            <div style={styles.metricRow}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>VIDA Supply</span>
                <span style={styles.metricValueSmall}>{formatCurrency(supplyStatus.vidaSupply, 'VIDA')}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>nVIDA Supply</span>
                <span style={styles.metricValueSmall}>{formatCurrency(supplyStatus.nVidaSupply)}</span>
              </div>
            </div>
            <div style={styles.metricRow}>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Burn Rate</span>
                <span style={styles.metricValueSmall}>{formatPercentage(supplyStatus.burnRate)}</span>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Mint Rate</span>
                <span style={styles.metricValueSmall}>
                  {supplyStatus.isMintingActive ? `${supplyStatus.mintRate} VIDA/user` : 'Inactive'}
                </span>
              </div>
            </div>
            <div style={styles.progressBar}>
              <div style={styles.progressLabel}>
                <span>Floor: 500M</span>
                <span>Ceiling: 750M</span>
                <span>Cap: 1B</span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${(supplyStatus.vidaSupply / 1_000_000_000) * 100}%`,
                    backgroundColor: getHealthColor(supplyStatus.supplyHealth),
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Governance Status Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>⚖️ Pendulum Governor</h2>
          <div style={styles.cardContent}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Status</span>
              <span style={styles.metricValue}>{governanceStatus.pendulumStatus}</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Last Decision</span>
              <span style={styles.metricValueSmall}>{governanceStatus.lastDecision.replace(/_/g, ' ')}</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Next Check</span>
              <span style={styles.metricValueSmall}>{formatTimestamp(governanceStatus.nextGovernanceCheck)}</span>
            </div>
            <div style={styles.autonomousIndicator}>
              <span style={styles.autonomousLabel}>Autonomous Governance:</span>
              <span style={{ ...styles.autonomousStatus, color: governanceStatus.isAutonomous ? '#10b981' : '#ef4444' }}>
                {governanceStatus.isAutonomous ? '✅ ACTIVE' : '❌ INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Economic Health Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏥 Economic Health</h2>
          <div style={styles.cardContent}>
            <div style={styles.healthIndicator}>
              <div style={styles.healthItem}>
                <span style={styles.healthLabel}>Reserve Backing</span>
                <span style={{ ...styles.healthStatus, color: fxReserve.reserveRatio >= 100 ? '#10b981' : '#ef4444' }}>
                  {fxReserve.reserveRatio >= 100 ? '✅ Healthy' : '⚠️ Warning'}
                </span>
              </div>
              <div style={styles.healthItem}>
                <span style={styles.healthLabel}>Supply Balance</span>
                <span style={{ ...styles.healthStatus, color: getHealthColor(supplyStatus.supplyHealth) }}>
                  {supplyStatus.supplyHealth === 'HEALTHY' ? '✅ Healthy' : supplyStatus.supplyHealth === 'WARNING' ? '⚠️ Warning' : '🚨 Critical'}
                </span>
              </div>
              <div style={styles.healthItem}>
                <span style={styles.healthLabel}>Dividend Flow</span>
                <span style={{ ...styles.healthStatus, color: '#10b981' }}>✅ Active</span>
              </div>
              <div style={styles.healthItem}>
                <span style={styles.healthLabel}>Ghost Detection</span>
                <span style={{ ...styles.healthStatus, color: '#10b981' }}>✅ Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          🔐 Sovereign. ✅ Verified. ⚡ Biological.
        </p>
        <p style={styles.footerText}>
          "The era of the central banker is over. The era of the heartbeat has begun."
        </p>
        <p style={styles.footerSubtext}>
          Born in Lagos, Nigeria. Built for the World. 🌍
        </p>
      </footer>
    </div>
  );
};

// ============ STYLES ============

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    minHeight: '100vh',
    padding: '2rem',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '1.25rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #334155',
    borderTop: '4px solid '#10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  statusBadge: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  badge: {
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#fff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    border: '1px solid #334155',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#f1f5f9',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metricRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
  },
  metricLabel: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#10b981',
  },
  metricValueSmall: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.5rem',
  },
  progressBar: {
    marginTop: '1rem',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginBottom: '0.5rem',
  },
  progressTrack: {
    width: '100%',
    height: '12px',
    backgroundColor: '#334155',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  autonomousIndicator: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#0f172a',
    borderRadius: '0.5rem',
    marginTop: '1rem',
  },
  autonomousLabel: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  autonomousStatus: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  healthIndicator: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  healthItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#0f172a',
    borderRadius: '0.5rem',
  },
  healthLabel: {
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
  healthStatus: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '1px solid #334155',
  },
  footerText: {
    fontSize: '1rem',
    color: '#94a3b8',
    marginBottom: '0.5rem',
  },
  footerSubtext: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
};

