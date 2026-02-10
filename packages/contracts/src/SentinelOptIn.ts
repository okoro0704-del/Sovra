/**
 * SentinelOptIn.ts - TypeScript Integration Layer
 * 
 * "Security is a choice, not a mandate."
 * 
 * Features:
 * - Sentinel activation/deactivation
 * - Status checking
 * - Fee transparency
 * - Badge display logic
 * 
 * Born in Lagos, Nigeria. Built for Humanity. 🇳🇬
 * Architect: ISREAL OKORO
 */

import { ethers } from 'ethers';

// ============================================================================
// TYPES
// ============================================================================

export interface SentinelStatus {
    isActive: boolean;
    badge: 'Sentinel Guarded' | 'Standard Protection';
    activatedAt: number;
}

export interface FeatureInfo {
    name: string;
    description: string;
    metadata: string;
}

export interface ProtocolStats {
    totalActivations: number;
    totalFeesCollected: bigint;
    defaultState: boolean;
}

export interface ActivationCheck {
    canActivate: boolean;
    reason: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ACTIVATION_FEE = ethers.utils.parseEther('0.1'); // 0.1 ngVIDA
export const ACTIVATION_FEE_STRING = '0.1 ngVIDA';
export const DEFAULT_SENTINEL_STATE = false;

export const FEATURE_INFO: FeatureInfo = {
    name: 'PFF Sentinel',
    description: 'Optional, system-level upgrade for those holding high-value Sovereign wealth.',
    metadata: 'Security is a choice, not a mandate.',
};

// ============================================================================
// SENTINEL OPT-IN CLASS
// ============================================================================

export class SentinelOptIn {
    private contract: ethers.Contract;
    private signer: ethers.Signer;

    constructor(contractAddress: string, signer: ethers.Signer) {
        // In production, load ABI from compiled contract
        const abi = [
            'function downloadSentinel() external returns (bool)',
            'function deactivateSentinel() external returns (bool)',
            'function getSentinelStatus(address) external view returns (bool, string, uint256)',
            'function getActivationFee() external pure returns (uint256)',
            'function getActivationFeeString() external pure returns (string)',
            'function getFeatureInfo() external pure returns (string, string, string)',
            'function getProtocolStats() external view returns (uint256, uint256, bool)',
            'function canActivateSentinel(address) external view returns (bool, string)',
            'event SentinelActivated(address indexed citizen, uint256 fee, uint256 timestamp)',
            'event SentinelDeactivated(address indexed citizen, uint256 timestamp)',
        ];

        this.contract = new ethers.Contract(contractAddress, abi, signer);
        this.signer = signer;
    }

    // ========================================================================
    // CORE FUNCTIONS
    // ========================================================================

    /**
     * Download Sentinel (Manual Activation)
     * 
     * ONLY executes upon deliberate user click on "Activate Sentinel" button
     * 
     * Requirements:
     * - Citizen must approve ngVIDA spending BEFORE calling this function
     * - Citizen must have at least 0.1 ngVIDA balance
     * 
     * @returns Transaction receipt
     */
    async downloadSentinel(): Promise<ethers.ContractReceipt> {
        const tx = await this.contract.downloadSentinel();
        return await tx.wait();
    }

    /**
     * Deactivate Sentinel
     * 
     * @returns Transaction receipt
     */
    async deactivateSentinel(): Promise<ethers.ContractReceipt> {
        const tx = await this.contract.deactivateSentinel();
        return await tx.wait();
    }

    // ========================================================================
    // VIEW FUNCTIONS - STATUS CHECK
    // ========================================================================

    /**
     * Get Sentinel status for citizen
     * 
     * @param citizen Citizen address
     * @returns Sentinel status
     */
    async getSentinelStatus(citizen: string): Promise<SentinelStatus> {
        const [isActive, badge, activatedAt] = await this.contract.getSentinelStatus(citizen);
        
        return {
            isActive,
            badge: badge as 'Sentinel Guarded' | 'Standard Protection',
            activatedAt: activatedAt.toNumber(),
        };
    }

    /**
     * Get activation fee
     * 
     * @returns Activation fee in wei
     */
    async getActivationFee(): Promise<bigint> {
        const fee = await this.contract.getActivationFee();
        return fee.toBigInt();
    }

    /**
     * Get activation fee as string
     * 
     * @returns Activation fee string (e.g., "0.1 ngVIDA")
     */
    async getActivationFeeString(): Promise<string> {
        return await this.contract.getActivationFeeString();
    }

    /**
     * Get feature information
     * 
     * @returns Feature info
     */
    async getFeatureInfo(): Promise<FeatureInfo> {
        const [name, description, metadata] = await this.contract.getFeatureInfo();
        
        return {
            name,
            description,
            metadata,
        };
    }

    /**
     * Get protocol statistics
     *
     * @returns Protocol stats
     */
    async getProtocolStats(): Promise<ProtocolStats> {
        const [activations, feesCollected, defaultState] = await this.contract.getProtocolStats();

        return {
            totalActivations: activations.toNumber(),
            totalFeesCollected: feesCollected.toBigInt(),
            defaultState,
        };
    }

    /**
     * Check if citizen can activate Sentinel
     *
     * @param citizen Citizen address
     * @returns Activation check result
     */
    async canActivateSentinel(citizen: string): Promise<ActivationCheck> {
        const [canActivate, reason] = await this.contract.canActivateSentinel(citizen);

        return {
            canActivate,
            reason,
        };
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * Get current user's Sentinel status
     *
     * @returns Sentinel status for current user
     */
    async getMyStatus(): Promise<SentinelStatus> {
        const address = await this.signer.getAddress();
        return this.getSentinelStatus(address);
    }

    /**
     * Check if current user can activate Sentinel
     *
     * @returns Activation check result for current user
     */
    async canIActivate(): Promise<ActivationCheck> {
        const address = await this.signer.getAddress();
        return this.canActivateSentinel(address);
    }

    /**
     * Format activation fee for display
     *
     * @param fee Fee in wei
     * @returns Formatted fee string
     */
    static formatActivationFee(fee: bigint): string {
        return `${ethers.utils.formatEther(fee)} ngVIDA`;
    }

    /**
     * Get badge icon based on status
     *
     * @param isActive Sentinel active status
     * @returns Badge icon (emoji)
     */
    static getBadgeIcon(isActive: boolean): string {
        return isActive ? '🛡️' : '🔓';
    }

    /**
     * Get badge color based on status
     *
     * @param isActive Sentinel active status
     * @returns Badge color (hex)
     */
    static getBadgeColor(isActive: boolean): string {
        return isActive ? '#FFD700' : '#808080'; // Gold vs Gray
    }

    /**
     * Get shield glow status
     *
     * @param isActive Sentinel active status
     * @returns True if shield should glow
     */
    static shouldShieldGlow(isActive: boolean): boolean {
        return isActive;
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format timestamp to human-readable date
 *
 * @param timestamp Unix timestamp
 * @returns Formatted date string
 */
export function formatActivationDate(timestamp: number): string {
    if (timestamp === 0) {
        return 'Not activated';
    }

    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get status badge text
 *
 * @param isActive Sentinel active status
 * @returns Badge text
 */
export function getStatusBadge(isActive: boolean): string {
    return isActive ? 'Sentinel Guarded' : 'Standard Protection';
}

/**
 * Get status description
 *
 * @param isActive Sentinel active status
 * @returns Status description
 */
export function getStatusDescription(isActive: boolean): string {
    if (isActive) {
        return 'Your account is protected by PFF Sentinel with military-grade biometric security.';
    } else {
        return 'Your account has standard protection. Upgrade to Sentinel for enhanced security.';
    }
}

