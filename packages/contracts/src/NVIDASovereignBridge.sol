// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NVIDASovereignBridge - National VIDA Sovereign Bridge
 * @notice Dual-currency state bridge with February-April lock and national pegging
 * @dev Implements N-VIDA_NGN and N-VIDA_GHS with Human Standard of Living index
 * 
 * DUAL-CURRENCY STATE:
 * ════════════════════════════════════════════════════════════════════════════════
 * - N-VIDA_NGN: Nigerian National VIDA (pegged to Nigerian Human Standard of Living)
 * - N-VIDA_GHS: Ghanaian National VIDA (pegged to Ghanaian Human Standard of Living)
 * 
 * THE FEBRUARY-APRIL LOCK (Feb 7th - April 7th, 2026):
 * ════════════════════════════════════════════════════════════════════════════════
 * - Internal Transfers Only: Citizens can send N-VIDA via PFF Handshake
 * - Fiat Bridge: PENDING mode (convertToUSD() locked until April 7th)
 * - Liquidity Reserve: 100% of Nation's 50% split provides collateral
 * 
 * NATIONAL PEGGING (Human Standard of Living Index):
 * ════════════════════════════════════════════════════════════════════════════════
 * - Instead of fixed $1,000 generalization
 * - N-VIDA value = Human Standard of Living index for specific nation
 * - More resilient to local inflation
 * 
 * APRIL 7TH UNLOCK (Grand Entrance):
 * ════════════════════════════════════════════════════════════════════════════════
 * - TIMELOCK on convertToUSD() function
 * - Remains inactive until April 7th, 2026
 * - Grand Entrance liquidity injection
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NVIDASovereignBridge is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════

    // February-April Lock Period
    uint256 public constant LOCK_START_DATE = 1739059200; // Feb 7th, 2026 00:00:00 UTC
    uint256 public constant LOCK_END_DATE = 1744243200; // April 7th, 2026 00:00:00 UTC (60 days)

    // National Jurisdictions
    enum NationalJurisdiction { NIGERIA, GHANA }

    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    // N-VIDA Token Addresses
    address public nVidaNGN; // N-VIDA_NGN token
    address public nVidaGHS; // N-VIDA_GHS token

    // Liquidity Reserve Contract
    address public liquidityReserve;

    // Human Standard of Living Index (per jurisdiction)
    // Stored in USD cents (e.g., 50000 = $500.00)
    mapping(NationalJurisdiction => uint256) public humanStandardOfLivingIndex;

    // National Escrow Balances (100% backing for N-VIDA)
    mapping(NationalJurisdiction => uint256) public nationalEscrowBalance;

    // Total N-VIDA Supply (per jurisdiction)
    mapping(NationalJurisdiction => uint256) public totalNVIDASupply;

    // Fiat Bridge Status
    bool public fiatBridgeActive;

    // Internal Transfer Statistics
    uint256 public totalInternalTransfers;
    mapping(NationalJurisdiction => uint256) public internalTransfersByJurisdiction;

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    event NVIDAMinted(
        NationalJurisdiction indexed jurisdiction,
        address indexed citizen,
        uint256 amount,
        uint256 escrowBacking
    );

    event InternalTransfer(
        NationalJurisdiction indexed jurisdiction,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 pffHash
    );

    event HumanStandardOfLivingUpdated(
        NationalJurisdiction indexed jurisdiction,
        uint256 oldIndex,
        uint256 newIndex
    );

    event FiatBridgeActivated(uint256 timestamp);

    event ConvertedToUSD(
        NationalJurisdiction indexed jurisdiction,
        address indexed citizen,
        uint256 nVidaAmount,
        uint256 usdAmount
    );

    event LiquidityReserveUpdated(
        NationalJurisdiction indexed jurisdiction,
        uint256 newBalance
    );

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(
        address _nVidaNGN,
        address _nVidaGHS,
        address _liquidityReserve
    ) {
        require(_nVidaNGN != address(0), "Invalid N-VIDA_NGN address");
        require(_nVidaGHS != address(0), "Invalid N-VIDA_GHS address");
        require(_liquidityReserve != address(0), "Invalid liquidity reserve address");

        nVidaNGN = _nVidaNGN;
        nVidaGHS = _nVidaGHS;
        liquidityReserve = _liquidityReserve;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Initialize Human Standard of Living Index
        // Nigeria: $500/month (50000 cents)
        // Ghana: $450/month (45000 cents)
        humanStandardOfLivingIndex[NationalJurisdiction.NIGERIA] = 50000;
        humanStandardOfLivingIndex[NationalJurisdiction.GHANA] = 45000;

        // Fiat Bridge starts inactive (locked until April 7th)
        fiatBridgeActive = false;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE N-VIDA FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Mint N-VIDA from National Escrow backing
     * @dev Called when citizen receives their 50% split from VIDA Cap minting
     * @param jurisdiction National jurisdiction (Nigeria or Ghana)
     * @param citizen Citizen address
     * @param vidaCapAmount Amount of VIDA Cap allocated to national escrow
     */
    function mintNVIDA(
        NationalJurisdiction jurisdiction,
        address citizen,
        uint256 vidaCapAmount
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(citizen != address(0), "Invalid citizen address");
        require(vidaCapAmount > 0, "Amount must be greater than zero");

        // Calculate N-VIDA amount based on Human Standard of Living Index
        // N-VIDA is 1:1 backed by VIDA Cap in national escrow
        uint256 nVidaAmount = vidaCapAmount;

        // Update national escrow balance (100% backing)
        nationalEscrowBalance[jurisdiction] += vidaCapAmount;

        // Update total N-VIDA supply
        totalNVIDASupply[jurisdiction] += nVidaAmount;

        // Mint N-VIDA to citizen
        address nVidaToken = _getNVIDAToken(jurisdiction);
        // Note: Actual minting would be handled by N-VIDA token contract
        // This contract tracks the state

        emit NVIDAMinted(jurisdiction, citizen, nVidaAmount, vidaCapAmount);
    }

    /**
     * @notice Internal Transfer (PFF-Verified)
     * @dev Citizens can send N-VIDA to each other via PFF Handshake
     * @param jurisdiction National jurisdiction
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param pffHash PFF Truth-Hash from heartbeat
     */
    function internalTransfer(
        NationalJurisdiction jurisdiction,
        address from,
        address to,
        uint256 amount,
        bytes32 pffHash
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(from != address(0), "Invalid sender address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than zero");
        require(pffHash != bytes32(0), "Invalid PFF hash");

        // Internal transfers are ALWAYS allowed (even during lock period)
        // Note: Actual transfer would be handled by N-VIDA token contract
        // This contract tracks the statistics

        totalInternalTransfers++;
        internalTransfersByJurisdiction[jurisdiction]++;

        emit InternalTransfer(jurisdiction, from, to, amount, pffHash);
    }

    /**
     * @notice Convert N-VIDA to USD (TIMELOCK until April 7th, 2026)
     * @dev Fiat Bridge function - locked until April 7th
     * @param jurisdiction National jurisdiction
     * @param citizen Citizen address
     * @param nVidaAmount Amount of N-VIDA to convert
     */
    function convertToUSD(
        NationalJurisdiction jurisdiction,
        address citizen,
        uint256 nVidaAmount
    ) external nonReentrant returns (uint256 usdAmount) {
        // TIMELOCK: Function remains inactive until April 7th, 2026
        require(block.timestamp >= LOCK_END_DATE, "Fiat Bridge locked until April 7th, 2026");
        require(fiatBridgeActive, "Fiat Bridge not activated");
        require(citizen != address(0), "Invalid citizen address");
        require(nVidaAmount > 0, "Amount must be greater than zero");

        // Calculate USD amount based on Human Standard of Living Index
        uint256 indexValue = humanStandardOfLivingIndex[jurisdiction];
        usdAmount = (nVidaAmount * indexValue) / 10**18; // Convert to USD cents

        // Verify liquidity reserve has sufficient backing
        require(
            nationalEscrowBalance[jurisdiction] >= nVidaAmount,
            "Insufficient liquidity reserve"
        );

        // Burn N-VIDA and release USD from liquidity reserve
        totalNVIDASupply[jurisdiction] -= nVidaAmount;
        nationalEscrowBalance[jurisdiction] -= nVidaAmount;

        // Note: Actual USD transfer would be handled by liquidity reserve contract
        // This contract tracks the state

        emit ConvertedToUSD(jurisdiction, citizen, nVidaAmount, usdAmount);

        return usdAmount;
    }

    /**
     * @notice Activate Fiat Bridge (April 7th, 2026 - Grand Entrance)
     * @dev Can only be called after LOCK_END_DATE
     */
    function activateFiatBridge() external onlyRole(ADMIN_ROLE) {
        require(block.timestamp >= LOCK_END_DATE, "Cannot activate before April 7th, 2026");
        require(!fiatBridgeActive, "Fiat Bridge already activated");

        fiatBridgeActive = true;

        emit FiatBridgeActivated(block.timestamp);
    }

    /**
     * @notice Update Human Standard of Living Index
     * @dev Oracle updates index based on real-world economic data
     * @param jurisdiction National jurisdiction
     * @param newIndex New index value (in USD cents)
     */
    function updateHumanStandardOfLivingIndex(
        NationalJurisdiction jurisdiction,
        uint256 newIndex
    ) external onlyRole(ORACLE_ROLE) {
        require(newIndex > 0, "Index must be greater than zero");

        uint256 oldIndex = humanStandardOfLivingIndex[jurisdiction];
        humanStandardOfLivingIndex[jurisdiction] = newIndex;

        emit HumanStandardOfLivingUpdated(jurisdiction, oldIndex, newIndex);
    }

    /**
     * @notice Update Liquidity Reserve Balance
     * @dev Called when national escrow receives VIDA Cap
     * @param jurisdiction National jurisdiction
     * @param amount Amount to add to reserve
     */
    function updateLiquidityReserve(
        NationalJurisdiction jurisdiction,
        uint256 amount
    ) external onlyRole(PFF_SENTINEL_ROLE) {
        require(amount > 0, "Amount must be greater than zero");

        nationalEscrowBalance[jurisdiction] += amount;

        emit LiquidityReserveUpdated(jurisdiction, nationalEscrowBalance[jurisdiction]);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Check if we are in lock period (Feb 7th - April 7th)
     */
    function isInLockPeriod() public view returns (bool) {
        return block.timestamp >= LOCK_START_DATE && block.timestamp < LOCK_END_DATE;
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
     * @notice Get N-VIDA token address for jurisdiction
     */
    function getNVIDAToken(NationalJurisdiction jurisdiction) external view returns (address) {
        return _getNVIDAToken(jurisdiction);
    }

    /**
     * @notice Get backing ratio (should always be 100%)
     */
    function getBackingRatio(NationalJurisdiction jurisdiction) external view returns (uint256) {
        if (totalNVIDASupply[jurisdiction] == 0) {
            return 100; // 100% backed
        }
        return (nationalEscrowBalance[jurisdiction] * 100) / totalNVIDASupply[jurisdiction];
    }

    /**
     * @notice Get comprehensive stats
     */
    function getStats(NationalJurisdiction jurisdiction) external view returns (
        uint256 nVidaSupply,
        uint256 escrowBalance,
        uint256 humanStandardIndex,
        bool inLockPeriod,
        bool bridgeActive,
        uint256 daysUntilUnlock,
        uint256 internalTransfers
    ) {
        nVidaSupply = totalNVIDASupply[jurisdiction];
        escrowBalance = nationalEscrowBalance[jurisdiction];
        humanStandardIndex = humanStandardOfLivingIndex[jurisdiction];
        inLockPeriod = isInLockPeriod();
        bridgeActive = fiatBridgeActive;
        daysUntilUnlock = getDaysUntilUnlock();
        internalTransfers = internalTransfersByJurisdiction[jurisdiction];
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get N-VIDA token address for jurisdiction
     */
    function _getNVIDAToken(NationalJurisdiction jurisdiction) internal view returns (address) {
        if (jurisdiction == NationalJurisdiction.NIGERIA) {
            return nVidaNGN;
        } else {
            return nVidaGHS;
        }
    }
}

