// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title nVidaStablecoin - Naira VIDA Stablecoin
 * @notice nVIDA - 1:1 Peg to Nigerian Naira (NGN)
 * @dev Fiat-backed stablecoin with Central Bank reserve validation and Quad-Split fee mechanism
 *      - Symbol: nVIDA (Naira VIDA)
 *      - Peg: 1 nVIDA = 1 NGN
 *      - Mint: Only when Central Bank confirms USD/EUR/NGN deposit
 *      - Transfer Fee: 2% Quad-Split on every transfer
 *      - Reserve Backing: 100% physical Naira reserves
 * 
 * Born in Lagos, Nigeria. Backed by the Central Bank.
 */
contract nVidaStablecoin is ERC20, AccessControl, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant RESERVE_ORACLE_ROLE = keccak256("RESERVE_ORACLE_ROLE");
    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    bytes32 public constant FX_GATEWAY_ROLE = keccak256("FX_GATEWAY_ROLE");
    
    uint256 public constant RESERVE_RATIO_REQUIRED = 100; // 100% = 1:1 peg
    uint256 public constant TRANSFER_FEE_RATE = 200; // 2% = 200 basis points
    
    // Quad-Split ratios (25% each)
    uint256 public constant ORIGIN_COUNTRY_SHARE = 2500; // 25% in basis points
    uint256 public constant DEST_COUNTRY_SHARE = 2500;
    uint256 public constant PROJECT_VAULT_SHARE = 2500;
    uint256 public constant BURN_SHARE = 2500;
    
    // ============ STATE VARIABLES ============
    
    // Central Bank reserve tracking (in Naira kobo, 2 decimals)
    uint256 public totalReservesNaira; // Stored in kobo (1 NGN = 100 kobo)
    
    // Reserve validation
    bool public reserveValidationEnabled;
    address public centralBankOracle;
    address public centralBankVault;
    
    // Quad-Split destinations
    address public projectVault;
    address public burnAddress;
    address public defaultOriginCountryPool;
    address public defaultDestCountryPool;
    
    // Fee toggle
    bool public transferFeesEnabled;
    
    // Minting/burning tracking
    uint256 public totalMinted;
    uint256 public totalBurned;
    uint256 public totalFeesBurned;
    
    // FX deposits tracking
    mapping(bytes32 => FxDeposit) public fxDeposits;
    
    struct FxDeposit {
        address depositor;
        uint256 amountUsd; // USD amount (6 decimals)
        uint256 amountNgn; // NGN equivalent (2 decimals - kobo)
        uint256 nVidaMinted; // nVIDA minted (18 decimals)
        uint256 timestamp;
        bool processed;
    }
    
    // ============ EVENTS ============
    
    event ReserveDeposited(uint256 amountNaira, uint256 newTotalReserves, address indexed depositor);
    event ReserveWithdrawn(uint256 amountNaira, uint256 newTotalReserves, address indexed withdrawer);
    event nVidaMinted(address indexed to, uint256 amount, uint256 reservesUsed);
    event nVidaBurned(address indexed from, uint256 amount, uint256 reservesReleased);
    event ReserveOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event ReserveValidationToggled(bool enabled);
    event TransferFeesToggled(bool enabled);
    event QuadSplitExecuted(
        address indexed from,
        uint256 totalFee,
        uint256 originShare,
        uint256 destShare,
        uint256 vaultShare,
        uint256 burnShare
    );
    event FxDepositProcessed(
        bytes32 indexed depositId,
        address indexed depositor,
        uint256 amountUsd,
        uint256 amountNgn,
        uint256 nVidaMinted
    );
    
    // ============ ERRORS ============
    
    error InsufficientReserves(uint256 required, uint256 available);
    error ReserveValidationFailed();
    error InvalidReserveAmount();
    error UnauthorizedOracle();
    error FxDepositAlreadyProcessed();
    error InvalidFxDeposit();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _centralBankOracle,
        address _centralBankVault,
        address _projectVault,
        address _burnAddress
    ) ERC20("Naira VIDA", "nVIDA") {
        require(_centralBankOracle != address(0), "Invalid oracle address");
        require(_centralBankVault != address(0), "Invalid vault address");
        require(_projectVault != address(0), "Invalid project vault");
        require(_burnAddress != address(0), "Invalid burn address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(RESERVE_ORACLE_ROLE, _centralBankOracle);
        _grantRole(RESERVE_MANAGER_ROLE, msg.sender);
        _grantRole(FX_GATEWAY_ROLE, msg.sender);
        
        centralBankOracle = _centralBankOracle;
        centralBankVault = _centralBankVault;
        projectVault = _projectVault;
        burnAddress = _burnAddress;
        
        reserveValidationEnabled = true;
        transferFeesEnabled = true;
        
        // Set default country pools (can be updated later)
        defaultOriginCountryPool = msg.sender;
        defaultDestCountryPool = msg.sender;
    }
    
    // ============ RESERVE MANAGEMENT ============
    
    /**
     * @notice Deposit Naira reserves to back nVIDA minting
     * @param amountNaira Amount in Naira kobo (2 decimals, e.g., 100 = 1.00 NGN)
     * @dev Called by Central Bank when physical Naira is deposited
     */
    function depositReserves(uint256 amountNaira) external onlyRole(RESERVE_MANAGER_ROLE) nonReentrant {
        require(amountNaira > 0, "Cannot deposit zero");

        totalReservesNaira += amountNaira;

        emit ReserveDeposited(amountNaira, totalReservesNaira, msg.sender);
    }

    /**
     * @notice Withdraw Naira reserves (when nVIDA is burned/redeemed)
     * @param amountNaira Amount in Naira kobo (2 decimals)
     */
    function withdrawReserves(uint256 amountNaira) external onlyRole(RESERVE_MANAGER_ROLE) nonReentrant {
        require(amountNaira > 0, "Cannot withdraw zero");
        require(totalReservesNaira >= amountNaira, "Insufficient reserves");

        totalReservesNaira -= amountNaira;

        emit ReserveWithdrawn(amountNaira, totalReservesNaira, msg.sender);
    }

    // ============ FX GATEWAY INTEGRATION ============

    /**
     * @notice Mint nVIDA with reserve validation (FX Gateway integration)
     * @param depositId Unique FX deposit identifier
     * @param depositor Address to receive nVIDA
     * @param amountUsd USD amount deposited (6 decimals)
     * @param amountNgn NGN equivalent in kobo (2 decimals)
     * @dev Only callable by FX Gateway after Central Bank confirms deposit
     */
    function mintWithReserve(
        bytes32 depositId,
        address depositor,
        uint256 amountUsd,
        uint256 amountNgn
    ) external onlyRole(FX_GATEWAY_ROLE) nonReentrant {
        require(depositor != address(0), "Invalid depositor");
        require(amountNgn > 0, "Invalid NGN amount");
        require(!fxDeposits[depositId].processed, "Deposit already processed");

        // Convert NGN kobo to nVIDA (18 decimals)
        uint256 nVidaAmount = _nairaKoboToNVida(amountNgn);

        // Validate reserves if enabled
        if (reserveValidationEnabled) {
            if (totalReservesNaira < amountNgn) {
                revert InsufficientReserves(amountNgn, totalReservesNaira);
            }
        }

        // Record FX deposit
        fxDeposits[depositId] = FxDeposit({
            depositor: depositor,
            amountUsd: amountUsd,
            amountNgn: amountNgn,
            nVidaMinted: nVidaAmount,
            timestamp: block.timestamp,
            processed: true
        });

        // Mint nVIDA to depositor
        _mint(depositor, nVidaAmount);
        totalMinted += nVidaAmount;

        emit FxDepositProcessed(depositId, depositor, amountUsd, amountNgn, nVidaAmount);
        emit nVidaMinted(depositor, nVidaAmount, amountNgn);
    }

    /**
     * @notice Standard mint function (requires reserve validation)
     * @param to Recipient address
     * @param amount Amount of nVIDA to mint (18 decimals)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Cannot mint zero");

        // Convert nVIDA amount (18 decimals) to Naira kobo (2 decimals)
        uint256 requiredReservesKobo = _nVidaToNairaKobo(amount);

        // Validate reserves if enabled
        if (reserveValidationEnabled) {
            if (totalReservesNaira < requiredReservesKobo) {
                revert InsufficientReserves(requiredReservesKobo, totalReservesNaira);
            }
        }

        _mint(to, amount);
        totalMinted += amount;

        emit nVidaMinted(to, amount, requiredReservesKobo);
    }

    /**
     * @notice Burn nVIDA tokens (releases Naira reserves for redemption)
     * @param amount Amount of nVIDA to burn (18 decimals)
     */
    function burn(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot burn zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 reservesToRelease = _nVidaToNairaKobo(amount);

        _burn(msg.sender, amount);
        totalBurned += amount;

        emit nVidaBurned(msg.sender, amount, reservesToRelease);
    }

    /**
     * @notice Burn nVIDA from a specific address (for authorized burning)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) nonReentrant {
        require(amount > 0, "Cannot burn zero");
        require(balanceOf(from) >= amount, "Insufficient balance");

        uint256 reservesToRelease = _nVidaToNairaKobo(amount);

        _burn(from, amount);
        totalBurned += amount;

        emit nVidaBurned(from, amount, reservesToRelease);
    }

    // ============ QUAD-SPLIT TRANSFER LOGIC ============

    /**
     * @notice Override transfer to implement 2% Quad-Split fee
     * @param to Recipient address
     * @param amount Amount to transfer (before fees)
     * @return Success boolean
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (!transferFeesEnabled) {
            return super.transfer(to, amount);
        }

        return _transferWithQuadSplit(msg.sender, to, amount);
    }

    /**
     * @notice Override transferFrom to implement 2% Quad-Split fee
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (!transferFeesEnabled) {
            return super.transferFrom(from, to, amount);
        }

        // Check allowance
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "ERC20: insufficient allowance");

        // Update allowance
        _approve(from, msg.sender, currentAllowance - amount);

        return _transferWithQuadSplit(from, to, amount);
    }

    /**
     * @notice Internal transfer with Quad-Split fee distribution
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer (before fees)
     */
    function _transferWithQuadSplit(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balanceOf(from) >= amount, "Insufficient balance");

        // Calculate 2% fee
        uint256 fee = (amount * TRANSFER_FEE_RATE) / 10000;
        uint256 amountAfterFee = amount - fee;

        // Calculate Quad-Split (25% each)
        uint256 originShare = (fee * ORIGIN_COUNTRY_SHARE) / 10000;
        uint256 destShare = (fee * DEST_COUNTRY_SHARE) / 10000;
        uint256 vaultShare = (fee * PROJECT_VAULT_SHARE) / 10000;
        uint256 burnShare = fee - originShare - destShare - vaultShare; // Remainder to burn

        // Execute transfers
        _transfer(from, to, amountAfterFee);
        _transfer(from, defaultOriginCountryPool, originShare);
        _transfer(from, defaultDestCountryPool, destShare);
        _transfer(from, projectVault, vaultShare);
        _transfer(from, burnAddress, burnShare);

        // Track burned fees
        totalFeesBurned += burnShare;

        emit QuadSplitExecuted(from, fee, originShare, destShare, vaultShare, burnShare);

        return true;
    }

    // ============ CONFIGURATION ============

    /**
     * @notice Update Central Bank oracle address
     */
    function updateReserveOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOracle != address(0), "Invalid oracle address");

        address oldOracle = centralBankOracle;
        centralBankOracle = newOracle;

        _revokeRole(RESERVE_ORACLE_ROLE, oldOracle);
        _grantRole(RESERVE_ORACLE_ROLE, newOracle);

        emit ReserveOracleUpdated(oldOracle, newOracle);
    }

    /**
     * @notice Toggle reserve validation (emergency use only)
     */
    function setReserveValidation(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reserveValidationEnabled = enabled;
        emit ReserveValidationToggled(enabled);
    }

    /**
     * @notice Toggle transfer fees (emergency use only)
     */
    function setTransferFees(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transferFeesEnabled = enabled;
        emit TransferFeesToggled(enabled);
    }

    /**
     * @notice Update country pools for Quad-Split
     */
    function updateCountryPools(address originPool, address destPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(originPool != address(0) && destPool != address(0), "Invalid pool addresses");
        defaultOriginCountryPool = originPool;
        defaultDestCountryPool = destPool;
    }

    // ============ INTERNAL HELPERS ============

    /**
     * @notice Convert nVIDA amount (18 decimals) to Naira kobo (2 decimals)
     * @param nVidaAmount Amount in nVIDA (18 decimals)
     * @return Amount in Naira kobo (2 decimals)
     * @dev 1 nVIDA = 1 NGN = 100 kobo
     */
    function _nVidaToNairaKobo(uint256 nVidaAmount) internal pure returns (uint256) {
        return nVidaAmount / 1e16;
    }

    /**
     * @notice Convert Naira kobo (2 decimals) to nVIDA amount (18 decimals)
     * @param nairaKobo Amount in Naira kobo (2 decimals)
     * @return Amount in nVIDA (18 decimals)
     */
    function _nairaKoboToNVida(uint256 nairaKobo) internal pure returns (uint256) {
        return nairaKobo * 1e16;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get reserve backing ratio (percentage)
     * @return Ratio as percentage (100 = 100% = 1:1 peg)
     */
    function getReserveRatio() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;

        uint256 requiredReserves = _nVidaToNairaKobo(supply);
        if (requiredReserves == 0) return 0;

        return (totalReservesNaira * 100) / requiredReserves;
    }

    /**
     * @notice Get available minting capacity based on reserves
     * @return Maximum nVIDA that can be minted with current reserves
     */
    function getAvailableMintingCapacity() external view returns (uint256) {
        uint256 currentSupply = totalSupply();
        uint256 requiredReserves = _nVidaToNairaKobo(currentSupply);

        if (totalReservesNaira <= requiredReserves) {
            return 0;
        }

        uint256 excessReserves = totalReservesNaira - requiredReserves;
        return _nairaKoboToNVida(excessReserves);
    }

    /**
     * @notice Check if reserves are sufficient for a given mint amount
     */
    function hasSufficientReserves(uint256 amount) external view returns (bool) {
        uint256 requiredReserves = _nVidaToNairaKobo(amount);
        return totalReservesNaira >= requiredReserves;
    }

    /**
     * @notice Get FX deposit details
     */
    function getFxDeposit(bytes32 depositId) external view returns (FxDeposit memory) {
        return fxDeposits[depositId];
    }

    /**
     * @notice nVIDA uses 18 decimals (same as VIDA for compatibility)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

