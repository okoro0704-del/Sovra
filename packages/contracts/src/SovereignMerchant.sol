// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPFFPayable.sol";

/**
 * @title SovereignMerchant - Example PFF-Certified Merchant
 * @notice Reference implementation of IPFFPayable interface
 * 
 * This contract demonstrates how any app or service can become a
 * "Sovereign Merchant" by implementing the IPFFPayable interface.
 * 
 * Features:
 * - Automatic PFF Gateway recognition
 * - VLT transparency logging
 * - Customizable transaction fees
 * - Payment history tracking
 * 
 * "Certified-by-PFF. Trusted by the Fabric."
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Commerce.
 */
contract SovereignMerchant is IPFFPayable, Ownable, ReentrancyGuard {
    // ============ STATE VARIABLES ============
    
    /// @notice Merchant name
    string public merchantName;
    
    /// @notice PFF certification status
    bool public pffCertified;
    
    /// @notice PFF certification hash
    bytes32 public certificationHash;
    
    /// @notice Certification expiry timestamp
    uint256 public certificationExpiry;
    
    /// @notice Transaction fee rate in basis points (e.g., 200 = 2%)
    uint256 public feeRateBPS;
    
    /// @notice VLT stats
    uint256 public totalPaymentsReceived;
    uint256 public totalVolumeReceived;
    uint256 public totalFeesCollected;
    uint256 public contributionToPeople;
    uint256 public contributionToInfrastructure;
    
    /// @notice Payment history
    mapping(bytes32 => PaymentRecord) public payments;
    bytes32[] public paymentHashes;
    
    struct PaymentRecord {
        address from;
        uint256 amount;
        bytes32 pffHash;
        string metadata;
        uint256 timestamp;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory _merchantName,
        uint256 _feeRateBPS
    ) {
        merchantName = _merchantName;
        feeRateBPS = _feeRateBPS;
        pffCertified = false;
    }
    
    // ============ IPFFPAYABLE IMPLEMENTATION ============
    
    /**
     * @notice Receive PFF-authorized payment
     * @dev Called by PFF Checkout Service after handshake authorization
     */
    function receivePFFPayment(
        address from,
        uint256 amount,
        bytes32 pffHash,
        string calldata metadata
    ) external override nonReentrant returns (bool success) {
        // Only accept payments from PFF Checkout Service
        // In production, verify msg.sender is the official PFF Checkout Service
        
        // Record payment
        bytes32 paymentHash = keccak256(abi.encodePacked(from, amount, pffHash, block.timestamp));
        
        payments[paymentHash] = PaymentRecord({
            from: from,
            amount: amount,
            pffHash: pffHash,
            metadata: metadata,
            timestamp: block.timestamp
        });
        
        paymentHashes.push(paymentHash);
        
        // Update stats
        totalPaymentsReceived++;
        totalVolumeReceived += amount;
        
        // Calculate fee split (50:50 People / Infrastructure)
        uint256 fee = (amount * feeRateBPS) / 10000;
        uint256 peopleShare = fee / 2;
        uint256 infrastructureShare = fee - peopleShare;
        
        totalFeesCollected += fee;
        contributionToPeople += peopleShare;
        contributionToInfrastructure += infrastructureShare;
        
        emit PFFPaymentReceived(from, amount, pffHash, metadata);
        emit RevenueSplitExecuted(amount, peopleShare, infrastructureShare, fee);
        
        return true;
    }
    
    /**
     * @notice Get merchant's PFF certification status
     */
    function getPFFCertification() external view override returns (
        bool certified,
        bytes32 certHash,
        uint256 expiresAt
    ) {
        return (pffCertified, certificationHash, certificationExpiry);
    }
    
    /**
     * @notice Get merchant's transaction fee rate
     */
    function getTransactionFeeRate() external view override returns (uint256 feeRate) {
        return feeRateBPS;
    }
    
    /**
     * @notice Get merchant's VLT transparency stats
     */
    function getVLTStats() external view override returns (
        uint256 totalPayments,
        uint256 totalVolume,
        uint256 totalFees,
        uint256 toPeople,
        uint256 toInfrastructure
    ) {
        return (
            totalPaymentsReceived,
            totalVolumeReceived,
            totalFeesCollected,
            contributionToPeople,
            contributionToInfrastructure
        );
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Set PFF certification (called by PFF Checkout Service)
     */
    function setPFFCertification(
        bool _certified,
        bytes32 _certHash,
        uint256 _expiresAt
    ) external onlyOwner {
        pffCertified = _certified;
        certificationHash = _certHash;
        certificationExpiry = _expiresAt;
    }
    
    /**
     * @notice Update fee rate
     */
    function setFeeRate(uint256 _feeRateBPS) external onlyOwner {
        require(_feeRateBPS <= 1000, "Fee cannot exceed 10%");
        feeRateBPS = _feeRateBPS;
    }
    
    /**
     * @notice Get payment count
     */
    function getPaymentCount() external view returns (uint256) {
        return paymentHashes.length;
    }
}

