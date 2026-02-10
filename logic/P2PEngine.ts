/**
 * P2P Engine - Matched-Order System for V-Bridge
 * 
 * Instant 1-second settlement for VIDA sales.
 * 
 * Logic:
 * - User sells VIDA → Instantly paired with Corporate Buy Order
 * - Corporate orders pre-funded in LiquidityVault
 * - Sub-second matching algorithm
 * - Guaranteed liquidity for all users
 * 
 * "Sell VIDA. Get Naira. In 1 second."
 * 
 * Born in Lagos, Nigeria. Built for Instant Settlement.
 */

// ============ TYPES ============

export interface UserSellOrder {
  orderId: string;
  userId: string;
  vidaAmount: number;
  expectedNaira: number;
  timestamp: number;
  status: 'PENDING' | 'MATCHED' | 'FULFILLED' | 'FAILED';
  matchedCorporate?: string;
  fulfilledAt?: number;
  settlementTime?: number; // Milliseconds to settle
}

export interface CorporateBuyOrder {
  orderId: string;
  corporateId: string;
  companyName: string;
  maxVidaAmount: number; // Maximum VIDA willing to buy
  remainingVida: number; // Remaining capacity
  pricePerVida: number; // Price in nVIDA
  isActive: boolean;
  totalFulfilled: number;
  createdAt: number;
}

export interface MatchResult {
  success: boolean;
  orderId: string;
  matchedCorporate: string;
  vidaAmount: number;
  nairaAmount: number;
  settlementTime: number; // Milliseconds
  txHash?: string;
}

export interface OrderBook {
  activeSellOrders: UserSellOrder[];
  activeBuyOrders: CorporateBuyOrder[];
  totalSellVolume: number;
  totalBuyVolume: number;
  matchRate: number; // % of orders matched
}

// ============ CONSTANTS ============

const TARGET_SETTLEMENT_TIME = 1000; // 1 second target
const MAX_SETTLEMENT_TIME = 3000; // 3 second maximum
const ORDER_EXPIRY = 60000; // 60 seconds

// ============ STATE ============

const sellOrders = new Map<string, UserSellOrder>();
const buyOrders = new Map<string, CorporateBuyOrder>();
const matchHistory: MatchResult[] = [];

let totalOrdersMatched = 0;
let totalOrdersFailed = 0;
let averageSettlementTime = 0;

// ============ CORE MATCHING ENGINE ============

/**
 * Create user sell order and instantly match with corporate buy
 * @param userId User's VIDA ID
 * @param vidaAmount Amount of VIDA to sell
 * @param currentPrice Current VIDA price in nVIDA
 * @returns Match result
 */
export async function createAndMatchSellOrder(
  userId: string,
  vidaAmount: number,
  currentPrice: number
): Promise<MatchResult> {
  const startTime = Date.now();
  
  // Generate order ID
  const orderId = `sell_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Calculate expected Naira
  const expectedNaira = vidaAmount * currentPrice;
  
  // Create sell order
  const sellOrder: UserSellOrder = {
    orderId,
    userId,
    vidaAmount,
    expectedNaira,
    timestamp: Date.now(),
    status: 'PENDING',
  };
  
  sellOrders.set(orderId, sellOrder);
  
  // Find matching corporate buy order
  const matchedBuyOrder = findBestMatch(vidaAmount, currentPrice);
  
  if (!matchedBuyOrder) {
    // No match found - create vault order
    const vaultMatch = await matchWithVault(sellOrder);
    
    const settlementTime = Date.now() - startTime;
    
    if (vaultMatch.success) {
      sellOrder.status = 'FULFILLED';
      sellOrder.fulfilledAt = Date.now();
      sellOrder.settlementTime = settlementTime;
      
      totalOrdersMatched++;
      updateAverageSettlementTime(settlementTime);
      
      matchHistory.push(vaultMatch);
      
      return vaultMatch;
    } else {
      sellOrder.status = 'FAILED';
      totalOrdersFailed++;
      
      return {
        success: false,
        orderId,
        matchedCorporate: '',
        vidaAmount,
        nairaAmount: 0,
        settlementTime: Date.now() - startTime,
      };
    }
  }
  
  // Match found - execute trade
  const matchResult = await executeTrade(sellOrder, matchedBuyOrder);
  
  const settlementTime = Date.now() - startTime;
  matchResult.settlementTime = settlementTime;
  
  if (matchResult.success) {
    sellOrder.status = 'FULFILLED';
    sellOrder.matchedCorporate = matchedBuyOrder.corporateId;
    sellOrder.fulfilledAt = Date.now();
    sellOrder.settlementTime = settlementTime;
    
    // Update buy order
    matchedBuyOrder.remainingVida -= vidaAmount;
    matchedBuyOrder.totalFulfilled += vidaAmount;
    
    if (matchedBuyOrder.remainingVida <= 0) {
      matchedBuyOrder.isActive = false;
    }
    
    totalOrdersMatched++;
    updateAverageSettlementTime(settlementTime);
    
    console.log(`[P2P Engine] ✅ Order matched in ${settlementTime}ms`);
  } else {
    sellOrder.status = 'FAILED';
    totalOrdersFailed++;
    
    console.log(`[P2P Engine] ❌ Order failed after ${settlementTime}ms`);
  }
  
  matchHistory.push(matchResult);
  
  return matchResult;
}

/**
 * Find best matching corporate buy order
 */
function findBestMatch(vidaAmount: number, currentPrice: number): CorporateBuyOrder | null {
  let bestMatch: CorporateBuyOrder | null = null;
  
  for (const buyOrder of buyOrders.values()) {
    if (!buyOrder.isActive) continue;
    if (buyOrder.remainingVida < vidaAmount) continue;
    
    // Check if price is acceptable (within 1% of current price)
    const priceDiff = Math.abs(buyOrder.pricePerVida - currentPrice) / currentPrice;
    if (priceDiff > 0.01) continue;
    
    // First valid match is best match (FIFO)
    if (!bestMatch) {
      bestMatch = buyOrder;
      break;
    }
  }
  
  return bestMatch;
}

/**
 * Execute trade between user and corporate
 */
async function executeTrade(
  sellOrder: UserSellOrder,
  buyOrder: CorporateBuyOrder
): Promise<MatchResult> {
  try {
    // In production, call smart contract to execute trade
    // For now, simulate instant settlement
    
    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    
    return {
      success: true,
      orderId: sellOrder.orderId,
      matchedCorporate: buyOrder.corporateId,
      vidaAmount: sellOrder.vidaAmount,
      nairaAmount: sellOrder.expectedNaira,
      settlementTime: 0, // Will be set by caller
      txHash,
    };
  } catch (error) {
    console.error('[P2P Engine] Trade execution failed:', error);
    
    return {
      success: false,
      orderId: sellOrder.orderId,
      matchedCorporate: buyOrder.corporateId,
      vidaAmount: sellOrder.vidaAmount,
      nairaAmount: 0,
      settlementTime: 0,
    };
  }
}

/**
 * Match with LiquidityVault (fallback)
 */
async function matchWithVault(sellOrder: UserSellOrder): Promise<MatchResult> {
  try {
    // In production, call LiquidityVault.createSellOrder()
    // Then immediately fulfill with pre-funded corporate order

    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    return {
      success: true,
      orderId: sellOrder.orderId,
      matchedCorporate: 'LIQUIDITY_VAULT',
      vidaAmount: sellOrder.vidaAmount,
      nairaAmount: sellOrder.expectedNaira,
      settlementTime: 0,
      txHash,
    };
  } catch (error) {
    console.error('[P2P Engine] Vault matching failed:', error);

    return {
      success: false,
      orderId: sellOrder.orderId,
      matchedCorporate: '',
      vidaAmount: sellOrder.vidaAmount,
      nairaAmount: 0,
      settlementTime: 0,
    };
  }
}

// ============ CORPORATE BUY ORDER MANAGEMENT ============

/**
 * Create corporate buy order
 */
export function createCorporateBuyOrder(
  corporateId: string,
  companyName: string,
  maxVidaAmount: number,
  pricePerVida: number
): string {
  const orderId = `buy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const buyOrder: CorporateBuyOrder = {
    orderId,
    corporateId,
    companyName,
    maxVidaAmount,
    remainingVida: maxVidaAmount,
    pricePerVida,
    isActive: true,
    totalFulfilled: 0,
    createdAt: Date.now(),
  };

  buyOrders.set(orderId, buyOrder);

  console.log(`[P2P Engine] 📝 Corporate buy order created: ${companyName} - ${maxVidaAmount} VIDA`);

  return orderId;
}

/**
 * Cancel corporate buy order
 */
export function cancelCorporateBuyOrder(orderId: string): boolean {
  const buyOrder = buyOrders.get(orderId);

  if (!buyOrder) return false;

  buyOrder.isActive = false;

  console.log(`[P2P Engine] ❌ Corporate buy order cancelled: ${orderId}`);

  return true;
}

// ============ ORDER BOOK MANAGEMENT ============

/**
 * Get current order book
 */
export function getOrderBook(): OrderBook {
  const activeSellOrders = Array.from(sellOrders.values()).filter(
    (order) => order.status === 'PENDING' || order.status === 'MATCHED'
  );

  const activeBuyOrders = Array.from(buyOrders.values()).filter((order) => order.isActive);

  const totalSellVolume = activeSellOrders.reduce((sum, order) => sum + order.vidaAmount, 0);
  const totalBuyVolume = activeBuyOrders.reduce((sum, order) => sum + order.remainingVida, 0);

  const totalOrders = totalOrdersMatched + totalOrdersFailed;
  const matchRate = totalOrders > 0 ? (totalOrdersMatched / totalOrders) * 100 : 0;

  return {
    activeSellOrders,
    activeBuyOrders,
    totalSellVolume,
    totalBuyVolume,
    matchRate,
  };
}

/**
 * Get order status
 */
export function getOrderStatus(orderId: string): UserSellOrder | undefined {
  return sellOrders.get(orderId);
}

/**
 * Get match history
 */
export function getMatchHistory(limit: number = 100): MatchResult[] {
  return matchHistory.slice(-limit);
}

// ============ STATISTICS ============

/**
 * Update average settlement time
 */
function updateAverageSettlementTime(newTime: number): void {
  if (totalOrdersMatched === 1) {
    averageSettlementTime = newTime;
  } else {
    averageSettlementTime = (averageSettlementTime * (totalOrdersMatched - 1) + newTime) / totalOrdersMatched;
  }
}

/**
 * Get engine statistics
 */
export function getEngineStats(): {
  totalMatched: number;
  totalFailed: number;
  matchRate: number;
  averageSettlementTime: number;
  activeSellOrders: number;
  activeBuyOrders: number;
} {
  const totalOrders = totalOrdersMatched + totalOrdersFailed;
  const matchRate = totalOrders > 0 ? (totalOrdersMatched / totalOrders) * 100 : 0;

  const activeSellOrders = Array.from(sellOrders.values()).filter(
    (order) => order.status === 'PENDING' || order.status === 'MATCHED'
  ).length;

  const activeBuyOrders = Array.from(buyOrders.values()).filter((order) => order.isActive).length;

  return {
    totalMatched: totalOrdersMatched,
    totalFailed: totalOrdersFailed,
    matchRate,
    averageSettlementTime,
    activeSellOrders,
    activeBuyOrders,
  };
}

/**
 * Check if settlement time meets target
 */
export function isSettlementTimeAcceptable(settlementTime: number): boolean {
  return settlementTime <= TARGET_SETTLEMENT_TIME;
}

/**
 * Get settlement time status
 */
export function getSettlementStatus(): {
  target: number;
  average: number;
  status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'SLOW';
} {
  let status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'SLOW';

  if (averageSettlementTime <= TARGET_SETTLEMENT_TIME) {
    status = 'EXCELLENT';
  } else if (averageSettlementTime <= TARGET_SETTLEMENT_TIME * 1.5) {
    status = 'GOOD';
  } else if (averageSettlementTime <= MAX_SETTLEMENT_TIME) {
    status = 'ACCEPTABLE';
  } else {
    status = 'SLOW';
  }

  return {
    target: TARGET_SETTLEMENT_TIME,
    average: averageSettlementTime,
    status,
  };
}

// ============ CLEANUP ============

/**
 * Clean up expired orders
 */
export function cleanupExpiredOrders(): number {
  const now = Date.now();
  let cleaned = 0;

  // Clean sell orders
  for (const [orderId, order] of sellOrders.entries()) {
    if (order.status === 'PENDING' && now - order.timestamp > ORDER_EXPIRY) {
      order.status = 'FAILED';
      totalOrdersFailed++;
      cleaned++;
    }
  }

  console.log(`[P2P Engine] 🧹 Cleaned ${cleaned} expired orders`);

  return cleaned;
}

/**
 * Start automatic cleanup interval
 */
export function startCleanupInterval(): void {
  setInterval(() => {
    cleanupExpiredOrders();
  }, 60000); // Every minute

  console.log('[P2P Engine] 🚀 Cleanup interval started');
}

// ============ TESTING & SIMULATION ============

/**
 * Simulate high-volume trading
 */
export async function simulateTrading(
  numOrders: number,
  vidaAmountRange: [number, number],
  currentPrice: number
): Promise<void> {
  console.log(`[P2P Engine] 🧪 Simulating ${numOrders} orders...`);

  // Create corporate buy orders
  for (let i = 0; i < 5; i++) {
    createCorporateBuyOrder(
      `corp_${i}`,
      `Corporation ${i}`,
      1000000, // 1M VIDA capacity
      currentPrice
    );
  }

  const results: MatchResult[] = [];

  for (let i = 0; i < numOrders; i++) {
    const vidaAmount = Math.random() * (vidaAmountRange[1] - vidaAmountRange[0]) + vidaAmountRange[0];

    const result = await createAndMatchSellOrder(`user_${i}`, vidaAmount, currentPrice);

    results.push(result);
  }

  const successRate = (results.filter((r) => r.success).length / results.length) * 100;
  const avgTime = results.reduce((sum, r) => sum + r.settlementTime, 0) / results.length;

  console.log(`[P2P Engine] ✅ Simulation complete:`);
  console.log(`  - Success rate: ${successRate.toFixed(2)}%`);
  console.log(`  - Average settlement time: ${avgTime.toFixed(0)}ms`);
}

