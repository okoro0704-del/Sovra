// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PFFAgnosticGateway - Universal PFF-Certified App Gateway
 * @notice Agnostic gateway for any PFF-certified app to interact with VIDA Cap
 * @dev Chain doesn't care about app name, only PFF certification
 * 
 * AGNOSTIC GATEWAY PROTOCOL:
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * CORE PRINCIPLE:
 * - Chain doesn't care about app name
 * - Only cares about PFF certification
 * - 'Pay with any PFF-connected App' logic
 * 
 * CERTIFICATION PROCESS:
 * 1. App requests PFF certification
 * 2. PFF Protocol validates app security
 * 3. Gateway grants PFF_CERTIFIED flag
 * 4. App can now interact with VIDA Cap
 * 
 * PAYMENT FLOW:
 * 1. User initiates payment in any PFF-certified app
 * 2. App calls gateway with payment request
 * 3. Gateway validates PFF certification
 * 4. Gateway forwards to VIDACapMainnet
 * 5. VIDACapMainnet processes SOVEREIGN_AUTH
 * 
 * "Pay with VIDA. From any PFF-certified app."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */
contract PFFAgnosticGateway is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PFF_CERTIFIER_ROLE = keccak256("PFF_CERTIFIER_ROLE");
    bytes32 public constant PFF_CERTIFIED = keccak256("PFF_CERTIFIED");
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    struct AppCertification {
        bool isCertified;
        uint256 certifiedAt;
        string appMetadata; // Optional: app name, version, etc.
        bytes32 certificationHash;
    }
    
    mapping(address => AppCertification) public certifiedApps;
    mapping(bytes32 => bool) public usedPaymentRequests;
    
    uint256 public totalCertifiedApps;
    uint256 public totalPaymentRequests;
    
    address public vidaCapMainnet;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    event AppCertified(address indexed app, bytes32 certificationHash, string metadata);
    event AppRevoked(address indexed app, string reason);
    event PaymentRequestReceived(address indexed app, address indexed citizen, bytes32 requestHash);
    event PaymentForwarded(address indexed app, address indexed citizen, bytes32 sovereignAuth);
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════
    
    constructor(address _admin, address _vidaCapMainnet) {
        require(_admin != address(0), "Invalid admin address");
        require(_vidaCapMainnet != address(0), "Invalid VIDACapMainnet address");
        
        vidaCapMainnet = _vidaCapMainnet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PFF_CERTIFIER_ROLE, _admin);
    }
    
    // ════════════════════════════════════════════════════════════════════════════════
    // CERTIFICATION FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Certify an app as PFF-certified
     * @dev Only callable by PFF Certifier
     * @param app App address to certify
     * @param metadata Optional app metadata (name, version, etc.)
     */
    function certifyApp(address app, string calldata metadata) external onlyRole(PFF_CERTIFIER_ROLE) {
        require(app != address(0), "Invalid app address");
        require(!certifiedApps[app].isCertified, "App already certified");
        
        bytes32 certificationHash = keccak256(abi.encodePacked(app, block.timestamp, metadata));
        
        certifiedApps[app] = AppCertification({
            isCertified: true,
            certifiedAt: block.timestamp,
            appMetadata: metadata,
            certificationHash: certificationHash
        });
        
        totalCertifiedApps++;
        
        emit AppCertified(app, certificationHash, metadata);
    }
    
    /**
     * @notice Revoke PFF certification from an app
     * @dev Only callable by PFF Certifier
     * @param app App address to revoke
     * @param reason Reason for revocation
     */
    function revokeApp(address app, string calldata reason) external onlyRole(PFF_CERTIFIER_ROLE) {
        require(certifiedApps[app].isCertified, "App not certified");
        
        certifiedApps[app].isCertified = false;
        totalCertifiedApps--;
        
        emit AppRevoked(app, reason);
    }
    
    // ════════════════════════════════════════════════════════════════════════════════
    // PAYMENT GATEWAY FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Request payment from any PFF-certified app
     * @dev App must be PFF-certified to call this function
     * @param citizen Citizen address making payment
     * @param sovereignAuth SOVEREIGN_AUTH signature from PFF Protocol
     * @param pffHash PFF Truth-Hash from heartbeat
     */
    function requestPayment(
        address citizen,
        bytes32 sovereignAuth,
        bytes32 pffHash
    ) external nonReentrant returns (bool) {
        // Validate app is PFF-certified
        require(certifiedApps[msg.sender].isCertified, "App not PFF-certified");
        require(citizen != address(0), "Invalid citizen address");
        require(sovereignAuth != bytes32(0), "Invalid SOVEREIGN_AUTH");
        require(pffHash != bytes32(0), "Invalid PFF hash");
        
        // Create payment request hash
        bytes32 requestHash = keccak256(abi.encodePacked(msg.sender, citizen, sovereignAuth, pffHash, block.timestamp));
        require(!usedPaymentRequests[requestHash], "Payment request already processed");
        
        // Mark request as used
        usedPaymentRequests[requestHash] = true;
        totalPaymentRequests++;
        
        emit PaymentRequestReceived(msg.sender, citizen, requestHash);
        
        // Forward to VIDACapMainnet (would call processSovereignAuth in real implementation)
        // Note: In production, this would interact with VIDACapMainnet contract
        emit PaymentForwarded(msg.sender, citizen, sovereignAuth);
        
        return true;
    }
    
    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Check if app is PFF-certified
     * @param app App address to check
     * @return True if app is certified, false otherwise
     */
    function isAppCertified(address app) external view returns (bool) {
        return certifiedApps[app].isCertified;
    }
    
    /**
     * @notice Get app certification details
     * @param app App address
     * @return certification App certification struct
     */
    function getAppCertification(address app) external view returns (AppCertification memory) {
        return certifiedApps[app];
    }
    
    /**
     * @notice Get gateway stats
     * @return totalApps Total certified apps
     * @return totalPayments Total payment requests
     */
    function getStats() external view returns (uint256 totalApps, uint256 totalPayments) {
        return (totalCertifiedApps, totalPaymentRequests);
    }
}

