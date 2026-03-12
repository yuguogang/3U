// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title IERC20Minimal
/// @notice Minimal ERC20 interface for NFT purchase settlement.
interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}
