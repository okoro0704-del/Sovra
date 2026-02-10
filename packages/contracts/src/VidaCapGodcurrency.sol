// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VidaCapGodcurrency - The Final Truth
 * @notice VIDA Cap - The Godcurrency of the Vitalia Ecosystem
 * @dev Implements dynamic minting with supply-based thresholds and permanent burn
 * 
 * TOKENOMICS:
 * - Initial Mint: 10 Units (5 to Architect / 5 to National Escrow)
 * - Start Price: $1,000 per VIDA Cap
 * - 10-Unit Era: Every PFF handshake mints 10 VIDA Cap (5 Citizen / 5 Nation)
 * - 5B Threshold: Once supply hits 5 Billion, drop to 2-Unit Era
 * - 2-Unit Era: New mints drop to 2 VIDA Cap (1 Citizen / 1 Nation)
 * - Permanent Burn: 1% transaction burn until supply equals 1 VIDA Cap per verified Citizen
 * 
 * PFF INTERFACE:
 * - Only accepts SOVEREIGN_AUTH signal from Main PFF Protocol
 * - App-agnostic: Chain doesn't care about app name, only PFF certification
 * 
 * "The Godcurrency. The Final Truth."
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 */
contract VidaCapGodcurrency is ERC20, AccessControl, ReentrancyGuard {
    // ============ CONSTANTS ============
    
    bytes32 public constant PFF_MINTER_ROLE = keccak256("PFF_MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant NATIONAL_ESCROW_ROLE = keccak256("NATIONAL_ESCROW_ROLE");
    
    uint256 public constant INITIAL_MINT = 10 * 10**18; // 10 VIDA Cap
    uint256 public constant GENESIS_SPLIT = 5 * 10**18; // 5 to Architect / 5 to Nation
    uint256 public constant START_PRICE_USD = 1000; // $1,000 per VIDA Cap
    
    uint256 public constant THRESHOLD_5B = 5_000_000_000 * 10**18; // 5 Billion VIDA Cap
    uint256 public constant MINT_AMOUNT_10_ERA = 10 * 10**18; // 10 VIDA Cap per handshake
    uint256 public constant MINT_AMOUNT_2_ERA = 2 * 10**18; // 2 VIDA Cap per handshake
    uint256 public constant CITIZEN_SPLIT_10_ERA = 5 * 10**18; // 5 to Citizen
    uint256 public constant NATION_SPLIT_10_ERA = 5 * 10**18; // 5 to Nation
    uint256 public constant CITIZEN_SPLIT_2_ERA = 1 * 10**18; // 1 to Citizen
    uint256 public constant NATION_SPLIT_2_ERA = 1 * 10**18; // 1 to Nation
    
    uint256 public constant BURN_RATE_BPS = 100; // 1% (100 basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // ============ STATE VARIABLES ============
    
    enum MintingEra { TEN_UNIT_ERA, TWO_UNIT_ERA }
    
    MintingEra public currentEra;
    address public nationalEscrow;
    address public architect; // Isreal Okoro
    
    uint256 public totalVerifiedCitizens;
    uint256 public totalBurned;
    uint256 public totalPFFHandshakes;
    
    mapping(bytes32 => bool) public usedPFFSignatures; // Anti-replay protection
    mapping(address => bool) public isVerifiedCitizen;
    
    // ============ EVENTS ============
    
    event GenesisMintExecuted(address indexed architect, address indexed nationalEscrow, uint256 amount);
    event PFFHandshakeMint(address indexed citizen, uint256 citizenAmount, uint256 nationAmount, bytes32 pffSignature);
    event EraTransition(MintingEra oldEra, MintingEra newEra, uint256 currentSupply);
    event TransactionBurned(address indexed from, address indexed to, uint256 burnAmount, uint256 totalBurned);
    event CitizenVerified(address indexed citizen, bytes32 pffHash);
    event PFFSignatureUsed(bytes32 indexed signature, address indexed citizen);
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _architect,
        address _nationalEscrow
    ) ERC20("VIDA Cap", "VCAP") {
        require(_architect != address(0), "Invalid architect address");
        require(_nationalEscrow != address(0), "Invalid national escrow address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PFF_MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(NATIONAL_ESCROW_ROLE, _nationalEscrow);
        
        architect = _architect;
        nationalEscrow = _nationalEscrow;
        currentEra = MintingEra.TEN_UNIT_ERA;
        
        // GENESIS MINT: 10 Units (5 to Architect / 5 to National Escrow)
        _mint(_architect, GENESIS_SPLIT);
        _mint(_nationalEscrow, GENESIS_SPLIT);
        
        emit GenesisMintExecuted(_architect, _nationalEscrow, INITIAL_MINT);
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Mint VIDA Cap on PFF-verified handshake
     * @param citizen Citizen address
     * @param pffSignature SOVEREIGN_AUTH signature from PFF Protocol
     * @param pffHash PFF Truth-Hash from heartbeat
     * 
     * LOGIC:
     * - 10-Unit Era: Mint 10 VIDA Cap (5 to Citizen / 5 to Nation)
     * - 2-Unit Era: Mint 2 VIDA Cap (1 to Citizen / 1 to Nation)
     * - Transition at 5B supply threshold
     */
    function mintOnPFFHandshake(
        address citizen,
        bytes32 pffSignature,
        bytes32 pffHash
    ) external onlyRole(PFF_MINTER_ROLE) nonReentrant {
        require(citizen != address(0), "Invalid citizen address");
        require(!usedPFFSignatures[pffSignature], "PFF signature already used");
        
        // Mark signature as used (anti-replay)
        usedPFFSignatures[pffSignature] = true;
        emit PFFSignatureUsed(pffSignature, citizen);
        
        // Verify citizen if first handshake
        if (!isVerifiedCitizen[citizen]) {
            isVerifiedCitizen[citizen] = true;
            totalVerifiedCitizens++;
            emit CitizenVerified(citizen, pffHash);
        }
        
        // Determine mint amounts based on current era
        uint256 citizenAmount;
        uint256 nationAmount;
        
        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            citizenAmount = CITIZEN_SPLIT_10_ERA; // 5 VIDA Cap
            nationAmount = NATION_SPLIT_10_ERA;   // 5 VIDA Cap
        } else {
            citizenAmount = CITIZEN_SPLIT_2_ERA;  // 1 VIDA Cap
            nationAmount = NATION_SPLIT_2_ERA;    // 1 VIDA Cap
        }
        
        // Mint to citizen and national escrow
        _mint(citizen, citizenAmount);
        _mint(nationalEscrow, nationAmount);
        
        totalPFFHandshakes++;
        
        emit PFFHandshakeMint(citizen, citizenAmount, nationAmount, pffSignature);
        
        // Check if we need to transition to 2-Unit Era
        _checkEraTransition();
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @notice Check if supply threshold reached and transition era
     */
    function _checkEraTransition() internal {
        uint256 currentSupply = totalSupply();

        if (currentEra == MintingEra.TEN_UNIT_ERA && currentSupply >= THRESHOLD_5B) {
            MintingEra oldEra = currentEra;
            currentEra = MintingEra.TWO_UNIT_ERA;
            emit EraTransition(oldEra, currentEra, currentSupply);
        }
    }

    /**
     * @notice Override transfer to implement 1% permanent burn
     * @dev Burn stops when supply equals 1 VIDA Cap per verified citizen
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");

        // Calculate burn amount (1%)
        uint256 burnAmount = (amount * BURN_RATE_BPS) / BPS_DENOMINATOR;
        uint256 transferAmount = amount - burnAmount;

        // Check if we should still burn (supply > 1 VIDA Cap per verified citizen)
        uint256 supplyTarget = totalVerifiedCitizens * 10**18; // 1 VIDA Cap per citizen

        if (totalSupply() > supplyTarget && supplyTarget > 0) {
            // Burn 1%
            _burn(from, burnAmount);
            totalBurned += burnAmount;
            emit TransactionBurned(from, to, burnAmount, totalBurned);
        } else {
            // No burn - supply has reached equilibrium
            transferAmount = amount;
        }

        // Transfer remaining amount
        super._transfer(from, to, transferAmount);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get current minting era
     */
    function getCurrentEra() external view returns (MintingEra) {
        return currentEra;
    }

    /**
     * @notice Get mint amounts for current era
     */
    function getMintAmountForCurrentEra() external view returns (uint256 citizenAmount, uint256 nationAmount) {
        if (currentEra == MintingEra.TEN_UNIT_ERA) {
            return (CITIZEN_SPLIT_10_ERA, NATION_SPLIT_10_ERA);
        } else {
            return (CITIZEN_SPLIT_2_ERA, NATION_SPLIT_2_ERA);
        }
    }

    /**
     * @notice Check if burn is active
     */
    function shouldBurn() external view returns (bool) {
        uint256 supplyTarget = totalVerifiedCitizens * 10**18;
        return totalSupply() > supplyTarget && supplyTarget > 0;
    }

    /**
     * @notice Get supply target (1 VIDA Cap per verified citizen)
     */
    function getSupplyTarget() external view returns (uint256) {
        return totalVerifiedCitizens * 10**18;
    }

    /**
     * @notice Get distance to 5B threshold
     */
    function getDistanceToThreshold() external view returns (uint256) {
        uint256 currentSupply = totalSupply();
        if (currentSupply >= THRESHOLD_5B) {
            return 0;
        }
        return THRESHOLD_5B - currentSupply;
    }

    /**
     * @notice Get comprehensive stats
     */
    function getStats() external view returns (
        uint256 supply,
        uint256 burned,
        uint256 citizens,
        uint256 handshakes,
        MintingEra era,
        bool burnActive,
        uint256 supplyTarget
    ) {
        supply = totalSupply();
        burned = totalBurned;
        citizens = totalVerifiedCitizens;
        handshakes = totalPFFHandshakes;
        era = currentEra;
        supplyTarget = totalVerifiedCitizens * 10**18;
        burnActive = supply > supplyTarget && supplyTarget > 0;
    }

    /**
     * @notice Get Scarcity Clock data for LifeOS Dashboard
     * @return remaining10UnitSlots Number of 10-unit mints remaining before 2-unit era
     * @return percentToThreshold Percentage progress to 5B threshold (0-100)
     * @return estimatedTimeToGreatBurn Estimated blocks until Great Burn (if applicable)
     * @return isGreatBurnTriggered Has the Great Burn been triggered?
     */
    function getScarcityClock() external view returns (
        uint256 remaining10UnitSlots,
        uint256 percentToThreshold,
        uint256 estimatedTimeToGreatBurn,
        bool isGreatBurnTriggered
    ) {
        uint256 currentSupply = totalSupply();

        if (currentEra == MintingEra.TWO_UNIT_ERA) {
            // Great Burn already triggered
            return (0, 100, 0, true);
        }

        // Calculate remaining 10-unit slots
        if (currentSupply >= THRESHOLD_5B) {
            remaining10UnitSlots = 0;
        } else {
            uint256 remainingSupply = THRESHOLD_5B - currentSupply;
            remaining10UnitSlots = remainingSupply / MINT_AMOUNT_10_ERA;
        }

        // Calculate percentage to threshold
        percentToThreshold = (currentSupply * 100) / THRESHOLD_5B;
        if (percentToThreshold > 100) {
            percentToThreshold = 100;
        }

        // Estimate time to Great Burn (assuming 1 handshake per block)
        estimatedTimeToGreatBurn = remaining10UnitSlots;

        isGreatBurnTriggered = (currentEra == MintingEra.TWO_UNIT_ERA);
    }

    /**
     * @notice Get price in USD (hardcoded at $1,000 per VIDA Cap)
     * @return priceUSD Price in USD (no decimals)
     */
    function getPriceUSD() external pure returns (uint256 priceUSD) {
        return START_PRICE_USD;
    }

    /**
     * @notice Calculate market cap in USD
     * @return marketCapUSD Market cap in USD
     */
    function getMarketCapUSD() external view returns (uint256 marketCapUSD) {
        uint256 supply = totalSupply();
        // Convert from 18 decimals to whole units
        uint256 supplyInUnits = supply / 10**18;
        return supplyInUnits * START_PRICE_USD;
    }

    /**
     * @notice Get burn progress to equilibrium
     * @return currentSupply Current total supply
     * @return targetSupply Target supply (1 VIDA Cap per citizen)
     * @return excessSupply Amount above target (being burned)
     * @return percentToEquilibrium Progress to equilibrium (0-100)
     */
    function getBurnProgress() external view returns (
        uint256 currentSupply,
        uint256 targetSupply,
        uint256 excessSupply,
        uint256 percentToEquilibrium
    ) {
        currentSupply = totalSupply();
        targetSupply = totalVerifiedCitizens * 10**18;

        if (currentSupply <= targetSupply) {
            excessSupply = 0;
            percentToEquilibrium = 100;
        } else {
            excessSupply = currentSupply - targetSupply;
            // Calculate how much has been burned relative to initial excess
            // This is a simplified calculation
            percentToEquilibrium = 0;
            if (totalBurned > 0) {
                percentToEquilibrium = (totalBurned * 100) / (totalBurned + excessSupply);
            }
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Grant PFF minter role
     */
    function grantPFFMinterRole(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PFF_MINTER_ROLE, minter);
    }

    /**
     * @notice Revoke PFF minter role
     */
    function revokePFFMinterRole(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(PFF_MINTER_ROLE, minter);
    }

    /**
     * @notice Update national escrow address
     */
    function updateNationalEscrow(address newEscrow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newEscrow != address(0), "Invalid escrow address");

        // Revoke old escrow role
        revokeRole(NATIONAL_ESCROW_ROLE, nationalEscrow);

        // Grant new escrow role
        nationalEscrow = newEscrow;
        grantRole(NATIONAL_ESCROW_ROLE, newEscrow);
    }
}

