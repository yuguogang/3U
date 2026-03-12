// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Ownable
/// @notice Minimal ownership module for NFT core contracts.
abstract contract Ownable {
    error OwnableInvalidOwner(address owner);
    error OwnableUnauthorizedAccount(address account);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Current contract owner.
    address public owner;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }

        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    /// @notice Transfers contract ownership to a new address.
    /// @param newOwner New owner address.
    function transferOwnership(address newOwner) public onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }

        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
