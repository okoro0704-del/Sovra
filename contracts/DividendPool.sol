// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DividendPool - Scalable Citizen Dividend Distribution
 * @notice Receives 25% of Quad-Split fees and distributes to verified Vitalians
 * @dev Uses Point-Multiplier algorithm (Nick Johnson pattern) for 100M+ users
 *      - Receives 25% of 2% fee from nVIDA transfers (Quad-Split)
 *      - Splits 50/50: Government Treasury + Citizen Pool
 *      - Pull-based claims to avoid gas loops
 *      - Point system tracks proportional share per citizen
 * 
 * Born in Lagos, Nigeria. Wealth for All Vitalians.
 */
contract DividendPool is AccessControl, ReentrancyGuard {
    // ============ INTERFACES ============
    
    IERC20 public nVidaToken;
    
    // ============ CONSTANTS ============
    
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    
    uint256 public constant GOVERNMENT_SHARE = 50; // 50%
    uint256 public constant CITIZEN_SHARE = 50; // 50%
    uint256 public constant POINTS_MULTIPLIER = 1e18; // Precision for point calculations
    
    // ============ STATE VARIABLES ============
    
    address public governmentTreasury;
    address public minorTrustContract;
    
    // Point-Multiplier tracking (Nick Johnson pattern)
    uint256 public totalPoints; // Total points issued to all citizens
    uint256 public pointsPerShare; // Accumulated points per share (scaled by POINTS_MULTIPLIER)
    uint256 public totalDividendsDistributed;
    
    // Citizen tracking
    mapping(address => Citizen) public citizens;
    uint256 public totalVerifiedCitizens;
    
    struct Citizen {
        bool isVerified;
        uint256 points; // Citizen's share points
        uint256 pointsDebt; // Points already claimed
        uint256 totalClaimed;
        uint256 lastClaimTime;
        uint256 age; // Age in years (updated by VLT)
        bool isMinor; // Age < 18
    }
    
    // Distribution tracking
    uint256 public totalGovernmentShare;
    uint256 public totalCitizenShare;
    uint256 public totalMinorTrustShare;
    
    // ============ EVENTS ============
    
    event DividendsReceived(uint256 amount, uint256 governmentShare, uint256 citizenShare);
    event CitizenVerified(address indexed citizen, uint256 points);
    event CitizenRevoked(address indexed citizen);
    event DividendClaimed(address indexed citizen, uint256 amount, uint256 minorTrustAmount);
    event GovernmentWithdrawal(uint256 amount, address indexed treasury);
    event PointsPerShareUpdated(uint256 newPointsPerShare, uint256 totalDistributed);
    event MinorStatusUpdated(address indexed citizen, bool isMinor, uint256 age);
    
    // ============ ERRORS ============
    
    error NotVerifiedCitizen();
    error NoDividendsAvailable();
    error InvalidAmount();
    error AlreadyVerified();
    error NotMinor();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _nVidaToken,
        address _governmentTreasury,
        address _minorTrustContract
    ) {
        require(_nVidaToken != address(0), "Invalid nVIDA token");
        require(_governmentTreasury != address(0), "Invalid treasury");
        require(_minorTrustContract != address(0), "Invalid minor trust");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(GOVERNMENT_ROLE, _governmentTreasury);
        
        nVidaToken = IERC20(_nVidaToken);
        governmentTreasury = _governmentTreasury;
        minorTrustContract = _minorTrustContract;
        
        totalPoints = 1; // Start with 1 to avoid division by zero
    }
    
    // ============ DIVIDEND DISTRIBUTION ============
    
    /**
     * @notice Receive and distribute dividends from Quad-Split
     * @param amount Total dividend amount from Quad-Split (25% of 2% fee)
     * @dev Splits 50/50 between Government Treasury and Citizen Pool
     */
    function distribute(uint256 amount) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(amount > 0, "Cannot distribute zero");
        
        // Transfer nVIDA from sender
        require(nVidaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate 50/50 split
        uint256 governmentShare = (amount * GOVERNMENT_SHARE) / 100;
        uint256 citizenShare = amount - governmentShare;
        
        // Update government treasury balance
        totalGovernmentShare += governmentShare;
        
        // Update citizen pool using point-multiplier algorithm
        if (totalPoints > 0) {
            // Increase points per share
            pointsPerShare += (citizenShare * POINTS_MULTIPLIER) / totalPoints;
            totalCitizenShare += citizenShare;
            totalDividendsDistributed += citizenShare;
            
            emit PointsPerShareUpdated(pointsPerShare, totalDividendsDistributed);
        }
        
        emit DividendsReceived(amount, governmentShare, citizenShare);
    }
    
    // ============ CITIZEN VERIFICATION ============
    
    /**
     * @notice Verify a citizen and grant dividend rights
     * @param citizen Address of citizen to verify
     * @param age Age of citizen in years
     * @dev Each verified citizen gets 1 point (equal share)
     */
    function verifyCitizen(address citizen, uint256 age) external onlyRole(VERIFIER_ROLE) {
        require(citizen != address(0), "Invalid citizen address");
        require(!citizens[citizen].isVerified, "Already verified");
        
        bool isMinor = age < 18;
        
        citizens[citizen] = Citizen({
            isVerified: true,
            points: 1, // Each citizen gets 1 point (equal distribution)
            pointsDebt: pointsPerShare, // Start debt at current pointsPerShare
            totalClaimed: 0,
            lastClaimTime: block.timestamp,
            age: age,
            isMinor: isMinor
        });
        
        totalPoints += 1;
        totalVerifiedCitizens++;

        emit CitizenVerified(citizen, 1);

        if (isMinor) {
            emit MinorStatusUpdated(citizen, true, age);
        }
    }

    /**
     * @notice Update citizen's age (called by VLT when age changes)
     * @param citizen Address of citizen
     * @param newAge New age in years
     */
    function updateCitizenAge(address citizen, uint256 newAge) external onlyRole(VERIFIER_ROLE) {
        require(citizens[citizen].isVerified, "Not verified citizen");

        bool wasMinor = citizens[citizen].isMinor;
        bool isMinor = newAge < 18;

        citizens[citizen].age = newAge;
        citizens[citizen].isMinor = isMinor;

        if (wasMinor != isMinor) {
            emit MinorStatusUpdated(citizen, isMinor, newAge);
        }
    }

    /**
     * @notice Revoke citizen verification
     * @param citizen Address of citizen to revoke
     */
    function revokeCitizen(address citizen) external onlyRole(VERIFIER_ROLE) {
        require(citizens[citizen].isVerified, "Not verified");

        // Remove points from total
        totalPoints -= citizens[citizen].points;
        totalVerifiedCitizens--;

        citizens[citizen].isVerified = false;

        emit CitizenRevoked(citizen);
    }

    // ============ DIVIDEND CLAIMS (PULL-BASED) ============

    /**
     * @notice Claim available dividends (pull-based to avoid gas loops)
     * @dev Calculates pending dividends using point-multiplier algorithm
     *      If citizen is minor, 50% goes to MinorTrust contract
     */
    function claimDividends() external nonReentrant {
        Citizen storage citizen = citizens[msg.sender];

        if (!citizen.isVerified) revert NotVerifiedCitizen();

        // Calculate pending dividends using point-multiplier
        uint256 pendingDividends = _calculatePendingDividends(msg.sender);

        if (pendingDividends == 0) revert NoDividendsAvailable();

        // Update citizen's debt
        citizen.pointsDebt = pointsPerShare;
        citizen.totalClaimed += pendingDividends;
        citizen.lastClaimTime = block.timestamp;

        uint256 citizenAmount = pendingDividends;
        uint256 minorTrustAmount = 0;

        // If minor, route 50% to MinorTrust
        if (citizen.isMinor) {
            minorTrustAmount = pendingDividends / 2;
            citizenAmount = pendingDividends - minorTrustAmount;

            // Transfer to MinorTrust
            require(nVidaToken.transfer(minorTrustContract, minorTrustAmount), "MinorTrust transfer failed");
            totalMinorTrustShare += minorTrustAmount;
        }

        // Transfer to citizen
        require(nVidaToken.transfer(msg.sender, citizenAmount), "Citizen transfer failed");

        emit DividendClaimed(msg.sender, citizenAmount, minorTrustAmount);
    }

    /**
     * @notice Calculate pending dividends for a citizen
     * @param citizen Address of citizen
     * @return Pending dividend amount
     */
    function _calculatePendingDividends(address citizen) internal view returns (uint256) {
        Citizen storage c = citizens[citizen];

        if (!c.isVerified) return 0;

        // Point-multiplier formula: (pointsPerShare - pointsDebt) * points / POINTS_MULTIPLIER
        uint256 pendingPoints = pointsPerShare - c.pointsDebt;
        uint256 pendingDividends = (pendingPoints * c.points) / POINTS_MULTIPLIER;

        return pendingDividends;
    }

    /**
     * @notice Get pending dividends for a citizen (view function)
     */
    function getPendingDividends(address citizen) external view returns (uint256) {
        return _calculatePendingDividends(citizen);
    }

    // ============ GOVERNMENT TREASURY ============

    /**
     * @notice Withdraw government share to treasury
     * @param amount Amount to withdraw
     */
    function withdrawGovernmentShare(uint256 amount) external onlyRole(GOVERNMENT_ROLE) nonReentrant {
        require(amount > 0 && amount <= totalGovernmentShare, "Invalid amount");

        totalGovernmentShare -= amount;

        require(nVidaToken.transfer(governmentTreasury, amount), "Transfer failed");

        emit GovernmentWithdrawal(amount, governmentTreasury);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get citizen details
     */
    function getCitizen(address citizen) external view returns (
        bool isVerified,
        uint256 points,
        uint256 totalClaimed,
        uint256 pendingDividends,
        uint256 lastClaimTime,
        uint256 age,
        bool isMinor
    ) {
        Citizen storage c = citizens[citizen];
        return (
            c.isVerified,
            c.points,
            c.totalClaimed,
            _calculatePendingDividends(citizen),
            c.lastClaimTime,
            c.age,
            c.isMinor
        );
    }

    /**
     * @notice Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 totalCitizens,
        uint256 totalPointsIssued,
        uint256 currentPointsPerShare,
        uint256 totalDistributed,
        uint256 governmentBalance,
        uint256 citizenBalance,
        uint256 minorTrustTotal
    ) {
        return (
            totalVerifiedCitizens,
            totalPoints,
            pointsPerShare,
            totalDividendsDistributed,
            totalGovernmentShare,
            totalCitizenShare,
            totalMinorTrustShare
        );
    }

    /**
     * @notice Update government treasury address
     */
    function updateGovernmentTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury");

        _revokeRole(GOVERNMENT_ROLE, governmentTreasury);
        _grantRole(GOVERNMENT_ROLE, newTreasury);

        governmentTreasury = newTreasury;
    }

    /**
     * @notice Update MinorTrust contract address
     */
    function updateMinorTrustContract(address newContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newContract != address(0), "Invalid contract");
        minorTrustContract = newContract;
    }
}

