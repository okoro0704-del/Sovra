// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SovereignTaxReplacementProtocol
 * @notice Sovereign Tax-Replacement Protocol (10% Standard)
 * 
 * "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X."
 * 
 * CORE LOGIC:
 * ════════════════════════════════════════════════════════════════════════════════
 * - 10% Mandatory Tribute on ALL business-tier transactions
 * - 50/50 Revenue Split: 5% National Escrow / 5% Global Citizen Block
 * - SNAT Enforcement: Tax replacement messaging for governments
 * - Sentinel Tier Lock: $20 (1 device), $50 (3 devices), $1,000 (15 devices)
 * 
 * BUSINESS TRIBUTE (10% Total):
 * ════════════════════════════════════════════════════════════════════════════════
 * - 50% (5% total) → National Escrow (Immediate backing for National $VIDA)
 * - 50% (5% total) → Global Citizen Block (Distributed to Truth-Tellers monthly)
 * 
 * TAX REPLACEMENT:
 * ════════════════════════════════════════════════════════════════════════════════
 * "By activating this block, you replace 100% of PIT and VAT with this 
 *  automated 5% National Revenue Stream."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

interface IVIDACapToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ISNATDeathClock {
    function getSNATStatus(string memory iso3166Code) external view returns (uint8, bool);
}

contract SovereignTaxReplacementProtocol is AccessControl, ReentrancyGuard {
    
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TRIBUTE_COLLECTOR_ROLE = keccak256("TRIBUTE_COLLECTOR_ROLE");
    bytes32 public constant BUSINESS_VERIFIER_ROLE = keccak256("BUSINESS_VERIFIER_ROLE");
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS - BUSINESS TRIBUTE (10% STANDARD)
    // ════════════════════════════════════════════════════════════════════════════════
    
    /// @notice Business tribute rate: 10% = 1000 basis points
    uint256 public constant BUSINESS_TRIBUTE_RATE_BPS = 1000; // 10%
    
    /// @notice Basis points denominator (100% = 10,000 basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice Revenue split: 50% to National Escrow (5% of total transaction)
    uint256 public constant NATIONAL_ESCROW_BPS = 5000; // 50% of tribute
    
    /// @notice Revenue split: 50% to Global Citizen Block (5% of total transaction)
    uint256 public constant GLOBAL_CITIZEN_BLOCK_BPS = 5000; // 50% of tribute
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS - SENTINEL TIER PRICING (LOCKED)
    // ════════════════════════════════════════════════════════════════════════════════
    
    /// @notice Tier 1: $20 for 1 device
    uint256 public constant SENTINEL_TIER_1_PRICE_USD = 20;
    uint256 public constant SENTINEL_TIER_1_DEVICES = 1;
    
    /// @notice Tier 2: $50 for 3 devices
    uint256 public constant SENTINEL_TIER_2_PRICE_USD = 50;
    uint256 public constant SENTINEL_TIER_2_DEVICES = 3;
    
    /// @notice Tier 3: $1,000 for 15 devices
    uint256 public constant SENTINEL_TIER_3_PRICE_USD = 1000;
    uint256 public constant SENTINEL_TIER_3_DEVICES = 15;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    /// @notice VIDA Cap token contract
    IVIDACapToken public vidaCapToken;
    
    /// @notice SNAT Death Clock contract
    ISNATDeathClock public snatDeathClock;
    
    /// @notice National Escrow address
    address public nationalEscrow;
    
    /// @notice Global Citizen Block address
    address public globalCitizenBlock;
    
    /// @notice Total business tribute collected
    uint256 public totalBusinessTributeCollected;
    
    /// @notice Total allocated to National Escrow
    uint256 public totalNationalEscrowAllocated;
    
    /// @notice Total allocated to Global Citizen Block
    uint256 public totalGlobalCitizenBlockAllocated;
    
    /// @notice Business-tier transaction registry
    mapping(address => bool) public isBusinessTier;
    
    /// @notice National Escrow balance per nation (ISO 3166 code)
    mapping(string => uint256) public nationalEscrowBalance;
    
    /// @notice Sentinel tier purchases per user
    mapping(address => uint8) public userSentinelTier; // 0=none, 1=tier1, 2=tier2, 3=tier3
    
    /// @notice Protocol active status
    bool public isProtocolActive;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    event BusinessTributeCollected(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 tributeAmount,
        uint256 toNationalEscrow,
        uint256 toGlobalCitizenBlock,
        string iso3166Code
    );
    
    event NationalEscrowAllocated(string indexed iso3166Code, uint256 amount, uint256 totalBalance);
    event GlobalCitizenBlockAllocated(uint256 amount, uint256 totalBalance);
    event BusinessTierRegistered(address indexed business, bool isBusiness);
    event SentinelTierPurchased(address indexed user, uint8 tier, uint256 priceUSD, uint256 devices);
    event ProtocolActivated(uint256 timestamp, string message);
    event ProtocolDeactivated(uint256 timestamp);

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(
        address _vidaCapToken,
        address _snatDeathClock,
        address _nationalEscrow,
        address _globalCitizenBlock
    ) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token address");
        require(_snatDeathClock != address(0), "Invalid SNAT Death Clock address");
        require(_nationalEscrow != address(0), "Invalid National Escrow address");
        require(_globalCitizenBlock != address(0), "Invalid Global Citizen Block address");

        vidaCapToken = IVIDACapToken(_vidaCapToken);
        snatDeathClock = ISNATDeathClock(_snatDeathClock);
        nationalEscrow = _nationalEscrow;
        globalCitizenBlock = _globalCitizenBlock;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TRIBUTE_COLLECTOR_ROLE, msg.sender);
        _grantRole(BUSINESS_VERIFIER_ROLE, msg.sender);

        isProtocolActive = false;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - BUSINESS TRIBUTE COLLECTION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Collect 10% business tribute on business-tier transaction
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transaction amount
     * @param iso3166Code ISO 3166 country code for National Escrow routing
     */
    function collectBusinessTribute(
        address from,
        address to,
        uint256 amount,
        string memory iso3166Code
    ) external onlyRole(TRIBUTE_COLLECTOR_ROLE) nonReentrant {
        require(isProtocolActive, "Protocol not active");
        require(isBusinessTier[from] || isBusinessTier[to], "Not a business-tier transaction");
        require(amount > 0, "Amount must be greater than zero");

        // Calculate 10% tribute
        uint256 tributeAmount = (amount * BUSINESS_TRIBUTE_RATE_BPS) / BPS_DENOMINATOR;

        // Calculate 50/50 split (5% National Escrow / 5% Global Citizen Block)
        uint256 toNationalEscrow = (tributeAmount * NATIONAL_ESCROW_BPS) / BPS_DENOMINATOR;
        uint256 toGlobalCitizenBlock = tributeAmount - toNationalEscrow; // Remaining goes to Global Citizen Block

        // Transfer tribute from sender to this contract
        require(
            vidaCapToken.transferFrom(from, address(this), tributeAmount),
            "Tribute transfer failed"
        );

        // Route to National Escrow
        nationalEscrowBalance[iso3166Code] += toNationalEscrow;
        totalNationalEscrowAllocated += toNationalEscrow;
        require(
            vidaCapToken.transfer(nationalEscrow, toNationalEscrow),
            "National Escrow transfer failed"
        );

        // Route to Global Citizen Block
        totalGlobalCitizenBlockAllocated += toGlobalCitizenBlock;
        require(
            vidaCapToken.transfer(globalCitizenBlock, toGlobalCitizenBlock),
            "Global Citizen Block transfer failed"
        );

        // Update total tribute collected
        totalBusinessTributeCollected += tributeAmount;

        emit BusinessTributeCollected(
            from,
            to,
            amount,
            tributeAmount,
            toNationalEscrow,
            toGlobalCitizenBlock,
            iso3166Code
        );

        emit NationalEscrowAllocated(iso3166Code, toNationalEscrow, nationalEscrowBalance[iso3166Code]);
        emit GlobalCitizenBlockAllocated(toGlobalCitizenBlock, totalGlobalCitizenBlockAllocated);
    }

    /**
     * @notice Register or unregister a business-tier address
     * @param business Business address
     * @param isBusiness True to register, false to unregister
     */
    function setBusinessTier(address business, bool isBusiness)
        external
        onlyRole(BUSINESS_VERIFIER_ROLE)
    {
        require(business != address(0), "Invalid business address");
        isBusinessTier[business] = isBusiness;
        emit BusinessTierRegistered(business, isBusiness);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // SENTINEL TIER PRICING
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Purchase Sentinel tier
     * @param tier Tier number (1, 2, or 3)
     */
    function purchaseSentinelTier(uint8 tier) external {
        require(tier >= 1 && tier <= 3, "Invalid tier (must be 1, 2, or 3)");
        require(userSentinelTier[msg.sender] == 0, "User already has a Sentinel tier");

        uint256 priceUSD;
        uint256 devices;

        if (tier == 1) {
            priceUSD = SENTINEL_TIER_1_PRICE_USD;
            devices = SENTINEL_TIER_1_DEVICES;
        } else if (tier == 2) {
            priceUSD = SENTINEL_TIER_2_PRICE_USD;
            devices = SENTINEL_TIER_2_DEVICES;
        } else {
            priceUSD = SENTINEL_TIER_3_PRICE_USD;
            devices = SENTINEL_TIER_3_DEVICES;
        }

        userSentinelTier[msg.sender] = tier;

        emit SentinelTierPurchased(msg.sender, tier, priceUSD, devices);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // PROTOCOL CONTROL
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Activate the Tax-Killer Protocol
     */
    function activateProtocol() external onlyRole(ADMIN_ROLE) {
        require(!isProtocolActive, "Protocol already active");
        isProtocolActive = true;

        string memory message = "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X.";

        emit ProtocolActivated(block.timestamp, message);
    }

    /**
     * @notice Deactivate the protocol (emergency only)
     */
    function deactivateProtocol() external onlyRole(ADMIN_ROLE) {
        require(isProtocolActive, "Protocol already inactive");
        isProtocolActive = false;
        emit ProtocolDeactivated(block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get business tribute statistics
     */
    function getBusinessTributeStats() external view returns (
        uint256 totalCollected,
        uint256 totalToNationalEscrow,
        uint256 totalToGlobalCitizenBlock,
        uint256 tributeRateBps,
        bool protocolActive
    ) {
        return (
            totalBusinessTributeCollected,
            totalNationalEscrowAllocated,
            totalGlobalCitizenBlockAllocated,
            BUSINESS_TRIBUTE_RATE_BPS,
            isProtocolActive
        );
    }

    /**
     * @notice Get National Escrow balance for a nation
     * @param iso3166Code ISO 3166 country code
     */
    function getNationalEscrowBalance(string memory iso3166Code)
        external
        view
        returns (uint256)
    {
        return nationalEscrowBalance[iso3166Code];
    }

    /**
     * @notice Get Sentinel tier for a user
     * @param user User address
     */
    function getUserSentinelTier(address user) external view returns (
        uint8 tier,
        uint256 priceUSD,
        uint256 devices
    ) {
        tier = userSentinelTier[user];

        if (tier == 1) {
            priceUSD = SENTINEL_TIER_1_PRICE_USD;
            devices = SENTINEL_TIER_1_DEVICES;
        } else if (tier == 2) {
            priceUSD = SENTINEL_TIER_2_PRICE_USD;
            devices = SENTINEL_TIER_2_DEVICES;
        } else if (tier == 3) {
            priceUSD = SENTINEL_TIER_3_PRICE_USD;
            devices = SENTINEL_TIER_3_DEVICES;
        } else {
            priceUSD = 0;
            devices = 0;
        }
    }

    /**
     * @notice Get all Sentinel tier pricing (locked)
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
            SENTINEL_TIER_1_PRICE_USD,
            SENTINEL_TIER_1_DEVICES,
            SENTINEL_TIER_2_PRICE_USD,
            SENTINEL_TIER_2_DEVICES,
            SENTINEL_TIER_3_PRICE_USD,
            SENTINEL_TIER_3_DEVICES
        );
    }

    /**
     * @notice Calculate business tribute for a given amount
     * @param amount Transaction amount
     */
    function calculateBusinessTribute(uint256 amount) external pure returns (
        uint256 tributeAmount,
        uint256 toNationalEscrow,
        uint256 toGlobalCitizenBlock
    ) {
        tributeAmount = (amount * BUSINESS_TRIBUTE_RATE_BPS) / BPS_DENOMINATOR;
        toNationalEscrow = (tributeAmount * NATIONAL_ESCROW_BPS) / BPS_DENOMINATOR;
        toGlobalCitizenBlock = tributeAmount - toNationalEscrow;
    }

    /**
     * @notice Get SNAT Dashboard message for governments
     * @dev This message is displayed to governments when activating SNAT
     */
    function getSNATDashboardMessage() external pure returns (string memory) {
        return "By activating this block, you replace 100% of PIT and VAT with this automated 5% National Revenue Stream.";
    }

    /**
     * @notice Get National Dividend Potential multiplier
     */
    function getNationalDividendPotential() external pure returns (uint256) {
        return 10; // 10X multiplier
    }

    /**
     * @notice Get protocol metadata
     */
    function getProtocolMetadata() external pure returns (
        string memory name,
        string memory version,
        string memory description,
        string memory architect
    ) {
        return (
            "Sovereign Tax-Replacement Protocol",
            "1.0.0",
            "TAX-KILLER PROTOCOL ACTIVE. 10% TRIBUTE ESTABLISHED. NATIONAL DIVIDEND POTENTIAL: 10X.",
            "ISREAL OKORO"
        );
    }

    /**
     * @notice Get contract addresses
     */
    function getContractAddresses() external view returns (
        address vidaCap,
        address snatClock,
        address natEscrow,
        address globalBlock
    ) {
        return (
            address(vidaCapToken),
            address(snatDeathClock),
            nationalEscrow,
            globalCitizenBlock
        );
    }

    /**
     * @notice Check if address is business-tier
     * @param account Address to check
     */
    function isBusinessTierAddress(address account) external view returns (bool) {
        return isBusinessTier[account];
    }

    /**
     * @notice Get revenue split configuration
     */
    function getRevenueSplit() external pure returns (
        uint256 nationalEscrowBps,
        uint256 globalCitizenBlockBps,
        string memory description
    ) {
        return (
            NATIONAL_ESCROW_BPS,
            GLOBAL_CITIZEN_BLOCK_BPS,
            "50% National Escrow (5% total) / 50% Global Citizen Block (5% total)"
        );
    }
}

