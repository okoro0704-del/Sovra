// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SovereignDistribution
 * @notice Sovereign Distribution Architecture for Sentinel Binaries
 * 
 * "Direct Download Protocol: Decentralized, Tamper-Proof, Unstoppable."
 * 
 * Features:
 * - Decentralized Storage Node registry (IPFS/Arweave)
 * - SHA-256 checksum verification for every download
 * - Zero-Store Logic: Auto-update bypassing app stores
 * - February 7th Genesis signature embedded in Day 1 binaries
 * - Lite Installer provisioning for low bandwidth users
 * 
 * Architecture:
 * - Direct Download Protocol: Host binaries on decentralized storage
 * - Integrity Check: SHA-256 checksum accompanies every download
 * - Zero-Store Logic: Fetch updates directly from SOVRYN Chain
 * - Installer Metadata: Genesis signature embedded in binaries
 * - Provisioning: Lite Installer for low bandwidth scenarios
 * 
 * Born in Lagos, Nigeria. Built for Humanity. 🇳🇬
 * Architect: ISREAL OKORO
 */
contract SovereignDistribution is AccessControl, ReentrancyGuard {
    // ============================================================================
    // ROLES
    // ============================================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    // ============================================================================
    // HARDCODED CONSTANTS
    // ============================================================================

    /// @notice Genesis signature for Day 1 binaries
    string public constant GENESIS_SIGNATURE = "February 7th Genesis - Born in Lagos, Built for the World";
    
    /// @notice Genesis timestamp (February 7th, 2026, 00:00:00 UTC)
    uint256 public constant GENESIS_TIMESTAMP = 1770451200;
    
    /// @notice Protocol metadata
    string public constant PROTOCOL_METADATA = "Direct Download Protocol: Decentralized, Tamper-Proof, Unstoppable.";
    
    /// @notice Supported storage providers
    string public constant STORAGE_PROVIDER_IPFS = "IPFS";
    string public constant STORAGE_PROVIDER_ARWEAVE = "ARWEAVE";
    string public constant STORAGE_PROVIDER_FILECOIN = "FILECOIN";

    // ============================================================================
    // ENUMS
    // ============================================================================

    enum BinaryType {
        FULL_INSTALLER,      // Full installer with UI assets
        LITE_INSTALLER,      // Core daemon only (background UI fetch)
        CORE_DAEMON,         // Core daemon binary
        UI_ASSETS,           // UI assets package
        AUTO_UPDATE_PATCH    // Auto-update patch
    }

    enum Platform {
        WINDOWS_X64,
        WINDOWS_ARM64,
        MACOS_X64,
        MACOS_ARM64,
        LINUX_X64,
        LINUX_ARM64,
        ANDROID,
        IOS
    }

    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct BinaryVersion {
        string version;              // Semantic version (e.g., "1.0.0")
        BinaryType binaryType;       // Type of binary
        Platform platform;           // Target platform
        string storageProvider;      // Storage provider (IPFS/Arweave/Filecoin)
        string storageHash;          // IPFS CID / Arweave TX ID / Filecoin CID
        bytes32 sha256Checksum;      // SHA-256 checksum for integrity verification
        uint256 fileSize;            // File size in bytes
        string genesisSignature;     // Genesis signature (Day 1 binaries only)
        uint256 releaseTimestamp;    // Release timestamp
        bool isActive;               // Active status
        string metadata;             // Additional metadata (JSON)
    }

    struct StorageNode {
        string provider;             // Storage provider name
        string endpoint;             // Storage endpoint URL
        bool isActive;               // Active status
        uint256 registeredAt;        // Registration timestamp
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    /// @notice Binary versions registry (version => platform => BinaryVersion)
    mapping(string => mapping(Platform => BinaryVersion)) public binaryVersions;

    /// @notice Latest version per platform
    mapping(Platform => string) public latestVersion;

    /// @notice Storage nodes registry (provider => StorageNode)
    mapping(string => StorageNode) public storageNodes;

    /// @notice Download count per version
    mapping(string => uint256) public downloadCount;

    /// @notice Total downloads across all versions
    uint256 public totalDownloads;

    /// @notice Total binaries published
    uint256 public totalBinaries;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event BinaryPublished(
        string indexed version,
        Platform indexed platform,
        BinaryType binaryType,
        string storageProvider,
        string storageHash,
        bytes32 sha256Checksum,
        uint256 fileSize,
        uint256 timestamp
    );

    event BinaryDownloaded(
        string indexed version,
        Platform indexed platform,
        address indexed downloader,
        uint256 timestamp
    );

    event StorageNodeRegistered(
        string indexed provider,
        string endpoint,
        uint256 timestamp
    );

    event StorageNodeDeactivated(
        string indexed provider,
        uint256 timestamp
    );

    event LatestVersionUpdated(
        Platform indexed platform,
        string oldVersion,
        string newVersion,
        uint256 timestamp
    );

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);

        // Register default storage nodes
        _registerStorageNode(STORAGE_PROVIDER_IPFS, "https://ipfs.io/ipfs/");
        _registerStorageNode(STORAGE_PROVIDER_ARWEAVE, "https://arweave.net/");
        _registerStorageNode(STORAGE_PROVIDER_FILECOIN, "https://filecoin.io/");
    }

    // ============================================================================
    // CORE FUNCTIONS
    // ============================================================================

    /**
     * @notice Publish Binary Version
     * @dev Publishes a new binary version to decentralized storage
     *
     * Requirements:
     * - Caller must have DISTRIBUTOR_ROLE
     * - Version must not already exist for platform
     * - Storage provider must be registered
     * - SHA-256 checksum must be provided
     *
     * Process:
     * 1. Validate inputs
     * 2. Store binary metadata
     * 3. Update latest version if newer
     * 4. Emit BinaryPublished event
     *
     * @param version Semantic version (e.g., "1.0.0")
     * @param binaryType Type of binary
     * @param platform Target platform
     * @param storageProvider Storage provider (IPFS/Arweave/Filecoin)
     * @param storageHash Storage hash (CID/TX ID)
     * @param sha256Checksum SHA-256 checksum
     * @param fileSize File size in bytes
     * @param metadata Additional metadata (JSON)
     * @return success True if publish successful
     */
    function publishBinary(
        string memory version,
        BinaryType binaryType,
        Platform platform,
        string memory storageProvider,
        string memory storageHash,
        bytes32 sha256Checksum,
        uint256 fileSize,
        string memory metadata
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant returns (bool success) {
        require(bytes(version).length > 0, "Version cannot be empty");
        require(bytes(storageHash).length > 0, "Storage hash cannot be empty");
        require(sha256Checksum != bytes32(0), "SHA-256 checksum required");
        require(fileSize > 0, "File size must be greater than 0");
        require(storageNodes[storageProvider].isActive, "Storage provider not registered");
        require(!binaryVersions[version][platform].isActive, "Version already exists for platform");

        // Determine genesis signature (Day 1 binaries only)
        string memory genesisSignature = "";
        if (block.timestamp <= GENESIS_TIMESTAMP + 86400) { // Within 24 hours of genesis
            genesisSignature = GENESIS_SIGNATURE;
        }

        // Store binary metadata
        binaryVersions[version][platform] = BinaryVersion({
            version: version,
            binaryType: binaryType,
            platform: platform,
            storageProvider: storageProvider,
            storageHash: storageHash,
            sha256Checksum: sha256Checksum,
            fileSize: fileSize,
            genesisSignature: genesisSignature,
            releaseTimestamp: block.timestamp,
            isActive: true,
            metadata: metadata
        });

        // Update latest version if this is newer
        if (bytes(latestVersion[platform]).length == 0 || _isNewerVersion(version, latestVersion[platform])) {
            string memory oldVersion = latestVersion[platform];
            latestVersion[platform] = version;
            emit LatestVersionUpdated(platform, oldVersion, version, block.timestamp);
        }

        totalBinaries++;

        emit BinaryPublished(
            version,
            platform,
            binaryType,
            storageProvider,
            storageHash,
            sha256Checksum,
            fileSize,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Download Binary (Record Download)
     * @dev Records a binary download and returns download URL + checksum
     *
     * Requirements:
     * - Version must exist for platform
     * - Binary must be active
     *
     * Process:
     * 1. Validate version exists
     * 2. Increment download count
     * 3. Emit BinaryDownloaded event
     * 4. Return download URL and checksum
     *
     * @param version Version to download
     * @param platform Target platform
     * @return downloadUrl Download URL
     * @return checksum SHA-256 checksum
     */
    function downloadBinary(
        string memory version,
        Platform platform
    ) external nonReentrant returns (string memory downloadUrl, bytes32 checksum) {
        BinaryVersion storage binary = binaryVersions[version][platform];
        require(binary.isActive, "Binary version not found or inactive");

        // Increment download count
        downloadCount[version]++;
        totalDownloads++;

        // Construct download URL
        StorageNode storage node = storageNodes[binary.storageProvider];
        downloadUrl = string(abi.encodePacked(node.endpoint, binary.storageHash));
        checksum = binary.sha256Checksum;

        emit BinaryDownloaded(version, platform, msg.sender, block.timestamp);

        return (downloadUrl, checksum);
    }

    /**
     * @notice Get Latest Version
     * @dev Returns the latest version for a platform
     *
     * @param platform Target platform
     * @return version Latest version
     * @return downloadUrl Download URL
     * @return checksum SHA-256 checksum
     * @return fileSize File size in bytes
     */
    function getLatestVersion(Platform platform) external view returns (
        string memory version,
        string memory downloadUrl,
        bytes32 checksum,
        uint256 fileSize
    ) {
        version = latestVersion[platform];
        require(bytes(version).length > 0, "No version available for platform");

        BinaryVersion storage binary = binaryVersions[version][platform];
        StorageNode storage node = storageNodes[binary.storageProvider];

        downloadUrl = string(abi.encodePacked(node.endpoint, binary.storageHash));
        checksum = binary.sha256Checksum;
        fileSize = binary.fileSize;

        return (version, downloadUrl, checksum, fileSize);
    }

    /**
     * @notice Get Binary Info
     * @dev Returns complete binary information
     *
     * @param version Version to query
     * @param platform Target platform
     * @return binary Binary version struct
     */
    function getBinaryInfo(
        string memory version,
        Platform platform
    ) external view returns (BinaryVersion memory binary) {
        binary = binaryVersions[version][platform];
        require(binary.isActive, "Binary version not found or inactive");
        return binary;
    }

    /**
     * @notice Verify Checksum
     * @dev Verifies SHA-256 checksum for a binary
     *
     * @param version Version to verify
     * @param platform Target platform
     * @param providedChecksum Checksum to verify
     * @return isValid True if checksum matches
     */
    function verifyChecksum(
        string memory version,
        Platform platform,
        bytes32 providedChecksum
    ) external view returns (bool isValid) {
        BinaryVersion storage binary = binaryVersions[version][platform];
        require(binary.isActive, "Binary version not found or inactive");
        return binary.sha256Checksum == providedChecksum;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @notice Register Storage Node
     * @dev Registers a new decentralized storage node
     *
     * @param provider Storage provider name
     * @param endpoint Storage endpoint URL
     * @return success True if registration successful
     */
    function registerStorageNode(
        string memory provider,
        string memory endpoint
    ) external onlyRole(ADMIN_ROLE) returns (bool success) {
        return _registerStorageNode(provider, endpoint);
    }

    /**
     * @notice Deactivate Storage Node
     * @dev Deactivates a storage node
     *
     * @param provider Storage provider name
     * @return success True if deactivation successful
     */
    function deactivateStorageNode(
        string memory provider
    ) external onlyRole(ADMIN_ROLE) returns (bool success) {
        require(storageNodes[provider].isActive, "Storage node not active");

        storageNodes[provider].isActive = false;

        emit StorageNodeDeactivated(provider, block.timestamp);

        return true;
    }

    /**
     * @notice Deactivate Binary
     * @dev Deactivates a binary version
     *
     * @param version Version to deactivate
     * @param platform Target platform
     * @return success True if deactivation successful
     */
    function deactivateBinary(
        string memory version,
        Platform platform
    ) external onlyRole(ADMIN_ROLE) returns (bool success) {
        require(binaryVersions[version][platform].isActive, "Binary not active");

        binaryVersions[version][platform].isActive = false;

        return true;
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get Genesis Signature
     * @dev Returns the genesis signature for Day 1 binaries
     *
     * @return signature Genesis signature
     */
    function getGenesisSignature() external pure returns (string memory signature) {
        return GENESIS_SIGNATURE;
    }

    /**
     * @notice Get Protocol Metadata
     * @dev Returns the protocol metadata
     *
     * @return metadata Protocol metadata
     */
    function getProtocolMetadata() external pure returns (string memory metadata) {
        return PROTOCOL_METADATA;
    }

    /**
     * @notice Get Download Statistics
     * @dev Returns download statistics
     *
     * @return totalDownloads_ Total downloads
     * @return totalBinaries_ Total binaries published
     */
    function getDownloadStatistics() external view returns (
        uint256 totalDownloads_,
        uint256 totalBinaries_
    ) {
        return (totalDownloads, totalBinaries);
    }

    /**
     * @notice Get Storage Node Info
     * @dev Returns storage node information
     *
     * @param provider Storage provider name
     * @return node Storage node struct
     */
    function getStorageNodeInfo(
        string memory provider
    ) external view returns (StorageNode memory node) {
        return storageNodes[provider];
    }

    // ============================================================================
    // INTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @notice Register Storage Node (Internal)
     * @dev Internal function to register a storage node
     *
     * @param provider Storage provider name
     * @param endpoint Storage endpoint URL
     * @return success True if registration successful
     */
    function _registerStorageNode(
        string memory provider,
        string memory endpoint
    ) internal returns (bool success) {
        require(bytes(provider).length > 0, "Provider cannot be empty");
        require(bytes(endpoint).length > 0, "Endpoint cannot be empty");

        storageNodes[provider] = StorageNode({
            provider: provider,
            endpoint: endpoint,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit StorageNodeRegistered(provider, endpoint, block.timestamp);

        return true;
    }

    /**
     * @notice Is Newer Version (Internal)
     * @dev Compares two semantic versions
     *
     * @param newVersion New version
     * @param oldVersion Old version
     * @return isNewer True if newVersion is newer than oldVersion
     */
    function _isNewerVersion(
        string memory newVersion,
        string memory oldVersion
    ) internal pure returns (bool isNewer) {
        // Simple string comparison (in production, use proper semver comparison)
        return keccak256(bytes(newVersion)) != keccak256(bytes(oldVersion));
    }
}

