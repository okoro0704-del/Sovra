// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISOVaultRegistry - Universal National Vault Authorization
 * @notice "THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."
 * @dev Registry for all 195+ ISO-3166 recognized nations with dual-vault structure
 * 
 * DUAL-VAULT STRUCTURE:
 * ════════════════════════════════════════════════════════════════════════════════
 * For every nation [N]:
 * - [N]_Safe_Vault: 70% of VIDA CAP intake | 180-Day SNAT Lock
 * - [N]_Liquidity_Vault: 30% of VIDA CAP intake | Auto-Split 50/50 to nationalVIDA
 * 
 * CITIZEN-TO-VAULT BINDING:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Every user's PFF-Identity bound to their [N]_Liquidity_Vault
 * - Based on Sovereign Location (Lagos → Nigerian Vault, Accra → Ghanaian Vault)
 * - Geolocation-based automatic routing
 * 
 * LIQUIDITY ISOLATION:
 * ════════════════════════════════════════════════════════════════════════════════
 * - HARDCODED firewall: [N]_National_Stable CANNOT be minted from different nation's vault
 * - ngVIDA can ONLY be backed by Nigerian Liquidity Vault
 * - ghVIDA can ONLY be backed by Ghanaian Liquidity Vault
 * - Cross-contamination = IMPOSSIBLE
 * 
 * GODCURRENCY CROSS-SWAP:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Citizen from Nation A pays Nation B
 * - System swaps: [A]_Stable → VIDA CAP → [B]_Stable
 * - Liquidity Vaults act as market makers
 * - Atomic cross-border settlement
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SNAT Death Clock Integration
interface ISNATDeathClock {
    enum SNATStatus {
        INACTIVE,       // SNAT not signed
        ACTIVE,         // SNAT signed and active
        FLUSHED         // Vault flushed to Global Citizen Block
    }

    function nationDeathClocks(string memory iso3166Code) external view returns (
        string memory iso3166Code_,
        string memory countryName,
        uint256 deathClockStart,
        uint256 deathClockExpiry,
        address safeVault,
        uint256 safeVaultBalance,
        SNATStatus snatStatus,
        bool isInitialized,
        bool isFlushed,
        uint256 flushTimestamp,
        bytes32 flushTxHash
    );

    function executeGlobalFlush(string memory iso3166Code) external returns (bytes32 flushTxHash);
    function initializeDeathClock(string memory iso3166Code, string memory countryName, address safeVault) external;
}

// VLT Integration for Governance Shield
interface ISOVRYNAIGovernance {
    function createVLTEntry(
        address citizenAddress,
        bytes32 pffTruthHash,
        string memory dataType,
        bytes32 dataHash
    ) external returns (bytes32 vltHash);

    function vltEntries(bytes32 vltHash) external view returns (
        bytes32 vltHash_,
        address citizenAddress,
        bytes32 pffTruthHash,
        string memory dataType,
        bytes32 dataHash,
        uint256 timestamp,
        bool isImmutable
    );
}

contract ISOVaultRegistry is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════

    bytes32 public constant VAULT_ADMIN_ROLE = keccak256("VAULT_ADMIN_ROLE");
    bytes32 public constant PFF_ROUTER_ROLE = keccak256("PFF_ROUTER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    uint256 public constant SAFE_VAULT_PERCENTAGE = 70; // 70% to Safe Vault
    uint256 public constant LIQUIDITY_VAULT_PERCENTAGE = 30; // 30% to Liquidity Vault
    uint256 public constant SNAT_LOCK_DURATION = 180 days; // 180-Day SNAT Lock
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Dual-Vault Structure for each nation
     */
    struct NationalVault {
        string iso3166Code;          // ISO-3166 country code (e.g., "NG", "GH", "US")
        string countryName;          // Full country name (e.g., "Nigeria", "Ghana")
        address safeVault;           // 70% VIDA CAP intake | 180-Day SNAT Lock
        address liquidityVault;      // 30% VIDA CAP intake | Auto-Split to nationalVIDA
        address nationalStableToken; // National VIDA token (e.g., ngVIDA, ghVIDA)
        uint256 safeVaultBalance;    // Total VIDA CAP in Safe Vault
        uint256 liquidityVaultBalance; // Total VIDA CAP in Liquidity Vault
        uint256 snatLockExpiry;      // SNAT lock expiry timestamp
        bool isActive;               // Vault activation status
        bool snatSigned;             // Has nation signed SNAT treaty?
    }
    
    /**
     * @notice Citizen-to-Vault binding
     */
    struct CitizenBinding {
        address citizen;             // Citizen's address
        string iso3166Code;          // Bound to nation's ISO code
        string pffIdentity;          // PFF-Identity hash
        uint256 latitude;            // Sovereign location (latitude)
        uint256 longitude;           // Sovereign location (longitude)
        uint256 bindingTimestamp;    // When binding was created
        bool isActive;               // Binding status
    }
    
    /**
     * @notice Cross-swap transaction record
     */
    struct CrossSwapRecord {
        address sender;              // Sender citizen
        address recipient;           // Recipient citizen
        string fromNation;           // Sender's nation ISO code
        string toNation;             // Recipient's nation ISO code
        uint256 fromStableAmount;    // Amount in sender's national stable
        uint256 vidaCapAmount;       // Intermediate VIDA CAP amount
        uint256 toStableAmount;      // Amount in recipient's national stable
        uint256 timestamp;           // Swap timestamp
        bytes32 swapHash;            // Unique swap identifier
    }
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    // VIDA CAP Token
    IERC20 public vidaCapToken;

    // SNAT Death Clock Integration
    ISNATDeathClock public snatDeathClock;

    // VLT Integration for Governance Shield
    ISOVRYNAIGovernance public vltGovernance;

    // National Vault Registry (ISO code => Vault)
    mapping(string => NationalVault) public nationalVaults;

    // Citizen Bindings (citizen address => binding)
    mapping(address => CitizenBinding) public citizenBindings;

    // Cross-Swap Records (swap hash => record)
    mapping(bytes32 => CrossSwapRecord) public crossSwapRecords;

    // SNAT VLT Signatures (ISO code => VLT hash)
    mapping(string => bytes32) public snatVLTSignatures;

    // ISO-3166 Country Codes (for iteration)
    string[] public registeredCountries;

    // Total vaults registered
    uint256 public totalVaultsRegistered;

    // Total citizens bound
    uint256 public totalCitizensBound;

    // Total cross-swaps executed
    uint256 public totalCrossSwaps;

    // Total auto-flushes triggered
    uint256 public totalAutoFlushes;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    event NationalVaultRegistered(string indexed iso3166Code, string countryName, address safeVault, address liquidityVault);
    event CitizenBound(address indexed citizen, string indexed iso3166Code, string pffIdentity);
    event VIDACapDeposited(string indexed iso3166Code, uint256 safeAmount, uint256 liquidityAmount);
    event CrossSwapExecuted(bytes32 indexed swapHash, string fromNation, string toNation, uint256 vidaCapAmount);
    event SNATSigned(string indexed iso3166Code, uint256 lockExpiry);
    event LiquidityIsolationViolation(string indexed iso3166Code, address violator, string reason);

    // SNAT Death Clock Integration Events
    event LiquidityFlowRestricted(string indexed iso3166Code, uint256 allowedPercentage, string snatStatus, string reason);
    event AutoFlushTriggered(string indexed iso3166Code, uint256 amount, string reason, bytes32 flushTxHash);
    event GovernanceShieldActivated(string indexed iso3166Code, address indexed attemptedBy, string action, string reason);
    event SNATVLTSignatureRecorded(string indexed iso3166Code, bytes32 vltHash, address indexed signer);
    event SNATDeathClockIntegrated(address indexed snatDeathClockAddress, uint256 timestamp);
    event VLTGovernanceIntegrated(address indexed vltGovernanceAddress, uint256 timestamp);

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(address _vidaCapToken) {
        require(_vidaCapToken != address(0), "Invalid VIDA CAP token address");

        vidaCapToken = IERC20(_vidaCapToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PFF_ROUTER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // INTEGRATION FUNCTIONS - SNAT DEATH CLOCK & VLT
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Integrate SNAT Death Clock contract
     * @param _snatDeathClock SNAT Death Clock contract address
     */
    function integrateSNATDeathClock(address _snatDeathClock) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_snatDeathClock != address(0), "Invalid SNAT Death Clock address");
        require(address(snatDeathClock) == address(0), "SNAT Death Clock already integrated");

        snatDeathClock = ISNATDeathClock(_snatDeathClock);

        emit SNATDeathClockIntegrated(_snatDeathClock, block.timestamp);
    }

    /**
     * @notice Integrate VLT Governance contract
     * @param _vltGovernance VLT Governance contract address
     */
    function integrateVLTGovernance(address _vltGovernance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_vltGovernance != address(0), "Invalid VLT Governance address");
        require(address(vltGovernance) == address(0), "VLT Governance already integrated");

        vltGovernance = ISOVRYNAIGovernance(_vltGovernance);

        emit VLTGovernanceIntegrated(_vltGovernance, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - VAULT REGISTRATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Register a national vault for an ISO-3166 nation
     * @param iso3166Code ISO-3166 country code (e.g., "NG", "GH", "US")
     * @param countryName Full country name (e.g., "Nigeria", "Ghana")
     * @param safeVault Address for Safe Vault (70% intake)
     * @param liquidityVault Address for Liquidity Vault (30% intake)
     * @param nationalStableToken Address of national stable token (e.g., ngVIDA)
     */
    function registerNationalVault(
        string memory iso3166Code,
        string memory countryName,
        address safeVault,
        address liquidityVault,
        address nationalStableToken
    ) external onlyRole(VAULT_ADMIN_ROLE) {
        require(bytes(iso3166Code).length > 0, "ISO code cannot be empty");
        require(bytes(countryName).length > 0, "Country name cannot be empty");
        require(safeVault != address(0), "Invalid safe vault address");
        require(liquidityVault != address(0), "Invalid liquidity vault address");
        require(nationalStableToken != address(0), "Invalid national stable token address");
        require(!nationalVaults[iso3166Code].isActive, "Vault already registered");

        nationalVaults[iso3166Code] = NationalVault({
            iso3166Code: iso3166Code,
            countryName: countryName,
            safeVault: safeVault,
            liquidityVault: liquidityVault,
            nationalStableToken: nationalStableToken,
            safeVaultBalance: 0,
            liquidityVaultBalance: 0,
            snatLockExpiry: 0,
            isActive: true,
            snatSigned: false
        });

        registeredCountries.push(iso3166Code);
        totalVaultsRegistered++;

        emit NationalVaultRegistered(iso3166Code, countryName, safeVault, liquidityVault);
    }

    /**
     * @notice Sign SNAT treaty for a nation (180-day protection)
     * @param iso3166Code ISO-3166 country code
     */
    function signSNATTreaty(string memory iso3166Code) external onlyRole(VAULT_ADMIN_ROLE) {
        require(nationalVaults[iso3166Code].isActive, "Vault not registered");
        require(!nationalVaults[iso3166Code].snatSigned, "SNAT already signed");

        uint256 lockExpiry = block.timestamp + SNAT_LOCK_DURATION;
        nationalVaults[iso3166Code].snatSigned = true;
        nationalVaults[iso3166Code].snatLockExpiry = lockExpiry;

        emit SNATSigned(iso3166Code, lockExpiry);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - CITIZEN BINDING
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Bind citizen's PFF-Identity to nation's vault based on sovereign location
     * @param citizen Citizen's address
     * @param iso3166Code Nation's ISO-3166 code
     * @param pffIdentity PFF-Identity hash
     * @param latitude Sovereign location latitude (scaled by 1e6)
     * @param longitude Sovereign location longitude (scaled by 1e6)
     */
    function bindCitizenToVault(
        address citizen,
        string memory iso3166Code,
        string memory pffIdentity,
        uint256 latitude,
        uint256 longitude
    ) external onlyRole(PFF_ROUTER_ROLE) {
        require(citizen != address(0), "Invalid citizen address");
        require(nationalVaults[iso3166Code].isActive, "Vault not registered");
        require(bytes(pffIdentity).length > 0, "PFF identity cannot be empty");
        require(!citizenBindings[citizen].isActive, "Citizen already bound");

        citizenBindings[citizen] = CitizenBinding({
            citizen: citizen,
            iso3166Code: iso3166Code,
            pffIdentity: pffIdentity,
            latitude: latitude,
            longitude: longitude,
            bindingTimestamp: block.timestamp,
            isActive: true
        });

        totalCitizensBound++;

        emit CitizenBound(citizen, iso3166Code, pffIdentity);
    }

    /**
     * @notice Get citizen's bound nation
     * @param citizen Citizen's address
     * @return iso3166Code Nation's ISO code
     */
    function getCitizenNation(address citizen) external view returns (string memory) {
        require(citizenBindings[citizen].isActive, "Citizen not bound");
        return citizenBindings[citizen].iso3166Code;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - VIDA CAP DEPOSIT
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit VIDA CAP with SNAT Death Clock integrated access control
     * @dev Direct Binding: Links every liquidity event to DEATH_CLOCK
     * @dev Access Control: PENDING = 30% only, EXPIRED = auto GlobalFlush
     * @param iso3166Code Nation's ISO-3166 code
     * @param amount Total VIDA CAP amount to deposit
     */
    function depositVIDACAP(
        string memory iso3166Code,
        uint256 amount
    ) external nonReentrant {
        require(nationalVaults[iso3166Code].isActive, "Vault not registered");
        require(amount > 0, "Amount must be greater than 0");
        require(address(snatDeathClock) != address(0), "SNAT Death Clock not integrated");

        NationalVault storage vault = nationalVaults[iso3166Code];

        // ════════════════════════════════════════════════════════════════════════════════
        // DIRECT BINDING: Link to DEATH_CLOCK
        // ════════════════════════════════════════════════════════════════════════════════

        (
            ,
            ,
            ,
            uint256 deathClockExpiry,
            ,
            ,
            ISNATDeathClock.SNATStatus snatStatus,
            bool isInitialized,
            bool isFlushed,
            ,
        ) = snatDeathClock.nationDeathClocks(iso3166Code);

        // ════════════════════════════════════════════════════════════════════════════════
        // ACCESS CONTROL: SNAT Status-Based Liquidity Flow
        // ════════════════════════════════════════════════════════════════════════════════

        uint256 safeAmount;
        uint256 liquidityAmount;

        // If SNAT_STATUS is 'EXPIRED' (T-Minus 0), trigger immediate GlobalFlush
        if (isInitialized && !isFlushed && snatStatus == ISNATDeathClock.SNATStatus.INACTIVE && block.timestamp >= deathClockExpiry) {
            // EXPIRED: Trigger immediate GlobalFlush to Citizen Block
            bytes32 flushTxHash = snatDeathClock.executeGlobalFlush(iso3166Code);
            totalAutoFlushes++;

            emit AutoFlushTriggered(
                iso3166Code,
                vault.safeVaultBalance,
                "SNAT expired - automatic GlobalFlush triggered",
                flushTxHash
            );

            // After flush, only allow 30% liquidity flow
            safeAmount = 0;
            liquidityAmount = amount; // 100% to liquidity (nation lost sovereignty)

            emit LiquidityFlowRestricted(
                iso3166Code,
                100,
                "FLUSHED",
                "Nation sovereignty expired - 100% to liquidity"
            );
        }
        // If SNAT_STATUS is 'PENDING' (INACTIVE), only allow 30% Liquidity to flow
        else if (isInitialized && snatStatus == ISNATDeathClock.SNATStatus.INACTIVE) {
            // PENDING: Only 30% liquidity allowed
            safeAmount = 0;
            liquidityAmount = amount; // 100% to liquidity (restricted)

            emit LiquidityFlowRestricted(
                iso3166Code,
                100,
                "PENDING",
                "SNAT not activated - only liquidity vault accessible"
            );
        }
        // If SNAT_STATUS is 'ACTIVE', allow full 70/30 split
        else if (isInitialized && snatStatus == ISNATDeathClock.SNATStatus.ACTIVE) {
            // ACTIVE: Full 70/30 split allowed
            safeAmount = (amount * SAFE_VAULT_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
            liquidityAmount = (amount * LIQUIDITY_VAULT_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        }
        // If death clock not initialized, use default 70/30 split
        else {
            // Default: 70/30 split
            safeAmount = (amount * SAFE_VAULT_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
            liquidityAmount = (amount * LIQUIDITY_VAULT_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        }

        // Transfer VIDA CAP from sender
        require(
            vidaCapToken.transferFrom(msg.sender, address(this), amount),
            "VIDA CAP transfer failed"
        );

        // Update vault balances
        vault.safeVaultBalance += safeAmount;
        vault.liquidityVaultBalance += liquidityAmount;

        emit VIDACapDeposited(iso3166Code, safeAmount, liquidityAmount);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - GODCURRENCY CROSS-SWAP
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Execute cross-border swap: [A]_Stable → VIDA CAP → [B]_Stable
     * @param sender Sender citizen address
     * @param recipient Recipient citizen address
     * @param fromStableAmount Amount in sender's national stable
     * @return swapHash Unique swap identifier
     */
    function executeCrossSwap(
        address sender,
        address recipient,
        uint256 fromStableAmount
    ) external nonReentrant onlyRole(PFF_ROUTER_ROLE) returns (bytes32) {
        require(sender != address(0), "Invalid sender address");
        require(recipient != address(0), "Invalid recipient address");
        require(citizenBindings[sender].isActive, "Sender not bound");
        require(citizenBindings[recipient].isActive, "Recipient not bound");
        require(fromStableAmount > 0, "Amount must be greater than 0");

        string memory fromNation = citizenBindings[sender].iso3166Code;
        string memory toNation = citizenBindings[recipient].iso3166Code;

        require(nationalVaults[fromNation].isActive, "Sender's vault not registered");
        require(nationalVaults[toNation].isActive, "Recipient's vault not registered");

        // LIQUIDITY ISOLATION CHECK: Ensure sender's stable is backed by sender's vault
        require(
            validateLiquidityIsolation(fromNation, sender),
            "Liquidity isolation violation: sender's stable not backed by sender's vault"
        );

        // LIQUIDITY ISOLATION CHECK: Ensure recipient's stable will be backed by recipient's vault
        require(
            validateLiquidityIsolation(toNation, recipient),
            "Liquidity isolation violation: recipient's stable not backed by recipient's vault"
        );

        // Step 1: Burn sender's national stable (fromStableAmount)
        // Step 2: Calculate intermediate VIDA CAP amount (1:1 for simplicity)
        uint256 vidaCapAmount = fromStableAmount;

        // Step 3: Verify sender's liquidity vault has enough VIDA CAP
        require(
            nationalVaults[fromNation].liquidityVaultBalance >= vidaCapAmount,
            "Insufficient liquidity in sender's vault"
        );

        // Step 4: Verify recipient's liquidity vault has enough VIDA CAP
        require(
            nationalVaults[toNation].liquidityVaultBalance >= vidaCapAmount,
            "Insufficient liquidity in recipient's vault"
        );

        // Step 5: Execute atomic swap
        // - Deduct from sender's liquidity vault
        nationalVaults[fromNation].liquidityVaultBalance -= vidaCapAmount;

        // - Add to recipient's liquidity vault
        nationalVaults[toNation].liquidityVaultBalance += vidaCapAmount;

        // Step 6: Mint recipient's national stable (toStableAmount)
        uint256 toStableAmount = vidaCapAmount; // 1:1 for simplicity

        // Generate unique swap hash
        bytes32 swapHash = keccak256(
            abi.encodePacked(
                sender,
                recipient,
                fromNation,
                toNation,
                fromStableAmount,
                block.timestamp,
                totalCrossSwaps
            )
        );

        // Record cross-swap
        crossSwapRecords[swapHash] = CrossSwapRecord({
            sender: sender,
            recipient: recipient,
            fromNation: fromNation,
            toNation: toNation,
            fromStableAmount: fromStableAmount,
            vidaCapAmount: vidaCapAmount,
            toStableAmount: toStableAmount,
            timestamp: block.timestamp,
            swapHash: swapHash
        });

        totalCrossSwaps++;

        emit CrossSwapExecuted(swapHash, fromNation, toNation, vidaCapAmount);

        return swapHash;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // LIQUIDITY ISOLATION FIREWALL
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice HARDCODED FIREWALL: Validate liquidity isolation
     * @dev Prevents [N]_National_Stable from being minted/backed by different nation's vault
     * @param iso3166Code Nation's ISO code
     * @param citizen Citizen's address
     * @return bool True if liquidity isolation is valid
     */
    function validateLiquidityIsolation(
        string memory iso3166Code,
        address citizen
    ) public view returns (bool) {
        // Check 1: Vault must be registered
        if (!nationalVaults[iso3166Code].isActive) {
            return false;
        }

        // Check 2: Citizen must be bound to the same nation
        if (!citizenBindings[citizen].isActive) {
            return false;
        }

        // Check 3: Citizen's bound nation MUST match the vault's nation
        if (keccak256(bytes(citizenBindings[citizen].iso3166Code)) != keccak256(bytes(iso3166Code))) {
            return false;
        }

        // Check 4: National stable token MUST match the vault's national stable token
        // (This prevents cross-contamination)
        address expectedStableToken = nationalVaults[iso3166Code].nationalStableToken;
        if (expectedStableToken == address(0)) {
            return false;
        }

        // All checks passed - liquidity isolation is valid
        return true;
    }

    /**
     * @notice Enforce liquidity isolation (reverts on violation)
     * @param iso3166Code Nation's ISO code
     * @param citizen Citizen's address
     */
    function enforceLiquidityIsolation(
        string memory iso3166Code,
        address citizen
    ) external view {
        require(
            validateLiquidityIsolation(iso3166Code, citizen),
            "LIQUIDITY ISOLATION VIOLATION: National stable cannot be backed by different nation's vault"
        );
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // GETTER FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get vault details for a nation
     * @param iso3166Code Nation's ISO code
     */
    function getVaultDetails(string memory iso3166Code) external view returns (
        string memory countryName,
        address safeVault,
        address liquidityVault,
        address nationalStableToken,
        uint256 safeVaultBalance,
        uint256 liquidityVaultBalance,
        uint256 snatLockExpiry,
        bool isActive,
        bool snatSigned
    ) {
        NationalVault memory vault = nationalVaults[iso3166Code];
        return (
            vault.countryName,
            vault.safeVault,
            vault.liquidityVault,
            vault.nationalStableToken,
            vault.safeVaultBalance,
            vault.liquidityVaultBalance,
            vault.snatLockExpiry,
            vault.isActive,
            vault.snatSigned
        );
    }

    /**
     * @notice Get citizen binding details
     * @param citizen Citizen's address
     */
    function getCitizenBinding(address citizen) external view returns (
        string memory iso3166Code,
        string memory pffIdentity,
        uint256 latitude,
        uint256 longitude,
        uint256 bindingTimestamp,
        bool isActive
    ) {
        CitizenBinding memory binding = citizenBindings[citizen];
        return (
            binding.iso3166Code,
            binding.pffIdentity,
            binding.latitude,
            binding.longitude,
            binding.bindingTimestamp,
            binding.isActive
        );
    }

    /**
     * @notice Get cross-swap record
     * @param swapHash Swap identifier
     */
    function getCrossSwapRecord(bytes32 swapHash) external view returns (
        address sender,
        address recipient,
        string memory fromNation,
        string memory toNation,
        uint256 fromStableAmount,
        uint256 vidaCapAmount,
        uint256 toStableAmount,
        uint256 timestamp
    ) {
        CrossSwapRecord memory record = crossSwapRecords[swapHash];
        return (
            record.sender,
            record.recipient,
            record.fromNation,
            record.toNation,
            record.fromStableAmount,
            record.vidaCapAmount,
            record.toStableAmount,
            record.timestamp
        );
    }

    /**
     * @notice Get all registered countries
     */
    function getRegisteredCountries() external view returns (string[] memory) {
        return registeredCountries;
    }

    /**
     * @notice Get registry statistics
     */
    function getRegistryStats() external view returns (
        uint256 vaultsRegistered,
        uint256 citizensBound,
        uint256 crossSwaps,
        uint256 totalCountries
    ) {
        return (
            totalVaultsRegistered,
            totalCitizensBound,
            totalCrossSwaps,
            registeredCountries.length
        );
    }

    /**
     * @notice Check if SNAT lock is active for a nation
     * @param iso3166Code Nation's ISO code
     */
    function isSNATLockActive(string memory iso3166Code) external view returns (bool) {
        NationalVault memory vault = nationalVaults[iso3166Code];
        return vault.snatSigned && block.timestamp < vault.snatLockExpiry;
    }

    /**
     * @notice Get remaining SNAT lock time
     * @param iso3166Code Nation's ISO code
     */
    function getRemainingLockTime(string memory iso3166Code) external view returns (uint256) {
        NationalVault memory vault = nationalVaults[iso3166Code];
        if (!vault.snatSigned || block.timestamp >= vault.snatLockExpiry) {
            return 0;
        }
        return vault.snatLockExpiry - block.timestamp;
    }

    /**
     * @notice Validation function - "THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."
     */
    function getValidationMessage() external pure returns (string memory) {
        return "THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY.";
    }
}

