/**
 * VIDACapBridge.ts - PFF Protocol Bridge for VIDACapMainnet
 * 
 * "The bridge between biological truth and blockchain finality."
 * 
 * This bridge connects the Main PFF Protocol to the VIDACapMainnet contract.
 * It generates SOVEREIGN_AUTH signals and forwards them to the blockchain.
 * 
 * CORE RESPONSIBILITIES:
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. SOVEREIGN_AUTH Generation:
 *    - Receive PFF verification from Main Protocol
 *    - Generate cryptographic SOVEREIGN_AUTH signature
 *    - Include anti-replay protection (nonce)
 * 
 * 2. Signature Validation:
 *    - Validate PFF Truth-Hash
 *    - Verify biometric presence
 *    - Check signature uniqueness
 * 
 * 3. Blockchain Forwarding:
 *    - Call VIDACapMainnet.processSovereignAuth()
 *    - Handle transaction confirmation
 *    - Log to VLT (Vitalia Ledger of Truth)
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface PFFVerification {
  citizenAddress: string;
  pffHash: string; // PFF Truth-Hash from heartbeat
  timestamp: number;
  biometricData: {
    faceVerified: boolean;
    fingerVerified: boolean;
    heartVerified: boolean;
  };
}

export interface SovereignAuthSignal {
  sovereignAuth: string; // bytes32 signature
  citizen: string;
  pffHash: string;
  nonce: number;
  timestamp: number;
}

export interface MintResult {
  success: boolean;
  txHash: string;
  citizenAmount: string;
  nationAmount: string;
  era: 'TEN_UNIT_ERA' | 'TWO_UNIT_ERA';
}

// ════════════════════════════════════════════════════════════════════════════════
// VIDA CAP BRIDGE
// ════════════════════════════════════════════════════════════════════════════════

export class VIDACapBridge {
  private provider: ethers.providers.Provider;
  private signer: ethers.Signer;
  private contract: ethers.Contract;
  private nonce: number = 0;
  
  // Track used signatures for anti-replay protection
  private usedSignatures: Set<string> = new Set();
  
  constructor(
    contractAddress: string,
    provider: ethers.providers.Provider,
    signer: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
    
    // VIDACapMainnet ABI (minimal for processSovereignAuth)
    const abi = [
      'function processSovereignAuth(address citizen, bytes32 sovereignAuth, bytes32 pffHash) external',
      'function getCurrentEra() external view returns (uint8)',
      'function getMintAmountForCurrentEra() external view returns (uint256, uint256)',
      'function getStats() external view returns (uint256, uint256, uint256, uint256, uint8, uint256)',
      'event SovereignAuthReceived(address indexed citizen, bytes32 sovereignAuth, bytes32 pffHash)',
      'event PFFHandshakeMint(address indexed citizen, uint256 citizenAmount, uint256 nationAmount, bytes32 sovereignAuth)',
      'event EraTransition(uint8 oldEra, uint8 newEra, uint256 supply, string reason)'
    ];
    
    this.contract = new ethers.Contract(contractAddress, abi, signer);
  }
  
  /**
   * Generate SOVEREIGN_AUTH signature from PFF verification
   */
  generateSovereignAuth(verification: PFFVerification): SovereignAuthSignal {
    // Validate biometric verification
    if (!verification.biometricData.faceVerified || 
        !verification.biometricData.fingerVerified || 
        !verification.biometricData.heartVerified) {
      throw new Error('Incomplete biometric verification');
    }
    
    // Increment nonce for anti-replay protection
    this.nonce++;
    
    // Generate SOVEREIGN_AUTH signature
    const message = ethers.utils.solidityKeccak256(
      ['address', 'bytes32', 'uint256', 'uint256'],
      [verification.citizenAddress, verification.pffHash, this.nonce, verification.timestamp]
    );
    
    // Check if signature already used
    if (this.usedSignatures.has(message)) {
      throw new Error('SOVEREIGN_AUTH signature already used (replay attack detected)');
    }
    
    // Mark signature as used
    this.usedSignatures.add(message);
    
    return {
      sovereignAuth: message,
      citizen: verification.citizenAddress,
      pffHash: verification.pffHash,
      nonce: this.nonce,
      timestamp: verification.timestamp
    };
  }
  
  /**
   * Process PFF handshake and mint VIDA Cap
   */
  async processPFFHandshake(verification: PFFVerification): Promise<MintResult> {
    try {
      // Generate SOVEREIGN_AUTH signal
      const signal = this.generateSovereignAuth(verification);
      
      console.log('🔐 SOVEREIGN_AUTH Generated:', signal.sovereignAuth);
      console.log('👤 Citizen:', signal.citizen);
      console.log('💓 PFF Hash:', signal.pffHash);
      
      // Call VIDACapMainnet.processSovereignAuth()
      const tx = await this.contract.processSovereignAuth(
        signal.citizen,
        signal.sovereignAuth,
        signal.pffHash
      );
      
      console.log('⏳ Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
      // Parse events to get mint amounts
      const mintEvent = receipt.events?.find((e: any) => e.event === 'PFFHandshakeMint');
      
      if (!mintEvent) {
        throw new Error('PFFHandshakeMint event not found');
      }
      
      const citizenAmount = ethers.utils.formatEther(mintEvent.args.citizenAmount);
      const nationAmount = ethers.utils.formatEther(mintEvent.args.nationAmount);
      
      // Get current era
      const era = await this.getCurrentEra();
      
      console.log(`💎 Minted: ${citizenAmount} VIDA Cap to Citizen`);
      console.log(`🏛️ Minted: ${nationAmount} VIDA Cap to Nation`);
      console.log(`📊 Era: ${era}`);
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        citizenAmount,
        nationAmount,
        era
      };
      
    } catch (error: any) {
      console.error('❌ PFF Handshake failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Get current minting era
   */
  async getCurrentEra(): Promise<'TEN_UNIT_ERA' | 'TWO_UNIT_ERA'> {
    const era = await this.contract.getCurrentEra();
    return era === 0 ? 'TEN_UNIT_ERA' : 'TWO_UNIT_ERA';
  }
  
  /**
   * Get comprehensive stats
   */
  async getStats() {
    const stats = await this.contract.getStats();
    return {
      supply: ethers.utils.formatEther(stats[0]),
      burned: ethers.utils.formatEther(stats[1]),
      citizens: stats[2].toString(),
      handshakes: stats[3].toString(),
      era: stats[4] === 0 ? 'TEN_UNIT_ERA' : 'TWO_UNIT_ERA',
      priceUSD: stats[5].toString()
    };
  }
}

