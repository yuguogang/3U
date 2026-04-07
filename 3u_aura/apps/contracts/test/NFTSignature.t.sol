// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {FounderNFT} from "../src/FounderNFT.sol";
import {NFTSale} from "../src/NFTSale.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

contract NFTSignatureTest is Test {
    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant REFERRAL_MINT_TYPEHASH =
        keccak256("ReferralMint(address recipient,uint256 nonce,uint256 expiry)");
    bytes32 private constant NAME_HASH = keccak256(bytes("3U AURA Founder NFT Sale"));
    bytes32 private constant VERSION_HASH = keccak256(bytes("1"));

    FounderNFT private founderNFT;
    NFTSale private sale;
    MockUSDT private usdt;

    address private owner = makeAddr("owner");
    address private financeWallet = makeAddr("financeWallet");
    address private minter = makeAddr("minter");
    address private anotherMinter = makeAddr("anotherMinter");
    address private referralSigner;
    address private wrongSigner;

    uint256 private referralSignerPrivateKey = 0xBEEF;
    uint256 private wrongSignerPrivateKey = 0xCAFE;

    function setUp() public {
        referralSigner = vm.addr(referralSignerPrivateKey);
        wrongSigner = vm.addr(wrongSignerPrivateKey);

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

    function testMintNFTByReferralAcceptsValidSignature() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes memory signature = _signReferral(referralSignerPrivateKey, minter, 0, expiry);

        vm.prank(minter);
        uint256 tokenId = sale.mintNFTByReferral(0, expiry, signature);

        assertEq(tokenId, 1);
        assertEq(founderNFT.ownerOf(tokenId), minter);
        assertEq(sale.referralNonces(minter), 1);
    }

    function testMintNFTByReferralRejectsReplay() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes memory signature = _signReferral(referralSignerPrivateKey, minter, 0, expiry);

        vm.prank(minter);
        sale.mintNFTByReferral(0, expiry, signature);

        vm.expectRevert(abi.encodeWithSelector(NFTSale.InvalidNonce.selector, 1, 0));
        vm.prank(minter);
        sale.mintNFTByReferral(0, expiry, signature);
    }

    function testMintNFTByReferralRejectsExpiredSignature() public {
        uint256 expiry = block.timestamp + 1 hours;
        bytes memory signature = _signReferral(referralSignerPrivateKey, minter, 0, expiry);

        vm.warp(expiry + 1);
        vm.expectRevert(abi.encodeWithSelector(NFTSale.SignatureExpired.selector, expiry, expiry + 1));
        vm.prank(minter);
        sale.mintNFTByReferral(0, expiry, signature);
    }

    function testMintNFTByReferralRejectsWrongSigner() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes memory signature = _signReferral(wrongSignerPrivateKey, minter, 0, expiry);

        vm.expectRevert(NFTSale.InvalidSignature.selector);
        vm.prank(minter);
        sale.mintNFTByReferral(0, expiry, signature);
    }

    function testMintNFTByReferralRejectsWrongChainDomain() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes memory signature =
            _signDigest(referralSignerPrivateKey, _buildDigest(address(sale), minter, 0, expiry, block.chainid + 1));

        vm.expectRevert(NFTSale.InvalidSignature.selector);
        vm.prank(minter);
        sale.mintNFTByReferral(0, expiry, signature);
    }

    function testMintNFTByReferralRejectsWrongVerifyingContractDomain() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes memory signature =
            _signDigest(referralSignerPrivateKey, _buildDigest(address(0xBEEF), minter, 0, expiry, block.chainid));

        vm.expectRevert(NFTSale.InvalidSignature.selector);
        vm.prank(minter);
        sale.mintNFTByReferral(0, expiry, signature);
    }

    function testSameAddressCanHoldPurchasedAndReferralNFT() public {
        usdt.mint(minter, sale.PURCHASE_PRICE());

        vm.startPrank(minter);
        usdt.approve(address(sale), sale.PURCHASE_PRICE());
        uint256 purchasedTokenId = sale.buyNFT();
        bytes memory signature =
            _signReferral(referralSignerPrivateKey, minter, sale.referralNonces(minter), block.timestamp + 1 days);
        uint256 referralTokenId =
            sale.mintNFTByReferral(sale.referralNonces(minter), block.timestamp + 1 days, signature);
        vm.stopPrank();

        assertEq(purchasedTokenId, 1);
        assertEq(referralTokenId, 2);
        assertTrue(founderNFT.isPurchasedNFT(purchasedTokenId));
        assertFalse(founderNFT.isPurchasedNFT(referralTokenId));
        assertEq(founderNFT.ownerOf(purchasedTokenId), minter);
        assertEq(founderNFT.ownerOf(referralTokenId), minter);
    }

    function testSameAddressCanMintMultipleReferralNFTsWithSequentialNonces() public {
        uint256 expiry = block.timestamp + 1 days;
        bytes memory firstSignature = _signReferral(referralSignerPrivateKey, minter, 0, expiry);
        bytes memory secondSignature = _signReferral(referralSignerPrivateKey, minter, 1, expiry);

        vm.startPrank(minter);
        uint256 firstTokenId = sale.mintNFTByReferral(0, expiry, firstSignature);
        uint256 secondTokenId = sale.mintNFTByReferral(1, expiry, secondSignature);
        vm.stopPrank();

        assertEq(firstTokenId, 1);
        assertEq(secondTokenId, 2);
        assertEq(founderNFT.referralMinted(), 2);
        assertEq(sale.referralNonces(minter), 2);
    }

    function testReferralMintHasNoFormerSeventyCap() public {
        uint256 expiry = block.timestamp + 1 days;

        for (uint256 index = 0; index < 71; index++) {
            address currentRecipient = address(uint160(index + 0x2000));
            bytes memory signature = _signReferral(referralSignerPrivateKey, currentRecipient, 0, expiry);
            vm.prank(currentRecipient);
            sale.mintNFTByReferral(0, expiry, signature);
        }

        assertEq(founderNFT.referralMinted(), 71);
    }

    function _signReferral(uint256 signerPrivateKey, address recipient, uint256 nonce, uint256 expiry)
        private
        view
        returns (bytes memory)
    {
        return _signDigest(signerPrivateKey, sale.hashReferralMint(recipient, nonce, expiry));
    }

    function _signDigest(uint256 signerPrivateKey, bytes32 digest) private pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _buildDigest(address verifyingContract, address recipient, uint256 nonce, uint256 expiry, uint256 chainId)
        private
        pure
        returns (bytes32)
    {
        bytes32 domainSeparator =
            keccak256(abi.encode(EIP712_DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH, chainId, verifyingContract));
        bytes32 structHash = keccak256(abi.encode(REFERRAL_MINT_TYPEHASH, recipient, nonce, expiry));

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}
