/**
 * Global API: optional chain mint. Returns ledger-only when chain env is not set.
 * Set SOVEREIGN_MINT_CONTRACT_ADDRESS + SOVRYN_RELAYER_PRIVATE_KEY + SOVRYN_CHAIN_RPC to enable on-chain mint.
 */

export interface MintForArchitectResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  spendableAmount?: string;
  lockedAmount?: string;
  error?: string;
}

export async function mintForArchitect(_architectWalletAddress: string): Promise<MintForArchitectResult> {
  if (!process.env.SOVEREIGN_MINT_CONTRACT_ADDRESS || !process.env.SOVRYN_RELAYER_PRIVATE_KEY) {
    return { success: false, error: 'Chain not configured; ledger-only release' };
  }
  return { success: false, error: 'Chain mint: add ethers and implement or call Nigeria API for chain tx' };
}
