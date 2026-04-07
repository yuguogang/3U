// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "../src/access/Ownable.sol";
import {FounderNFT} from "../src/FounderNFT.sol";
import {NFTSale} from "../src/NFTSale.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

contract NFTSaleTest is Test {
    FounderNFT private founderNFT;
    NFTSale private sale;
    MockUSDT private usdt;

    address private owner = makeAddr("owner");
    address private financeWallet = makeAddr("financeWallet");
    address private buyer = makeAddr("buyer");
    address private outsider = makeAddr("outsider");
    address private referralSigner;

    uint256 private referralSignerPrivateKey = 0xBEEF;

    function setUp() public {
        referralSigner = vm.addr(referralSignerPrivateKey);

        founderNFT = new FounderNFT("Founder NFT", "FNFT", owner);
        usdt = new MockUSDT();
        sale = new NFTSale(
            owner,
            address(founderNFT),
            address(usdt),
            financeWallet,
            referralSigner
        );

        vm.prank(owner);
        founderNFT.setSaleContract(address(sale));
    }

    function testBuyNFTTransfersFundsAndMintsPurchasedToken() public {
        usdt.mint(buyer, sale.PURCHASE_PRICE() * 2);

        vm.startPrank(buyer);
        usdt.approve(address(sale), sale.PURCHASE_PRICE());
        uint256 tokenId = sale.buyNFT();
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(usdt.balanceOf(financeWallet), sale.PURCHASE_PRICE());
        assertEq(founderNFT.ownerOf(tokenId), buyer);
        assertTrue(founderNFT.isPurchasedNFT(tokenId));

        (uint256 purchasedMinted, uint256 referralMinted, uint256 totalMinted) = sale.getNFTMintStats();
        assertEq(purchasedMinted, 1);
        assertEq(referralMinted, 0);
        assertEq(totalMinted, 1);
    }

    function testBuyNFTAllowsMultiplePurchasedNFTsPerAddress() public {
        usdt.mint(buyer, sale.PURCHASE_PRICE() * 2);

        vm.startPrank(buyer);
        usdt.approve(address(sale), sale.PURCHASE_PRICE() * 2);
        uint256 firstTokenId = sale.buyNFT();
        uint256 secondTokenId = sale.buyNFT();
        vm.stopPrank();

        assertEq(firstTokenId, 1);
        assertEq(secondTokenId, 2);
        assertEq(founderNFT.ownerOf(firstTokenId), buyer);
        assertEq(founderNFT.ownerOf(secondTokenId), buyer);
        assertEq(founderNFT.purchasedMinted(), 2);
    }

    function testBuyNFTRevertsWhenTransferFromReturnsFalse() public {
        usdt.mint(buyer, sale.PURCHASE_PRICE());
        usdt.setForceTransferFailure(true);

        vm.startPrank(buyer);
        usdt.approve(address(sale), sale.PURCHASE_PRICE());
        vm.expectRevert(NFTSale.TransferFromFailed.selector);
        sale.buyNFT();
        vm.stopPrank();
    }

    function testBuyNFTRevertsWhenAllowanceIsInsufficient() public {
        usdt.mint(buyer, sale.PURCHASE_PRICE());

        vm.startPrank(buyer);
        usdt.approve(address(sale), sale.PURCHASE_PRICE() - 1);
        vm.expectRevert(MockUSDT.InsufficientAllowance.selector);
        sale.buyNFT();
        vm.stopPrank();
    }

    function testBuyNFTCanExceedFormerThirtyCap() public {
        for (uint256 index = 0; index < 31; index++) {
            address currentBuyer = address(uint160(index + 0x1000));
            usdt.mint(currentBuyer, sale.PURCHASE_PRICE());
            vm.startPrank(currentBuyer);
            usdt.approve(address(sale), sale.PURCHASE_PRICE());
            uint256 tokenId = sale.buyNFT();
            vm.stopPrank();

            assertEq(tokenId, index + 1);
        }

        assertEq(founderNFT.purchasedMinted(), 31);

        (uint256 purchasedMinted, uint256 referralMinted, uint256 totalMinted) = sale.getNFTMintStats();
        assertEq(purchasedMinted, 31);
        assertEq(referralMinted, 0);
        assertEq(totalMinted, 31);
    }

    function testBuyNFTHasNoFormerHundredCap() public {
        for (uint256 index = 0; index < 101; index++) {
            address currentBuyer = address(uint160(index + 0x2000));
            usdt.mint(currentBuyer, sale.PURCHASE_PRICE());
            vm.startPrank(currentBuyer);
            usdt.approve(address(sale), sale.PURCHASE_PRICE());
            sale.buyNFT();
            vm.stopPrank();
        }

        assertEq(founderNFT.purchasedMinted(), 101);
        assertEq(founderNFT.totalSupply(), 101);
    }

    function testOnlyOwnerCanUpdateAdminAddresses() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        vm.prank(outsider);
        sale.setFinanceWallet(outsider);

        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        vm.prank(outsider);
        sale.setReferralSigner(outsider);
    }
}
