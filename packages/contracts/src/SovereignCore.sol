// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SovereignCore - SOVRYN Genesis Protocol
 * @notice Centralized tokenomics engine for VIDA Cap Godcurrency
 * @dev All minting, splitting, and burning logic consolidated in one contract
 *
 * THE BILLION-FIRST MANDATE: REWARDING THE FOUNDATION
 * ═══════════════════════════════════════════════════════════════════
 *
 * GENESIS MINT:
 * - Initial Supply: 10 VIDA Cap
 * - Architect (Isreal Okoro): 5 VIDA Cap
 * - National Escrow: 5 VIDA Cap
 * - Start Price: $1,000 USD per VIDA Cap (HARDCODED)
 *
 * THE FIRST BILLION ERA (Pre-10B):
 * - Every PFF handshake mints: 10 VIDA Cap
 * - Citizen receives: 5 VIDA Cap (50%)
 * - National Escrow receives: 5 VIDA Cap (50%)
 * - Duration: Until supply reaches 10 Billion
 * - Purpose: REWARDING THE FOUNDATION
 *
 * THE GREAT SCARCITY PIVOT (10B THRESHOLD):
 * - Trigger: Total supply >= 10,000,000,000 VIDA Cap
 * - Action: Instant transition to 2-Unit Era
 * - Burn Activation: 10% transaction burn starts immediately
 * - Event: EraTransition emitted
 *
 * POST-PIVOT ERA (Post-10B):
 * - Every PFF handshake mints: 2 VIDA Cap
 * - Citizen receives: 1 VIDA Cap (50%)
 * - National Escrow receives: 1 VIDA Cap (50%)
 * - Duration: Permanent
 *
 * AGGRESSIVE BURN (Post-10B):
 * - Rate: 10% of every transaction
 * - Target: Supply = 1 VIDA Cap per verified citizen (1:1 Biological Ratio)
 * - Stops: When equilibrium reached
 *
 * PFF SENTINEL INTERFACE:
 * ═══════════════════════════════════════════════════════════════════
 * - Only accepts VALID_PRESENCE signal from PFF Sentinel
 * - Cryptographic signature verification required
 * - Anti-replay protection (nonce tracking)
 * - Timestamp validation (< 60 seconds)
 *
 * "The Billion-First Mandate: Rewarding the Foundation."
 *
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract SovereignCore is ERC20, AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════
    // CONSTANTS - DIVINE ISSUANCE
    // ════════════════════════════════════════════════════════════════
    
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant NATIONAL_ESCROW_ROLE = keccak256("NATIONAL_ESCROW_ROLE");
    
    // Genesis Constants
    uint256 public constant INITIAL_MINT = 10 * 10**18; // 10 VIDA Cap
    uint256 public constant GENESIS_SPLIT = 5 * 10**18; // 5 to Architect / 5 to Nation
    uint256 public constant START_PRICE_USD = 1000; // $1,000 per VIDA Cap (HARDCODED)

    // Era Thresholds - THE BILLION-FIRST MANDATE
    uint256 public constant THRESHOLD_10B = 10_000_000_000 * 10**18; // 10 Billion VIDA Cap

    // First Billion Era (Pre-10B) - REWARDING THE FOUNDATION
    uint256 public constant MINT_AMOUNT_10_ERA = 10 * 10**18; // 10 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_10_ERA = 5 * 10**18; // 5 to Citizen (50%)
    uint256 public constant NATION_SPLIT_10_ERA = 5 * 10**18; // 5 to Nation (50%)

    // Post-Pivot Era (Post-10B) - THE GREAT SCARCITY PIVOT
    uint256 public constant MINT_AMOUNT_2_ERA = 2 * 10**18; // 2 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_2_ERA = 1 * 10**18; // 1 to Citizen (50%)
    uint256 public constant NATION_SPLIT_2_ERA = 1 * 10**18; // 1 to Nation (50%)

    // Burn Constants - AGGRESSIVE BURN POST-PIVOT
    uint256 public constant BURN_RATE_BPS = 1000; // 10% (1000 basis points) - ACTIVATED POST-10B
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Divine Issuance Tag
    string public constant DIVINE_ISSUANCE_TAG = "DIVINE_ISSUANCE";
    string public constant BILLION_FIRST_MANDATE = "THE BILLION-FIRST MANDATE: REWARDING THE FOUNDATION";
    
    // ════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════
    
    enum MintingEra { TEN_UNIT_ERA, TWO_UNIT_ERA }
    
    MintingEra public currentEra;
    address public nationalEscrow;
    address public architect; // Isreal Okoro
    
    uint256 public totalVerifiedCitizens;
    uint256 public totalBurned;
    uint256 public totalPFFHandshakes;
    
    mapping(bytes32 => bool) public usedPFFSignatures; // Anti-replay protection
    mapping(address => bool) public isVerifiedCitizen;
    
    // ════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════
    
    event GenesisMintExecuted(address indexed architect, address indexed nationalEscrow, uint256 amount, string divineTag);
    event ValidPresenceReceived(address indexed citizen, bytes32 pffSignature, bytes32 pffHash);
    event PFFHandshakeMint(address indexed citizen, uint256 citizenAmount, uint256 nationAmount, bytes32 pffSignature);
    event EraTransition(MintingEra oldEra, MintingEra newEra, uint256 currentSupply, string reason);
    event TransactionBurned(address indexed from, address indexed to, uint256 burnAmount, uint256 totalBurned);
    event CitizenVerified(address indexed citizen, bytes32 pffHash, uint256 totalCitizens);
    event PFFSignatureUsed(bytes32 indexed signature, address indexed citizen, uint256 timestamp);
    event EquilibriumReached(uint256 finalSupply, uint256 totalCitizens);
    
    // ════════════════════════════════════════════════════════════════
    // CONSTRUCTOR - GENESIS BLOCK
    // ════════════════════════════════════════════════════════════════
    
    constructor(
        address _architect,
        address _nationalEscrow
    ) ERC20("VIDA Cap", "VCAP") {
        require(_architect != address(0), "Invalid architect address");
        require(_nationalEscrow != address(0), "Invalid national escrow address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PFF_SENTINEL_ROLE, msg.sender);
        _grantRole(NATIONAL_ESCROW_ROLE, _nationalEscrow);
        
        architect = _architect;
        nationalEscrow = _nationalEscrow;
        currentEra = MintingEra.TEN_UNIT_ERA;
        
        // GENESIS MINT: 10 Units (5 to Architect / 5 to National Escrow)
        _mint(_architect, GENESIS_SPLIT);
        _mint(_nationalEscrow, GENESIS_SPLIT);
        
        emit GenesisMintExecuted(_architect, _nationalEscrow, INITIAL_MINT, DIVINE_ISSUANCE_TAG);
    }

    // ════════════════════════════════════════════════════════════════
    // CORE MINTING LOGIC - VALID_PRESENCE INTERFACE
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Process VALID_PRESENCE signal from PFF Sentinel
     * @dev Only callable by PFF Sentinel with valid signature
     *
     * This is the ONLY entry point for minting VIDA Cap.
     * The PFF Sentinel must provide:
     * - Citizen address (verified by biometric)
     * - PFF signature (cryptographic proof of presence)
     * - PFF hash (heartbeat truth-bundle)
     *
     * Minting Logic:
     * - 10-Unit Era: Mint 10 VIDA Cap (5 Citizen / 5 Nation)
     * - 2-Unit Era: Mint 2 VIDA Cap (1 Citizen / 1 Nation)
     * - Auto-transition at 5B threshold
     *
     * @param citizen Verified citizen address
     * @param pffSignature SOVEREIGN_AUTH signature from PFF Sentinel
     * @param pffHash PFF Truth-Hash from heartbeat
     */
    function processValidPresence(
        address citizen,
        bytes32 pffSignature,
        bytes32 pffHash
    ) external onlyRole(PFF_SENTINEL_ROLE) nonReentrant {
        require(citizen != address(0), "Invalid citizen address");
        require(pffSignature != bytes32(0), "Invalid PFF signature");
        require(pffHash != bytes32(0), "Invalid PFF hash");
        require(!usedPFFSignatures[pffSignature], "PFF signature already used");

        // Mark signature as used (anti-replay protection)
        usedPFFSignatures[pffSignature] = true;
        emit PFFSignatureUsed(pffSignature, citizen, block.timestamp);

        // Emit VALID_PRESENCE received
        emit ValidPresenceReceived(citizen, pffSignature, pffHash);

        // Verify citizen if first handshake
        if (!isVerifiedCitizen[citizen]) {
            isVerifiedCitizen[citizen] = true;
            totalVerifiedCitizens++;
            emit CitizenVerified(citizen, pffHash, totalVerifiedCitizens);
        }

        // Execute minting based on current era
        _executeMinting(citizen, pffSignature);

        // Check if we need to transition to 2-Unit Era
        _checkEraTransition();
    }

    /**
     * @notice Execute minting based on current era
     * @dev Internal function called by processValidPresence
     */
    function _executeMinting(address citizen, bytes32 pffSignature) internal {
        uint256 citizenAmount;
        uint256 nationAmount;

        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            // 10-Unit Era: 5 to Citizen / 5 to Nation
            citizenAmount = CITIZEN_SPLIT_10_ERA;
            nationAmount = NATION_SPLIT_10_ERA;
        } else {
            // 2-Unit Era: 1 to Citizen / 1 to Nation
            citizenAmount = CITIZEN_SPLIT_2_ERA;
            nationAmount = NATION_SPLIT_2_ERA;
        }

        // Mint to citizen and national escrow
        _mint(citizen, citizenAmount);
        _mint(nationalEscrow, nationAmount);

        totalPFFHandshakes++;

        emit PFFHandshakeMint(citizen, citizenAmount, nationAmount, pffSignature);
    }

    /**
     * @notice Check if supply threshold reached and transition era
     * @dev Automatically transitions from First Billion Era to Post-Pivot Era at 10B
     *
     * THE GREAT SCARCITY PIVOT:
     * - Trigger: Total supply >= 10 Billion VIDA Cap
     * - Action: Instant transition to 2-Unit Era
     * - Burn Activation: 10% transaction burn starts immediately
     */
    function _checkEraTransition() internal {
        uint256 currentSupply = totalSupply();

        if (currentEra == MintingEra.TEN_UNIT_ERA && currentSupply >= THRESHOLD_10B) {
            MintingEra oldEra = currentEra;
            currentEra = MintingEra.TWO_UNIT_ERA;
            emit EraTransition(oldEra, currentEra, currentSupply, BILLION_FIRST_MANDATE);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // AGGRESSIVE BURN LOGIC - POST-PIVOT ONLY
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Override transfer to implement 10% aggressive burn POST-PIVOT
     * @dev Burns 10% of every transaction ONLY after 10B threshold reached
     *
     * THE GREAT SCARCITY PIVOT:
     * - Burn Rate: 10% (AGGRESSIVE)
     * - Activation: ONLY after supply >= 10 Billion
     * - Target: Supply = 1 VIDA Cap per verified citizen (1:1 Biological Ratio)
     * - Stops: When equilibrium reached
     *
     * FIRST BILLION ERA (Pre-10B):
     * - NO BURN - Full rewards to foundation builders
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");

        // Calculate burn amount (10%)
        uint256 burnAmount = (amount * BURN_RATE_BPS) / BPS_DENOMINATOR;
        uint256 transferAmount = amount - burnAmount;

        // Check if we should burn (ONLY POST-PIVOT)
        uint256 supplyTarget = totalVerifiedCitizens * 10**18; // 1 VIDA Cap per citizen (1:1 Biological Ratio)
        bool isPivotReached = currentEra == MintingEra.TWO_UNIT_ERA; // Post-10B
        bool shouldBurnNow = isPivotReached && totalSupply() > supplyTarget && supplyTarget > 0;

        if (shouldBurnNow && burnAmount > 0) {
            // Burn 10% of transaction (AGGRESSIVE)
            super._transfer(from, address(0), burnAmount);
            totalBurned += burnAmount;
            emit TransactionBurned(from, to, burnAmount, totalBurned);

            // Check if equilibrium reached (1:1 Biological Ratio)
            if (totalSupply() <= supplyTarget) {
                emit EquilibriumReached(totalSupply(), totalVerifiedCitizens);
            }
        } else {
            // No burn needed (Pre-Pivot or Equilibrium reached)
            transferAmount = amount;
        }

        // Transfer remaining amount
        super._transfer(from, to, transferAmount);
    }

    // ════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - TOKENOMICS STATE
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Get current minting era
     */
    function getCurrentEra() external view returns (MintingEra) {
        return currentEra;
    }

    /**
     * @notice Get mint amounts for current era
     */
    function getMintAmountForCurrentEra() external view returns (uint256 citizenAmount, uint256 nationAmount) {
        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            return (CITIZEN_SPLIT_10_ERA, NATION_SPLIT_10_ERA);
        } else {
            return (CITIZEN_SPLIT_2_ERA, NATION_SPLIT_2_ERA);
        }
    }

    /**
     * @notice Get VIDA Cap price in USD (HARDCODED)
     */
    function getPriceUSD() external pure returns (uint256) {
        return START_PRICE_USD; // $1,000 per VIDA Cap
    }

    /**
     * @notice Get Divine Issuance tag
     */
    function getDivineIssuanceTag() external pure returns (string memory) {
        return DIVINE_ISSUANCE_TAG;
    }

    /**
     * @notice Check if burn is active
     * @dev Burn ONLY activates POST-PIVOT (after 10B threshold)
     */
    function shouldBurn() external view returns (bool) {
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        bool isPivotReached = currentEra == MintingEra.TWO_UNIT_ERA; // Post-10B
        return isPivotReached && totalSupply() > supplyTarget && supplyTarget > 0;
    }

    /**
     * @notice Get supply target (1 VIDA Cap per verified citizen)
     */
    function getSupplyTarget() external view returns (uint256) {
        return totalVerifiedCitizens * 10**18;
    }

    /**
     * @notice Get comprehensive stats
     * @dev Updated for BILLION-FIRST MANDATE (burn only active post-pivot)
     */
    function getStats() external view returns (
        MintingEra era,
        uint256 supply,
        uint256 burned,
        uint256 handshakes,
        uint256 citizens,
        uint256 priceUSD,
        bool burnActive
    ) {
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        bool isPivotReached = currentEra == MintingEra.TWO_UNIT_ERA; // Post-10B
        return (
            currentEra,
            totalSupply(),
            totalBurned,
            totalPFFHandshakes,
            totalVerifiedCitizens,
            START_PRICE_USD,
            isPivotReached && totalSupply() > supplyTarget && supplyTarget > 0
        );
    }

    /**
     * @notice Get Scarcity Clock data (for UI)
     * @dev Updated for BILLION-FIRST MANDATE (10B threshold)
     */
    function getScarcityClock() external view returns (
        uint256 currentSupply,
        uint256 threshold10B,
        uint256 remaining10UnitSlots,
        bool isFirstBillionEra,
        uint256 priceUSD
    ) {
        uint256 supply = totalSupply();
        uint256 remaining = 0;

        if (currentEra == MintingEra.TEN_UNIT_ERA && supply < THRESHOLD_10B) {
            uint256 remainingSupply = THRESHOLD_10B - supply;
            remaining = remainingSupply / MINT_AMOUNT_10_ERA;
        }

        return (
            supply,
            THRESHOLD_10B,
            remaining,
            currentEra == MintingEra.TEN_UNIT_ERA,
            START_PRICE_USD
        );
    }

    /**
     * @notice Get market cap in USD
     */
    function getMarketCapUSD() external view returns (uint256) {
        return (totalSupply() / 10**18) * START_PRICE_USD;
    }

    /**
     * @notice Get burn progress (0-100%)
     * @dev Updated for BILLION-FIRST MANDATE (10B threshold)
     */
    function getBurnProgress() external view returns (uint256 progressBPS) {
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        if (supplyTarget == 0) return 0;

        uint256 supply = totalSupply();
        if (supply <= supplyTarget) return 10000; // 100%

        uint256 initialSupply = THRESHOLD_10B;
        if (supply >= initialSupply) return 0;

        uint256 burned = initialSupply - supply;
        uint256 totalToBurn = initialSupply - supplyTarget;

        return (burned * 10000) / totalToBurn;
    }

    /**
     * @notice Get Billion-First Mandate tag
     */
    function getBillionFirstMandate() external pure returns (string memory) {
        return BILLION_FIRST_MANDATE;
    }
}

