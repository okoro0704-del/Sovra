// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MinorTrust - Time-Locked Vault for Minors
 * @notice Protects 50% of minor's dividends until age 18
 * @dev Time-locked vault with VLT age verification
 *      - Receives 50% of dividends for citizens < 18 years
 *      - Funds strictly non-withdrawable until VLT confirms age 18
 *      - Guardian view-only access
 *      - Automatic release on 18th birthday
 * 
 * Born in Lagos, Nigeria. Protecting the Next Generation.
 */
contract MinorTrust is AccessControl, ReentrancyGuard {
    // ============ INTERFACES ============
    
    IERC20 public nVidaToken;
    
    // ============ CONSTANTS ============
    
    bytes32 public constant VLT_ORACLE_ROLE = keccak256("VLT_ORACLE_ROLE");
    bytes32 public constant DIVIDEND_POOL_ROLE = keccak256("DIVIDEND_POOL_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    
    uint256 public constant MAJORITY_AGE = 18; // Age of majority
    
    // ============ STATE VARIABLES ============
    
    address public dividendPoolContract;
    
    // Minor trust accounts
    mapping(address => MinorAccount) public minorAccounts;
    uint256 public totalMinorsProtected;
    uint256 public totalFundsLocked;
    uint256 public totalFundsReleased;
    
    struct MinorAccount {
        uint256 balance; // Locked nVIDA balance
        uint256 totalDeposited; // Total deposited over time
        uint256 totalWithdrawn; // Total withdrawn after age 18
        uint256 currentAge; // Current age (updated by VLT)
        uint256 unlockTimestamp; // Estimated unlock time (18th birthday)
        bool isActive; // Account is active
        address guardian; // Legal guardian address
        uint256 lastDepositTime;
        uint256 lastAgeUpdate;
    }
    
    // Guardian tracking
    mapping(address => address[]) public guardianMinors; // Guardian -> list of minors
    
    // ============ EVENTS ============
    
    event MinorAccountCreated(address indexed minor, address indexed guardian, uint256 age);
    event FundsDeposited(address indexed minor, uint256 amount, uint256 newBalance);
    event AgeUpdated(address indexed minor, uint256 oldAge, uint256 newAge, bool unlocked);
    event FundsReleased(address indexed minor, uint256 amount, uint256 remainingBalance);
    event GuardianUpdated(address indexed minor, address indexed oldGuardian, address indexed newGuardian);
    event EmergencyWithdrawal(address indexed minor, uint256 amount, string reason);
    
    // ============ ERRORS ============
    
    error NotMinor();
    error StillMinor();
    error InsufficientBalance();
    error UnauthorizedGuardian();
    error AccountNotActive();
    error InvalidAge();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _nVidaToken,
        address _dividendPoolContract
    ) {
        require(_nVidaToken != address(0), "Invalid nVIDA token");
        require(_dividendPoolContract != address(0), "Invalid dividend pool");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VLT_ORACLE_ROLE, msg.sender);
        _grantRole(DIVIDEND_POOL_ROLE, _dividendPoolContract);
        
        nVidaToken = IERC20(_nVidaToken);
        dividendPoolContract = _dividendPoolContract;
    }
    
    // ============ ACCOUNT MANAGEMENT ============
    
    /**
     * @notice Create minor account (called by DividendPool on first deposit)
     * @param minor Address of minor
     * @param age Current age of minor
     * @param guardian Legal guardian address
     */
    function createMinorAccount(
        address minor,
        uint256 age,
        address guardian
    ) external onlyRole(DIVIDEND_POOL_ROLE) {
        require(minor != address(0), "Invalid minor address");
        require(age < MAJORITY_AGE, "Not a minor");
        require(guardian != address(0), "Invalid guardian");
        require(!minorAccounts[minor].isActive, "Account already exists");
        
        // Calculate estimated unlock timestamp (simplified - assumes 1 year = 365 days)
        uint256 yearsUntil18 = MAJORITY_AGE - age;
        uint256 unlockTimestamp = block.timestamp + (yearsUntil18 * 365 days);
        
        minorAccounts[minor] = MinorAccount({
            balance: 0,
            totalDeposited: 0,
            totalWithdrawn: 0,
            currentAge: age,
            unlockTimestamp: unlockTimestamp,
            isActive: true,
            guardian: guardian,
            lastDepositTime: block.timestamp,
            lastAgeUpdate: block.timestamp
        });
        
        // Track guardian relationship
        guardianMinors[guardian].push(minor);
        totalMinorsProtected++;
        
        emit MinorAccountCreated(minor, guardian, age);
    }
    
    /**
     * @notice Deposit funds to minor's trust (called by DividendPool)
     * @param minor Address of minor
     * @param amount Amount to deposit
     */
    function deposit(address minor, uint256 amount) external onlyRole(DIVIDEND_POOL_ROLE) nonReentrant {
        require(amount > 0, "Cannot deposit zero");
        
        MinorAccount storage account = minorAccounts[minor];
        
        // Create account if doesn't exist (with default guardian as admin)
        if (!account.isActive) {
            createMinorAccount(minor, 17, msg.sender); // Default age 17, will be updated by VLT
            account = minorAccounts[minor];
        }
        
        // Transfer nVIDA from DividendPool
        require(nVidaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update account
        account.balance += amount;
        account.totalDeposited += amount;
        account.lastDepositTime = block.timestamp;
        
        totalFundsLocked += amount;

        emit FundsDeposited(minor, amount, account.balance);
    }

    // ============ AGE VERIFICATION (VLT ORACLE) ============

    /**
     * @notice Update minor's age (called by VLT oracle)
     * @param minor Address of minor
     * @param newAge New verified age
     * @dev Automatically unlocks funds when age reaches 18
     */
    function updateAge(address minor, uint256 newAge) external onlyRole(VLT_ORACLE_ROLE) {
        MinorAccount storage account = minorAccounts[minor];

        if (!account.isActive) revert AccountNotActive();

        uint256 oldAge = account.currentAge;
        require(newAge >= oldAge, "Age cannot decrease");

        account.currentAge = newAge;
        account.lastAgeUpdate = block.timestamp;

        bool unlocked = false;

        // Check if minor has reached majority age
        if (newAge >= MAJORITY_AGE && oldAge < MAJORITY_AGE) {
            account.unlockTimestamp = block.timestamp; // Unlock immediately
            unlocked = true;
        }

        emit AgeUpdated(minor, oldAge, newAge, unlocked);
    }

    /**
     * @notice Batch update ages (for efficiency)
     */
    function batchUpdateAges(
        address[] calldata minors,
        uint256[] calldata ages
    ) external onlyRole(VLT_ORACLE_ROLE) {
        require(minors.length == ages.length, "Length mismatch");

        for (uint256 i = 0; i < minors.length; i++) {
            updateAge(minors[i], ages[i]);
        }
    }

    // ============ WITHDRAWAL (AGE 18+) ============

    /**
     * @notice Withdraw funds (only available at age 18+)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        MinorAccount storage account = minorAccounts[msg.sender];

        if (!account.isActive) revert AccountNotActive();
        if (account.currentAge < MAJORITY_AGE) revert StillMinor();
        if (amount > account.balance) revert InsufficientBalance();

        account.balance -= amount;
        account.totalWithdrawn += amount;

        totalFundsLocked -= amount;
        totalFundsReleased += amount;

        require(nVidaToken.transfer(msg.sender, amount), "Transfer failed");

        emit FundsReleased(msg.sender, amount, account.balance);
    }

    /**
     * @notice Withdraw all available funds
     */
    function withdrawAll() external nonReentrant {
        MinorAccount storage account = minorAccounts[msg.sender];

        if (!account.isActive) revert AccountNotActive();
        if (account.currentAge < MAJORITY_AGE) revert StillMinor();

        uint256 amount = account.balance;
        if (amount == 0) revert InsufficientBalance();

        account.balance = 0;
        account.totalWithdrawn += amount;

        totalFundsLocked -= amount;
        totalFundsReleased += amount;

        require(nVidaToken.transfer(msg.sender, amount), "Transfer failed");

        emit FundsReleased(msg.sender, amount, 0);
    }

    // ============ GUARDIAN FUNCTIONS ============

    /**
     * @notice Update guardian for a minor
     * @param minor Address of minor
     * @param newGuardian New guardian address
     */
    function updateGuardian(address minor, address newGuardian) external {
        MinorAccount storage account = minorAccounts[minor];

        require(msg.sender == account.guardian || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized");
        require(newGuardian != address(0), "Invalid guardian");

        address oldGuardian = account.guardian;
        account.guardian = newGuardian;

        // Update guardian tracking
        guardianMinors[newGuardian].push(minor);

        emit GuardianUpdated(minor, oldGuardian, newGuardian);
    }

    /**
     * @notice Get minors under guardian's care
     */
    function getGuardianMinors(address guardian) external view returns (address[] memory) {
        return guardianMinors[guardian];
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get minor account details
     */
    function getMinorAccount(address minor) external view returns (
        uint256 balance,
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        uint256 currentAge,
        uint256 unlockTimestamp,
        bool isActive,
        address guardian,
        bool canWithdraw
    ) {
        MinorAccount storage account = minorAccounts[minor];
        return (
            account.balance,
            account.totalDeposited,
            account.totalWithdrawn,
            account.currentAge,
            account.unlockTimestamp,
            account.isActive,
            account.guardian,
            account.currentAge >= MAJORITY_AGE
        );
    }

    /**
     * @notice Get trust statistics
     */
    function getTrustStats() external view returns (
        uint256 minorsProtected,
        uint256 fundsLocked,
        uint256 fundsReleased,
        uint256 totalProtected
    ) {
        return (
            totalMinorsProtected,
            totalFundsLocked,
            totalFundsReleased,
            totalFundsLocked + totalFundsReleased
        );
    }

    /**
     * @notice Check if minor can withdraw
     */
    function canWithdraw(address minor) external view returns (bool) {
        MinorAccount storage account = minorAccounts[minor];
        return account.isActive && account.currentAge >= MAJORITY_AGE && account.balance > 0;
    }

    /**
     * @notice Get time until unlock
     */
    function getTimeUntilUnlock(address minor) external view returns (uint256) {
        MinorAccount storage account = minorAccounts[minor];

        if (account.currentAge >= MAJORITY_AGE) return 0;
        if (block.timestamp >= account.unlockTimestamp) return 0;

        return account.unlockTimestamp - block.timestamp;
    }

    // ============ EMERGENCY FUNCTIONS ============

    /**
     * @notice Emergency withdrawal (admin only, with reason)
     * @param minor Address of minor
     * @param amount Amount to withdraw
     * @param reason Reason for emergency withdrawal
     */
    function emergencyWithdraw(
        address minor,
        uint256 amount,
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        MinorAccount storage account = minorAccounts[minor];

        require(amount <= account.balance, "Insufficient balance");

        account.balance -= amount;
        totalFundsLocked -= amount;

        require(nVidaToken.transfer(minor, amount), "Transfer failed");

        emit EmergencyWithdrawal(minor, amount, reason);
    }
}

