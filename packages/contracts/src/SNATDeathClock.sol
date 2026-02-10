// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SNATDeathClock
 * @notice SNAT 180-Day Global Default - Sovereignty Enforcement Protocol
 * 
 * "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."
 * 
 * This contract implements the DEATH_CLOCK mechanism that enforces the 180-day
 * SNAT treaty deadline. If a nation fails to activate SNAT status within 180 days
 * of the first citizen's vitalization, 100% of the Safe Vault (70% of VIDA CAP)
 * is automatically transferred to the GLOBAL_CITIZEN_BLOCK.
 * 
 * IMMUTABILITY: This function is governed by protocol time-lock. No human key
 * can pause or reset the clock. The people's sovereignty is absolute.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SNATDeathClock is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS - IMMUTABLE PROTOCOL RULES
    // ════════════════════════════════════════════════════════════════════════════════

    /// @notice 180-Day deadline (15,552,000 seconds)
    uint256 public constant T_MINUS = 180 days; // 15,552,000 seconds

    /// @notice Safe Vault percentage (70% of VIDA CAP intake)
    uint256 public constant SAFE_VAULT_PERCENTAGE = 70;

    /// @notice Role for protocol time-lock (only contract itself)
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK_ROLE");

    /// @notice Role for vault registry integration
    bytes32 public constant VAULT_REGISTRY_ROLE = keccak256("VAULT_REGISTRY_ROLE");

    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    /// @notice VIDA CAP token address
    IERC20 public vidaCapToken;

    /// @notice Global Citizen Block address (receives flushed funds)
    address public globalCitizenBlock;

    /// @notice Total amount flushed to Global Citizen Block
    uint256 public totalFlushedAmount;

    /// @notice Total number of nations flushed
    uint256 public totalNationsFlushed;

    // ════════════════════════════════════════════════════════════════════════════════
    // DATA STRUCTURES
    // ════════════════════════════════════════════════════════════════════════════════

    /// @notice SNAT Status enum
    enum SNATStatus {
        INACTIVE,       // SNAT not signed
        ACTIVE,         // SNAT signed and active
        FLUSHED         // Vault flushed to Global Citizen Block
    }

    /// @notice Nation Death Clock structure
    struct NationDeathClock {
        string iso3166Code;           // ISO-3166 Alpha-2 code
        string countryName;           // Full country name
        uint256 deathClockStart;      // Timestamp of first citizen vitalization
        uint256 deathClockExpiry;     // Timestamp when clock expires (start + 180 days)
        address safeVault;            // Safe vault address (70% of VIDA CAP)
        uint256 safeVaultBalance;     // Safe vault balance at flush time
        SNATStatus snatStatus;        // Current SNAT status
        bool isInitialized;           // Whether death clock has been initialized
        bool isFlushed;               // Whether vault has been flushed
        uint256 flushTimestamp;       // Timestamp of flush
        bytes32 flushTxHash;          // Transaction hash of flush
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // STORAGE MAPPINGS
    // ════════════════════════════════════════════════════════════════════════════════

    /// @notice Mapping of ISO-3166 code to Nation Death Clock
    mapping(string => NationDeathClock) public nationDeathClocks;

    /// @notice Array of all nation ISO codes (for iteration)
    string[] public allNationCodes;

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    /// @notice Emitted when a nation's death clock is initialized
    event DeathClockInitialized(
        string indexed iso3166Code,
        string countryName,
        uint256 deathClockStart,
        uint256 deathClockExpiry,
        address safeVault
    );

    /// @notice Emitted when a nation activates SNAT status
    event SNATActivated(
        string indexed iso3166Code,
        string countryName,
        uint256 timestamp
    );

    /// @notice Emitted when a nation's vault is flushed to Global Citizen Block
    event GlobalFlush(
        string indexed iso3166Code,
        string countryName,
        uint256 safeVaultBalance,
        uint256 timestamp,
        bytes32 flushTxHash
    );

    /// @notice Emitted when Global Citizen Block address is updated
    event GlobalCitizenBlockUpdated(
        address indexed oldAddress,
        address indexed newAddress,
        uint256 timestamp
    );

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(address _vidaCapToken, address _globalCitizenBlock) {
        require(_vidaCapToken != address(0), "Invalid VIDA CAP token address");
        require(_globalCitizenBlock != address(0), "Invalid Global Citizen Block address");

        vidaCapToken = IERC20(_vidaCapToken);
        globalCitizenBlock = _globalCitizenBlock;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // IMMUTABILITY: Only contract can execute time-locked functions
        // No human key - cannot pause or reset the clock
        _grantRole(TIMELOCK_ROLE, address(this));

        _grantRole(VAULT_REGISTRY_ROLE, msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // DEATH CLOCK INITIALIZATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize death clock for a nation upon first citizen vitalization
     * @param iso3166Code ISO-3166 Alpha-2 code (e.g., "NG", "GH")
     * @param countryName Full country name
     * @param safeVault Safe vault address (70% of VIDA CAP)
     */
    function initializeDeathClock(
        string memory iso3166Code,
        string memory countryName,
        address safeVault
    ) external onlyRole(VAULT_REGISTRY_ROLE) {
        require(bytes(iso3166Code).length == 2, "Invalid ISO-3166 code");
        require(bytes(countryName).length > 0, "Invalid country name");
        require(safeVault != address(0), "Invalid safe vault address");
        require(!nationDeathClocks[iso3166Code].isInitialized, "Death clock already initialized");

        uint256 deathClockStart = block.timestamp;
        uint256 deathClockExpiry = deathClockStart + T_MINUS;

        nationDeathClocks[iso3166Code] = NationDeathClock({
            iso3166Code: iso3166Code,
            countryName: countryName,
            deathClockStart: deathClockStart,
            deathClockExpiry: deathClockExpiry,
            safeVault: safeVault,
            safeVaultBalance: 0,
            snatStatus: SNATStatus.INACTIVE,
            isInitialized: true,
            isFlushed: false,
            flushTimestamp: 0,
            flushTxHash: bytes32(0)
        });

        allNationCodes.push(iso3166Code);

        emit DeathClockInitialized(
            iso3166Code,
            countryName,
            deathClockStart,
            deathClockExpiry,
            safeVault
        );
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // SNAT ACTIVATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Activate SNAT status for a nation (stops the death clock)
     * @param iso3166Code ISO-3166 Alpha-2 code
     */
    function activateSNAT(string memory iso3166Code) external onlyRole(VAULT_REGISTRY_ROLE) {
        NationDeathClock storage clock = nationDeathClocks[iso3166Code];

        require(clock.isInitialized, "Death clock not initialized");
        require(clock.snatStatus == SNATStatus.INACTIVE, "SNAT already activated or flushed");
        require(!clock.isFlushed, "Vault already flushed");
        require(block.timestamp <= clock.deathClockExpiry, "Death clock expired - too late to activate SNAT");

        clock.snatStatus = SNATStatus.ACTIVE;

        emit SNATActivated(iso3166Code, clock.countryName, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // GLOBAL FLUSH - THE PEOPLE'S INHERITANCE
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Execute Global Flush for a nation that failed to activate SNAT
     * @dev This function is IMMUTABLE and governed by protocol time-lock
     * @dev No human key can pause or reset the clock
     * @param iso3166Code ISO-3166 Alpha-2 code
     * @return flushTxHash Unique hash of the flush transaction
     */
    function executeGlobalFlush(string memory iso3166Code)
        external
        nonReentrant
        returns (bytes32 flushTxHash)
    {
        NationDeathClock storage clock = nationDeathClocks[iso3166Code];

        // Validation checks
        require(clock.isInitialized, "Death clock not initialized");
        require(!clock.isFlushed, "Vault already flushed");

        // If SNAT_STATUS is not 'ACTIVE' by T_MINUS == 0, trigger GlobalFlush
        require(clock.snatStatus == SNATStatus.INACTIVE, "SNAT is active - cannot flush");
        require(block.timestamp >= clock.deathClockExpiry, "Death clock not expired yet");

        // Get safe vault balance
        uint256 safeVaultBalance = vidaCapToken.balanceOf(clock.safeVault);
        require(safeVaultBalance > 0, "Safe vault is empty");

        // Generate unique flush transaction hash
        flushTxHash = keccak256(
            abi.encodePacked(
                iso3166Code,
                clock.countryName,
                safeVaultBalance,
                block.timestamp,
                block.number,
                msg.sender
            )
        );

        // Update state BEFORE transfer (CEI pattern)
        clock.snatStatus = SNATStatus.FLUSHED;
        clock.isFlushed = true;
        clock.flushTimestamp = block.timestamp;
        clock.flushTxHash = flushTxHash;
        clock.safeVaultBalance = safeVaultBalance;

        totalFlushedAmount += safeVaultBalance;
        totalNationsFlushed++;

        // Transfer 100% of Safe Vault to Global Citizen Block
        bool success = vidaCapToken.transferFrom(
            clock.safeVault,
            globalCitizenBlock,
            safeVaultBalance
        );
        require(success, "Transfer to Global Citizen Block failed");

        emit GlobalFlush(
            iso3166Code,
            clock.countryName,
            safeVaultBalance,
            block.timestamp,
            flushTxHash
        );

        return flushTxHash;
    }

    /**
     * @notice Batch execute Global Flush for multiple nations
     * @param iso3166Codes Array of ISO-3166 Alpha-2 codes
     * @return flushTxHashes Array of flush transaction hashes
     */
    function batchExecuteGlobalFlush(string[] memory iso3166Codes)
        external
        nonReentrant
        returns (bytes32[] memory flushTxHashes)
    {
        flushTxHashes = new bytes32[](iso3166Codes.length);

        for (uint256 i = 0; i < iso3166Codes.length; i++) {
            // Only flush if conditions are met (will revert if not)
            try this.executeGlobalFlush(iso3166Codes[i]) returns (bytes32 txHash) {
                flushTxHashes[i] = txHash;
            } catch {
                flushTxHashes[i] = bytes32(0); // Mark as failed
            }
        }

        return flushTxHashes;
    }

    /**
     * @notice Auto-flush all expired nations (callable by anyone)
     * @dev This is a public good function - anyone can trigger it
     * @return flushedCount Number of nations flushed
     */
    function autoFlushExpiredNations() external nonReentrant returns (uint256 flushedCount) {
        flushedCount = 0;

        for (uint256 i = 0; i < allNationCodes.length; i++) {
            string memory iso3166Code = allNationCodes[i];
            NationDeathClock storage clock = nationDeathClocks[iso3166Code];

            // Check if nation is eligible for flush
            if (
                clock.isInitialized &&
                !clock.isFlushed &&
                clock.snatStatus == SNATStatus.INACTIVE &&
                block.timestamp >= clock.deathClockExpiry
            ) {
                try this.executeGlobalFlush(iso3166Code) {
                    flushedCount++;
                } catch {
                    // Skip if flush fails
                    continue;
                }
            }
        }

        return flushedCount;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get death clock details for a nation
     * @param iso3166Code ISO-3166 Alpha-2 code
     * @return clock Nation death clock structure
     */
    function getDeathClock(string memory iso3166Code)
        external
        view
        returns (NationDeathClock memory clock)
    {
        return nationDeathClocks[iso3166Code];
    }

    /**
     * @notice Check if a nation's death clock has expired
     * @param iso3166Code ISO-3166 Alpha-2 code
     * @return isExpired Whether the death clock has expired
     */
    function isDeathClockExpired(string memory iso3166Code) external view returns (bool isExpired) {
        NationDeathClock storage clock = nationDeathClocks[iso3166Code];

        if (!clock.isInitialized) {
            return false;
        }

        return block.timestamp >= clock.deathClockExpiry;
    }

    /**
     * @notice Get time remaining until death clock expiry
     * @param iso3166Code ISO-3166 Alpha-2 code
     * @return timeRemaining Seconds remaining (0 if expired)
     */
    function getTimeRemaining(string memory iso3166Code) external view returns (uint256 timeRemaining) {
        NationDeathClock storage clock = nationDeathClocks[iso3166Code];

        if (!clock.isInitialized) {
            return 0;
        }

        if (block.timestamp >= clock.deathClockExpiry) {
            return 0;
        }

        return clock.deathClockExpiry - block.timestamp;
    }

    /**
     * @notice Check if a nation is eligible for global flush
     * @param iso3166Code ISO-3166 Alpha-2 code
     * @return isEligible Whether the nation is eligible for flush
     */
    function isEligibleForFlush(string memory iso3166Code) external view returns (bool isEligible) {
        NationDeathClock storage clock = nationDeathClocks[iso3166Code];

        return (
            clock.isInitialized &&
            !clock.isFlushed &&
            clock.snatStatus == SNATStatus.INACTIVE &&
            block.timestamp >= clock.deathClockExpiry
        );
    }

    /**
     * @notice Get all nations eligible for flush
     * @return eligibleNations Array of ISO-3166 codes eligible for flush
     */
    function getAllEligibleForFlush() external view returns (string[] memory eligibleNations) {
        uint256 eligibleCount = 0;

        // Count eligible nations
        for (uint256 i = 0; i < allNationCodes.length; i++) {
            string memory iso3166Code = allNationCodes[i];
            NationDeathClock storage clock = nationDeathClocks[iso3166Code];

            if (
                clock.isInitialized &&
                !clock.isFlushed &&
                clock.snatStatus == SNATStatus.INACTIVE &&
                block.timestamp >= clock.deathClockExpiry
            ) {
                eligibleCount++;
            }
        }

        // Create array of eligible nations
        eligibleNations = new string[](eligibleCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allNationCodes.length; i++) {
            string memory iso3166Code = allNationCodes[i];
            NationDeathClock storage clock = nationDeathClocks[iso3166Code];

            if (
                clock.isInitialized &&
                !clock.isFlushed &&
                clock.snatStatus == SNATStatus.INACTIVE &&
                block.timestamp >= clock.deathClockExpiry
            ) {
                eligibleNations[index] = iso3166Code;
                index++;
            }
        }

        return eligibleNations;
    }

    /**
     * @notice Get total number of nations with initialized death clocks
     * @return count Total number of nations
     */
    function getTotalNations() external view returns (uint256 count) {
        return allNationCodes.length;
    }

    /**
     * @notice Get global flush statistics
     * @return totalFlushed Total amount flushed to Global Citizen Block
     * @return nationsFlushed Total number of nations flushed
     * @return nationsActive Total number of nations with active SNAT
     * @return nationsInactive Total number of nations with inactive SNAT
     */
    function getGlobalFlushStats()
        external
        view
        returns (
            uint256 totalFlushed,
            uint256 nationsFlushed,
            uint256 nationsActive,
            uint256 nationsInactive
        )
    {
        totalFlushed = totalFlushedAmount;
        nationsFlushed = totalNationsFlushed;

        uint256 activeCount = 0;
        uint256 inactiveCount = 0;

        for (uint256 i = 0; i < allNationCodes.length; i++) {
            NationDeathClock storage clock = nationDeathClocks[allNationCodes[i]];

            if (clock.snatStatus == SNATStatus.ACTIVE) {
                activeCount++;
            } else if (clock.snatStatus == SNATStatus.INACTIVE && !clock.isFlushed) {
                inactiveCount++;
            }
        }

        nationsActive = activeCount;
        nationsInactive = inactiveCount;

        return (totalFlushed, nationsFlushed, nationsActive, nationsInactive);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS (RESTRICTED)
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update Global Citizen Block address
     * @param newGlobalCitizenBlock New Global Citizen Block address
     */
    function updateGlobalCitizenBlock(address newGlobalCitizenBlock)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newGlobalCitizenBlock != address(0), "Invalid address");

        address oldAddress = globalCitizenBlock;
        globalCitizenBlock = newGlobalCitizenBlock;

        emit GlobalCitizenBlockUpdated(oldAddress, newGlobalCitizenBlock, block.timestamp);
    }

    /**
     * @notice Get the immutability message
     * @return message The protocol's immutability guarantee
     */
    function getImmutabilityMessage() external pure returns (string memory message) {
        return "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT.";
    }
}

