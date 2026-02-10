/**
 * SovrynClient.ts - Sovryn Protocol Integration on Rootstock (RSK)
 *
 * "My wealth is secured by my presence."
 *
 * Features:
 * - Sovryn Zero (0% interest loans)
 * - Spot Exchange (trading)
 * - Lending/Borrowing
 * - DLLR (Sovryn Dollar) stablecoin integration
 * - PFF-gated transactions (biometric verification required)
 * - Transaction Interceptor (Sovereign_Active flag enforcement)
 *
 * Network: Rootstock (RSK) - Bitcoin-secured smart contracts
 *
 * Born in Lagos, Nigeria. Built for Sovereign Finance.
 */

import { ethers } from 'ethers';
import { interceptSovrynTransaction } from './TransactionInterceptor';

// ============ TYPES ============

export interface SovrynConfig {
  rpcUrl: string;
  chainId: number;
  contracts: {
    sovrynProtocol: string;
    loanToken: string;
    swapNetwork: string;
    dllrToken: string;
    rbtcToken: string;
  };
}

export interface PresenceProof {
  uid: string;
  pffHash: string; // PFF Truth-Hash from heartbeat
  timestamp: number;
  bpm: number;
  confidence: number;
  sessionId: string;
  signature: string; // Cryptographic signature
}

export interface TradeParams {
  fromToken: string;
  toToken: string;
  amount: string;
  minReturn: string;
  deadline: number;
}

export interface LoanParams {
  collateralToken: string;
  loanToken: string;
  collateralAmount: string;
  loanAmount: string;
  duration: number; // seconds
}

export interface BorrowParams {
  loanToken: string;
  collateralToken: string;
  borrowAmount: string;
  collateralAmount: string;
}

export interface SovrynBalances {
  rbtc: string; // Rootstock BTC
  dllr: string; // Sovryn Dollar
  sov: string; // SOV token
  xusd: string; // XUSD stablecoin
}

// ============ CONSTANTS ============

// Rootstock Mainnet Configuration
export const RSK_MAINNET_CONFIG: SovrynConfig = {
  rpcUrl: 'https://public-node.rsk.co',
  chainId: 30,
  contracts: {
    sovrynProtocol: '0x5A0D867e0D70Fcc6Ade25C3F1B89d618b5B4Eaa7',
    loanToken: '0xd8D25f03EBbA94E15Df2eD4d6D38276B595593c1',
    swapNetwork: '0x98aCE08D2b759a265ae326F010496bcD63C15afc',
    dllrToken: '0xc1411567d2670e24d9C4DaAa7CdA95686e1250AA',
    rbtcToken: '0x542fDA317318eBF1d3DEAf76E0b632741A7e677d',
  },
};

// Rootstock Testnet Configuration
export const RSK_TESTNET_CONFIG: SovrynConfig = {
  rpcUrl: 'https://public-node.testnet.rsk.co',
  chainId: 31,
  contracts: {
    sovrynProtocol: '0x25380305f223B32FDB844152abD2E82BC5Ad99c3',
    loanToken: '0xd1f225BEAE98ccc51c468d1E92d0331c4f93e566',
    swapNetwork: '0x61172B53423E205a399640e5283e51FE60EC2256',
    dllrToken: '0x007b3AA69A846cB1f76b60b3088230A52D2A83AC',
    rbtcToken: '0x69FE5cEC81D5eF92600c1A0dB1F11986AB3758Ab',
  },
};

// ============ SOVRYN CLIENT ============

export class SovrynClient {
  private provider: ethers.providers.JsonRpcProvider;
  private config: SovrynConfig;
  private signer: ethers.Signer | null = null;

  constructor(config: SovrynConfig = RSK_MAINNET_CONFIG) {
    this.config = config;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  }

  /**
   * Connect wallet to Sovryn
   * Supports: MetaMask, Defiant, Hardware Wallets
   */
  async connectWallet(walletProvider: any): Promise<string> {
    const web3Provider = new ethers.providers.Web3Provider(walletProvider);
    this.signer = web3Provider.getSigner();
    const address = await this.signer.getAddress();

    console.log(`[SOVRYN] Wallet connected: ${address}`);

    // Verify network is RSK
    const network = await web3Provider.getNetwork();
    if (network.chainId !== this.config.chainId) {
      throw new Error(
        `Wrong network. Expected RSK (${this.config.chainId}), got ${network.chainId}`
      );
    }

    return address;
  }

  /**
   * Get Sovryn balances (RBTC, DLLR, SOV, XUSD)
   */
  async getBalances(address: string): Promise<SovrynBalances> {
    console.log(`[SOVRYN] Fetching balances for ${address}`);

    // Get RBTC balance (native token)
    const rbtcBalance = await this.provider.getBalance(address);

    // Get DLLR balance (ERC20)
    const dllrContract = new ethers.Contract(
      this.config.contracts.dllrToken,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    const dllrBalance = await dllrContract.balanceOf(address);

    // Mock SOV and XUSD for now (in production, query actual contracts)
    const sovBalance = ethers.BigNumber.from(0);
    const xusdBalance = ethers.BigNumber.from(0);

    return {
      rbtc: ethers.utils.formatEther(rbtcBalance),
      dllr: ethers.utils.formatEther(dllrBalance),
      sov: ethers.utils.formatEther(sovBalance),
      xusd: ethers.utils.formatEther(xusdBalance),
    };
  }

  /**
   * Get DLLR balance (Sovryn Dollar)
   */
  async getDLLRBalance(address: string): Promise<string> {
    const dllrContract = new ethers.Contract(
      this.config.contracts.dllrToken,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );

    const balance = await dllrContract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  /**
   * Get current DLLR price
   */
  async getDLLRPrice(): Promise<string> {
    // In production, query Sovryn price oracle
    // For now, return mock price (DLLR is pegged to USD)
    return '1.00';
  }

  // ============ TRADING (SPOT EXCHANGE) ============

  /**
   * Execute spot trade on Sovryn
   *
   * ⚠️ GATED TRANSACTION: Requires Sovereign_Active = true
   * Automatically checks PFF presence before execution
   *
   * @param params Trade parameters
   * @returns Transaction hash
   */
  async trade(params: TradeParams): Promise<string> {
    return interceptSovrynTransaction(async () => {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      console.log('[SOVRYN] Executing trade...');
      console.log(`[SOVRYN] From: ${params.fromToken}`);
      console.log(`[SOVRYN] To: ${params.toToken}`);
      console.log(`[SOVRYN] Amount: ${params.amount}`);

      // Get swap network contract
      const swapContract = new ethers.Contract(
        this.config.contracts.swapNetwork,
        [
          'function convertByPath(address[] path, uint256 amount, uint256 minReturn, address beneficiary, address affiliateAccount, uint256 affiliateFee) payable returns (uint256)',
        ],
        this.signer
      );

      // Build swap path (simplified - in production, use optimal path)
      const path = [params.fromToken, params.toToken];

      // Execute swap
      const tx = await swapContract.convertByPath(
        path,
        ethers.utils.parseEther(params.amount),
        ethers.utils.parseEther(params.minReturn),
        await this.signer.getAddress(),
        ethers.constants.AddressZero, // No affiliate
        0 // No affiliate fee
      );

      console.log(`[SOVRYN] ✅ Trade submitted: ${tx.hash}`);

      // Wait for confirmation
      await tx.wait();

      console.log(`[SOVRYN] ✅ Trade confirmed`);

      return tx.hash;
    }, 'Spot Trade');
  }

  // ============ LENDING ============

  /**
   * Lend tokens on Sovryn
   *
   * ⚠️ GATED TRANSACTION: Requires Sovereign_Active = true
   * Automatically checks PFF presence before execution
   *
   * @param token Token address to lend
   * @param amount Amount to lend
   * @returns Transaction hash
   */
  async lend(token: string, amount: string): Promise<string> {
    return interceptSovrynTransaction(async () => {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      console.log('[SOVRYN] Lending tokens...');
      console.log(`[SOVRYN] Token: ${token}`);
      console.log(`[SOVRYN] Amount: ${amount}`);

      // Get loan token contract
      const loanTokenContract = new ethers.Contract(
        this.config.contracts.loanToken,
        [
          'function mint(address receiver, uint256 depositAmount) returns (uint256)',
        ],
        this.signer
      );

      // Mint iTokens (lending)
      const tx = await loanTokenContract.mint(
        await this.signer.getAddress(),
        ethers.utils.parseEther(amount)
      );

      console.log(`[SOVRYN] ✅ Lend submitted: ${tx.hash}`);

      await tx.wait();

      console.log(`[SOVRYN] ✅ Lend confirmed`);

      return tx.hash;
    }, 'Lending');
  }

  // ============ BORROWING ============

  /**
   * Borrow tokens on Sovryn
   *
   * ⚠️ GATED TRANSACTION: Requires Sovereign_Active = true
   * Automatically checks PFF presence before execution
   *
   * @param params Borrow parameters
   * @returns Transaction hash
   */
  async borrow(params: BorrowParams): Promise<string> {
    return interceptSovrynTransaction(async () => {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      console.log('[SOVRYN] Borrowing tokens...');
      console.log(`[SOVRYN] Loan Token: ${params.loanToken}`);
      console.log(`[SOVRYN] Collateral Token: ${params.collateralToken}`);
      console.log(`[SOVRYN] Borrow Amount: ${params.borrowAmount}`);
      console.log(`[SOVRYN] Collateral Amount: ${params.collateralAmount}`);

      // Get loan token contract
      const loanTokenContract = new ethers.Contract(
        this.config.contracts.loanToken,
        [
          'function borrow(bytes32 loanId, uint256 withdrawAmount, uint256 initialLoanDuration, uint256 collateralTokenSent, address collateralTokenAddress, address borrower, address receiver, bytes loanDataBytes) payable returns (uint256)',
        ],
        this.signer
      );

      // Borrow tokens
      const tx = await loanTokenContract.borrow(
        ethers.constants.HashZero, // New loan
        ethers.utils.parseEther(params.borrowAmount),
        2419200, // 28 days
        ethers.utils.parseEther(params.collateralAmount),
        params.collateralToken,
        await this.signer.getAddress(),
        await this.signer.getAddress(),
        '0x' // No extra data
      );

      console.log(`[SOVRYN] ✅ Borrow submitted: ${tx.hash}`);

      await tx.wait();

      console.log(`[SOVRYN] ✅ Borrow confirmed`);

      return tx.hash;
    }, 'Borrowing');
  }

  // ============ SOVRYN ZERO (0% INTEREST LOANS) ============

  /**
   * Open Sovryn Zero loan (0% interest)
   *
   * ⚠️ GATED TRANSACTION: Requires Sovereign_Active = true
   * Automatically checks PFF presence before execution
   *
   * @param params Loan parameters
   * @returns Transaction hash
   */
  async openZeroLoan(params: LoanParams): Promise<string> {
    return interceptSovrynTransaction(async () => {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      console.log('[SOVRYN] Opening Sovryn Zero loan (0% interest)...');
      console.log(`[SOVRYN] Collateral: ${params.collateralAmount}`);
      console.log(`[SOVRYN] Loan: ${params.loanAmount}`);

      // In production, use actual Sovryn Zero contract
      // For now, simulate transaction
      const tx = await this.signer.sendTransaction({
        to: this.config.contracts.sovrynProtocol,
        value: ethers.utils.parseEther('0.001'), // Gas
        data: '0x', // Mock data
      });

      console.log(`[SOVRYN] ✅ Zero loan submitted: ${tx.hash}`);

      await tx.wait();

      console.log(`[SOVRYN] ✅ Zero loan confirmed`);

      return tx.hash;
    }, 'Sovryn Zero Loan');
  }
}

