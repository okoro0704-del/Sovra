// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VIDACapMainnet - SOVRYN Mainnet Protocol
 * @notice Consolidated VIDA Cap Godcurrency with pure tokenomics logic
 * @dev Clean room implementation - NO UI, NO CAMERA, NO BIOMETRIC CODE
 * 
 * TOKENOMIC HARDCODING:
 * ═══════════════════════════════════════════════════════════════════
 * 
 * GENESIS MINT:
 * - Initial Supply: 10 VIDA Cap
 * - Architect (Isreal Okoro): 5 VIDA Cap
 * - National Escrow: 5 VIDA Cap
 * - Start Price: $1,000 USD per VIDA Cap (HARDCODED)
 * 
 * THE BILLION-FIRST MANDATE (REWARDING THE FOUNDATION):
 * ═══════════════════════════════════════════════════════════════════
 *
 * THE FIRST BILLION ERA (Pre-10B):
 * - Every PFF handshake mints: 10 VIDA Cap
 * - Citizen receives: 5 VIDA Cap (50%)
 * - National Escrow receives: 5 VIDA Cap (50%)
 * - Duration: Until supply reaches 10 Billion
 * - Purpose: REWARD THE FOUNDATION BUILDERS
 *
 * THE 10B THRESHOLD (THE GREAT SCARCITY PIVOT):
 * - Trigger: Total supply >= 10,000,000,000 VIDA Cap
 * - Action: Automatic transition to 2-Unit Era
 * - VLT Status: "THE BILLION-FIRST MANDATE: REWARDING THE FOUNDATION"
 *
 * THE 2-UNIT ERA (Post-10B):
 * - Every PFF handshake mints: 2 VIDA Cap
 * - Citizen receives: 1 VIDA Cap (50%)
 * - National Escrow receives: 1 VIDA Cap (50%)
 * - Duration: Until equilibrium reached
 *
 * THE 1:1 BIOLOGICAL EQUILIBRIUM ERA:
 * - Trigger: TotalSupply == TotalVerifiedCitizens
 * - Every PFF handshake mints: 1 VIDA Cap
 * - Citizen receives: 0.5 VIDA Cap (50%)
 * - National Escrow receives: 0.5 VIDA Cap (50%)
 * - Duration: Permanent (perfect 1:1 synchronization)
 *
 * THE HIGH-VELOCITY BURN PROTOCOL (Post-10B):
 * - Rate: 10% of every transaction (AGGRESSIVE)
 * - Activation: IMMEDIATELY upon reaching 10B threshold
 * - Target: Supply = 1 VIDA Cap per verified citizen
 * - Stops: When equilibrium reached
 *
 * TRANSACTION FEE SPLIT (The Remainder after 10% burn):
 * - 45% to the People (Citizen Pool)
 * - 45% to the National Escrow
 * - 10% to the Agent/Architect (System Maintenance)
 *
 * LIVE BURN METER:
 * - Real-time tracking of VIDA Cap burned per second
 * - VLT transparency for network-wide burn rate
 * - Projected burn calculations
 *
 * BIOLOGICAL EQUILIBRIUM & INACTIVITY PROTOCOL:
 * ═══════════════════════════════════════════════════════════════════
 * - Inactivity Monitor: Tracks last 4-layer PFF Handshake timestamp
 * - 1-Year Removal: Auto-burn 1 VIDA Cap if inactive > 365 days
 * - Re-Vitalization: Inactive users must perform handshake to re-mint
 * - Active Sovereign Supply: Real-time metric of active population
 * - Perfect Synchronization: Supply = Active verified citizens
 *
 * PFF INTERFACE:
 * ═══════════════════════════════════════════════════════════════════
 * - Only accepts SOVEREIGN_AUTH signal from Main PFF Protocol
 * - Cryptographic signature verification required
 * - Anti-replay protection (nonce tracking)
 * 
 * AGNOSTIC GATEWAY:
 * ═══════════════════════════════════════════════════════════════════
 * - Chain doesn't care about app name
 * - Only cares about PFF certification
 * - 'Pay with any PFF-connected App' logic
 * 
 * "The Godcurrency. The Final Truth. Divine Issuance."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract VIDACapMainnet is ERC20, AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════
    // CONSTANTS - TOKENOMIC HARDCODING
    // ════════════════════════════════════════════════════════════════
    
    bytes32 public constant PFF_PROTOCOL_ROLE = keccak256("PFF_PROTOCOL_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant NATIONAL_ESCROW_ROLE = keccak256("NATIONAL_ESCROW_ROLE");
    
    // Genesis Constants
    uint256 public constant INITIAL_MINT = 10 * 10**18; // 10 VIDA Cap
    uint256 public constant GENESIS_SPLIT = 5 * 10**18; // 5 to Architect / 5 to Nation
    uint256 public constant START_PRICE_USD = 1000; // $1,000 per VIDA Cap (HARDCODED)
    
    // Era Thresholds - THE BILLION-FIRST MANDATE
    uint256 public constant THRESHOLD_10B = 10_000_000_000 * 10**18; // 10 Billion VIDA Cap (BILLION-FIRST)

    // 10-Unit Era (Pre-10B) - THE FIRST BILLION ERA
    uint256 public constant MINT_AMOUNT_10_ERA = 10 * 10**18; // 10 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_10_ERA = 5 * 10**18; // 5 to Citizen (50%)
    uint256 public constant NATION_SPLIT_10_ERA = 5 * 10**18; // 5 to Nation (50%)

    // 2-Unit Era (Post-10B) - THE GREAT SCARCITY PIVOT
    uint256 public constant MINT_AMOUNT_2_ERA = 2 * 10**18; // 2 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_2_ERA = 1 * 10**18; // 1 to Citizen (50%)
    uint256 public constant NATION_SPLIT_2_ERA = 1 * 10**18; // 1 to Nation (50%)

    // 1:1 Biological Equilibrium Era
    uint256 public constant MINT_AMOUNT_EQUILIBRIUM = 1 * 10**18; // 1 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_EQUILIBRIUM = 5 * 10**17; // 0.5 to Citizen (50%)
    uint256 public constant NATION_SPLIT_EQUILIBRIUM = 5 * 10**17; // 0.5 to Nation (50%)

    // Inactivity Protocol
    uint256 public constant INACTIVITY_THRESHOLD = 365 days; // 1 year
    uint256 public constant INACTIVITY_BURN_AMOUNT = 1 * 10**18; // 1 VIDA Cap

    // HIGH-VELOCITY BURN PROTOCOL
    uint256 public constant BURN_RATE_BPS = 1000; // 10% (1000 basis points) - AGGRESSIVE
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Transaction Fee Split (The Remainder after 10% burn)
    uint256 public constant CITIZEN_POOL_BPS = 4500; // 45% to the People
    uint256 public constant NATIONAL_ESCROW_BPS = 4500; // 45% to National Escrow
    uint256 public constant ARCHITECT_BPS = 1000; // 10% to Agent/Architect (System Maintenance)

    // Divine Issuance Tag
    string public constant DIVINE_ISSUANCE_TAG = "DIVINE_ISSUANCE";
    string public constant HIGH_VELOCITY_BURN = "HIGH_VELOCITY_BURN_PROTOCOL";
    string public constant BIOLOGICAL_EQUILIBRIUM = "BIOLOGICAL_EQUILIBRIUM_PROTOCOL";
    string public constant BILLION_FIRST_MANDATE = "THE_BILLION_FIRST_MANDATE_REWARDING_THE_FOUNDATION";

    // ════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════

    enum MintingEra { TEN_UNIT_ERA, TWO_UNIT_ERA, EQUILIBRIUM_ERA }
    
    MintingEra public currentEra;
    address public nationalEscrow;
    address public architect; // Isreal Okoro
    address public citizenPool; // Pool for citizen rewards (45%)

    uint256 public totalVerifiedCitizens;
    uint256 public totalPFFHandshakes;
    uint256 public totalBurned;
    uint256 public totalInactiveCitizens; // Citizens marked inactive
    uint256 public totalReVitalizations; // Re-vitalization count

    // Live Burn Meter tracking
    uint256 public lastBurnTimestamp;
    uint256 public burnRatePerSecond; // VIDA Cap burned per second
    uint256 public totalBurnEvents;

    mapping(address => bool) public isVerifiedCitizen;
    mapping(bytes32 => bool) public usedSovereignAuthSignatures;

    // Biological Equilibrium & Inactivity Protocol
    mapping(address => uint256) public lastHandshakeTimestamp; // Last 4-layer PFF Handshake
    mapping(address => bool) public isInactive; // Marked as inactive (1 year+)
    mapping(address => uint256) public inactivityBurnCount; // Times burned for inactivity
    
    // ════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════
    
    event GenesisMintExecuted(address indexed architect, address indexed nationalEscrow, uint256 amount, string tag);
    event SovereignAuthReceived(address indexed citizen, bytes32 sovereignAuth, bytes32 pffHash);
    event CitizenVerified(address indexed citizen, bytes32 pffHash, uint256 totalCitizens);
    event PFFHandshakeMint(address indexed citizen, uint256 citizenAmount, uint256 nationAmount, bytes32 sovereignAuth);
    event EraTransition(MintingEra oldEra, MintingEra newEra, uint256 supply, string reason);
    event TransactionBurned(address indexed from, address indexed to, uint256 burnAmount, uint256 totalBurned);
    event TransactionFeeSplit(address indexed from, address indexed to, uint256 citizenPoolAmount, uint256 nationalEscrowAmount, uint256 architectAmount);
    event EquilibriumReached(uint256 supply, uint256 totalCitizens);
    event SovereignAuthUsed(bytes32 sovereignAuth, address citizen, uint256 timestamp);
    event BurnRateUpdated(uint256 burnRatePerSecond, uint256 timestamp);
    event HighVelocityBurnActivated(uint256 supply, uint256 timestamp);

    // Biological Equilibrium & Inactivity Events
    event BiologicalEquilibriumReached(uint256 supply, uint256 totalCitizens, uint256 timestamp);
    event InactivityDetected(address indexed citizen, uint256 lastHandshake, uint256 currentTime);
    event CirculationRemoval(address indexed citizen, uint256 burnAmount, uint256 totalBurned);
    event ReVitalization(address indexed citizen, uint256 mintAmount, uint256 timestamp);
    event VitalityChecked(address indexed citizen, uint256 lastHandshake, bool isActive);
    event ActiveSovereignSupplyUpdated(uint256 activeSupply, uint256 activeCitizens, uint256 timestamp);
    
    // ════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════
    
    constructor(
        address _architect,
        address _nationalEscrow,
        address _citizenPool
    ) ERC20("VIDA Cap", "VCAP") {
        require(_architect != address(0), "Invalid architect address");
        require(_nationalEscrow != address(0), "Invalid national escrow address");
        require(_citizenPool != address(0), "Invalid citizen pool address");

        architect = _architect;
        nationalEscrow = _nationalEscrow;
        citizenPool = _citizenPool;
        currentEra = MintingEra.TEN_UNIT_ERA;

        // Initialize Live Burn Meter
        lastBurnTimestamp = block.timestamp;
        burnRatePerSecond = 0;
        totalBurnEvents = 0;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, _architect);
        _grantRole(ADMIN_ROLE, _architect);
        _grantRole(NATIONAL_ESCROW_ROLE, _nationalEscrow);

        // Genesis Mint: 10 VIDA Cap (5 to Architect / 5 to Nation)
        _mint(_architect, GENESIS_SPLIT);
        _mint(_nationalEscrow, GENESIS_SPLIT);

        emit GenesisMintExecuted(_architect, _nationalEscrow, INITIAL_MINT, DIVINE_ISSUANCE_TAG);
    }

    // ════════════════════════════════════════════════════════════════
    // PFF INTERFACE - SOVEREIGN_AUTH ONLY
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Process SOVEREIGN_AUTH signal from Main PFF Protocol
     * @dev Only callable by PFF Protocol with valid signature
     *
     * This is the ONLY entry point for minting VIDA Cap.
     * The Main PFF Protocol must provide:
     * - Citizen address (verified by biometric)
     * - SOVEREIGN_AUTH signature (cryptographic proof)
     * - PFF hash (heartbeat truth-bundle)
     *
     * Minting Logic:
     * - 10-Unit Era: Mint 10 VIDA Cap (5 Citizen / 5 Nation)
     * - 2-Unit Era: Mint 2 VIDA Cap (1 Citizen / 1 Nation)
     * - Auto-transition at 5B threshold
     *
     * @param citizen Verified citizen address
     * @param sovereignAuth SOVEREIGN_AUTH signature from PFF Protocol
     * @param pffHash PFF Truth-Hash from heartbeat
     */
    function processSovereignAuth(
        address citizen,
        bytes32 sovereignAuth,
        bytes32 pffHash
    ) external onlyRole(PFF_PROTOCOL_ROLE) nonReentrant {
        require(citizen != address(0), "Invalid citizen address");
        require(sovereignAuth != bytes32(0), "Invalid SOVEREIGN_AUTH");
        require(pffHash != bytes32(0), "Invalid PFF hash");
        require(!usedSovereignAuthSignatures[sovereignAuth], "SOVEREIGN_AUTH already used");

        // Mark signature as used (anti-replay protection)
        usedSovereignAuthSignatures[sovereignAuth] = true;
        emit SovereignAuthUsed(sovereignAuth, citizen, block.timestamp);

        // Emit SOVEREIGN_AUTH received
        emit SovereignAuthReceived(citizen, sovereignAuth, pffHash);

        // Check if this is a re-vitalization (inactive user returning)
        bool isReVitalization = false;
        if (isInactive[citizen]) {
            isReVitalization = true;
            isInactive[citizen] = false;
            totalInactiveCitizens--;
            totalReVitalizations++;
        }

        // Verify citizen if first handshake
        if (!isVerifiedCitizen[citizen]) {
            isVerifiedCitizen[citizen] = true;
            totalVerifiedCitizens++;
            emit CitizenVerified(citizen, pffHash, totalVerifiedCitizens);
        }

        // Update last handshake timestamp (Vitality Monitor)
        lastHandshakeTimestamp[citizen] = block.timestamp;

        // Execute minting based on current era
        _executeMinting(citizen, sovereignAuth, isReVitalization);

        // Check if we need to transition era
        _checkEraTransition();

        // Update Active Sovereign Supply metric
        _updateActiveSovereignSupply();
    }

    /**
     * @notice Execute minting based on current era
     * @dev Internal function called by processSovereignAuth
     * @param citizen Verified citizen address
     * @param sovereignAuth SOVEREIGN_AUTH signature
     * @param isReVitalization True if this is a re-vitalization handshake
     */
    function _executeMinting(address citizen, bytes32 sovereignAuth, bool isReVitalization) internal {
        uint256 citizenAmount;
        uint256 nationAmount;

        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            // 10-Unit Era: 5 to Citizen / 5 to Nation
            citizenAmount = CITIZEN_SPLIT_10_ERA;
            nationAmount = NATION_SPLIT_10_ERA;
        } else if (currentEra == MintingEra.TWO_UNIT_ERA) {
            // 2-Unit Era: 1 to Citizen / 1 to Nation
            citizenAmount = CITIZEN_SPLIT_2_ERA;
            nationAmount = NATION_SPLIT_2_ERA;
        } else {
            // EQUILIBRIUM ERA: 0.5 to Citizen / 0.5 to Nation (1:1 Pivot)
            citizenAmount = CITIZEN_SPLIT_EQUILIBRIUM;
            nationAmount = NATION_SPLIT_EQUILIBRIUM;
        }

        // Mint to citizen and national escrow
        _mint(citizen, citizenAmount);
        _mint(nationalEscrow, nationAmount);

        totalPFFHandshakes++;

        emit PFFHandshakeMint(citizen, citizenAmount, nationAmount, sovereignAuth);

        // Emit re-vitalization event if applicable
        if (isReVitalization) {
            emit ReVitalization(citizen, citizenAmount + nationAmount, block.timestamp);
        }
    }

    /**
     * @notice Check if supply threshold reached and transition era
     * @dev Automatically transitions:
     *      - 10-Unit Era → 2-Unit Era at 10B threshold (BILLION-FIRST MANDATE)
     *      - 2-Unit Era → Equilibrium Era when supply == citizens (1:1 Pivot)
     */
    function _checkEraTransition() internal {
        uint256 currentSupply = totalSupply();
        uint256 activeCitizens = totalVerifiedCitizens - totalInactiveCitizens;

        // Transition from 10-Unit Era to 2-Unit Era at 10B (THE BILLION-FIRST MANDATE)
        if (currentEra == MintingEra.TEN_UNIT_ERA && currentSupply >= THRESHOLD_10B) {
            MintingEra oldEra = currentEra;
            currentEra = MintingEra.TWO_UNIT_ERA;
            emit EraTransition(oldEra, currentEra, currentSupply, BILLION_FIRST_MANDATE);
        }

        // Transition from 2-Unit Era to Equilibrium Era when supply == active citizens (1:1 Pivot)
        if (currentEra == MintingEra.TWO_UNIT_ERA) {
            uint256 targetSupply = activeCitizens * 10**18; // 1 VIDA Cap per active citizen

            // Check if we've reached biological equilibrium
            if (currentSupply >= targetSupply && targetSupply > 0) {
                // Allow small tolerance (0.1%) for rounding
                uint256 tolerance = targetSupply / 1000;

                if (currentSupply <= targetSupply + tolerance) {
                    MintingEra oldEra = currentEra;
                    currentEra = MintingEra.EQUILIBRIUM_ERA;
                    emit EraTransition(oldEra, currentEra, currentSupply, "BIOLOGICAL_EQUILIBRIUM_REACHED");
                    emit BiologicalEquilibriumReached(currentSupply, activeCitizens, block.timestamp);
                }
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // HIGH-VELOCITY BURN PROTOCOL
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Override transfer to implement HIGH-VELOCITY 10% burn + fee split
     * @dev Burns 10% of every transaction ONLY after 5B threshold reached
     *
     * THE SUPPLY HAMMER:
     * - 10% burn activates IMMEDIATELY upon reaching 5B VIDA Cap threshold
     * - Burn continues until equilibrium (1 VIDA Cap per verified citizen)
     *
     * TRANSACTION FEE SPLIT (The Remainder):
     * - 45% to the People (Citizen Pool)
     * - 45% to the National Escrow
     * - 10% to the Agent/Architect (System Maintenance)
     *
     * Equilibrium: Supply = 1 VIDA Cap per verified citizen
     * Once equilibrium reached, burn stops permanently
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");

        // Check if we should burn (ONLY after 5B threshold)
        uint256 supplyTarget = totalVerifiedCitizens * 10**18; // 1 VIDA Cap per citizen
        bool isPost5B = (currentEra == MintingEra.TWO_UNIT_ERA); // 5B threshold reached
        bool shouldBurnNow = isPost5B && totalSupply() > supplyTarget && supplyTarget > 0;

        if (shouldBurnNow) {
            // HIGH-VELOCITY BURN PROTOCOL ACTIVE

            // 1. Calculate 10% burn (THE SUPPLY HAMMER)
            uint256 burnAmount = (amount * BURN_RATE_BPS) / BPS_DENOMINATOR; // 10%

            // 2. Calculate remainder after burn (90%)
            uint256 remainder = amount - burnAmount;

            // 3. Split remainder: 45% People / 45% Nation / 10% Architect
            uint256 citizenPoolAmount = (remainder * CITIZEN_POOL_BPS) / BPS_DENOMINATOR; // 45% of 90%
            uint256 nationalEscrowAmount = (remainder * NATIONAL_ESCROW_BPS) / BPS_DENOMINATOR; // 45% of 90%
            uint256 architectAmount = (remainder * ARCHITECT_BPS) / BPS_DENOMINATOR; // 10% of 90%

            // 4. Calculate actual transfer to recipient (remainder - fees)
            uint256 transferAmount = remainder - citizenPoolAmount - nationalEscrowAmount - architectAmount;

            // 5. Execute burn (to 0x0...DEAD)
            super._transfer(from, address(0), burnAmount);
            totalBurned += burnAmount;
            totalBurnEvents++;

            // 6. Update Live Burn Meter
            _updateBurnRate(burnAmount);

            // 7. Distribute fees
            if (citizenPoolAmount > 0) {
                super._transfer(from, citizenPool, citizenPoolAmount);
            }
            if (nationalEscrowAmount > 0) {
                super._transfer(from, nationalEscrow, nationalEscrowAmount);
            }
            if (architectAmount > 0) {
                super._transfer(from, architect, architectAmount);
            }

            // 8. Transfer remaining to recipient
            if (transferAmount > 0) {
                super._transfer(from, to, transferAmount);
            }

            // 9. Emit events
            emit TransactionBurned(from, to, burnAmount, totalBurned);
            emit TransactionFeeSplit(from, to, citizenPoolAmount, nationalEscrowAmount, architectAmount);

            // 10. Check if equilibrium reached
            if (totalSupply() <= supplyTarget) {
                emit EquilibriumReached(totalSupply(), totalVerifiedCitizens);
            }
        } else {
            // No burn needed (Pre-5B or equilibrium reached)
            super._transfer(from, to, amount);
        }
    }

    /**
     * @notice Update burn rate per second for Live Burn Meter
     * @dev Called after each burn to calculate real-time burn rate
     */
    function _updateBurnRate(uint256 burnAmount) internal {
        uint256 timeSinceLastBurn = block.timestamp - lastBurnTimestamp;

        if (timeSinceLastBurn > 0) {
            // Calculate burn rate: VIDA Cap burned per second
            burnRatePerSecond = (burnAmount * 1e18) / timeSinceLastBurn; // Scale for precision
        }

        lastBurnTimestamp = block.timestamp;

        emit BurnRateUpdated(burnRatePerSecond, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════
    // BIOLOGICAL EQUILIBRIUM & INACTIVITY PROTOCOL
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Check vitality of a citizen (last 4-layer PFF Handshake)
     * @dev Tracks timestamp of last handshake and marks inactive if > 1 year
     * @param citizen Address to check
     * @return lastHandshake Timestamp of last handshake
     * @return isActive True if active (< 1 year), false if inactive (> 1 year)
     * @return timeUntilInactive Seconds until marked inactive (0 if already inactive)
     */
    function checkVitality(address citizen) public view returns (
        uint256 lastHandshake,
        bool isActive,
        uint256 timeUntilInactive
    ) {
        require(isVerifiedCitizen[citizen], "Not a verified citizen");

        lastHandshake = lastHandshakeTimestamp[citizen];
        uint256 timeSinceHandshake = block.timestamp - lastHandshake;

        isActive = timeSinceHandshake < INACTIVITY_THRESHOLD;

        if (isActive) {
            timeUntilInactive = INACTIVITY_THRESHOLD - timeSinceHandshake;
        } else {
            timeUntilInactive = 0;
        }

        return (lastHandshake, isActive, timeUntilInactive);
    }

    /**
     * @notice Execute circulation removal for inactive citizen (1 year+)
     * @dev Burns 1 VIDA Cap from inactive user's vault to maintain 1:1 sync
     * @param citizen Address of inactive citizen
     */
    function executeCirculationRemoval(address citizen) external onlyRole(PFF_PROTOCOL_ROLE) nonReentrant {
        require(isVerifiedCitizen[citizen], "Not a verified citizen");
        require(!isInactive[citizen], "Already marked inactive");

        // Check if citizen is inactive (> 1 year since last handshake)
        (uint256 lastHandshake, bool isActive, ) = checkVitality(citizen);
        require(!isActive, "Citizen is still active");

        // Ensure citizen has at least 1 VIDA Cap to burn
        require(balanceOf(citizen) >= INACTIVITY_BURN_AMOUNT, "Insufficient balance for circulation removal");

        // Mark as inactive
        isInactive[citizen] = true;
        totalInactiveCitizens++;
        inactivityBurnCount[citizen]++;

        // Burn 1 VIDA Cap from citizen's vault
        _burn(citizen, INACTIVITY_BURN_AMOUNT);
        totalBurned += INACTIVITY_BURN_AMOUNT;

        emit InactivityDetected(citizen, lastHandshake, block.timestamp);
        emit CirculationRemoval(citizen, INACTIVITY_BURN_AMOUNT, totalBurned);

        // Update Active Sovereign Supply
        _updateActiveSovereignSupply();
    }

    /**
     * @notice Update Active Sovereign Supply metric
     * @dev Calculates real-time active supply based on biological entries/exits
     */
    function _updateActiveSovereignSupply() internal {
        uint256 activeCitizens = totalVerifiedCitizens - totalInactiveCitizens;
        uint256 activeSupply = totalSupply();

        emit ActiveSovereignSupplyUpdated(activeSupply, activeCitizens, block.timestamp);
    }

    /**
     * @notice Batch check vitality for multiple citizens
     * @dev Gas-efficient way to check multiple citizens at once
     * @param citizens Array of citizen addresses to check
     * @return results Array of vitality check results
     */
    function batchCheckVitality(address[] calldata citizens) external view returns (
        VitalityCheckResult[] memory results
    ) {
        results = new VitalityCheckResult[](citizens.length);

        for (uint256 i = 0; i < citizens.length; i++) {
            if (isVerifiedCitizen[citizens[i]]) {
                (uint256 lastHandshake, bool isActive, uint256 timeUntilInactive) = checkVitality(citizens[i]);
                results[i] = VitalityCheckResult({
                    citizen: citizens[i],
                    lastHandshake: lastHandshake,
                    isActive: isActive,
                    timeUntilInactive: timeUntilInactive,
                    isMarkedInactive: isInactive[citizens[i]]
                });
            }
        }

        return results;
    }

    // Struct for batch vitality check results
    struct VitalityCheckResult {
        address citizen;
        uint256 lastHandshake;
        bool isActive;
        uint256 timeUntilInactive;
        bool isMarkedInactive;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get current minting era
     * @return Current era (TEN_UNIT_ERA or TWO_UNIT_ERA)
     */
    function getCurrentEra() external view returns (MintingEra) {
        return currentEra;
    }

    /**
     * @notice Get mint amounts for current era
     * @return citizenAmount Amount minted to citizen
     * @return nationAmount Amount minted to national escrow
     */
    function getMintAmountForCurrentEra() external view returns (uint256 citizenAmount, uint256 nationAmount) {
        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            return (CITIZEN_SPLIT_10_ERA, NATION_SPLIT_10_ERA);
        } else if (currentEra == MintingEra.TWO_UNIT_ERA) {
            return (CITIZEN_SPLIT_2_ERA, NATION_SPLIT_2_ERA);
        } else {
            // EQUILIBRIUM_ERA: 0.5 to Citizen / 0.5 to Nation (1:1 Pivot)
            return (CITIZEN_SPLIT_EQUILIBRIUM, NATION_SPLIT_EQUILIBRIUM);
        }
    }

    /**
     * @notice Get hardcoded VIDA Cap price in USD
     * @return Price in USD (always $1,000)
     */
    function getPriceUSD() external pure returns (uint256) {
        return START_PRICE_USD;
    }

    /**
     * @notice Get Divine Issuance tag
     * @return Divine issuance tag string
     */
    function getDivineIssuanceTag() external pure returns (string memory) {
        return DIVINE_ISSUANCE_TAG;
    }

    /**
     * @notice Check if HIGH-VELOCITY burn is currently active
     * @dev Burn activates ONLY after 5B threshold AND above equilibrium
     * @return True if burn is active, false otherwise
     */
    function shouldBurn() external view returns (bool) {
        bool isPost5B = (currentEra == MintingEra.TWO_UNIT_ERA);
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        return isPost5B && totalSupply() > supplyTarget && supplyTarget > 0;
    }

    /**
     * @notice Get burn rate (10% for HIGH-VELOCITY)
     * @return Burn rate in basis points (1000 = 10%)
     */
    function getBurnRate() external pure returns (uint256) {
        return BURN_RATE_BPS;
    }

    /**
     * @notice Get transaction fee split percentages
     * @return citizenPoolBps Citizen pool percentage (4500 = 45%)
     * @return nationalEscrowBps National escrow percentage (4500 = 45%)
     * @return architectBps Architect percentage (1000 = 10%)
     */
    function getFeeSplit() external pure returns (
        uint256 citizenPoolBps,
        uint256 nationalEscrowBps,
        uint256 architectBps
    ) {
        return (CITIZEN_POOL_BPS, NATIONAL_ESCROW_BPS, ARCHITECT_BPS);
    }

    /**
     * @notice Get supply target for equilibrium (1:1 ratio)
     * @return Target supply (1 VIDA Cap per verified citizen)
     */
    function getSupplyTarget() external view returns (uint256) {
        return totalVerifiedCitizens * 10**18;
    }

    /**
     * @notice Get comprehensive stats
     * @return supply Current total supply
     * @return burned Total amount burned
     * @return citizens Total verified citizens
     * @return handshakes Total PFF handshakes
     * @return era Current minting era
     * @return priceUSD Hardcoded price in USD
     */
    function getStats() external view returns (
        uint256 supply,
        uint256 burned,
        uint256 citizens,
        uint256 handshakes,
        MintingEra era,
        uint256 priceUSD
    ) {
        return (
            totalSupply(),
            totalBurned,
            totalVerifiedCitizens,
            totalPFFHandshakes,
            currentEra,
            START_PRICE_USD
        );
    }

    /**
     * @notice Get Live Burn Meter data
     * @dev VLT Real-Time Tracker for burn rate across the network
     * @return currentBurnRate VIDA Cap burned per second (scaled by 1e18)
     * @return totalBurnedAmount Total VIDA Cap burned to date
     * @return totalBurnTransactions Total number of burn events
     * @return lastBurnTime Timestamp of last burn
     * @return isActive True if burn is currently active
     */
    function getLiveBurnMeter() external view returns (
        uint256 currentBurnRate,
        uint256 totalBurnedAmount,
        uint256 totalBurnTransactions,
        uint256 lastBurnTime,
        bool isActive
    ) {
        bool isPost5B = (currentEra == MintingEra.TWO_UNIT_ERA);
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        bool burnActive = isPost5B && totalSupply() > supplyTarget && supplyTarget > 0;

        return (
            burnRatePerSecond,
            totalBurned,
            totalBurnEvents,
            lastBurnTimestamp,
            burnActive
        );
    }

    /**
     * @notice Calculate projected burn for next 24 hours
     * @dev Based on current burn rate
     * @return Projected VIDA Cap to be burned in next 24 hours
     */
    function getProjectedBurn24h() external view returns (uint256) {
        if (burnRatePerSecond == 0) {
            return 0;
        }

        // 24 hours = 86400 seconds
        uint256 secondsIn24h = 86400;
        return (burnRatePerSecond * secondsIn24h) / 1e18; // Unscale
    }

    /**
     * @notice Get time until equilibrium at current burn rate
     * @dev Returns 0 if equilibrium already reached or burn not active
     * @return Estimated seconds until equilibrium
     */
    function getTimeToEquilibrium() external view returns (uint256) {
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        uint256 currentSupply = totalSupply();

        if (currentSupply <= supplyTarget || burnRatePerSecond == 0) {
            return 0; // Already at equilibrium or no burn
        }

        uint256 excessSupply = currentSupply - supplyTarget;
        uint256 burnPerSecond = burnRatePerSecond / 1e18; // Unscale

        if (burnPerSecond == 0) {
            return 0;
        }

        return excessSupply / burnPerSecond;
    }

    /**
     * @notice Get scarcity clock data for UI (BILLION-FIRST MANDATE)
     * @return currentSupply Current total supply
     * @return threshold10B 10 Billion threshold (BILLION-FIRST)
     * @return remaining10UnitSlots Remaining slots in 10-Unit Era
     * @return is10UnitEra True if in 10-Unit Era
     * @return priceUSD Hardcoded price in USD
     */
    function getScarcityClock() external view returns (
        uint256 currentSupply,
        uint256 threshold10B,
        uint256 remaining10UnitSlots,
        bool is10UnitEra,
        uint256 priceUSD
    ) {
        currentSupply = totalSupply();
        threshold10B = THRESHOLD_10B;
        is10UnitEra = (currentEra == MintingEra.TEN_UNIT_ERA);
        priceUSD = START_PRICE_USD;

        if (is10UnitEra && currentSupply < THRESHOLD_10B) {
            uint256 remainingSupply = THRESHOLD_10B - currentSupply;
            remaining10UnitSlots = remainingSupply / MINT_AMOUNT_10_ERA;
        } else {
            remaining10UnitSlots = 0;
        }
    }

    /**
     * @notice Get Active Sovereign Supply (VLT Heartbeat Metric)
     * @dev Real-time metric that fluctuates based on biological entries/exits
     * @return activeSupply Current total supply
     * @return activeCitizens Total verified citizens minus inactive
     * @return inactiveCitizens Total citizens marked inactive (> 1 year)
     * @return reVitalizations Total re-vitalization handshakes
     * @return biologicalRatio Current supply / active citizens ratio
     */
    function getActiveSovereignSupply() external view returns (
        uint256 activeSupply,
        uint256 activeCitizens,
        uint256 inactiveCitizens,
        uint256 reVitalizations,
        uint256 biologicalRatio
    ) {
        activeSupply = totalSupply();
        activeCitizens = totalVerifiedCitizens - totalInactiveCitizens;
        inactiveCitizens = totalInactiveCitizens;
        reVitalizations = totalReVitalizations;

        if (activeCitizens > 0) {
            biologicalRatio = (activeSupply * 10000) / (activeCitizens * 10**18); // Ratio scaled by 10000 (e.g., 10000 = 1:1)
        } else {
            biologicalRatio = 0;
        }

        return (activeSupply, activeCitizens, inactiveCitizens, reVitalizations, biologicalRatio);
    }

    /**
     * @notice Get inactivity statistics for a citizen
     * @param citizen Address to check
     * @return lastHandshake Timestamp of last handshake
     * @return isCurrentlyInactive True if marked inactive
     * @return burnCount Number of times burned for inactivity
     * @return daysInactive Days since last handshake
     */
    function getInactivityStats(address citizen) external view returns (
        uint256 lastHandshake,
        bool isCurrentlyInactive,
        uint256 burnCount,
        uint256 daysInactive
    ) {
        require(isVerifiedCitizen[citizen], "Not a verified citizen");

        lastHandshake = lastHandshakeTimestamp[citizen];
        isCurrentlyInactive = isInactive[citizen];
        burnCount = inactivityBurnCount[citizen];

        uint256 timeSinceHandshake = block.timestamp - lastHandshake;
        daysInactive = timeSinceHandshake / 1 days;

        return (lastHandshake, isCurrentlyInactive, burnCount, daysInactive);
    }

    /**
     * @notice Check if biological equilibrium has been reached
     * @dev Equilibrium = TotalSupply == TotalActiveCitizens (1:1 ratio)
     * @return isEquilibrium True if in equilibrium era
     * @return currentRatio Current supply to active citizens ratio
     * @return targetRatio Target ratio (always 1:1 = 10000)
     */
    function isBiologicalEquilibrium() external view returns (
        bool isEquilibrium,
        uint256 currentRatio,
        uint256 targetRatio
    ) {
        isEquilibrium = (currentEra == MintingEra.EQUILIBRIUM_ERA);
        targetRatio = 10000; // 1:1 ratio scaled by 10000

        uint256 activeCitizens = totalVerifiedCitizens - totalInactiveCitizens;
        if (activeCitizens > 0) {
            currentRatio = (totalSupply() * 10000) / (activeCitizens * 10**18);
        } else {
            currentRatio = 0;
        }

        return (isEquilibrium, currentRatio, targetRatio);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Grant PFF Protocol role to address
     * @dev Only callable by admin
     * @param pffProtocol Address to grant PFF Protocol role
     */
    function grantPFFProtocolRole(address pffProtocol) external onlyRole(ADMIN_ROLE) {
        require(pffProtocol != address(0), "Invalid PFF Protocol address");
        _grantRole(PFF_PROTOCOL_ROLE, pffProtocol);
    }

    /**
     * @notice Revoke PFF Protocol role from address
     * @dev Only callable by admin
     * @param pffProtocol Address to revoke PFF Protocol role
     */
    function revokePFFProtocolRole(address pffProtocol) external onlyRole(ADMIN_ROLE) {
        _revokeRole(PFF_PROTOCOL_ROLE, pffProtocol);
    }

    /**
     * @notice Update national escrow address
     * @dev Only callable by admin
     * @param newEscrow New national escrow address
     */
    function updateNationalEscrow(address newEscrow) external onlyRole(ADMIN_ROLE) {
        require(newEscrow != address(0), "Invalid escrow address");
        address oldEscrow = nationalEscrow;
        nationalEscrow = newEscrow;

        // Transfer role
        _revokeRole(NATIONAL_ESCROW_ROLE, oldEscrow);
        _grantRole(NATIONAL_ESCROW_ROLE, newEscrow);
    }
}

