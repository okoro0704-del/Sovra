// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Vitalization Velocity & Elastic Load-Balancing Protocol
 * @notice "THE TRUTH SCALES INFINITELY."
 * 
 * This protocol implements:
 * 1. Predictive Scaling - SOVRYN AI Traffic Anticipation with auto-scaling validators
 * 2. 10-Billion Pivot - Automatic era transition at 5B supply (10 VCAP → 2 VCAP)
 * 3. Mesh Prioritization - Regional load balancing with P2P Gossip fallback
 * 4. Shock & Awe Buffer - Priority queue for first 1M users (<2s minting)
 * 5. System Readiness Validation
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract VitalizationVelocityProtocol is AccessControl, ReentrancyGuard {
    
    // ════════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant SOVRYN_AI_ROLE = keccak256("SOVRYN_AI_ROLE");
    bytes32 public constant VALIDATOR_MANAGER_ROLE = keccak256("VALIDATOR_MANAGER_ROLE");
    bytes32 public constant MESH_COORDINATOR_ROLE = keccak256("MESH_COORDINATOR_ROLE");
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    // Predictive Scaling
    uint256 public constant TRAFFIC_PREDICTION_WINDOW = 300; // 5 minutes
    uint256 public constant VALIDATOR_SPIN_UP_THRESHOLD = 80; // 80% capacity
    uint256 public constant MAX_VALIDATORS = 1000;
    uint256 public constant MIN_VALIDATORS = 10;
    
    // 10-Billion Pivot
    uint256 public constant THRESHOLD_5B = 5_000_000_000 * 10**18; // 5 Billion VIDA Cap
    uint256 public constant MINT_RATE_10_ERA = 10 * 10**18; // 10 VIDA Cap
    uint256 public constant MINT_RATE_2_ERA = 2 * 10**18; // 2 VIDA Cap
    
    // Mesh Prioritization
    uint256 public constant REGIONAL_CAPACITY_THRESHOLD = 80; // 80% capacity
    uint256 public constant MESH_FALLBACK_LATENCY_MS = 500; // 500ms latency threshold
    
    // Shock & Awe Buffer
    uint256 public constant PRIORITY_QUEUE_SIZE = 1_000_000; // First 1M users
    uint256 public constant TARGET_MINTING_TIME_MS = 2000; // 2 seconds
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    enum MintingEra { TEN_UNIT_ERA, TWO_UNIT_ERA }
    enum NodeStatus { INACTIVE, ACTIVE, OVERLOADED, MESH_FALLBACK }
    
    struct TrafficMetrics {
        uint256 currentRequests;
        uint256 predictedRequests;
        uint256 timestamp;
        uint256 averageLatency;
    }
    
    struct ValidatorNode {
        address nodeAddress;
        string region; // e.g., "Lagos", "Accra", "Nairobi"
        uint256 capacity;
        uint256 currentLoad;
        NodeStatus status;
        uint256 lastHealthCheck;
        bool isVirtual; // True if spun up by AI
    }
    
    struct RegionalNode {
        string region;
        uint256 totalCapacity;
        uint256 currentLoad;
        uint256 activeValidators;
        bool meshFallbackActive;
        uint256 lastLoadCheck;
    }
    
    struct PriorityQueueEntry {
        address user;
        uint256 queuePosition;
        uint256 timestamp;
        bool processed;
    }
    
    // State
    MintingEra public currentEra;
    uint256 public currentSupply;
    uint256 public totalProcessedUsers;
    uint256 public totalPriorityUsers;
    bool public systemReady;
    
    // Traffic Prediction
    TrafficMetrics public currentTrafficMetrics;
    uint256 public activeValidatorCount;
    
    // Validators
    mapping(address => ValidatorNode) public validators;
    address[] public validatorList;
    
    // Regional Nodes
    mapping(string => RegionalNode) public regionalNodes;
    string[] public regionList;
    
    // Priority Queue
    mapping(address => PriorityQueueEntry) public priorityQueue;
    uint256 public priorityQueueHead;
    
    // Mesh Network
    mapping(string => address[]) public meshPeers; // region => peer addresses
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    event TrafficPredicted(uint256 currentRequests, uint256 predictedRequests, uint256 timestamp);
    event ValidatorSpunUp(address indexed validator, string region, bool isVirtual);
    event ValidatorSpunDown(address indexed validator, string region);
    event EraTransitioned(MintingEra oldEra, MintingEra newEra, uint256 supply);
    event RegionalOverload(string region, uint256 loadPercentage, bool meshActivated);
    event MeshFallbackActivated(string region, uint256 peerCount);
    event PriorityUserQueued(address indexed user, uint256 position, uint256 timestamp);
    event PriorityUserProcessed(address indexed user, uint256 processingTime);
    event SystemReadinessChanged(bool ready, string reason);
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════
    
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SOVRYN_AI_ROLE, admin);
        _grantRole(VALIDATOR_MANAGER_ROLE, admin);
        _grantRole(MESH_COORDINATOR_ROLE, admin);
        
        currentEra = MintingEra.TEN_UNIT_ERA;
        currentSupply = 0;
        totalProcessedUsers = 0;
        totalPriorityUsers = 0;
        systemReady = false;
        activeValidatorCount = 0;
        priorityQueueHead = 0;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // 1. PREDICTIVE SCALING - TRAFFIC ANTICIPATION MODULE
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update traffic metrics and predict future load
     * @dev Called by SOVRYN AI to report current traffic
     */
    function updateTrafficMetrics(
        uint256 currentRequests,
        uint256 averageLatency
    ) external onlyRole(SOVRYN_AI_ROLE) {
        // Calculate predicted requests using exponential moving average
        uint256 predictedRequests = _predictTraffic(currentRequests);

        currentTrafficMetrics = TrafficMetrics({
            currentRequests: currentRequests,
            predictedRequests: predictedRequests,
            timestamp: block.timestamp,
            averageLatency: averageLatency
        });

        emit TrafficPredicted(currentRequests, predictedRequests, block.timestamp);

        // Auto-scale validators if needed
        _autoScaleValidators(predictedRequests);
    }

    /**
     * @notice Predict future traffic using exponential moving average
     * @dev Internal prediction algorithm
     */
    function _predictTraffic(uint256 currentRequests) internal view returns (uint256) {
        if (currentTrafficMetrics.timestamp == 0) {
            return currentRequests;
        }

        // Exponential moving average: 70% current + 30% historical
        uint256 historicalWeight = (currentTrafficMetrics.predictedRequests * 30) / 100;
        uint256 currentWeight = (currentRequests * 70) / 100;

        return historicalWeight + currentWeight;
    }

    /**
     * @notice Auto-scale validators based on predicted traffic
     * @dev Spins up virtual validators if capacity threshold exceeded
     */
    function _autoScaleValidators(uint256 predictedRequests) internal {
        uint256 totalCapacity = _calculateTotalCapacity();

        if (totalCapacity == 0) return;

        uint256 loadPercentage = (predictedRequests * 100) / totalCapacity;

        // If load exceeds 80%, spin up more validators
        if (loadPercentage >= VALIDATOR_SPIN_UP_THRESHOLD && activeValidatorCount < MAX_VALIDATORS) {
            uint256 validatorsNeeded = ((predictedRequests - (totalCapacity * 80 / 100)) / 100) + 1;
            _spinUpValidators(validatorsNeeded);
        }

        // If load below 40%, spin down excess validators
        if (loadPercentage < 40 && activeValidatorCount > MIN_VALIDATORS) {
            uint256 validatorsToRemove = (activeValidatorCount - MIN_VALIDATORS) / 2;
            _spinDownValidators(validatorsToRemove);
        }
    }

    /**
     * @notice Spin up virtual validator nodes
     * @dev Called automatically by traffic anticipation
     */
    function _spinUpValidators(uint256 count) internal {
        for (uint256 i = 0; i < count && activeValidatorCount < MAX_VALIDATORS; i++) {
            address virtualValidator = address(uint160(uint256(keccak256(abi.encodePacked(
                block.timestamp,
                activeValidatorCount,
                i
            )))));

            validators[virtualValidator] = ValidatorNode({
                nodeAddress: virtualValidator,
                region: "VIRTUAL",
                capacity: 1000,
                currentLoad: 0,
                status: NodeStatus.ACTIVE,
                lastHealthCheck: block.timestamp,
                isVirtual: true
            });

            validatorList.push(virtualValidator);
            activeValidatorCount++;

            emit ValidatorSpunUp(virtualValidator, "VIRTUAL", true);
        }
    }

    /**
     * @notice Spin down excess virtual validators
     * @dev Called automatically when load decreases
     */
    function _spinDownValidators(uint256 count) internal {
        uint256 removed = 0;

        for (uint256 i = validatorList.length; i > 0 && removed < count; i--) {
            address validatorAddr = validatorList[i - 1];

            if (validators[validatorAddr].isVirtual && validators[validatorAddr].currentLoad == 0) {
                validators[validatorAddr].status = NodeStatus.INACTIVE;
                activeValidatorCount--;
                removed++;

                emit ValidatorSpunDown(validatorAddr, validators[validatorAddr].region);
            }
        }
    }

    /**
     * @notice Calculate total validator capacity
     */
    function _calculateTotalCapacity() internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].status == NodeStatus.ACTIVE) {
                total += validators[validatorList[i]].capacity;
            }
        }
        return total;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // 2. THE 10-BILLION PIVOT - AUTOMATIC ERA TRANSITION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update current supply and check for era transition
     * @dev Called by VIDA Cap contract after each mint
     */
    function updateSupply(uint256 newSupply) external onlyRole(SOVRYN_AI_ROLE) {
        uint256 oldSupply = currentSupply;
        currentSupply = newSupply;

        // Check if we need to transition from 10-Unit Era to 2-Unit Era
        if (currentEra == MintingEra.TEN_UNIT_ERA && currentSupply >= THRESHOLD_5B) {
            MintingEra oldEra = currentEra;
            currentEra = MintingEra.TWO_UNIT_ERA;

            emit EraTransitioned(oldEra, currentEra, currentSupply);

            // Update system readiness message
            emit SystemReadinessChanged(
                true,
                "ERA TRANSITION COMPLETE: 10 VCAP -> 2 VCAP AT 5B SUPPLY"
            );
        }
    }

    /**
     * @notice Get current minting rate based on era
     */
    function getCurrentMintRate() external view returns (uint256) {
        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            return MINT_RATE_10_ERA;
        } else {
            return MINT_RATE_2_ERA;
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // 3. MESH PRIORITIZATION - REGIONAL LOAD BALANCING
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Register a regional node
     * @dev Called by mesh coordinator to add regional nodes
     */
    function registerRegionalNode(
        string memory region,
        uint256 capacity
    ) external onlyRole(MESH_COORDINATOR_ROLE) {
        regionalNodes[region] = RegionalNode({
            region: region,
            totalCapacity: capacity,
            currentLoad: 0,
            activeValidators: 0,
            meshFallbackActive: false,
            lastLoadCheck: block.timestamp
        });

        regionList.push(region);
    }

    /**
     * @notice Update regional load and activate mesh fallback if needed
     * @dev Called by SOVRYN AI to report regional load
     */
    function updateRegionalLoad(
        string memory region,
        uint256 currentLoad
    ) external onlyRole(SOVRYN_AI_ROLE) {
        RegionalNode storage node = regionalNodes[region];
        require(node.totalCapacity > 0, "Region not registered");

        node.currentLoad = currentLoad;
        node.lastLoadCheck = block.timestamp;

        uint256 loadPercentage = (currentLoad * 100) / node.totalCapacity;

        // If load exceeds 80%, activate mesh fallback
        if (loadPercentage >= REGIONAL_CAPACITY_THRESHOLD && !node.meshFallbackActive) {
            _activateMeshFallback(region);
            node.meshFallbackActive = true;

            emit RegionalOverload(region, loadPercentage, true);
        }

        // If load drops below 50%, deactivate mesh fallback
        if (loadPercentage < 50 && node.meshFallbackActive) {
            node.meshFallbackActive = false;
            emit RegionalOverload(region, loadPercentage, false);
        }
    }

    /**
     * @notice Activate mesh fallback for a region
     * @dev Routes traffic through P2P Gossip network
     */
    function _activateMeshFallback(string memory region) internal {
        // Get mesh peers for this region
        address[] storage peers = meshPeers[region];

        emit MeshFallbackActivated(region, peers.length);
    }

    /**
     * @notice Add mesh peer for a region
     * @dev Called by mesh coordinator to configure P2P network
     */
    function addMeshPeer(
        string memory region,
        address peerAddress
    ) external onlyRole(MESH_COORDINATOR_ROLE) {
        meshPeers[region].push(peerAddress);
    }

    /**
     * @notice Get regional load status
     */
    function getRegionalStatus(string memory region) external view returns (
        uint256 capacity,
        uint256 currentLoad,
        uint256 loadPercentage,
        bool meshActive
    ) {
        RegionalNode memory node = regionalNodes[region];
        capacity = node.totalCapacity;
        currentLoad = node.currentLoad;
        loadPercentage = capacity > 0 ? (currentLoad * 100) / capacity : 0;
        meshActive = node.meshFallbackActive;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // 4. SHOCK & AWE BUFFER - PRIORITY QUEUE FOR FIRST 1M USERS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Add user to priority queue
     * @dev First 1M users get priority processing (<2s minting)
     */
    function addToPriorityQueue(address user) external onlyRole(SOVRYN_AI_ROLE) nonReentrant {
        require(totalPriorityUsers < PRIORITY_QUEUE_SIZE, "Priority queue full");
        require(priorityQueue[user].timestamp == 0, "User already in queue");

        priorityQueue[user] = PriorityQueueEntry({
            user: user,
            queuePosition: totalPriorityUsers,
            timestamp: block.timestamp,
            processed: false
        });

        totalPriorityUsers++;

        emit PriorityUserQueued(user, totalPriorityUsers, block.timestamp);
    }

    /**
     * @notice Process priority user
     * @dev Marks user as processed and records processing time
     */
    function processPriorityUser(address user) external onlyRole(SOVRYN_AI_ROLE) nonReentrant {
        PriorityQueueEntry storage entry = priorityQueue[user];
        require(entry.timestamp > 0, "User not in queue");
        require(!entry.processed, "User already processed");

        uint256 processingTime = (block.timestamp - entry.timestamp) * 1000; // Convert to ms
        entry.processed = true;
        totalProcessedUsers++;

        emit PriorityUserProcessed(user, processingTime);

        // Verify processing time meets target (<2s)
        if (processingTime > TARGET_MINTING_TIME_MS) {
            emit SystemReadinessChanged(
                false,
                "WARNING: Priority processing exceeded 2s target"
            );
        }
    }

    /**
     * @notice Check if user is in priority queue
     */
    function isInPriorityQueue(address user) external view returns (bool) {
        return priorityQueue[user].timestamp > 0 && !priorityQueue[user].processed;
    }

    /**
     * @notice Get priority queue statistics
     */
    function getPriorityQueueStats() external view returns (
        uint256 totalQueued,
        uint256 totalProcessed,
        uint256 remainingSlots
    ) {
        totalQueued = totalPriorityUsers;
        totalProcessed = totalProcessedUsers;
        remainingSlots = PRIORITY_QUEUE_SIZE - totalPriorityUsers;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // 5. SYSTEM READINESS VALIDATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Validate system readiness for global surge
     * @dev Checks all critical components
     */
    function validateSystemReadiness() external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        bool ready = true;
        string memory reason = "";

        // Check 1: Minimum validators active
        if (activeValidatorCount < MIN_VALIDATORS) {
            ready = false;
            reason = "INSUFFICIENT_VALIDATORS";
        }

        // Check 2: Traffic prediction active
        else if (currentTrafficMetrics.timestamp == 0) {
            ready = false;
            reason = "TRAFFIC_PREDICTION_NOT_INITIALIZED";
        }

        // Check 3: Regional nodes registered
        else if (regionList.length == 0) {
            ready = false;
            reason = "NO_REGIONAL_NODES";
        }

        // Check 4: Priority queue initialized
        else if (totalPriorityUsers == 0) {
            ready = false;
            reason = "PRIORITY_QUEUE_NOT_INITIALIZED";
        }

        // All checks passed
        else {
            reason = "SYSTEM_READY_FOR_GLOBAL_SURGE_THE_TRUTH_SCALES_INFINITELY";
        }

        systemReady = ready;
        emit SystemReadinessChanged(ready, reason);

        return ready;
    }

    /**
     * @notice Get comprehensive system status
     */
    function getSystemStatus() external view returns (
        bool ready,
        MintingEra era,
        uint256 supply,
        uint256 validators,
        uint256 regions,
        uint256 priorityUsers,
        uint256 processedUsers
    ) {
        ready = systemReady;
        era = currentEra;
        supply = currentSupply;
        validators = activeValidatorCount;
        regions = regionList.length;
        priorityUsers = totalPriorityUsers;
        processedUsers = totalProcessedUsers;
    }

    /**
     * @notice Emergency system activation
     * @dev Manually activate system for global surge
     */
    function activateSystem() external onlyRole(DEFAULT_ADMIN_ROLE) {
        systemReady = true;
        emit SystemReadinessChanged(true, "SYSTEM_MANUALLY_ACTIVATED_FOR_GLOBAL_SURGE");
    }

    /**
     * @notice Emergency system shutdown
     * @dev Manually deactivate system
     */
    function deactivateSystem() external onlyRole(DEFAULT_ADMIN_ROLE) {
        systemReady = false;
        emit SystemReadinessChanged(false, "SYSTEM_MANUALLY_DEACTIVATED");
    }

    /**
     * @notice Get traffic metrics
     */
    function getTrafficMetrics() external view returns (
        uint256 currentRequests,
        uint256 predictedRequests,
        uint256 timestamp,
        uint256 averageLatency
    ) {
        currentRequests = currentTrafficMetrics.currentRequests;
        predictedRequests = currentTrafficMetrics.predictedRequests;
        timestamp = currentTrafficMetrics.timestamp;
        averageLatency = currentTrafficMetrics.averageLatency;
    }

    /**
     * @notice Get validator information
     */
    function getValidator(address validatorAddr) external view returns (
        string memory region,
        uint256 capacity,
        uint256 currentLoad,
        NodeStatus status,
        bool isVirtual
    ) {
        ValidatorNode memory validator = validators[validatorAddr];
        region = validator.region;
        capacity = validator.capacity;
        currentLoad = validator.currentLoad;
        status = validator.status;
        isVirtual = validator.isVirtual;
    }
}

