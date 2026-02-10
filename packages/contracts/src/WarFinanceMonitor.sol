// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WarFinanceMonitor
 * @notice The Ghost-Army Audit - Treasury Monitoring for Peace
 * 
 * "When war profiteers try to steal, the heartbeat stops them."
 * 
 * Features:
 * - Monitor all Treasury outflows
 * - Auto-lock transactions > $10M without DAO Peace Approval
 * - Alert every Citizen via push notification
 * - Prevent "Ghost Army" fraud (fake military spending)
 * 
 * Born in Lagos, Nigeria. Built for Peace.
 */
contract WarFinanceMonitor is Ownable, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    uint256 public constant LARGE_OUTFLOW_THRESHOLD = 10_000_000 * 10**18; // $10M in wei
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant QUORUM_PERCENTAGE = 51; // 51% of citizens must vote
    
    // ============ STATE VARIABLES ============
    
    address public treasuryAddress;
    uint256 public totalCitizens;
    
    // Proposal ID => Peace Approval Status
    mapping(bytes32 => PeaceProposal) public peaceProposals;
    
    // Proposal ID => Citizen Address => Voted
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    // Citizen Address => Is Vitalized
    mapping(address => bool) public isVitalizedCitizen;
    
    // ============ STRUCTS ============
    
    struct PeaceProposal {
        bytes32 proposalId;
        address destination;
        uint256 amount;
        string purpose;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 votingEndsAt;
        bool approved;
        bool executed;
        bool locked;
    }
    
    struct TreasuryOutflow {
        address destination;
        uint256 amount;
        string purpose;
        uint256 timestamp;
        bool blocked;
        bytes32 proposalId;
    }
    
    // ============ EVENTS ============
    
    event TreasuryOutflowBlocked(
        bytes32 indexed proposalId,
        address indexed destination,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    event PeaceProposalCreated(
        bytes32 indexed proposalId,
        address indexed destination,
        uint256 amount,
        string purpose,
        uint256 votingEndsAt
    );
    
    event CitizenVoted(
        bytes32 indexed proposalId,
        address indexed citizen,
        bool voteFor,
        uint256 timestamp
    );
    
    event PeaceProposalApproved(
        bytes32 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 timestamp
    );
    
    event PeaceProposalRejected(
        bytes32 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 timestamp
    );
    
    event CitizenAlertTriggered(
        bytes32 indexed proposalId,
        uint256 totalCitizens,
        string alertType,
        uint256 amount,
        uint256 timestamp
    );
    
    event TreasuryOutflowExecuted(
        bytes32 indexed proposalId,
        address indexed destination,
        uint256 amount,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _treasuryAddress) {
        treasuryAddress = _treasuryAddress;
        totalCitizens = 0;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Monitor Treasury outflow and auto-lock if necessary
     * @param destination Recipient address
     * @param amount Amount to transfer
     * @param purpose Purpose of the transfer
     * @return approved Whether the transaction is approved
     */
    function monitorTreasuryOutflow(
        address destination,
        uint256 amount,
        string memory purpose
    ) external onlyOwner nonReentrant returns (bool approved) {
        // Generate proposal ID
        bytes32 proposalId = keccak256(
            abi.encodePacked(destination, amount, purpose, block.timestamp)
        );
        
        // Check if amount exceeds threshold
        if (amount > LARGE_OUTFLOW_THRESHOLD) {
            // Check if DAO Peace Approval exists
            PeaceProposal storage proposal = peaceProposals[proposalId];
            
            if (!proposal.approved) {
                // Auto-lock transaction
                proposal.proposalId = proposalId;
                proposal.destination = destination;
                proposal.amount = amount;
                proposal.purpose = purpose;
                proposal.createdAt = block.timestamp;
                proposal.votingEndsAt = block.timestamp + VOTING_PERIOD;
                proposal.locked = true;
                
                emit TreasuryOutflowBlocked(
                    proposalId,
                    destination,
                    amount,
                    "NO_DAO_PEACE_APPROVAL",
                    block.timestamp
                );
                
                emit PeaceProposalCreated(
                    proposalId,
                    destination,
                    amount,
                    purpose,
                    proposal.votingEndsAt
                );
                
                // Alert all citizens
                triggerCitizenAlert(proposalId, amount, "LARGE_TREASURY_OUTFLOW_BLOCKED");
                
                return false;
            }
            
            // If approved, allow transaction
            if (proposal.approved && !proposal.executed) {
                proposal.executed = true;
                
                emit TreasuryOutflowExecuted(
                    proposalId,
                    destination,
                    amount,
                    block.timestamp
                );
                
                return true;
            }
        }
        
        // Small transactions (< $10M) are auto-approved
        return true;
    }
    
    /**
     * @notice Citizens vote on Peace Proposal
     * @param proposalId Proposal ID
     * @param voteFor True = approve, False = reject
     */
    function voteOnPeaceProposal(bytes32 proposalId, bool voteFor) external {
        require(isVitalizedCitizen[msg.sender], "Only Vitalized Citizens can vote");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        PeaceProposal storage proposal = peaceProposals[proposalId];
        require(proposal.locked, "Proposal does not exist");
        require(block.timestamp < proposal.votingEndsAt, "Voting period ended");
        require(!proposal.approved && !proposal.executed, "Proposal already finalized");
        
        // Record vote
        hasVoted[proposalId][msg.sender] = true;
        
        if (voteFor) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }
        
        emit CitizenVoted(proposalId, msg.sender, voteFor, block.timestamp);
        
        // Check if quorum reached
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 quorumRequired = (totalCitizens * QUORUM_PERCENTAGE) / 100;
        
        if (totalVotes >= quorumRequired) {
            finalizeProposal(proposalId);
        }
    }
    
    /**
     * @notice Finalize proposal after voting period or quorum reached
     */
    function finalizeProposal(bytes32 proposalId) public {
        PeaceProposal storage proposal = peaceProposals[proposalId];
        require(proposal.locked, "Proposal does not exist");
        require(!proposal.approved && !proposal.executed, "Proposal already finalized");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 quorumRequired = (totalCitizens * QUORUM_PERCENTAGE) / 100;
        
        // Check if voting ended OR quorum reached
        require(
            block.timestamp >= proposal.votingEndsAt || totalVotes >= quorumRequired,
            "Voting still in progress"
        );
        
        // Approve if majority voted FOR
        if (proposal.votesFor > proposal.votesAgainst) {
            proposal.approved = true;
            proposal.locked = false;
            
            emit PeaceProposalApproved(
                proposalId,
                proposal.votesFor,
                proposal.votesAgainst,
                block.timestamp
            );
            
            triggerCitizenAlert(proposalId, proposal.amount, "PEACE_PROPOSAL_APPROVED");
        } else {
            emit PeaceProposalRejected(
                proposalId,
                proposal.votesFor,
                proposal.votesAgainst,
                block.timestamp
            );
            
            triggerCitizenAlert(proposalId, proposal.amount, "PEACE_PROPOSAL_REJECTED");
        }
    }
    
    /**
     * @notice Trigger push notification to all citizens
     */
    function triggerCitizenAlert(
        bytes32 proposalId,
        uint256 amount,
        string memory alertType
    ) internal {
        emit CitizenAlertTriggered(
            proposalId,
            totalCitizens,
            alertType,
            amount,
            block.timestamp
        );
        
        // In production, integrate with push notification service
        // e.g., Firebase Cloud Messaging, OneSignal, etc.
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function registerCitizen(address citizen) external onlyOwner {
        require(!isVitalizedCitizen[citizen], "Already registered");
        isVitalizedCitizen[citizen] = true;
        totalCitizens++;
    }
    
    function batchRegisterCitizens(address[] memory citizens) external onlyOwner {
        for (uint256 i = 0; i < citizens.length; i++) {
            if (!isVitalizedCitizen[citizens[i]]) {
                isVitalizedCitizen[citizens[i]] = true;
                totalCitizens++;
            }
        }
    }
    
    function updateTreasuryAddress(address newTreasury) external onlyOwner {
        treasuryAddress = newTreasury;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getProposal(bytes32 proposalId) external view returns (PeaceProposal memory) {
        return peaceProposals[proposalId];
    }
    
    function hasVotedOnProposal(bytes32 proposalId, address citizen) external view returns (bool) {
        return hasVoted[proposalId][citizen];
    }
    
    function getVotingProgress(bytes32 proposalId) external view returns (
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVotes,
        uint256 quorumRequired,
        bool quorumReached
    ) {
        PeaceProposal memory proposal = peaceProposals[proposalId];
        votesFor = proposal.votesFor;
        votesAgainst = proposal.votesAgainst;
        totalVotes = votesFor + votesAgainst;
        quorumRequired = (totalCitizens * QUORUM_PERCENTAGE) / 100;
        quorumReached = totalVotes >= quorumRequired;
    }
}

