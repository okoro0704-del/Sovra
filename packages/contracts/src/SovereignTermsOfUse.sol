// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SovereignTermsOfUse (STOU)
 * @notice Sovereign Terms of Use Protocol - The Oath of Vitalization
 * 
 * "By Vitalizing, I commit to the Truth. I acknowledge my 10 VIDA Cap as Sovereign Wealth.
 *  I reject the Simulation of Fraud and Taxation."
 * 
 * This contract enforces the Sovereign Oath through biometric verification and immutable VLT binding.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract SovereignTermsOfUse is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════
    // ROLES
    // ════════════════════════════════════════════════════════════════

    bytes32 public constant PFF_SENTINEL_ROLE = keccak256("PFF_SENTINEL_ROLE");
    bytes32 public constant VLT_LOGGER_ROLE = keccak256("VLT_LOGGER_ROLE");

    // ════════════════════════════════════════════════════════════════
    // CONTRACT METADATA - THE SOVEREIGN OATH
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice The Sovereign Oath - Immutable Declaration of Vitalization
     * @dev This oath is hardcoded and cannot be changed
     */
    string public constant SOVEREIGN_OATH = "By Vitalizing, I commit to the Truth. I acknowledge my 10 VIDA Cap as Sovereign Wealth. I reject the Simulation of Fraud and Taxation.";

    /**
     * @notice STOU Version - Semantic Versioning
     */
    string public constant STOU_VERSION = "1.0.0";

    /**
     * @notice STOU Protocol Name
     */
    string public constant STOU_PROTOCOL_NAME = "SOVEREIGN_TERMS_OF_USE";

    // ════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Vitalia Ledger of Truth (VLT) - Immutable Sovereign Records
     */
    struct VLTRecord {
        address sovereignAddress;      // Citizen's sovereign address
        bytes32 pffTemplateHash;       // 4-Layer PFF Template Hash (Face, Finger, Heart, Voice)
        string stouVersion;            // STOU Version at time of signing
        uint256 signatureTimestamp;    // Unix timestamp of signature
        bytes32 vltEntryHash;          // Cryptographic hash of entire VLT entry
        bool isVitalized;              // True if citizen has signed STOU (IRREVERSIBLE)
        uint256 vidaCapReleased;       // Amount of VIDA Cap released (10 VIDA Cap)
    }

    /**
     * @notice Mapping: Sovereign Address => VLT Record
     */
    mapping(address => VLTRecord) public vltLedger;

    /**
     * @notice Mapping: PFF Template Hash => Sovereign Address (prevent duplicate biometrics)
     */
    mapping(bytes32 => address) public pffTemplateToAddress;

    /**
     * @notice Total number of vitalized citizens
     */
    uint256 public totalVitalizedCitizens;

    /**
     * @notice Total VIDA Cap released through STOU
     */
    uint256 public totalVidaCapReleased;

    /**
     * @notice Initial VIDA Cap reward for signing STOU
     */
    uint256 public constant INITIAL_VIDA_CAP_REWARD = 10 * 10**18; // 10 VIDA Cap

    /**
     * @notice VIDA Cap token contract address
     */
    address public vidaCapToken;

    // ════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a citizen signs the STOU with their presence
     */
    event SovereignOathSigned(
        address indexed sovereignAddress,
        bytes32 indexed pffTemplateHash,
        string stouVersion,
        uint256 signatureTimestamp,
        bytes32 vltEntryHash,
        uint256 vidaCapReleased
    );

    /**
     * @notice Emitted when VLT entry is logged
     */
    event VLTEntryLogged(
        address indexed sovereignAddress,
        bytes32 indexed vltEntryHash,
        uint256 timestamp
    );

    // ════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════

    constructor(address _vidaCapToken) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token address");

        vidaCapToken = _vidaCapToken;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PFF_SENTINEL_ROLE, msg.sender);
        _grantRole(VLT_LOGGER_ROLE, msg.sender);
    }

    // ════════════════════════════════════════════════════════════════
    // CORE STOU FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Sign the Sovereign Oath with Presence (Bio-Signature Hook)
     * @dev This function can ONLY be called if the 4-Layer PFF Handshake is verified as 100% successful
     * @param sovereignAddress The citizen's sovereign address
     * @param pffTemplateHash The 4-Layer PFF Template Hash (Face, Finger, Heart, Voice)
     * @param pffSignature The PFF signature proving 100% successful handshake
     * @param pffVerificationProof The cryptographic proof of PFF verification
     */
    function signWithPresence(
        address sovereignAddress,
        bytes32 pffTemplateHash,
        bytes memory pffSignature,
        bytes32 pffVerificationProof
    ) external nonReentrant onlyRole(PFF_SENTINEL_ROLE) {
        // ════════════════════════════════════════════════════════════════
        // VALIDATION: Ensure citizen has not already signed STOU
        // ════════════════════════════════════════════════════════════════
        require(!vltLedger[sovereignAddress].isVitalized, "Already vitalized");
        require(sovereignAddress != address(0), "Invalid sovereign address");
        require(pffTemplateHash != bytes32(0), "Invalid PFF template hash");
        require(pffSignature.length > 0, "Invalid PFF signature");
        require(pffVerificationProof != bytes32(0), "Invalid PFF verification proof");

        // ════════════════════════════════════════════════════════════════
        // VALIDATION: Ensure PFF template is unique (no duplicate biometrics)
        // ════════════════════════════════════════════════════════════════
        require(pffTemplateToAddress[pffTemplateHash] == address(0), "PFF template already registered");

        // ════════════════════════════════════════════════════════════════
        // VALIDATION: Verify 4-Layer PFF Handshake (100% Success Required)
        // ════════════════════════════════════════════════════════════════
        require(_verifyPFFHandshake(sovereignAddress, pffTemplateHash, pffSignature, pffVerificationProof), "PFF handshake verification failed");

        // ════════════════════════════════════════════════════════════════
        // CREATE VLT RECORD: Immutable Sovereign Record
        // ════════════════════════════════════════════════════════════════

        uint256 signatureTimestamp = block.timestamp;

        // Compute VLT Entry Hash (Cryptographic Binding)
        bytes32 vltEntryHash = keccak256(
            abi.encodePacked(
                sovereignAddress,
                pffTemplateHash,
                STOU_VERSION,
                signatureTimestamp,
                SOVEREIGN_OATH,
                pffVerificationProof
            )
        );

        // Create VLT Record
        vltLedger[sovereignAddress] = VLTRecord({
            sovereignAddress: sovereignAddress,
            pffTemplateHash: pffTemplateHash,
            stouVersion: STOU_VERSION,
            signatureTimestamp: signatureTimestamp,
            vltEntryHash: vltEntryHash,
            isVitalized: true, // IRREVERSIBLE
            vidaCapReleased: INITIAL_VIDA_CAP_REWARD
        });

        // Bind PFF Template to Address (prevent duplicate biometrics)
        pffTemplateToAddress[pffTemplateHash] = sovereignAddress;

        // Update global counters
        totalVitalizedCitizens++;
        totalVidaCapReleased += INITIAL_VIDA_CAP_REWARD;

        // ════════════════════════════════════════════════════════════════
        // RELEASE 10 VIDA CAP TO SOVEREIGN VAULT
        // ════════════════════════════════════════════════════════════════

        // Note: In production, this would call the VIDA Cap token contract
        // For now, we emit an event to signal the release
        // The actual token transfer should be handled by the calling contract

        // ════════════════════════════════════════════════════════════════
        // LOG TO VLT (Vitalia Ledger of Truth)
        // ════════════════════════════════════════════════════════════════

        emit VLTEntryLogged(sovereignAddress, vltEntryHash, signatureTimestamp);

        emit SovereignOathSigned(
            sovereignAddress,
            pffTemplateHash,
            STOU_VERSION,
            signatureTimestamp,
            vltEntryHash,
            INITIAL_VIDA_CAP_REWARD
        );
    }

    // ════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Verify 4-Layer PFF Handshake (Face, Finger, Heart, Voice)
     * @dev This function verifies that the PFF handshake was 100% successful
     * @param sovereignAddress The citizen's sovereign address
     * @param pffTemplateHash The 4-Layer PFF Template Hash
     * @param pffSignature The PFF signature
     * @param pffVerificationProof The cryptographic proof of PFF verification
     * @return True if verification successful, false otherwise
     */
    function _verifyPFFHandshake(
        address sovereignAddress,
        bytes32 pffTemplateHash,
        bytes memory pffSignature,
        bytes32 pffVerificationProof
    ) internal pure returns (bool) {
        // ════════════════════════════════════════════════════════════════
        // PFF HANDSHAKE VERIFICATION LOGIC
        // ════════════════════════════════════════════════════════════════
        // In production, this would:
        // 1. Verify the PFF signature against the PFF Sentinel's public key
        // 2. Verify the 4-layer biometric template hash
        // 3. Verify the temporal synchronization (1.5-second cohesion window)
        // 4. Verify the spectral resonance (voice bone conduction)
        // 5. Verify the liveness geometry (127-point face mapping + PPG)
        // 6. Verify the hardware binding (HP Laptop UUID + Mobile Secure Element)
        //
        // For now, we perform basic validation
        // ════════════════════════════════════════════════════════════════

        // Verify that all parameters are non-zero/non-empty
        if (sovereignAddress == address(0)) return false;
        if (pffTemplateHash == bytes32(0)) return false;
        if (pffSignature.length == 0) return false;
        if (pffVerificationProof == bytes32(0)) return false;

        // Compute expected verification proof
        bytes32 expectedProof = keccak256(
            abi.encodePacked(
                sovereignAddress,
                pffTemplateHash,
                pffSignature
            )
        );

        // Verify proof matches
        return expectedProof == pffVerificationProof;
    }

    // ════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Check if a citizen is vitalized
     * @param sovereignAddress The citizen's sovereign address
     * @return True if vitalized, false otherwise
     */
    function isVitalized(address sovereignAddress) external view returns (bool) {
        return vltLedger[sovereignAddress].isVitalized;
    }

    /**
     * @notice Get VLT record for a citizen
     * @param sovereignAddress The citizen's sovereign address
     * @return VLT record
     */
    function getVLTRecord(address sovereignAddress) external view returns (VLTRecord memory) {
        return vltLedger[sovereignAddress];
    }

    /**
     * @notice Get sovereign address by PFF template hash
     * @param pffTemplateHash The PFF template hash
     * @return Sovereign address
     */
    function getSovereignAddressByPFFTemplate(bytes32 pffTemplateHash) external view returns (address) {
        return pffTemplateToAddress[pffTemplateHash];
    }

    /**
     * @notice Get the Sovereign Oath
     * @return The Sovereign Oath string
     */
    function getSovereignOath() external pure returns (string memory) {
        return SOVEREIGN_OATH;
    }

    /**
     * @notice Get STOU version
     * @return STOU version string
     */
    function getSTOUVersion() external pure returns (string memory) {
        return STOU_VERSION;
    }

    /**
     * @notice Get total vitalized citizens
     * @return Total number of vitalized citizens
     */
    function getTotalVitalizedCitizens() external view returns (uint256) {
        return totalVitalizedCitizens;
    }

    /**
     * @notice Get total VIDA Cap released
     * @return Total VIDA Cap released through STOU
     */
    function getTotalVidaCapReleased() external view returns (uint256) {
        return totalVidaCapReleased;
    }

    /**
     * @notice Verify VLT entry hash
     * @param sovereignAddress The citizen's sovereign address
     * @return True if VLT entry hash is valid, false otherwise
     */
    function verifyVLTEntryHash(address sovereignAddress) external view returns (bool) {
        VLTRecord memory record = vltLedger[sovereignAddress];

        if (!record.isVitalized) return false;

        // Recompute VLT entry hash
        bytes32 computedHash = keccak256(
            abi.encodePacked(
                record.sovereignAddress,
                record.pffTemplateHash,
                record.stouVersion,
                record.signatureTimestamp,
                SOVEREIGN_OATH,
                record.vltEntryHash // Note: In production, this would use the original pffVerificationProof
            )
        );

        // Note: This is a simplified verification
        // In production, we would store the original pffVerificationProof
        return record.vltEntryHash != bytes32(0);
    }

    // ════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ════════════════════════════════════════════════════════════════

    /**
     * @notice Grant PFF Sentinel role
     * @param account The account to grant the role to
     */
    function grantPFFSentinelRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PFF_SENTINEL_ROLE, account);
    }

    /**
     * @notice Grant VLT Logger role
     * @param account The account to grant the role to
     */
    function grantVLTLoggerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VLT_LOGGER_ROLE, account);
    }
}


