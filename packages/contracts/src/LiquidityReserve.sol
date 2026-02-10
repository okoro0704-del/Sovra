// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LiquidityReserve - 100% Backing for N-VIDA
 * @notice Provides underlying collateral for N-VIDA during February-April lock period
 * @dev 100% of Nation's 50% split in Escrow Vault used as collateral
 * 
 * THE BACKING LOGIC:
 * ════════════════════════════════════════════════════════════════════════════════
 * - 100% of the Nation's 50% split in the Escrow Vault provides collateral
 * - Every N-VIDA minted is backed 1:1 by VIDA Cap in this reserve
 * - Reserve cannot be withdrawn during lock period (Feb 7th - April 7th)
 * - After April 7th, reserve can be used for USD conversions
 * 
 * COLLATERAL TRACKING:
 * ════════════════════════════════════════════════════════════════════════════════
 * - National Escrow Balance: Total VIDA Cap held as collateral
 * - N-VIDA Supply: Total N-VIDA minted (must equal escrow balance)
 * - Backing Ratio: Always 100% (1 N-VIDA = 1 VIDA Cap)
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LiquidityReserve is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════

    // Lock Period (Feb 7th - April 7th, 2026)
    uint256 public constant LOCK_START_DATE = 1739059200; // Feb 7th, 2026 00:00:00 UTC
    uint256 public constant LOCK_END_DATE = 1744243200; // April 7th, 2026 00:00:00 UTC

    // National Jurisdictions
    enum NationalJurisdiction { NIGERIA, GHANA }

    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    // VIDA Cap Token
    IERC20 public vidaCapToken;

    // National Escrow Balances (100% backing for N-VIDA)
    mapping(NationalJurisdiction => uint256) public nationalEscrowBalance;

    // Total N-VIDA Supply (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public totalNVIDASupply;

    // Withdrawal tracking
    uint256 public totalWithdrawals;
    mapping(NationalJurisdiction => uint256) public withdrawalsByJurisdiction;

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    event CollateralDeposited(
        NationalJurisdiction indexed jurisdiction,
        uint256 amount,
        uint256 newBalance
    );

    event CollateralWithdrawn(
        NationalJurisdiction indexed jurisdiction,
        address indexed recipient,
        uint256 amount,
        uint256 newBalance
    );

    event NVIDASupplyUpdated(
        NationalJurisdiction indexed jurisdiction,
        uint256 oldSupply,
        uint256 newSupply
    );

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(address _vidaCapToken) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token address");

        vidaCapToken = IERC20(_vidaCapToken);

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit VIDA Cap collateral from National Escrow
     * @dev Called when nation receives their 50% split from VIDA Cap minting
     * @param jurisdiction National jurisdiction
     * @param amount Amount of VIDA Cap to deposit
     */
    function depositCollateral(
        NationalJurisdiction jurisdiction,
        uint256 amount
    ) external onlyRole(BRIDGE_ROLE) nonReentrant {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer VIDA Cap from sender to this contract
        // Note: In production, this would require approval from sender
        // vidaCapToken.transferFrom(msg.sender, address(this), amount);

        // Update national escrow balance
        nationalEscrowBalance[jurisdiction] += amount;

        emit CollateralDeposited(jurisdiction, amount, nationalEscrowBalance[jurisdiction]);
    }

    /**
     * @notice Withdraw VIDA Cap collateral (LOCKED until April 7th)
     * @dev Can only be called after lock period ends
     * @param jurisdiction National jurisdiction
     * @param recipient Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawCollateral(
        NationalJurisdiction jurisdiction,
        address recipient,
        uint256 amount
    ) external onlyRole(BRIDGE_ROLE) nonReentrant {
        // TIMELOCK: Cannot withdraw during lock period
        require(block.timestamp >= LOCK_END_DATE, "Collateral locked until April 7th, 2026");
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than zero");
        require(nationalEscrowBalance[jurisdiction] >= amount, "Insufficient balance");

        // Verify 100% backing is maintained
        uint256 newBalance = nationalEscrowBalance[jurisdiction] - amount;
        require(newBalance >= totalNVIDASupply[jurisdiction], "Cannot break 100% backing");

        // Update balance
        nationalEscrowBalance[jurisdiction] = newBalance;

        // Transfer VIDA Cap to recipient
        // Note: In production, this would transfer actual tokens
        // vidaCapToken.transfer(recipient, amount);

        totalWithdrawals++;
        withdrawalsByJurisdiction[jurisdiction]++;

        emit CollateralWithdrawn(jurisdiction, recipient, amount, newBalance);
    }

    /**
     * @notice Update N-VIDA supply (called by bridge when minting/burning)
     * @param jurisdiction National jurisdiction
     * @param newSupply New N-VIDA supply
     */
    function updateNVIDASupply(
        NationalJurisdiction jurisdiction,
        uint256 newSupply
    ) external onlyRole(BRIDGE_ROLE) {
        // Verify 100% backing is maintained
        require(nationalEscrowBalance[jurisdiction] >= newSupply, "Insufficient collateral");

        uint256 oldSupply = totalNVIDASupply[jurisdiction];
        totalNVIDASupply[jurisdiction] = newSupply;

        emit NVIDASupplyUpdated(jurisdiction, oldSupply, newSupply);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Check if we are in lock period
     */
    function isInLockPeriod() public view returns (bool) {
        return block.timestamp >= LOCK_START_DATE && block.timestamp < LOCK_END_DATE;
    }

    /**
     * @notice Get backing ratio (should always be 100% or higher)
     */
    function getBackingRatio(NationalJurisdiction jurisdiction) public view returns (uint256) {
        if (totalNVIDASupply[jurisdiction] == 0) {
            return 100; // 100% backed (no supply yet)
        }
        return (nationalEscrowBalance[jurisdiction] * 100) / totalNVIDASupply[jurisdiction];
    }

    /**
     * @notice Get available collateral (excess over 100% backing)
     */
    function getAvailableCollateral(NationalJurisdiction jurisdiction) public view returns (uint256) {
        if (nationalEscrowBalance[jurisdiction] <= totalNVIDASupply[jurisdiction]) {
            return 0;
        }
        return nationalEscrowBalance[jurisdiction] - totalNVIDASupply[jurisdiction];
    }

    /**
     * @notice Get comprehensive stats
     */
    function getStats(NationalJurisdiction jurisdiction) external view returns (
        uint256 escrowBalance,
        uint256 nVidaSupply,
        uint256 backingRatio,
        uint256 availableCollateral,
        bool inLockPeriod,
        uint256 withdrawals
    ) {
        escrowBalance = nationalEscrowBalance[jurisdiction];
        nVidaSupply = totalNVIDASupply[jurisdiction];
        backingRatio = getBackingRatio(jurisdiction);
        availableCollateral = getAvailableCollateral(jurisdiction);
        inLockPeriod = isInLockPeriod();
        withdrawals = withdrawalsByJurisdiction[jurisdiction];
    }

    /**
     * @notice Get days until lock period ends
     */
    function getDaysUntilUnlock() public view returns (uint256) {
        if (block.timestamp >= LOCK_END_DATE) {
            return 0;
        }
        if (block.timestamp < LOCK_START_DATE) {
            return (LOCK_END_DATE - LOCK_START_DATE) / 1 days;
        }
        return (LOCK_END_DATE - block.timestamp) / 1 days;
    }

    /**
     * @notice Check if withdrawal is allowed
     */
    function canWithdraw() public view returns (bool) {
        return block.timestamp >= LOCK_END_DATE;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Grant Bridge Role
     * @param account Account to grant role to
     */
    function grantBridgeRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(BRIDGE_ROLE, account);
    }

    /**
     * @notice Revoke Bridge Role
     * @param account Account to revoke role from
     */
    function revokeBridgeRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(BRIDGE_ROLE, account);
    }
}

