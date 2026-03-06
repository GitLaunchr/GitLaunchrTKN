// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FeeSplitter
 * @notice Receives ETH and splits it between the creator and platform treasury
 *         according to configurable basis points (BPS).
 *
 * Default split when deployed by GitLaunchr:
 *   creatorBps  = 9000  (90%)
 *   platformBps = 1000  (10%)
 *
 * Combined with Bankr's 57% creator share:
 *   Creator net = 57% * 90%  = 51.3% of total fees
 *   Platform    = 57% * 10%  =  5.7% of total fees
 */
contract FeeSplitter {
    // ─── Storage ─────────────────────────────────────────────────
    address public immutable creatorPayout;
    address public immutable platformTreasury;
    uint256 public immutable creatorBps;
    uint256 public immutable platformBps;

    // ─── Events ──────────────────────────────────────────────────
    event ETHDistributed(uint256 toCreator, uint256 toPlatform);

    // ─── Errors ──────────────────────────────────────────────────
    error InvalidBPS();
    error ZeroAddress();
    error TransferFailed();
    error NothingToDistribute();

    // ─── Constructor ─────────────────────────────────────────────
    constructor(
        address creatorPayout_,
        address platformTreasury_,
        uint256 creatorBps_,
        uint256 platformBps_
    ) {
        if (creatorPayout_ == address(0) || platformTreasury_ == address(0))
            revert ZeroAddress();
        if (creatorBps_ + platformBps_ != 10_000)
            revert InvalidBPS();

        creatorPayout    = creatorPayout_;
        platformTreasury = platformTreasury_;
        creatorBps       = creatorBps_;
        platformBps      = platformBps_;
    }

    // ─── Receive ─────────────────────────────────────────────────
    /// @notice Accept ETH directly (e.g. from Bankr fee distribution).
    receive() external payable {}

    // ─── Distribute ──────────────────────────────────────────────
    /**
     * @notice Split the contract's entire ETH balance between creator and platform.
     *         Anyone can call this (no access control needed; funds always split correctly).
     */
    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();

        uint256 toCreator  = (balance * creatorBps)  / 10_000;
        uint256 toPlatform = balance - toCreator; // remainder to avoid dust

        _sendETH(creatorPayout, toCreator);
        _sendETH(platformTreasury, toPlatform);

        emit ETHDistributed(toCreator, toPlatform);
    }

    // ─── Internal ────────────────────────────────────────────────
    function _sendETH(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
