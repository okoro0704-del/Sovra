// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title NationalUltimatumProtocol (SNAT) - Sovereign National Agreement on Taxation
 * @notice "CITIZENS ARE VITALIZED. TAXATION IS DE-VITALIZED."
 * @dev Hardcoded into SOVRYN Core to enforce zero-tax sovereignty
 *
 * THE NATIONAL ULTIMATUM:
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * LEGAL METADATA:
 * "THIS IS A SOVEREIGN INFRASTRUCTURE AGREEMENT. CITIZENS ARE VITALIZED. TAXATION IS DE-VITALIZED."
 *
 * THE SNAT VARIABLE:
 * - Each National Jurisdiction (Nigeria, Ghana, etc.) has a boolean: isNationTaxFree
 * - Default: FALSE (Nation has NOT agreed to Zero PIT, Zero VAT)
 *
 * THE 50/50 REVENUE SPLIT:
 * - While isNationTaxFree == FALSE:
 *   → Nation's 50% share of ALL transaction fees redirected to Hard-Locked Escrow Vault
 *   → Nation CANNOT withdraw until PFF-Verified Sovereign Handshake agreeing to SNAT
 *
 * THE 'FLUSH' TRIGGER (180-DAY COUNTDOWN):
 * - Launch Date: February 7th, 2026
 * - Countdown: 180 days from launch
 * - If SNAT Handshake NOT performed within 180 days:
 *   → Protocol FLUSHES entire escrow vault directly into Citizen Payout Pool
 *   → Nation loses ALL accumulated revenue PERMANENTLY
 *
 * INFRASTRUCTURE DEACTIVATION:
 * - If Nation attempts to tax a PFF-verified transaction:
 *   → deactivateNationalBlock() function triggers
 *   → Government's access to SOVRYN ledger BLOCKED ENTIRELY
 *   → All future revenue redirected to Citizen Pool
 *
 * PFF-VERIFIED SOVEREIGN HANDSHAKE:
 * - Nation must perform 4-layer PFF Handshake (Face, Finger, Heart, Voice)
 * - Handshake must include cryptographic signature agreeing to:
 *   → Zero Personal Income Tax (PIT) on VIDA Cap transactions
 *   → Zero Value-Added Tax (VAT) on VIDA Cap transactions
 *   → Permanent commitment (irreversible)
 *
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract NationalUltimatumProtocol is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant CITIZEN_POOL_ROLE = keccak256("CITIZEN_POOL_ROLE");

    // Legal Metadata (Hardcoded)
    string public constant LEGAL_METADATA = "THIS IS A SOVEREIGN INFRASTRUCTURE AGREEMENT. CITIZENS ARE VITALIZED. TAXATION IS DE-VITALIZED.";

    // Launch Date: February 7th, 2026 (Unix timestamp: 1770451200)
    uint256 public constant LAUNCH_DATE = 1770451200; // Feb 7, 2026 00:00:00 UTC

    // Flush Trigger: 180 days from launch
    uint256 public constant FLUSH_COUNTDOWN_DAYS = 180;
    uint256 public constant FLUSH_DEADLINE = LAUNCH_DATE + (FLUSH_COUNTDOWN_DAYS * 1 days);

    // Supported National Jurisdictions
    enum NationalJurisdiction { NIGERIA, GHANA }

    // ════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════

    // SNAT Variable: Is Nation Tax-Free?
    mapping(NationalJurisdiction => bool) public isNationTaxFree;

    // Hard-Locked Escrow Vault (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public hardLockedEscrowVault;

    // National Block Status (deactivated if nation attempts taxation)
    mapping(NationalJurisdiction => bool) public isNationalBlockDeactivated;

    // SNAT Handshake Timestamp (when nation agreed to zero-tax)
    mapping(NationalJurisdiction => uint256) public snatHandshakeTimestamp;

    // PFF Signature for SNAT Handshake (cryptographic proof)
    mapping(NationalJurisdiction => bytes32) public snatHandshakePFFSignature;

    // Citizen Payout Pool address
    address public citizenPayoutPool;

    // VIDA Cap token address
    IERC20 public vidaCapToken;

    // Total flushed to citizen pool (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public totalFlushedToCitizenPool;

    // ════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════

    event SNATHandshakePerformed(
        NationalJurisdiction indexed jurisdiction,
        bytes32 pffSignature,
        uint256 timestamp,
        uint256 escrowReleased
    );

    event EscrowLocked(
        NationalJurisdiction indexed jurisdiction,
        uint256 amount,
        uint256 totalLocked
    );

    event EscrowFlushedToCitizenPool(
        NationalJurisdiction indexed jurisdiction,
        uint256 amount,
        uint256 timestamp,
        string reason
    );

    event NationalBlockDeactivated(
        NationalJurisdiction indexed jurisdiction,
        uint256 timestamp,
        string reason
    );

    event TaxationAttemptDetected(
        NationalJurisdiction indexed jurisdiction,
        address indexed violator,
        uint256 timestamp
    );

    event SNATAgreementSigned(
        NationalJurisdiction indexed jurisdiction,
        bytes32 pffSignature,
        string agreement
    );

    // ════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════

    constructor(
        address _citizenPayoutPool,
        address _vidaCapToken
    ) {
        require(_citizenPayoutPool != address(0), "Invalid citizen pool address");
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PFF_SENTINEL_ROLE, msg.sender);
        _grantRole(CITIZEN_POOL_ROLE, _citizenPayoutPool);

        citizenPayoutPool = _citizenPayoutPool;
        vidaCapToken = IERC20(_vidaCapToken);

        // Initialize all jurisdictions as NOT tax-free (default: FALSE)
        isNationTaxFree[NationalJurisdiction.NIGERIA] = false;
        isNationTaxFree[NationalJurisdiction.GHANA] = false;
    }

    // ════════════════════════════════════════════════════════════════
    // CORE SNAT LOGIC
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Lock Nation's 50% revenue share in Hard-Locked Escrow Vault
     * @dev Called by SOVRYN Core when isNationTaxFree == FALSE
     * @param jurisdiction National jurisdiction (Nigeria, Ghana, etc.)
     * @param amount Amount to lock in escrow
     */
    function lockNationalEscrow(
        NationalJurisdiction jurisdiction,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(!isNationTaxFree[jurisdiction], "Nation is tax-free, no escrow needed");
        require(!isNationalBlockDeactivated[jurisdiction], "National block deactivated");
        require(amount > 0, "Amount must be greater than zero");

        hardLockedEscrowVault[jurisdiction] += amount;

        emit EscrowLocked(jurisdiction, amount, hardLockedEscrowVault[jurisdiction]);
    }

    /**
     * @notice Perform PFF-Verified Sovereign Handshake to agree to SNAT (Zero PIT, Zero VAT)
     * @dev Nation must perform 4-layer PFF Handshake with cryptographic signature
     * @param jurisdiction National jurisdiction performing handshake
     * @param pffSignature 4-layer PFF signature (Face + Finger + Heart + Voice)
     * @param pffHash PFF Truth-Hash from biometric verification
     */
    function performSNATHandshake(
        NationalJurisdiction jurisdiction,
        bytes32 pffSignature,
        bytes32 pffHash
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(!isNationTaxFree[jurisdiction], "SNAT already agreed");
        require(!isNationalBlockDeactivated[jurisdiction], "National block deactivated");
        require(pffSignature != bytes32(0), "Invalid PFF signature");
        require(pffHash != bytes32(0), "Invalid PFF hash");

        // Mark nation as tax-free (PERMANENT)
        isNationTaxFree[jurisdiction] = true;
        snatHandshakeTimestamp[jurisdiction] = block.timestamp;
        snatHandshakePFFSignature[jurisdiction] = pffSignature;

        // Release Hard-Locked Escrow Vault to National Escrow
        uint256 escrowAmount = hardLockedEscrowVault[jurisdiction];
        hardLockedEscrowVault[jurisdiction] = 0;

        // Transfer escrow to national escrow (if any)
        if (escrowAmount > 0) {
            // Note: Actual transfer would be handled by SOVRYN Core
            // This contract tracks the state, SOVRYN Core handles token transfers
        }

        emit SNATHandshakePerformed(jurisdiction, pffSignature, block.timestamp, escrowAmount);
        emit SNATAgreementSigned(
            jurisdiction,
            pffSignature,
            "ZERO PERSONAL INCOME TAX (PIT) + ZERO VALUE-ADDED TAX (VAT) ON VIDA CAP TRANSACTIONS"
        );
    }

    /**
     * @notice Flush Hard-Locked Escrow Vault to Citizen Payout Pool (180-day deadline)
     * @dev Callable by anyone after FLUSH_DEADLINE if SNAT not agreed
     * @param jurisdiction National jurisdiction to flush
     */
    function flushEscrowToCitizenPool(
        NationalJurisdiction jurisdiction
    ) external nonReentrant {
        require(block.timestamp >= FLUSH_DEADLINE, "Flush deadline not reached");
        require(!isNationTaxFree[jurisdiction], "Nation already agreed to SNAT");
        require(hardLockedEscrowVault[jurisdiction] > 0, "No escrow to flush");

        uint256 escrowAmount = hardLockedEscrowVault[jurisdiction];
        hardLockedEscrowVault[jurisdiction] = 0;
        totalFlushedToCitizenPool[jurisdiction] += escrowAmount;

        // Transfer escrow to citizen payout pool
        // Note: Actual transfer would be handled by SOVRYN Core
        // This contract tracks the state, SOVRYN Core handles token transfers

        emit EscrowFlushedToCitizenPool(
            jurisdiction,
            escrowAmount,
            block.timestamp,
            "180-DAY DEADLINE EXPIRED - NATION FAILED TO AGREE TO SNAT"
        );
    }

    /**
     * @notice Deactivate National Block (if nation attempts taxation)
     * @dev Blocks government's access to SOVRYN ledger entirely
     * @param jurisdiction National jurisdiction to deactivate
     * @param violator Address that attempted taxation
     */
    function deactivateNationalBlock(
        NationalJurisdiction jurisdiction,
        address violator
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(!isNationalBlockDeactivated[jurisdiction], "Already deactivated");

        // Deactivate national block (PERMANENT)
        isNationalBlockDeactivated[jurisdiction] = true;

        // Flush all escrow to citizen pool
        uint256 escrowAmount = hardLockedEscrowVault[jurisdiction];
        if (escrowAmount > 0) {
            hardLockedEscrowVault[jurisdiction] = 0;
            totalFlushedToCitizenPool[jurisdiction] += escrowAmount;

            emit EscrowFlushedToCitizenPool(
                jurisdiction,
                escrowAmount,
                block.timestamp,
                "NATIONAL BLOCK DEACTIVATED - TAXATION ATTEMPT DETECTED"
            );
        }

        emit NationalBlockDeactivated(
            jurisdiction,
            block.timestamp,
            "GOVERNMENT ATTEMPTED TO TAX PFF-VERIFIED TRANSACTION"
        );
        emit TaxationAttemptDetected(jurisdiction, violator, block.timestamp);
    }

    /**
     * @notice Report taxation attempt by national government
     * @dev Triggers deactivateNationalBlock() if verified
     * @param jurisdiction National jurisdiction that attempted taxation
     * @param violator Address that attempted taxation
     * @param pffSignature PFF signature proving taxation attempt
     */
    function reportTaxationAttempt(
        NationalJurisdiction jurisdiction,
        address violator,
        bytes32 pffSignature
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(!isNationalBlockDeactivated[jurisdiction], "Already deactivated");
        require(pffSignature != bytes32(0), "Invalid PFF signature");

        emit TaxationAttemptDetected(jurisdiction, violator, block.timestamp);

        // Trigger deactivation
        deactivateNationalBlock(jurisdiction, violator);
    }

    // ════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Check if nation is tax-free (agreed to SNAT)
     * @param jurisdiction National jurisdiction to check
     * @return isTaxFree True if nation agreed to zero-tax
     */
    function isNationTaxFreeStatus(
        NationalJurisdiction jurisdiction
    ) external view returns (bool isTaxFree) {
        return isNationTaxFree[jurisdiction];
    }

    /**
     * @notice Get Hard-Locked Escrow Vault balance
     * @param jurisdiction National jurisdiction to check
     * @return escrowBalance Current escrow balance
     */
    function getEscrowBalance(
        NationalJurisdiction jurisdiction
    ) external view returns (uint256 escrowBalance) {
        return hardLockedEscrowVault[jurisdiction];
    }

    /**
     * @notice Get time remaining until flush deadline
     * @return secondsRemaining Seconds until flush deadline (0 if expired)
     */
    function getTimeUntilFlushDeadline() external view returns (uint256 secondsRemaining) {
        if (block.timestamp >= FLUSH_DEADLINE) {
            return 0;
        }
        return FLUSH_DEADLINE - block.timestamp;
    }

    /**
     * @notice Get days remaining until flush deadline
     * @return daysRemaining Days until flush deadline (0 if expired)
     */
    function getDaysUntilFlushDeadline() external view returns (uint256 daysRemaining) {
        if (block.timestamp >= FLUSH_DEADLINE) {
            return 0;
        }
        return (FLUSH_DEADLINE - block.timestamp) / 1 days;
    }

    /**
     * @notice Check if flush deadline has passed
     * @return isExpired True if flush deadline has passed
     */
    function isFlushDeadlineExpired() external view returns (bool isExpired) {
        return block.timestamp >= FLUSH_DEADLINE;
    }

    /**
     * @notice Get SNAT handshake details
     * @param jurisdiction National jurisdiction to check
     * @return timestamp Timestamp of SNAT handshake (0 if not performed)
     * @return pffSignature PFF signature from handshake
     * @return isTaxFree True if nation agreed to SNAT
     */
    function getSNATHandshakeDetails(
        NationalJurisdiction jurisdiction
    ) external view returns (
        uint256 timestamp,
        bytes32 pffSignature,
        bool isTaxFree
    ) {
        return (
            snatHandshakeTimestamp[jurisdiction],
            snatHandshakePFFSignature[jurisdiction],
            isNationTaxFree[jurisdiction]
        );
    }

    /**
     * @notice Get national block status
     * @param jurisdiction National jurisdiction to check
     * @return isDeactivated True if national block is deactivated
     */
    function getNationalBlockStatus(
        NationalJurisdiction jurisdiction
    ) external view returns (bool isDeactivated) {
        return isNationalBlockDeactivated[jurisdiction];
    }

    /**
     * @notice Get total flushed to citizen pool
     * @param jurisdiction National jurisdiction to check
     * @return totalFlushed Total amount flushed to citizen pool
     */
    function getTotalFlushedToCitizenPool(
        NationalJurisdiction jurisdiction
    ) external view returns (uint256 totalFlushed) {
        return totalFlushedToCitizenPool[jurisdiction];
    }

    /**
     * @notice Get legal metadata
     * @return metadata Legal metadata string
     */
    function getLegalMetadata() external pure returns (string memory metadata) {
        return LEGAL_METADATA;
    }

    /**
     * @notice Get launch date
     * @return launchDate Launch date (Unix timestamp)
     */
    function getLaunchDate() external pure returns (uint256 launchDate) {
        return LAUNCH_DATE;
    }

    /**
     * @notice Get flush deadline
     * @return flushDeadline Flush deadline (Unix timestamp)
     */
    function getFlushDeadline() external pure returns (uint256 flushDeadline) {
        return FLUSH_DEADLINE;
    }

    /**
     * @notice Get flush countdown days
     * @return countdownDays Number of days for flush countdown
     */
    function getFlushCountdownDays() external pure returns (uint256 countdownDays) {
        return FLUSH_COUNTDOWN_DAYS;
    }

    // ════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Update citizen payout pool address
     * @dev Only callable by admin
     * @param newCitizenPool New citizen payout pool address
     */
    function updateCitizenPayoutPool(
        address newCitizenPool
    ) external onlyRole(ADMIN_ROLE) {
        require(newCitizenPool != address(0), "Invalid citizen pool address");
        address oldPool = citizenPayoutPool;
        citizenPayoutPool = newCitizenPool;

        // Transfer role
        _revokeRole(CITIZEN_POOL_ROLE, oldPool);
        _grantRole(CITIZEN_POOL_ROLE, newCitizenPool);
    }
}

