/**
 * Wallet Interface - Dual-Balance Display
 * 
 * Displays user's dual-asset portfolio:
 * - "My Life Savings" (VIDA): Growth asset for long-term wealth
 * - "My Spending Power" (nVIDA): Stable asset for daily transactions
 * 
 * Born in Lagos, Nigeria. Built for Financial Clarity.
 */

import { PriceData, formatTokenAmount, formatNgnPrice } from '../logic/PriceOracle';

// ============ TYPES ============

export interface WalletBalance {
  vida: {
    balance: bigint; // VIDA balance (18 decimals)
    balanceFormatted: string; // Human-readable VIDA
    valueNgn: number; // Value in NGN
    valueNgnFormatted: string; // Formatted NGN value
  };
  nVida: {
    balance: bigint; // nVIDA balance (18 decimals)
    balanceFormatted: string; // Human-readable nVIDA
    valueNgn: number; // Value in NGN (always 1:1)
    valueNgnFormatted: string; // Formatted NGN value
  };
  total: {
    valueNgn: number; // Total portfolio value in NGN
    valueNgnFormatted: string; // Formatted total value
  };
  timestamp: number;
}

export interface WalletDisplay {
  lifeSavings: {
    title: string;
    asset: 'VIDA';
    balance: string;
    valueNgn: string;
    pricePerToken: string;
    change24h: string;
    changePercent: string;
    icon: string;
    color: string;
  };
  spendingPower: {
    title: string;
    asset: 'nVIDA';
    balance: string;
    valueNgn: string;
    pricePerToken: string;
    stability: string;
    icon: string;
    color: string;
  };
  totalPortfolio: {
    valueNgn: string;
    allocation: {
      vidaPercent: number;
      nVidaPercent: number;
    };
  };
}

export interface TransactionPreview {
  type: 'SEND' | 'RECEIVE' | 'SWAP' | 'BURN';
  asset: 'VIDA' | 'nVIDA';
  amount: bigint;
  amountFormatted: string;
  fee: bigint;
  feeFormatted: string;
  quadSplit?: {
    originCountry: bigint;
    destCountry: bigint;
    projectVault: bigint;
    burn: bigint;
  };
  netAmount: bigint;
  netAmountFormatted: string;
  valueNgn: string;
}

// ============ CONSTANTS ============

const DECIMALS = 18;
const ONE_TOKEN = BigInt(10 ** DECIMALS);

// UI Colors
const VIDA_COLOR = '#FFD700'; // Gold - represents growth and value
const NVIDA_COLOR = '#00A86B'; // Jade green - represents stability

// Icons (emoji for simplicity, replace with actual icons in production)
const VIDA_ICON = 'Ѵ';
const NVIDA_ICON = '₦';

// ============ WALLET BALANCE ============

/**
 * Get wallet balance with dual-asset display
 * @param vidaBalance VIDA balance (18 decimals)
 * @param nVidaBalance nVIDA balance (18 decimals)
 * @param priceData Current price data
 * @returns Wallet balance with formatted values
 */
export function getWalletBalance(
  vidaBalance: bigint,
  nVidaBalance: bigint,
  priceData: PriceData
): WalletBalance {
  // VIDA calculations
  const vidaBalanceNumber = Number(vidaBalance) / Number(ONE_TOKEN);
  const vidaValueNgn = vidaBalanceNumber * priceData.vidaPriceNgn;

  // nVIDA calculations
  const nVidaBalanceNumber = Number(nVidaBalance) / Number(ONE_TOKEN);
  const nVidaValueNgn = nVidaBalanceNumber * priceData.nVidaPriceNgn;

  // Total portfolio value
  const totalValueNgn = vidaValueNgn + nVidaValueNgn;

  return {
    vida: {
      balance: vidaBalance,
      balanceFormatted: formatTokenAmount(vidaBalance, 'VIDA'),
      valueNgn: vidaValueNgn,
      valueNgnFormatted: formatNgnPrice(vidaValueNgn),
    },
    nVida: {
      balance: nVidaBalance,
      balanceFormatted: formatTokenAmount(nVidaBalance, 'nVIDA'),
      valueNgn: nVidaValueNgn,
      valueNgnFormatted: formatNgnPrice(nVidaValueNgn),
    },
    total: {
      valueNgn: totalValueNgn,
      valueNgnFormatted: formatNgnPrice(totalValueNgn),
    },
    timestamp: Date.now(),
  };
}

/**
 * Generate wallet display UI data
 * @param balance Wallet balance
 * @param priceData Current price data
 * @param price24hAgo Price 24 hours ago
 * @returns Formatted display data for UI
 */
export function generateWalletDisplay(
  balance: WalletBalance,
  priceData: PriceData,
  price24hAgo?: number
): WalletDisplay {
  // Calculate 24h change for VIDA
  let change24h = '0.00';
  let changePercent = '0.00';

  if (price24hAgo) {
    const change = priceData.vidaPriceNgn - price24hAgo;
    const percent = (change / price24hAgo) * 100;
    change24h = change >= 0 ? `+${formatNgnPrice(change)}` : formatNgnPrice(change);
    changePercent = percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`;
  }

  // Calculate portfolio allocation
  const totalValue = balance.total.valueNgn;
  const vidaPercent = totalValue > 0 ? (balance.vida.valueNgn / totalValue) * 100 : 0;
  const nVidaPercent = totalValue > 0 ? (balance.nVida.valueNgn / totalValue) * 100 : 0;

  return {
    lifeSavings: {
      title: 'My Life Savings',
      asset: 'VIDA',
      balance: balance.vida.balanceFormatted,
      valueNgn: balance.vida.valueNgnFormatted,
      pricePerToken: formatNgnPrice(priceData.vidaPriceNgn),
      change24h,
      changePercent,
      icon: VIDA_ICON,
      color: VIDA_COLOR,
    },
    spendingPower: {
      title: 'My Spending Power',
      asset: 'nVIDA',
      balance: balance.nVida.balanceFormatted,
      valueNgn: balance.nVida.valueNgnFormatted,
      pricePerToken: formatNgnPrice(priceData.nVidaPriceNgn),
      stability: '1:1 NGN Peg',
      icon: NVIDA_ICON,
      color: NVIDA_COLOR,
    },
    totalPortfolio: {
      valueNgn: balance.total.valueNgnFormatted,
      allocation: {
        vidaPercent: Math.round(vidaPercent * 100) / 100,
        nVidaPercent: Math.round(nVidaPercent * 100) / 100,
      },
    },
  };
}

// ============ TRANSACTION PREVIEW ============

/**
 * Preview transaction with fee breakdown
 * @param type Transaction type
 * @param asset Asset being transacted
 * @param amount Amount (18 decimals)
 * @param priceData Current price data
 * @param includeQuadSplit Whether to include Quad-Split breakdown (for nVIDA transfers)
 * @returns Transaction preview
 */
export function previewTransaction(
  type: 'SEND' | 'RECEIVE' | 'SWAP' | 'BURN',
  asset: 'VIDA' | 'nVIDA',
  amount: bigint,
  priceData: PriceData,
  includeQuadSplit: boolean = false
): TransactionPreview {
  let fee = 0n;
  let quadSplit: TransactionPreview['quadSplit'] | undefined;

  // Calculate fee (2% for nVIDA transfers)
  if (asset === 'nVIDA' && (type === 'SEND' || type === 'SWAP') && includeQuadSplit) {
    fee = (amount * 2n) / 100n; // 2% fee

    // Calculate Quad-Split (25% each)
    const originCountry = (fee * 25n) / 100n;
    const destCountry = (fee * 25n) / 100n;
    const projectVault = (fee * 25n) / 100n;
    const burn = fee - originCountry - destCountry - projectVault;

    quadSplit = {
      originCountry,
      destCountry,
      projectVault,
      burn,
    };
  }

  const netAmount = type === 'RECEIVE' ? amount : amount - fee;

  // Calculate NGN value
  const price = asset === 'VIDA' ? priceData.vidaPriceNgn : priceData.nVidaPriceNgn;
  const valueNgn = (Number(amount) / Number(ONE_TOKEN)) * price;

  return {
    type,
    asset,
    amount,
    amountFormatted: formatTokenAmount(amount, asset),
    fee,
    feeFormatted: formatTokenAmount(fee, asset),
    quadSplit,
    netAmount,
    netAmountFormatted: formatTokenAmount(netAmount, asset),
    valueNgn: formatNgnPrice(valueNgn),
  };
}

// ============ SWAP PREVIEW ============

/**
 * Preview VIDA <-> nVIDA swap
 * @param fromAsset Source asset
 * @param toAsset Destination asset
 * @param inputAmount Input amount (18 decimals)
 * @param priceData Current price data
 * @returns Swap preview with exchange rate
 */
export function previewSwap(
  fromAsset: 'VIDA' | 'nVIDA',
  toAsset: 'VIDA' | 'nVIDA',
  inputAmount: bigint,
  priceData: PriceData
): {
  fromAsset: 'VIDA' | 'nVIDA';
  toAsset: 'VIDA' | 'nVIDA';
  inputAmount: string;
  outputAmount: string;
  exchangeRate: string;
  priceImpact: string;
  valueNgn: string;
} {
  if (fromAsset === toAsset) {
    return {
      fromAsset,
      toAsset,
      inputAmount: formatTokenAmount(inputAmount, fromAsset),
      outputAmount: formatTokenAmount(inputAmount, toAsset),
      exchangeRate: '1:1',
      priceImpact: '0.00%',
      valueNgn: formatNgnPrice(0),
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

  // Calculate value in NGN
  const inputPrice = fromAsset === 'VIDA' ? priceData.vidaPriceNgn : priceData.nVidaPriceNgn;
  const valueNgn = (Number(inputAmount) / Number(ONE_TOKEN)) * inputPrice;

  return {
    fromAsset,
    toAsset,
    inputAmount: formatTokenAmount(inputAmount, fromAsset),
    outputAmount: formatTokenAmount(outputAmount, toAsset),
    exchangeRate: `1 ${fromAsset} = ${exchangeRate.toFixed(6)} ${toAsset}`,
    priceImpact: '0.50%', // Simplified
    valueNgn: formatNgnPrice(valueNgn),
  };
}

// ============ PORTFOLIO INSIGHTS ============

/**
 * Generate portfolio insights and recommendations
 * @param balance Wallet balance
 * @param priceData Current price data
 * @returns Portfolio insights
 */
export function getPortfolioInsights(
  balance: WalletBalance,
  priceData: PriceData
): {
  recommendation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  diversificationScore: number; // 0-100
  insights: string[];
} {
  const totalValue = balance.total.valueNgn;
  const vidaPercent = totalValue > 0 ? (balance.vida.valueNgn / totalValue) * 100 : 0;
  const nVidaPercent = totalValue > 0 ? (balance.nVida.valueNgn / totalValue) * 100 : 0;

  // Calculate diversification score (optimal is 50/50)
  const diversificationScore = 100 - Math.abs(50 - vidaPercent);

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (vidaPercent > 80) {
    riskLevel = 'HIGH';
  } else if (vidaPercent > 60) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Generate insights
  const insights: string[] = [];

  if (vidaPercent > 70) {
    insights.push('Your portfolio is heavily weighted toward VIDA (growth asset).');
    insights.push('Consider converting some VIDA to nVIDA for stability.');
  } else if (nVidaPercent > 70) {
    insights.push('Your portfolio is heavily weighted toward nVIDA (stable asset).');
    insights.push('Consider converting some nVIDA to VIDA for growth potential.');
  } else {
    insights.push('Your portfolio is well-balanced between growth and stability.');
  }

  if (priceData.vidaPriceNgn > 2.0) {
    insights.push('VIDA price is above ₦2.00 - consider taking profits.');
  }

  // Generate recommendation
  let recommendation: string;
  if (riskLevel === 'HIGH') {
    recommendation = 'Rebalance portfolio: Convert some VIDA to nVIDA for stability.';
  } else if (riskLevel === 'LOW') {
    recommendation = 'Consider increasing VIDA allocation for growth potential.';
  } else {
    recommendation = 'Portfolio is balanced. Monitor market conditions.';
  }

  return {
    recommendation,
    riskLevel,
    diversificationScore: Math.round(diversificationScore),
    insights,
  };
}

// ============ EXPORT UTILITIES ============

export { VIDA_COLOR, NVIDA_COLOR, VIDA_ICON, NVIDA_ICON };

