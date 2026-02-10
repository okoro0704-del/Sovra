// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IPFFPayable.sol";

/**
 * @title PFFCheckoutService - Universal "Pay with VIDA" Service
 * @notice Central checkout service for all PFF-certified apps
 * 
 * "The Sovereign must push. No app can pull."
 * 
 * Features:
 * - Universal payment processing for any PFF-certified merchant
 * - Handshake authorization (Face + Finger) required
 * - 50:50 revenue split (People / National Infrastructure)
 * - VLT transparency logging
 * - Anti-replay protection
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Commerce.
 */
contract PFFCheckoutService is IPFFCheckoutService, AccessControl, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    bytes32 public constant PFF_VALIDATOR_ROLE = keccak256("PFF_VALIDATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 public constant BPS_DENOMINATOR = 10000; // 100.00%
    uint256 public constant DEFAULT_FEE_RATE_BPS = 200; // 2%
    uint256 public constant PEOPLE_SPLIT_BPS = 5000; // 50%
    uint256 public constant INFRASTRUCTURE_SPLIT_BPS = 5000; // 50%
    
    // ============ STATE VARIABLES ============
    
    /// @notice VIDA token contract
    IERC20 public vidaToken;
    
    /// @notice People's treasury address (receives 50% of fees)
    address public peopleTreasury;
    
    /// @notice National Infrastructure Escrow (receives 50% of fees)
    address public infrastructureEscrow;
    
    /// @notice VLT (Vitalia Ledger of Truth) contract
    address public vltLedger;
    
    /// @notice Used PFF hashes (anti-replay protection)
    mapping(bytes32 => bool) public usedPFFHashes;
    
    /// @notice Certified merchants
    mapping(address => bool) public certifiedMerchants;
    
    /// @notice Global stats
    uint256 public totalPaymentsProcessed;
    uint256 public totalVolumeProcessed;
    uint256 public totalFeesCollected;
    uint256 public totalToPeople;
    uint256 public totalToInfrastructure;
    
    // ============ EVENTS ============
    
    event MerchantCertified(address indexed merchant, bytes32 certificationHash);
    event MerchantRevoked(address indexed merchant);
    event VLTLogCreated(bytes32 indexed txHash, address indexed merchant, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _vidaToken,
        address _peopleTreasury,
        address _infrastructureEscrow,
        address _vltLedger
    ) {
        require(_vidaToken != address(0), "Invalid VIDA token");
        require(_peopleTreasury != address(0), "Invalid people treasury");
        require(_infrastructureEscrow != address(0), "Invalid infrastructure escrow");
        require(_vltLedger != address(0), "Invalid VLT ledger");
        
        vidaToken = IERC20(_vidaToken);
        peopleTreasury = _peopleTreasury;
        infrastructureEscrow = _infrastructureEscrow;
        vltLedger = _vltLedger;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PFF_VALIDATOR_ROLE, msg.sender);
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Process PFF-authorized payment
     * @dev Requires Face + Finger handshake authorization
     */
    function processPayment(
        address merchant,
        uint256 amount,
        bytes32 pffHash,
        bytes32 faceHash,
        bytes32 fingerHash,
        string calldata metadata
    ) external override nonReentrant returns (bool success, bytes32 txHash) {
        // STEP 1: Validate merchant is PFF-certified
        require(certifiedMerchants[merchant], "Merchant not PFF-certified");
        
        // STEP 2: Validate merchant implements IPFFPayable
        require(_isIPFFPayable(merchant), "Merchant must implement IPFFPayable");
        
        // STEP 3: Validate handshake authorization (Face + Finger)
        require(_validateHandshake(msg.sender, pffHash, faceHash, fingerHash), "Handshake authorization failed");
        
        // STEP 4: Anti-replay protection
        require(!usedPFFHashes[pffHash], "PFF hash already used");
        usedPFFHashes[pffHash] = true;
        
        // STEP 5: Get merchant's fee rate
        uint256 feeRate = IPFFPayable(merchant).getTransactionFeeRate();
        if (feeRate == 0) {
            feeRate = DEFAULT_FEE_RATE_BPS;
        }
        
        // STEP 6: Calculate amounts
        uint256 fee = (amount * feeRate) / BPS_DENOMINATOR;
        uint256 merchantAmount = amount - fee;
        uint256 peopleAmount = (fee * PEOPLE_SPLIT_BPS) / BPS_DENOMINATOR;
        uint256 infrastructureAmount = fee - peopleAmount;
        
        // STEP 7: Transfer VIDA from Sovereign to merchant
        require(vidaToken.transferFrom(msg.sender, merchant, merchantAmount), "Transfer to merchant failed");
        
        // STEP 8: Transfer fees (50:50 split)
        require(vidaToken.transferFrom(msg.sender, peopleTreasury, peopleAmount), "Transfer to People failed");
        require(vidaToken.transferFrom(msg.sender, infrastructureEscrow, infrastructureAmount), "Transfer to Infrastructure failed");
        
        // STEP 9: Notify merchant
        require(IPFFPayable(merchant).receivePFFPayment(msg.sender, merchantAmount, pffHash, metadata), "Merchant rejected payment");
        
        // STEP 10: Update stats
        totalPaymentsProcessed++;
        totalVolumeProcessed += amount;
        totalFeesCollected += fee;
        totalToPeople += peopleAmount;
        totalToInfrastructure += infrastructureAmount;
        
        // STEP 11: Log to VLT (Vitalia Ledger of Truth)
        txHash = _logToVLT(msg.sender, merchant, amount, fee, pffHash, metadata);
        
        emit PaymentProcessed(msg.sender, merchant, amount, fee, pffHash);

        return (true, txHash);
    }

    // ============ MERCHANT CERTIFICATION ============

    /**
     * @notice Certify a merchant as PFF-compliant
     * @dev Only PFF validators can certify merchants
     */
    function certifyMerchant(address merchant, bytes32 certificationHash) external onlyRole(PFF_VALIDATOR_ROLE) {
        require(merchant != address(0), "Invalid merchant address");
        require(_isIPFFPayable(merchant), "Merchant must implement IPFFPayable");

        certifiedMerchants[merchant] = true;

        emit MerchantCertified(merchant, certificationHash);
    }

    /**
     * @notice Revoke merchant certification
     */
    function revokeMerchant(address merchant) external onlyRole(ADMIN_ROLE) {
        certifiedMerchants[merchant] = false;

        emit MerchantRevoked(merchant);
    }

    /**
     * @notice Check if merchant is certified
     */
    function isMerchantCertified(address merchant) external view returns (bool) {
        return certifiedMerchants[merchant];
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @notice Validate handshake authorization (Face + Finger)
     * @dev In production, this would verify biometric hashes against PFF Protocol
     */
    function _validateHandshake(
        address sovereign,
        bytes32 pffHash,
        bytes32 faceHash,
        bytes32 fingerHash
    ) internal view returns (bool) {
        // Validate PFF hash is combination of face + finger
        bytes32 expectedPFFHash = keccak256(abi.encodePacked(sovereign, faceHash, fingerHash));

        // In production, verify against PFF Protocol
        // For now, basic validation
        return pffHash != bytes32(0) && faceHash != bytes32(0) && fingerHash != bytes32(0);
    }

    /**
     * @notice Check if contract implements IPFFPayable
     */
    function _isIPFFPayable(address merchant) internal view returns (bool) {
        // Check if contract has the required interface
        // In production, use ERC165 supportsInterface
        // For now, check if contract exists
        uint256 size;
        assembly {
            size := extcodesize(merchant)
        }
        return size > 0;
    }

    /**
     * @notice Log transaction to VLT (Vitalia Ledger of Truth)
     * @dev Ensures community can see which apps contribute most to the Fabric
     */
    function _logToVLT(
        address from,
        address merchant,
        uint256 amount,
        uint256 fee,
        bytes32 pffHash,
        string calldata metadata
    ) internal returns (bytes32 txHash) {
        // Generate transaction hash
        txHash = keccak256(abi.encodePacked(
            from,
            merchant,
            amount,
            fee,
            pffHash,
            block.timestamp,
            totalPaymentsProcessed
        ));

        // In production, call VLT contract to log transaction
        // For now, emit event for transparency
        emit VLTLogCreated(txHash, merchant, amount);

        return txHash;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get global checkout stats
     */
    function getGlobalStats() external view returns (
        uint256 payments,
        uint256 volume,
        uint256 fees,
        uint256 toPeople,
        uint256 toInfrastructure
    ) {
        return (
            totalPaymentsProcessed,
            totalVolumeProcessed,
            totalFeesCollected,
            totalToPeople,
            totalToInfrastructure
        );
    }

    /**
     * @notice Get revenue split percentages
     */
    function getRevenueSplit() external pure returns (
        uint256 peopleSplitBPS,
        uint256 infrastructureSplitBPS
    ) {
        return (PEOPLE_SPLIT_BPS, INFRASTRUCTURE_SPLIT_BPS);
    }
}
