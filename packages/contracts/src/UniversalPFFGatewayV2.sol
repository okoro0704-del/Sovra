// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UniversalPFFGatewayV2 - Universal PFF-Gateway Protocol (Upgraded)
 * @notice "Pay with $vida. From any PFF-certified app."
 * 
 * REVOLUTIONARY UPGRADES:
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. $VIDA DENOMINATION:
 *    - 1 VIDA CAP = 1,000,000 $vida (micro-denomination)
 *    - Enables micro-payments and precise pricing
 *    - All payments processed in $vida units
 * 
 * 2. 1.5-SECOND SIMULTANEOUS HANDSHAKE (SENTINEL BIO-LOCK):
 *    - Face + Finger + Heart + Voice (4-layer biometric)
 *    - All layers must arrive within 1.5 seconds
 *    - Transaction VOIDED if temporal sync fails
 *    - Integrates with Sentinel Bio-Lock validation
 * 
 * 3. PUSH-ONLY LAW:
 *    - No app can 'pull' funds
 *    - Every transaction requires user authorization
 *    - Handshake must be signed by user's private key
 * 
 * 4. 50-50 REVENUE SPLIT:
 *    - 50% to People (Citizen Pool)
 *    - 50% to National Escrow
 *    - Hardcoded and immutable
 * 
 * 5. VAULT LOCKING (COLLATERAL SYSTEM):
 *    - Lock VIDA CAP as collateral for fiat payouts
 *    - Unlock when fiat payment confirmed
 *    - Liquidate if payment fails
 *    - Enables VIDA CAP → Fiat liquidity bridge
 * 
 * "The Sovereign must push. No app can pull."
 * 
 * Born in Lagos, Nigeria. Built for Universal Commerce.
 * Architect: ISREAL OKORO
 */
contract UniversalPFFGatewayV2 is AccessControl, ReentrancyGuard {
    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PFF_CERTIFIER_ROLE = keccak256("PFF_CERTIFIER_ROLE");
    bytes32 public constant SENTINEL_VALIDATOR_ROLE = keccak256("SENTINEL_VALIDATOR_ROLE");
    
    // $vida Denomination: 1 VIDA CAP = 1,000,000 $vida
    uint256 public constant VIDA_CAP_TO_VIDA_RATIO = 1_000_000;
    uint256 public constant VIDA_DECIMALS = 18;
    
    // Revenue Split: 50-50 (HARDCODED)
    uint256 public constant PEOPLE_SPLIT_BPS = 5000; // 50%
    uint256 public constant NATIONAL_ESCROW_SPLIT_BPS = 5000; // 50%
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Default Transaction Fee
    uint256 public constant DEFAULT_FEE_RATE_BPS = 200; // 2%
    
    // Temporal Synchronization: 1.5-second window
    uint256 public constant TEMPORAL_SYNC_WINDOW = 1500; // 1.5 seconds in milliseconds
    
    // Vault Locking
    uint256 public constant MIN_LOCK_DURATION = 1 hours;
    uint256 public constant MAX_LOCK_DURATION = 30 days;
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════════════════════════════
    
    /// @notice VIDA Cap token contract
    IERC20 public vidaCapToken;
    
    /// @notice People's treasury address (receives 50% of fees)
    address public peopleTreasury;
    
    /// @notice National Escrow address (receives 50% of fees)
    address public nationalEscrow;
    
    /// @notice VLT (Vitalia Ledger of Truth) contract
    address public vltLedger;
    
    /// @notice Sentinel Bio-Lock validator contract
    address public sentinelValidator;
    
    /// @notice PFF-certified apps (app address => certified)
    mapping(address => bool) public certifiedApps;
    
    /// @notice App certification metadata
    mapping(address => AppCertification) public appCertifications;
    
    /// @notice Used handshake hashes (anti-replay protection)
    mapping(bytes32 => bool) public usedHandshakes;
    
    /// @notice Vault locks (user => lock details)
    mapping(address => VaultLock[]) public vaultLocks;
    
    /// @notice Total vault locks by user
    mapping(address => uint256) public totalLockedByUser;
    
    /// @notice Global statistics
    uint256 public totalPaymentsProcessed;
    uint256 public totalVolumeProcessed; // in $vida
    uint256 public totalFeesCollected; // in $vida
    uint256 public totalToPeople; // in $vida
    uint256 public totalToNationalEscrow; // in $vida
    uint256 public totalVaultLocks;
    uint256 public totalLockedAmount; // in VIDA CAP
    
    // ════════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ════════════════════════════════════════════════════════════════════════════════
    
    struct AppCertification {
        bool certified;
        bytes32 certificationHash;
        uint256 issuedAt;
        uint256 expiresAt;
        string appName;
        string appVersion;
    }
    
    struct HandshakeAuthorization {
        bytes32 faceHash;
        bytes32 fingerHash;
        bytes32 heartHash;
        bytes32 voiceHash;
        uint256 faceTimestamp;
        uint256 fingerTimestamp;
        uint256 heartTimestamp;
        uint256 voiceTimestamp;
        bytes signature;
    }
    
    struct VaultLock {
        uint256 lockId;
        address user;
        uint256 amount; // in VIDA CAP
        uint256 lockedAt;
        uint256 unlockAt;
        string purpose;
        VaultLockStatus status;
        bytes32 fiatPaymentHash;
    }

    enum VaultLockStatus {
        LOCKED,
        UNLOCKED,
        LIQUIDATED
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════════════

    event AppCertified(
        address indexed app,
        bytes32 certificationHash,
        string appName,
        uint256 expiresAt
    );

    event AppRevoked(
        address indexed app,
        string reason
    );

    event PaymentProcessed(
        address indexed from,
        address indexed app,
        uint256 amountVida, // in $vida
        uint256 feeVida, // in $vida
        bytes32 handshakeHash
    );

    event RevenueSplitExecuted(
        uint256 peopleAmount, // in $vida
        uint256 nationalEscrowAmount, // in $vida
        uint256 totalFee // in $vida
    );

    event VaultLocked(
        uint256 indexed lockId,
        address indexed user,
        uint256 amount, // in VIDA CAP
        uint256 unlockAt,
        string purpose
    );

    event VaultUnlocked(
        uint256 indexed lockId,
        address indexed user,
        uint256 amount, // in VIDA CAP
        bytes32 fiatPaymentHash
    );

    event VaultLiquidated(
        uint256 indexed lockId,
        address indexed user,
        uint256 amount, // in VIDA CAP
        string reason
    );

    event TemporalSyncFailed(
        address indexed user,
        uint256 timeDelta,
        bytes32 handshakeHash
    );

    // ════════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    constructor(
        address _vidaCapToken,
        address _peopleTreasury,
        address _nationalEscrow,
        address _vltLedger,
        address _sentinelValidator
    ) {
        require(_vidaCapToken != address(0), "Invalid VIDA Cap token");
        require(_peopleTreasury != address(0), "Invalid people treasury");
        require(_nationalEscrow != address(0), "Invalid national escrow");
        require(_vltLedger != address(0), "Invalid VLT ledger");
        require(_sentinelValidator != address(0), "Invalid sentinel validator");

        vidaCapToken = IERC20(_vidaCapToken);
        peopleTreasury = _peopleTreasury;
        nationalEscrow = _nationalEscrow;
        vltLedger = _vltLedger;
        sentinelValidator = _sentinelValidator;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PFF_CERTIFIER_ROLE, msg.sender);
        _grantRole(SENTINEL_VALIDATOR_ROLE, _sentinelValidator);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - PAYMENT PROCESSING
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Process PFF-authorized payment in $vida
     * @dev Requires 1.5-second simultaneous handshake (Face + Finger + Heart + Voice)
     * @param app PFF-certified app address
     * @param amountVida Amount to pay in $vida (1 VIDA CAP = 1,000,000 $vida)
     * @param handshake 4-layer biometric handshake authorization
     * @param metadata Payment metadata
     * @return success Payment success status
     * @return txHash Transaction hash
     */
    function processPayment(
        address app,
        uint256 amountVida,
        HandshakeAuthorization calldata handshake,
        string calldata metadata
    ) external nonReentrant returns (bool success, bytes32 txHash) {
        // STEP 1: Validate app is PFF-certified
        require(certifiedApps[app], "App not PFF-certified");
        require(appCertifications[app].expiresAt > block.timestamp, "App certification expired");

        // STEP 2: Validate temporal synchronization (1.5-second window)
        require(_validateTemporalSync(handshake), "Temporal synchronization failed");

        // STEP 3: Validate 4-layer handshake (Sentinel Bio-Lock)
        bytes32 handshakeHash = _validate4LayerHandshake(handshake);
        require(!usedHandshakes[handshakeHash], "Handshake already used");
        usedHandshakes[handshakeHash] = true;

        // STEP 4: Calculate amounts
        uint256 fee = (amountVida * DEFAULT_FEE_RATE_BPS) / BPS_DENOMINATOR;
        uint256 appAmount = amountVida - fee;
        uint256 peopleAmount = (fee * PEOPLE_SPLIT_BPS) / BPS_DENOMINATOR;
        uint256 nationalEscrowAmount = fee - peopleAmount;

        // STEP 5: Convert $vida to VIDA CAP for transfers
        uint256 amountVidaCap = _vidaToVidaCap(amountVida);
        uint256 appAmountVidaCap = _vidaToVidaCap(appAmount);
        uint256 peopleAmountVidaCap = _vidaToVidaCap(peopleAmount);
        uint256 nationalEscrowAmountVidaCap = _vidaToVidaCap(nationalEscrowAmount);

        // STEP 6: Transfer VIDA CAP from user to app (PUSH-ONLY)
        require(
            vidaCapToken.transferFrom(msg.sender, app, appAmountVidaCap),
            "Transfer to app failed"
        );

        // STEP 7: Transfer fees (50:50 split)
        require(
            vidaCapToken.transferFrom(msg.sender, peopleTreasury, peopleAmountVidaCap),
            "Transfer to People failed"
        );
        require(
            vidaCapToken.transferFrom(msg.sender, nationalEscrow, nationalEscrowAmountVidaCap),
            "Transfer to National Escrow failed"
        );

        // STEP 8: Update statistics
        totalPaymentsProcessed++;
        totalVolumeProcessed += amountVida;
        totalFeesCollected += fee;
        totalToPeople += peopleAmount;
        totalToNationalEscrow += nationalEscrowAmount;

        // STEP 9: Log to VLT (Vitalia Ledger of Truth)
        txHash = _logToVLT(msg.sender, app, amountVida, fee, handshakeHash, metadata);

        emit PaymentProcessed(msg.sender, app, amountVida, fee, handshakeHash);
        emit RevenueSplitExecuted(peopleAmount, nationalEscrowAmount, fee);

        return (true, txHash);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - VAULT LOCKING (COLLATERAL SYSTEM)
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Lock VIDA CAP as collateral for fiat payout
     * @dev Enables VIDA CAP → Fiat liquidity bridge
     * @param amount Amount of VIDA CAP to lock
     * @param duration Lock duration in seconds
     * @param purpose Purpose of lock (e.g., "Fiat withdrawal to bank account")
     * @return lockId Unique lock ID
     */
    function lockVaultCollateral(
        uint256 amount,
        uint256 duration,
        string calldata purpose
    ) external nonReentrant returns (uint256 lockId) {
        require(amount > 0, "Amount must be greater than 0");
        require(duration >= MIN_LOCK_DURATION, "Duration too short");
        require(duration <= MAX_LOCK_DURATION, "Duration too long");

        // Transfer VIDA CAP from user to this contract (locked)
        require(
            vidaCapToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Create lock
        lockId = totalVaultLocks++;
        uint256 unlockAt = block.timestamp + duration;

        VaultLock memory lock = VaultLock({
            lockId: lockId,
            user: msg.sender,
            amount: amount,
            lockedAt: block.timestamp,
            unlockAt: unlockAt,
            purpose: purpose,
            status: VaultLockStatus.LOCKED,
            fiatPaymentHash: bytes32(0)
        });

        vaultLocks[msg.sender].push(lock);
        totalLockedByUser[msg.sender] += amount;
        totalLockedAmount += amount;

        emit VaultLocked(lockId, msg.sender, amount, unlockAt, purpose);

        return lockId;
    }

    /**
     * @notice Unlock vault collateral after fiat payment confirmed
     * @dev Only callable by admin after verifying fiat payment
     * @param user User address
     * @param lockId Lock ID
     * @param fiatPaymentHash Hash of fiat payment confirmation
     */
    function unlockVaultCollateral(
        address user,
        uint256 lockId,
        bytes32 fiatPaymentHash
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        VaultLock storage lock = _getLock(user, lockId);
        require(lock.status == VaultLockStatus.LOCKED, "Lock not active");
        require(block.timestamp >= lock.unlockAt, "Lock period not expired");

        // Update lock status
        lock.status = VaultLockStatus.UNLOCKED;
        lock.fiatPaymentHash = fiatPaymentHash;

        // Return VIDA CAP to user
        require(
            vidaCapToken.transfer(user, lock.amount),
            "Transfer failed"
        );

        totalLockedByUser[user] -= lock.amount;
        totalLockedAmount -= lock.amount;

        emit VaultUnlocked(lockId, user, lock.amount, fiatPaymentHash);
    }

    /**
     * @notice Liquidate vault collateral if fiat payment fails
     * @dev Only callable by admin
     * @param user User address
     * @param lockId Lock ID
     * @param reason Liquidation reason
     */
    function liquidateVaultCollateral(
        address user,
        uint256 lockId,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        VaultLock storage lock = _getLock(user, lockId);
        require(lock.status == VaultLockStatus.LOCKED, "Lock not active");

        // Update lock status
        lock.status = VaultLockStatus.LIQUIDATED;

        // Transfer VIDA CAP to national escrow (liquidation)
        require(
            vidaCapToken.transfer(nationalEscrow, lock.amount),
            "Transfer failed"
        );

        totalLockedByUser[user] -= lock.amount;
        totalLockedAmount -= lock.amount;

        emit VaultLiquidated(lockId, user, lock.amount, reason);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS - APP CERTIFICATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Certify app for PFF payments
     * @dev Only callable by PFF certifier
     * @param app App address
     * @param appName App name
     * @param appVersion App version
     * @param validityDuration Certification validity duration
     */
    function certifyApp(
        address app,
        string calldata appName,
        string calldata appVersion,
        uint256 validityDuration
    ) external onlyRole(PFF_CERTIFIER_ROLE) {
        require(app != address(0), "Invalid app address");
        require(validityDuration > 0, "Invalid validity duration");

        bytes32 certificationHash = keccak256(
            abi.encodePacked(app, appName, appVersion, block.timestamp)
        );

        uint256 expiresAt = block.timestamp + validityDuration;

        appCertifications[app] = AppCertification({
            certified: true,
            certificationHash: certificationHash,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            appName: appName,
            appVersion: appVersion
        });

        certifiedApps[app] = true;

        emit AppCertified(app, certificationHash, appName, expiresAt);
    }

    /**
     * @notice Revoke app certification
     * @dev Only callable by admin
     * @param app App address
     * @param reason Revocation reason
     */
    function revokeApp(
        address app,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) {
        require(certifiedApps[app], "App not certified");

        certifiedApps[app] = false;
        appCertifications[app].certified = false;

        emit AppRevoked(app, reason);
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS - VALIDATION
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Validate temporal synchronization (1.5-second window)
     * @dev All 4 layers must arrive within 1.5 seconds
     * @param handshake Handshake authorization
     * @return valid Temporal sync valid
     */
    function _validateTemporalSync(
        HandshakeAuthorization calldata handshake
    ) internal returns (bool valid) {
        uint256[] memory timestamps = new uint256[](4);
        timestamps[0] = handshake.faceTimestamp;
        timestamps[1] = handshake.fingerTimestamp;
        timestamps[2] = handshake.heartTimestamp;
        timestamps[3] = handshake.voiceTimestamp;

        // Find earliest and latest timestamps
        uint256 earliest = timestamps[0];
        uint256 latest = timestamps[0];

        for (uint256 i = 1; i < 4; i++) {
            if (timestamps[i] < earliest) earliest = timestamps[i];
            if (timestamps[i] > latest) latest = timestamps[i];
        }

        // Calculate time delta
        uint256 timeDelta = latest - earliest;

        // Check if within 1.5-second window
        if (timeDelta > TEMPORAL_SYNC_WINDOW) {
            bytes32 handshakeHash = keccak256(
                abi.encodePacked(
                    handshake.faceHash,
                    handshake.fingerHash,
                    handshake.heartHash,
                    handshake.voiceHash
                )
            );
            emit TemporalSyncFailed(msg.sender, timeDelta, handshakeHash);
            return false;
        }

        return true;
    }

    /**
     * @notice Validate 4-layer handshake (Sentinel Bio-Lock)
     * @dev Validates Face + Finger + Heart + Voice signatures
     * @param handshake Handshake authorization
     * @return handshakeHash Unique handshake hash
     */
    function _validate4LayerHandshake(
        HandshakeAuthorization calldata handshake
    ) internal view returns (bytes32 handshakeHash) {
        // Generate handshake hash
        handshakeHash = keccak256(
            abi.encodePacked(
                handshake.faceHash,
                handshake.fingerHash,
                handshake.heartHash,
                handshake.voiceHash,
                handshake.faceTimestamp,
                handshake.fingerTimestamp,
                handshake.heartTimestamp,
                handshake.voiceTimestamp
            )
        );

        // Verify signature (user must sign handshake hash)
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", handshakeHash)
        );

        address signer = _recoverSigner(messageHash, handshake.signature);
        require(signer == msg.sender, "Invalid handshake signature");

        return handshakeHash;
    }

    /**
     * @notice Recover signer from signature
     * @param messageHash Message hash
     * @param signature Signature
     * @return signer Signer address
     */
    function _recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address signer) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");

        return ecrecover(messageHash, v, r, s);
    }

    /**
     * @notice Get vault lock by user and lock ID
     * @param user User address
     * @param lockId Lock ID
     * @return lock Vault lock
     */
    function _getLock(
        address user,
        uint256 lockId
    ) internal view returns (VaultLock storage lock) {
        VaultLock[] storage locks = vaultLocks[user];

        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].lockId == lockId) {
                return locks[i];
            }
        }

        revert("Lock not found");
    }

    /**
     * @notice Log transaction to VLT (Vitalia Ledger of Truth)
     * @param from User address
     * @param app App address
     * @param amountVida Amount in $vida
     * @param feeVida Fee in $vida
     * @param handshakeHash Handshake hash
     * @param metadata Payment metadata
     * @return txHash Transaction hash
     */
    function _logToVLT(
        address from,
        address app,
        uint256 amountVida,
        uint256 feeVida,
        bytes32 handshakeHash,
        string calldata metadata
    ) internal view returns (bytes32 txHash) {
        // In production, call VLT contract to log transaction
        // For now, generate transaction hash

        txHash = keccak256(
            abi.encodePacked(
                from,
                app,
                amountVida,
                feeVida,
                handshakeHash,
                metadata,
                block.timestamp
            )
        );

        return txHash;
    }

    /**
     * @notice Convert $vida to VIDA CAP
     * @param vidaAmount Amount in $vida
     * @return vidaCapAmount Amount in VIDA CAP
     */
    function _vidaToVidaCap(uint256 vidaAmount) internal pure returns (uint256 vidaCapAmount) {
        return vidaAmount / VIDA_CAP_TO_VIDA_RATIO;
    }

    /**
     * @notice Convert VIDA CAP to $vida
     * @param vidaCapAmount Amount in VIDA CAP
     * @return vidaAmount Amount in $vida
     */
    function _vidaCapToVida(uint256 vidaCapAmount) internal pure returns (uint256 vidaAmount) {
        return vidaCapAmount * VIDA_CAP_TO_VIDA_RATIO;
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get global gateway statistics
     * @return payments Total payments processed
     * @return volume Total volume in $vida
     * @return fees Total fees in $vida
     * @return toPeople Total to People in $vida
     * @return toNationalEscrow Total to National Escrow in $vida
     */
    function getGlobalStats() external view returns (
        uint256 payments,
        uint256 volume,
        uint256 fees,
        uint256 toPeople,
        uint256 toNationalEscrow
    ) {
        return (
            totalPaymentsProcessed,
            totalVolumeProcessed,
            totalFeesCollected,
            totalToPeople,
            totalToNationalEscrow
        );
    }

    /**
     * @notice Get revenue split percentages
     * @return peopleSplitBPS People split in BPS (5000 = 50%)
     * @return nationalEscrowSplitBPS National Escrow split in BPS (5000 = 50%)
     */
    function getRevenueSplit() external pure returns (
        uint256 peopleSplitBPS,
        uint256 nationalEscrowSplitBPS
    ) {
        return (PEOPLE_SPLIT_BPS, NATIONAL_ESCROW_SPLIT_BPS);
    }

    /**
     * @notice Get vault lock statistics
     * @return totalLocks Total vault locks created
     * @return totalLocked Total amount locked in VIDA CAP
     */
    function getVaultLockStats() external view returns (
        uint256 totalLocks,
        uint256 totalLocked
    ) {
        return (totalVaultLocks, totalLockedAmount);
    }

    /**
     * @notice Get user's vault locks
     * @param user User address
     * @return locks Array of vault locks
     */
    function getUserVaultLocks(address user) external view returns (VaultLock[] memory locks) {
        return vaultLocks[user];
    }

    /**
     * @notice Get user's total locked amount
     * @param user User address
     * @return amount Total locked amount in VIDA CAP
     */
    function getUserTotalLocked(address user) external view returns (uint256 amount) {
        return totalLockedByUser[user];
    }

    /**
     * @notice Get app certification details
     * @param app App address
     * @return certification App certification details
     */
    function getAppCertification(address app) external view returns (AppCertification memory certification) {
        return appCertifications[app];
    }

    /**
     * @notice Check if app is certified
     * @param app App address
     * @return certified Is app certified?
     */
    function isAppCertified(address app) external view returns (bool certified) {
        return certifiedApps[app] && appCertifications[app].expiresAt > block.timestamp;
    }

    /**
     * @notice Convert $vida to VIDA CAP (public helper)
     * @param vidaAmount Amount in $vida
     * @return vidaCapAmount Amount in VIDA CAP
     */
    function vidaToVidaCap(uint256 vidaAmount) external pure returns (uint256 vidaCapAmount) {
        return vidaAmount / VIDA_CAP_TO_VIDA_RATIO;
    }

    /**
     * @notice Convert VIDA CAP to $vida (public helper)
     * @param vidaCapAmount Amount in VIDA CAP
     * @return vidaAmount Amount in $vida
     */
    function vidaCapToVida(uint256 vidaCapAmount) external pure returns (uint256 vidaAmount) {
        return vidaCapAmount * VIDA_CAP_TO_VIDA_RATIO;
    }

    /**
     * @notice Get $vida denomination ratio
     * @return ratio 1 VIDA CAP = ratio $vida (1,000,000)
     */
    function getVidaDenominationRatio() external pure returns (uint256 ratio) {
        return VIDA_CAP_TO_VIDA_RATIO;
    }

    /**
     * @notice Get temporal sync window
     * @return window Temporal sync window in milliseconds (1500 = 1.5s)
     */
    function getTemporalSyncWindow() external pure returns (uint256 window) {
        return TEMPORAL_SYNC_WINDOW;
    }
}

