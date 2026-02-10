/**
 * Price Oracle - Real-Time VIDA/nVIDA Exchange Rate
 * 
 * Provides real-time exchange rate between:
 * - VIDA (Ѵ): Elastic growth asset
 * - nVIDA: Stable spending asset (1:1 NGN peg)
 * 
 * The oracle calculates VIDA's market value relative to the stable nVIDA,
 * enabling users to understand their purchasing power in both assets.
 * 
 * Born in Lagos, Nigeria. Powered by Market Forces.
 */

// ============ TYPES ============

export interface PriceData {
  vidaPrice: number; // VIDA price in nVIDA (e.g., 1 VIDA = 1.5 nVIDA)
  nVidaPrice: number; // nVIDA price in VIDA (e.g., 1 nVIDA = 0.67 VIDA)
  vidaPriceNgn: number; // VIDA price in NGN
  nVidaPriceNgn: number; // nVIDA price in NGN (always 1.0)
  timestamp: number;
  source: 'MARKET' | 'ORACLE' | 'CALCULATED';
}

export interface MarketData {
  vidaTotalSupply: bigint;
  vidaCirculatingSupply: bigint;
  nVidaTotalSupply: bigint;
  vidaMarketCap: number; // In NGN
  nVidaMarketCap: number; // In NGN
  timestamp: number;
}

export interface ExchangeQuote {
  fromAsset: 'VIDA' | 'nVIDA';
  toAsset: 'VIDA' | 'nVIDA';
  inputAmount: bigint;
  outputAmount: bigint;
  exchangeRate: number;
  priceImpact: number; // Percentage
  timestamp: number;
}

// ============ CONSTANTS ============

const NVIDA_NGN_PEG = 1.0; // nVIDA is always 1:1 with NGN
const DECIMALS = 18;
const ONE_TOKEN = BigInt(10 ** DECIMALS);

// Price calculation methods
enum PriceMethod {
  MARKET_BASED, // Use actual market trading data
  SUPPLY_BASED, // Calculate from supply ratios
  ORACLE_FEED, // Use external oracle
}

// ============ PRICE ORACLE ============

/**
 * Get current VIDA/nVIDA exchange rate
 * @param marketData Current market data
 * @param method Price calculation method
 * @returns Current price data
 */
export async function getVidaPrice(
  marketData: MarketData,
  method: PriceMethod = PriceMethod.SUPPLY_BASED
): Promise<PriceData> {
  let vidaPriceNgn: number;
  let source: 'MARKET' | 'ORACLE' | 'CALCULATED';

  switch (method) {
    case PriceMethod.MARKET_BASED:
      vidaPriceNgn = await getMarketPrice();
      source = 'MARKET';
      break;

    case PriceMethod.ORACLE_FEED:
      vidaPriceNgn = await getOraclePrice();
      source = 'ORACLE';
      break;

    case PriceMethod.SUPPLY_BASED:
    default:
      vidaPriceNgn = calculateSupplyBasedPrice(marketData);
      source = 'CALCULATED';
      break;
  }

  // nVIDA is always 1:1 with NGN
  const nVidaPriceNgn = NVIDA_NGN_PEG;

  // Calculate cross rates
  const vidaPrice = vidaPriceNgn / nVidaPriceNgn; // VIDA in terms of nVIDA
  const nVidaPrice = nVidaPriceNgn / vidaPriceNgn; // nVIDA in terms of VIDA

  return {
    vidaPrice,
    nVidaPrice,
    vidaPriceNgn,
    nVidaPriceNgn,
    timestamp: Date.now(),
    source,
  };
}

/**
 * Calculate VIDA price based on supply dynamics
 * @param marketData Market data
 * @returns VIDA price in NGN
 */
function calculateSupplyBasedPrice(marketData: MarketData): number {
  const { vidaCirculatingSupply, nVidaTotalSupply } = marketData;

  // Base price calculation using supply ratio
  // As VIDA supply increases, price adjusts based on demand/supply dynamics
  
  // Simple model: Price increases as we approach hard cap
  const HARD_CAP = BigInt(1_000_000_000) * ONE_TOKEN; // 1 Billion VIDA
  const PENDULUM_FLOOR = BigInt(500_000_000) * ONE_TOKEN; // 500M VIDA
  
  const supplyRatio = Number(vidaCirculatingSupply) / Number(HARD_CAP);
  
  // Base price starts at 1 NGN and increases with scarcity
  // Price formula: 1 + (supplyRatio * scarcityMultiplier)
  const scarcityMultiplier = 2.0; // Max 3x price at hard cap
  const basePrice = 1.0 + (supplyRatio * scarcityMultiplier);
  
  // Adjust for nVIDA supply (demand indicator)
  const demandRatio = Number(nVidaTotalSupply) / Number(vidaCirculatingSupply);
  const demandAdjustment = Math.min(demandRatio * 0.1, 0.5); // Max 50% adjustment
  
  const finalPrice = basePrice * (1 + demandAdjustment);
  
  return finalPrice;
}

/**
 * Get VIDA price from market trading data
 * @returns VIDA price in NGN
 */
async function getMarketPrice(): Promise<number> {
  // In production, fetch from DEX or CEX
  // For now, return calculated price
  return 1.5; // Placeholder: 1 VIDA = 1.5 NGN
}

/**
 * Get VIDA price from external oracle
 * @returns VIDA price in NGN
 */
async function getOraclePrice(): Promise<number> {
  // In production, fetch from Chainlink or similar oracle
  // For now, return calculated price
  return 1.5; // Placeholder: 1 VIDA = 1.5 NGN
}

// ============ EXCHANGE QUOTES ============

/**
 * Get exchange quote for VIDA <-> nVIDA swap
 * @param fromAsset Source asset
 * @param toAsset Destination asset
 * @param inputAmount Input amount (18 decimals)
 * @param priceData Current price data
 * @returns Exchange quote
 */
export function getExchangeQuote(
  fromAsset: 'VIDA' | 'nVIDA',
  toAsset: 'VIDA' | 'nVIDA',
  inputAmount: bigint,
  priceData: PriceData
): ExchangeQuote {
  if (fromAsset === toAsset) {
    return {
      fromAsset,
      toAsset,
      inputAmount,
      outputAmount: inputAmount,
      exchangeRate: 1.0,
      priceImpact: 0,
      timestamp: Date.now(),
    };
  }

  let outputAmount: bigint;
  let exchangeRate: number;

  if (fromAsset === 'VIDA' && toAsset === 'nVIDA') {
    // VIDA → nVIDA
    exchangeRate = priceData.vidaPrice;
    outputAmount = BigInt(Math.floor(Number(inputAmount) * exchangeRate));
  } else {
    // nVIDA → VIDA
    exchangeRate = priceData.nVidaPrice;
    outputAmount = BigInt(Math.floor(Number(inputAmount) * exchangeRate));
  }

  // Calculate price impact (simplified - in production, use liquidity pool depth)
  const priceImpact = calculatePriceImpact(inputAmount, outputAmount);

  return {
    fromAsset,
    toAsset,
    inputAmount,
    outputAmount,
    exchangeRate,
    priceImpact,
    timestamp: Date.now(),
  };
}

/**
 * Calculate price impact of a swap
 */
function calculatePriceImpact(inputAmount: bigint, outputAmount: bigint): number {
  // Simplified price impact calculation
  // In production, calculate based on liquidity pool depth
  const tradeSize = Number(inputAmount) / Number(ONE_TOKEN);

  // Larger trades have higher impact
  if (tradeSize < 1000) return 0.1; // 0.1%
  if (tradeSize < 10000) return 0.5; // 0.5%
  if (tradeSize < 100000) return 1.0; // 1%
  return 2.0; // 2%
}

// ============ MARKET DATA ============

/**
 * Get current market data for VIDA and nVIDA
 * @param vidaContract VIDA token contract address
 * @param nVidaContract nVIDA token contract address
 * @returns Market data
 */
export async function getMarketData(
  vidaContract: any,
  nVidaContract: any
): Promise<MarketData> {
  // Fetch on-chain data
  const vidaTotalSupply = await vidaContract.totalSupply();
  const vidaCirculatingSupply = await vidaContract.getCirculatingSupply();
  const nVidaTotalSupply = await nVidaContract.totalSupply();

  // Calculate market caps (in NGN)
  const priceData = await getVidaPrice({
    vidaTotalSupply,
    vidaCirculatingSupply,
    nVidaTotalSupply,
    vidaMarketCap: 0,
    nVidaMarketCap: 0,
    timestamp: Date.now(),
  });

  const vidaMarketCap =
    (Number(vidaCirculatingSupply) / Number(ONE_TOKEN)) * priceData.vidaPriceNgn;
  const nVidaMarketCap =
    (Number(nVidaTotalSupply) / Number(ONE_TOKEN)) * priceData.nVidaPriceNgn;

  return {
    vidaTotalSupply,
    vidaCirculatingSupply,
    nVidaTotalSupply,
    vidaMarketCap,
    nVidaMarketCap,
    timestamp: Date.now(),
  };
}

// ============ FORMATTING UTILITIES ============

/**
 * Format token amount from Vits (18 decimals) to human-readable
 */
export function formatTokenAmount(amount: bigint, symbol: 'VIDA' | 'nVIDA'): string {
  const value = Number(amount) / Number(ONE_TOKEN);
  return `${value.toFixed(6)} ${symbol}`;
}

/**
 * Format price in NGN
 */
export function formatNgnPrice(price: number): string {
  return `₦${price.toFixed(2)}`;
}

/**
 * Parse token amount from human-readable to Vits (18 decimals)
 */
export function parseTokenAmount(amount: string): bigint {
  const value = parseFloat(amount);
  return BigInt(Math.floor(value * Number(ONE_TOKEN)));
}

// ============ PRICE ALERTS ============

export interface PriceAlert {
  id: string;
  asset: 'VIDA' | 'nVIDA';
  targetPrice: number; // In NGN
  condition: 'ABOVE' | 'BELOW';
  active: boolean;
  createdAt: number;
}

/**
 * Check if price alert should trigger
 */
export function checkPriceAlert(alert: PriceAlert, currentPrice: PriceData): boolean {
  if (!alert.active) return false;

  const price = alert.asset === 'VIDA' ? currentPrice.vidaPriceNgn : currentPrice.nVidaPriceNgn;

  if (alert.condition === 'ABOVE') {
    return price >= alert.targetPrice;
  } else {
    return price <= alert.targetPrice;
  }
}

// ============ HISTORICAL DATA ============

export interface PriceHistory {
  timestamp: number;
  vidaPrice: number;
  nVidaPrice: number;
  volume24h: number;
}

/**
 * Calculate 24-hour price change
 */
export function calculate24hChange(
  currentPrice: number,
  price24hAgo: number
): { change: number; changePercent: number } {
  const change = currentPrice - price24hAgo;
  const changePercent = (change / price24hAgo) * 100;

  return { change, changePercent };
}

/**
 * Get price statistics
 */
export function getPriceStatistics(history: PriceHistory[]): {
  high24h: number;
  low24h: number;
  avg24h: number;
  volume24h: number;
} {
  if (history.length === 0) {
    return { high24h: 0, low24h: 0, avg24h: 0, volume24h: 0 };
  }

  const prices = history.map((h) => h.vidaPrice);
  const high24h = Math.max(...prices);
  const low24h = Math.min(...prices);
  const avg24h = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const volume24h = history.reduce((sum, h) => sum + h.volume24h, 0);

  return { high24h, low24h, avg24h, volume24h };
}

