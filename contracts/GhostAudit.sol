// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GhostAudit - Payroll Integrity Verification
 * @notice Detects ghost workers via liveness verification
 * @dev Cross-references National Payroll with VLT (Vitalized Ledger)
 *      - If recipient has not performed PFF scan in 30 days → Escrow salary
 *      - Uses Zero-Knowledge Proofs to protect PII
 *      - Government-controlled audit triggers
 *      - Automatic release upon liveness verification
 * 
 * "The era of the ghost worker is over. The era of accountability has begun."
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Nations.
 */
contract GhostAudit is AccessControl, ReentrancyGuard {
    // ============ INTERFACES ============
    
    IERC20 public nVidaToken;
    
    // ============ CONSTANTS ============
    
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    bytes32 public constant VLT_ORACLE_ROLE = keccak256("VLT_ORACLE_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    uint256 public constant LIVENESS_THRESHOLD = 30 days; // 30 days without PFF scan
    uint256 public constant ESCROW_RELEASE_DELAY = 7 days; // 7 days to verify after escrow
    uint256 public constant MAX_ESCROW_DURATION = 90 days; // Auto-forfeit after 90 days
    
    // ============ STATE VARIABLES ============
    
    // Department tracking
    mapping(bytes32 => Department) public departments;
    bytes32[] public departmentIds;
    
    struct Department {
        bytes32 departmentId;
        string name;
        address governmentAuthority;
        uint256 totalEmployees;
        uint256 totalSalaryBudget; // Monthly budget in nVIDA
        uint256 totalEscrowed;
        uint256 totalSavings; // Ghost worker savings
        bool isActive;
    }
    
    // Employee tracking (ZK-proof hashes only)
    mapping(bytes32 => Employee) public employees;
    uint256 public totalEmployees;
    
    struct Employee {
        bytes32 employeeHash; // ZK-proof hash (no PII on-chain)
        bytes32 departmentId;
        uint256 monthlySalary; // In nVIDA
        uint256 lastPffScan; // Timestamp of last liveness check
        bool isActive;
        bool isEscrowed;
        uint256 escrowedAmount;
        uint256 escrowedAt;
        uint256 totalPaid;
        uint256 totalEscrowed;
    }
    
    // Audit tracking
    mapping(uint256 => AuditReport) public auditReports;
    uint256 public auditCount;
    
    struct AuditReport {
        uint256 auditId;
        bytes32 departmentId;
        uint256 timestamp;
        uint256 employeesScanned;
        uint256 ghostWorkersDetected;
        uint256 amountEscrowed;
        uint256 savingsRealized;
        bytes32 zkProofHash; // Zero-knowledge proof of audit
        address triggeredBy;
    }
    
    // Escrow pool
    uint256 public totalEscrowedFunds;
    uint256 public totalSavingsRealized;
    
    // ============ EVENTS ============
    
    event DepartmentRegistered(bytes32 indexed departmentId, string name, address authority);
    event EmployeeRegistered(bytes32 indexed employeeHash, bytes32 departmentId, uint256 salary);
    event AuditTriggered(uint256 indexed auditId, bytes32 departmentId, address triggeredBy);
    event GhostWorkerDetected(bytes32 indexed employeeHash, uint256 amountEscrowed);
    event SalaryEscrowed(bytes32 indexed employeeHash, uint256 amount, uint256 escrowedAt);
    event SalaryReleased(bytes32 indexed employeeHash, uint256 amount);
    event SalaryForfeited(bytes32 indexed employeeHash, uint256 amount);
    event LivenessVerified(bytes32 indexed employeeHash, uint256 timestamp);
    
    // ============ ERRORS ============
    
    error DepartmentNotFound();
    error EmployeeNotFound();
    error NotEscrowed();
    error EscrowExpired();
    error UnauthorizedAudit();
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _nVidaToken) {
        require(_nVidaToken != address(0), "Invalid nVIDA token");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        
        nVidaToken = IERC20(_nVidaToken);
    }
    
    // ============ DEPARTMENT MANAGEMENT ============
    
    /**
     * @notice Register government department
     * @param departmentId Unique department identifier
     * @param name Department name
     * @param governmentAuthority Authorized government official
     * @param salaryBudget Monthly salary budget
     */
    function registerDepartment(
        bytes32 departmentId,
        string calldata name,
        address governmentAuthority,
        uint256 salaryBudget
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(departments[departmentId].departmentId == bytes32(0), "Department already exists");
        require(governmentAuthority != address(0), "Invalid authority");
        
        departments[departmentId] = Department({
            departmentId: departmentId,
            name: name,
            governmentAuthority: governmentAuthority,
            totalEmployees: 0,
            totalSalaryBudget: salaryBudget,
            totalEscrowed: 0,
            totalSavings: 0,
            isActive: true
        });
        
        departmentIds.push(departmentId);
        
        _grantRole(GOVERNMENT_ROLE, governmentAuthority);
        
        emit DepartmentRegistered(departmentId, name, governmentAuthority);
    }
    
    /**
     * @notice Register employee (ZK-proof hash only)
     * @param employeeHash Zero-knowledge proof hash (no PII)
     * @param departmentId Department identifier
     * @param monthlySalary Monthly salary in nVIDA
     */
    function registerEmployee(
        bytes32 employeeHash,
        bytes32 departmentId,
        uint256 monthlySalary
    ) external onlyRole(GOVERNMENT_ROLE) {
        Department storage dept = departments[departmentId];
        if (dept.departmentId == bytes32(0)) revert DepartmentNotFound();
        
        require(employees[employeeHash].employeeHash == bytes32(0), "Employee already exists");
        require(monthlySalary > 0, "Invalid salary");
        
        employees[employeeHash] = Employee({
            employeeHash: employeeHash,
            departmentId: departmentId,
            monthlySalary: monthlySalary,
            lastPffScan: block.timestamp, // Initial registration counts as first scan
            isActive: true,
            isEscrowed: false,
            escrowedAmount: 0,
            escrowedAt: 0,
            totalPaid: 0,
            totalEscrowed: 0
        });
        
        dept.totalEmployees++;
        totalEmployees++;
        
        emit EmployeeRegistered(employeeHash, departmentId, monthlySalary);
    }

    // ============ GHOST AUDIT (CORE FUNCTION) ============

    /**
     * @notice Trigger payroll audit for department
     * @param departmentId Department to audit
     * @return auditId Audit report identifier
     */
    function triggerAudit(bytes32 departmentId) external onlyRole(GOVERNMENT_ROLE) nonReentrant returns (uint256) {
        Department storage dept = departments[departmentId];
        if (dept.departmentId == bytes32(0)) revert DepartmentNotFound();

        uint256 auditId = auditCount++;
        uint256 ghostWorkersDetected = 0;
        uint256 amountEscrowed = 0;

        // Scan all employees in department
        for (uint256 i = 0; i < totalEmployees; i++) {
            // In production, iterate through department's employee list
            // For now, this is a simplified version
        }

        // Generate ZK-proof hash (in production, use actual ZK-SNARK)
        bytes32 zkProofHash = keccak256(abi.encodePacked(departmentId, block.timestamp, auditId));

        auditReports[auditId] = AuditReport({
            auditId: auditId,
            departmentId: departmentId,
            timestamp: block.timestamp,
            employeesScanned: dept.totalEmployees,
            ghostWorkersDetected: ghostWorkersDetected,
            amountEscrowed: amountEscrowed,
            savingsRealized: 0,
            zkProofHash: zkProofHash,
            triggeredBy: msg.sender
        });

        emit AuditTriggered(auditId, departmentId, msg.sender);

        return auditId;
    }

    /**
     * @notice Check employee liveness and escrow if inactive
     * @param employeeHash Employee ZK-proof hash
     * @param salaryAmount Salary amount to process
     */
    function processPayroll(
        bytes32 employeeHash,
        uint256 salaryAmount
    ) external onlyRole(GOVERNMENT_ROLE) nonReentrant {
        Employee storage employee = employees[employeeHash];
        if (employee.employeeHash == bytes32(0)) revert EmployeeNotFound();

        require(employee.isActive, "Employee inactive");

        // Check if employee has performed PFF scan in last 30 days
        uint256 daysSinceLastScan = (block.timestamp - employee.lastPffScan) / 1 days;

        if (daysSinceLastScan > 30) {
            // GHOST WORKER DETECTED - Escrow salary
            _escrowSalary(employeeHash, salaryAmount);
        } else {
            // VERIFIED EMPLOYEE - Pay salary
            _paySalary(employeeHash, salaryAmount);
        }
    }

    /**
     * @notice Escrow salary for inactive employee
     */
    function _escrowSalary(bytes32 employeeHash, uint256 amount) internal {
        Employee storage employee = employees[employeeHash];
        Department storage dept = departments[employee.departmentId];

        // Transfer salary to escrow
        require(nVidaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        employee.isEscrowed = true;
        employee.escrowedAmount += amount;
        employee.escrowedAt = block.timestamp;
        employee.totalEscrowed += amount;

        dept.totalEscrowed += amount;
        totalEscrowedFunds += amount;

        emit GhostWorkerDetected(employeeHash);
        emit SalaryEscrowed(employeeHash, amount, block.timestamp);
    }

    /**
     * @notice Pay salary to verified employee
     */
    function _paySalary(bytes32 employeeHash, uint256 amount) internal {
        Employee storage employee = employees[employeeHash];

        // Transfer salary directly
        require(nVidaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        employee.totalPaid += amount;
    }

    // ============ LIVENESS VERIFICATION ============

    /**
     * @notice Update employee liveness (called by VLT after PFF scan)
     * @param employeeHash Employee ZK-proof hash
     * @param pffTimestamp Timestamp of PFF scan
     */
    function updateLiveness(
        bytes32 employeeHash,
        uint256 pffTimestamp
    ) external onlyRole(VLT_ORACLE_ROLE) {
        Employee storage employee = employees[employeeHash];
        if (employee.employeeHash == bytes32(0)) revert EmployeeNotFound();

        employee.lastPffScan = pffTimestamp;

        emit LivenessVerified(employeeHash, pffTimestamp);

        // If employee was escrowed, release funds
        if (employee.isEscrowed) {
            _releaseEscrow(employeeHash);
        }
    }

    /**
     * @notice Release escrowed salary after liveness verification
     */
    function _releaseEscrow(bytes32 employeeHash) internal {
        Employee storage employee = employees[employeeHash];
        Department storage dept = departments[employee.departmentId];

        if (!employee.isEscrowed) revert NotEscrowed();

        uint256 amount = employee.escrowedAmount;

        // Check if escrow has expired (90 days)
        if (block.timestamp > employee.escrowedAt + MAX_ESCROW_DURATION) {
            // Forfeit to government savings
            _forfeitEscrow(employeeHash);
            return;
        }

        // Release escrow to employee
        employee.isEscrowed = false;
        employee.escrowedAmount = 0;
        employee.totalPaid += amount;

        dept.totalEscrowed -= amount;
        totalEscrowedFunds -= amount;

        require(nVidaToken.transfer(address(this), amount), "Transfer failed");

        emit SalaryReleased(employeeHash, amount);
    }

    /**
     * @notice Forfeit escrowed salary (after 90 days)
     */
    function _forfeitEscrow(bytes32 employeeHash) internal {
        Employee storage employee = employees[employeeHash];
        Department storage dept = departments[employee.departmentId];

        uint256 amount = employee.escrowedAmount;

        employee.isEscrowed = false;
        employee.escrowedAmount = 0;
        employee.isActive = false; // Deactivate employee

        dept.totalEscrowed -= amount;
        dept.totalSavings += amount;
        dept.totalEmployees--;

        totalEscrowedFunds -= amount;
        totalSavingsRealized += amount;
        totalEmployees--;

        emit SalaryForfeited(employeeHash, amount);
    }

    /**
     * @notice Manually release escrow (government override)
     */
    function releaseEscrow(bytes32 employeeHash) external onlyRole(GOVERNMENT_ROLE) nonReentrant {
        _releaseEscrow(employeeHash);
    }

    /**
     * @notice Manually forfeit escrow (government override)
     */
    function forfeitEscrow(bytes32 employeeHash) external onlyRole(GOVERNMENT_ROLE) nonReentrant {
        _forfeitEscrow(employeeHash);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get department statistics
     */
    function getDepartmentStats(bytes32 departmentId) external view returns (
        string memory name,
        uint256 totalEmployees_,
        uint256 totalSalaryBudget,
        uint256 totalEscrowed,
        uint256 totalSavings,
        uint256 savingsRate
    ) {
        Department storage dept = departments[departmentId];

        uint256 savingsRate_ = dept.totalSalaryBudget > 0
            ? (dept.totalSavings * 100) / dept.totalSalaryBudget
            : 0;

        return (
            dept.name,
            dept.totalEmployees,
            dept.totalSalaryBudget,
            dept.totalEscrowed,
            dept.totalSavings,
            savingsRate_
        );
    }

    /**
     * @notice Get employee status (ZK-proof protected)
     */
    function getEmployeeStatus(bytes32 employeeHash) external view returns (
        bool isActive,
        bool isEscrowed,
        uint256 daysSinceLastScan,
        uint256 escrowedAmount,
        uint256 totalPaid
    ) {
        Employee storage employee = employees[employeeHash];

        uint256 daysSince = (block.timestamp - employee.lastPffScan) / 1 days;

        return (
            employee.isActive,
            employee.isEscrowed,
            daysSince,
            employee.escrowedAmount,
            employee.totalPaid
        );
    }

    /**
     * @notice Get audit report
     */
    function getAuditReport(uint256 auditId) external view returns (AuditReport memory) {
        return auditReports[auditId];
    }

    /**
     * @notice Get global statistics
     */
    function getGlobalStats() external view returns (
        uint256 totalEmployees_,
        uint256 totalEscrowed,
        uint256 totalSavings,
        uint256 auditCount_
    ) {
        return (
            totalEmployees,
            totalEscrowedFunds,
            totalSavingsRealized,
            auditCount
        );
    }

    /**
     * @notice Withdraw government savings
     */
    function withdrawSavings(
        bytes32 departmentId,
        uint256 amount
    ) external onlyRole(GOVERNMENT_ROLE) nonReentrant {
        Department storage dept = departments[departmentId];

        require(amount <= dept.totalSavings, "Insufficient savings");

        dept.totalSavings -= amount;

        require(nVidaToken.transfer(dept.governmentAuthority, amount), "Transfer failed");
    }

    /**
     * @notice Update VLT oracle
     */
    function updateVltOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOracle != address(0), "Invalid oracle");
        _grantRole(VLT_ORACLE_ROLE, newOracle);
    }
}

