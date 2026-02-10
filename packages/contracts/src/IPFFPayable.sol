// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPFFPayable - Universal PFF-Gateway Protocol Interface
 * @notice "Certified-by-PFF" Hook for Sovereign Merchants
 * 
 * Any smart contract or app that implements this interface is automatically
 * recognized as a "Sovereign Merchant" and can accept VIDA payments through
 * the Universal PFF Checkout Service.
 * 
 * Features:
 * - Global interface for PFF-certified merchants
 * - Automatic recognition by PFF Gateway
 * - Standardized payment flow
 * - VLT transparency logging
 * - 50:50 revenue split (People / National Infrastructure)
 * 
 * "The Sovereign must push. No app can pull."
 * 
 * Born in Lagos, Nigeria. Built for Universal Commerce.
 */
interface IPFFPayable {
    // ============ EVENTS ============
    
    /**
     * @notice Emitted when a PFF payment is received
     * @param from Sovereign citizen address
     * @param amount Amount of VIDA received
     * @param pffHash PFF verification hash
     * @param metadata Payment metadata
     */
    event PFFPaymentReceived(
        address indexed from,
        uint256 amount,
        bytes32 pffHash,
        string metadata
    );
    
    /**
     * @notice Emitted when revenue split is executed
     * @param merchantAmount Amount to merchant (after fees)
     * @param peopleAmount Amount to People (50% of fee)
     * @param infrastructureAmount Amount to National Infrastructure (50% of fee)
     * @param totalFee Total transaction fee
     */
    event RevenueSplitExecuted(
        uint256 merchantAmount,
        uint256 peopleAmount,
        uint256 infrastructureAmount,
        uint256 totalFee
    );
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Receive PFF-authorized payment
     * @dev Called by PFF Checkout Service after handshake authorization
     * @param from Sovereign citizen address
     * @param amount Amount of VIDA being paid
     * @param pffHash PFF verification hash (Face + Finger)
     * @param metadata Payment metadata (description, reference, etc.)
     * @return success Payment acceptance status
     */
    function receivePFFPayment(
        address from,
        uint256 amount,
        bytes32 pffHash,
        string calldata metadata
    ) external returns (bool success);
    
    /**
     * @notice Get merchant's PFF certification status
     * @return certified Is merchant PFF-certified?
     * @return certificationHash PFF certification hash
     * @return expiresAt Certification expiry timestamp
     */
    function getPFFCertification() external view returns (
        bool certified,
        bytes32 certificationHash,
        uint256 expiresAt
    );
    
    /**
     * @notice Get merchant's transaction fee rate
     * @dev Fee is split 50:50 between People and National Infrastructure
     * @return feeRateBPS Fee rate in basis points (e.g., 200 = 2%)
     */
    function getTransactionFeeRate() external view returns (uint256 feeRateBPS);
    
    /**
     * @notice Get merchant's VLT transparency stats
     * @return totalPayments Total payments received
     * @return totalVolume Total VIDA volume processed
     * @return totalFeesCollected Total fees collected
     * @return contributionToPeople Total contribution to People
     * @return contributionToInfrastructure Total contribution to National Infrastructure
     */
    function getVLTStats() external view returns (
        uint256 totalPayments,
        uint256 totalVolume,
        uint256 totalFeesCollected,
        uint256 contributionToPeople,
        uint256 contributionToInfrastructure
    );
}

/**
 * @title IPFFCheckoutService - Universal PFF Checkout Service Interface
 * @notice Central service for processing PFF-authorized payments
 * 
 * This service handles all payments from PFF-certified apps to Sovereign Merchants.
 * It enforces the "Handshake Authorization" rule: no app can pull money,
 * the Sovereign must push it.
 */
interface IPFFCheckoutService {
    // ============ EVENTS ============
    
    /**
     * @notice Emitted when a payment is processed
     * @param from Sovereign citizen
     * @param to Merchant contract
     * @param amount Amount paid
     * @param fee Transaction fee
     * @param pffHash PFF verification hash
     */
    event PaymentProcessed(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        bytes32 pffHash
    );
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Process PFF-authorized payment
     * @dev Requires Face + Finger handshake authorization
     * @param merchant Merchant contract address (must implement IPFFPayable)
     * @param amount Amount to pay
     * @param pffHash PFF verification hash
     * @param faceHash Face biometric hash
     * @param fingerHash Finger biometric hash
     * @param metadata Payment metadata
     * @return success Payment success status
     * @return txHash Transaction hash
     */
    function processPayment(
        address merchant,
        uint256 amount,
        bytes32 pffHash,
        bytes32 faceHash,
        bytes32 fingerHash,
        string calldata metadata
    ) external returns (bool success, bytes32 txHash);
}

