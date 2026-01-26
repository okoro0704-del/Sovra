/**
 * SOVRA Unified Dashboard
 * 
 * Displays real-time metrics from both SOVRA components:
 * - SOVRA_Presence_Engine: Human Presence Count (PFF liveness verifications)
 * - SOVRA_Sovereign_Kernel: Network Transaction Volume (blockchain activity)
 */

import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PresenceMetrics {
  // Human Presence Count (from PFF)
  totalLivenessChecks: number;
  activeLiveUsers: number; // Users verified in last 24h
  livenessSuccessRate: number; // Percentage
  averageConfidenceScore: number; // 0-100
  screenReplayBlocked: number;
  deepfakeBlocked: number;
  
  // Real-time stats
  checksLast1Hour: number;
  checksLast24Hours: number;
  peakHourlyRate: number;
}

export interface SovereignMetrics {
  // Network Transaction Volume (from SOVRN blockchain)
  totalTransactions: number;
  transactionsLast24h: number;
  totalSOVMinted: string; // In SOV units
  totalSOVBurned: string; // In SOV units
  circulatingSupply: string; // In SOV units
  
  // Spoke synchronization
  activeSpokeCount: number;
  totalVerifications: number;
  averageBlockTime: number; // In seconds
  
  // Real-time stats
  transactionsPerSecond: number;
  currentBlockHeight: number;
}

export interface UnifiedDashboardProps {
  // API endpoints
  presenceApiEndpoint: string;
  sovereignApiEndpoint: string;
  
  // Refresh interval (ms)
  refreshInterval?: number;
  
  // Theme
  theme?: 'light' | 'dark';
}

// ============================================================================
// SOVRA UNIFIED DASHBOARD COMPONENT
// ============================================================================

export const SOVRAUnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  presenceApiEndpoint,
  sovereignApiEndpoint,
  refreshInterval = 5000, // 5 seconds default
  theme = 'dark',
}) => {
  const [presenceMetrics, setPresenceMetrics] = useState<PresenceMetrics | null>(null);
  const [sovereignMetrics, setSovereignMetrics] = useState<SovereignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics from APIs
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch presence metrics (PFF)
        const presenceResponse = await fetch(`${presenceApiEndpoint}/metrics`);
        const presenceData = await presenceResponse.json();
        setPresenceMetrics(presenceData);
        
        // Fetch sovereign metrics (blockchain)
        const sovereignResponse = await fetch(`${sovereignApiEndpoint}/metrics`);
        const sovereignData = await sovereignResponse.json();
        setSovereignMetrics(sovereignData);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [presenceApiEndpoint, sovereignApiEndpoint, refreshInterval]);

  // Theme styles
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const accentPresence = '#10b981'; // Green for presence
  const accentSovereign = '#3b82f6'; // Blue for sovereign

  if (loading && !presenceMetrics && !sovereignMetrics) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: textPrimary }}>
        Loading SOVRA Unified Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: bgColor,
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: textPrimary,
          marginBottom: '0.5rem',
        }}>
          SOVRA Unified Dashboard
        </h1>
        <p style={{ fontSize: '1.125rem', color: textSecondary }}>
          Unified Presence & Sovereignty Protocol
        </p>
      </div>

      {/* Main Grid: Side-by-Side Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem',
      }}>

        {/* LEFT PANEL: SOVRA_Presence_Engine (PFF) */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: `2px solid ${accentPresence}`,
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: accentPresence,
              marginBottom: '0.5rem',
            }}>
              🧠 SOVRA_Presence_Engine
            </h2>
            <p style={{ fontSize: '0.875rem', color: textSecondary }}>
              Human Presence Count (PFF Liveness Detection)
            </p>
          </div>

          {presenceMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Total Liveness Checks */}
              <MetricCard
                label="Total Liveness Checks"
                value={presenceMetrics.totalLivenessChecks.toLocaleString()}
                color={accentPresence}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Active Live Users (24h) */}
              <MetricCard
                label="Active Live Users (24h)"
                value={presenceMetrics.activeLiveUsers.toLocaleString()}
                color={accentPresence}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Success Rate */}
              <MetricCard
                label="Liveness Success Rate"
                value={`${presenceMetrics.livenessSuccessRate.toFixed(1)}%`}
                color={accentPresence}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Average Confidence */}
              <MetricCard
                label="Average Confidence Score"
                value={`${presenceMetrics.averageConfidenceScore.toFixed(1)}/100`}
                color={accentPresence}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Fraud Prevention */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${textSecondary}40`,
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: textSecondary,
                  marginBottom: '0.5rem',
                }}>
                  Fraud Prevention
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Screen Replay Blocked:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {presenceMetrics.screenReplayBlocked.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Deepfake Blocked:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {presenceMetrics.deepfakeBlocked.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Real-time Stats */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${textSecondary}40`,
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: textSecondary,
                  marginBottom: '0.5rem',
                }}>
                  Real-time Activity
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Last 1 Hour:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textPrimary }}>
                    {presenceMetrics.checksLast1Hour.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Last 24 Hours:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textPrimary }}>
                    {presenceMetrics.checksLast24Hours.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Peak Hourly Rate:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: accentPresence }}>
                    {presenceMetrics.peakHourlyRate.toLocaleString()}/hr
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: SOVRA_Sovereign_Kernel (Blockchain) */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: `2px solid ${accentSovereign}`,
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: accentSovereign,
              marginBottom: '0.5rem',
            }}>
              ⛓️ SOVRA_Sovereign_Kernel
            </h2>
            <p style={{ fontSize: '0.875rem', color: textSecondary }}>
              Network Transaction Volume (Blockchain Activity)
            </p>
          </div>

          {sovereignMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Total Transactions */}
              <MetricCard
                label="Total Transactions"
                value={sovereignMetrics.totalTransactions.toLocaleString()}
                color={accentSovereign}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Transactions (24h) */}
              <MetricCard
                label="Transactions (24h)"
                value={sovereignMetrics.transactionsLast24h.toLocaleString()}
                color={accentSovereign}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Total SOV Minted */}
              <MetricCard
                label="Total SOV Minted"
                value={`${parseFloat(sovereignMetrics.totalSOVMinted).toLocaleString()} SOV`}
                color={accentSovereign}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Circulating Supply */}
              <MetricCard
                label="Circulating Supply"
                value={`${parseFloat(sovereignMetrics.circulatingSupply).toLocaleString()} SOV`}
                color={accentSovereign}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />

              {/* Spoke Synchronization */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${textSecondary}40`,
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: textSecondary,
                  marginBottom: '0.5rem',
                }}>
                  Spoke Synchronization
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Active Spokes:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: accentPresence }}>
                    {sovereignMetrics.activeSpokeCount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Total Verifications:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textPrimary }}>
                    {sovereignMetrics.totalVerifications.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Avg Block Time:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textPrimary }}>
                    {sovereignMetrics.averageBlockTime.toFixed(2)}s
                  </span>
                </div>
              </div>

              {/* Real-time Stats */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${textSecondary}40`,
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: textSecondary,
                  marginBottom: '0.5rem',
                }}>
                  Real-time Network
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Transactions/Second:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: accentSovereign }}>
                    {sovereignMetrics.transactionsPerSecond.toFixed(2)} TPS
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    Current Block Height:
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textPrimary }}>
                    {sovereignMetrics.currentBlockHeight.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: textSecondary }}>
                    SOV Burned (24h):
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {parseFloat(sovereignMetrics.totalSOVBurned).toLocaleString()} SOV
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '2rem',
        paddingTop: '2rem',
        borderTop: `1px solid ${textSecondary}40`,
      }}>
        <p style={{ fontSize: '0.875rem', color: textSecondary }}>
          SOVRA Protocol v1.0.0 | Unified Presence & Sovereignty Protocol
        </p>
        <p style={{ fontSize: '0.75rem', color: textSecondary, marginTop: '0.5rem' }}>
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  color: string;
  textPrimary: string;
  textSecondary: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  color,
  textPrimary,
  textSecondary
}) => (
  <div style={{
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: `${color}10`,
    border: `1px solid ${color}30`,
  }}>
    <p style={{
      fontSize: '0.875rem',
      color: textSecondary,
      marginBottom: '0.25rem',
    }}>
      {label}
    </p>
    <p style={{
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: textPrimary,
    }}>
      {value}
    </p>
  </div>
);

export default SOVRAUnifiedDashboard;

