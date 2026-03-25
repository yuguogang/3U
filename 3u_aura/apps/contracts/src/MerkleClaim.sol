// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "./access/Ownable.sol";
import {ReentrancyGuard} from "./access/ReentrancyGuard.sol";
import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";
import {MerkleProof} from "./libraries/MerkleProof.sol";

/// @title MerkleClaim
/// @notice Weekly USDT Merkle claim distributor for lottery and ranking rewards.
contract MerkleClaim is Ownable, ReentrancyGuard {
    error AlreadyClaimed(uint256 epochId, uint256 index);
    error EpochRootAlreadyPublished(uint256 epochId);
    error EpochRootNotPublished(uint256 epochId);
    error InvalidMerkleRoot();
    error InvalidMerkleProof();
    error RootTransferFailed();
    error UnauthorizedPublisher(address account);
    error ZeroAddress();

    event RewardsDeposited(address indexed caller, address indexed funder, uint256 amount);
    event RewardFunderUpdated(address indexed rewardFunder);
    event RootPublisherUpdated(address indexed rootPublisher);
    event WeeklyRootPublished(address indexed publisher, uint256 indexed epochId, bytes32 indexed merkleRoot);
    event RewardClaimed(
        address indexed account,
        uint256 indexed epochId,
        uint256 indexed index,
        uint8 rewardTypeCode,
        uint256 amount,
        bytes32 leaf
    );

    uint8 public constant LOTTERY_REWARD_CODE = 1;
    uint8 public constant RANKING_REWARD_CODE = 2;

    IERC20Minimal public immutable paymentToken;
    address public rewardFunder;
    address public rootPublisher;

    mapping(uint256 => bytes32) public epochRootById;
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitMapByEpoch;

    modifier onlyRootPublisherOrOwner() {
        if (msg.sender != owner && msg.sender != rootPublisher) {
            revert UnauthorizedPublisher(msg.sender);
        }
        _;
    }

    constructor(address initialOwner, address paymentTokenAddress, address initialRewardFunder) Ownable(initialOwner) {
        if (paymentTokenAddress == address(0) || initialRewardFunder == address(0)) {
            revert ZeroAddress();
        }

        paymentToken = IERC20Minimal(paymentTokenAddress);
        rewardFunder = initialRewardFunder;
    }

    /// @notice Updates the root publisher role.
    function setRootPublisher(address newRootPublisher) external onlyOwner {
        if (newRootPublisher == address(0)) {
            revert ZeroAddress();
        }

        rootPublisher = newRootPublisher;
        emit RootPublisherUpdated(newRootPublisher);
    }

    /// @notice Updates the reward funder role.
    function setRewardFunder(address newRewardFunder) external onlyOwner {
        if (newRewardFunder == address(0)) {
            revert ZeroAddress();
        }

        rewardFunder = newRewardFunder;
        emit RewardFunderUpdated(newRewardFunder);
    }

    /// @notice Deposits reward funding into the distributor.
    function depositRewards(uint256 amount) external onlyOwner nonReentrant {
        _depositRewardsFrom(msg.sender, amount);
    }

    /// @notice Deposits reward funding from the configured reward funder.
    function depositRewardsFromFunder(uint256 amount) external onlyRootPublisherOrOwner nonReentrant {
        _depositRewardsFrom(rewardFunder, amount);
    }

    /// @notice Publishes an immutable Merkle root for a weekly epoch.
    function publishRoot(uint256 epochId, bytes32 merkleRoot) external onlyRootPublisherOrOwner {
        if (merkleRoot == bytes32(0)) {
            revert InvalidMerkleRoot();
        }
        if (epochRootById[epochId] != bytes32(0)) {
            revert EpochRootAlreadyPublished(epochId);
        }

        epochRootById[epochId] = merkleRoot;
        emit WeeklyRootPublished(msg.sender, epochId, merkleRoot);
    }

    /// @notice Claims a weekly reward using a published Merkle proof.
    function claim(uint256 epochId, uint256 index, uint8 rewardTypeCode, uint256 amount, bytes32[] calldata merkleProof)
        external
        nonReentrant
    {
        bytes32 merkleRoot = epochRootById[epochId];
        if (merkleRoot == bytes32(0)) {
            revert EpochRootNotPublished(epochId);
        }
        if (_isClaimed(epochId, index)) {
            revert AlreadyClaimed(epochId, index);
        }

        bytes32 leaf = keccak256(abi.encode(msg.sender, rewardTypeCode, amount));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }

        _setClaimed(epochId, index);

        bool success = paymentToken.transfer(msg.sender, amount);
        if (!success) {
            revert RootTransferFailed();
        }

        emit RewardClaimed(msg.sender, epochId, index, rewardTypeCode, amount, leaf);
    }

    /// @notice Returns whether an index has already claimed for a given epoch.
    function isClaimed(uint256 epochId, uint256 index) external view returns (bool) {
        return _isClaimed(epochId, index);
    }

    function _isClaimed(uint256 epochId, uint256 index) internal view returns (bool) {
        uint256 wordIndex = index / 256;
        uint256 bitIndex = index % 256;
        uint256 word = claimedBitMapByEpoch[epochId][wordIndex];
        uint256 mask = (1 << bitIndex);
        return word & mask == mask;
    }

    function _setClaimed(uint256 epochId, uint256 index) internal {
        uint256 wordIndex = index / 256;
        uint256 bitIndex = index % 256;
        claimedBitMapByEpoch[epochId][wordIndex] = claimedBitMapByEpoch[epochId][wordIndex] | (1 << bitIndex);
    }

    function _depositRewardsFrom(address funder, uint256 amount) internal {
        bool success = paymentToken.transferFrom(funder, address(this), amount);
        if (!success) {
            revert RootTransferFailed();
        }

        emit RewardsDeposited(msg.sender, funder, amount);
    }
}
