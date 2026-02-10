/**
 * @title NVIDASovereignBridge - TypeScript Integration Layer
 * @notice Dual-currency state bridge with February-April lock and national pegging
 * @dev Implements N-VIDA_NGN and N-VIDA_GHS with Human Standard of Living index
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export enum NationalJurisdiction {
    NIGERIA = 0,
    GHANA = 1
}

export interface NVIDAStats {
    nVidaSupply: bigint;
    escrowBalance: bigint;
    humanStandardIndex: bigint;
    inLockPeriod: boolean;
    bridgeActive: boolean;
    daysUntilUnlock: bigint;
    internalTransfers: bigint;
}

export interface LiquidityReserveStats {
    escrowBalance: bigint;
    nVidaSupply: bigint;
    backingRatio: bigint;
    availableCollateral: bigint;
    inLockPeriod: boolean;
    withdrawals: bigint;
}

// ════════════════════════════════════════════════════════════════════════════════
// NVIDA SOVEREIGN BRIDGE
// ════════════════════════════════════════════════════════════════════════════════

export class NVIDASovereignBridge {
    private contract: any;

    constructor(contractInstance: any) {
        this.contract = contractInstance;
    }

    /**
     * Mint N-VIDA from National Escrow backing
     */
    async mintNVIDA(
        jurisdiction: NationalJurisdiction,
        citizen: string,
        vidaCapAmount: bigint
    ): Promise<void> {
        await this.contract.mintNVIDA(jurisdiction, citizen, vidaCapAmount);
    }

    /**
     * Internal Transfer (PFF-Verified)
     */
    async internalTransfer(
        jurisdiction: NationalJurisdiction,
        from: string,
        to: string,
        amount: bigint,
        pffHash: string
    ): Promise<void> {
        await this.contract.internalTransfer(jurisdiction, from, to, amount, pffHash);
    }

    /**
     * Convert N-VIDA to USD (TIMELOCK until April 7th, 2026)
     */
    async convertToUSD(
        jurisdiction: NationalJurisdiction,
        citizen: string,
        nVidaAmount: bigint
    ): Promise<bigint> {
        const result = await this.contract.convertToUSD(jurisdiction, citizen, nVidaAmount);
        return result;
    }

    /**
     * Activate Fiat Bridge (April 7th, 2026 - Grand Entrance)
     */
    async activateFiatBridge(): Promise<void> {
        await this.contract.activateFiatBridge();
    }

    /**
     * Update Human Standard of Living Index
     */
    async updateHumanStandardOfLivingIndex(
        jurisdiction: NationalJurisdiction,
        newIndex: bigint
    ): Promise<void> {
        await this.contract.updateHumanStandardOfLivingIndex(jurisdiction, newIndex);
    }

    /**
     * Update Liquidity Reserve Balance
     */
    async updateLiquidityReserve(
        jurisdiction: NationalJurisdiction,
        amount: bigint
    ): Promise<void> {
        await this.contract.updateLiquidityReserve(jurisdiction, amount);
    }

    /**
     * Check if we are in lock period (Feb 7th - April 7th)
     */
    async isInLockPeriod(): Promise<boolean> {
        return await this.contract.isInLockPeriod();
    }

    /**
     * Get days until lock period ends
     */
    async getDaysUntilUnlock(): Promise<bigint> {
        return await this.contract.getDaysUntilUnlock();
    }

    /**
     * Get N-VIDA token address for jurisdiction
     */
    async getNVIDAToken(jurisdiction: NationalJurisdiction): Promise<string> {
        return await this.contract.getNVIDAToken(jurisdiction);
    }

    /**
     * Get backing ratio (should always be 100%)
     */
    async getBackingRatio(jurisdiction: NationalJurisdiction): Promise<bigint> {
        return await this.contract.getBackingRatio(jurisdiction);
    }

    /**
     * Get comprehensive stats
     */
    async getStats(jurisdiction: NationalJurisdiction): Promise<NVIDAStats> {
        const stats = await this.contract.getStats(jurisdiction);
        return {
            nVidaSupply: stats.nVidaSupply,
            escrowBalance: stats.escrowBalance,
            humanStandardIndex: stats.humanStandardIndex,
            inLockPeriod: stats.inLockPeriod,
            bridgeActive: stats.bridgeActive,
            daysUntilUnlock: stats.daysUntilUnlock,
            internalTransfers: stats.internalTransfers
        };
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// LIQUIDITY RESERVE
// ════════════════════════════════════════════════════════════════════════════════

export class LiquidityReserve {
    private contract: any;

    constructor(contractInstance: any) {
        this.contract = contractInstance;
    }

    /**
     * Deposit VIDA Cap collateral from National Escrow
     */
    async depositCollateral(
        jurisdiction: NationalJurisdiction,
        amount: bigint
    ): Promise<void> {
        await this.contract.depositCollateral(jurisdiction, amount);
    }

    /**
     * Withdraw VIDA Cap collateral (LOCKED until April 7th)
     */
    async withdrawCollateral(
        jurisdiction: NationalJurisdiction,
        recipient: string,
        amount: bigint
    ): Promise<void> {
        await this.contract.withdrawCollateral(jurisdiction, recipient, amount);
    }

    /**
     * Update N-VIDA supply (called by bridge when minting/burning)
     */
    async updateNVIDASupply(
        jurisdiction: NationalJurisdiction,
        newSupply: bigint
    ): Promise<void> {
        await this.contract.updateNVIDASupply(jurisdiction, newSupply);
    }

    /**
     * Check if we are in lock period
     */
    async isInLockPeriod(): Promise<boolean> {
        return await this.contract.isInLockPeriod();
    }

    /**
     * Get backing ratio (should always be 100% or higher)
     */
    async getBackingRatio(jurisdiction: NationalJurisdiction): Promise<bigint> {
        return await this.contract.getBackingRatio(jurisdiction);
    }

    /**
     * Get available collateral (excess over 100% backing)
     */
    async getAvailableCollateral(jurisdiction: NationalJurisdiction): Promise<bigint> {
        return await this.contract.getAvailableCollateral(jurisdiction);
    }

    /**
     * Get comprehensive stats
     */
    async getStats(jurisdiction: NationalJurisdiction): Promise<LiquidityReserveStats> {
        const stats = await this.contract.getStats(jurisdiction);
        return {
            escrowBalance: stats.escrowBalance,
            nVidaSupply: stats.nVidaSupply,
            backingRatio: stats.backingRatio,
            availableCollateral: stats.availableCollateral,
            inLockPeriod: stats.inLockPeriod,
            withdrawals: stats.withdrawals
        };
    }

    /**
     * Get days until lock period ends
     */
    async getDaysUntilUnlock(): Promise<bigint> {
        return await this.contract.getDaysUntilUnlock();
    }

    /**
     * Check if withdrawal is allowed
     */
    async canWithdraw(): Promise<boolean> {
        return await this.contract.canWithdraw();
    }

    /**
     * Grant Bridge Role
     */
    async grantBridgeRole(account: string): Promise<void> {
        await this.contract.grantBridgeRole(account);
    }

    /**
     * Revoke Bridge Role
     */
    async revokeBridgeRole(account: string): Promise<void> {
        await this.contract.revokeBridgeRole(account);
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get jurisdiction name
 */
export function getJurisdictionName(jurisdiction: NationalJurisdiction): string {
    return jurisdiction === NationalJurisdiction.NIGERIA ? 'Nigeria' : 'Ghana';
}

/**
 * Get N-VIDA token symbol
 */
export function getNVIDASymbol(jurisdiction: NationalJurisdiction): string {
    return jurisdiction === NationalJurisdiction.NIGERIA ? 'N-VIDA_NGN' : 'N-VIDA_GHS';
}

/**
 * Format VIDA Cap amount (18 decimals)
 */
export function formatVIDACapAmount(amount: bigint): string {
    const divisor = BigInt(10 ** 18);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    return `${whole}.${fraction.toString().padStart(18, '0')} VIDA Cap`;
}

/**
 * Format N-VIDA amount (18 decimals)
 */
export function formatNVIDAAmount(amount: bigint, jurisdiction: NationalJurisdiction): string {
    const divisor = BigInt(10 ** 18);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const symbol = getNVIDASymbol(jurisdiction);
    return `${whole}.${fraction.toString().padStart(18, '0')} ${symbol}`;
}

/**
 * Format backing ratio (percentage)
 */
export function formatBackingRatio(ratio: bigint): string {
    return `${ratio}%`;
}

/**
 * Check if date is in lock period
 */
export function isDateInLockPeriod(timestamp: number): boolean {
    const LOCK_START_DATE = 1739059200; // Feb 7th, 2026 00:00:00 UTC
    const LOCK_END_DATE = 1744243200; // April 7th, 2026 00:00:00 UTC
    return timestamp >= LOCK_START_DATE && timestamp < LOCK_END_DATE;
}

/**
 * Get days until unlock
 */
export function getDaysUntilUnlock(currentTimestamp: number): number {
    const LOCK_END_DATE = 1744243200; // April 7th, 2026 00:00:00 UTC
    if (currentTimestamp >= LOCK_END_DATE) {
        return 0;
    }
    const secondsRemaining = LOCK_END_DATE - currentTimestamp;
    return Math.ceil(secondsRemaining / 86400); // 86400 seconds in a day
}

