// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NsovStablecoin - Naira-Sovereign Stablecoin
 * @notice NSOV - 1:1 Peg to Nigerian Naira (NGN)
 * @dev Fiat-backed stablecoin with Central Bank reserve validation
 *      - Mint: Only when physical Naira reserves are verified
 *      - Burn: Redeemable for physical Naira from reserves
 *      - Reserve Oracle: Central Bank of Nigeria integration
 *      - Use Case: Foreign entity onboarding and local commerce
 * 
 * Born in Lagos, Nigeria. Backed by the Central Bank.
 */
contract NsovStablecoin is ERC20, AccessControl, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant RESERVE_ORACLE_ROLE = keccak256("RESERVE_ORACLE_ROLE");
    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    
    uint256 public constant RESERVE_RATIO_REQUIRED = 100; // 100% = 1:1 peg
    
    // ============ STATE VARIABLES ============
    
    // Central Bank reserve tracking (in Naira kobo, 2 decimals)
    uint256 public totalReservesNaira; // Stored in kobo (1 NGN = 100 kobo)
    
    // Reserve validation
    bool public reserveValidationEnabled;
    address public centralBankOracle;
    
    // Minting/burning tracking
    uint256 public totalMinted;
    uint256 public totalBurned;
    
    // ============ EVENTS ============
    
    event ReserveDeposited(uint256 amountNaira, uint256 newTotalReserves, address indexed depositor);
    event ReserveWithdrawn(uint256 amountNaira, uint256 newTotalReserves, address indexed withdrawer);
    event NsovMinted(address indexed to, uint256 amount, uint256 reservesUsed);
    event NsovBurned(address indexed from, uint256 amount, uint256 reservesReleased);
    event ReserveOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event ReserveValidationToggled(bool enabled);
    
    // ============ ERRORS ============
    
    error InsufficientReserves(uint256 required, uint256 available);
    error ReserveValidationFailed();
    error InvalidReserveAmount();
    error UnauthorizedOracle();
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _centralBankOracle) ERC20("Naira-Sovereign", "NSOV") {
        require(_centralBankOracle != address(0), "Invalid oracle address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(RESERVE_ORACLE_ROLE, _centralBankOracle);
        _grantRole(RESERVE_MANAGER_ROLE, msg.sender);
        
        centralBankOracle = _centralBankOracle;
        reserveValidationEnabled = true;
    }
    
    // ============ RESERVE MANAGEMENT ============
    
    /**
     * @notice Deposit Naira reserves to back NSOV minting
     * @param amountNaira Amount in Naira (with 2 decimals, e.g., 100 = 1.00 NGN)
     * @dev Called by Central Bank when physical Naira is deposited
     */
    function depositReserves(uint256 amountNaira) external onlyRole(RESERVE_MANAGER_ROLE) nonReentrant {
        require(amountNaira > 0, "Cannot deposit zero");
        
        totalReservesNaira += amountNaira;
        
        emit ReserveDeposited(amountNaira, totalReservesNaira, msg.sender);
    }
    
    /**
     * @notice Withdraw Naira reserves (when NSOV is burned/redeemed)
     * @param amountNaira Amount in Naira (with 2 decimals)
     */
    function withdrawReserves(uint256 amountNaira) external onlyRole(RESERVE_MANAGER_ROLE) nonReentrant {
        require(amountNaira > 0, "Cannot withdraw zero");
        require(totalReservesNaira >= amountNaira, "Insufficient reserves");
        
        totalReservesNaira -= amountNaira;
        
        emit ReserveWithdrawn(amountNaira, totalReservesNaira, msg.sender);
    }
    
    // ============ MINTING & BURNING ============
    
    /**
     * @notice Mint NSOV tokens (requires 1:1 Naira reserves)
     * @param to Recipient address
     * @param amount Amount of NSOV to mint (18 decimals)
     * @dev Validates that sufficient Naira reserves exist before minting
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Cannot mint zero");
        
        // Convert NSOV amount (18 decimals) to Naira kobo (2 decimals)
        // 1 NSOV = 1 NGN = 100 kobo
        uint256 requiredReservesKobo = _nsovToNairaKobo(amount);
        
        // Validate reserves if enabled
        if (reserveValidationEnabled) {
            if (totalReservesNaira < requiredReservesKobo) {
                revert InsufficientReserves(requiredReservesKobo, totalReservesNaira);
            }
        }
        
        _mint(to, amount);
        totalMinted += amount;
        
        emit NsovMinted(to, amount, requiredReservesKobo);
    }
    
    /**
     * @notice Burn NSOV tokens (releases Naira reserves for redemption)
     * @param amount Amount of NSOV to burn (18 decimals)
     */
    function burn(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot burn zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 reservesToRelease = _nsovToNairaKobo(amount);

        _burn(msg.sender, amount);
        totalBurned += amount;

        emit NsovBurned(msg.sender, amount, reservesToRelease);
    }

    /**
     * @notice Burn NSOV from a specific address (for authorized burning)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) nonReentrant {
        require(amount > 0, "Cannot burn zero");
        require(balanceOf(from) >= amount, "Insufficient balance");

        uint256 reservesToRelease = _nsovToNairaKobo(amount);

        _burn(from, amount);
        totalBurned += amount;

        emit NsovBurned(from, amount, reservesToRelease);
    }

    // ============ RESERVE VALIDATION ============

    /**
     * @notice Update Central Bank oracle address
     * @param newOracle New oracle address
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
     * @param enabled Whether to enable reserve validation
     */
    function setReserveValidation(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reserveValidationEnabled = enabled;
        emit ReserveValidationToggled(enabled);
    }

    // ============ INTERNAL HELPERS ============

    /**
     * @notice Convert NSOV amount (18 decimals) to Naira kobo (2 decimals)
     * @param nsovAmount Amount in NSOV (18 decimals)
     * @return Amount in Naira kobo (2 decimals)
     * @dev 1 NSOV = 1 NGN = 100 kobo
     *      Example: 1 NSOV (1e18) = 100 kobo (100)
     */
    function _nsovToNairaKobo(uint256 nsovAmount) internal pure returns (uint256) {
        // NSOV has 18 decimals, Naira kobo has 2 decimals
        // 1 NSOV (1 * 10^18) = 1 NGN = 100 kobo
        // So we divide by 10^16 to convert from 18 decimals to 2 decimals
        return nsovAmount / 1e16;
    }

    /**
     * @notice Convert Naira kobo (2 decimals) to NSOV amount (18 decimals)
     * @param nairaKobo Amount in Naira kobo (2 decimals)
     * @return Amount in NSOV (18 decimals)
     */
    function _nairaKoboToNsov(uint256 nairaKobo) internal pure returns (uint256) {
        // Reverse conversion: multiply by 10^16
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

        uint256 requiredReserves = _nsovToNairaKobo(supply);
        if (requiredReserves == 0) return 0;

        return (totalReservesNaira * 100) / requiredReserves;
    }

    /**
     * @notice Get available minting capacity based on reserves
     * @return Maximum NSOV that can be minted with current reserves
     */
    function getAvailableMintingCapacity() external view returns (uint256) {
        uint256 currentSupply = totalSupply();
        uint256 requiredReserves = _nsovToNairaKobo(currentSupply);

        if (totalReservesNaira <= requiredReserves) {
            return 0;
        }

        uint256 excessReserves = totalReservesNaira - requiredReserves;
        return _nairaKoboToNsov(excessReserves);
    }

    /**
     * @notice Get total reserves in Naira (human-readable)
     * @return Reserves in NGN (2 decimals)
     */
    function getTotalReservesNaira() external view returns (uint256) {
        return totalReservesNaira;
    }

    /**
     * @notice Check if reserves are sufficient for a given mint amount
     * @param amount Amount of NSOV to check
     * @return Whether reserves are sufficient
     */
    function hassufficientReserves(uint256 amount) external view returns (bool) {
        uint256 requiredReserves = _nsovToNairaKobo(amount);
        return totalReservesNaira >= requiredReserves;
    }

    // ============ DECIMAL OVERRIDE ============

    /**
     * @notice NSOV uses 18 decimals (same as VIDA for compatibility)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

