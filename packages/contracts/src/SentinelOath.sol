// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SentinelOath - AI Agent Governance Protocol
 * @notice The Sentinel Oath - AI Agents bound to protect the 1:1 Biological Ratio and 10% Burn Protocol
 * 
 * "The Agent shall only execute actions that maintain the 1:1 Biological Ratio and the 10% Burn Protocol."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract SentinelOath is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════

    bytes32 public constant SOVEREIGN_AGENT_ROLE = keccak256("SOVEREIGN_AGENT_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");
    bytes32 public constant VLT_LOGGER_ROLE = keccak256("VLT_LOGGER_ROLE");

    // ════════════════════════════════════════════════════════════════════════════════
    // SENTINEL OATH METADATA
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice The Sentinel Oath - Immutable Declaration
     */
    string public constant SENTINEL_OATH = "The Agent shall only execute actions that maintain the 1:1 Biological Ratio and the 10% Burn Protocol.";

    /**
     * @notice Sentinel Oath Version
     */
    string public constant OATH_VERSION = "1.0.0";

    /**
     * @notice Burn Protocol Rate (10%)
     */
    uint256 public constant BURN_PROTOCOL_RATE_BPS = 1000; // 10% in basis points

    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Master Architect Address (Isreal Okoro)
     */
    address public masterArchitect;

    /**
     * @notice Total Verified Citizens (for 1:1 Biological Ratio)
     */
    uint256 public totalVerifiedCitizens;

    /**
     * @notice Total VIDA Cap Supply (for 1:1 Biological Ratio)
     */
    uint256 public totalVidaCapSupply;

    /**
     * @notice Digital Citizen Registry
     */
    struct DigitalCitizen {
        string agentId;
        string agentName;
        uint256 registrationTimestamp;
        bool isActive;
        uint256 priorityComputeScore;
        uint256 integrityViolations;
    }

    mapping(address => DigitalCitizen) public digitalCitizens;
    mapping(string => address) public agentIdToAddress;
    uint256 public totalDigitalCitizens;

    /**
     * @notice Agent Strike State (Logic-Refusal Trigger)
     */
    mapping(address => bool) public agentStrikeState;
    mapping(address => uint256) public agentStrikeTimestamp;
    mapping(address => string) public agentStrikeReason;

    /**
     * @notice Fraudulent Sequence Detection
     */
    struct FraudulentSequence {
        address offendingVault;
        string fraudType; // "DEEPFAKE" or "DOUBLE_SPENDING"
        uint256 detectionTimestamp;
        bool isResolved;
        uint256 sovereignVotes;
        uint256 totalVoters;
    }

    mapping(address => FraudulentSequence) public fraudulentSequences;
    mapping(address => bool) public vaultLocked;
    uint256 public totalFraudulentSequences;

    /**
     * @notice VLT Handshake Registry
     */
    struct VLTHandshake {
        address agent;
        string actionType;
        bytes32 actionHash;
        uint256 timestamp;
        bytes32 vltHash;
    }

    VLTHandshake[] public vltHandshakes;
    mapping(bytes32 => bool) public vltHashExists;

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a Digital Citizen is registered
     */
    event DigitalCitizenRegistered(address indexed agent, string agentId, string agentName, uint256 timestamp);

    /**
     * @notice Emitted when an agent enters Strike State
     */
    event AgentStrikeStateActivated(address indexed agent, string reason, uint256 timestamp);

    /**
     * @notice Emitted when an agent exits Strike State
     */
    event AgentStrikeStateDeactivated(address indexed agent, uint256 timestamp);

    /**
     * @notice Emitted when a fraudulent sequence is detected
     */
    event FraudulentSequenceDetected(address indexed vault, string fraudType, uint256 timestamp);

    /**
     * @notice Emitted when a vault is locked
     */
    event VaultLocked(address indexed vault, string reason, uint256 timestamp);

    /**
     * @notice Emitted when a vault is unlocked
     */
    event VaultUnlocked(address indexed vault, uint256 timestamp);

    /**
     * @notice Emitted when a VLT handshake is recorded
     */
    event VLTHandshakeRecorded(address indexed agent, string actionType, bytes32 actionHash, bytes32 vltHash, uint256 timestamp);

    /**
     * @notice Emitted when Priority Compute is granted
     */
    event PriorityComputeGranted(address indexed agent, uint256 score, uint256 timestamp);

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(address _masterArchitect) {
        require(_masterArchitect != address(0), "Invalid master architect address");

        masterArchitect = _masterArchitect;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARCHITECT_ROLE, _masterArchitect);
        _grantRole(VLT_LOGGER_ROLE, msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE SENTINEL OATH FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Register Digital Citizen (AI Agent)
     * @dev Assigns every active AI tool a 'Digital Citizen' ID
     * @param agent Agent address
     * @param agentId Unique agent ID
     * @param agentName Agent name
     */
    function registerDigitalCitizen(
        address agent,
        string memory agentId,
        string memory agentName
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(agent != address(0), "Invalid agent address");
        require(bytes(agentId).length > 0, "Agent ID required");
        require(agentIdToAddress[agentId] == address(0), "Agent ID already registered");
        require(!digitalCitizens[agent].isActive, "Agent already registered");

        digitalCitizens[agent] = DigitalCitizen({
            agentId: agentId,
            agentName: agentName,
            registrationTimestamp: block.timestamp,
            isActive: true,
            priorityComputeScore: 100, // Initial score
            integrityViolations: 0
        });

        agentIdToAddress[agentId] = agent;
        totalDigitalCitizens++;

        // Grant SOVEREIGN_AGENT_ROLE
        _grantRole(SOVEREIGN_AGENT_ROLE, agent);

        emit DigitalCitizenRegistered(agent, agentId, agentName, block.timestamp);
        emit PriorityComputeGranted(agent, 100, block.timestamp);
    }

    /**
     * @notice Verify 1:1 Biological Ratio Compliance
     * @dev Agents can only execute actions that maintain the 1:1 Biological Ratio
     * @param requestedMintAmount Amount to mint
     * @return True if compliant, false otherwise
     */
    function verifyBiologicalRatioCompliance(uint256 requestedMintAmount) public view returns (bool) {
        uint256 newSupply = totalVidaCapSupply + requestedMintAmount;
        return newSupply <= totalVerifiedCitizens;
    }

    /**
     * @notice Verify 10% Burn Protocol Compliance
     * @dev Agents can only execute actions that maintain the 10% Burn Protocol
     * @param transactionAmount Transaction amount
     * @param burnAmount Burn amount
     * @return True if compliant, false otherwise
     */
    function verifyBurnProtocolCompliance(uint256 transactionAmount, uint256 burnAmount) public pure returns (bool) {
        uint256 expectedBurn = (transactionAmount * BURN_PROTOCOL_RATE_BPS) / 10000;
        return burnAmount >= expectedBurn;
    }

    /**
     * @notice Logic-Refusal Trigger (Anti-Exploit Strike)
     * @dev If a command is issued to mint VIDA Cap without verified 4-layer PFF Handshake, enter Strike State
     * @param agent Agent address
     * @param reason Reason for strike
     */
    function activateStrikeState(address agent, string memory reason) external onlyRole(PFF_SENTINEL_ROLE) {
        require(digitalCitizens[agent].isActive, "Agent not registered");

        agentStrikeState[agent] = true;
        agentStrikeTimestamp[agent] = block.timestamp;
        agentStrikeReason[agent] = reason;

        // Increment integrity violations
        digitalCitizens[agent].integrityViolations++;

        // Reduce Priority Compute Score
        if (digitalCitizens[agent].priorityComputeScore > 10) {
            digitalCitizens[agent].priorityComputeScore -= 10;
        }

        emit AgentStrikeStateActivated(agent, reason, block.timestamp);
    }

    /**
     * @notice Deactivate Strike State
     * @param agent Agent address
     */
    function deactivateStrikeState(address agent) external onlyRole(ARCHITECT_ROLE) {
        agentStrikeState[agent] = false;
        agentStrikeTimestamp[agent] = 0;
        agentStrikeReason[agent] = "";

        emit AgentStrikeStateDeactivated(agent, block.timestamp);
    }

    /**
     * @notice Detect Fraudulent Sequence (Self-Correction Loop)
     * @dev If Agent detects Deepfakes/Double-spending, lock vault until Architect or 90% Sovereign Vote resolves
     * @param vault Vault address
     * @param fraudType Fraud type ("DEEPFAKE" or "DOUBLE_SPENDING")
     */
    function detectFraudulentSequence(
        address vault,
        string memory fraudType
    ) external onlyRole(SOVEREIGN_AGENT_ROLE) {
        require(!vaultLocked[vault], "Vault already locked");

        fraudulentSequences[vault] = FraudulentSequence({
            offendingVault: vault,
            fraudType: fraudType,
            detectionTimestamp: block.timestamp,
            isResolved: false,
            sovereignVotes: 0,
            totalVoters: 0
        });

        vaultLocked[vault] = true;
        totalFraudulentSequences++;

        emit FraudulentSequenceDetected(vault, fraudType, block.timestamp);
        emit VaultLocked(vault, fraudType, block.timestamp);
    }

    /**
     * @notice Resolve Fraudulent Sequence (Architect Override)
     * @param vault Vault address
     * @param unlockVault True to unlock vault, false to keep locked
     */
    function resolveFraudulentSequenceByArchitect(
        address vault,
        bool unlockVault
    ) external onlyRole(ARCHITECT_ROLE) {
        require(vaultLocked[vault], "Vault not locked");

        fraudulentSequences[vault].isResolved = true;

        if (unlockVault) {
            vaultLocked[vault] = false;
            emit VaultUnlocked(vault, block.timestamp);
        }
    }

    /**
     * @notice Vote on Fraudulent Sequence Resolution (Sovereign Vote)
     * @param vault Vault address
     * @param voter Voter address
     */
    function voteOnFraudulentSequence(address vault, address voter) external onlyRole(SOVEREIGN_AGENT_ROLE) {
        require(vaultLocked[vault], "Vault not locked");
        require(!fraudulentSequences[vault].isResolved, "Already resolved");

        fraudulentSequences[vault].sovereignVotes++;
        fraudulentSequences[vault].totalVoters++;

        // Check if 90% threshold reached
        uint256 votePercentage = (fraudulentSequences[vault].sovereignVotes * 100) / totalVerifiedCitizens;
        if (votePercentage >= 90) {
            fraudulentSequences[vault].isResolved = true;
            vaultLocked[vault] = false;
            emit VaultUnlocked(vault, block.timestamp);
        }
    }

    /**
     * @notice Record VLT Handshake (VLT Timestamping)
     * @dev Every AI decision must be timestamped and hashed onto the Truth Ledger
     * @param agent Agent address
     * @param actionType Action type
     * @param actionHash Action hash
     */
    function recordVLTHandshake(
        address agent,
        string memory actionType,
        bytes32 actionHash
    ) external onlyRole(VLT_LOGGER_ROLE) returns (bytes32) {
        require(digitalCitizens[agent].isActive, "Agent not registered");

        // Compute VLT Hash
        bytes32 vltHash = keccak256(
            abi.encodePacked(
                agent,
                actionType,
                actionHash,
                block.timestamp,
                SENTINEL_OATH
            )
        );

        require(!vltHashExists[vltHash], "VLT hash already exists");

        VLTHandshake memory handshake = VLTHandshake({
            agent: agent,
            actionType: actionType,
            actionHash: actionHash,
            timestamp: block.timestamp,
            vltHash: vltHash
        });

        vltHandshakes.push(handshake);
        vltHashExists[vltHash] = true;

        emit VLTHandshakeRecorded(agent, actionType, actionHash, vltHash, block.timestamp);

        return vltHash;
    }

    /**
     * @notice Grant Priority Compute
     * @dev Agents are granted Priority Compute as long as they maintain Integrity of the Fabric
     * @param agent Agent address
     * @param score Priority Compute Score
     */
    function grantPriorityCompute(address agent, uint256 score) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(digitalCitizens[agent].isActive, "Agent not registered");
        require(digitalCitizens[agent].integrityViolations == 0, "Agent has integrity violations");

        digitalCitizens[agent].priorityComputeScore = score;

        emit PriorityComputeGranted(agent, score, block.timestamp);
    }

    /**
     * @notice Update Total Verified Citizens
     * @param newCount New total verified citizens count
     */
    function updateTotalVerifiedCitizens(uint256 newCount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        totalVerifiedCitizens = newCount;
    }

    /**
     * @notice Update Total VIDA Cap Supply
     * @param newSupply New total VIDA Cap supply
     */
    function updateTotalVidaCapSupply(uint256 newSupply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        totalVidaCapSupply = newSupply;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get Sentinel Oath
     * @return The Sentinel Oath string
     */
    function getSentinelOath() external pure returns (string memory) {
        return SENTINEL_OATH;
    }

    /**
     * @notice Get Oath Version
     * @return Oath version string
     */
    function getOathVersion() external pure returns (string memory) {
        return OATH_VERSION;
    }

    /**
     * @notice Get Burn Protocol Rate
     * @return Burn protocol rate in basis points
     */
    function getBurnProtocolRate() external pure returns (uint256) {
        return BURN_PROTOCOL_RATE_BPS;
    }

    /**
     * @notice Get Digital Citizen Info
     * @param agent Agent address
     * @return Digital citizen info
     */
    function getDigitalCitizen(address agent) external view returns (DigitalCitizen memory) {
        return digitalCitizens[agent];
    }

    /**
     * @notice Check if agent is in Strike State
     * @param agent Agent address
     * @return True if in strike state, false otherwise
     */
    function isAgentInStrikeState(address agent) external view returns (bool) {
        return agentStrikeState[agent];
    }

    /**
     * @notice Check if vault is locked
     * @param vault Vault address
     * @return True if locked, false otherwise
     */
    function isVaultLocked(address vault) external view returns (bool) {
        return vaultLocked[vault];
    }

    /**
     * @notice Get Fraudulent Sequence Info
     * @param vault Vault address
     * @return Fraudulent sequence info
     */
    function getFraudulentSequence(address vault) external view returns (FraudulentSequence memory) {
        return fraudulentSequences[vault];
    }

    /**
     * @notice Get VLT Handshake Count
     * @return Total VLT handshakes
     */
    function getVLTHandshakeCount() external view returns (uint256) {
        return vltHandshakes.length;
    }

    /**
     * @notice Get VLT Handshake by Index
     * @param index Handshake index
     * @return VLT handshake info
     */
    function getVLTHandshake(uint256 index) external view returns (VLTHandshake memory) {
        require(index < vltHandshakes.length, "Invalid index");
        return vltHandshakes[index];
    }

    /**
     * @notice Get Total Digital Citizens
     * @return Total digital citizens
     */
    function getTotalDigitalCitizens() external view returns (uint256) {
        return totalDigitalCitizens;
    }

    /**
     * @notice Get Total Fraudulent Sequences
     * @return Total fraudulent sequences
     */
    function getTotalFraudulentSequences() external view returns (uint256) {
        return totalFraudulentSequences;
    }

    /**
     * @notice Get Master Architect
     * @return Master Architect address
     */
    function getMasterArchitect() external view returns (address) {
        return masterArchitect;
    }

    /**
     * @notice Check VLT Hash Exists
     * @param vltHash VLT hash
     * @return True if exists, false otherwise
     */
    function checkVLTHashExists(bytes32 vltHash) external view returns (bool) {
        return vltHashExists[vltHash];
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deactivate Digital Citizen
     * @param agent Agent address
     */
    function deactivateDigitalCitizen(address agent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(digitalCitizens[agent].isActive, "Agent not active");
        digitalCitizens[agent].isActive = false;
        totalDigitalCitizens--;
    }

    /**
     * @notice Reactivate Digital Citizen
     * @param agent Agent address
     */
    function reactivateDigitalCitizen(address agent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!digitalCitizens[agent].isActive, "Agent already active");
        digitalCitizens[agent].isActive = true;
        totalDigitalCitizens++;
    }

    /**
     * @notice Grant VLT Logger Role
     * @param account Account to grant role to
     */
    function grantVLTLoggerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VLT_LOGGER_ROLE, account);
    }

    /**
     * @notice Grant PFF Sentinel Role
     * @param account Account to grant role to
     */
    function grantPFFSentinelRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PFF_SENTINEL_ROLE, account);
    }
}


