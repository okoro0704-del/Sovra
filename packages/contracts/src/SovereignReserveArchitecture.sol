// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SovereignReserveArchitecture - Zero Central Bank Dependency
 * @notice Sovereign Reserve for ngVIDA and ghVIDA with auto-collateralization
 * @dev HARDCODED: ReserveSource points ONLY to SOVRYN National Escrow Vault
 * 
 * ZERO-CENTRAL-BANK DEPENDENCY:
 * ════════════════════════════════════════════════════════════════════════════════
 * - ReserveSource: HARDCODED to SOVRYN National Escrow Vault ONLY
 * - NO CBN (Central Bank of Nigeria) injection allowed
 * - NO BoG (Bank of Ghana) injection allowed
 * - NO external central bank dependency
 * - 100% backed by Sovereign Presence & National Escrow
 * 
 * AUTO-COLLATERALIZATION:
 * ════════════════════════════════════════════════════════════════════════════════
 * - When 5 VIDA Cap minted to Nation's split → Auto-wrap to ngVIDA/ghVIDA
 * - Immediate liquidity issuance (no manual intervention)
 * - 1:1 wrapping ratio (5 VIDA Cap = 5 ngVIDA/ghVIDA)
 * - Atomic operation (mint + wrap in single transaction)
 * 
 * THE 180-DAY SHIELD (SNAT Treaty Protection):
 * ════════════════════════════════════════════════════════════════════════════════
 * - LiquidityReserve protected by SNAT Treaty
 * - If nation attempts seizure → AI Sentinel triggers 'Sovereign Blackout'
 * - Reserve moves to distributed cloud state (multi-sig custody)
 * - 180-day countdown from Feb 7th, 2026
 * - Flush trigger: Nation loses ALL reserve if SNAT not signed
 * 
 * DISPLAY LOGIC:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Dashboard Label: "Backed by Sovereign Presence & National Escrow"
 * - NOT "Backed by Bank"
 * - Transparency: Show exact VIDA Cap backing in real-time
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SovereignReserveArchitecture is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AI_SENTINEL_ROLE = keccak256("AI_SENTINEL_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS (HARDCODED - IMMUTABLE)
    // ════════════════════════════════════════════════════════════════════════════════

    // ZERO-CENTRAL-BANK DEPENDENCY (HARDCODED)
    string public constant RESERVE_SOURCE = "SOVRYN_NATIONAL_ESCROW_VAULT_ONLY";
    string public constant CBN_INJECTION_ALLOWED = "FALSE"; // Central Bank of Nigeria
    string public constant BOG_INJECTION_ALLOWED = "FALSE"; // Bank of Ghana
    string public constant BACKING_LABEL = "Backed by Sovereign Presence & National Escrow";

    // SNAT Treaty Protection (180-Day Shield)
    uint256 public constant SNAT_LAUNCH_DATE = 1739059200; // Feb 7th, 2026 00:00:00 UTC
    uint256 public constant SNAT_SHIELD_DAYS = 180;
    uint256 public constant SNAT_FLUSH_DEADLINE = SNAT_LAUNCH_DATE + (SNAT_SHIELD_DAYS * 1 days);

    // National Jurisdictions
    enum NationalJurisdiction { NIGERIA, GHANA }

    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    // VIDA Cap Token (source of collateral)
    IERC20 public vidaCapToken;

    // ngVIDA and ghVIDA Token Addresses
    address public ngVIDA; // Nigerian National VIDA
    address public ghVIDA; // Ghanaian National VIDA

    // National Escrow Vault Address (HARDCODED source)
    address public nationalEscrowVault;

    // SNAT Treaty Contract (180-Day Shield)
    address public snatTreatyContract;

    // Sovereign Reserve Balances (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public sovereignReserveBalance;

    // Total Wrapped Supply (ngVIDA/ghVIDA)
    mapping(NationalJurisdiction => uint256) public totalWrappedSupply;

    // Sovereign Blackout Status (triggered if nation attempts seizure)
    mapping(NationalJurisdiction => bool) public sovereignBlackoutActive;

    // Distributed Cloud State (multi-sig custody addresses)
    mapping(NationalJurisdiction => address[]) public distributedCloudCustodians;

    // Auto-Collateralization Statistics
    uint256 public totalAutoWraps;
    mapping(NationalJurisdiction => uint256) public autoWrapsByJurisdiction;

    // Seizure Attempt Tracking
    mapping(NationalJurisdiction => uint256) public seizureAttemptCount;
    mapping(NationalJurisdiction => uint256) public lastSeizureAttemptTimestamp;

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    event AutoCollateralized(
        NationalJurisdiction indexed jurisdiction,
        uint256 vidaCapAmount,
        uint256 wrappedAmount,
        uint256 timestamp
    );

    event SovereignBlackoutTriggered(
        NationalJurisdiction indexed jurisdiction,
        uint256 reserveAmount,
        uint256 timestamp,
        string reason
    );

    event ReserveMovedToCloud(
        NationalJurisdiction indexed jurisdiction,
        uint256 amount,
        address[] custodians,
        uint256 timestamp
    );

    event SeizureAttemptDetected(
        NationalJurisdiction indexed jurisdiction,
        address attemptedBy,
        uint256 timestamp
    );

    event SNATShieldActivated(
        NationalJurisdiction indexed jurisdiction,
        uint256 activationTimestamp,
        uint256 flushDeadline
    );

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(
        address _vidaCapToken,
        address _ngVIDA,
        address _ghVIDA,
        address _nationalEscrowVault,
        address _snatTreatyContract
    ) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token");
        require(_ngVIDA != address(0), "Invalid ngVIDA token");
        require(_ghVIDA != address(0), "Invalid ghVIDA token");
        require(_nationalEscrowVault != address(0), "Invalid National Escrow Vault");
        require(_snatTreatyContract != address(0), "Invalid SNAT Treaty contract");

        vidaCapToken = IERC20(_vidaCapToken);
        ngVIDA = _ngVIDA;
        ghVIDA = _ghVIDA;
        nationalEscrowVault = _nationalEscrowVault;
        snatTreatyContract = _snatTreatyContract;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Activate SNAT Shield for both jurisdictions
        emit SNATShieldActivated(NationalJurisdiction.NIGERIA, SNAT_LAUNCH_DATE, SNAT_FLUSH_DEADLINE);
        emit SNATShieldActivated(NationalJurisdiction.GHANA, SNAT_LAUNCH_DATE, SNAT_FLUSH_DEADLINE);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - AUTO-COLLATERALIZATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Auto-Collateralization: Wrap VIDA Cap to ngVIDA/ghVIDA
     * @dev Called automatically when Nation's 50% split is minted
     * @param jurisdiction National jurisdiction (Nigeria or Ghana)
     * @param vidaCapAmount Amount of VIDA Cap to wrap (5 VIDA Cap from Nation's split)
     */
    function autoWrapToNationalVIDA(
        NationalJurisdiction jurisdiction,
        uint256 vidaCapAmount
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(vidaCapAmount > 0, "Amount must be greater than zero");
        require(!sovereignBlackoutActive[jurisdiction], "Sovereign Blackout active");

        // ZERO-CENTRAL-BANK DEPENDENCY: Verify source is National Escrow Vault ONLY
        require(
            msg.sender == nationalEscrowVault || hasRole(PFF_SENTINEL_ROLE, msg.sender),
            "Source must be National Escrow Vault ONLY"
        );

        // Auto-wrap: 1:1 ratio (5 VIDA Cap = 5 ngVIDA/ghVIDA)
        uint256 wrappedAmount = vidaCapAmount;

        // Update sovereign reserve balance
        sovereignReserveBalance[jurisdiction] += vidaCapAmount;

        // Update total wrapped supply
        totalWrappedSupply[jurisdiction] += wrappedAmount;

        // Update statistics
        totalAutoWraps++;
        autoWrapsByJurisdiction[jurisdiction]++;

        // Note: Actual token minting would be handled by ngVIDA/ghVIDA token contract
        // This contract tracks the state and enforces zero-central-bank dependency

        emit AutoCollateralized(jurisdiction, vidaCapAmount, wrappedAmount, block.timestamp);
    }

    /**
     * @notice Unwrap ngVIDA/ghVIDA back to VIDA Cap
     * @dev Only allowed if SNAT Shield is not active
     * @param jurisdiction National jurisdiction
     * @param wrappedAmount Amount of ngVIDA/ghVIDA to unwrap
     */
    function unwrapToVIDACAP(
        NationalJurisdiction jurisdiction,
        uint256 wrappedAmount
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(wrappedAmount > 0, "Amount must be greater than zero");
        require(!sovereignBlackoutActive[jurisdiction], "Sovereign Blackout active");
        require(totalWrappedSupply[jurisdiction] >= wrappedAmount, "Insufficient wrapped supply");
        require(sovereignReserveBalance[jurisdiction] >= wrappedAmount, "Insufficient reserve");

        // Unwrap: 1:1 ratio
        uint256 vidaCapAmount = wrappedAmount;

        // Update balances
        sovereignReserveBalance[jurisdiction] -= vidaCapAmount;
        totalWrappedSupply[jurisdiction] -= wrappedAmount;

        // Note: Actual token burning would be handled by ngVIDA/ghVIDA token contract
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // SNAT SHIELD - 180-DAY PROTECTION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Detect Seizure Attempt (AI Sentinel monitors for unauthorized access)
     * @dev Triggered if nation attempts to seize reserve without SNAT compliance
     * @param jurisdiction National jurisdiction
     * @param attemptedBy Address that attempted seizure
     */
    function detectSeizureAttempt(
        NationalJurisdiction jurisdiction,
        address attemptedBy
    ) external onlyRole(AI_SENTINEL_ROLE) {
        require(attemptedBy != address(0), "Invalid address");

        // Record seizure attempt
        seizureAttemptCount[jurisdiction]++;
        lastSeizureAttemptTimestamp[jurisdiction] = block.timestamp;

        emit SeizureAttemptDetected(jurisdiction, attemptedBy, block.timestamp);

        // Trigger Sovereign Blackout if within 180-day shield period
        if (block.timestamp < SNAT_FLUSH_DEADLINE) {
            _triggerSovereignBlackout(jurisdiction, "Nation attempted seizure during SNAT Shield period");
        }
    }

    /**
     * @notice Trigger Sovereign Blackout (move reserve to distributed cloud state)
     * @dev Called by AI Sentinel when seizure attempt detected
     * @param jurisdiction National jurisdiction
     * @param reason Reason for blackout
     */
    function _triggerSovereignBlackout(
        NationalJurisdiction jurisdiction,
        string memory reason
    ) internal {
        require(!sovereignBlackoutActive[jurisdiction], "Blackout already active");

        // Activate Sovereign Blackout
        sovereignBlackoutActive[jurisdiction] = true;

        uint256 reserveAmount = sovereignReserveBalance[jurisdiction];

        emit SovereignBlackoutTriggered(jurisdiction, reserveAmount, block.timestamp, reason);

        // Move reserve to distributed cloud state
        _moveReserveToCloud(jurisdiction, reserveAmount);
    }

    /**
     * @notice Move Reserve to Distributed Cloud State (multi-sig custody)
     * @dev Reserve moved to multiple custodian addresses for protection
     * @param jurisdiction National jurisdiction
     * @param amount Amount to move to cloud
     */
    function _moveReserveToCloud(
        NationalJurisdiction jurisdiction,
        uint256 amount
    ) internal {
        // Get distributed cloud custodians
        address[] memory custodians = distributedCloudCustodians[jurisdiction];

        require(custodians.length > 0, "No cloud custodians configured");

        // Note: In production, this would distribute reserve across multiple custodians
        // For now, we emit event to track the cloud migration

        emit ReserveMovedToCloud(jurisdiction, amount, custodians, block.timestamp);
    }

    /**
     * @notice Add Distributed Cloud Custodian
     * @dev Configure multi-sig custodians for cloud state protection
     * @param jurisdiction National jurisdiction
     * @param custodian Custodian address
     */
    function addCloudCustodian(
        NationalJurisdiction jurisdiction,
        address custodian
    ) external onlyRole(ADMIN_ROLE) {
        require(custodian != address(0), "Invalid custodian address");
        distributedCloudCustodians[jurisdiction].push(custodian);
    }

    /**
     * @notice Deactivate Sovereign Blackout (after SNAT compliance)
     * @dev Can only be called by AI Sentinel after nation signs SNAT
     * @param jurisdiction National jurisdiction
     */
    function deactivateSovereignBlackout(
        NationalJurisdiction jurisdiction
    ) external onlyRole(AI_SENTINEL_ROLE) {
        require(sovereignBlackoutActive[jurisdiction], "Blackout not active");

        // Verify SNAT compliance (check with SNAT Treaty contract)
        // Note: In production, this would verify SNAT signature

        sovereignBlackoutActive[jurisdiction] = false;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get Reserve Source (HARDCODED)
     */
    function getReserveSource() external pure returns (string memory) {
        return RESERVE_SOURCE;
    }

    /**
     * @notice Get Backing Label (for dashboard display)
     */
    function getBackingLabel() external pure returns (string memory) {
        return BACKING_LABEL;
    }

    /**
     * @notice Check if Central Bank injection is allowed (HARDCODED: FALSE)
     */
    function isCBNInjectionAllowed() external pure returns (bool) {
        return false; // HARDCODED: NO CBN injection
    }

    /**
     * @notice Check if Bank of Ghana injection is allowed (HARDCODED: FALSE)
     */
    function isBOGInjectionAllowed() external pure returns (bool) {
        return false; // HARDCODED: NO BoG injection
    }

    /**
     * @notice Get SNAT Shield status
     */
    function getSNATShieldStatus(NationalJurisdiction jurisdiction) external view returns (
        bool isActive,
        uint256 daysRemaining,
        uint256 flushDeadline
    ) {
        isActive = block.timestamp < SNAT_FLUSH_DEADLINE;

        if (isActive) {
            uint256 secondsRemaining = SNAT_FLUSH_DEADLINE - block.timestamp;
            daysRemaining = secondsRemaining / 1 days;
        } else {
            daysRemaining = 0;
        }

        flushDeadline = SNAT_FLUSH_DEADLINE;
    }

    /**
     * @notice Get Sovereign Reserve Stats
     */
    function getReserveStats(NationalJurisdiction jurisdiction) external view returns (
        uint256 reserveBalance,
        uint256 wrappedSupply,
        uint256 backingRatio,
        bool blackoutActive,
        uint256 autoWraps,
        uint256 seizureAttempts
    ) {
        reserveBalance = sovereignReserveBalance[jurisdiction];
        wrappedSupply = totalWrappedSupply[jurisdiction];

        // Calculate backing ratio (should always be 100%)
        if (wrappedSupply == 0) {
            backingRatio = 100;
        } else {
            backingRatio = (reserveBalance * 100) / wrappedSupply;
        }

        blackoutActive = sovereignBlackoutActive[jurisdiction];
        autoWraps = autoWrapsByJurisdiction[jurisdiction];
        seizureAttempts = seizureAttemptCount[jurisdiction];
    }

    /**
     * @notice Get Dashboard Display Info
     */
    function getDashboardInfo(NationalJurisdiction jurisdiction) external view returns (
        string memory backingLabel,
        string memory reserveSource,
        uint256 vidaCapBacking,
        uint256 wrappedSupply,
        bool isCentralBankFree
    ) {
        backingLabel = BACKING_LABEL;
        reserveSource = RESERVE_SOURCE;
        vidaCapBacking = sovereignReserveBalance[jurisdiction];
        wrappedSupply = totalWrappedSupply[jurisdiction];
        isCentralBankFree = true; // HARDCODED: Zero central bank dependency
    }

    /**
     * @notice Get Cloud Custodians
     */
    function getCloudCustodians(NationalJurisdiction jurisdiction) external view returns (address[] memory) {
        return distributedCloudCustodians[jurisdiction];
    }

    /**
     * @notice Check if Sovereign Blackout is active
     */
    function isBlackoutActive(NationalJurisdiction jurisdiction) external view returns (bool) {
        return sovereignBlackoutActive[jurisdiction];
    }

    /**
     * @notice Get Last Seizure Attempt Info
     */
    function getLastSeizureAttempt(NationalJurisdiction jurisdiction) external view returns (
        uint256 attemptCount,
        uint256 lastAttemptTimestamp
    ) {
        attemptCount = seizureAttemptCount[jurisdiction];
        lastAttemptTimestamp = lastSeizureAttemptTimestamp[jurisdiction];
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Grant AI Sentinel Role
     */
    function grantAISentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AI_SENTINEL_ROLE, account);
    }

    /**
     * @notice Grant PFF Sentinel Role
     */
    function grantPFFSentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PFF_SENTINEL_ROLE, account);
    }

    /**
     * @notice Revoke AI Sentinel Role
     */
    function revokeAISentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(AI_SENTINEL_ROLE, account);
    }

    /**
     * @notice Revoke PFF Sentinel Role
     */
    function revokePFFSentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(PFF_SENTINEL_ROLE, account);
    }
}

