// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SentinelOptIn
 * @notice Sentinel Opt-In Feature Module for LifeOS
 * 
 * "Security is a choice, not a mandate."
 * 
 * Features:
 * - isSentinelActive = FALSE by default for all new citizens
 * - Manual activation via downloadSentinel() function
 * - One-time activation fee (0.1 ngVIDA)
 * - Transparent pricing before confirmation
 * - Status badges: "Standard Protection" vs "Sentinel Guarded"
 * 
 * Architecture:
 * - Opt-In Model: Citizens CHOOSE to activate Sentinel
 * - Transparent Pricing: Fee displayed BEFORE activation
 * - Manual Trigger: ONLY executes on deliberate user click
 * - Feature State: FALSE by default, TRUE after activation
 * 
 * Born in Lagos, Nigeria. Built for Humanity. 🇳🇬
 * Architect: ISREAL OKORO
 */
contract SentinelOptIn is AccessControl, ReentrancyGuard {
    // ========================================================================
    // ROLES
    // ========================================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");

    // ========================================================================
    // CONSTANTS - HARDCODED
    // ========================================================================

    /// @notice One-time activation fee (0.1 ngVIDA)
    uint256 public constant ACTIVATION_FEE = 100000000000000000; // 0.1 * 10^18

    /// @notice Default Sentinel state for new citizens
    bool public constant DEFAULT_SENTINEL_STATE = false;

    /// @notice Protocol metadata
    string public constant PROTOCOL_METADATA = "Security is a choice, not a mandate.";
    string public constant FEATURE_NAME = "PFF Sentinel";
    string public constant FEATURE_DESCRIPTION = "Optional, system-level upgrade for those holding high-value Sovereign wealth.";

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    /// @notice ngVIDA token contract
    IERC20 public ngVIDAToken;

    /// @notice Sentinel activation status per citizen
    mapping(address => bool) public isSentinelActive;

    /// @notice Activation timestamp per citizen
    mapping(address => uint256) public activationTimestamp;

    /// @notice Total activations count
    uint256 public totalActivations;

    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    /// @notice Fee recipient (National Escrow Vault)
    address public feeRecipient;

    // ========================================================================
    // EVENTS
    // ========================================================================

    event SentinelActivated(
        address indexed citizen,
        uint256 fee,
        uint256 timestamp
    );

    event SentinelDeactivated(
        address indexed citizen,
        uint256 timestamp
    );

    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient,
        uint256 timestamp
    );

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(address _ngVIDAToken, address _feeRecipient) {
        require(_ngVIDAToken != address(0), "Invalid ngVIDA token address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");

        ngVIDAToken = IERC20(_ngVIDAToken);
        feeRecipient = _feeRecipient;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ========================================================================
    // CORE FUNCTIONS - THE MANUAL TRIGGER
    // ========================================================================

    /**
     * @notice Download Sentinel (Manual Activation)
     * @dev ONLY executes upon deliberate user click on "Activate Sentinel" button
     * 
     * Requirements:
     * - Sentinel must NOT already be active
     * - Citizen must have sufficient ngVIDA balance
     * - Citizen must approve this contract to spend ngVIDA
     * 
     * Process:
     * 1. Check Sentinel is not already active
     * 2. Transfer 0.1 ngVIDA from citizen to fee recipient
     * 3. Set isSentinelActive[citizen] = TRUE
     * 4. Record activation timestamp
     * 5. Emit SentinelActivated event
     * 
     * @return success True if activation successful
     */
    function downloadSentinel() external nonReentrant returns (bool success) {
        require(!isSentinelActive[msg.sender], "Sentinel already active");

        // Transfer activation fee from citizen to fee recipient
        require(
            ngVIDAToken.transferFrom(msg.sender, feeRecipient, ACTIVATION_FEE),
            "Activation fee transfer failed"
        );

        // Activate Sentinel
        isSentinelActive[msg.sender] = true;
        activationTimestamp[msg.sender] = block.timestamp;

        // Update statistics
        totalActivations++;
        totalFeesCollected += ACTIVATION_FEE;

        emit SentinelActivated(msg.sender, ACTIVATION_FEE, block.timestamp);

        return true;
    }

    /**
     * @notice Deactivate Sentinel (Optional)
     * @dev Allows citizens to deactivate Sentinel if desired
     *
     * Note: Activation fee is NOT refunded
     *
     * @return success True if deactivation successful
     */
    function deactivateSentinel() external nonReentrant returns (bool success) {
        require(isSentinelActive[msg.sender], "Sentinel not active");

        // Deactivate Sentinel
        isSentinelActive[msg.sender] = false;

        emit SentinelDeactivated(msg.sender, block.timestamp);

        return true;
    }

    // ========================================================================
    // VIEW FUNCTIONS - STATUS CHECK
    // ========================================================================

    /**
     * @notice Get Sentinel status for citizen
     * @param citizen Citizen address
     * @return isActive True if Sentinel is active
     * @return badge Status badge ("Sentinel Guarded" or "Standard Protection")
     * @return activatedAt Activation timestamp (0 if not activated)
     */
    function getSentinelStatus(address citizen) external view returns (
        bool isActive,
        string memory badge,
        uint256 activatedAt
    ) {
        isActive = isSentinelActive[citizen];
        badge = isActive ? "Sentinel Guarded" : "Standard Protection";
        activatedAt = activationTimestamp[citizen];
    }

    /**
     * @notice Get activation fee
     * @return fee Activation fee in ngVIDA (0.1 ngVIDA)
     */
    function getActivationFee() external pure returns (uint256 fee) {
        return ACTIVATION_FEE;
    }

    /**
     * @notice Get activation fee in human-readable format
     * @return feeString Activation fee as string (e.g., "0.1 ngVIDA")
     */
    function getActivationFeeString() external pure returns (string memory feeString) {
        return "0.1 ngVIDA";
    }

    /**
     * @notice Get feature information
     * @return name Feature name
     * @return description Feature description
     * @return metadata Protocol metadata
     */
    function getFeatureInfo() external pure returns (
        string memory name,
        string memory description,
        string memory metadata
    ) {
        return (FEATURE_NAME, FEATURE_DESCRIPTION, PROTOCOL_METADATA);
    }

    /**
     * @notice Get protocol statistics
     * @return activations Total activations
     * @return feesCollected Total fees collected
     * @return defaultState Default Sentinel state for new citizens
     */
    function getProtocolStats() external view returns (
        uint256 activations,
        uint256 feesCollected,
        bool defaultState
    ) {
        return (totalActivations, totalFeesCollected, DEFAULT_SENTINEL_STATE);
    }

    /**
     * @notice Check if citizen can activate Sentinel
     * @param citizen Citizen address
     * @return canActivate True if citizen can activate
     * @return reason Reason if cannot activate
     */
    function canActivateSentinel(address citizen) external view returns (
        bool canActivate,
        string memory reason
    ) {
        // Check if already active
        if (isSentinelActive[citizen]) {
            return (false, "Sentinel already active");
        }

        // Check if citizen has sufficient balance
        if (ngVIDAToken.balanceOf(citizen) < ACTIVATION_FEE) {
            return (false, "Insufficient ngVIDA balance");
        }

        // Check if citizen has approved this contract
        if (ngVIDAToken.allowance(citizen, address(this)) < ACTIVATION_FEE) {
            return (false, "Insufficient ngVIDA allowance");
        }

        return (true, "Ready to activate");
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    /**
     * @notice Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function updateFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid fee recipient");

        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;

        emit FeeRecipientUpdated(oldRecipient, newRecipient, block.timestamp);
    }

    /**
     * @notice Grant PFF Sentinel role
     * @param account Account to grant role
     */
    function grantPFFSentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PFF_SENTINEL_ROLE, account);
    }

    /**
     * @notice Revoke PFF Sentinel role
     * @param account Account to revoke role
     */
    function revokePFFSentinelRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(PFF_SENTINEL_ROLE, account);
    }
}

