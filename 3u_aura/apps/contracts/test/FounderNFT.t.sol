// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "../src/access/Ownable.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

contract FounderNFTTest is Test {
    FounderNFT private founderNFT;

    address private owner = makeAddr("owner");
    address private sale = makeAddr("sale");
    address private outsider = makeAddr("outsider");
    address private buyer = makeAddr("buyer");

    function setUp() public {
        founderNFT = new FounderNFT("Founder NFT", "FNFT", owner);

        vm.prank(owner);
        founderNFT.setSaleContract(sale);
    }

    function testOnlyOwnerCanSetSaleContract() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        vm.prank(outsider);
        founderNFT.setSaleContract(outsider);
    }

    function testPurchasedAndReferralMintsTrackTypeAndSupply() public {
        vm.prank(sale);
        uint256 purchasedTokenId = founderNFT.mintPurchased(buyer);

        vm.prank(sale);
        uint256 referralTokenId = founderNFT.mintReferral(buyer);

        assertEq(purchasedTokenId, 1);
        assertEq(referralTokenId, 2);
        assertTrue(founderNFT.isPurchasedNFT(purchasedTokenId));
        assertFalse(founderNFT.isPurchasedNFT(referralTokenId));
        assertTrue(founderNFT.hasReferralNFT(buyer));
        assertEq(founderNFT.purchasedMinted(), 1);
        assertEq(founderNFT.referralMinted(), 1);
        assertEq(founderNFT.ownerOf(purchasedTokenId), buyer);
        assertEq(founderNFT.ownerOf(referralTokenId), buyer);
    }

    function testReferralMintIsOnePerAddress() public {
        vm.prank(sale);
        founderNFT.mintReferral(buyer);

        vm.expectRevert(abi.encodeWithSelector(FounderNFT.ReferralAlreadyMinted.selector, buyer));
        vm.prank(sale);
        founderNFT.mintReferral(buyer);
    }

    function testPurchasedSupplyCapIsEnforced() public {
        for (uint256 index = 0; index < founderNFT.MAX_PURCHASED_SUPPLY(); index++) {
            vm.prank(sale);
            founderNFT.mintPurchased(address(uint160(index + 10)));
        }

        vm.expectRevert(FounderNFT.PurchasedSupplySoldOut.selector);
        vm.prank(sale);
        founderNFT.mintPurchased(makeAddr("overflow"));
    }

    function testReferralSupplyCapIsEnforced() public {
        for (uint256 index = 0; index < founderNFT.MAX_REFERRAL_SUPPLY(); index++) {
            vm.prank(sale);
            founderNFT.mintReferral(address(uint160(index + 100)));
        }

        vm.expectRevert(FounderNFT.ReferralSupplySoldOut.selector);
        vm.prank(sale);
        founderNFT.mintReferral(makeAddr("overflow"));
    }
}
