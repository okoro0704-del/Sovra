// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./VidaToken.sol";

/**
 * @title GovernanceRoot - Autonomous Governance Transition
 * @notice The Kill-Switch for Admin Control → Algorithmic Governance
 * @dev Once triggered, contract is governed by SupplyOracle + CitizenVoting
 *      - MINT() locked behind SUPPLY_ORACLE logic only
 *      - Admin roles sunset after handover
 *      - Irreversible transition to decentralized governance
 * 
 * "The era of the central banker is over. The era of the heartbeat has begun."
 * 
 * Born in Lagos, Nigeria. Governed by the Citizenry.
 */
contract GovernanceRoot is AccessControl, ReentrancyGuard {
    // ============ INTERFACES ============
    
    VidaToken public vidaToken;
    
    // ============ CONSTANTS ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SUPPLY_ORACLE_ROLE = keccak256("SUPPLY_ORACLE_ROLE");
    bytes32 public constant CITIZEN_VOTING_ROLE = keccak256("CITIZEN_VOTING_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant HANDOVER_DELAY = 7 days; // 7-day timelock
    uint256 public constant VOTING_QUORUM = 10; // 10% of citizens must vote
    uint256 public constant VOTING_THRESHOLD = 66; // 66% approval required
    
    // ============ STATE VARIABLES ============
    
    bool public isAutonomous; // Kill-switch activated
    uint256 public handoverInitiatedAt; // Timestamp of handover initiation
    uint256 public handoverCompletedAt; // Timestamp of handover completion
    
    address public supplyOracleContract;
    address public citizenVotingContract;
    address public vitaliaDAO;
    
    // Governance parameters
    mapping(bytes32 => GovernanceParameter) public parameters;
    mapping(bytes32 => Proposal) public proposals;
    uint256 public proposalCount;
    
    struct GovernanceParameter {
        string name;
        uint256 value;
        uint256 lastUpdated;
        bool isLocked; // Cannot be changed after handover
    }
    
    struct Proposal {
        bytes32 proposalId;
        string description;
        bytes32 parameterKey;
        uint256 newValue;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVoters;
        uint256 createdAt;
        uint256 expiresAt;
        bool executed;
        bool passed;
    }
    
    // Mint authorization tracking
    mapping(uint256 => MintAuthorization) public mintAuthorizations;
    uint256 public mintAuthorizationCount;
    
    struct MintAuthorization {
        uint256 authId;
        address recipient;
        uint256 amount;
        string reason;
        address authorizedBy; // Must be SUPPLY_ORACLE after handover
        uint256 timestamp;
        bool executed;
    }
    
    // ============ EVENTS ============
    
    event HandoverInitiated(uint256 timestamp, uint256 completionTime);
    event HandoverCompleted(uint256 timestamp, address vitaliaDAO);
    event AdminRoleRevoked(address indexed admin);
    event SupplyOracleUpdated(address indexed newOracle);
    event CitizenVotingUpdated(address indexed newVoting);
    event MintAuthorized(uint256 indexed authId, address recipient, uint256 amount, address authorizedBy);
    event MintExecuted(uint256 indexed authId, address recipient, uint256 amount);
    event ProposalCreated(bytes32 indexed proposalId, string description, bytes32 parameterKey);
    event ProposalExecuted(bytes32 indexed proposalId, bool passed);
    event ParameterUpdated(bytes32 indexed parameterKey, uint256 oldValue, uint256 newValue);
    
    // ============ ERRORS ============
    
    error AlreadyAutonomous();
    error NotAutonomous();
    error HandoverNotReady();
    error UnauthorizedMint();
    error InvalidProposal();
    error ProposalExpired();
    error ProposalAlreadyExecuted();
    error ParameterLocked();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _vidaToken,
        address _vitaliaDAO
    ) {
        require(_vidaToken != address(0), "Invalid VIDA token");
        require(_vitaliaDAO != address(0), "Invalid DAO address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        vidaToken = VidaToken(_vidaToken);
        vitaliaDAO = _vitaliaDAO;
        
        isAutonomous = false;
        
        // Initialize default parameters
        _setParameter("BURN_RATE", 2); // 2% default
        _setParameter("MINT_RATE", 10); // 10 VIDA per user
        _setParameter("SUPPLY_FLOOR", 500_000_000 * 1e18); // 500M
        _setParameter("SUPPLY_CEILING", 750_000_000 * 1e18); // 750M
        _setParameter("SUPPLY_CAP", 1_000_000_000 * 1e18); // 1B hard cap
    }
    
    // ============ KILL-SWITCH (THE HANDOVER) ============
    
    /**
     * @notice Initiate the handover to autonomous governance
     * @dev Starts 7-day timelock before completion
     */
    function initiateHandover() external onlyRole(ADMIN_ROLE) {
        if (isAutonomous) revert AlreadyAutonomous();
        require(supplyOracleContract != address(0), "Supply oracle not set");
        require(citizenVotingContract != address(0), "Citizen voting not set");
        
        handoverInitiatedAt = block.timestamp;
        
        emit HandoverInitiated(block.timestamp, block.timestamp + HANDOVER_DELAY);
    }
    
    /**
     * @notice Complete the handover (irreversible)
     * @dev Revokes all admin roles, transfers control to DAO
     */
    function completeHandover() external onlyRole(ADMIN_ROLE) nonReentrant {
        if (isAutonomous) revert AlreadyAutonomous();
        if (handoverInitiatedAt == 0) revert HandoverNotReady();
        require(block.timestamp >= handoverInitiatedAt + HANDOVER_DELAY, "Timelock not expired");
        
        // Activate autonomous mode
        isAutonomous = true;
        handoverCompletedAt = block.timestamp;
        
        // Lock critical parameters
        parameters[keccak256("SUPPLY_CAP")].isLocked = true;
        parameters[keccak256("SUPPLY_FLOOR")].isLocked = true;
        parameters[keccak256("SUPPLY_CEILING")].isLocked = true;

        // Revoke admin roles (irreversible)
        _revokeRole(ADMIN_ROLE, msg.sender);
        emit AdminRoleRevoked(msg.sender);

        // Transfer DEFAULT_ADMIN_ROLE to DAO
        _grantRole(DEFAULT_ADMIN_ROLE, vitaliaDAO);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);

        emit HandoverCompleted(block.timestamp, vitaliaDAO);
    }

    /**
     * @notice Emergency abort handover (only before completion)
     */
    function abortHandover() external onlyRole(EMERGENCY_ROLE) {
        require(!isAutonomous, "Already autonomous");
        require(handoverInitiatedAt > 0, "No handover initiated");

        handoverInitiatedAt = 0;
    }

    // ============ MINT AUTHORIZATION (SUPPLY ORACLE ONLY) ============

    /**
     * @notice Authorize minting (SUPPLY_ORACLE only after handover)
     * @param recipient Address to receive minted VIDA
     * @param amount Amount to mint
     * @param reason Reason for minting
     */
    function authorizeMint(
        address recipient,
        uint256 amount,
        string calldata reason
    ) external nonReentrant returns (uint256) {
        // Before handover: Admin can authorize
        // After handover: Only SUPPLY_ORACLE can authorize
        if (isAutonomous) {
            if (!hasRole(SUPPLY_ORACLE_ROLE, msg.sender)) revert UnauthorizedMint();
        } else {
            require(hasRole(ADMIN_ROLE, msg.sender) || hasRole(SUPPLY_ORACLE_ROLE, msg.sender), "Unauthorized");
        }

        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 authId = mintAuthorizationCount++;

        mintAuthorizations[authId] = MintAuthorization({
            authId: authId,
            recipient: recipient,
            amount: amount,
            reason: reason,
            authorizedBy: msg.sender,
            timestamp: block.timestamp,
            executed: false
        });

        emit MintAuthorized(authId, recipient, amount, msg.sender);

        return authId;
    }

    /**
     * @notice Execute authorized mint
     * @param authId Authorization ID
     */
    function executeMint(uint256 authId) external nonReentrant {
        MintAuthorization storage auth = mintAuthorizations[authId];

        require(!auth.executed, "Already executed");
        require(auth.timestamp > 0, "Invalid authorization");

        // After handover, only SUPPLY_ORACLE can execute
        if (isAutonomous) {
            require(hasRole(SUPPLY_ORACLE_ROLE, auth.authorizedBy), "Not authorized by oracle");
        }

        auth.executed = true;

        // Mint VIDA tokens
        vidaToken.mint(auth.recipient, auth.amount);

        emit MintExecuted(authId, auth.recipient, auth.amount);
    }

    // ============ CITIZEN VOTING ============

    /**
     * @notice Create governance proposal
     * @param description Proposal description
     * @param parameterKey Parameter to update
     * @param newValue New parameter value
     */
    function createProposal(
        string calldata description,
        bytes32 parameterKey,
        uint256 newValue
    ) external onlyRole(CITIZEN_VOTING_ROLE) returns (bytes32) {
        require(parameters[parameterKey].lastUpdated > 0, "Parameter does not exist");
        if (parameters[parameterKey].isLocked) revert ParameterLocked();

        bytes32 proposalId = keccak256(abi.encodePacked(description, parameterKey, block.timestamp));

        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            description: description,
            parameterKey: parameterKey,
            newValue: newValue,
            votesFor: 0,
            votesAgainst: 0,
            totalVoters: 0,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            executed: false,
            passed: false
        });

        proposalCount++;

        emit ProposalCreated(proposalId, description, parameterKey);

        return proposalId;
    }

    /**
     * @notice Execute proposal (after voting)
     * @param proposalId Proposal identifier
     * @param votesFor Votes in favor
     * @param votesAgainst Votes against
     * @param totalVoters Total voters
     */
    function executeProposal(
        bytes32 proposalId,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVoters
    ) external onlyRole(CITIZEN_VOTING_ROLE) nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (block.timestamp > proposal.expiresAt) revert ProposalExpired();

        proposal.votesFor = votesFor;
        proposal.votesAgainst = votesAgainst;
        proposal.totalVoters = totalVoters;
        proposal.executed = true;

        // Check quorum and threshold
        uint256 quorumReached = (totalVoters * 100) / vidaToken.totalSupply();
        uint256 approvalRate = (votesFor * 100) / (votesFor + votesAgainst);

        if (quorumReached >= VOTING_QUORUM && approvalRate >= VOTING_THRESHOLD) {
            proposal.passed = true;

            // Update parameter
            uint256 oldValue = parameters[proposal.parameterKey].value;
            parameters[proposal.parameterKey].value = proposal.newValue;
            parameters[proposal.parameterKey].lastUpdated = block.timestamp;

            emit ParameterUpdated(proposal.parameterKey, oldValue, proposal.newValue);
        }

        emit ProposalExecuted(proposalId, proposal.passed);
    }

    // ============ PARAMETER MANAGEMENT ============

    /**
     * @notice Set governance parameter (internal)
     */
    function _setParameter(string memory name, uint256 value) internal {
        bytes32 key = keccak256(abi.encodePacked(name));
        parameters[key] = GovernanceParameter({
            name: name,
            value: value,
            lastUpdated: block.timestamp,
            isLocked: false
        });
    }

    /**
     * @notice Get parameter value
     */
    function getParameter(bytes32 key) external view returns (uint256) {
        return parameters[key].value;
    }

    /**
     * @notice Update contract addresses
     */
    function updateSupplyOracle(address newOracle) external onlyRole(ADMIN_ROLE) {
        require(!isAutonomous, "Cannot update after handover");
        require(newOracle != address(0), "Invalid oracle");

        _grantRole(SUPPLY_ORACLE_ROLE, newOracle);
        if (supplyOracleContract != address(0)) {
            _revokeRole(SUPPLY_ORACLE_ROLE, supplyOracleContract);
        }

        supplyOracleContract = newOracle;
        emit SupplyOracleUpdated(newOracle);
    }

    function updateCitizenVoting(address newVoting) external onlyRole(ADMIN_ROLE) {
        require(!isAutonomous, "Cannot update after handover");
        require(newVoting != address(0), "Invalid voting");

        _grantRole(CITIZEN_VOTING_ROLE, newVoting);
        if (citizenVotingContract != address(0)) {
            _revokeRole(CITIZEN_VOTING_ROLE, citizenVotingContract);
        }

        citizenVotingContract = newVoting;
        emit CitizenVotingUpdated(newVoting);
    }

    // ============ VIEW FUNCTIONS ============

    function getHandoverStatus() external view returns (
        bool autonomous,
        uint256 initiatedAt,
        uint256 completedAt,
        uint256 timeUntilCompletion
    ) {
        uint256 timeRemaining = 0;
        if (handoverInitiatedAt > 0 && !isAutonomous) {
            uint256 completionTime = handoverInitiatedAt + HANDOVER_DELAY;
            if (block.timestamp < completionTime) {
                timeRemaining = completionTime - block.timestamp;
            }
        }

        return (isAutonomous, handoverInitiatedAt, handoverCompletedAt, timeRemaining);
    }

    function getProposal(bytes32 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getMintAuthorization(uint256 authId) external view returns (MintAuthorization memory) {
        return mintAuthorizations[authId];
    }
}

