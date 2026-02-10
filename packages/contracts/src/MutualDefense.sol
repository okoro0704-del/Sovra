// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MutualDefense
 * @notice Global Defense DAO - Mutual Defense Contract
 * 
 * "When nations attack, the heartbeat defends."
 * 
 * Features:
 * - National Security Staking (nations lock % of vault)
 * - Alliance Defense Activation (requires Peace Oracle + 66% DAO vote)
 * - Decentralized Identity (DID) for all DAO votes
 * - Aggressor-Lock mechanism
 * - Peace Oracle integration
 * 
 * Born in Lagos, Nigeria. Built for Peace.
 */
contract MutualDefense is Ownable, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    uint256 public constant MINIMUM_STAKE_PERCENTAGE = 5; // 5% of national vault
    uint256 public constant ALLIANCE_VOTE_THRESHOLD = 66; // 66% supermajority
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant PEACE_ORACLE_TIMEOUT = 1 hours;
    
    // ============ STATE VARIABLES ============
    
    address public peaceOracleAddress;
    uint256 public totalMemberNations;
    
    // Nation ID => Nation Data
    mapping(bytes32 => Nation) public nations;
    
    // Nation ID => Is Member
    mapping(bytes32 => bool) public isMemberNation;
    
    // Defense Proposal ID => Proposal Data
    mapping(bytes32 => DefenseProposal) public defenseProposals;
    
    // Proposal ID => Nation ID => Voted
    mapping(bytes32 => mapping(bytes32 => bool)) public hasVoted;
    
    // Aggressor Nation ID => Is Locked
    mapping(bytes32 => bool) public isAggressorLocked;
    
    // ============ STRUCTS ============
    
    struct Nation {
        bytes32 nationId;
        string nationName;
        string did; // Decentralized Identity
        uint256 vaultBalance; // Total national vault (VIDA)
        uint256 stakedAmount; // Amount staked for mutual defense
        uint256 stakePercentage; // Percentage of vault staked
        uint256 stakedAt;
        bool isActive;
    }
    
    struct DefenseProposal {
        bytes32 proposalId;
        bytes32 targetRegion; // Region under attack
        bytes32 aggressorNation; // Attacking nation
        string evidenceHash; // IPFS hash of war-crime evidence
        address proposedBy;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 votingEndsAt;
        bool peaceOracleConfirmed;
        bool approved;
        bool executed;
        DefenseAction action;
    }
    
    enum DefenseAction {
        NONE,
        ECONOMIC_SANCTIONS,
        AGGRESSOR_LOCK,
        ALLIANCE_DEFENSE,
        HUMANITARIAN_AID
    }
    
    // ============ EVENTS ============
    
    event NationalSecurityStaked(
        bytes32 indexed nationId,
        string nationName,
        uint256 stakedAmount,
        uint256 stakePercentage,
        uint256 timestamp
    );
    
    event DefenseProposalCreated(
        bytes32 indexed proposalId,
        bytes32 indexed targetRegion,
        bytes32 indexed aggressorNation,
        string evidenceHash,
        uint256 votingEndsAt
    );
    
    event NationVoted(
        bytes32 indexed proposalId,
        bytes32 indexed nationId,
        bool voteFor,
        uint256 timestamp
    );
    
    event PeaceOracleConfirmed(
        bytes32 indexed proposalId,
        bool confirmed,
        uint256 timestamp
    );
    
    event AllianceDefenseActivated(
        bytes32 indexed proposalId,
        bytes32 indexed targetRegion,
        bytes32 indexed aggressorNation,
        DefenseAction action,
        uint256 timestamp
    );
    
    event AggressorLocked(
        bytes32 indexed nationId,
        string reason,
        uint256 timestamp
    );
    
    event NationJoinedAlliance(
        bytes32 indexed nationId,
        string nationName,
        string did,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _peaceOracleAddress) {
        peaceOracleAddress = _peaceOracleAddress;
        totalMemberNations = 0;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Nation stakes a percentage of their vault for mutual defense
     * @param nationId Unique nation identifier
     * @param nationName Name of the nation
     * @param did Decentralized Identity of the nation
     * @param vaultBalance Total national vault balance (VIDA)
     * @param stakePercentage Percentage of vault to stake (minimum 5%)
     */
    function stakeNationalSecurity(
        bytes32 nationId,
        string memory nationName,
        string memory did,
        uint256 vaultBalance,
        uint256 stakePercentage
    ) external nonReentrant {
        require(stakePercentage >= MINIMUM_STAKE_PERCENTAGE, "Stake percentage too low");
        require(stakePercentage <= 100, "Invalid stake percentage");
        require(vaultBalance > 0, "Vault balance must be positive");
        
        uint256 stakedAmount = (vaultBalance * stakePercentage) / 100;
        
        // Create or update nation
        Nation storage nation = nations[nationId];
        nation.nationId = nationId;
        nation.nationName = nationName;
        nation.did = did;
        nation.vaultBalance = vaultBalance;
        nation.stakedAmount = stakedAmount;
        nation.stakePercentage = stakePercentage;
        nation.stakedAt = block.timestamp;
        nation.isActive = true;
        
        // Add to member nations if new
        if (!isMemberNation[nationId]) {
            isMemberNation[nationId] = true;
            totalMemberNations++;
            
            emit NationJoinedAlliance(nationId, nationName, did, block.timestamp);
        }
        
        emit NationalSecurityStaked(
            nationId,
            nationName,
            stakedAmount,
            stakePercentage,
            block.timestamp
        );
    }
    
    /**
     * @notice Activate alliance defense for a region under attack
     * @param targetRegion Region under attack
     * @param aggressorNation Attacking nation
     * @param evidenceHash IPFS hash of war-crime evidence
     * @param action Defense action to take
     */
    function activateAllianceDefense(
        bytes32 targetRegion,
        bytes32 aggressorNation,
        string memory evidenceHash,
        DefenseAction action
    ) external nonReentrant returns (bytes32 proposalId) {
        require(isMemberNation[targetRegion], "Target region not a member");
        require(action != DefenseAction.NONE, "Invalid defense action");
        
        // Generate proposal ID
        proposalId = keccak256(
            abi.encodePacked(targetRegion, aggressorNation, evidenceHash, block.timestamp)
        );
        
        // Create defense proposal
        DefenseProposal storage proposal = defenseProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.targetRegion = targetRegion;
        proposal.aggressorNation = aggressorNation;
        proposal.evidenceHash = evidenceHash;
        proposal.proposedBy = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingEndsAt = block.timestamp + VOTING_PERIOD;
        proposal.action = action;
        
        emit DefenseProposalCreated(
            proposalId,
            targetRegion,
            aggressorNation,
            evidenceHash,
            proposal.votingEndsAt
        );
        
        return proposalId;
    }

    /**
     * @notice Member nations vote on defense proposal
     * @param proposalId Proposal ID
     * @param nationId Voting nation ID
     * @param voteFor True = approve, False = reject
     */
    function voteOnDefenseProposal(
        bytes32 proposalId,
        bytes32 nationId,
        bool voteFor
    ) external {
        require(isMemberNation[nationId], "Only member nations can vote");
        require(!hasVoted[proposalId][nationId], "Already voted");

        DefenseProposal storage proposal = defenseProposals[proposalId];
        require(proposal.proposalId != bytes32(0), "Proposal does not exist");
        require(block.timestamp < proposal.votingEndsAt, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");

        // Verify DID (in production, use actual DID verification)
        Nation memory nation = nations[nationId];
        require(nation.isActive, "Nation not active");

        // Record vote
        hasVoted[proposalId][nationId] = true;

        if (voteFor) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        emit NationVoted(proposalId, nationId, voteFor, block.timestamp);

        // Check if threshold reached
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 votePercentage = (proposal.votesFor * 100) / totalMemberNations;

        if (votePercentage >= ALLIANCE_VOTE_THRESHOLD && proposal.peaceOracleConfirmed) {
            executeDefenseProposal(proposalId);
        }
    }

    /**
     * @notice Peace Oracle confirms the attack (called by oracle)
     * @param proposalId Proposal ID
     * @param confirmed True if attack confirmed
     */
    function confirmPeaceOracle(bytes32 proposalId, bool confirmed) external {
        require(msg.sender == peaceOracleAddress, "Only Peace Oracle can confirm");

        DefenseProposal storage proposal = defenseProposals[proposalId];
        require(proposal.proposalId != bytes32(0), "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");

        proposal.peaceOracleConfirmed = confirmed;

        emit PeaceOracleConfirmed(proposalId, confirmed, block.timestamp);

        // Check if can execute
        uint256 votePercentage = (proposal.votesFor * 100) / totalMemberNations;

        if (votePercentage >= ALLIANCE_VOTE_THRESHOLD && confirmed) {
            executeDefenseProposal(proposalId);
        }
    }

    /**
     * @notice Execute defense proposal (requires 66% vote + Peace Oracle)
     */
    function executeDefenseProposal(bytes32 proposalId) internal {
        DefenseProposal storage proposal = defenseProposals[proposalId];

        require(proposal.peaceOracleConfirmed, "Peace Oracle not confirmed");
        require(!proposal.executed, "Already executed");

        uint256 votePercentage = (proposal.votesFor * 100) / totalMemberNations;
        require(votePercentage >= ALLIANCE_VOTE_THRESHOLD, "Insufficient votes");

        proposal.approved = true;
        proposal.executed = true;

        // Execute defense action
        if (proposal.action == DefenseAction.AGGRESSOR_LOCK) {
            lockAggressor(proposal.aggressorNation, "War crime confirmed by Peace Oracle");
        }

        emit AllianceDefenseActivated(
            proposalId,
            proposal.targetRegion,
            proposal.aggressorNation,
            proposal.action,
            block.timestamp
        );
    }

    /**
     * @notice Lock aggressor nation (freeze all transactions)
     */
    function lockAggressor(bytes32 nationId, string memory reason) internal {
        isAggressorLocked[nationId] = true;

        // In production, freeze all vault transactions for this nation
        Nation storage nation = nations[nationId];
        nation.isActive = false;

        emit AggressorLocked(nationId, reason, block.timestamp);
    }

    /**
     * @notice Manually finalize proposal after voting period
     */
    function finalizeProposal(bytes32 proposalId) external {
        DefenseProposal storage proposal = defenseProposals[proposalId];
        require(proposal.proposalId != bytes32(0), "Proposal does not exist");
        require(block.timestamp >= proposal.votingEndsAt, "Voting still in progress");
        require(!proposal.executed, "Already executed");

        uint256 votePercentage = (proposal.votesFor * 100) / totalMemberNations;

        if (votePercentage >= ALLIANCE_VOTE_THRESHOLD && proposal.peaceOracleConfirmed) {
            executeDefenseProposal(proposalId);
        } else {
            proposal.executed = true; // Mark as executed but not approved
        }
    }

    // ============ ADMIN FUNCTIONS ============

    function updatePeaceOracle(address newOracle) external onlyOwner {
        peaceOracleAddress = newOracle;
    }

    function unlockAggressor(bytes32 nationId) external onlyOwner {
        isAggressorLocked[nationId] = false;
        nations[nationId].isActive = true;
    }

    // ============ VIEW FUNCTIONS ============

    function getNation(bytes32 nationId) external view returns (Nation memory) {
        return nations[nationId];
    }

    function getProposal(bytes32 proposalId) external view returns (DefenseProposal memory) {
        return defenseProposals[proposalId];
    }

    function getVotingProgress(bytes32 proposalId) external view returns (
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVotes,
        uint256 votePercentage,
        bool thresholdReached,
        bool oracleConfirmed
    ) {
        DefenseProposal memory proposal = defenseProposals[proposalId];
        votesFor = proposal.votesFor;
        votesAgainst = proposal.votesAgainst;
        totalVotes = votesFor + votesAgainst;
        votePercentage = totalMemberNations > 0 ? (votesFor * 100) / totalMemberNations : 0;
        thresholdReached = votePercentage >= ALLIANCE_VOTE_THRESHOLD;
        oracleConfirmed = proposal.peaceOracleConfirmed;
    }

    function isNationLocked(bytes32 nationId) external view returns (bool) {
        return isAggressorLocked[nationId];
    }
}

