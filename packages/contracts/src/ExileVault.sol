// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ExileVault
 * @notice Sovereign Backup - Stateless Wealth for Destroyed Nations
 * 
 * "When infrastructure falls, the ledger remembers."
 * 
 * Features:
 * - Re-host nation's ledger in virtual Exile-Vault
 * - Preserve citizen wealth (10 VIDA per citizen)
 * - Preserve health status and medical records
 * - Enable immediate rebuilding without starting from zero
 * - DAO-governed activation
 * 
 * Born in Lagos, Nigeria. Built for Resilience.
 */
contract ExileVault is Ownable, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    uint256 public constant DESTRUCTION_THRESHOLD = 90; // 90% infrastructure destroyed
    uint256 public constant EXILE_ACTIVATION_VOTE_THRESHOLD = 66; // 66% DAO vote
    uint256 public constant CITIZEN_VIDA_GUARANTEE = 10 * 10**18; // 10 VIDA per citizen
    
    // ============ STATE VARIABLES ============
    
    uint256 public totalExileNations;
    uint256 public totalExileCitizens;
    uint256 public totalExileVaultBalance;
    
    // Nation ID => Exile Vault Data
    mapping(bytes32 => ExileNation) public exileNations;
    
    // Citizen UID => Exile Citizen Data
    mapping(string => ExileCitizen) public exileCitizens;
    
    // Nation ID => Is in Exile
    mapping(bytes32 => bool) public isInExile;
    
    // Exile Proposal ID => Proposal Data
    mapping(bytes32 => ExileProposal) public exileProposals;
    
    // Proposal ID => Nation ID => Voted
    mapping(bytes32 => mapping(bytes32 => bool)) public hasVotedOnExile;
    
    // ============ STRUCTS ============
    
    struct ExileNation {
        bytes32 nationId;
        string nationName;
        uint256 totalCitizens;
        uint256 destructionPercentage;
        uint256 exiledAt;
        uint256 totalVaultBalance; // Total VIDA in exile vault
        uint256 totalHealthRecords;
        bool isActive;
        string virtualLedgerHash; // IPFS hash of virtual ledger
    }
    
    struct ExileCitizen {
        string uid;
        bytes32 nationId;
        uint256 liquidVida;
        uint256 lockedVida;
        uint256 nvida;
        string healthRecordHash; // IPFS hash of health records
        bool healthCoverageActive;
        uint256 exiledAt;
        bool canRebuild; // Can access funds for rebuilding
    }
    
    struct ExileProposal {
        bytes32 proposalId;
        bytes32 nationId;
        string nationName;
        uint256 destructionPercentage;
        string evidenceHash; // IPFS hash of destruction evidence
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 votingEndsAt;
        bool approved;
        bool executed;
    }
    
    // ============ EVENTS ============
    
    event ExileProposalCreated(
        bytes32 indexed proposalId,
        bytes32 indexed nationId,
        string nationName,
        uint256 destructionPercentage,
        uint256 votingEndsAt
    );
    
    event ExileActivated(
        bytes32 indexed nationId,
        string nationName,
        uint256 totalCitizens,
        uint256 totalVaultBalance,
        uint256 timestamp
    );
    
    event CitizenExiled(
        string indexed uid,
        bytes32 indexed nationId,
        uint256 liquidVida,
        uint256 lockedVida,
        uint256 timestamp
    );
    
    event VirtualLedgerCreated(
        bytes32 indexed nationId,
        string virtualLedgerHash,
        uint256 timestamp
    );
    
    event RebuildFundsAccessed(
        string indexed uid,
        bytes32 indexed nationId,
        uint256 amount,
        uint256 timestamp
    );
    
    event ExileEnded(
        bytes32 indexed nationId,
        string nationName,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        totalExileNations = 0;
        totalExileCitizens = 0;
        totalExileVaultBalance = 0;
    }
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @notice Propose nation for exile (infrastructure destroyed)
     * @param nationId Nation identifier
     * @param nationName Name of the nation
     * @param destructionPercentage Percentage of infrastructure destroyed
     * @param evidenceHash IPFS hash of destruction evidence
     */
    function proposeExile(
        bytes32 nationId,
        string memory nationName,
        uint256 destructionPercentage,
        string memory evidenceHash
    ) external returns (bytes32 proposalId) {
        require(destructionPercentage >= DESTRUCTION_THRESHOLD, "Destruction threshold not met");
        require(!isInExile[nationId], "Nation already in exile");
        
        // Generate proposal ID
        proposalId = keccak256(
            abi.encodePacked(nationId, destructionPercentage, evidenceHash, block.timestamp)
        );
        
        // Create exile proposal
        ExileProposal storage proposal = exileProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.nationId = nationId;
        proposal.nationName = nationName;
        proposal.destructionPercentage = destructionPercentage;
        proposal.evidenceHash = evidenceHash;
        proposal.createdAt = block.timestamp;
        proposal.votingEndsAt = block.timestamp + 3 days;
        
        emit ExileProposalCreated(
            proposalId,
            nationId,
            nationName,
            destructionPercentage,
            proposal.votingEndsAt
        );
        
        return proposalId;
    }
    
    /**
     * @notice DAO votes on exile proposal
     * @param proposalId Proposal ID
     * @param votingNationId Voting nation ID
     * @param voteFor True = approve, False = reject
     */
    function voteOnExile(
        bytes32 proposalId,
        bytes32 votingNationId,
        bool voteFor
    ) external {
        require(!hasVotedOnExile[proposalId][votingNationId], "Already voted");
        
        ExileProposal storage proposal = exileProposals[proposalId];
        require(proposal.proposalId != bytes32(0), "Proposal does not exist");
        require(block.timestamp < proposal.votingEndsAt, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");
        
        // Record vote
        hasVotedOnExile[proposalId][votingNationId] = true;
        
        if (voteFor) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }
        
        // Check if threshold reached (in production, use actual member nation count)
        uint256 totalMemberNations = 10; // Mock value
        uint256 votePercentage = (proposal.votesFor * 100) / totalMemberNations;
        
        if (votePercentage >= EXILE_ACTIVATION_VOTE_THRESHOLD) {
            executeExile(proposalId);
        }
    }
    
    /**
     * @notice Execute exile (create virtual Exile-Vault)
     */
    function executeExile(bytes32 proposalId) internal {
        ExileProposal storage proposal = exileProposals[proposalId];
        
        require(!proposal.executed, "Already executed");
        
        uint256 totalMemberNations = 10; // Mock value
        uint256 votePercentage = (proposal.votesFor * 100) / totalMemberNations;
        require(votePercentage >= EXILE_ACTIVATION_VOTE_THRESHOLD, "Insufficient votes");
        
        proposal.approved = true;
        proposal.executed = true;
        
        // Activate exile
        activateExile(proposal.nationId, proposal.nationName);
    }
    
    /**
     * @notice Activate exile for a nation
     */
    function activateExile(bytes32 nationId, string memory nationName) internal {
        // Create exile nation
        ExileNation storage exileNation = exileNations[nationId];
        exileNation.nationId = nationId;
        exileNation.nationName = nationName;
        exileNation.exiledAt = block.timestamp;
        exileNation.isActive = true;
        
        isInExile[nationId] = true;
        totalExileNations++;
        
        emit ExileActivated(
            nationId,
            nationName,
            exileNation.totalCitizens,
            exileNation.totalVaultBalance,
            block.timestamp
        );
    }
    
    /**
     * @notice Exile a citizen (preserve their wealth and health status)
     * @param uid Citizen UID
     * @param nationId Nation ID
     * @param liquidVida Liquid VIDA balance
     * @param lockedVida Locked VIDA balance
     * @param nvida nVIDA balance
     * @param healthRecordHash IPFS hash of health records
     * @param healthCoverageActive Health coverage status
     */
    function exileCitizen(
        string memory uid,
        bytes32 nationId,
        uint256 liquidVida,
        uint256 lockedVida,
        uint256 nvida,
        string memory healthRecordHash,
        bool healthCoverageActive
    ) external nonReentrant {
        require(isInExile[nationId], "Nation not in exile");
        
        // Ensure minimum VIDA guarantee
        uint256 guaranteedLiquidVida = liquidVida < CITIZEN_VIDA_GUARANTEE 
            ? CITIZEN_VIDA_GUARANTEE 
            : liquidVida;
        
        // Create exile citizen
        ExileCitizen storage citizen = exileCitizens[uid];
        citizen.uid = uid;
        citizen.nationId = nationId;
        citizen.liquidVida = guaranteedLiquidVida;
        citizen.lockedVida = lockedVida;
        citizen.nvida = nvida;
        citizen.healthRecordHash = healthRecordHash;
        citizen.healthCoverageActive = healthCoverageActive;
        citizen.exiledAt = block.timestamp;
        citizen.canRebuild = true;
        
        // Update exile nation totals
        ExileNation storage exileNation = exileNations[nationId];
        exileNation.totalCitizens++;
        exileNation.totalVaultBalance += guaranteedLiquidVida + lockedVida;
        exileNation.totalHealthRecords++;
        
        totalExileCitizens++;
        totalExileVaultBalance += guaranteedLiquidVida + lockedVida;
        
        emit CitizenExiled(uid, nationId, guaranteedLiquidVida, lockedVida, block.timestamp);
    }
    
    /**
     * @notice Create virtual ledger for exile nation
     * @param nationId Nation ID
     * @param virtualLedgerHash IPFS hash of virtual ledger
     */
    function createVirtualLedger(
        bytes32 nationId,
        string memory virtualLedgerHash
    ) external onlyOwner {
        require(isInExile[nationId], "Nation not in exile");
        
        ExileNation storage exileNation = exileNations[nationId];
        exileNation.virtualLedgerHash = virtualLedgerHash;
        
        emit VirtualLedgerCreated(nationId, virtualLedgerHash, block.timestamp);
    }
    
    /**
     * @notice Access rebuild funds (for exiled citizens)
     * @param uid Citizen UID
     * @param amount Amount to access
     */
    function accessRebuildFunds(string memory uid, uint256 amount) external nonReentrant {
        ExileCitizen storage citizen = exileCitizens[uid];
        require(citizen.canRebuild, "Rebuild access not granted");
        require(citizen.liquidVida >= amount, "Insufficient balance");
        
        citizen.liquidVida -= amount;
        
        emit RebuildFundsAccessed(uid, citizen.nationId, amount, block.timestamp);
        
        // In production, transfer VIDA to citizen's wallet
    }
    
    /**
     * @notice End exile (nation rebuilt)
     * @param nationId Nation ID
     */
    function endExile(bytes32 nationId) external onlyOwner {
        require(isInExile[nationId], "Nation not in exile");
        
        ExileNation storage exileNation = exileNations[nationId];
        exileNation.isActive = false;
        
        isInExile[nationId] = false;
        totalExileNations--;
        
        emit ExileEnded(nationId, exileNation.nationName, block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getExileNation(bytes32 nationId) external view returns (ExileNation memory) {
        return exileNations[nationId];
    }
    
    function getExileCitizen(string memory uid) external view returns (ExileCitizen memory) {
        return exileCitizens[uid];
    }
    
    function getExileProposal(bytes32 proposalId) external view returns (ExileProposal memory) {
        return exileProposals[proposalId];
    }
}

