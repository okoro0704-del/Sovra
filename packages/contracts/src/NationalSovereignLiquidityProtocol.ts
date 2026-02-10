/**
 * @title NationalSovereignLiquidityProtocol - TypeScript Integration Layer
 * @notice "THE WEALTH OF THE NATION IS THE PRESENCE OF ITS PEOPLE. NO DOLLARS REQUIRED."
 * @dev TypeScript wrapper for National Sovereign Liquidity Protocol contract
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

export enum NationalJurisdiction {
    NIGERIA = 0,
    GHANA = 1
}

export interface ProtocolStats {
    totalSwapsCount: bigint;
    totalCrossBorderCount: bigint;
    nigeriaTotalLocked: bigint;
    ghanaTotalLocked: bigint;
    nigeriaStableSupply: bigint;
    ghanaStableSupply: bigint;
}

export interface LiquidityInfo {
    lockedBalance: bigint;
    dailyLimit: bigint;
    remainingDailyLiquidity: bigint;
}

// ════════════════════════════════════════════════════════════════════════════════
// NATIONAL SOVEREIGN LIQUIDITY PROTOCOL CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class NationalSovereignLiquidityProtocol {
    private contract: any;

    constructor(contractInstance: any) {
        this.contract = contractInstance;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - THE SWAP LOGIC
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * Issue National Stable (Swap VIDA CAP for ngVIDA/ghVIDA)
     * VIDA CAP is LOCKED (not burned), Stable unit is ISSUED (minted)
     */
    async issueNationalStable(
        jurisdiction: NationalJurisdiction,
        vidaCapAmount: bigint
    ): Promise<bigint> {
        const tx = await this.contract.issueNationalStable(jurisdiction, vidaCapAmount);
        const receipt = await tx.wait();
        
        // Extract stableIssued from event
        const event = receipt.events?.find((e: any) => e.event === 'NationalStableIssued');
        return event?.args?.stableIssued || vidaCapAmount;
    }

    /**
     * Redeem National Stable (Swap ngVIDA/ghVIDA back to VIDA CAP)
     * Unlocks VIDA CAP and burns National Stable
     */
    async redeemNationalStable(
        jurisdiction: NationalJurisdiction,
        stableAmount: bigint
    ): Promise<bigint> {
        const tx = await this.contract.redeemNationalStable(jurisdiction, stableAmount);
        const receipt = await tx.wait();
        
        // Extract vidaCapUnlocked from event
        const event = receipt.events?.find((e: any) => e.event === 'VIDACapUnlocked');
        return event?.args?.amount || stableAmount;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CROSS-BORDER BRIDGE
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * Cross-Border Transfer (ngVIDA → VIDA CAP → ghVIDA)
     * Automatic routing through VIDA CAP backbone
     */
    async crossBorderTransfer(
        fromJurisdiction: NationalJurisdiction,
        toJurisdiction: NationalJurisdiction,
        recipient: string,
        amount: bigint
    ): Promise<void> {
        const tx = await this.contract.crossBorderTransfer(
            fromJurisdiction,
            toJurisdiction,
            recipient,
            amount
        );
        await tx.wait();
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * Get locked VIDA CAP balance for a citizen
     */
    async getLockedBalance(citizen: string): Promise<bigint> {
        return await this.contract.getLockedBalance(citizen);
    }

    /**
     * Get daily liquidity limit for a citizen (10% of locked balance)
     */
    async getDailyLimit(citizen: string): Promise<bigint> {
        return await this.contract.getDailyLimit(citizen);
    }

    /**
     * Get remaining daily liquidity for a citizen
     */
    async getRemainingDailyLiquidity(citizen: string): Promise<bigint> {
        return await this.contract.getRemainingDailyLiquidity(citizen);
    }

    /**
     * Get liquidity info for a citizen (all in one call)
     */
    async getLiquidityInfo(citizen: string): Promise<LiquidityInfo> {
        const [lockedBalance, dailyLimit, remainingDailyLiquidity] = await Promise.all([
            this.getLockedBalance(citizen),
            this.getDailyLimit(citizen),
            this.getRemainingDailyLiquidity(citizen)
        ]);

        return {
            lockedBalance,
            dailyLimit,
            remainingDailyLiquidity
        };
    }

    /**
     * Get cross-border transfer volume between jurisdictions
     */
    async getCrossBorderStats(
        from: NationalJurisdiction,
        to: NationalJurisdiction
    ): Promise<bigint> {
        return await this.contract.getCrossBorderStats(from, to);
    }

    /**
     * Get protocol statistics
     */
    async getProtocolStats(): Promise<ProtocolStats> {
        const stats = await this.contract.getProtocolStats();
        return {
            totalSwapsCount: stats.totalSwapsCount,
            totalCrossBorderCount: stats.totalCrossBorderCount,
            nigeriaTotalLocked: stats.nigeriaTotalLocked,
            ghanaTotalLocked: stats.ghanaTotalLocked,
            nigeriaStableSupply: stats.nigeriaStableSupply,
            ghanaStableSupply: stats.ghanaStableSupply
        };
    }

    /**
     * Get primary unit of account (VIDA CAP)
     */
    async getPrimaryUnitOfAccount(): Promise<string> {
        return await this.contract.getPrimaryUnitOfAccount();
    }

    /**
     * Check if USD pegging is enabled (FALSE - De-Dollarized)
     */
    async isUSDPeggingEnabled(): Promise<boolean> {
        return await this.contract.isUSDPeggingEnabled();
    }

    /**
     * Get fiat dependency status (NONE)
     */
    async getFiatDependency(): Promise<string> {
        return await this.contract.getFiatDependency();
    }

    /**
     * Get protocol metadata
     */
    async getProtocolMetadata(): Promise<string> {
        return await this.contract.getProtocolMetadata();
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * Grant PFF Sentinel role
     */
    async grantPFFSentinelRole(account: string): Promise<void> {
        const tx = await this.contract.grantPFFSentinelRole(account);
        await tx.wait();
    }

    /**
     * Grant Oracle role
     */
    async grantOracleRole(account: string): Promise<void> {
        const tx = await this.contract.grantOracleRole(account);
        await tx.wait();
    }

    /**
     * Revoke PFF Sentinel role
     */
    async revokePFFSentinelRole(account: string): Promise<void> {
        const tx = await this.contract.revokePFFSentinelRole(account);
        await tx.wait();
    }

    /**
     * Revoke Oracle role
     */
    async revokeOracleRole(account: string): Promise<void> {
        const tx = await this.contract.revokeOracleRole(account);
        await tx.wait();
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format VIDA CAP amount (18 decimals)
 */
export function formatVIDACAP(amount: bigint): string {
    const decimals = 18n;
    const divisor = 10n ** decimals;
    const whole = amount / divisor;
    const fraction = amount % divisor;

    if (fraction === 0n) {
        return `${whole} VIDA CAP`;
    }

    return `${whole}.${fraction.toString().padStart(Number(decimals), '0')} VIDA CAP`;
}

/**
 * Parse VIDA CAP amount (18 decimals)
 */
export function parseVIDACAP(amount: string): bigint {
    const decimals = 18n;
    const parts = amount.split('.');
    const whole = BigInt(parts[0] || '0');
    const fraction = parts[1] || '0';

    const fractionPadded = fraction.padEnd(Number(decimals), '0').slice(0, Number(decimals));
    const fractionBigInt = BigInt(fractionPadded);

    return (whole * (10n ** decimals)) + fractionBigInt;
}

/**
 * Get jurisdiction name
 */
export function getJurisdictionName(jurisdiction: NationalJurisdiction): string {
    switch (jurisdiction) {
        case NationalJurisdiction.NIGERIA:
            return 'Nigeria';
        case NationalJurisdiction.GHANA:
            return 'Ghana';
        default:
            return 'Unknown';
    }
}

/**
 * Get national stable token name
 */
export function getNationalStableName(jurisdiction: NationalJurisdiction): string {
    switch (jurisdiction) {
        case NationalJurisdiction.NIGERIA:
            return 'ngVIDA';
        case NationalJurisdiction.GHANA:
            return 'ghVIDA';
        default:
            return 'Unknown';
    }
}

