// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VidaCapSNATLinked - SNAT-Integrated VIDA Cap Minting
 * @notice VIDA Cap with SNAT Death Clock integration for minting control
 * @dev Extends VIDA Cap minting with SNAT-based access control
 * 
 * SNAT INTEGRATION:
 * - Checks nation SNAT status before minting
 * - ACTIVE SNAT: Full minting (5 Citizen / 5 Nation in 10-Unit Era)
 * - INACTIVE SNAT: Reduced nation allocation (5 Citizen / 2.5 Nation + 2.5 Global Pool)
 * - FLUSHED SNAT: All nation allocation goes to Global Citizen Block
 * 
 * TOKENOMICS:
 * - Initial Mint: 10 Units (5 to Architect / 5 to National Escrow)
 * - Start Price: $1,000 per VIDA Cap
 * - 10-Unit Era: Every PFF handshake mints 10 VIDA Cap (5 Citizen / 5 Nation)
 * - 5B Threshold: Once supply hits 5 Billion, drop to 2-Unit Era
 * - 2-Unit Era: New mints drop to 2 VIDA Cap (1 Citizen / 1 Nation)
 * - Permanent Burn: 1% transaction burn until supply equals 1 VIDA Cap per verified Citizen
 * 
 * "IF A NATION DOES NOT CLAIM SOVEREIGNTY, THE PEOPLE INHERIT THE VAULT."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract VidaCapSNATLinked is ERC20, AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant PFF_MINTER_ROLE = keccak256("PFF_MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant NATIONAL_ESCROW_ROLE = keccak256("NATIONAL_ESCROW_ROLE");
    bytes32 public constant SNAT_ADMIN_ROLE = keccak256("SNAT_ADMIN_ROLE");
    
    uint256 public constant INITIAL_MINT = 10 * 10**18; // 10 VIDA Cap
    uint256 public constant GENESIS_SPLIT = 5 * 10**18; // 5 to Architect / 5 to Nation
    uint256 public constant START_PRICE_USD = 1000; // $1,000 per VIDA Cap
    
    uint256 public constant THRESHOLD_5B = 5_000_000_000 * 10**18; // 5 Billion VIDA Cap
    uint256 public constant MINT_AMOUNT_10_ERA = 10 * 10**18; // 10 VIDA Cap per handshake
    uint256 public constant MINT_AMOUNT_2_ERA = 2 * 10**18; // 2 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_10_ERA = 5 * 10**18; // 5 to Citizen
    uint256 public constant NATION_SPLIT_10_ERA = 5 * 10**18; // 5 to Nation
    uint256 public constant CITIZEN_SPLIT_2_ERA = 1 * 10**18; // 1 to Citizen
    uint256 public constant NATION_SPLIT_2_ERA = 1 * 10**18; // 1 to Nation
    
    // SNAT-based allocation percentages
    uint256 public constant SNAT_ACTIVE_NATION_PCT = 100; // 100% to nation if SNAT active
    uint256 public constant SNAT_INACTIVE_NATION_PCT = 50; // 50% to nation if SNAT inactive
    uint256 public constant SNAT_INACTIVE_GLOBAL_PCT = 50; // 50% to global pool if SNAT inactive
    
    uint256 public constant BURN_RATE_BPS = 100; // 1% (100 basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    enum MintingEra { TEN_UNIT_ERA, TWO_UNIT_ERA }
    enum SNATStatus { INACTIVE, ACTIVE, FLUSHED }
    
    MintingEra public currentEra;
    address public architect;
    address public nationalEscrow;
    address public globalCitizenBlock;
    address public snatDeathClock;
    
    mapping(bytes32 => bool) public usedPFFSignatures;
    mapping(address => bool) public isVerifiedCitizen;
    mapping(string => address) public nationEscrows; // ISO code => nation escrow address
    
    uint256 public totalVerifiedCitizens;
    uint256 public totalPFFHandshakes;
    uint256 public totalSNATActiveMints;
    uint256 public totalSNATInactiveMints;
    uint256 public totalSNATFlushedMints;
    uint256 public totalGlobalPoolAllocations;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    event GenesisMintExecuted(address indexed architect, address indexed nationalEscrow, uint256 totalAmount);
    event PFFHandshakeMint(
        address indexed citizen,
        uint256 citizenAmount,
        uint256 nationAmount,
        uint256 globalPoolAmount,
        bytes32 pffSignature,
        string iso3166Code,
        uint8 snatStatus
    );
    event CitizenVerified(address indexed citizen, bytes32 pffHash);
    event PFFSignatureUsed(bytes32 indexed pffSignature, address indexed citizen);
    event EraTransition(MintingEra oldEra, MintingEra newEra, uint256 currentSupply);
    event SNATStatusChecked(string indexed iso3166Code, uint8 snatStatus, bool isExpired);
    event SNATInactiveMintAdjusted(string indexed iso3166Code, uint256 nationAmount, uint256 globalPoolAmount);
    event SNATFlushedMintRedirected(string indexed iso3166Code, uint256 amount);
    event NationEscrowRegistered(string indexed iso3166Code, address escrowAddress);
    event SNATDeathClockSet(address indexed snatDeathClock);
    event GlobalCitizenBlockSet(address indexed globalCitizenBlock);
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════
    
    constructor(
        address _architect,
        address _nationalEscrow,
        address _globalCitizenBlock,
        address _snatDeathClock
    ) ERC20("VIDA Cap", "VCAP") {
        require(_architect != address(0), "Invalid architect address");
        require(_nationalEscrow != address(0), "Invalid national escrow address");
        require(_globalCitizenBlock != address(0), "Invalid global citizen block address");
        require(_snatDeathClock != address(0), "Invalid SNAT Death Clock address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PFF_MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(NATIONAL_ESCROW_ROLE, _nationalEscrow);
        _grantRole(SNAT_ADMIN_ROLE, msg.sender);
        
        architect = _architect;
        nationalEscrow = _nationalEscrow;
        globalCitizenBlock = _globalCitizenBlock;
        snatDeathClock = _snatDeathClock;
        currentEra = MintingEra.TEN_UNIT_ERA;
        
        // GENESIS MINT: 10 Units (5 to Architect / 5 to National Escrow)
        _mint(_architect, GENESIS_SPLIT);
        _mint(_nationalEscrow, GENESIS_SPLIT);
        
        emit GenesisMintExecuted(_architect, _nationalEscrow, INITIAL_MINT);
        emit SNATDeathClockSet(_snatDeathClock);
        emit GlobalCitizenBlockSet(_globalCitizenBlock);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Mint VIDA Cap on PFF-verified handshake with SNAT integration
     * @param citizen Citizen address
     * @param pffSignature SOVEREIGN_AUTH signature from PFF Protocol
     * @param pffHash PFF Truth-Hash from heartbeat
     * @param iso3166Code Nation ISO 3166 Alpha-2 code
     *
     * LOGIC:
     * - Check nation SNAT status from SNATDeathClock
     * - SNAT ACTIVE: Full nation allocation (5 VIDA Cap in 10-Unit Era)
     * - SNAT INACTIVE: 50% nation allocation + 50% global pool (2.5 + 2.5 in 10-Unit Era)
     * - SNAT FLUSHED: 100% to Global Citizen Block (0 to nation)
     * - Transition at 5B supply threshold
     */
    function mintOnPFFHandshake(
        address citizen,
        bytes32 pffSignature,
        bytes32 pffHash,
        string memory iso3166Code
    ) external onlyRole(PFF_MINTER_ROLE) nonReentrant {
        require(citizen != address(0), "Invalid citizen address");
        require(!usedPFFSignatures[pffSignature], "PFF signature already used");
        require(bytes(iso3166Code).length > 0, "Invalid ISO code");

        // Mark signature as used (anti-replay)
        usedPFFSignatures[pffSignature] = true;
        emit PFFSignatureUsed(pffSignature, citizen);

        // Verify citizen if first handshake
        if (!isVerifiedCitizen[citizen]) {
            isVerifiedCitizen[citizen] = true;
            totalVerifiedCitizens++;
            emit CitizenVerified(citizen, pffHash);
        }

        // Check SNAT status for the nation
        (uint8 snatStatus, bool isExpired) = _checkSNATStatus(iso3166Code);
        emit SNATStatusChecked(iso3166Code, snatStatus, isExpired);

        // Execute SNAT-based minting
        _executeSNATBasedMinting(citizen, iso3166Code, snatStatus, pffSignature);

        totalPFFHandshakes++;

        // Check if we need to transition to 2-Unit Era
        _checkEraTransition();
    }

    /**
     * @notice Register nation escrow address for a specific nation
     * @param iso3166Code Nation ISO 3166 Alpha-2 code
     * @param escrowAddress Nation escrow address
     */
    function registerNationEscrow(string memory iso3166Code, address escrowAddress)
        external
        onlyRole(SNAT_ADMIN_ROLE)
    {
        require(bytes(iso3166Code).length > 0, "Invalid ISO code");
        require(escrowAddress != address(0), "Invalid escrow address");

        nationEscrows[iso3166Code] = escrowAddress;
        emit NationEscrowRegistered(iso3166Code, escrowAddress);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Check SNAT status from SNATDeathClock contract
     * @param iso3166Code Nation ISO 3166 Alpha-2 code
     * @return snatStatus SNAT status (0=INACTIVE, 1=ACTIVE, 2=FLUSHED)
     * @return isExpired Whether the death clock has expired
     */
    function _checkSNATStatus(string memory iso3166Code)
        internal
        view
        returns (uint8 snatStatus, bool isExpired)
    {
        // Call SNATDeathClock to get nation status
        (bool success, bytes memory data) = snatDeathClock.staticcall(
            abi.encodeWithSignature("getDeathClock(string)", iso3166Code)
        );

        if (!success) {
            return (0, false); // Default to INACTIVE if call fails
        }

        // Decode the response
        (
            , // iso3166Code
            , // countryName
            , // deathClockStart
            uint256 deathClockExpiry,
            , // safeVault
            , // safeVaultBalance
            uint8 status,
            bool isInitialized,
            , // isFlushed
            , // flushTimestamp
              // flushTxHash
        ) = abi.decode(data, (string, string, uint256, uint256, address, uint256, uint8, bool, bool, uint256, bytes32));

        // If not initialized, default to INACTIVE
        if (!isInitialized) {
            return (0, false);
        }

        // Check if expired
        isExpired = block.timestamp >= deathClockExpiry;

        return (status, isExpired);
    }

    /**
     * @notice Execute SNAT-based minting logic
     * @param citizen Citizen address
     * @param iso3166Code Nation ISO 3166 Alpha-2 code
     * @param snatStatus SNAT status (0=INACTIVE, 1=ACTIVE, 2=FLUSHED)
     * @param pffSignature PFF signature for event emission
     */
    function _executeSNATBasedMinting(
        address citizen,
        string memory iso3166Code,
        uint8 snatStatus,
        bytes32 pffSignature
    ) internal {
        uint256 citizenAmount;
        uint256 nationAmount;
        uint256 globalPoolAmount = 0;

        // Determine base amounts based on current era
        uint256 baseCitizenAmount;
        uint256 baseNationAmount;

        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            baseCitizenAmount = CITIZEN_SPLIT_10_ERA; // 5 VIDA Cap
            baseNationAmount = NATION_SPLIT_10_ERA;   // 5 VIDA Cap
        } else {
            baseCitizenAmount = CITIZEN_SPLIT_2_ERA;  // 1 VIDA Cap
            baseNationAmount = NATION_SPLIT_2_ERA;    // 1 VIDA Cap
        }

        // Citizen always gets full allocation
        citizenAmount = baseCitizenAmount;

        // Adjust nation allocation based on SNAT status
        if (snatStatus == uint8(SNATStatus.ACTIVE)) {
            // SNAT ACTIVE: Full nation allocation
            nationAmount = baseNationAmount;
            totalSNATActiveMints++;
        } else if (snatStatus == uint8(SNATStatus.INACTIVE)) {
            // SNAT INACTIVE: 50% to nation, 50% to global pool
            nationAmount = (baseNationAmount * SNAT_INACTIVE_NATION_PCT) / 100;
            globalPoolAmount = (baseNationAmount * SNAT_INACTIVE_GLOBAL_PCT) / 100;
            totalSNATInactiveMints++;
            totalGlobalPoolAllocations += globalPoolAmount;
            emit SNATInactiveMintAdjusted(iso3166Code, nationAmount, globalPoolAmount);
        } else {
            // SNAT FLUSHED: 100% to global pool, 0 to nation
            nationAmount = 0;
            globalPoolAmount = baseNationAmount;
            totalSNATFlushedMints++;
            totalGlobalPoolAllocations += globalPoolAmount;
            emit SNATFlushedMintRedirected(iso3166Code, globalPoolAmount);
        }

        // Mint to citizen
        _mint(citizen, citizenAmount);

        // Mint to nation escrow (if nation allocation > 0)
        if (nationAmount > 0) {
            address nationEscrow = nationEscrows[iso3166Code];
            if (nationEscrow == address(0)) {
                nationEscrow = nationalEscrow; // Fallback to default national escrow
            }
            _mint(nationEscrow, nationAmount);
        }

        // Mint to global citizen block (if global pool allocation > 0)
        if (globalPoolAmount > 0) {
            _mint(globalCitizenBlock, globalPoolAmount);
        }

        emit PFFHandshakeMint(
            citizen,
            citizenAmount,
            nationAmount,
            globalPoolAmount,
            pffSignature,
            iso3166Code,
            snatStatus
        );
    }

    /**
     * @notice Check if supply threshold reached and transition era
     */
    function _checkEraTransition() internal {
        uint256 currentSupply = totalSupply();

        if (currentEra == MintingEra.TEN_UNIT_ERA && currentSupply >= THRESHOLD_5B) {
            MintingEra oldEra = currentEra;
            currentEra = MintingEra.TWO_UNIT_ERA;
            emit EraTransition(oldEra, currentEra, currentSupply);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

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
     * @notice Get SNAT statistics
     */
    function getSNATStatistics() external view returns (
        uint256 activeMints,
        uint256 inactiveMints,
        uint256 flushedMints,
        uint256 globalPoolAllocations
    ) {
        return (
            totalSNATActiveMints,
            totalSNATInactiveMints,
            totalSNATFlushedMints,
            totalGlobalPoolAllocations
        );
    }

    /**
     * @notice Get nation escrow address for a specific nation
     */
    function getNationEscrow(string memory iso3166Code) external view returns (address) {
        address escrow = nationEscrows[iso3166Code];
        return escrow != address(0) ? escrow : nationalEscrow;
    }
}
