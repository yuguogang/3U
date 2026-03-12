// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "../src/access/Ownable.sol";
import {FounderNFT} from "../src/FounderNFT.sol";
import {Settlement} from "../src/Settlement.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

contract SettlementTest is Test {
    FounderNFT private founderNFT;
    Settlement private settlement;
    MockUSDT private usdt;

    address private owner = makeAddr("owner");
    address private publisher = makeAddr("publisher");
    address private buyer = makeAddr("buyer");
    address private secondBuyer = makeAddr("secondBuyer");
    address private transferRecipient = makeAddr("transferRecipient");
    address private sale = makeAddr("sale");
    address private outsider = makeAddr("outsider");

    uint256 private constant SUBSIDY_AMOUNT = 30e6;

    function setUp() public {
        founderNFT = new FounderNFT("Founder NFT", "FNFT", owner);
        usdt = new MockUSDT();
        settlement = new Settlement(owner, address(founderNFT), address(usdt), 12);

        vm.prank(owner);
        founderNFT.setSaleContract(sale);
        vm.prank(owner);
        settlement.setEpochPublisher(publisher);

        vm.prank(sale);
        founderNFT.mintPurchased(buyer); // token 1
        vm.prank(sale);
        founderNFT.mintReferral(buyer); // token 2
        vm.prank(sale);
        founderNFT.mintPurchased(secondBuyer); // token 3
    }

    function testPublishAndClaimSinglePurchasedNFT() public {
        _fundAndPublishEpoch(1, publisher);

        vm.prank(buyer);
        uint256 amount = settlement.claimPurchasedSubsidy(1, 1);

        assertEq(amount, SUBSIDY_AMOUNT);
        assertEq(usdt.balanceOf(buyer), SUBSIDY_AMOUNT);
        assertTrue(settlement.isClaimed(1, 1));
    }

    function testBatchClaimSupportsMultiplePurchasedNFTsOwnedBySameAddress() public {
        vm.prank(secondBuyer);
        founderNFT.transferFrom(secondBuyer, buyer, 3);
        _fundAndPublishEpoch(1, publisher);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 3;

        vm.prank(buyer);
        uint256 totalAmount = settlement.claimPurchasedSubsidyBatch(1, tokenIds);

        assertEq(totalAmount, SUBSIDY_AMOUNT * 2);
        assertEq(usdt.balanceOf(buyer), SUBSIDY_AMOUNT * 2);
        assertTrue(settlement.isClaimed(1, 1));
        assertTrue(settlement.isClaimed(1, 3));
    }

    function testCurrentOwnerCanClaimAfterTransfer() public {
        vm.prank(buyer);
        founderNFT.transferFrom(buyer, transferRecipient, 1);
        _fundAndPublishEpoch(1, publisher);

        vm.prank(transferRecipient);
        settlement.claimPurchasedSubsidy(1, 1);

        assertEq(usdt.balanceOf(transferRecipient), SUBSIDY_AMOUNT);
    }

    function testReferralNFTCannotClaimPurchasedSubsidy() public {
        _fundAndPublishEpoch(1, publisher);

        vm.expectRevert(abi.encodeWithSelector(Settlement.NotPurchasedNFT.selector, 2));
        vm.prank(buyer);
        settlement.claimPurchasedSubsidy(1, 2);
    }

    function testTokenMintedAfterEpochCannotClaimOldEpoch() public {
        _fundAndPublishEpoch(1, publisher);

        vm.prank(sale);
        founderNFT.mintPurchased(transferRecipient); // token 4 after publication

        vm.expectRevert(abi.encodeWithSelector(Settlement.TokenMintedAfterEpoch.selector, 1, 4));
        vm.prank(transferRecipient);
        settlement.claimPurchasedSubsidy(1, 4);
    }

    function testDuplicateClaimReverts() public {
        _fundAndPublishEpoch(1, publisher);

        vm.prank(buyer);
        settlement.claimPurchasedSubsidy(1, 1);

        vm.expectRevert(abi.encodeWithSelector(Settlement.TokenAlreadyClaimed.selector, 1, 1));
        vm.prank(buyer);
        settlement.claimPurchasedSubsidy(1, 1);
    }

    function testEpochCountIsCappedAtTwelveWeeks() public {
        usdt.mint(publisher, SUBSIDY_AMOUNT * founderNFT.purchasedMinted());
        vm.startPrank(publisher);
        usdt.approve(address(settlement), SUBSIDY_AMOUNT * founderNFT.purchasedMinted());
        vm.expectRevert(abi.encodeWithSelector(Settlement.EpochOutOfRange.selector, 13));
        settlement.publishSubsidyEpoch(13, uint128(SUBSIDY_AMOUNT), uint64(block.timestamp + 7 days));
        vm.stopPrank();
    }

    function testOnlyOwnerCanSetEpochPublisher() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        vm.prank(outsider);
        settlement.setEpochPublisher(outsider);
    }

    function testOwnerCanReclaimExpiredBudget() public {
        _fundAndPublishEpoch(1, publisher);
        vm.warp(block.timestamp + 8 days);

        vm.prank(owner);
        uint256 reclaimed = settlement.reclaimExpiredBudget(1, owner);

        assertEq(reclaimed, SUBSIDY_AMOUNT * 2);
        assertEq(usdt.balanceOf(owner), SUBSIDY_AMOUNT * 2);
    }

    function _fundAndPublishEpoch(uint256 epochId, address funder) private {
        uint256 fundingAmount = SUBSIDY_AMOUNT * founderNFT.purchasedMinted();
        usdt.mint(funder, fundingAmount);

        vm.startPrank(funder);
        usdt.approve(address(settlement), fundingAmount);
        settlement.publishSubsidyEpoch(epochId, uint128(SUBSIDY_AMOUNT), uint64(block.timestamp + 7 days));
        vm.stopPrank();
    }
}
