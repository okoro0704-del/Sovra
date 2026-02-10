/**
 * SOVRYN Chain Provider
 *
 * Configures connection to the SOVRYN Chain RPC and provides:
 * - RPC provider for read/write
 * - Contract handshake: SovereignMint (mintForArchitect)
 * - Meta-transaction submission (gasless for Architect - SOVRYN pays gas)
 * - Confirmation loop (wait until mined)
 *
 * Env:
 *   SOVRYN_CHAIN_RPC - RPC URL (default http://127.0.0.1:8545)
 *   SOVRYN_CHAIN_ID  - Chain ID (default 31337)
 *   SOVEREIGN_MINT_CONTRACT_ADDRESS - SovereignMint contract
 *   SOVRYN_RELAYER_PRIVATE_KEY - Relayer wallet (SOVRYN pays gas)
 *   ARCHITECT_VAULT_ADDRESS / ARCHITECT_WALLET_ADDRESS - Architect wallet for checks
 *
 * When a user is Vitalized in Supabase, trigger a call to SovereignMint;
 * Architect receives 1.1 VIDA (spendable) + 4.0 VIDA (hard-locked) per 11 VIDA logic.
 */

import { ethers } from 'ethers';

const SOVRYN_CHAIN_ID = parseInt(process.env.SOVRYN_CHAIN_ID || '0', 10) || 31337;
const DEFAULT_RPC = process.env.SOVRYN_CHAIN_RPC || 'http://127.0.0.1:8545';

// Architect allocation (11 VIDA logic): 1.1 spendable + 4.0 hard-locked = 5.1 to Architect
const VIDA_DECIMALS = 18;
export const ARCHITECT_SPENDABLE_VIDA = ethers.utils.parseEther('1.1');
export const ARCHITECT_HARD_LOCKED_VIDA = ethers.utils.parseEther('4.0');
export const ARCHITECT_TOTAL_VIDA = ARCHITECT_SPENDABLE_VIDA.add(ARCHITECT_HARD_LOCKED_VIDA);

// SovereignMint contract ABI (minimal: relayer calls mintForArchitect, contract mints and assigns)
const SOVEREIGN_MINT_ABI = [
  'function mintForArchitect(address architectWallet, uint256 spendableAmount, uint256 lockedAmount) external',
  'function balanceOf(address account) view returns (uint256)',
  'function lockedBalanceOf(address account) view returns (uint256)',
  'event ArchitectMinted(address indexed architect, uint256 spendable, uint256 locked)',
];

export interface SovrynProviderConfig {
  rpcUrl?: string;
  chainId?: number;
  sovereignMintAddress?: string;
  relayerPrivateKey?: string;
}

export interface MintForArchitectResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  spendableAmount?: string;
  lockedAmount?: string;
  error?: string;
}

let defaultProvider: ethers.providers.JsonRpcProvider | null = null;
let defaultRelayer: ethers.Wallet | null = null;

/**
 * Get or create the SOVRYN Chain RPC provider.
 */
/**
 * Get or create the SOVRYN Chain RPC provider.
 * Uses SOVRYN_CHAIN_RPC and optional SOVRYN_CHAIN_ID for network.
 */
export function getSovrynProvider(
  rpcUrl: string = process.env.SOVRYN_CHAIN_RPC || DEFAULT_RPC,
  chainId: number = SOVRYN_CHAIN_ID
): ethers.providers.JsonRpcProvider {
  if (defaultProvider) return defaultProvider;
  const network = chainId ? { chainId, name: 'sovryn' } : undefined;
  defaultProvider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
  return defaultProvider;
}

/**
 * Get or create the relayer wallet (SOVRYN pays gas for meta-tx).
 */
export function getRelayerWallet(
  provider?: ethers.providers.Provider
): ethers.Wallet {
  const key = process.env.SOVRYN_RELAYER_PRIVATE_KEY;
  if (!key) {
    throw new Error('SOVRYN_RELAYER_PRIVATE_KEY is required for gasless meta-transactions');
  }
  const prov = provider || getSovrynProvider();
  if (!defaultRelayer) {
    defaultRelayer = new ethers.Wallet(key, prov);
  } else if (provider && defaultRelayer.provider !== provider) {
    defaultRelayer = defaultRelayer.connect(provider);
  }
  return defaultRelayer;
}

/**
 * Check if the given address is the configured Architect wallet.
 */
export function isArchitectWallet(address: string): boolean {
  const architect = (process.env.ARCHITECT_VAULT_ADDRESS || process.env.ARCHITECT_WALLET_ADDRESS || '').toLowerCase();
  return ethers.utils.getAddress(address) === ethers.utils.getAddress(architect) || architect === '';
}

/**
 * Meta-Transaction: Mint for Architect (1.1 VIDA spendable + 4.0 VIDA hard-locked).
 * Relayer (backend) pays gas so the Architect doesn't need to.
 * Returns once the transaction is mined.
 */
export async function mintForArchitect(
  architectWalletAddress: string,
  config?: SovrynProviderConfig
): Promise<MintForArchitectResult> {
  const rpcUrl = config?.rpcUrl || process.env.SOVRYN_CHAIN_RPC || DEFAULT_RPC;
  const contractAddress = config?.sovereignMintAddress || process.env.SOVEREIGN_MINT_CONTRACT_ADDRESS;
  const relayerKey = config?.relayerPrivateKey || process.env.SOVRYN_RELAYER_PRIVATE_KEY;

  if (!contractAddress) {
    return {
      success: false,
      error: 'SOVEREIGN_MINT_CONTRACT_ADDRESS not configured',
    };
  }
  if (!relayerKey) {
    return {
      success: false,
      error: 'SOVRYN_RELAYER_PRIVATE_KEY not configured (required for gasless tx)',
    };
  }

  const provider = getSovrynProvider(rpcUrl);
  const relayer = new ethers.Wallet(relayerKey, provider);
  const contract = new ethers.Contract(
    contractAddress,
    SOVEREIGN_MINT_ABI,
    relayer
  );

  try {
    const tx = await contract.mintForArchitect(
      ethers.utils.getAddress(architectWalletAddress),
      ARCHITECT_SPENDABLE_VIDA,
      ARCHITECT_HARD_LOCKED_VIDA
    );

    // Confirmation loop: wait until mined
    const receipt = await provider.waitForTransaction(tx.hash, 1);

    if (!receipt || receipt.status !== 1) {
      return {
        success: false,
        transactionHash: tx.hash,
        error: receipt ? 'Transaction reverted' : 'No receipt',
      };
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      spendableAmount: ethers.utils.formatEther(ARCHITECT_SPENDABLE_VIDA),
      lockedAmount: ethers.utils.formatEther(ARCHITECT_HARD_LOCKED_VIDA),
    };
  } catch (err: any) {
    const message = err?.reason || err?.message || String(err);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Poll until transaction is mined (confirmation loop).
 * Can be used by callers who submit tx elsewhere and need to wait.
 */
export async function waitForMined(
  txHash: string,
  rpcUrl?: string,
  maxAttempts: number = 60
): Promise<{ mined: boolean; blockNumber?: number; receipt?: ethers.providers.TransactionReceipt }> {
  const provider = getSovrynProvider(rpcUrl || process.env.SOVRYN_CHAIN_RPC || DEFAULT_RPC);
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.blockNumber) {
      return { mined: true, blockNumber: receipt.blockNumber, receipt };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { mined: false };
}

/**
 * Read VIDA balance (spendable) for an address from SovereignMint / VIDA token.
 */
export async function getBalance(
  walletAddress: string,
  contractAddress?: string
): Promise<{ spendable: string; locked: string; error?: string }> {
  const addr = contractAddress || process.env.SOVEREIGN_MINT_CONTRACT_ADDRESS;
  if (!addr) {
    return { spendable: '0', locked: '0', error: 'SOVEREIGN_MINT_CONTRACT_ADDRESS not set' };
  }
  const provider = getSovrynProvider();
  const contract = new ethers.Contract(addr, SOVEREIGN_MINT_ABI, provider);
  try {
    const [spendable, locked] = await Promise.all([
      contract.balanceOf(ethers.utils.getAddress(walletAddress)),
      contract.lockedBalanceOf(ethers.utils.getAddress(walletAddress)),
    ]);
    return {
      spendable: ethers.utils.formatEther(spendable || 0),
      locked: ethers.utils.formatEther(locked || 0),
    };
  } catch (err: any) {
    return {
      spendable: '0',
      locked: '0',
      error: err?.message || String(err),
    };
  }
}

export default {
  getSovrynProvider,
  getRelayerWallet,
  isArchitectWallet,
  mintForArchitect,
  waitForMined,
  getBalance,
  ARCHITECT_SPENDABLE_VIDA,
  ARCHITECT_HARD_LOCKED_VIDA,
  ARCHITECT_TOTAL_VIDA,
};
