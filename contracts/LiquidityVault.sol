// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LiquidityVault - Corporate Wholesale VIDA Distribution
 * @notice 50/50 Vault Split: 10 VIDA to User, 10 VIDA to Corporate Liquidity Vault
 * @dev Wholesale Release Mechanism:
 *      - VIDA can ONLY be purchased by verified Corporate Identities
 *      - Prices set by Global VIDA Oracle (prevents manipulation)
 *      - Instant liquidity for user sell orders
 *      - Transparent on-chain audit trail
 * 
 * "Liquidity for the people. Wholesale for the corporations."
 * 
 * Born in Lagos, Nigeria. Built for Instant Settlement.
 */
contract LiquidityVault is AccessControl, ReentrancyGuard {
    // ============ INTERFACES ============
    
    IERC20 public vidaToken;
    IERC20 public nVidaToken;
    
    // ============ CONSTANTS ============
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant CORPORATE_ROLE = keccak256("CORPORATE_ROLE");
    bytes32 public constant P2P_ENGINE_ROLE = keccak256("P2P_ENGINE_ROLE");
    
    uint256 public constant VAULT_ALLOCATION = 10 * 1e18; // 10 VIDA per user
    uint256 public constant USER_ALLOCATION = 10 * 1e18; // 10 VIDA per user
    uint256 public constant TOTAL_MINT_PER_USER = 20 * 1e18; // 20 VIDA total
    
    // ============ STATE VARIABLES ============
    
    uint256 public totalVaultBalance; // Total VIDA in vault
    uint256 public totalSold; // Total VIDA sold to corporates
    uint256 public totalRevenue; // Total USD/nVIDA revenue
    
    uint256 public currentVidaPrice; // Price in nVIDA (18 decimals)
    uint256 public lastPriceUpdate;
    
    // Corporate identity tracking
    mapping(address => CorporateIdentity) public corporates;
    address[] public corporateList;
    
    struct CorporateIdentity {
        address corporateAddress;
        string companyName;
        string registrationId;
        bool isVerified;
        uint256 totalPurchased; // Total VIDA purchased
        uint256 totalSpent; // Total nVIDA spent
        uint256 lastPurchase;
    }
    
    // Purchase tracking
    mapping(uint256 => Purchase) public purchases;
    uint256 public purchaseCount;
    
    struct Purchase {
        uint256 purchaseId;
        address corporate;
        uint256 vidaAmount;
        uint256 nVidaAmount;
        uint256 pricePerVida;
        uint256 timestamp;
        bytes32 txHash;
    }
    
    // P2P order matching
    mapping(uint256 => SellOrder) public sellOrders;
    uint256 public sellOrderCount;
    
    struct SellOrder {
        uint256 orderId;
        address seller;
        uint256 vidaAmount;
        uint256 expectedNVida;
        uint256 timestamp;
        bool fulfilled;
        address fulfilledBy;
        uint256 fulfilledAt;
    }
    
    // ============ EVENTS ============
    
    event VaultDeposit(address indexed user, uint256 amount);
    event CorporateVerified(address indexed corporate, string companyName);
    event CorporateRevoked(address indexed corporate);
    event VidaPurchased(uint256 indexed purchaseId, address indexed corporate, uint256 vidaAmount, uint256 nVidaAmount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event SellOrderCreated(uint256 indexed orderId, address indexed seller, uint256 vidaAmount);
    event SellOrderFulfilled(uint256 indexed orderId, address indexed corporate, uint256 vidaAmount);
    
    // ============ ERRORS ============
    
    error NotCorporate();
    error InsufficientVaultBalance();
    error InvalidPrice();
    error OrderNotFound();
    error OrderAlreadyFulfilled();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _vidaToken,
        address _nVidaToken
    ) {
        require(_vidaToken != address(0), "Invalid VIDA token");
        require(_nVidaToken != address(0), "Invalid nVIDA token");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        
        vidaToken = IERC20(_vidaToken);
        nVidaToken = IERC20(_nVidaToken);
        
        // Initial price: 1 VIDA = 1000 nVIDA (₦1000)
        currentVidaPrice = 1000 * 1e18;
        lastPriceUpdate = block.timestamp;
    }
    
    // ============ VAULT DEPOSIT (50/50 SPLIT) ============
    
    /**
     * @notice Deposit VIDA to vault (called during user minting)
     * @param user User receiving the other 10 VIDA
     * @param amount Amount to deposit (should be 10 VIDA)
     */
    function depositToVault(address user, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        require(amount == VAULT_ALLOCATION, "Must deposit exactly 10 VIDA");
        
        // Transfer VIDA from minter to vault
        require(vidaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        totalVaultBalance += amount;
        
        emit VaultDeposit(user, amount);
    }
    
    // ============ CORPORATE IDENTITY MANAGEMENT ============
    
    /**
     * @notice Verify corporate identity
     * @param corporateAddress Corporate wallet address
     * @param companyName Company name
     * @param registrationId Government registration ID
     */
    function verifyCorporate(
        address corporateAddress,
        string calldata companyName,
        string calldata registrationId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(corporateAddress != address(0), "Invalid address");
        require(!corporates[corporateAddress].isVerified, "Already verified");
        
        corporates[corporateAddress] = CorporateIdentity({
            corporateAddress: corporateAddress,
            companyName: companyName,
            registrationId: registrationId,
            isVerified: true,
            totalPurchased: 0,
            totalSpent: 0,
            lastPurchase: 0
        });
        
        corporateList.push(corporateAddress);
        
        _grantRole(CORPORATE_ROLE, corporateAddress);
        
        emit CorporateVerified(corporateAddress, companyName);
    }

    /**
     * @notice Revoke corporate verification
     */
    function revokeCorporate(address corporateAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(corporates[corporateAddress].isVerified, "Not verified");

        corporates[corporateAddress].isVerified = false;
        _revokeRole(CORPORATE_ROLE, corporateAddress);

        emit CorporateRevoked(corporateAddress);
    }

    // ============ ORACLE PRICE MANAGEMENT ============

    /**
     * @notice Update VIDA price (Oracle only)
     * @param newPrice New price in nVIDA (18 decimals)
     */
    function updatePrice(uint256 newPrice) external onlyRole(ORACLE_ROLE) {
        require(newPrice > 0, "Invalid price");

        uint256 oldPrice = currentVidaPrice;
        currentVidaPrice = newPrice;
        lastPriceUpdate = block.timestamp;

        emit PriceUpdated(oldPrice, newPrice, block.timestamp);
    }

    // ============ WHOLESALE PURCHASE (CORPORATE ONLY) ============

    /**
     * @notice Purchase VIDA from vault (Corporate only)
     * @param vidaAmount Amount of VIDA to purchase
     */
    function purchaseVida(uint256 vidaAmount) external onlyRole(CORPORATE_ROLE) nonReentrant {
        CorporateIdentity storage corporate = corporates[msg.sender];

        if (!corporate.isVerified) revert NotCorporate();
        if (vidaAmount > totalVaultBalance) revert InsufficientVaultBalance();

        // Calculate nVIDA cost using oracle price
        uint256 nVidaCost = (vidaAmount * currentVidaPrice) / 1e18;

        // Transfer nVIDA from corporate to vault
        require(nVidaToken.transferFrom(msg.sender, address(this), nVidaCost), "Payment failed");

        // Transfer VIDA from vault to corporate
        require(vidaToken.transfer(msg.sender, vidaAmount), "VIDA transfer failed");

        // Update vault state
        totalVaultBalance -= vidaAmount;
        totalSold += vidaAmount;
        totalRevenue += nVidaCost;

        // Update corporate stats
        corporate.totalPurchased += vidaAmount;
        corporate.totalSpent += nVidaCost;
        corporate.lastPurchase = block.timestamp;

        // Record purchase
        uint256 purchaseId = purchaseCount++;
        purchases[purchaseId] = Purchase({
            purchaseId: purchaseId,
            corporate: msg.sender,
            vidaAmount: vidaAmount,
            nVidaAmount: nVidaCost,
            pricePerVida: currentVidaPrice,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        });

        emit VidaPurchased(purchaseId, msg.sender, vidaAmount, nVidaCost);
    }

    // ============ P2P ORDER MATCHING ============

    /**
     * @notice Create sell order (called by P2P Engine)
     * @param seller User selling VIDA
     * @param vidaAmount Amount of VIDA to sell
     * @return orderId Order identifier
     */
    function createSellOrder(
        address seller,
        uint256 vidaAmount
    ) external onlyRole(P2P_ENGINE_ROLE) nonReentrant returns (uint256) {
        require(seller != address(0), "Invalid seller");
        require(vidaAmount > 0, "Invalid amount");

        // Calculate expected nVIDA using current price
        uint256 expectedNVida = (vidaAmount * currentVidaPrice) / 1e18;

        uint256 orderId = sellOrderCount++;

        sellOrders[orderId] = SellOrder({
            orderId: orderId,
            seller: seller,
            vidaAmount: vidaAmount,
            expectedNVida: expectedNVida,
            timestamp: block.timestamp,
            fulfilled: false,
            fulfilledBy: address(0),
            fulfilledAt: 0
        });

        emit SellOrderCreated(orderId, seller, vidaAmount);

        return orderId;
    }

    /**
     * @notice Fulfill sell order with corporate buy (instant matching)
     * @param orderId Sell order ID
     * @param corporate Corporate buyer
     */
    function fulfillSellOrder(
        uint256 orderId,
        address corporate
    ) external onlyRole(P2P_ENGINE_ROLE) nonReentrant {
        SellOrder storage order = sellOrders[orderId];

        if (order.orderId == 0) revert OrderNotFound();
        if (order.fulfilled) revert OrderAlreadyFulfilled();

        CorporateIdentity storage corp = corporates[corporate];
        if (!corp.isVerified) revert NotCorporate();

        // Transfer VIDA from seller to corporate
        require(vidaToken.transferFrom(order.seller, corporate, order.vidaAmount), "VIDA transfer failed");

        // Transfer nVIDA from corporate to seller
        require(nVidaToken.transferFrom(corporate, order.seller, order.expectedNVida), "Payment failed");

        // Update order status
        order.fulfilled = true;
        order.fulfilledBy = corporate;
        order.fulfilledAt = block.timestamp;

        // Update corporate stats
        corp.totalPurchased += order.vidaAmount;
        corp.totalSpent += order.expectedNVida;
        corp.lastPurchase = block.timestamp;

        // Update vault stats
        totalSold += order.vidaAmount;
        totalRevenue += order.expectedNVida;

        emit SellOrderFulfilled(orderId, corporate, order.vidaAmount);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 vaultBalance,
        uint256 totalSoldAmount,
        uint256 totalRevenueAmount,
        uint256 currentPrice,
        uint256 totalCorporates
    ) {
        return (
            totalVaultBalance,
            totalSold,
            totalRevenue,
            currentVidaPrice,
            corporateList.length
        );
    }

    /**
     * @notice Get corporate details
     */
    function getCorporate(address corporateAddress) external view returns (
        string memory companyName,
        bool isVerified,
        uint256 totalPurchased,
        uint256 totalSpent,
        uint256 lastPurchase
    ) {
        CorporateIdentity storage corp = corporates[corporateAddress];
        return (
            corp.companyName,
            corp.isVerified,
            corp.totalPurchased,
            corp.totalSpent,
            corp.lastPurchase
        );
    }

    /**
     * @notice Get sell order details
     */
    function getSellOrder(uint256 orderId) external view returns (SellOrder memory) {
        return sellOrders[orderId];
    }

    /**
     * @notice Get purchase details
     */
    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        return purchases[purchaseId];
    }

    /**
     * @notice Calculate nVIDA cost for VIDA amount
     */
    function calculateCost(uint256 vidaAmount) external view returns (uint256) {
        return (vidaAmount * currentVidaPrice) / 1e18;
    }

    /**
     * @notice Get all verified corporates
     */
    function getAllCorporates() external view returns (address[] memory) {
        return corporateList;
    }

    /**
     * @notice Withdraw revenue (admin only)
     */
    function withdrawRevenue(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(amount <= totalRevenue, "Insufficient revenue");

        totalRevenue -= amount;

        require(nVidaToken.transfer(msg.sender, amount), "Transfer failed");
    }
}

