// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "./access/Ownable.sol";
import {ReentrancyGuard} from "./access/ReentrancyGuard.sol";
import {FounderNFT} from "./FounderNFT.sol";
import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";

/// @title Settlement
/// @notice Pull-claim settlement contract for purchased founder NFT weekly subsidies.
contract Settlement is Ownable, ReentrancyGuard {
    error EpochAlreadyPublished(uint256 epochId);
    error EpochDeadlinePassed(uint256 epochId);
    error EpochInsufficientBudget(uint256 epochId);
    error EpochNotPublished(uint256 epochId);
    error EpochNotExpired(uint256 epochId, uint256 claimDeadline, uint256 currentTimestamp);
    error EpochOutOfRange(uint256 epochId);
    error InvalidArrayLength();
    error InvalidClaimDeadline(uint256 claimDeadline, uint256 currentTimestamp);
    error NoPurchasedSupplyForEpoch(uint256 epochId);
    error NotCurrentTokenOwner(address account, uint256 tokenId);
    error NotPurchasedNFT(uint256 tokenId);
    error TokenAlreadyClaimed(uint256 epochId, uint256 tokenId);
    error TokenMintedAfterEpoch(uint256 epochId, uint256 tokenId);
    error TransferFailed();
    error UnauthorizedPublisher(address account);
    error ZeroAddress();

    event EpochPublisherUpdated(address indexed epochPublisher);
    event SubsidyEpochPublished(
        uint256 indexed epochId,
        uint256 subsidyAmount,
        uint256 fundingAmount,
        uint256 eligiblePurchasedSupply,
        uint256 maxEligibleTokenId,
        uint256 claimDeadline
    );
    event PurchasedSubsidyClaimed(
        address indexed owner, uint256 indexed epochId, uint256 indexed tokenId, uint256 amount
    );
    event PurchasedSubsidyBatchClaimed(
        address indexed owner, uint256 indexed epochId, uint256 tokenCount, uint256 totalAmount
    );
    event ExpiredBudgetReclaimed(address indexed receiver, uint256 indexed epochId, uint256 amount);

    struct SubsidyEpoch {
        uint64 claimDeadline;
        uint64 publishedAt;
        uint32 eligiblePurchasedSupply;
        uint32 claimedPurchasedSupply;
        uint32 maxEligibleTokenId;
        uint128 subsidyAmount;
        uint128 remainingBudget;
        bool published;
    }

    /// @notice Maximum number of subsidy epochs permitted by the 3-month cap.
    uint256 public immutable maxSubsidyEpochs;

    /// @notice Founder NFT contract.
    FounderNFT public immutable founderNFT;

    /// @notice USDT payout token.
    IERC20Minimal public immutable paymentToken;

    /// @notice Optional publisher role for epoch publication.
    address public epochPublisher;

    mapping(uint256 => SubsidyEpoch) public subsidyEpochs;
    mapping(uint256 => mapping(uint256 => bool)) private claimedTokenByEpoch;

    modifier onlyEpochPublisherOrOwner() {
        if (msg.sender != owner && msg.sender != epochPublisher) {
            revert UnauthorizedPublisher(msg.sender);
        }
        _;
    }

    constructor(address initialOwner, address founderNFTAddress, address paymentTokenAddress, uint256 maxSubsidyEpochs_)
        Ownable(initialOwner)
    {
        if (founderNFTAddress == address(0) || paymentTokenAddress == address(0)) {
            revert ZeroAddress();
        }
        if (maxSubsidyEpochs_ == 0) {
            revert EpochOutOfRange(0);
        }

        founderNFT = FounderNFT(founderNFTAddress);
        paymentToken = IERC20Minimal(paymentTokenAddress);
        maxSubsidyEpochs = maxSubsidyEpochs_;
    }

    /// @notice Updates the epoch publisher role.
    function setEpochPublisher(address newEpochPublisher) external onlyOwner {
        if (newEpochPublisher == address(0)) {
            revert ZeroAddress();
        }

        epochPublisher = newEpochPublisher;
        emit EpochPublisherUpdated(newEpochPublisher);
    }

    /// @notice Publishes a subsidy epoch and pulls exact funding into the contract.
    function publishSubsidyEpoch(uint256 epochId, uint128 subsidyAmount, uint64 claimDeadline)
        external
        onlyEpochPublisherOrOwner
        nonReentrant
    {
        if (epochId == 0 || epochId > maxSubsidyEpochs) {
            revert EpochOutOfRange(epochId);
        }
        if (claimDeadline <= block.timestamp) {
            revert InvalidClaimDeadline(claimDeadline, block.timestamp);
        }
        if (subsidyEpochs[epochId].published) {
            revert EpochAlreadyPublished(epochId);
        }

        uint256 purchasedSupply = founderNFT.purchasedMinted();
        if (purchasedSupply == 0) {
            revert NoPurchasedSupplyForEpoch(epochId);
        }

        uint256 fundingAmount = uint256(subsidyAmount) * purchasedSupply;
        bool success = paymentToken.transferFrom(msg.sender, address(this), fundingAmount);
        if (!success) {
            revert TransferFailed();
        }

        subsidyEpochs[epochId] = SubsidyEpoch({
            claimDeadline: claimDeadline,
            publishedAt: uint64(block.timestamp),
            eligiblePurchasedSupply: uint32(purchasedSupply),
            claimedPurchasedSupply: 0,
            maxEligibleTokenId: uint32(founderNFT.totalSupply()),
            subsidyAmount: subsidyAmount,
            remainingBudget: uint128(fundingAmount),
            published: true
        });

        emit SubsidyEpochPublished(
            epochId, subsidyAmount, fundingAmount, purchasedSupply, founderNFT.totalSupply(), claimDeadline
        );
    }

    /// @notice Claims one epoch subsidy for a single purchased NFT.
    function claimPurchasedSubsidy(uint256 epochId, uint256 tokenId) external nonReentrant returns (uint256 amount) {
        amount = _consumeClaim(epochId, tokenId, msg.sender);
        _transferPayout(msg.sender, amount);
    }

    /// @notice Claims one epoch subsidy for multiple purchased NFTs owned by the caller.
    function claimPurchasedSubsidyBatch(uint256 epochId, uint256[] calldata tokenIds)
        external
        nonReentrant
        returns (uint256 totalAmount)
    {
        if (tokenIds.length == 0) {
            revert InvalidArrayLength();
        }

        for (uint256 index = 0; index < tokenIds.length; index++) {
            totalAmount += _consumeClaim(epochId, tokenIds[index], msg.sender);
        }

        _transferPayout(msg.sender, totalAmount);
        emit PurchasedSubsidyBatchClaimed(msg.sender, epochId, tokenIds.length, totalAmount);
    }

    /// @notice Reclaims the remaining epoch budget after the claim deadline has passed.
    function reclaimExpiredBudget(uint256 epochId, address receiver)
        external
        onlyOwner
        nonReentrant
        returns (uint256 amount)
    {
        if (receiver == address(0)) {
            revert ZeroAddress();
        }

        SubsidyEpoch storage epoch = subsidyEpochs[epochId];
        if (!epoch.published) {
            revert EpochNotPublished(epochId);
        }
        if (block.timestamp <= epoch.claimDeadline) {
            revert EpochNotExpired(epochId, epoch.claimDeadline, block.timestamp);
        }

        amount = epoch.remainingBudget;
        epoch.remainingBudget = 0;

        _transferPayout(receiver, amount);
        emit ExpiredBudgetReclaimed(receiver, epochId, amount);
    }

    /// @notice Returns whether a token has already claimed a given epoch.
    function isClaimed(uint256 epochId, uint256 tokenId) external view returns (bool) {
        return claimedTokenByEpoch[epochId][tokenId];
    }

    function _consumeClaim(uint256 epochId, uint256 tokenId, address claimant) internal returns (uint256 amount) {
        SubsidyEpoch storage epoch = subsidyEpochs[epochId];
        if (!epoch.published) {
            revert EpochNotPublished(epochId);
        }
        if (block.timestamp > epoch.claimDeadline) {
            revert EpochDeadlinePassed(epochId);
        }
        if (tokenId == 0 || tokenId > epoch.maxEligibleTokenId) {
            revert TokenMintedAfterEpoch(epochId, tokenId);
        }
        if (!founderNFT.isPurchasedNFT(tokenId)) {
            revert NotPurchasedNFT(tokenId);
        }
        if (claimedTokenByEpoch[epochId][tokenId]) {
            revert TokenAlreadyClaimed(epochId, tokenId);
        }
        if (founderNFT.ownerOf(tokenId) != claimant) {
            revert NotCurrentTokenOwner(claimant, tokenId);
        }

        amount = epoch.subsidyAmount;
        if (epoch.remainingBudget < amount) {
            revert EpochInsufficientBudget(epochId);
        }

        claimedTokenByEpoch[epochId][tokenId] = true;
        epoch.claimedPurchasedSupply += 1;
        epoch.remainingBudget -= uint128(amount);

        emit PurchasedSubsidyClaimed(claimant, epochId, tokenId, amount);
    }

    function _transferPayout(address receiver, uint256 amount) internal {
        if (amount == 0) {
            return;
        }

        bool success = paymentToken.transfer(receiver, amount);
        if (!success) {
            revert TransferFailed();
        }
    }
}
