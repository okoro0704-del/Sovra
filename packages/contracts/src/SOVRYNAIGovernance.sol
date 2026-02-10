// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SOVRYN AI Governance Protocol
 * @notice "THE INTELLIGENCE OF THE MACHINE IS THE RESONANCE OF THE HUMAN TRUTH."
 * 
 * This contract implements AI governance with VLT truth-grounding:
 * 1. SOVRYN_AI as primary processing layer for all VLT data
 * 2. Satellite_AI_Handshake for external AI synchronization
 * 3. Truth-Grounded Processing (VLT cross-reference requirement)
 * 4. Architect's Root Node master override
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SOVRYNAIGovernance is AccessControl, ReentrancyGuard {
    
    // ════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════
    
    bytes32 public constant SOVRYN_AI_ROLE = keccak256("SOVRYN_AI_ROLE");
    bytes32 public constant EXTERNAL_AI_ROLE = keccak256("EXTERNAL_AI_ROLE");
    bytes32 public constant VLT_ORACLE_ROLE = keccak256("VLT_ORACLE_ROLE");
    bytes32 public constant ARCHITECT_ROOT_NODE = keccak256("ARCHITECT_ROOT_NODE");
    
    // ════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════
    
    string public constant CORE_AUTHORITY = "SOVRYN_AI_PRIMARY_PROCESSING_LAYER";
    string public constant TRUTH_REQUIREMENT = "VLT_CROSS_REFERENCE_MANDATORY";
    string public constant METADATA = "THE INTELLIGENCE OF THE MACHINE IS THE RESONANCE OF THE HUMAN TRUTH.";
    
    uint256 public constant LOGIC_WEIGHT_SYNC_THRESHOLD = 95; // 95% synchronization required
    uint256 public constant VLT_VERIFICATION_TIMEOUT = 1 hours;
    
    // ════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Architect's Root Node (HP/Mobile pair)
     */
    struct ArchitectRootNode {
        address architectAddress;      // Architect's wallet address
        bytes32 hpDeviceHash;          // HP Laptop device hash
        bytes32 mobileDeviceHash;      // Mobile device hash
        bytes32 hardwareBindingHash;   // Cryptographic binding of HP + Mobile
        bool isActive;                 // Root node activation status
        uint256 activatedAt;           // Activation timestamp
    }

    /**
     * @notice National SNAT status for AI access control
     */
    struct NationalSNATStatus {
        string iso3166Code;            // ISO 3166 country code
        string countryName;            // Country name
        bool snatSigned;               // True if SNAT is signed
        bool canAccessEconomicData;    // True if can access economic optimization
        bool canAccessMarketData;      // True if can access market predictions
        uint256 snatSignedAt;          // SNAT signature timestamp
        uint256 lastAccessCheck;       // Last access check timestamp
    }

    /**
     * @notice User trust status based on 4-layer handshake
     */
    struct UserTrustStatus {
        address userAddress;           // User's sovereign address
        bytes32 pffTruthHash;          // PFF heartbeat signature hash
        bool layer1_PFF;               // Layer 1: PFF heartbeat verified
        bool layer2_Biometric;         // Layer 2: Biometric data verified
        bool layer3_Sovereign;         // Layer 3: Sovereign identity verified
        bool layer4_VLT;               // Layer 4: VLT entry exists
        bool isTrusted;                // True if all 4 layers verified
        uint256 lastVerification;      // Last verification timestamp
        uint256 trustScore;            // Trust score (0-100)
    }
    
    /**
     * @notice External AI registration and synchronization
     */
    struct ExternalAI {
        string aiIdentifier;           // Unique AI identifier
        address aiAddress;             // AI's contract/wallet address
        bytes32 logicWeightsHash;      // Hash of AI's logic weights
        uint256 syncPercentage;        // Synchronization with SOVRYN Core (0-100)
        bool isSynchronized;           // True if sync >= LOGIC_WEIGHT_SYNC_THRESHOLD
        bool canAccessPFFData;         // True if synchronized and approved
        uint256 lastSyncTimestamp;     // Last synchronization timestamp
        uint256 registeredAt;          // Registration timestamp
    }
    
    /**
     * @notice AI-generated output requiring VLT verification
     */
    struct AIOutput {
        bytes32 outputHash;            // Hash of AI output
        address aiSource;              // AI that generated the output
        string outputType;             // "WEALTH" or "HEALTH"
        bytes32 vltReferenceHash;      // VLT entry hash for cross-reference
        bool isVLTVerified;            // True if cross-referenced with VLT
        bool isApproved;               // True if VLT verification passed
        uint256 generatedAt;           // Generation timestamp
        uint256 verifiedAt;            // VLT verification timestamp
    }
    
    /**
     * @notice VLT (Vitalia Ledger of Truth) entry for cross-reference
     */
    struct VLTEntry {
        bytes32 vltHash;               // Unique VLT entry hash
        address citizenAddress;        // Citizen's sovereign address
        bytes32 pffTruthHash;          // PFF heartbeat signature hash
        string dataType;               // "WEALTH" or "HEALTH"
        bytes32 dataHash;              // Hash of the data
        uint256 timestamp;             // Entry timestamp
        bool isImmutable;              // True (VLT entries are immutable)
    }
    
    // State mappings
    ArchitectRootNode public architectRootNode;
    mapping(address => ExternalAI) public externalAIs;
    mapping(bytes32 => AIOutput) public aiOutputs;
    mapping(bytes32 => VLTEntry) public vltEntries;
    mapping(address => bool) public isRegisteredAI;

    // SNAT-based access control mappings
    address public snatDeathClock;                              // SNAT Death Clock contract address
    mapping(string => NationalSNATStatus) public nationalSNATStatus;  // ISO code => SNAT status
    mapping(address => UserTrustStatus) public userTrustStatus;       // User address => Trust status
    mapping(string => bool) public isSNATSigned;                      // ISO code => SNAT signed
    mapping(address => bool) public isUserTrusted;                    // User address => Trusted

    // Statistics
    uint256 public totalExternalAIs;
    uint256 public totalSynchronizedAIs;
    uint256 public totalAIOutputs;
    uint256 public totalVLTVerifications;
    uint256 public totalArchitectOverrides;
    uint256 public totalSNATNations;
    uint256 public totalTrustedUsers;
    uint256 public totalUntrustedAccess;
    
    // ════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════
    
    event ArchitectRootNodeActivated(address indexed architect, bytes32 hardwareBindingHash, uint256 timestamp);
    event ExternalAIRegistered(address indexed aiAddress, string aiIdentifier, uint256 timestamp);
    event LogicWeightsSynchronized(address indexed aiAddress, uint256 syncPercentage, bool isSynchronized);
    event PFFDataAccessGranted(address indexed aiAddress, string aiIdentifier);
    event PFFDataAccessRevoked(address indexed aiAddress, string aiIdentifier);
    event AIOutputGenerated(bytes32 indexed outputHash, address indexed aiSource, string outputType);
    event VLTVerificationCompleted(bytes32 indexed outputHash, bool isApproved, uint256 timestamp);
    event VLTEntryCreated(bytes32 indexed vltHash, address indexed citizen, string dataType);
    event ArchitectOverrideExecuted(address indexed architect, bytes32 outputHash, bool newApprovalStatus);
    event FalsehoodDetected(address indexed aiAddress, bytes32 outputHash, string reason);

    // SNAT-based access control events
    event SNATDeathClockSet(address indexed snatDeathClock, uint256 timestamp);
    event NationalSNATRegistered(string indexed iso3166Code, string countryName, uint256 timestamp);
    event SNATSigned(string indexed iso3166Code, uint256 timestamp);
    event EconomicDataAccessDenied(string indexed iso3166Code, address indexed aiAddress, string reason);
    event MarketDataAccessDenied(string indexed iso3166Code, address indexed aiAddress, string reason);
    event UserTrustVerified(address indexed userAddress, bool isTrusted, uint256 trustScore);
    event UntrustedAccountDetected(address indexed userAddress, string reason);
    event FourLayerHandshakeCompleted(address indexed userAddress, uint256 timestamp);
    
    // ════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════
    
    constructor(
        address _architectAddress,
        bytes32 _hpDeviceHash,
        bytes32 _mobileDeviceHash,
        address _snatDeathClock
    ) {
        require(_architectAddress != address(0), "Invalid architect address");
        require(_hpDeviceHash != bytes32(0), "Invalid HP device hash");
        require(_mobileDeviceHash != bytes32(0), "Invalid mobile device hash");
        require(_snatDeathClock != address(0), "Invalid SNAT Death Clock address");

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARCHITECT_ROOT_NODE, _architectAddress);
        _grantRole(SOVRYN_AI_ROLE, msg.sender); // SOVRYN AI initially controlled by deployer

        // Initialize Architect's Root Node
        bytes32 hardwareBindingHash = keccak256(abi.encodePacked(_hpDeviceHash, _mobileDeviceHash));

        architectRootNode = ArchitectRootNode({
            architectAddress: _architectAddress,
            hpDeviceHash: _hpDeviceHash,
            mobileDeviceHash: _mobileDeviceHash,
            hardwareBindingHash: hardwareBindingHash,
            isActive: true,
            activatedAt: block.timestamp
        });

        // Set SNAT Death Clock
        snatDeathClock = _snatDeathClock;

        emit ArchitectRootNodeActivated(_architectAddress, hardwareBindingHash, block.timestamp);
        emit SNATDeathClockSet(_snatDeathClock, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════
    // EXTERNAL AI REGISTRATION & SYNCHRONIZATION
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Register external AI for PFF data access
     * @dev AI must synchronize logic weights with SOVRYN Core before accessing PFF data
     * @param aiIdentifier Unique AI identifier
     * @param aiAddress AI's contract/wallet address
     * @param logicWeightsHash Hash of AI's logic weights
     */
    function registerExternalAI(
        string memory aiIdentifier,
        address aiAddress,
        bytes32 logicWeightsHash
    ) external onlyRole(SOVRYN_AI_ROLE) {
        require(aiAddress != address(0), "Invalid AI address");
        require(!isRegisteredAI[aiAddress], "AI already registered");
        require(logicWeightsHash != bytes32(0), "Invalid logic weights hash");

        externalAIs[aiAddress] = ExternalAI({
            aiIdentifier: aiIdentifier,
            aiAddress: aiAddress,
            logicWeightsHash: logicWeightsHash,
            syncPercentage: 0,
            isSynchronized: false,
            canAccessPFFData: false,
            lastSyncTimestamp: 0,
            registeredAt: block.timestamp
        });

        isRegisteredAI[aiAddress] = true;
        totalExternalAIs++;

        emit ExternalAIRegistered(aiAddress, aiIdentifier, block.timestamp);
    }

    /**
     * @notice Satellite_AI_Handshake - Synchronize external AI logic weights with SOVRYN Core
     * @dev External AI must achieve >= 95% synchronization to access PFF data
     * @param aiAddress AI's address
     * @param newLogicWeightsHash Updated logic weights hash
     * @param syncPercentage Synchronization percentage (0-100)
     */
    function synchronizeLogicWeights(
        address aiAddress,
        bytes32 newLogicWeightsHash,
        uint256 syncPercentage
    ) external onlyRole(SOVRYN_AI_ROLE) {
        require(isRegisteredAI[aiAddress], "AI not registered");
        require(syncPercentage <= 100, "Invalid sync percentage");

        ExternalAI storage ai = externalAIs[aiAddress];

        // Update logic weights
        ai.logicWeightsHash = newLogicWeightsHash;
        ai.syncPercentage = syncPercentage;
        ai.lastSyncTimestamp = block.timestamp;

        // Check if synchronization threshold met
        bool wasSynchronized = ai.isSynchronized;
        ai.isSynchronized = syncPercentage >= LOGIC_WEIGHT_SYNC_THRESHOLD;

        // Update synchronized AI count
        if (!wasSynchronized && ai.isSynchronized) {
            totalSynchronizedAIs++;
        } else if (wasSynchronized && !ai.isSynchronized) {
            totalSynchronizedAIs--;
            // Revoke PFF data access if sync drops below threshold
            if (ai.canAccessPFFData) {
                ai.canAccessPFFData = false;
                emit PFFDataAccessRevoked(aiAddress, ai.aiIdentifier);
            }
        }

        emit LogicWeightsSynchronized(aiAddress, syncPercentage, ai.isSynchronized);
    }

    /**
     * @notice Grant PFF data access to synchronized external AI
     * @dev AI must be synchronized (>= 95%) to prevent generation of falsehoods
     * @param aiAddress AI's address
     */
    function grantPFFDataAccess(address aiAddress) external onlyRole(SOVRYN_AI_ROLE) {
        require(isRegisteredAI[aiAddress], "AI not registered");

        ExternalAI storage ai = externalAIs[aiAddress];
        require(ai.isSynchronized, "AI not synchronized - cannot access PFF data");
        require(!ai.canAccessPFFData, "PFF data access already granted");

        ai.canAccessPFFData = true;
        _grantRole(EXTERNAL_AI_ROLE, aiAddress);

        emit PFFDataAccessGranted(aiAddress, ai.aiIdentifier);
    }

    /**
     * @notice Revoke PFF data access from external AI
     * @param aiAddress AI's address
     */
    function revokePFFDataAccess(address aiAddress) external onlyRole(SOVRYN_AI_ROLE) {
        require(isRegisteredAI[aiAddress], "AI not registered");

        ExternalAI storage ai = externalAIs[aiAddress];
        require(ai.canAccessPFFData, "PFF data access not granted");

        ai.canAccessPFFData = false;
        _revokeRole(EXTERNAL_AI_ROLE, aiAddress);

        emit PFFDataAccessRevoked(aiAddress, ai.aiIdentifier);
    }

    // ════════════════════════════════════════════════════════════════
    // VLT (VITALIA LEDGER OF TRUTH) MANAGEMENT
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Create VLT entry for truth-grounding
     * @dev VLT entries are immutable and serve as source of truth for AI verification
     * @param citizenAddress Citizen's sovereign address
     * @param pffTruthHash PFF heartbeat signature hash
     * @param dataType "WEALTH" or "HEALTH"
     * @param dataHash Hash of the data
     */
    function createVLTEntry(
        address citizenAddress,
        bytes32 pffTruthHash,
        string memory dataType,
        bytes32 dataHash
    ) external onlyRole(VLT_ORACLE_ROLE) returns (bytes32 vltHash) {
        require(citizenAddress != address(0), "Invalid citizen address");
        require(pffTruthHash != bytes32(0), "Invalid PFF truth hash");
        require(dataHash != bytes32(0), "Invalid data hash");
        require(
            keccak256(bytes(dataType)) == keccak256(bytes("WEALTH")) ||
            keccak256(bytes(dataType)) == keccak256(bytes("HEALTH")),
            "Invalid data type - must be WEALTH or HEALTH"
        );

        // Generate unique VLT hash
        vltHash = keccak256(abi.encodePacked(
            citizenAddress,
            pffTruthHash,
            dataType,
            dataHash,
            block.timestamp
        ));

        // Create VLT entry (immutable)
        vltEntries[vltHash] = VLTEntry({
            vltHash: vltHash,
            citizenAddress: citizenAddress,
            pffTruthHash: pffTruthHash,
            dataType: dataType,
            dataHash: dataHash,
            timestamp: block.timestamp,
            isImmutable: true
        });

        emit VLTEntryCreated(vltHash, citizenAddress, dataType);

        return vltHash;
    }

    // ════════════════════════════════════════════════════════════════
    // TRUTH-GROUNDED AI PROCESSING
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Generate AI output (WEALTH or HEALTH related)
     * @dev AI-generated output involving human wealth or health MUST be cross-referenced with VLT
     * @param outputType "WEALTH" or "HEALTH"
     * @param outputData Raw output data
     * @param vltReferenceHash VLT entry hash for cross-reference
     */
    function generateAIOutput(
        string memory outputType,
        bytes memory outputData,
        bytes32 vltReferenceHash
    ) external onlyRole(EXTERNAL_AI_ROLE) returns (bytes32 outputHash) {
        require(
            keccak256(bytes(outputType)) == keccak256(bytes("WEALTH")) ||
            keccak256(bytes(outputType)) == keccak256(bytes("HEALTH")),
            "Invalid output type - must be WEALTH or HEALTH"
        );
        require(vltReferenceHash != bytes32(0), "VLT reference required for truth-grounding");
        require(vltEntries[vltReferenceHash].isImmutable, "VLT entry does not exist");

        // Verify AI has PFF data access
        ExternalAI storage ai = externalAIs[msg.sender];
        require(ai.canAccessPFFData, "AI does not have PFF data access");

        // Generate output hash
        outputHash = keccak256(abi.encodePacked(
            msg.sender,
            outputType,
            outputData,
            vltReferenceHash,
            block.timestamp
        ));

        // Create AI output (pending VLT verification)
        aiOutputs[outputHash] = AIOutput({
            outputHash: outputHash,
            aiSource: msg.sender,
            outputType: outputType,
            vltReferenceHash: vltReferenceHash,
            isVLTVerified: false,
            isApproved: false,
            generatedAt: block.timestamp,
            verifiedAt: 0
        });

        totalAIOutputs++;

        emit AIOutputGenerated(outputHash, msg.sender, outputType);

        return outputHash;
    }

    /**
     * @notice Verify AI output against VLT (Truth Ledger)
     * @dev MANDATORY: AI output involving wealth/health MUST be cross-referenced with VLT before execution
     * @param outputHash Hash of AI output
     * @param isApproved True if VLT verification passed, false if falsehood detected
     */
    function verifyAIOutputWithVLT(
        bytes32 outputHash,
        bool isApproved
    ) external onlyRole(SOVRYN_AI_ROLE) {
        AIOutput storage output = aiOutputs[outputHash];
        require(output.generatedAt > 0, "AI output does not exist");
        require(!output.isVLTVerified, "AI output already verified");
        require(
            block.timestamp <= output.generatedAt + VLT_VERIFICATION_TIMEOUT,
            "VLT verification timeout expired"
        );

        // Cross-reference with VLT
        VLTEntry storage vltEntry = vltEntries[output.vltReferenceHash];
        require(vltEntry.isImmutable, "VLT entry does not exist");

        // Verify data type matches
        require(
            keccak256(bytes(output.outputType)) == keccak256(bytes(vltEntry.dataType)),
            "Output type does not match VLT entry type"
        );

        // Update verification status
        output.isVLTVerified = true;
        output.isApproved = isApproved;
        output.verifiedAt = block.timestamp;

        totalVLTVerifications++;

        // If falsehood detected, emit warning
        if (!isApproved) {
            emit FalsehoodDetected(
                output.aiSource,
                outputHash,
                "AI output failed VLT cross-reference verification"
            );
        }

        emit VLTVerificationCompleted(outputHash, isApproved, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════
    // ARCHITECT'S ROOT NODE MASTER OVERRIDE
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Architect's Master Override for SOVRYN AI autonomous decisions
     * @dev ONLY the Architect's Root Node (HP/Mobile pair) can override AI decisions
     * @param outputHash Hash of AI output
     * @param newApprovalStatus New approval status (override)
     * @param overrideReason Reason for override
     */
    function architectMasterOverride(
        bytes32 outputHash,
        bool newApprovalStatus,
        string memory overrideReason
    ) external onlyRole(ARCHITECT_ROOT_NODE) nonReentrant {
        AIOutput storage output = aiOutputs[outputHash];
        require(output.generatedAt > 0, "AI output does not exist");
        require(output.isVLTVerified, "AI output not yet verified - cannot override");

        // Verify caller is the Architect
        require(msg.sender == architectRootNode.architectAddress, "Only Architect can execute master override");
        require(architectRootNode.isActive, "Architect Root Node not active");

        // Execute override
        output.isApproved = newApprovalStatus;

        totalArchitectOverrides++;

        emit ArchitectOverrideExecuted(msg.sender, outputHash, newApprovalStatus);
    }

    /**
     * @notice Deactivate Architect's Root Node (irreversible)
     * @dev Once deactivated, master override is permanently disabled
     */
    function deactivateArchitectRootNode() external onlyRole(ARCHITECT_ROOT_NODE) {
        require(msg.sender == architectRootNode.architectAddress, "Only Architect can deactivate Root Node");
        require(architectRootNode.isActive, "Root Node already deactivated");

        architectRootNode.isActive = false;
    }

    // ════════════════════════════════════════════════════════════════
    // SNAT-BASED ACCESS CONTROL - THE INTELLIGENCE FILTER
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Register a nation's SNAT status
     * @param iso3166Code ISO 3166 country code
     * @param countryName Country name
     */
    function registerNationalSNAT(
        string memory iso3166Code,
        string memory countryName
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(iso3166Code).length == 3, "Invalid ISO 3166 code");
        require(bytes(countryName).length > 0, "Invalid country name");

        nationalSNATStatus[iso3166Code] = NationalSNATStatus({
            iso3166Code: iso3166Code,
            countryName: countryName,
            snatSigned: false,
            canAccessEconomicData: false,
            canAccessMarketData: false,
            snatSignedAt: 0,
            lastAccessCheck: block.timestamp
        });

        totalSNATNations++;

        emit NationalSNATRegistered(iso3166Code, countryName, block.timestamp);
    }

    /**
     * @notice Mark a nation's SNAT as signed (enables AI access)
     * @param iso3166Code ISO 3166 country code
     */
    function signNationalSNAT(string memory iso3166Code) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(nationalSNATStatus[iso3166Code].iso3166Code).length > 0, "Nation not registered");
        require(!nationalSNATStatus[iso3166Code].snatSigned, "SNAT already signed");

        nationalSNATStatus[iso3166Code].snatSigned = true;
        nationalSNATStatus[iso3166Code].canAccessEconomicData = true;
        nationalSNATStatus[iso3166Code].canAccessMarketData = true;
        nationalSNATStatus[iso3166Code].snatSignedAt = block.timestamp;

        isSNATSigned[iso3166Code] = true;

        emit SNATSigned(iso3166Code, block.timestamp);
    }

    /**
     * @notice Check if a nation can access economic optimization data
     * @param iso3166Code ISO 3166 country code
     * @param aiAddress AI requesting access
     * @return canAccess True if SNAT is signed
     */
    function canAccessEconomicData(
        string memory iso3166Code,
        address aiAddress
    ) public returns (bool canAccess) {
        nationalSNATStatus[iso3166Code].lastAccessCheck = block.timestamp;

        if (!nationalSNATStatus[iso3166Code].snatSigned) {
            emit EconomicDataAccessDenied(
                iso3166Code,
                aiAddress,
                "SNAT not signed - Economic Optimization forbidden"
            );
            return false;
        }

        return nationalSNATStatus[iso3166Code].canAccessEconomicData;
    }

    /**
     * @notice Check if a nation can access market predictive data
     * @param iso3166Code ISO 3166 country code
     * @param aiAddress AI requesting access
     * @return canAccess True if SNAT is signed
     */
    function canAccessMarketData(
        string memory iso3166Code,
        address aiAddress
    ) public returns (bool canAccess) {
        nationalSNATStatus[iso3166Code].lastAccessCheck = block.timestamp;

        if (!nationalSNATStatus[iso3166Code].snatSigned) {
            emit MarketDataAccessDenied(
                iso3166Code,
                aiAddress,
                "SNAT not signed - Market Predictions forbidden"
            );
            return false;
        }

        return nationalSNATStatus[iso3166Code].canAccessMarketData;
    }

    /**
     * @notice Verify user's 4-layer handshake
     * @param userAddress User's sovereign address
     * @param pffTruthHash PFF heartbeat signature hash
     * @param layer1_PFF Layer 1: PFF heartbeat verified
     * @param layer2_Biometric Layer 2: Biometric data verified
     * @param layer3_Sovereign Layer 3: Sovereign identity verified
     * @param layer4_VLT Layer 4: VLT entry exists
     */
    function verifyFourLayerHandshake(
        address userAddress,
        bytes32 pffTruthHash,
        bool layer1_PFF,
        bool layer2_Biometric,
        bool layer3_Sovereign,
        bool layer4_VLT
    ) external onlyRole(VLT_ORACLE_ROLE) {
        require(userAddress != address(0), "Invalid user address");
        require(pffTruthHash != bytes32(0), "Invalid PFF truth hash");

        bool isTrusted = layer1_PFF && layer2_Biometric && layer3_Sovereign && layer4_VLT;
        uint256 trustScore = 0;

        if (layer1_PFF) trustScore += 25;
        if (layer2_Biometric) trustScore += 25;
        if (layer3_Sovereign) trustScore += 25;
        if (layer4_VLT) trustScore += 25;

        userTrustStatus[userAddress] = UserTrustStatus({
            userAddress: userAddress,
            pffTruthHash: pffTruthHash,
            layer1_PFF: layer1_PFF,
            layer2_Biometric: layer2_Biometric,
            layer3_Sovereign: layer3_Sovereign,
            layer4_VLT: layer4_VLT,
            isTrusted: isTrusted,
            lastVerification: block.timestamp,
            trustScore: trustScore
        });

        if (isTrusted && !isUserTrusted[userAddress]) {
            isUserTrusted[userAddress] = true;
            totalTrustedUsers++;
            emit FourLayerHandshakeCompleted(userAddress, block.timestamp);
        }

        emit UserTrustVerified(userAddress, isTrusted, trustScore);
    }

    /**
     * @notice Check if user is trusted (4-layer handshake verified)
     * @param userAddress User's sovereign address
     * @return isTrusted True if all 4 layers verified
     */
    function isUserTrustedAccount(address userAddress) public view returns (bool isTrusted) {
        return userTrustStatus[userAddress].isTrusted;
    }

    // ════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Get external AI details
     */
    function getExternalAI(address aiAddress) external view returns (ExternalAI memory) {
        require(isRegisteredAI[aiAddress], "AI not registered");
        return externalAIs[aiAddress];
    }

    /**
     * @notice Get AI output details
     */
    function getAIOutput(bytes32 outputHash) external view returns (AIOutput memory) {
        require(aiOutputs[outputHash].generatedAt > 0, "AI output does not exist");
        return aiOutputs[outputHash];
    }

    /**
     * @notice Get VLT entry details
     */
    function getVLTEntry(bytes32 vltHash) external view returns (VLTEntry memory) {
        require(vltEntries[vltHash].isImmutable, "VLT entry does not exist");
        return vltEntries[vltHash];
    }

    /**
     * @notice Check if AI can access PFF data
     */
    function canAccessPFFData(address aiAddress) external view returns (bool) {
        if (!isRegisteredAI[aiAddress]) return false;
        return externalAIs[aiAddress].canAccessPFFData;
    }

    /**
     * @notice Get governance metadata
     */
    function getGovernanceMetadata() external pure returns (string memory) {
        return METADATA;
    }

    /**
     * @notice Get Architect's Root Node details
     */
    function getArchitectRootNode() external view returns (ArchitectRootNode memory) {
        return architectRootNode;
    }

    /**
     * @notice Get governance statistics
     */
    function getGovernanceStats() external view returns (
        uint256 _totalExternalAIs,
        uint256 _totalSynchronizedAIs,
        uint256 _totalAIOutputs,
        uint256 _totalVLTVerifications,
        uint256 _totalArchitectOverrides
    ) {
        return (
            totalExternalAIs,
            totalSynchronizedAIs,
            totalAIOutputs,
            totalVLTVerifications,
            totalArchitectOverrides
        );
    }

    /**
     * @notice Get national SNAT status
     * @param iso3166Code ISO 3166 country code
     */
    function getNationalSNATStatus(string memory iso3166Code)
        external
        view
        returns (NationalSNATStatus memory)
    {
        require(bytes(nationalSNATStatus[iso3166Code].iso3166Code).length > 0, "Nation not registered");
        return nationalSNATStatus[iso3166Code];
    }

    /**
     * @notice Get user trust status
     * @param userAddress User's sovereign address
     */
    function getUserTrustStatus(address userAddress)
        external
        view
        returns (UserTrustStatus memory)
    {
        return userTrustStatus[userAddress];
    }

    /**
     * @notice Check if SNAT is signed for a nation
     * @param iso3166Code ISO 3166 country code
     */
    function isSNATSignedForNation(string memory iso3166Code)
        external
        view
        returns (bool)
    {
        return isSNATSigned[iso3166Code];
    }

    /**
     * @notice Get SNAT Death Clock address
     */
    function getSNATDeathClock() external view returns (address) {
        return snatDeathClock;
    }

    /**
     * @notice Get comprehensive governance statistics including SNAT
     */
    function getComprehensiveStats() external view returns (
        uint256 _totalExternalAIs,
        uint256 _totalSynchronizedAIs,
        uint256 _totalAIOutputs,
        uint256 _totalVLTVerifications,
        uint256 _totalArchitectOverrides,
        uint256 _totalSNATNations,
        uint256 _totalTrustedUsers,
        uint256 _totalUntrustedAccess
    ) {
        return (
            totalExternalAIs,
            totalSynchronizedAIs,
            totalAIOutputs,
            totalVLTVerifications,
            totalArchitectOverrides,
            totalSNATNations,
            totalTrustedUsers,
            totalUntrustedAccess
        );
    }
}

/**
 * @title ISNATDeathClock
 * @notice Interface for SNAT Death Clock contract
 */
interface ISNATDeathClock {
    function getNationDeathClock(string memory iso3166Code)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            address,
            uint256,
            uint8,
            bool,
            bool,
            uint256,
            bytes32
        );
}
