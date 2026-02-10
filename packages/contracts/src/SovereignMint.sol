// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SovereignMint - PFF Vitalization → SOVRYN Chain Minting
 * @notice When a user is Vitalized in Supabase, the backend calls this contract.
 *         Architect receives 1.1 VIDA (spendable) + 4.0 VIDA (hard-locked) per 11 VIDA logic.
 *         Meta-transaction: relayer (SOVRYN backend) pays gas so Architect doesn't need to.
 */
contract SovereignMint is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    uint256 public constant ARCHITECT_SPENDABLE = 11 * 10**17;  // 1.1 VIDA
    uint256 public constant ARCHITECT_LOCKED = 4 * 10**18;     // 4.0 VIDA

    mapping(address => uint256) public lockedBalanceOf;

    event ArchitectMinted(address indexed architect, uint256 spendable, uint256 locked);

    constructor() ERC20("VIDA Cap", "VIDA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
    }

    /**
     * @notice Mint for Architect: 1.1 VIDA spendable + 4.0 VIDA hard-locked.
     *         Called by relayer (SOVRYN backend) so Architect doesn't pay gas.
     *         Spendable goes to architect; locked is held in contract and tracked for vesting.
     */
    function mintForArchitect(
        address architectWallet,
        uint256 spendableAmount,
        uint256 lockedAmount
    ) external onlyRole(RELAYER_ROLE) nonReentrant {
        require(architectWallet != address(0), "Invalid architect");
        require(spendableAmount <= ARCHITECT_SPENDABLE && spendableAmount > 0, "Invalid spendable");
        require(lockedAmount <= ARCHITECT_LOCKED && lockedAmount > 0, "Invalid locked");

        _mint(architectWallet, spendableAmount);
        lockedBalanceOf[architectWallet] += lockedAmount;
        _mint(address(this), lockedAmount);

        emit ArchitectMinted(architectWallet, spendableAmount, lockedAmount);
    }

    /// @notice Spendable balance = ERC20 balance (locked is tracked separately)
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account);
    }
}
