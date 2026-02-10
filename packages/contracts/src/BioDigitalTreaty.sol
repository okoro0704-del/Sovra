// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BioDigitalTreaty (Protocol 1.0)
 * @notice The Bio-Digital Treaty - AI Oversight for Sovereign Wealth Protection
 * 
 * "THE MACHINES SERVE THE SOUL. THE SOUL GOVERNS THE MACHINE. THIS IS THE BIO-DIGITAL TREATY."
 * 
 * This contract defines the AI's mandate to protect sovereign wealth and enforce biological locks.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract BioDigitalTreaty is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════

    bytes32 public constant AI_SENTINEL_ROLE = keccak256("AI_SENTINEL_ROLE");
    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant ARCHITECT_ROLE = keccak256("ARCHITECT_ROLE");

    // ════════════════════════════════════════════════════════════════
    // TREATY METADATA - GENESIS BLOCK EMBEDDING
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice The Bio-Digital Treaty - Immutable Declaration
     * @dev This treaty is embedded in the Genesis Block and cannot be changed
     */
    string public constant BIO_DIGITAL_TREATY = "THE MACHINES SERVE THE SOUL. THE SOUL GOVERNS THE MACHINE. THIS IS THE BIO-DIGITAL TREATY.";

    /**
     * @notice Treaty Version
     */
    string public constant TREATY_VERSION = "1.0.0";

    /**
     * @notice Treaty Protocol Name
     */
    string public constant TREATY_PROTOCOL_NAME = "BIO_DIGITAL_TREATY";

    /**
     * @notice AI Primary Directive
     */
    string public constant AI_MANDATE = "To protect the Sovereign Wealth of the People and the Integrity of the Truth Ledger (VLT).";

    // ════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Master Architect Address (Isreal Okoro)
     */
    address public masterArchitect;

    /**
     * @notice Total Verified Citizens (for 1:1 Biological Lock)
     */
    uint256 public totalVerifiedCitizens;

    /**
     * @notice Total VIDA Cap Supply (for 1:1 Biological Lock)
     */
    uint256 public totalVidaCapSupply;

    /**
     * @notice 1:1 Equilibrium Reached Flag
     */
    bool public isEquilibriumReached;

    /**
     * @notice Frozen Nodes (24-hour freeze for exploit attempts)
     */
    mapping(address => uint256) public frozenNodes; // address => unfreeze timestamp

    /**
     * @notice Vault Stasis (vaults in stasis until PFF-verified owner returns)
     */
    mapping(address => bool) public vaultStasis;

    /**
     * @notice Vault Last Heartbeat Timestamp
     */
    mapping(address => uint256) public vaultLastHeartbeat;

    /**
     * @notice Heartbeat Timeout (30 days)
     */
    uint256 public constant HEARTBEAT_TIMEOUT = 30 days;

    /**
     * @notice Node Freeze Duration (24 hours)
     */
    uint256 public constant NODE_FREEZE_DURATION = 24 hours;

    /**
     * @notice Exploit Attempt Counter
     */
    mapping(address => uint256) public exploitAttempts;

    /**
     * @notice Total Exploit Attempts Detected
     */
    uint256 public totalExploitAttempts;

    // ════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when 1:1 equilibrium is reached
     */
    event EquilibriumReached(uint256 totalVerifiedCitizens, uint256 totalVidaCapSupply, uint256 timestamp);

    /**
     * @notice Emitted when a minting operation is blocked by 1:1 Biological Lock
     */
    event MintingBlockedByBiologicalLock(address indexed requester, uint256 requestedAmount, uint256 timestamp);

    /**
     * @notice Emitted when an exploit attempt is detected
     */
    event ExploitAttemptDetected(address indexed attacker, string reason, uint256 timestamp);

    /**
     * @notice Emitted when a node is frozen
     */
    event NodeFrozen(address indexed node, uint256 unfreezeTimestamp, string reason);

    /**
     * @notice Emitted when a vault is placed in stasis
     */
    event VaultPlacedInStasis(address indexed vault, string reason, uint256 timestamp);

    /**
     * @notice Emitted when a vault is released from stasis
     */
    event VaultReleasedFromStasis(address indexed vault, uint256 timestamp);

    /**
     * @notice Emitted when a heartbeat is recorded
     */
    event HeartbeatRecorded(address indexed vault, uint256 timestamp);

    /**
     * @notice Emitted when Architect command is PFF-verified
     */
    event ArchitectCommandVerified(address indexed architect, bytes32 commandHash, uint256 timestamp);

    // ════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════

    constructor(address _masterArchitect) {
        require(_masterArchitect != address(0), "Invalid master architect address");

        masterArchitect = _masterArchitect;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AI_SENTINEL_ROLE, msg.sender);
        _grantRole(PFF_SENTINEL_ROLE, msg.sender);
        _grantRole(ARCHITECT_ROLE, _masterArchitect);
    }

    // ════════════════════════════════════════════════════════════════
    // CORE TREATY FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Update Total Verified Citizens (for 1:1 Biological Lock)
     * @param newCount New total verified citizens count
     */
    function updateTotalVerifiedCitizens(uint256 newCount) external onlyRole(AI_SENTINEL_ROLE) {
        totalVerifiedCitizens = newCount;

        // Check if 1:1 equilibrium is reached
        if (totalVidaCapSupply >= totalVerifiedCitizens && !isEquilibriumReached) {
            isEquilibriumReached = true;
            emit EquilibriumReached(totalVerifiedCitizens, totalVidaCapSupply, block.timestamp);
        }
    }

    /**
     * @notice Update Total VIDA Cap Supply (for 1:1 Biological Lock)
     * @param newSupply New total VIDA Cap supply
     */
    function updateTotalVidaCapSupply(uint256 newSupply) external onlyRole(AI_SENTINEL_ROLE) {
        totalVidaCapSupply = newSupply;

        // Check if 1:1 equilibrium is reached
        if (totalVidaCapSupply >= totalVerifiedCitizens && !isEquilibriumReached) {
            isEquilibriumReached = true;
            emit EquilibriumReached(totalVerifiedCitizens, totalVidaCapSupply, block.timestamp);
        }
    }

    /**
     * @notice Authorize Minting Operation (1:1 Biological Lock)
     * @dev AI is strictly prohibited from authorizing minting that exceeds TotalVerifiedCitizens once equilibrium is met
     * @param requester Address requesting minting
     * @param amount Amount to mint
     * @return True if authorized, false otherwise
     */
    function authorizeMinting(address requester, uint256 amount) external onlyRole(AI_SENTINEL_ROLE) returns (bool) {
        // Check if node is frozen
        if (frozenNodes[requester] > block.timestamp) {
            emit MintingBlockedByBiologicalLock(requester, amount, block.timestamp);
            return false;
        }

        // 1:1 BIOLOGICAL LOCK: Once equilibrium is reached, no minting beyond TotalVerifiedCitizens
        if (isEquilibriumReached) {
            uint256 newSupply = totalVidaCapSupply + amount;
            if (newSupply > totalVerifiedCitizens) {
                emit MintingBlockedByBiologicalLock(requester, amount, block.timestamp);
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Detect and Flag Exploit Attempt (Anti-Exploit Strike)
     * @dev If an attempt is made to bypass the 4-Layer PFF Handshake, freeze the node for 24 hours
     * @param attacker Address attempting exploit
     * @param reason Reason for flagging
     */
    function flagExploitAttempt(address attacker, string memory reason) external onlyRole(AI_SENTINEL_ROLE) {
        // Increment exploit attempt counter
        exploitAttempts[attacker]++;
        totalExploitAttempts++;

        // Freeze node for 24 hours
        frozenNodes[attacker] = block.timestamp + NODE_FREEZE_DURATION;

        emit ExploitAttemptDetected(attacker, reason, block.timestamp);
        emit NodeFrozen(attacker, frozenNodes[attacker], reason);
    }

    /**
     * @notice Verify 4-Layer PFF Handshake (Anti-Exploit Protection)
     * @param user User address
     * @param pffSignature PFF signature
     * @param pffVerificationProof PFF verification proof
     * @return True if verified, false otherwise
     */
    function verifyPFFHandshake(
        address user,
        bytes memory pffSignature,
        bytes32 pffVerificationProof
    ) external onlyRole(AI_SENTINEL_ROLE) returns (bool) {
        // Check if node is frozen
        if (frozenNodes[user] > block.timestamp) {
            flagExploitAttempt(user, "Attempted action while node frozen");
            return false;
        }

        // Verify PFF signature and proof
        if (pffSignature.length == 0 || pffVerificationProof == bytes32(0)) {
            flagExploitAttempt(user, "Invalid PFF handshake - missing signature or proof");
            return false;
        }

        // In production, this would verify the actual PFF signature
        // For now, we perform basic validation
        return true;
    }

    /**
     * @notice Record Heartbeat (Passive Oversight)
     * @dev AI monitors for vault anomalies - if vault accessed without heartbeat, place in stasis
     * @param vault Vault address
     */
    function recordHeartbeat(address vault) external onlyRole(PFF_SENTINEL_ROLE) {
        vaultLastHeartbeat[vault] = block.timestamp;

        // Release from stasis if in stasis
        if (vaultStasis[vault]) {
            vaultStasis[vault] = false;
            emit VaultReleasedFromStasis(vault, block.timestamp);
        }

        emit HeartbeatRecorded(vault, block.timestamp);
    }

    /**
     * @notice Check Vault Heartbeat and Place in Stasis if Needed (Self-Correction Loop)
     * @dev If a vault is accessed without a heartbeat signature, place in stasis
     * @param vault Vault address
     * @return True if vault is active, false if in stasis
     */
    function checkVaultHeartbeat(address vault) external onlyRole(AI_SENTINEL_ROLE) returns (bool) {
        // Check if vault has recent heartbeat
        if (vaultLastHeartbeat[vault] == 0) {
            // No heartbeat recorded - place in stasis
            vaultStasis[vault] = true;
            emit VaultPlacedInStasis(vault, "No heartbeat signature detected", block.timestamp);
            return false;
        }

        // Check if heartbeat is stale (> 30 days)
        if (block.timestamp - vaultLastHeartbeat[vault] > HEARTBEAT_TIMEOUT) {
            // Stale heartbeat - place in stasis
            vaultStasis[vault] = true;
            emit VaultPlacedInStasis(vault, "Heartbeat timeout - no activity for 30 days", block.timestamp);
            return false;
        }

        return true;
    }

    /**
     * @notice Verify Architect Command (Master-Architect Override)
     * @dev Even the Architect's commands must be PFF-verified to prevent identity-theft-at-the-top
     * @param architect Architect address
     * @param commandHash Hash of the command
     * @param pffSignature PFF signature
     * @param pffVerificationProof PFF verification proof
     * @return True if verified, false otherwise
     */
    function verifyArchitectCommand(
        address architect,
        bytes32 commandHash,
        bytes memory pffSignature,
        bytes32 pffVerificationProof
    ) external onlyRole(AI_SENTINEL_ROLE) returns (bool) {
        // Verify architect is the master architect
        if (architect != masterArchitect) {
            flagExploitAttempt(architect, "Unauthorized architect command attempt");
            return false;
        }

        // Verify PFF signature and proof
        if (pffSignature.length == 0 || pffVerificationProof == bytes32(0)) {
            flagExploitAttempt(architect, "Architect command missing PFF verification");
            return false;
        }

        // In production, this would verify the actual PFF signature
        // For now, we perform basic validation

        emit ArchitectCommandVerified(architect, commandHash, block.timestamp);
        return true;
    }

    // ════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Get Bio-Digital Treaty
     * @return The Bio-Digital Treaty string
     */
    function getBioDigitalTreaty() external pure returns (string memory) {
        return BIO_DIGITAL_TREATY;
    }

    /**
     * @notice Get AI Mandate
     * @return The AI Mandate string
     */
    function getAIMandate() external pure returns (string memory) {
        return AI_MANDATE;
    }

    /**
     * @notice Get Treaty Version
     * @return Treaty version string
     */
    function getTreatyVersion() external pure returns (string memory) {
        return TREATY_VERSION;
    }

    /**
     * @notice Check if node is frozen
     * @param node Node address
     * @return True if frozen, false otherwise
     */
    function isNodeFrozen(address node) external view returns (bool) {
        return frozenNodes[node] > block.timestamp;
    }

    /**
     * @notice Check if vault is in stasis
     * @param vault Vault address
     * @return True if in stasis, false otherwise
     */
    function isVaultInStasis(address vault) external view returns (bool) {
        return vaultStasis[vault];
    }

    /**
     * @notice Get vault last heartbeat timestamp
     * @param vault Vault address
     * @return Last heartbeat timestamp
     */
    function getVaultLastHeartbeat(address vault) external view returns (uint256) {
        return vaultLastHeartbeat[vault];
    }

    /**
     * @notice Get exploit attempts for address
     * @param addr Address to check
     * @return Number of exploit attempts
     */
    function getExploitAttempts(address addr) external view returns (uint256) {
        return exploitAttempts[addr];
    }

    /**
     * @notice Get total exploit attempts detected
     * @return Total exploit attempts
     */
    function getTotalExploitAttempts() external view returns (uint256) {
        return totalExploitAttempts;
    }

    /**
     * @notice Check if 1:1 equilibrium is reached
     * @return True if equilibrium reached, false otherwise
     */
    function isEquilibriumMet() external view returns (bool) {
        return isEquilibriumReached;
    }

    /**
     * @notice Get Master Architect address
     * @return Master Architect address
     */
    function getMasterArchitect() external view returns (address) {
        return masterArchitect;
    }

    // ════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Grant AI Sentinel role
     * @param account Account to grant role to
     */
    function grantAISentinelRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(AI_SENTINEL_ROLE, account);
    }

    /**
     * @notice Grant PFF Sentinel role
     * @param account Account to grant role to
     */
    function grantPFFSentinelRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PFF_SENTINEL_ROLE, account);
    }

    /**
     * @notice Manually unfreeze node (emergency only)
     * @param node Node address to unfreeze
     */
    function emergencyUnfreezeNode(address node) external onlyRole(ARCHITECT_ROLE) {
        frozenNodes[node] = 0;
    }

    /**
     * @notice Manually release vault from stasis (emergency only)
     * @param vault Vault address to release
     */
    function emergencyReleaseVault(address vault) external onlyRole(ARCHITECT_ROLE) {
        vaultStasis[vault] = false;
        emit VaultReleasedFromStasis(vault, block.timestamp);
    }
}


