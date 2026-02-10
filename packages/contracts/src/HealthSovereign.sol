// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * HealthSovereign.sol
 * 
 * Automated Health-Stake System
 * 
 * Logic:
 * - Automatically deduct 1% of monthly Citizen Dividend
 * - Route to Global Medical Reserve
 * - Every Vitalized UID marked as 'Active_Health_Status' by default
 * 
 * "Your heartbeat funds your healthcare. Automatically."
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IDividendPool {
    function getUserMonthlyDividend(address user) external view returns (uint256);
}

contract HealthSovereign is Ownable, ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    /// @notice Global Medical Reserve balance (in nVIDA)
    uint256 public globalMedicalReserve;
    
    /// @notice Health-Stake deduction rate (1% = 100 basis points)
    uint256 public constant HEALTH_STAKE_RATE = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;
    
    /// @notice Dividend Pool contract
    IDividendPool public dividendPool;
    
    /// @notice User health status
    enum HealthStatus {
        INACTIVE,           // Not registered
        ACTIVE,             // Active coverage
        SUSPENDED,          // Temporarily suspended
        EMERGENCY_OVERRIDE  // Emergency access granted
    }
    
    /// @notice User health record
    struct HealthRecord {
        HealthStatus status;
        uint256 totalContributed;      // Total nVIDA contributed
        uint256 lastDeductionTimestamp;
        uint256 coverageStartDate;
        uint256 claimsUsed;            // Number of medical claims
        bool isVitalized;              // Has verified heartbeat
    }
    
    /// @notice Mapping: User address => Health Record
    mapping(address => HealthRecord) public healthRecords;
    
    /// @notice Mapping: User UID => Address (for hospital verification)
    mapping(bytes32 => address) public uidToAddress;
    
    /// @notice Total users with active coverage
    uint256 public totalActiveCitizens;
    
    // ============ EVENTS ============
    
    event HealthStakeDeducted(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event UserVitalized(
        address indexed user,
        bytes32 indexed uid,
        uint256 timestamp
    );
    
    event CoverageVerified(
        bytes32 indexed uid,
        address indexed hospital,
        uint256 timestamp
    );
    
    event MedicalReserveUpdated(
        uint256 previousBalance,
        uint256 newBalance,
        uint256 timestamp
    );
    
    event EmergencyOverrideGranted(
        address indexed user,
        address indexed authorizer,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _dividendPool) {
        dividendPool = IDividendPool(_dividendPool);
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Register user as Vitalized (called after first pulse)
     * @param user User address
     * @param uid Unique heartbeat ID (Truth-Bundle hash)
     */
    function vitalizeUser(address user, bytes32 uid) external onlyOwner {
        require(!healthRecords[user].isVitalized, "User already vitalized");
        
        healthRecords[user] = HealthRecord({
            status: HealthStatus.ACTIVE,
            totalContributed: 0,
            lastDeductionTimestamp: block.timestamp,
            coverageStartDate: block.timestamp,
            claimsUsed: 0,
            isVitalized: true
        });
        
        uidToAddress[uid] = user;
        totalActiveCitizens++;
        
        emit UserVitalized(user, uid, block.timestamp);
    }
    
    /**
     * @notice Deduct 1% health-stake from monthly dividend
     * @param user User address
     * @param dividendAmount Monthly dividend amount
     * @return deductedAmount Amount deducted for health-stake
     */
    function deductHealthStake(address user, uint256 dividendAmount) 
        external 
        onlyOwner 
        nonReentrant 
        returns (uint256 deductedAmount) 
    {
        require(healthRecords[user].isVitalized, "User not vitalized");
        require(healthRecords[user].status == HealthStatus.ACTIVE, "Coverage not active");
        
        // Calculate 1% deduction
        deductedAmount = (dividendAmount * HEALTH_STAKE_RATE) / BASIS_POINTS;
        
        // Update user record
        healthRecords[user].totalContributed += deductedAmount;
        healthRecords[user].lastDeductionTimestamp = block.timestamp;
        
        // Add to Global Medical Reserve
        uint256 previousBalance = globalMedicalReserve;
        globalMedicalReserve += deductedAmount;
        
        emit HealthStakeDeducted(user, deductedAmount, block.timestamp);
        emit MedicalReserveUpdated(previousBalance, globalMedicalReserve, block.timestamp);
        
        return deductedAmount;
    }
    
    /**
     * @notice Batch deduct health-stake for multiple users
     * @param users Array of user addresses
     * @param dividendAmounts Array of dividend amounts
     */
    function batchDeductHealthStake(
        address[] calldata users,
        uint256[] calldata dividendAmounts
    ) external onlyOwner nonReentrant {
        require(users.length == dividendAmounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (healthRecords[users[i]].isVitalized && 
                healthRecords[users[i]].status == HealthStatus.ACTIVE) {
                deductHealthStake(users[i], dividendAmounts[i]);
            }
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get user health status
     * @param user User address
     * @return status Health status
     * @return isActive Whether coverage is active
     */
    function getHealthStatus(address user) 
        external 
        view 
        returns (HealthStatus status, bool isActive) 
    {
        HealthRecord memory record = healthRecords[user];
        return (record.status, record.status == HealthStatus.ACTIVE);
    }
    
    /**
     * @notice Get user by UID (for hospital verification)
     * @param uid User's unique heartbeat ID
     * @return user User address
     */
    function getUserByUID(bytes32 uid) external view returns (address user) {
        return uidToAddress[uid];
    }
    
    /**
     * @notice Calculate monthly health-stake for user
     * @param user User address
     * @return monthlyStake Amount deducted monthly
     */
    function calculateMonthlyHealthStake(address user) 
        external 
        view 
        returns (uint256 monthlyStake) 
    {
        uint256 monthlyDividend = dividendPool.getUserMonthlyDividend(user);
        return (monthlyDividend * HEALTH_STAKE_RATE) / BASIS_POINTS;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Grant emergency override (for first responders)
     * @param user User address
     */
    function grantEmergencyOverride(address user) external onlyOwner {
        healthRecords[user].status = HealthStatus.EMERGENCY_OVERRIDE;
        emit EmergencyOverrideGranted(user, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Update dividend pool address
     * @param _dividendPool New dividend pool address
     */
    function updateDividendPool(address _dividendPool) external onlyOwner {
        dividendPool = IDividendPool(_dividendPool);
    }
}

