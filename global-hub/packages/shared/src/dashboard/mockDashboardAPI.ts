/**
 * SOVRA Unified Dashboard - Mock API Service
 * 
 * Provides mock data for testing the SOVRA Unified Dashboard
 * In production, replace with real API calls to:
 * - SOVRA_Presence_Engine endpoints (PFF liveness metrics)
 * - SOVRA_Sovereign_Kernel endpoints (blockchain metrics)
 */

import type { PresenceMetrics, SovereignMetrics } from './SOVRAUnifiedDashboard';

/**
 * Mock Presence Metrics (SOVRA_Presence_Engine)
 * 
 * In production, fetch from: GET /api/v1/presence/metrics
 */
export function getMockPresenceMetrics(): PresenceMetrics {
  return {
    // Human Presence Count
    totalLivenessChecks: 1_234_567,
    activeLiveUsers: 45_678, // Last 24h
    livenessSuccessRate: 98.7,
    averageConfidenceScore: 96.3,
    screenReplayBlocked: 1_234,
    deepfakeBlocked: 567,
    
    // Real-time stats
    checksLast1Hour: 3_456,
    checksLast24Hours: 45_678,
    peakHourlyRate: 5_234,
  };
}

/**
 * Mock Sovereign Metrics (SOVRA_Sovereign_Kernel)
 * 
 * In production, fetch from: GET /api/v1/sovereign/metrics
 */
export function getMockSovereignMetrics(): SovereignMetrics {
  return {
    // Network Transaction Volume
    totalTransactions: 5_678_901,
    transactionsLast24h: 123_456,
    totalSOVMinted: '12345678.50', // SOV units
    totalSOVBurned: '1234.25', // SOV units
    circulatingSupply: '12344444.25', // SOV units
    
    // Spoke synchronization
    activeSpokeCount: 12,
    totalVerifications: 1_234_567,
    averageBlockTime: 6.5, // seconds
    
    // Real-time stats
    transactionsPerSecond: 45.3,
    currentBlockHeight: 1_234_567,
  };
}

/**
 * Mock API Server
 * 
 * Simulates API endpoints for dashboard testing
 */
export class MockDashboardAPI {
  private presenceMetrics: PresenceMetrics;
  private sovereignMetrics: SovereignMetrics;
  
  constructor() {
    this.presenceMetrics = getMockPresenceMetrics();
    this.sovereignMetrics = getMockSovereignMetrics();
    
    // Simulate real-time updates
    this.startRealTimeSimulation();
  }
  
  /**
   * Get presence metrics
   */
  async getPresenceMetrics(): Promise<PresenceMetrics> {
    // Simulate network delay
    await this.delay(100);
    return { ...this.presenceMetrics };
  }
  
  /**
   * Get sovereign metrics
   */
  async getSovereignMetrics(): Promise<SovereignMetrics> {
    // Simulate network delay
    await this.delay(100);
    return { ...this.sovereignMetrics };
  }
  
  /**
   * Start real-time simulation
   * Updates metrics every second to simulate live data
   */
  private startRealTimeSimulation() {
    setInterval(() => {
      // Update presence metrics
      this.presenceMetrics.totalLivenessChecks += Math.floor(Math.random() * 10);
      this.presenceMetrics.checksLast1Hour += Math.floor(Math.random() * 5);
      this.presenceMetrics.activeLiveUsers += Math.floor(Math.random() * 3) - 1;
      
      // Occasionally block fraud
      if (Math.random() > 0.95) {
        this.presenceMetrics.screenReplayBlocked += 1;
      }
      if (Math.random() > 0.98) {
        this.presenceMetrics.deepfakeBlocked += 1;
      }
      
      // Update sovereign metrics
      this.sovereignMetrics.totalTransactions += Math.floor(Math.random() * 50);
      this.sovereignMetrics.transactionsLast24h += Math.floor(Math.random() * 20);
      this.sovereignMetrics.currentBlockHeight += Math.random() > 0.5 ? 1 : 0;
      this.sovereignMetrics.transactionsPerSecond = 30 + Math.random() * 30;
      
      // Update SOV supply
      const mintedIncrease = (Math.random() * 10).toFixed(2);
      this.sovereignMetrics.totalSOVMinted = (
        parseFloat(this.sovereignMetrics.totalSOVMinted) + parseFloat(mintedIncrease)
      ).toFixed(2);
      
      const burnedIncrease = (Math.random() * 2).toFixed(2);
      this.sovereignMetrics.totalSOVBurned = (
        parseFloat(this.sovereignMetrics.totalSOVBurned) + parseFloat(burnedIncrease)
      ).toFixed(2);
      
      this.sovereignMetrics.circulatingSupply = (
        parseFloat(this.sovereignMetrics.totalSOVMinted) - 
        parseFloat(this.sovereignMetrics.totalSOVBurned)
      ).toFixed(2);
    }, 1000);
  }
  
  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MockDashboardAPI;

