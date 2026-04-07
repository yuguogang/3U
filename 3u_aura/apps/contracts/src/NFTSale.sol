// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "./access/Ownable.sol";
import {ReentrancyGuard} from "./access/ReentrancyGuard.sol";
import {FounderNFT} from "./FounderNFT.sol";
import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";
import {ECDSA} from "./libraries/ECDSA.sol";

/// @title NFTSale
/// @notice Purchase and referral-signature mint entrypoints for FounderNFT.
contract NFTSale is Ownable, ReentrancyGuard {
    error InvalidSignature();
    error InvalidNonce(uint256 expectedNonce, uint256 providedNonce);
    error SignatureExpired(uint256 expiry, uint256 currentTimestamp);
    error TransferFromFailed();
    error ZeroAddress();

    event FinanceWalletUpdated(address indexed financeWallet);
    event PurchasedNFTBought(
        address indexed buyer, uint256 indexed tokenId, uint256 price, address indexed financeWallet
    );
    event ReferralNFTMinted(address indexed recipient, uint256 indexed tokenId, uint256 nonce, bytes32 digest);
    event ReferralSignerUpdated(address indexed referralSigner);

    /// @notice EIP712 domain name.
    string public constant SIGNING_NAME = "3U AURA Founder NFT Sale";

    /// @notice EIP712 version.
    string public constant SIGNING_VERSION = "1";

    /// @notice Purchased NFT price in USDT atomic units (6 decimals).
    uint256 public constant PURCHASE_PRICE = 1_000e6;

    /// @notice EIP712 domain type hash.
    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    /// @notice EIP712 referral mint message type hash.
    bytes32 public constant REFERRAL_MINT_TYPEHASH =
        keccak256("ReferralMint(address recipient,uint256 nonce,uint256 expiry)");

    /// @notice Founder NFT contract.
    FounderNFT public immutable founderNFT;

    /// @notice Accepted USDT token.
    IERC20Minimal public immutable paymentToken;

    /// @notice Wallet receiving purchased NFT revenue.
    address public financeWallet;

    /// @notice Backend signer for referral mint approvals.
    address public referralSigner;

    /// @notice Current sequential nonce per referral recipient.
    mapping(address => uint256) public referralNonces;

    /// @param initialOwner Initial owner for admin operations.
    /// @param founderNFTAddress FounderNFT contract address.
    /// @param paymentTokenAddress USDT token address.
    /// @param initialFinanceWallet Finance wallet address.
    /// @param initialReferralSigner EIP712 signer address.
    constructor(
        address initialOwner,
        address founderNFTAddress,
        address paymentTokenAddress,
        address initialFinanceWallet,
        address initialReferralSigner
    ) Ownable(initialOwner) {
        if (
            founderNFTAddress == address(0) || paymentTokenAddress == address(0) || initialFinanceWallet == address(0)
                || initialReferralSigner == address(0)
        ) {
            revert ZeroAddress();
        }

        founderNFT = FounderNFT(founderNFTAddress);
        paymentToken = IERC20Minimal(paymentTokenAddress);
        financeWallet = initialFinanceWallet;
        referralSigner = initialReferralSigner;
    }

    /// @notice Updates the finance wallet.
    /// @param newFinanceWallet New finance wallet address.
    function setFinanceWallet(address newFinanceWallet) external onlyOwner {
        if (newFinanceWallet == address(0)) {
            revert ZeroAddress();
        }

        financeWallet = newFinanceWallet;
        emit FinanceWalletUpdated(newFinanceWallet);
    }

    /// @notice Updates the referral signature signer.
    /// @param newReferralSigner New signer address.
    function setReferralSigner(address newReferralSigner) external onlyOwner {
        if (newReferralSigner == address(0)) {
            revert ZeroAddress();
        }

        referralSigner = newReferralSigner;
        emit ReferralSignerUpdated(newReferralSigner);
    }

    /// @notice Buys one purchased founder NFT.
    /// @return tokenId Newly minted purchased NFT id.
    function buyNFT() external nonReentrant returns (uint256 tokenId) {
        bool success = paymentToken.transferFrom(msg.sender, financeWallet, PURCHASE_PRICE);
        if (!success) {
            revert TransferFromFailed();
        }

        tokenId = founderNFT.mintPurchased(msg.sender);
        emit PurchasedNFTBought(msg.sender, tokenId, PURCHASE_PRICE, financeWallet);
    }

    /// @notice Mints one referral founder NFT using an EIP712 backend signature.
    /// @param nonce Sequential nonce expected for `msg.sender`.
    /// @param expiry Signature expiry timestamp.
    /// @param signature Backend signature over the referral mint payload.
    /// @return tokenId Newly minted referral NFT id.
    function mintNFTByReferral(uint256 nonce, uint256 expiry, bytes calldata signature)
        external
        nonReentrant
        returns (uint256 tokenId)
    {
        if (block.timestamp > expiry) {
            revert SignatureExpired(expiry, block.timestamp);
        }

        uint256 currentNonce = referralNonces[msg.sender];
        if (nonce != currentNonce) {
            revert InvalidNonce(currentNonce, nonce);
        }

        bytes32 digest = hashReferralMint(msg.sender, nonce, expiry);
        address recoveredSigner = ECDSA.recover(digest, signature);
        if (recoveredSigner != referralSigner) {
            revert InvalidSignature();
        }

        referralNonces[msg.sender] = currentNonce + 1;
        tokenId = founderNFT.mintReferral(msg.sender);

        emit ReferralNFTMinted(msg.sender, tokenId, nonce, digest);
    }

    /// @notice Returns current purchased/referral/total minted supply.
    function getNFTMintStats()
        external
        view
        returns (uint256 purchasedMinted, uint256 referralMinted, uint256 totalMinted)
    {
        purchasedMinted = founderNFT.purchasedMinted();
        referralMinted = founderNFT.referralMinted();
        totalMinted = founderNFT.totalSupply();
    }

    /// @notice Computes the current EIP712 domain separator.
    function domainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(SIGNING_NAME)),
                keccak256(bytes(SIGNING_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    /// @notice Computes the referral mint digest used for signing and replay protection.
    /// @param recipient Referral NFT recipient.
    /// @param nonce Sequential nonce for `recipient`.
    /// @param expiry Signature expiry timestamp.
    function hashReferralMint(address recipient, uint256 nonce, uint256 expiry) public view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(REFERRAL_MINT_TYPEHASH, recipient, nonce, expiry));

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }
}
