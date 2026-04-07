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
        assertEq(founderNFT.purchasedMinted(), 1);
        assertEq(founderNFT.referralMinted(), 1);
        assertEq(founderNFT.ownerOf(purchasedTokenId), buyer);
        assertEq(founderNFT.ownerOf(referralTokenId), buyer);
    }

    function testReferralMintAllowsMultipleTokensPerAddress() public {
        vm.prank(sale);
        uint256 firstTokenId = founderNFT.mintReferral(buyer);
        vm.prank(sale);
        uint256 secondTokenId = founderNFT.mintReferral(buyer);

        assertEq(firstTokenId, 1);
        assertEq(secondTokenId, 2);
        assertEq(founderNFT.referralMinted(), 2);
        assertEq(founderNFT.ownerOf(firstTokenId), buyer);
        assertEq(founderNFT.ownerOf(secondTokenId), buyer);
    }

    function testPurchasedMintHasNoFormerThirtyOrHundredCap() public {
        for (uint256 index = 0; index < 101; index++) {
            vm.prank(sale);
            uint256 tokenId = founderNFT.mintPurchased(address(uint160(index + 10)));
            assertEq(tokenId, index + 1);
        }

        assertEq(founderNFT.purchasedMinted(), 101);
        assertEq(founderNFT.totalSupply(), 101);
    }

    function testReferralMintHasNoFormerSeventyCap() public {
        for (uint256 index = 0; index < 71; index++) {
            vm.prank(sale);
            founderNFT.mintReferral(address(uint160(index + 100)));
        }

        assertEq(founderNFT.referralMinted(), 71);
        assertEq(founderNFT.totalSupply(), 71);
    }
}
