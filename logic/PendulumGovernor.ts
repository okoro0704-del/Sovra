/**
 * Pendulum Governor - The Supply Brain
 * 
 * Autonomous supply management for VIDA token to maintain
 * "Hardly Depreciate" classification.
 * 
 * Logic:
 * - IF Supply > 750M AND nVIDA inflation > 2% → INCREASE Burn Rate to 3%
 * - IF Supply < 500M AND nVIDA liquidity < 1B → REACTIVATE Minting at 5 VIDA per user
 * 
 * Ensures economic stability without human intervention.
 * 
 * "The era of the central banker is over. The era of the algorithm has begun."
 * 
 * Born in Lagos, Nigeria. Governed by Mathematics.
 */

// ============ TYPES ============

export interface SupplyMetrics {
  currentSupply: number; // Current VIDA supply
  totalBurned: number; // Total VIDA burned
  supplyFloor: number; // 500M
  supplyCeiling: number; // 750M
  supplyCap: number; // 1B hard cap
  currentBurnRate: number; // Current burn rate (%)
  currentMintRate: number; // Current mint rate (VIDA per user)
}

export interface nVidaMetrics {
  totalSupply: number; // Total nVIDA in circulation
  inflationRate: number; // Annual inflation rate (%)
  liquidityPool: number; // Total nVIDA liquidity
  reserveRatio: number; // Reserve backing ratio (%)
}

export interface GovernanceDecision {
  timestamp: number;
  trigger: string;
  action: 'INCREASE_BURN' | 'DECREASE_BURN' | 'ACTIVATE_MINT' | 'DEACTIVATE_MINT' | 'NO_ACTION';
  oldBurnRate: number;
  newBurnRate: number;
  oldMintRate: number;
  newMintRate: number;
  reason: string;
  supplyMetrics: SupplyMetrics;
  nVidaMetrics: nVidaMetrics;
}

// ============ CONSTANTS ============

const SUPPLY_FLOOR = 500_000_000; // 500M VIDA
const SUPPLY_CEILING = 750_000_000; // 750M VIDA
const SUPPLY_CAP = 1_000_000_000; // 1B VIDA hard cap

const DEFAULT_BURN_RATE = 2; // 2% default
const EMERGENCY_BURN_RATE = 3; // 3% when supply exceeds ceiling
const REDUCED_BURN_RATE = 1; // 1% when supply near floor

const DEFAULT_MINT_RATE = 10; // 10 VIDA per user
const EMERGENCY_MINT_RATE = 5; // 5 VIDA per user when supply below floor

const NVIDA_INFLATION_THRESHOLD = 2; // 2% inflation threshold
const NVIDA_LIQUIDITY_THRESHOLD = 1_000_000_000; // 1B nVIDA liquidity threshold

const GOVERNANCE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// ============ STATE ============

let currentBurnRate = DEFAULT_BURN_RATE;
let currentMintRate = DEFAULT_MINT_RATE;
let isMintingActive = false;
let lastGovernanceCheck = Date.now();

const governanceHistory: GovernanceDecision[] = [];

// ============ CORE GOVERNANCE LOGIC ============

/**
 * Execute autonomous governance decision
 * @param supplyMetrics Current VIDA supply metrics
 * @param nVidaMetrics Current nVIDA metrics
 * @returns Governance decision
 */
export async function executeGovernance(
  supplyMetrics: SupplyMetrics,
  nVidaMetrics: nVidaMetrics
): Promise<GovernanceDecision> {
  const timestamp = Date.now();
  
  // Check if governance interval has passed
  if (timestamp - lastGovernanceCheck < GOVERNANCE_INTERVAL) {
    return {
      timestamp,
      trigger: 'INTERVAL_NOT_REACHED',
      action: 'NO_ACTION',
      oldBurnRate: currentBurnRate,
      newBurnRate: currentBurnRate,
      oldMintRate: currentMintRate,
      newMintRate: currentMintRate,
      reason: 'Governance interval not reached',
      supplyMetrics,
      nVidaMetrics,
    };
  }
  
  lastGovernanceCheck = timestamp;
  
  const oldBurnRate = currentBurnRate;
  const oldMintRate = currentMintRate;
  
  let action: GovernanceDecision['action'] = 'NO_ACTION';
  let trigger = '';
  let reason = '';
  
  // ============ RULE 1: Supply > 750M AND nVIDA inflation > 2% ============
  if (supplyMetrics.currentSupply > SUPPLY_CEILING && nVidaMetrics.inflationRate > NVIDA_INFLATION_THRESHOLD) {
    // INCREASE BURN RATE TO 3%
    currentBurnRate = EMERGENCY_BURN_RATE;
    action = 'INCREASE_BURN';
    trigger = 'SUPPLY_CEILING_EXCEEDED';
    reason = `Supply exceeded ${SUPPLY_CEILING / 1_000_000}M and nVIDA inflation at ${nVidaMetrics.inflationRate}%`;
    
    console.log(`[Pendulum Governor] 🔥 EMERGENCY BURN ACTIVATED: ${currentBurnRate}%`);
  }
  
  // ============ RULE 2: Supply < 500M AND nVIDA liquidity < 1B ============
  else if (supplyMetrics.currentSupply < SUPPLY_FLOOR && nVidaMetrics.liquidityPool < NVIDA_LIQUIDITY_THRESHOLD) {
    // REACTIVATE MINTING AT 5 VIDA PER USER
    currentMintRate = EMERGENCY_MINT_RATE;
    isMintingActive = true;
    action = 'ACTIVATE_MINT';
    trigger = 'SUPPLY_FLOOR_BREACHED';
    reason = `Supply below ${SUPPLY_FLOOR / 1_000_000}M and nVIDA liquidity at ${nVidaMetrics.liquidityPool / 1_000_000}M`;
    
    console.log(`[Pendulum Governor] 💎 EMERGENCY MINTING ACTIVATED: ${currentMintRate} VIDA per user`);
  }
  
  // ============ RULE 3: Supply stabilized - return to defaults ============
  else if (
    supplyMetrics.currentSupply >= SUPPLY_FLOOR &&
    supplyMetrics.currentSupply <= SUPPLY_CEILING &&
    (currentBurnRate !== DEFAULT_BURN_RATE || isMintingActive)
  ) {
    // RETURN TO NORMAL PARAMETERS
    currentBurnRate = DEFAULT_BURN_RATE;
    currentMintRate = DEFAULT_MINT_RATE;
    isMintingActive = false;
    action = 'DECREASE_BURN';
    trigger = 'SUPPLY_STABILIZED';
    reason = `Supply stabilized at ${supplyMetrics.currentSupply / 1_000_000}M`;
    
    console.log(`[Pendulum Governor] ⚖️ EQUILIBRIUM RESTORED: Burn ${currentBurnRate}%, Mint inactive`);
  }
  
  // ============ RULE 4: Approaching hard cap - disable minting ============
  else if (supplyMetrics.currentSupply > SUPPLY_CAP * 0.95) {
    // DISABLE MINTING PERMANENTLY
    isMintingActive = false;
    currentMintRate = 0;
    action = 'DEACTIVATE_MINT';
    trigger = 'APPROACHING_HARD_CAP';
    reason = `Supply at ${(supplyMetrics.currentSupply / SUPPLY_CAP * 100).toFixed(1)}% of hard cap`;
    
    console.log(`[Pendulum Governor] 🚫 MINTING DISABLED: Approaching 1B hard cap`);
  }
  
  const decision: GovernanceDecision = {
    timestamp,
    trigger,
    action,
    oldBurnRate,
    newBurnRate: currentBurnRate,
    oldMintRate,
    newMintRate: currentMintRate,
    reason,
    supplyMetrics,
    nVidaMetrics,
  };
  
  governanceHistory.push(decision);

  return decision;
}

// ============ SUPPLY ORACLE INTEGRATION ============

/**
 * Get current governance parameters
 */
export function getGovernanceParameters(): {
  burnRate: number;
  mintRate: number;
  isMintingActive: boolean;
  lastCheck: number;
} {
  return {
    burnRate: currentBurnRate,
    mintRate: currentMintRate,
    isMintingActive,
    lastCheck: lastGovernanceCheck,
  };
}

/**
 * Calculate required burn amount for transaction
 * @param transactionAmount Transaction amount in VIDA
 * @returns Burn amount
 */
export function calculateBurnAmount(transactionAmount: number): number {
  return (transactionAmount * currentBurnRate) / 100;
}

/**
 * Calculate mint allocation for new user
 * @returns VIDA amount to mint
 */
export function calculateMintAllocation(): number {
  if (!isMintingActive) return 0;
  return currentMintRate;
}

/**
 * Check if minting is authorized
 */
export function isMintingAuthorized(): boolean {
  return isMintingActive;
}

// ============ METRICS COLLECTION ============

/**
 * Collect VIDA supply metrics
 * @param vidaContract VIDA token contract interface
 */
export async function collectSupplyMetrics(vidaContract: any): Promise<SupplyMetrics> {
  const currentSupply = await vidaContract.totalSupply();
  const totalBurned = await vidaContract.totalBurned();

  return {
    currentSupply: Number(currentSupply) / 1e18,
    totalBurned: Number(totalBurned) / 1e18,
    supplyFloor: SUPPLY_FLOOR,
    supplyCeiling: SUPPLY_CEILING,
    supplyCap: SUPPLY_CAP,
    currentBurnRate,
    currentMintRate,
  };
}

/**
 * Collect nVIDA metrics
 * @param nVidaContract nVIDA stablecoin contract interface
 */
export async function collectNVidaMetrics(nVidaContract: any): Promise<nVidaMetrics> {
  const totalSupply = await nVidaContract.totalSupply();
  const reserveBalance = await nVidaContract.getReserveBalance();

  // Calculate inflation rate (simplified - in production, use historical data)
  const inflationRate = 1.5; // Mock value - calculate from historical supply

  // Calculate liquidity pool (simplified)
  const liquidityPool = Number(totalSupply) / 1e18;

  // Calculate reserve ratio
  const reserveRatio = (Number(reserveBalance) / Number(totalSupply)) * 100;

  return {
    totalSupply: Number(totalSupply) / 1e18,
    inflationRate,
    liquidityPool,
    reserveRatio,
  };
}

// ============ GOVERNANCE HISTORY ============

/**
 * Get governance decision history
 */
export function getGovernanceHistory(): GovernanceDecision[] {
  return governanceHistory;
}

/**
 * Get latest governance decision
 */
export function getLatestDecision(): GovernanceDecision | undefined {
  return governanceHistory[governanceHistory.length - 1];
}

/**
 * Get governance statistics
 */
export function getGovernanceStats(): {
  totalDecisions: number;
  burnIncreases: number;
  burnDecreases: number;
  mintActivations: number;
  mintDeactivations: number;
  averageBurnRate: number;
} {
  const burnIncreases = governanceHistory.filter((d) => d.action === 'INCREASE_BURN').length;
  const burnDecreases = governanceHistory.filter((d) => d.action === 'DECREASE_BURN').length;
  const mintActivations = governanceHistory.filter((d) => d.action === 'ACTIVATE_MINT').length;
  const mintDeactivations = governanceHistory.filter((d) => d.action === 'DEACTIVATE_MINT').length;

  const averageBurnRate =
    governanceHistory.length > 0
      ? governanceHistory.reduce((sum, d) => sum + d.newBurnRate, 0) / governanceHistory.length
      : DEFAULT_BURN_RATE;

  return {
    totalDecisions: governanceHistory.length,
    burnIncreases,
    burnDecreases,
    mintActivations,
    mintDeactivations,
    averageBurnRate,
  };
}

// ============ SIMULATION & TESTING ============

/**
 * Simulate governance decision (for testing)
 */
export function simulateGovernance(
  currentSupply: number,
  nVidaInflation: number,
  nVidaLiquidity: number
): GovernanceDecision {
  const supplyMetrics: SupplyMetrics = {
    currentSupply,
    totalBurned: 0,
    supplyFloor: SUPPLY_FLOOR,
    supplyCeiling: SUPPLY_CEILING,
    supplyCap: SUPPLY_CAP,
    currentBurnRate,
    currentMintRate,
  };

  const nVidaMetrics: nVidaMetrics = {
    totalSupply: nVidaLiquidity,
    inflationRate: nVidaInflation,
    liquidityPool: nVidaLiquidity,
    reserveRatio: 100,
  };

  // Temporarily bypass interval check for simulation
  const originalLastCheck = lastGovernanceCheck;
  lastGovernanceCheck = 0;

  const decision = executeGovernance(supplyMetrics, nVidaMetrics);

  lastGovernanceCheck = originalLastCheck;

  return decision as any;
}

/**
 * Reset governance state (for testing)
 */
export function resetGovernance(): void {
  currentBurnRate = DEFAULT_BURN_RATE;
  currentMintRate = DEFAULT_MINT_RATE;
  isMintingActive = false;
  lastGovernanceCheck = Date.now();
  governanceHistory.length = 0;
}

// ============ AUTONOMOUS EXECUTION ============

/**
 * Start autonomous governance loop
 * @param vidaContract VIDA token contract
 * @param nVidaContract nVIDA stablecoin contract
 * @param governanceContract Governance root contract
 */
export async function startAutonomousGovernance(
  vidaContract: any,
  nVidaContract: any,
  governanceContract: any
): Promise<void> {
  console.log('[Pendulum Governor] 🚀 Starting autonomous governance...');

  setInterval(async () => {
    try {
      // Collect metrics
      const supplyMetrics = await collectSupplyMetrics(vidaContract);
      const nVidaMetrics = await collectNVidaMetrics(nVidaContract);

      // Execute governance
      const decision = await executeGovernance(supplyMetrics, nVidaMetrics);

      // Apply decision to on-chain governance
      if (decision.action !== 'NO_ACTION') {
        console.log(`[Pendulum Governor] 📊 Decision: ${decision.action} - ${decision.reason}`);

        // Update on-chain parameters
        if (decision.action === 'INCREASE_BURN' || decision.action === 'DECREASE_BURN') {
          await governanceContract.updateBurnRate(decision.newBurnRate);
        }

        if (decision.action === 'ACTIVATE_MINT') {
          await governanceContract.activateMinting(decision.newMintRate);
        }

        if (decision.action === 'DEACTIVATE_MINT') {
          await governanceContract.deactivateMinting();
        }
      }
    } catch (error) {
      console.error('[Pendulum Governor] ❌ Error in governance execution:', error);
    }
  }, GOVERNANCE_INTERVAL);
}

/**
 * Get system health status
 */
export function getSystemHealth(supplyMetrics: SupplyMetrics, nVidaMetrics: nVidaMetrics): {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

  // Check supply bounds
  if (supplyMetrics.currentSupply > SUPPLY_CEILING) {
    issues.push(`Supply exceeds ceiling: ${supplyMetrics.currentSupply / 1_000_000}M / ${SUPPLY_CEILING / 1_000_000}M`);
    recommendations.push('Increase burn rate to reduce supply');
    status = 'WARNING';
  }

  if (supplyMetrics.currentSupply < SUPPLY_FLOOR) {
    issues.push(`Supply below floor: ${supplyMetrics.currentSupply / 1_000_000}M / ${SUPPLY_FLOOR / 1_000_000}M`);
    recommendations.push('Activate minting to increase supply');
    status = 'WARNING';
  }

  // Check nVIDA inflation
  if (nVidaMetrics.inflationRate > NVIDA_INFLATION_THRESHOLD) {
    issues.push(`nVIDA inflation high: ${nVidaMetrics.inflationRate}%`);
    recommendations.push('Increase VIDA burn to reduce nVIDA supply pressure');
    status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
  }

  // Check liquidity
  if (nVidaMetrics.liquidityPool < NVIDA_LIQUIDITY_THRESHOLD) {
    issues.push(`nVIDA liquidity low: ${nVidaMetrics.liquidityPool / 1_000_000}M`);
    recommendations.push('Consider activating VIDA minting to boost liquidity');
    status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
  }

  // Check hard cap proximity
  if (supplyMetrics.currentSupply > SUPPLY_CAP * 0.95) {
    issues.push(`Approaching hard cap: ${(supplyMetrics.currentSupply / SUPPLY_CAP * 100).toFixed(1)}%`);
    recommendations.push('Disable minting permanently');
    status = 'CRITICAL';
  }

  return { status, issues, recommendations };
}

