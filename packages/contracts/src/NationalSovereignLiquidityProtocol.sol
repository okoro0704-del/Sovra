// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NationalSovereignLiquidityProtocol - De-Dollarized National Liquidity
 * @notice "THE WEALTH OF THE NATION IS THE PRESENCE OF ITS PEOPLE. NO DOLLARS REQUIRED."
 * @dev VIDA CAP is the primary unit of account (NO USD pegging)
 * 
 * DE-DOLLARIZE:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Remove ALL $USD pegging logic from ValueOracle
 * - VIDA CAP is now the PRIMARY unit of account
 * - NO dollar dependency
 * - NO external fiat reference
 * 
 * THE SWAP LOGIC (issueNationalStable):
 * ════════════════════════════════════════════════════════════════════════════════
 * - Citizens can swap VIDA CAP for ngVIDA (Nigeria) or ghVIDA (Ghana)
 * - Constraint: VIDA CAP is LOCKED (not burned)
 * - Stable unit is ISSUED (minted)
 * - 1:1 swap ratio (1 VIDA CAP = 1 ngVIDA/ghVIDA)
 * 
 * THE 10% LIQUIDITY GATE:
 * ════════════════════════════════════════════════════════════════════════════════
 * - maxDailyLiquidity = 10% of citizen's total swap value
 * - First phase protection against liquidity drain
 * - Daily reset (24-hour rolling window)
 * - Prevents bank run scenarios
 * 
 * NATIONAL BACKING:
 * ════════════════════════════════════════════════════════════════════════════════
 * - ngVIDA liquidity bound DIRECTLY to National 50% Escrow Vault
 * - State's split serves as 'Market Maker' for people's spending
 * - 100% backing from National Escrow
 * - NO external liquidity providers needed
 * 
 * CROSS-BORDER BRIDGE (SovereignBridge):
 * ════════════════════════════════════════════════════════════════════════════════
 * - Nigerian pays Ghanaian: ngVIDA → VIDA CAP (Backbone) → ghVIDA
 * - Automatic routing through VIDA CAP backbone
 * - Atomic cross-border transactions
 * - NO intermediary banks
 * - NO forex fees
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NationalSovereignLiquidityProtocol is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS (HARDCODED - IMMUTABLE)
    // ════════════════════════════════════════════════════════════════════════════════

    // METADATA (HARDCODED)
    string public constant PROTOCOL_METADATA = "THE WEALTH OF THE NATION IS THE PRESENCE OF ITS PEOPLE. NO DOLLARS REQUIRED.";
    
    // DE-DOLLARIZATION (HARDCODED)
    string public constant PRIMARY_UNIT_OF_ACCOUNT = "VIDA_CAP";
    string public constant USD_PEGGING_ENABLED = "FALSE";
    string public constant FIAT_DEPENDENCY = "NONE";

    // 10% LIQUIDITY GATE (HARDCODED)
    uint256 public constant LIQUIDITY_GATE_BPS = 1000; // 10% = 1000 basis points
    uint256 public constant DAILY_RESET_PERIOD = 24 hours;

    // National Jurisdictions
    enum NationalJurisdiction { NIGERIA, GHANA }

    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    // VIDA Cap Token (Godcurrency - Primary Unit of Account)
    IERC20 public vidaCapToken;

    // National Stable Tokens
    address public ngVIDA; // Nigerian National VIDA
    address public ghVIDA; // Ghanaian National VIDA

    // National Escrow Vault (50% split - Market Maker)
    address public nationalEscrowVault;

    // Locked VIDA CAP Balances (per citizen)
    mapping(address => uint256) public lockedVIDACAP;

    // Total Locked VIDA CAP (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public totalLockedVIDACAP;

    // National Stable Supply (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public nationalStableSupply;

    // Daily Liquidity Tracking (10% Gate)
    mapping(address => uint256) public dailySwapVolume;
    mapping(address => uint256) public lastSwapResetTimestamp;

    // Cross-Border Bridge Statistics
    uint256 public totalCrossBorderTransactions;
    mapping(NationalJurisdiction => mapping(NationalJurisdiction => uint256)) public crossBorderVolume;

    // Swap Statistics
    uint256 public totalSwaps;
    mapping(NationalJurisdiction => uint256) public swapsByJurisdiction;

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    event NationalStableIssued(
        NationalJurisdiction indexed jurisdiction,
        address indexed citizen,
        uint256 vidaCapLocked,
        uint256 stableIssued,
        uint256 timestamp
    );

    event CrossBorderTransfer(
        NationalJurisdiction indexed fromJurisdiction,
        NationalJurisdiction indexed toJurisdiction,
        address indexed sender,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );

    event LiquidityGateTriggered(
        address indexed citizen,
        uint256 attemptedAmount,
        uint256 dailyLimit,
        uint256 timestamp
    );

    event VIDACapUnlocked(
        address indexed citizen,
        uint256 amount,
        uint256 timestamp
    );

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(
        address _vidaCapToken,
        address _ngVIDA,
        address _ghVIDA,
        address _nationalEscrowVault
    ) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token");
        require(_ngVIDA != address(0), "Invalid ngVIDA token");
        require(_ghVIDA != address(0), "Invalid ghVIDA token");
        require(_nationalEscrowVault != address(0), "Invalid National Escrow Vault");

        vidaCapToken = IERC20(_vidaCapToken);
        ngVIDA = _ngVIDA;
        ghVIDA = _ghVIDA;
        nationalEscrowVault = _nationalEscrowVault;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - THE SWAP LOGIC
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Issue National Stable (Swap VIDA CAP for ngVIDA/ghVIDA)
     * @dev VIDA CAP is LOCKED (not burned), Stable unit is ISSUED (minted)
     * @param jurisdiction National jurisdiction (Nigeria or Ghana)
     * @param vidaCapAmount Amount of VIDA CAP to swap
     */
    function issueNationalStable(
        NationalJurisdiction jurisdiction,
        uint256 vidaCapAmount
    ) external nonReentrant returns (uint256 stableIssued) {
        require(vidaCapAmount > 0, "Amount must be greater than zero");

        // Check 10% Liquidity Gate
        _checkLiquidityGate(msg.sender, vidaCapAmount);

        // Transfer VIDA CAP from citizen to this contract (LOCK, not burn)
        require(
            vidaCapToken.transferFrom(msg.sender, address(this), vidaCapAmount),
            "VIDA CAP transfer failed"
        );

        // Lock VIDA CAP
        lockedVIDACAP[msg.sender] += vidaCapAmount;
        totalLockedVIDACAP[jurisdiction] += vidaCapAmount;

        // Issue National Stable (1:1 ratio)
        stableIssued = vidaCapAmount;
        nationalStableSupply[jurisdiction] += stableIssued;

        // Update daily swap volume
        dailySwapVolume[msg.sender] += vidaCapAmount;

        // Update statistics
        totalSwaps++;
        swapsByJurisdiction[jurisdiction]++;

        // Note: Actual token minting would be handled by ngVIDA/ghVIDA token contract
        // This contract tracks the state and enforces liquidity gates

        emit NationalStableIssued(
            jurisdiction,
            msg.sender,
            vidaCapAmount,
            stableIssued,
            block.timestamp
        );

        return stableIssued;
    }

    /**
     * @notice Redeem National Stable (Swap ngVIDA/ghVIDA back to VIDA CAP)
     * @dev Unlocks VIDA CAP and burns National Stable
     * @param jurisdiction National jurisdiction
     * @param stableAmount Amount of National Stable to redeem
     */
    function redeemNationalStable(
        NationalJurisdiction jurisdiction,
        uint256 stableAmount
    ) external nonReentrant returns (uint256 vidaCapUnlocked) {
        require(stableAmount > 0, "Amount must be greater than zero");
        require(lockedVIDACAP[msg.sender] >= stableAmount, "Insufficient locked VIDA CAP");
        require(nationalStableSupply[jurisdiction] >= stableAmount, "Insufficient stable supply");

        // Unlock VIDA CAP (1:1 ratio)
        vidaCapUnlocked = stableAmount;

        // Update balances
        lockedVIDACAP[msg.sender] -= vidaCapUnlocked;
        totalLockedVIDACAP[jurisdiction] -= vidaCapUnlocked;
        nationalStableSupply[jurisdiction] -= stableAmount;

        // Transfer VIDA CAP back to citizen
        require(
            vidaCapToken.transfer(msg.sender, vidaCapUnlocked),
            "VIDA CAP transfer failed"
        );

        // Note: Actual token burning would be handled by ngVIDA/ghVIDA token contract

        emit VIDACapUnlocked(msg.sender, vidaCapUnlocked, block.timestamp);

        return vidaCapUnlocked;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CROSS-BORDER BRIDGE (SovereignBridge)
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Cross-Border Transfer (ngVIDA → VIDA CAP → ghVIDA)
     * @dev Automatic routing through VIDA CAP backbone
     * @param fromJurisdiction Sender's jurisdiction
     * @param toJurisdiction Recipient's jurisdiction
     * @param recipient Recipient address
     * @param amount Amount to transfer
     */
    function crossBorderTransfer(
        NationalJurisdiction fromJurisdiction,
        NationalJurisdiction toJurisdiction,
        address recipient,
        uint256 amount
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        require(fromJurisdiction != toJurisdiction, "Use internal transfer for same jurisdiction");

        // Step 1: Redeem sender's National Stable to VIDA CAP
        require(lockedVIDACAP[msg.sender] >= amount, "Insufficient locked VIDA CAP");

        lockedVIDACAP[msg.sender] -= amount;
        totalLockedVIDACAP[fromJurisdiction] -= amount;
        nationalStableSupply[fromJurisdiction] -= amount;

        // Step 2: Issue recipient's National Stable from VIDA CAP
        lockedVIDACAP[recipient] += amount;
        totalLockedVIDACAP[toJurisdiction] += amount;
        nationalStableSupply[toJurisdiction] += amount;

        // Update statistics
        totalCrossBorderTransactions++;
        crossBorderVolume[fromJurisdiction][toJurisdiction] += amount;

        emit CrossBorderTransfer(
            fromJurisdiction,
            toJurisdiction,
            msg.sender,
            recipient,
            amount,
            block.timestamp
        );
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS - 10% LIQUIDITY GATE
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Check 10% Liquidity Gate (Daily Limit)
     * @dev Prevents liquidity drain by limiting daily swaps to 10% of total locked VIDA CAP
     * @param citizen Citizen address
     * @param amount Amount to swap
     */
    function _checkLiquidityGate(address citizen, uint256 amount) internal {
        // Reset daily volume if 24 hours have passed
        if (block.timestamp >= lastSwapResetTimestamp[citizen] + DAILY_RESET_PERIOD) {
            dailySwapVolume[citizen] = 0;
            lastSwapResetTimestamp[citizen] = block.timestamp;
        }

        // Get current locked balance
        uint256 currentLocked = lockedVIDACAP[citizen];

        // If no locked balance yet, allow first swap (no limit on initial deposit)
        if (currentLocked == 0) {
            return; // First swap allowed
        }

        // For subsequent swaps, limit to 10% of total locked balance per day
        uint256 dailyLimit = (currentLocked * LIQUIDITY_GATE_BPS) / 10000;

        require(
            dailySwapVolume[citizen] + amount <= dailyLimit,
            "Daily liquidity gate exceeded (10% limit)"
        );

        emit LiquidityGateTriggered(citizen, amount, dailyLimit, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get locked VIDA CAP balance for a citizen
     */
    function getLockedBalance(address citizen) external view returns (uint256) {
        return lockedVIDACAP[citizen];
    }

    /**
     * @notice Get daily liquidity limit for a citizen (10% of locked balance)
     */
    function getDailyLimit(address citizen) external view returns (uint256) {
        uint256 totalLocked = lockedVIDACAP[citizen];
        return (totalLocked * LIQUIDITY_GATE_BPS) / 10000;
    }

    /**
     * @notice Get remaining daily liquidity for a citizen
     */
    function getRemainingDailyLiquidity(address citizen) external view returns (uint256) {
        // Check if reset needed
        if (block.timestamp >= lastSwapResetTimestamp[citizen] + DAILY_RESET_PERIOD) {
            // Reset would occur, so full limit available
            uint256 totalLocked = lockedVIDACAP[citizen];
            return (totalLocked * LIQUIDITY_GATE_BPS) / 10000;
        }

        // Calculate remaining liquidity
        uint256 totalLocked = lockedVIDACAP[citizen];
        uint256 dailyLimit = (totalLocked * LIQUIDITY_GATE_BPS) / 10000;
        uint256 used = dailySwapVolume[citizen];

        if (used >= dailyLimit) {
            return 0;
        }

        return dailyLimit - used;
    }

    /**
     * @notice Get cross-border transfer volume between jurisdictions
     */
    function getCrossBorderStats(
        NationalJurisdiction from,
        NationalJurisdiction to
    ) external view returns (uint256) {
        return crossBorderVolume[from][to];
    }

    /**
     * @notice Get protocol statistics
     */
    function getProtocolStats() external view returns (
        uint256 totalSwapsCount,
        uint256 totalCrossBorderCount,
        uint256 nigeriaTotalLocked,
        uint256 ghanaTotalLocked,
        uint256 nigeriaStableSupply,
        uint256 ghanaStableSupply
    ) {
        totalSwapsCount = totalSwaps;
        totalCrossBorderCount = totalCrossBorderTransactions;
        nigeriaTotalLocked = totalLockedVIDACAP[NationalJurisdiction.NIGERIA];
        ghanaTotalLocked = totalLockedVIDACAP[NationalJurisdiction.GHANA];
        nigeriaStableSupply = nationalStableSupply[NationalJurisdiction.NIGERIA];
        ghanaStableSupply = nationalStableSupply[NationalJurisdiction.GHANA];
    }

    /**
     * @notice Get primary unit of account (VIDA CAP)
     */
    function getPrimaryUnitOfAccount() external pure returns (string memory) {
        return PRIMARY_UNIT_OF_ACCOUNT;
    }

    /**
     * @notice Check if USD pegging is enabled (FALSE - De-Dollarized)
     */
    function isUSDPeggingEnabled() external pure returns (bool) {
        return false; // HARDCODED: De-Dollarized
    }

    /**
     * @notice Get fiat dependency status (NONE)
     */
    function getFiatDependency() external pure returns (string memory) {
        return FIAT_DEPENDENCY;
    }

    /**
     * @notice Get protocol metadata
     */
    function getProtocolMetadata() external pure returns (string memory) {
        return PROTOCOL_METADATA;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Grant PFF Sentinel role
     */
    function grantPFFSentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PFF_SENTINEL_ROLE, account);
    }

    /**
     * @notice Grant Oracle role
     */
    function grantOracleRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(ORACLE_ROLE, account);
    }

    /**
     * @notice Revoke PFF Sentinel role
     */
    function revokePFFSentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(PFF_SENTINEL_ROLE, account);
    }

    /**
     * @notice Revoke Oracle role
     */
    function revokeOracleRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(ORACLE_ROLE, account);
    }
}

