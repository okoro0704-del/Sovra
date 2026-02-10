// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VidaToken - The Elastic Pendulum Asset
 * @notice VIDA (Ѵ) - Biological Economic Operating System Currency
 * @dev Implements elastic supply with pendulum mechanics:
 *      - Initial Mint: 10 VIDA per new user until 100M users
 *      - Hard Cap: 1 Billion VIDA
 *      - Pendulum: Supply < 500M → Reactivate minting | Supply > 750M → Disable minting
 *      - Burn: 25% of all transaction fees permanently removed
 * 
 * Born in Lagos, Nigeria. Built for the World.
 */
contract VidaToken is ERC20, AccessControl, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PENDULUM_MANAGER_ROLE = keccak256("PENDULUM_MANAGER_ROLE");
    
    uint256 public constant HARD_CAP = 1_000_000_000 * 10**18; // 1 Billion VIDA
    uint256 public constant PENDULUM_FLOOR = 500_000_000 * 10**18; // 500M VIDA
    uint256 public constant PENDULUM_CEILING = 750_000_000 * 10**18; // 750M VIDA
    uint256 public constant INITIAL_USER_MINT = 10 * 10**18; // 10 VIDA per user
    uint256 public constant MAX_INITIAL_USERS = 100_000_000; // 100M users
    
    // ============ STATE VARIABLES ============
    
    enum PendulumState { MINTING_ACTIVE, MINTING_PAUSED }
    
    PendulumState public pendulumState;
    uint256 public totalUsersMinted;
    uint256 public totalBurned;
    
    mapping(address => bool) public hasReceivedInitialMint;
    
    // ============ EVENTS ============
    
    event InitialMintIssued(address indexed user, uint256 amount, uint256 totalUsers);
    event PendulumStateChanged(PendulumState oldState, PendulumState newState, uint256 currentSupply);
    event TokensBurned(address indexed burner, uint256 amount, uint256 totalBurned);
    event SupplyThresholdCrossed(string threshold, uint256 currentSupply);
    
    // ============ CONSTRUCTOR ============
    
    constructor() ERC20("Vitalia", "VIDA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PENDULUM_MANAGER_ROLE, msg.sender);
        
        pendulumState = PendulumState.MINTING_ACTIVE;
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Mint initial 10 VIDA to a new user (one-time only)
     * @param user Address of the new user
     * @dev Can only mint if:
     *      1. User hasn't received initial mint
     *      2. Total users < 100M
     *      3. Pendulum state allows minting
     *      4. Won't exceed hard cap
     */
    function mintInitialUser(address user) external onlyRole(MINTER_ROLE) nonReentrant {
        require(!hasReceivedInitialMint[user], "User already received initial mint");
        require(totalUsersMinted < MAX_INITIAL_USERS, "Max initial users reached");
        require(pendulumState == PendulumState.MINTING_ACTIVE, "Minting paused by pendulum");
        require(totalSupply() + INITIAL_USER_MINT <= HARD_CAP, "Would exceed hard cap");
        
        hasReceivedInitialMint[user] = true;
        totalUsersMinted++;
        
        _mint(user, INITIAL_USER_MINT);
        
        emit InitialMintIssued(user, INITIAL_USER_MINT, totalUsersMinted);
        
        // Check pendulum after mint
        _checkPendulum();
    }
    
    /**
     * @notice Burn tokens permanently (25% of transaction fees)
     * @param amount Amount to burn (in Vits, 18 decimals)
     */
    function burn(uint256 amount) external onlyRole(BURNER_ROLE) nonReentrant {
        require(amount > 0, "Cannot burn zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        totalBurned += amount;
        
        emit TokensBurned(msg.sender, amount, totalBurned);
        
        // Check pendulum after burn
        _checkPendulum();
    }
    
    /**
     * @notice Burn tokens from a specific address (for fee burning)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) nonReentrant {
        require(amount > 0, "Cannot burn zero");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        totalBurned += amount;
        
        emit TokensBurned(from, amount, totalBurned);
        
        // Check pendulum after burn
        _checkPendulum();
    }
    
    // ============ PENDULUM MECHANICS ============
    
    /**
     * @notice Check and update pendulum state based on current supply
     * @dev Pendulum Logic:
     *      - If supply < 500M → Reactivate minting
     *      - If supply > 750M → Disable minting
     */
    function _checkPendulum() internal {
        uint256 currentSupply = totalSupply();
        PendulumState oldState = pendulumState;

        if (currentSupply < PENDULUM_FLOOR && pendulumState == PendulumState.MINTING_PAUSED) {
            pendulumState = PendulumState.MINTING_ACTIVE;
            emit SupplyThresholdCrossed("FLOOR", currentSupply);
            emit PendulumStateChanged(oldState, pendulumState, currentSupply);
        } else if (currentSupply > PENDULUM_CEILING && pendulumState == PendulumState.MINTING_ACTIVE) {
            pendulumState = PendulumState.MINTING_PAUSED;
            emit SupplyThresholdCrossed("CEILING", currentSupply);
            emit PendulumStateChanged(oldState, pendulumState, currentSupply);
        }
    }

    /**
     * @notice Manually trigger pendulum check (for admin monitoring)
     */
    function checkPendulum() external onlyRole(PENDULUM_MANAGER_ROLE) {
        _checkPendulum();
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get current pendulum state and supply metrics
     */
    function getPendulumMetrics() external view returns (
        PendulumState state,
        uint256 currentSupply,
        uint256 distanceToFloor,
        uint256 distanceToCeiling,
        uint256 distanceToHardCap,
        bool canMint
    ) {
        currentSupply = totalSupply();
        state = pendulumState;

        distanceToFloor = currentSupply > PENDULUM_FLOOR ? 0 : PENDULUM_FLOOR - currentSupply;
        distanceToCeiling = currentSupply > PENDULUM_CEILING ? currentSupply - PENDULUM_CEILING : 0;
        distanceToHardCap = HARD_CAP - currentSupply;
        canMint = (state == PendulumState.MINTING_ACTIVE) && (currentSupply < HARD_CAP);

        return (state, currentSupply, distanceToFloor, distanceToCeiling, distanceToHardCap, canMint);
    }

    /**
     * @notice Get total burned supply
     */
    function getTotalBurned() external view returns (uint256) {
        return totalBurned;
    }

    /**
     * @notice Get circulating supply (total supply - burned)
     * @dev Note: Burned tokens are already removed from totalSupply via _burn
     */
    function getCirculatingSupply() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @notice Check if user has received initial mint
     */
    function hasUserReceivedInitialMint(address user) external view returns (bool) {
        return hasReceivedInitialMint[user];
    }

    /**
     * @notice Get remaining initial user slots
     */
    function getRemainingInitialUserSlots() external view returns (uint256) {
        return MAX_INITIAL_USERS - totalUsersMinted;
    }

    // ============ DECIMAL OVERRIDE ============

    /**
     * @notice VIDA uses 18 decimals (Vits)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

