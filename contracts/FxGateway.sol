// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FxGateway - Foreign Exchange Gateway
 * @notice Routes inbound foreign exchange (USD/EUR) to Sovereign Reserve and mints nVIDA
 * @dev Foreign Exchange Flow:
 *      1. Foreign entity deposits USD/EUR to Central Bank
 *      2. Central Bank confirms deposit and converts to NGN
 *      3. FxGateway validates reserve backing
 *      4. nVIDA minted to depositor's wallet
 *      5. Reserves locked in Sovereign Reserve
 * 
 * Born in Lagos, Nigeria. Gateway to the World.
 */
contract FxGateway is AccessControl, ReentrancyGuard {
    // ============ INTERFACES ============
    
    interface InVidaStablecoin {
        function mintWithReserve(
            bytes32 depositId,
            address depositor,
            uint256 amountUsd,
            uint256 amountNgn
        ) external;
        function depositReserves(uint256 amountNaira) external;
    }
    
    // ============ CONSTANTS ============
    
    bytes32 public constant CENTRAL_BANK_ROLE = keccak256("CENTRAL_BANK_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    
    // Supported currencies
    enum Currency { USD, EUR, GBP, NGN }
    
    // ============ STATE VARIABLES ============
    
    InVidaStablecoin public nVidaContract;
    address public sovereignReserve;
    address public centralBankVault;
    
    // Exchange rates (stored as rate * 1e6 for precision)
    // Example: 1 USD = 1,500 NGN → stored as 1500000000 (1500 * 1e6)
    mapping(Currency => uint256) public exchangeRates;
    
    // Deposit tracking
    mapping(bytes32 => FxDeposit) public deposits;
    uint256 public totalDepositsProcessed;
    uint256 public totalUsdDeposited; // 6 decimals
    uint256 public totalNgnConverted; // 2 decimals (kobo)
    uint256 public totalNVidaMinted; // 18 decimals
    
    struct FxDeposit {
        address depositor;
        Currency currency;
        uint256 amountForeign; // Amount in foreign currency (6 decimals)
        uint256 amountNgn; // NGN equivalent (2 decimals - kobo)
        uint256 exchangeRate; // Rate at time of deposit
        uint256 timestamp;
        bool processed;
        bytes32 centralBankTxHash; // Central Bank transaction reference
    }
    
    // ============ EVENTS ============
    
    event FxDepositReceived(
        bytes32 indexed depositId,
        address indexed depositor,
        Currency currency,
        uint256 amountForeign,
        uint256 amountNgn,
        uint256 exchangeRate
    );
    event FxDepositProcessed(
        bytes32 indexed depositId,
        address indexed depositor,
        uint256 nVidaMinted
    );
    event ExchangeRateUpdated(Currency indexed currency, uint256 oldRate, uint256 newRate);
    event ReservesRouted(uint256 amountNgn, address indexed sovereignReserve);
    
    // ============ ERRORS ============
    
    error InvalidDeposit();
    error DepositAlreadyProcessed();
    error InvalidExchangeRate();
    error UnauthorizedCentralBank();
    error InvalidCurrency();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _nVidaContract,
        address _sovereignReserve,
        address _centralBankVault
    ) {
        require(_nVidaContract != address(0), "Invalid nVIDA contract");
        require(_sovereignReserve != address(0), "Invalid sovereign reserve");
        require(_centralBankVault != address(0), "Invalid central bank vault");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CENTRAL_BANK_ROLE, _centralBankVault);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(RESERVE_MANAGER_ROLE, msg.sender);
        
        nVidaContract = InVidaStablecoin(_nVidaContract);
        sovereignReserve = _sovereignReserve;
        centralBankVault = _centralBankVault;
        
        // Initialize default exchange rates (1 USD = 1500 NGN, stored as 1500 * 1e6)
        exchangeRates[Currency.USD] = 1500 * 1e6;
        exchangeRates[Currency.EUR] = 1650 * 1e6;
        exchangeRates[Currency.GBP] = 1900 * 1e6;
        exchangeRates[Currency.NGN] = 1 * 1e6; // 1:1
    }
    
    // ============ CORE FX LOGIC ============
    
    /**
     * @notice Process foreign exchange deposit from Central Bank
     * @param depositId Unique deposit identifier
     * @param depositor Address to receive nVIDA
     * @param currency Currency type (USD, EUR, GBP)
     * @param amountForeign Amount in foreign currency (6 decimals)
     * @param centralBankTxHash Central Bank transaction reference
     * @dev Only callable by Central Bank after confirming physical deposit
     */
    function processFxDeposit(
        bytes32 depositId,
        address depositor,
        Currency currency,
        uint256 amountForeign,
        bytes32 centralBankTxHash
    ) external onlyRole(CENTRAL_BANK_ROLE) nonReentrant {
        require(depositor != address(0), "Invalid depositor");
        require(amountForeign > 0, "Invalid amount");
        require(!deposits[depositId].processed, "Deposit already processed");
        require(currency != Currency.NGN, "Use direct NGN deposit");
        
        // Get current exchange rate
        uint256 rate = exchangeRates[currency];
        require(rate > 0, "Invalid exchange rate");
        
        // Convert foreign currency to NGN kobo
        // Example: 100 USD (100 * 1e6) * 1500 (rate / 1e6) = 150,000 kobo (1,500 NGN)
        uint256 amountNgnKobo = (amountForeign * rate) / 1e6 / 1e4; // Adjust for decimals
        
        // Record deposit
        deposits[depositId] = FxDeposit({
            depositor: depositor,
            currency: currency,
            amountForeign: amountForeign,
            amountNgn: amountNgnKobo,
            exchangeRate: rate,
            timestamp: block.timestamp,
            processed: true,
            centralBankTxHash: centralBankTxHash
        });

        emit FxDepositReceived(depositId, depositor, currency, amountForeign, amountNgnKobo, rate);

        // Step 1: Route reserves to Sovereign Reserve
        nVidaContract.depositReserves(amountNgnKobo);
        emit ReservesRouted(amountNgnKobo, sovereignReserve);

        // Step 2: Mint nVIDA to depositor
        nVidaContract.mintWithReserve(depositId, depositor, amountForeign, amountNgnKobo);

        // Update tracking
        totalDepositsProcessed++;
        if (currency == Currency.USD) {
            totalUsdDeposited += amountForeign;
        }
        totalNgnConverted += amountNgnKobo;

        // Calculate nVIDA minted (1 NGN = 1 nVIDA)
        uint256 nVidaMinted = _nairaKoboToNVida(amountNgnKobo);
        totalNVidaMinted += nVidaMinted;

        emit FxDepositProcessed(depositId, depositor, nVidaMinted);
    }

    /**
     * @notice Process direct NGN deposit (for Nigerian entities)
     * @param depositId Unique deposit identifier
     * @param depositor Address to receive nVIDA
     * @param amountNgnKobo Amount in Naira kobo (2 decimals)
     * @param centralBankTxHash Central Bank transaction reference
     */
    function processNgnDeposit(
        bytes32 depositId,
        address depositor,
        uint256 amountNgnKobo,
        bytes32 centralBankTxHash
    ) external onlyRole(CENTRAL_BANK_ROLE) nonReentrant {
        require(depositor != address(0), "Invalid depositor");
        require(amountNgnKobo > 0, "Invalid amount");
        require(!deposits[depositId].processed, "Deposit already processed");

        // Record deposit
        deposits[depositId] = FxDeposit({
            depositor: depositor,
            currency: Currency.NGN,
            amountForeign: amountNgnKobo,
            amountNgn: amountNgnKobo,
            exchangeRate: 1 * 1e6, // 1:1
            timestamp: block.timestamp,
            processed: true,
            centralBankTxHash: centralBankTxHash
        });

        emit FxDepositReceived(depositId, depositor, Currency.NGN, amountNgnKobo, amountNgnKobo, 1 * 1e6);

        // Route reserves and mint nVIDA
        nVidaContract.depositReserves(amountNgnKobo);
        emit ReservesRouted(amountNgnKobo, sovereignReserve);

        nVidaContract.mintWithReserve(depositId, depositor, amountNgnKobo, amountNgnKobo);

        // Update tracking
        totalDepositsProcessed++;
        totalNgnConverted += amountNgnKobo;

        uint256 nVidaMinted = _nairaKoboToNVida(amountNgnKobo);
        totalNVidaMinted += nVidaMinted;

        emit FxDepositProcessed(depositId, depositor, nVidaMinted);
    }

    // ============ ORACLE MANAGEMENT ============

    /**
     * @notice Update exchange rate for a currency
     * @param currency Currency to update
     * @param newRate New exchange rate (rate * 1e6)
     * @dev Example: 1 USD = 1500 NGN → newRate = 1500000000 (1500 * 1e6)
     */
    function updateExchangeRate(Currency currency, uint256 newRate) external onlyRole(ORACLE_ROLE) {
        require(newRate > 0, "Invalid rate");

        uint256 oldRate = exchangeRates[currency];
        exchangeRates[currency] = newRate;

        emit ExchangeRateUpdated(currency, oldRate, newRate);
    }

    /**
     * @notice Batch update exchange rates
     */
    function updateExchangeRates(
        Currency[] calldata currencies,
        uint256[] calldata rates
    ) external onlyRole(ORACLE_ROLE) {
        require(currencies.length == rates.length, "Length mismatch");

        for (uint256 i = 0; i < currencies.length; i++) {
            require(rates[i] > 0, "Invalid rate");

            uint256 oldRate = exchangeRates[currencies[i]];
            exchangeRates[currencies[i]] = rates[i];

            emit ExchangeRateUpdated(currencies[i], oldRate, rates[i]);
        }
    }

    // ============ INTERNAL HELPERS ============

    /**
     * @notice Convert Naira kobo (2 decimals) to nVIDA (18 decimals)
     */
    function _nairaKoboToNVida(uint256 nairaKobo) internal pure returns (uint256) {
        return nairaKobo * 1e16;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get deposit details
     */
    function getDeposit(bytes32 depositId) external view returns (FxDeposit memory) {
        return deposits[depositId];
    }

    /**
     * @notice Get current exchange rate for a currency
     * @return Rate as (rate * 1e6)
     */
    function getExchangeRate(Currency currency) external view returns (uint256) {
        return exchangeRates[currency];
    }

    /**
     * @notice Preview nVIDA amount for a foreign currency deposit
     * @param currency Currency type
     * @param amountForeign Amount in foreign currency (6 decimals)
     * @return nVIDA amount (18 decimals)
     */
    function previewNVidaMint(Currency currency, uint256 amountForeign) external view returns (uint256) {
        uint256 rate = exchangeRates[currency];
        require(rate > 0, "Invalid exchange rate");

        // Convert to NGN kobo
        uint256 amountNgnKobo = (amountForeign * rate) / 1e6 / 1e4;

        // Convert to nVIDA
        return _nairaKoboToNVida(amountNgnKobo);
    }

    /**
     * @notice Get total statistics
     */
    function getStatistics() external view returns (
        uint256 depositsProcessed,
        uint256 usdDeposited,
        uint256 ngnConverted,
        uint256 nVidaMinted
    ) {
        return (
            totalDepositsProcessed,
            totalUsdDeposited,
            totalNgnConverted,
            totalNVidaMinted
        );
    }

    /**
     * @notice Update nVIDA contract address (emergency only)
     */
    function updateNVidaContract(address newContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newContract != address(0), "Invalid contract");
        nVidaContract = InVidaStablecoin(newContract);
    }

    /**
     * @notice Update sovereign reserve address
     */
    function updateSovereignReserve(address newReserve) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newReserve != address(0), "Invalid reserve");
        sovereignReserve = newReserve;
    }
}

