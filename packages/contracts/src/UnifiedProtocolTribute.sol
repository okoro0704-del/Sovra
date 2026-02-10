// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UnifiedProtocolTribute
 * @notice Unified 1% Protocol Tribute with SNAT 180-Day Integration
 * 
 * "THE WEALTH OF THE PROTOCOL IS THE PRESENCE OF ITS PEOPLE."
 * 
 * CORE LOGIC:
 * ════════════════════════════════════════════════════════════════════════════════
 * - 1% Protocol Tribute on ALL VIDA Cap transactions
 * - Monthly Truth Dividend distribution to verified citizens
 * - SNAT 180-Day Integration: Tribute routing based on nation SNAT status
 * - If SNAT ACTIVE: Tribute flows to National Dividend Pool
 * - If SNAT INACTIVE/EXPIRED: Tribute flows to Global Citizen Block
 * 
 * REVENUE SPLIT (1% Total):
 * ════════════════════════════════════════════════════════════════════════════════
 * - 50% → Monthly Truth Dividend Pool (distributed to verified citizens)
 * - 25% → Protocol Treasury (R&D, infrastructure)
 * - 25% → Permanent Burn (deflationary pressure)
 * 
 * SNAT INTEGRATION:
 * ════════════════════════════════════════════════════════════════════════════════
 * - Queries SNATDeathClock for nation status
 * - Routes tribute based on SNAT_STATUS (ACTIVE/INACTIVE/FLUSHED)
 * - Automatic failover to Global Citizen Block if nation expired
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract UnifiedProtocolTribute is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant TRIBUTE_COLLECTOR_ROLE = keccak256("TRIBUTE_COLLECTOR_ROLE");
    bytes32 public constant DIVIDEND_DISTRIBUTOR_ROLE = keccak256("DIVIDEND_DISTRIBUTOR_ROLE");
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS - THE 1% MANDATE
    // ════════════════════════════════════════════════════════════════════════════════
    
    uint256 public constant TRIBUTE_RATE_BPS = 100; // 1% (100 basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Revenue Split (of the 1% tribute)
    uint256 public constant DIVIDEND_POOL_BPS = 5000; // 50% to Monthly Truth Dividend
    uint256 public constant TREASURY_BPS = 2500; // 25% to Protocol Treasury
    uint256 public constant BURN_BPS = 2500; // 25% to Permanent Burn
    
    // Monthly Distribution
    uint256 public constant DISTRIBUTION_INTERVAL = 30 days;
    
    // Metadata
    string public constant PROTOCOL_METADATA = "THE WEALTH OF THE PROTOCOL IS THE PRESENCE OF ITS PEOPLE.";
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    IERC20 public vidaCapToken;
    address public snatDeathClock;
    address public monthlyDividendPool;
    address public protocolTreasury;
    address public globalCitizenBlock;
    
    uint256 public totalTributeCollected;
    uint256 public totalDividendDistributed;
    uint256 public totalTreasuryAllocated;
    uint256 public totalBurned;
    
    uint256 public lastDistributionTimestamp;
    uint256 public currentMonthDividendPool;
    
    mapping(address => uint256) public citizenDividendClaimed;
    mapping(address => bool) public isVerifiedCitizen;
    uint256 public totalVerifiedCitizens;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    event TributeCollected(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 tributeAmount,
        uint256 toDividend,
        uint256 toTreasury,
        uint256 toBurn
    );
    
    event MonthlyDividendDistributed(
        uint256 totalAmount,
        uint256 perCitizen,
        uint256 totalCitizens,
        uint256 timestamp
    );
    
    event CitizenVerified(address indexed citizen, uint256 timestamp);
    
    event SNATStatusChecked(
        string indexed iso3166Code,
        uint8 snatStatus,
        bool routedToGlobal
    );
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════
    
    constructor(
        address _vidaCapToken,
        address _snatDeathClock,
        address _monthlyDividendPool,
        address _protocolTreasury,
        address _globalCitizenBlock
    ) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token");
        require(_snatDeathClock != address(0), "Invalid SNAT Death Clock");
        require(_monthlyDividendPool != address(0), "Invalid dividend pool");
        require(_protocolTreasury != address(0), "Invalid treasury");
        require(_globalCitizenBlock != address(0), "Invalid global citizen block");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TRIBUTE_COLLECTOR_ROLE, msg.sender);
        _grantRole(DIVIDEND_DISTRIBUTOR_ROLE, msg.sender);
        
        vidaCapToken = IERC20(_vidaCapToken);
        snatDeathClock = _snatDeathClock;
        monthlyDividendPool = _monthlyDividendPool;
        protocolTreasury = _protocolTreasury;
        globalCitizenBlock = _globalCitizenBlock;
        
        lastDistributionTimestamp = block.timestamp;
    }
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - 1% TRIBUTE COLLECTION
    // ════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Collect 1% protocol tribute on VIDA Cap transfer
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     * @return tributeAmount Amount of tribute collected
     */
    function collectTribute(
        address from,
        address to,
        uint256 amount
    ) external onlyRole(TRIBUTE_COLLECTOR_ROLE) nonReentrant returns (uint256 tributeAmount) {
        require(from != address(0), "Invalid sender");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");

        // Calculate 1% tribute
        tributeAmount = (amount * TRIBUTE_RATE_BPS) / BPS_DENOMINATOR;
        require(tributeAmount > 0, "Tribute amount too small");

        // Calculate splits (50% dividend / 25% treasury / 25% burn)
        uint256 toDividend = (tributeAmount * DIVIDEND_POOL_BPS) / BPS_DENOMINATOR;
        uint256 toTreasury = (tributeAmount * TREASURY_BPS) / BPS_DENOMINATOR;
        uint256 toBurn = tributeAmount - toDividend - toTreasury; // Remaining goes to burn

        // Transfer tribute from sender to this contract
        require(
            vidaCapToken.transferFrom(from, address(this), tributeAmount),
            "Tribute transfer failed"
        );

        // Route to dividend pool
        currentMonthDividendPool += toDividend;
        require(
            vidaCapToken.transfer(monthlyDividendPool, toDividend),
            "Dividend pool transfer failed"
        );

        // Route to treasury
        totalTreasuryAllocated += toTreasury;
        require(
            vidaCapToken.transfer(protocolTreasury, toTreasury),
            "Treasury transfer failed"
        );

        // Burn tokens
        totalBurned += toBurn;
        require(
            vidaCapToken.transfer(address(0xdead), toBurn),
            "Burn transfer failed"
        );

        // Update total tribute collected
        totalTributeCollected += tributeAmount;

        emit TributeCollected(from, to, amount, tributeAmount, toDividend, toTreasury, toBurn);

        return tributeAmount;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // SNAT INTEGRATION - THE 180-DAY LINK
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Check SNAT status for a nation
     * @param iso3166Code ISO 3166 country code
     * @return snatStatus SNAT status (0=INACTIVE, 1=ACTIVE, 2=FLUSHED)
     * @return isExpired Whether the death clock has expired
     */
    function checkSNATStatus(string memory iso3166Code)
        public
        view
        returns (uint8 snatStatus, bool isExpired)
    {
        // Call SNATDeathClock to get nation status
        (bool success, bytes memory data) = snatDeathClock.staticcall(
            abi.encodeWithSignature("getNationDeathClock(string)", iso3166Code)
        );

        if (!success) {
            return (0, false); // Default to INACTIVE if call fails
        }

        // Decode the response
        (
            , // iso3166Code
            , // countryName
            uint256 deathClockStart,
            uint256 deathClockExpiry,
            , // safeVault
            , // safeVaultBalance
            uint8 status,
            bool isInitialized,
            , // isFlushed
            , // flushTimestamp
              // flushTxHash
        ) = abi.decode(data, (string, string, uint256, uint256, address, uint256, uint8, bool, bool, uint256, bytes32));

        if (!isInitialized) {
            return (0, false); // INACTIVE if not initialized
        }

        isExpired = block.timestamp >= deathClockExpiry && deathClockExpiry > 0;
        snatStatus = status;

        return (snatStatus, isExpired);
    }

    /**
     * @notice Route tribute based on SNAT status
     * @param iso3166Code ISO 3166 country code
     * @param amount Amount to route
     */
    function routeTributeBasedOnSNAT(string memory iso3166Code, uint256 amount)
        internal
    {
        (uint8 snatStatus, bool isExpired) = checkSNATStatus(iso3166Code);

        bool routeToGlobal = false;

        // If SNAT is INACTIVE (0) or EXPIRED, route to Global Citizen Block
        if (snatStatus == 0 || isExpired) {
            require(
                vidaCapToken.transfer(globalCitizenBlock, amount),
                "Global citizen block transfer failed"
            );
            routeToGlobal = true;
        } else {
            // If SNAT is ACTIVE (1), route to monthly dividend pool
            currentMonthDividendPool += amount;
            require(
                vidaCapToken.transfer(monthlyDividendPool, amount),
                "Dividend pool transfer failed"
            );
        }

        emit SNATStatusChecked(iso3166Code, snatStatus, routeToGlobal);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // MONTHLY TRUTH DIVIDEND DISTRIBUTION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute monthly truth dividend to all verified citizens
     * @dev Can only be called once per 30-day interval
     */
    function distributeMonthlyDividend()
        external
        onlyRole(DIVIDEND_DISTRIBUTOR_ROLE)
        nonReentrant
    {
        require(
            block.timestamp >= lastDistributionTimestamp + DISTRIBUTION_INTERVAL,
            "Distribution interval not reached"
        );
        require(totalVerifiedCitizens > 0, "No verified citizens");
        require(currentMonthDividendPool > 0, "No dividend pool balance");

        uint256 perCitizen = currentMonthDividendPool / totalVerifiedCitizens;
        require(perCitizen > 0, "Dividend amount too small");

        uint256 totalDistributed = currentMonthDividendPool;

        // Reset pool for next month
        currentMonthDividendPool = 0;
        lastDistributionTimestamp = block.timestamp;
        totalDividendDistributed += totalDistributed;

        emit MonthlyDividendDistributed(
            totalDistributed,
            perCitizen,
            totalVerifiedCitizens,
            block.timestamp
        );
    }

    /**
     * @notice Verify a citizen for dividend eligibility
     * @param citizen Address to verify
     */
    function verifyCitizen(address citizen)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(citizen != address(0), "Invalid citizen address");
        require(!isVerifiedCitizen[citizen], "Citizen already verified");

        isVerifiedCitizen[citizen] = true;
        totalVerifiedCitizens++;

        emit CitizenVerified(citizen, block.timestamp);
    }

    /**
     * @notice Claim monthly dividend (placeholder for future implementation)
     * @dev In production, this would allow citizens to claim their share
     */
    function claimDividend() external nonReentrant {
        require(isVerifiedCitizen[msg.sender], "Not a verified citizen");
        // Implementation would calculate and transfer citizen's share
        // For now, this is a placeholder
        revert("Claim functionality not yet implemented");
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - TRANSPARENCY
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get comprehensive tribute statistics
     * @return _totalTributeCollected Total tribute collected
     * @return _totalDividendDistributed Total dividend distributed
     * @return _totalTreasuryAllocated Total treasury allocated
     * @return _totalBurned Total burned
     * @return _currentMonthDividendPool Current month dividend pool
     * @return _totalVerifiedCitizens Total verified citizens
     */
    function getTributeStats()
        external
        view
        returns (
            uint256 _totalTributeCollected,
            uint256 _totalDividendDistributed,
            uint256 _totalTreasuryAllocated,
            uint256 _totalBurned,
            uint256 _currentMonthDividendPool,
            uint256 _totalVerifiedCitizens
        )
    {
        return (
            totalTributeCollected,
            totalDividendDistributed,
            totalTreasuryAllocated,
            totalBurned,
            currentMonthDividendPool,
            totalVerifiedCitizens
        );
    }

    /**
     * @notice Get current dividend pool balance
     * @return Current month dividend pool balance
     */
    function getDividendPoolBalance() external view returns (uint256) {
        return currentMonthDividendPool;
    }

    /**
     * @notice Get estimated dividend amount per citizen
     * @return Estimated dividend per citizen (0 if no citizens)
     */
    function getCitizenDividendAmount() external view returns (uint256) {
        if (totalVerifiedCitizens == 0) {
            return 0;
        }
        return currentMonthDividendPool / totalVerifiedCitizens;
    }

    /**
     * @notice Get time until next distribution
     * @return Seconds until next distribution (0 if ready)
     */
    function getTimeUntilNextDistribution() external view returns (uint256) {
        uint256 nextDistribution = lastDistributionTimestamp + DISTRIBUTION_INTERVAL;
        if (block.timestamp >= nextDistribution) {
            return 0;
        }
        return nextDistribution - block.timestamp;
    }

    /**
     * @notice Check if a citizen is verified
     * @param citizen Address to check
     * @return Whether the citizen is verified
     */
    function isCitizenVerified(address citizen) external view returns (bool) {
        return isVerifiedCitizen[citizen];
    }

    /**
     * @notice Get protocol metadata
     * @return Protocol metadata string
     */
    function getProtocolMetadata() external pure returns (string memory) {
        return PROTOCOL_METADATA;
    }

    /**
     * @notice Get tribute rate in basis points
     * @return Tribute rate (100 = 1%)
     */
    function getTributeRate() external pure returns (uint256) {
        return TRIBUTE_RATE_BPS;
    }

    /**
     * @notice Get revenue split percentages
     * @return dividendBps Dividend pool percentage (5000 = 50%)
     * @return treasuryBps Treasury percentage (2500 = 25%)
     * @return burnBps Burn percentage (2500 = 25%)
     */
    function getRevenueSplit()
        external
        pure
        returns (
            uint256 dividendBps,
            uint256 treasuryBps,
            uint256 burnBps
        )
    {
        return (DIVIDEND_POOL_BPS, TREASURY_BPS, BURN_BPS);
    }

    /**
     * @notice Calculate tribute amount for a given transfer
     * @param amount Transfer amount
     * @return tributeAmount Calculated tribute (1% of amount)
     */
    function calculateTribute(uint256 amount) external pure returns (uint256 tributeAmount) {
        return (amount * TRIBUTE_RATE_BPS) / BPS_DENOMINATOR;
    }

    /**
     * @notice Get contract addresses
     * @return _vidaCapToken VIDA Cap token address
     * @return _snatDeathClock SNAT Death Clock address
     * @return _monthlyDividendPool Monthly dividend pool address
     * @return _protocolTreasury Protocol treasury address
     * @return _globalCitizenBlock Global citizen block address
     */
    function getContractAddresses()
        external
        view
        returns (
            address _vidaCapToken,
            address _snatDeathClock,
            address _monthlyDividendPool,
            address _protocolTreasury,
            address _globalCitizenBlock
        )
    {
        return (
            address(vidaCapToken),
            snatDeathClock,
            monthlyDividendPool,
            protocolTreasury,
            globalCitizenBlock
        );
    }
}

/**
 * @title ISNATDeathClock
 * @notice Interface for SNAT Death Clock contract
 */
interface ISNATDeathClock {
    function getNationDeathClock(string memory iso3166Code)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            address,
            uint256,
            uint8,
            bool,
            bool,
            uint256,
            bytes32
        );
}

