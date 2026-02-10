// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SentinelAuthorityAPI
 * @notice Sentinel Authority API - Payment Gateway Integration
 * 
 * "MAPPING REVENUE. INITIALIZING SOVEREIGN IDENTITY. THE GENESIS BEGINS."
 * 
 * CORE LOGIC:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Sentinel Payment Gateway connected to National Vault logic
 * - Enterprise Tier 3 ($1,000): $500 National Escrow / $500 Citizen Block
 * - Sovereign Identity Table initialization with Genesis Hash from Root Pair
 * - Revenue routing based on Sentinel tier activation
 * 
 * REVENUE MAPPING:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Tier 1 ($20): 50% National Escrow / 50% Citizen Block
 * - Tier 2 ($50): 50% National Escrow / 50% Citizen Block
 * - Tier 3 ($1,000 Enterprise): 50% National Escrow ($500) / 50% Citizen Block ($500)
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

interface IVIDACapToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface INationalVault {
    function depositToNationalEscrow(string memory iso3166Code, uint256 amount) external;
    function getNationalEscrowBalance(string memory iso3166Code) external view returns (uint256);
}

interface ICitizenBlock {
    function depositToCitizenBlock(uint256 amount) external;
    function getTotalCitizenBlockBalance() external view returns (uint256);
}

contract SentinelAuthorityAPI is AccessControl, ReentrancyGuard {
    
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAYMENT_GATEWAY_ROLE = keccak256("PAYMENT_GATEWAY_ROLE");
    bytes32 public constant IDENTITY_MANAGER_ROLE = keccak256("IDENTITY_MANAGER_ROLE");
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS - SENTINEL TIER PRICING (USD)
    // ════════════════════════════════════════════════════════════════════════════════
    
    /// @notice Tier 1: $20 for 1 device
    uint256 public constant TIER_1_PRICE_USD = 20;
    uint256 public constant TIER_1_DEVICES = 1;
    
    /// @notice Tier 2: $50 for 3 devices
    uint256 public constant TIER_2_PRICE_USD = 50;
    uint256 public constant TIER_2_DEVICES = 3;
    
    /// @notice Tier 3 (Enterprise): $1,000 for 15 devices
    uint256 public constant TIER_3_ENTERPRISE_PRICE_USD = 1000;
    uint256 public constant TIER_3_DEVICES = 15;
    
    /// @notice Revenue split: 50% to National Escrow
    uint256 public constant NATIONAL_ESCROW_SPLIT_BPS = 5000; // 50%
    
    /// @notice Revenue split: 50% to Citizen Block
    uint256 public constant CITIZEN_BLOCK_SPLIT_BPS = 5000; // 50%
    
    /// @notice Basis points denominator (100% = 10,000 basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    /// @notice VIDA Cap token contract
    IVIDACapToken public vidaCapToken;
    
    /// @notice National Vault contract
    INationalVault public nationalVault;
    
    /// @notice Citizen Block contract
    ICitizenBlock public citizenBlock;
    
    /// @notice Total revenue collected
    uint256 public totalRevenueCollected;
    
    /// @notice Total allocated to National Escrow
    uint256 public totalNationalEscrowAllocated;
    
    /// @notice Total allocated to Citizen Block
    uint256 public totalCitizenBlockAllocated;
    
    /// @notice Sentinel activations per tier
    mapping(uint8 => uint256) public tierActivations; // tier => count
    
    /// @notice User Sentinel tier
    mapping(address => uint8) public userSentinelTier; // 0=none, 1=tier1, 2=tier2, 3=tier3
    
    /// @notice Sovereign Identity Registry (Genesis Hash from Root Pair)
    mapping(address => bytes32) public sovereignIdentityHash; // user => genesis hash
    
    /// @notice Root Pair Registry (4-Layer Biometric Master Template)
    mapping(address => bytes32) public rootPairHash; // user => root pair hash
    
    /// @notice Identity initialization status
    mapping(address => bool) public isIdentityInitialized;
    
    /// @notice Payment gateway active status
    bool public isPaymentGatewayActive;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    event SentinelActivated(
        address indexed user,
        uint8 tier,
        uint256 priceUSD,
        uint256 devices,
        uint256 toNationalEscrow,
        uint256 toCitizenBlock,
        string iso3166Code
    );
    
    event RevenueRouted(
        uint256 toNationalEscrow,
        uint256 toCitizenBlock,
        string iso3166Code
    );
    
    event SovereignIdentityInitialized(
        address indexed user,
        bytes32 genesisHash,
        bytes32 rootPairHash,
        uint256 timestamp
    );
    
    event PaymentGatewayActivated(uint256 timestamp);
    event PaymentGatewayDeactivated(uint256 timestamp);

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(
        address _vidaCapToken,
        address _nationalVault,
        address _citizenBlock
    ) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token address");
        require(_nationalVault != address(0), "Invalid National Vault address");
        require(_citizenBlock != address(0), "Invalid Citizen Block address");

        vidaCapToken = IVIDACapToken(_vidaCapToken);
        nationalVault = INationalVault(_nationalVault);
        citizenBlock = ICitizenBlock(_citizenBlock);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAYMENT_GATEWAY_ROLE, msg.sender);
        _grantRole(IDENTITY_MANAGER_ROLE, msg.sender);

        isPaymentGatewayActive = false;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - SENTINEL PAYMENT GATEWAY
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Activate Sentinel tier and route revenue
     * @param tier Tier number (1, 2, or 3)
     * @param iso3166Code ISO 3166 country code for National Escrow routing
     */
    function activateSentinelTier(uint8 tier, string memory iso3166Code)
        external
        nonReentrant
    {
        require(isPaymentGatewayActive, "Payment gateway not active");
        require(tier >= 1 && tier <= 3, "Invalid tier (must be 1, 2, or 3)");
        require(userSentinelTier[msg.sender] == 0, "User already has a Sentinel tier");
        require(bytes(iso3166Code).length > 0, "ISO 3166 code required");

        uint256 priceUSD;
        uint256 devices;

        if (tier == 1) {
            priceUSD = TIER_1_PRICE_USD;
            devices = TIER_1_DEVICES;
        } else if (tier == 2) {
            priceUSD = TIER_2_PRICE_USD;
            devices = TIER_2_DEVICES;
        } else {
            priceUSD = TIER_3_ENTERPRISE_PRICE_USD;
            devices = TIER_3_DEVICES;
        }

        // Calculate 50/50 split
        uint256 toNationalEscrow = (priceUSD * NATIONAL_ESCROW_SPLIT_BPS) / BPS_DENOMINATOR;
        uint256 toCitizenBlock = priceUSD - toNationalEscrow;

        // Update state
        userSentinelTier[msg.sender] = tier;
        tierActivations[tier]++;
        totalRevenueCollected += priceUSD;
        totalNationalEscrowAllocated += toNationalEscrow;
        totalCitizenBlockAllocated += toCitizenBlock;

        // Route revenue to National Vault
        nationalVault.depositToNationalEscrow(iso3166Code, toNationalEscrow);

        // Route revenue to Citizen Block
        citizenBlock.depositToCitizenBlock(toCitizenBlock);

        emit SentinelActivated(
            msg.sender,
            tier,
            priceUSD,
            devices,
            toNationalEscrow,
            toCitizenBlock,
            iso3166Code
        );

        emit RevenueRouted(toNationalEscrow, toCitizenBlock, iso3166Code);
    }

    /**
     * @notice Initialize Sovereign Identity with Genesis Hash from Root Pair
     * @param user User address
     * @param genesisHash Genesis hash from 4-layer biometric capture
     * @param rootPairHash Root pair hash (master template)
     */
    function initializeSovereignIdentity(
        address user,
        bytes32 genesisHash,
        bytes32 rootPairHash
    ) external onlyRole(IDENTITY_MANAGER_ROLE) {
        require(user != address(0), "Invalid user address");
        require(genesisHash != bytes32(0), "Invalid genesis hash");
        require(rootPairHash != bytes32(0), "Invalid root pair hash");
        require(!isIdentityInitialized[user], "Identity already initialized");

        sovereignIdentityHash[user] = genesisHash;
        rootPairHash[user] = rootPairHash;
        isIdentityInitialized[user] = true;

        emit SovereignIdentityInitialized(user, genesisHash, rootPairHash, block.timestamp);
    }

    /**
     * @notice Activate payment gateway
     */
    function activatePaymentGateway() external onlyRole(ADMIN_ROLE) {
        require(!isPaymentGatewayActive, "Payment gateway already active");
        isPaymentGatewayActive = true;
        emit PaymentGatewayActivated(block.timestamp);
    }

    /**
     * @notice Deactivate payment gateway
     */
    function deactivatePaymentGateway() external onlyRole(ADMIN_ROLE) {
        require(isPaymentGatewayActive, "Payment gateway already inactive");
        isPaymentGatewayActive = false;
        emit PaymentGatewayDeactivated(block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get payment gateway statistics
     */
    function getPaymentGatewayStats() external view returns (
        uint256 totalRevenue,
        uint256 totalToNationalEscrow,
        uint256 totalToCitizenBlock,
        bool gatewayActive
    ) {
        return (
            totalRevenueCollected,
            totalNationalEscrowAllocated,
            totalCitizenBlockAllocated,
            isPaymentGatewayActive
        );
    }

    /**
     * @notice Get tier activations count
     * @param tier Tier number (1, 2, or 3)
     */
    function getTierActivations(uint8 tier) external view returns (uint256) {
        return tierActivations[tier];
    }

    /**
     * @notice Get user Sentinel tier
     * @param user User address
     */
    function getUserSentinelTier(address user) external view returns (
        uint8 tier,
        uint256 priceUSD,
        uint256 devices
    ) {
        tier = userSentinelTier[user];

        if (tier == 1) {
            priceUSD = TIER_1_PRICE_USD;
            devices = TIER_1_DEVICES;
        } else if (tier == 2) {
            priceUSD = TIER_2_PRICE_USD;
            devices = TIER_2_DEVICES;
        } else if (tier == 3) {
            priceUSD = TIER_3_ENTERPRISE_PRICE_USD;
            devices = TIER_3_DEVICES;
        } else {
            priceUSD = 0;
            devices = 0;
        }
    }

    /**
     * @notice Get Sentinel tier pricing
     */
    function getSentinelTierPricing() external pure returns (
        uint256 tier1PriceUSD,
        uint256 tier1Devices,
        uint256 tier2PriceUSD,
        uint256 tier2Devices,
        uint256 tier3PriceUSD,
        uint256 tier3Devices
    ) {
        return (
            TIER_1_PRICE_USD,
            TIER_1_DEVICES,
            TIER_2_PRICE_USD,
            TIER_2_DEVICES,
            TIER_3_ENTERPRISE_PRICE_USD,
            TIER_3_DEVICES
        );
    }

    /**
     * @notice Get Sovereign Identity for a user
     * @param user User address
     */
    function getSovereignIdentity(address user) external view returns (
        bytes32 genesisHash,
        bytes32 rootPair,
        bool initialized
    ) {
        return (
            sovereignIdentityHash[user],
            rootPairHash[user],
            isIdentityInitialized[user]
        );
    }

    /**
     * @notice Calculate revenue split for a given price
     * @param priceUSD Price in USD
     */
    function calculateRevenueSplit(uint256 priceUSD) external pure returns (
        uint256 toNationalEscrow,
        uint256 toCitizenBlock
    ) {
        toNationalEscrow = (priceUSD * NATIONAL_ESCROW_SPLIT_BPS) / BPS_DENOMINATOR;
        toCitizenBlock = priceUSD - toNationalEscrow;
    }

    /**
     * @notice Get revenue split configuration
     */
    function getRevenueSplit() external pure returns (
        uint256 nationalEscrowBps,
        uint256 citizenBlockBps,
        string memory description
    ) {
        return (
            NATIONAL_ESCROW_SPLIT_BPS,
            CITIZEN_BLOCK_SPLIT_BPS,
            "50% National Escrow / 50% Citizen Block"
        );
    }

    /**
     * @notice Get contract addresses
     */
    function getContractAddresses() external view returns (
        address vidaCap,
        address nationalVaultAddr,
        address citizenBlockAddr
    ) {
        return (
            address(vidaCapToken),
            address(nationalVault),
            address(citizenBlock)
        );
    }

    /**
     * @notice Check if user has Sentinel tier
     * @param user User address
     */
    function hasSentinelTier(address user) external view returns (bool) {
        return userSentinelTier[user] > 0;
    }

    /**
     * @notice Check if user identity is initialized
     * @param user User address
     */
    function isUserIdentityInitialized(address user) external view returns (bool) {
        return isIdentityInitialized[user];
    }
}

