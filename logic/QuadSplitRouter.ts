/**
 * Quad-Split Router - The Four Pillars Fee Distribution Engine
 * 
 * Routes 2% transaction fees according to the Quad-Split table:
 * - 25% Origin Country (50/50 Govt/Citizen Dividend)
 * - 25% Destination Country (50/50 Govt/Citizen Dividend)
 * - 25% Project Vault (Infrastructure & Reserve Yield)
 * - 25% The Burn (Permanent removal)
 * 
 * Born in Lagos, Nigeria. Built for Economic Justice.
 */

// ============ TYPES ============

export interface Country {
  code: string; // ISO 3166-1 alpha-2 (e.g., "NG" for Nigeria)
  name: string;
  governmentWallet: string;
  citizenDividendPool: string;
}

export interface Transaction {
  id: string;
  amount: bigint; // Amount in Vits (18 decimals)
  originCountry: string; // Country code
  destinationCountry: string; // Country code
  timestamp: number;
  userDid: string;
}

export interface QuadSplitResult {
  transactionId: string;
  totalFee: bigint;
  originCountryShare: bigint;
  destinationCountryShare: bigint;
  projectVaultShare: bigint;
  burnShare: bigint;
  distributions: Distribution[];
  timestamp: number;
}

export interface Distribution {
  recipient: string;
  amount: bigint;
  category: 'ORIGIN_GOVT' | 'ORIGIN_CITIZEN' | 'DEST_GOVT' | 'DEST_CITIZEN' | 'PROJECT_VAULT' | 'BURN';
}

// ============ CONSTANTS ============

const TRANSACTION_FEE_RATE = 0.02; // 2% fee
const QUAD_SPLIT_RATIO = 0.25; // 25% per pillar

// The Four Pillars
const ORIGIN_COUNTRY_SHARE = 0.25;
const DESTINATION_COUNTRY_SHARE = 0.25;
const PROJECT_VAULT_SHARE = 0.25;
const DEFLATION_BURN_SHARE = 0.25;

// Country split (within each country's 25%)
const GOVERNMENT_SHARE = 0.5; // 50% of country share
const CITIZEN_DIVIDEND_SHARE = 0.5; // 50% of country share

// Special addresses
const PROJECT_VAULT_ADDRESS = '0xVITALIA_PROJECT_VAULT';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// ============ CORE ROUTING ============

/**
 * Execute the Quad-Split fee distribution
 * @param transaction Transaction details
 * @param countries Country registry
 * @returns Distribution result
 */
export async function executeQuadSplit(
  transaction: Transaction,
  countries: Map<string, Country>
): Promise<QuadSplitResult> {
  // Step 1: Calculate total fee (2% of transaction amount)
  const totalFee = calculateFee(transaction.amount);

  // Step 2: Calculate each pillar's share (25% each)
  const originCountryShare = calculateShare(totalFee, ORIGIN_COUNTRY_SHARE);
  const destinationCountryShare = calculateShare(totalFee, DESTINATION_COUNTRY_SHARE);
  const projectVaultShare = calculateShare(totalFee, PROJECT_VAULT_SHARE);
  const burnShare = calculateShare(totalFee, DEFLATION_BURN_SHARE);

  // Step 3: Get country details
  const originCountry = countries.get(transaction.originCountry);
  const destinationCountry = countries.get(transaction.destinationCountry);

  if (!originCountry || !destinationCountry) {
    throw new Error(`Invalid country code: ${transaction.originCountry} or ${transaction.destinationCountry}`);
  }

  // Step 4: Build distribution list
  const distributions: Distribution[] = [];

  // Origin Country (50/50 split)
  distributions.push({
    recipient: originCountry.governmentWallet,
    amount: calculateShare(originCountryShare, GOVERNMENT_SHARE),
    category: 'ORIGIN_GOVT',
  });
  distributions.push({
    recipient: originCountry.citizenDividendPool,
    amount: calculateShare(originCountryShare, CITIZEN_DIVIDEND_SHARE),
    category: 'ORIGIN_CITIZEN',
  });

  // Destination Country (50/50 split)
  distributions.push({
    recipient: destinationCountry.governmentWallet,
    amount: calculateShare(destinationCountryShare, GOVERNMENT_SHARE),
    category: 'DEST_GOVT',
  });
  distributions.push({
    recipient: destinationCountry.citizenDividendPool,
    amount: calculateShare(destinationCountryShare, CITIZEN_DIVIDEND_SHARE),
    category: 'DEST_CITIZEN',
  });

  // Project Vault
  distributions.push({
    recipient: PROJECT_VAULT_ADDRESS,
    amount: projectVaultShare,
    category: 'PROJECT_VAULT',
  });

  // The Burn
  distributions.push({
    recipient: BURN_ADDRESS,
    amount: burnShare,
    category: 'BURN',
  });

  // Step 5: Validate total distribution equals total fee
  const totalDistributed = distributions.reduce((sum, dist) => sum + dist.amount, 0n);
  if (totalDistributed !== totalFee) {
    throw new Error(`Distribution mismatch: ${totalDistributed} !== ${totalFee}`);
  }

  return {
    transactionId: transaction.id,
    totalFee,
    originCountryShare,
    destinationCountryShare,
    projectVaultShare,
    burnShare,
    distributions,
    timestamp: Date.now(),
  };
}

// ============ CALCULATION HELPERS ============

/**
 * Calculate transaction fee (2% of amount)
 * @param amount Transaction amount in Vits (18 decimals)
 * @returns Fee amount in Vits
 */
function calculateFee(amount: bigint): bigint {
  // 2% = amount * 2 / 100
  return (amount * 2n) / 100n;
}

/**
 * Calculate share of a total amount
 * @param total Total amount
 * @param ratio Share ratio (0.0 - 1.0)
 * @returns Share amount
 */
function calculateShare(total: bigint, ratio: number): bigint {
  // Convert ratio to basis points for precision
  const basisPoints = BigInt(Math.floor(ratio * 10000));
  return (total * basisPoints) / 10000n;
}

// ============ VALIDATION ============

/**
 * Validate country registry has required fields
 */
export function validateCountry(country: Country): boolean {
  return (
    country.code.length === 2 &&
    country.name.length > 0 &&
    country.governmentWallet.length > 0 &&
    country.citizenDividendPool.length > 0
  );
}

/**
 * Validate transaction has required fields
 */
export function validateTransaction(transaction: Transaction): boolean {
  return (
    transaction.id.length > 0 &&
    transaction.amount > 0n &&
    transaction.originCountry.length === 2 &&
    transaction.destinationCountry.length === 2 &&
    transaction.userDid.length > 0
  );
}

// ============ VIEW FUNCTIONS ============

/**
 * Preview fee distribution without executing
 */
export function previewQuadSplit(
  amount: bigint,
  originCountry: Country,
  destinationCountry: Country
): {
  totalFee: bigint;
  originGovt: bigint;
  originCitizen: bigint;
  destGovt: bigint;
  destCitizen: bigint;
  projectVault: bigint;
  burn: bigint;
} {
  const totalFee = calculateFee(amount);

  const originShare = calculateShare(totalFee, ORIGIN_COUNTRY_SHARE);
  const destShare = calculateShare(totalFee, DESTINATION_COUNTRY_SHARE);
  const projectShare = calculateShare(totalFee, PROJECT_VAULT_SHARE);
  const burnShare = calculateShare(totalFee, DEFLATION_BURN_SHARE);

  return {
    totalFee,
    originGovt: calculateShare(originShare, GOVERNMENT_SHARE),
    originCitizen: calculateShare(originShare, CITIZEN_DIVIDEND_SHARE),
    destGovt: calculateShare(destShare, GOVERNMENT_SHARE),
    destCitizen: calculateShare(destShare, CITIZEN_DIVIDEND_SHARE),
    projectVault: projectShare,
    burn: burnShare,
  };
}

/**
 * Get fee breakdown as percentages
 */
export function getFeeBreakdown(): {
  totalFeeRate: number;
  originCountry: number;
  destinationCountry: number;
  projectVault: number;
  burn: number;
  governmentShareOfCountry: number;
  citizenShareOfCountry: number;
} {
  return {
    totalFeeRate: TRANSACTION_FEE_RATE,
    originCountry: ORIGIN_COUNTRY_SHARE,
    destinationCountry: DESTINATION_COUNTRY_SHARE,
    projectVault: PROJECT_VAULT_SHARE,
    burn: DEFLATION_BURN_SHARE,
    governmentShareOfCountry: GOVERNMENT_SHARE,
    citizenShareOfCountry: CITIZEN_DIVIDEND_SHARE,
  };
}

/**
 * Format amount from Vits (18 decimals) to human-readable VIDA
 */
export function formatVida(vits: bigint): string {
  const vida = Number(vits) / 1e18;
  return `${vida.toFixed(6)} VIDA`;
}

/**
 * Parse VIDA amount to Vits (18 decimals)
 */
export function parseVida(vida: string): bigint {
  const amount = parseFloat(vida);
  return BigInt(Math.floor(amount * 1e18));
}

