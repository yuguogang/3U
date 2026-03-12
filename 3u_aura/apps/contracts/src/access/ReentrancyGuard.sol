// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title ReentrancyGuard
/// @notice Minimal non-reentrancy guard for payment and mint entrypoints.
abstract contract ReentrancyGuard {
    error ReentrancyGuardReentrantCall();

    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private reentrancyStatus = NOT_ENTERED;

    modifier nonReentrant() {
        if (reentrancyStatus == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        reentrancyStatus = ENTERED;
        _;
        reentrancyStatus = NOT_ENTERED;
    }
}
