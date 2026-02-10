/**
 * SOVRYN Chain Provider (API copy for PFF → SOVRYN Chain minting)
 * Canonical: backend/src/blockchain/sovrynProvider.ts
 *
 * - Connection to SOVRYN Chain RPC
 * - Meta-transaction: mintForArchitect (1.1 spendable + 4.0 locked), relayer pays gas
 * - Confirmation loop: wait until mined, then update dashboard
 */

import { ethers } from 'ethers';

const DEFAULT_RPC = process.env.SOVRYN_CHAIN_RPC || 'http://127.0.0.1:8545';
export const ARCHITECT_SPENDABLE_VIDA = ethers.utils.parseEther('1.1');
export const ARCHITECT_HARD_LOCKED_VIDA = ethers.utils.parseEther('4.0');

const SOVEREIGN_MINT_ABI = [
  'function mintForArchitect(address architectWallet, uint256 spendableAmount, uint256 lockedAmount) external',
  'function balanceOf(address account) view returns (uint256)',
  'function lockedBalanceOf(address account) view returns (uint256)',
];

export interface MintForArchitectResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  spendableAmount?: string;
  lockedAmount?: string;
  error?: string;
}

let _provider: ethers.providers.JsonRpcProvider | null = null;

export function getSovrynProvider(rpcUrl: string = process.env.SOVRYN_CHAIN_RPC || DEFAULT_RPC): ethers.providers.JsonRpcProvider {
  if (_provider) return _provider;
  _provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return _provider;
}

export async function mintForArchitect(architectWalletAddress: string): Promise<MintForArchitectResult> {
  const contractAddress = process.env.SOVEREIGN_MINT_CONTRACT_ADDRESS;
  const relayerKey = process.env.SOVRYN_RELAYER_PRIVATE_KEY;
  if (!contractAddress) return { success: false, error: 'SOVEREIGN_MINT_CONTRACT_ADDRESS not configured' };
  if (!relayerKey) return { success: false, error: 'SOVRYN_RELAYER_PRIVATE_KEY not configured' };

  const provider = getSovrynProvider();
  const relayer = new ethers.Wallet(relayerKey, provider);
  const contract = new ethers.Contract(contractAddress, SOVEREIGN_MINT_ABI, relayer);

  try {
    const tx = await contract.mintForArchitect(
      ethers.utils.getAddress(architectWalletAddress),
      ARCHITECT_SPENDABLE_VIDA,
      ARCHITECT_HARD_LOCKED_VIDA
    );
    const receipt = await provider.waitForTransaction(tx.hash, 1);
    if (!receipt || receipt.status !== 1) {
      return { success: false, transactionHash: tx.hash, error: receipt ? 'Transaction reverted' : 'No receipt' };
    }
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      spendableAmount: ethers.utils.formatEther(ARCHITECT_SPENDABLE_VIDA),
      lockedAmount: ethers.utils.formatEther(ARCHITECT_HARD_LOCKED_VIDA),
    };
  } catch (err: any) {
    return { success: false, error: err?.reason || err?.message || String(err) };
  }
}

export async function getBalance(walletAddress: string): Promise<{ spendable: string; locked: string; error?: string }> {
  const addr = process.env.SOVEREIGN_MINT_CONTRACT_ADDRESS;
  if (!addr) return { spendable: '0', locked: '0', error: 'SOVEREIGN_MINT_CONTRACT_ADDRESS not set' };
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
    return { spendable: '0', locked: '0', error: (err as Error)?.message };
  }
}
