// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721A} from "ERC721A/contracts/ERC721A.sol";
import {Ownable} from "./access/Ownable.sol";

/// @title FounderNFT
/// @notice ERC721A founder NFT with separate purchased/referral supply accounting.
contract FounderNFT is ERC721A, Ownable {
    error ReferralAlreadyMinted(address recipient);
    error ReferralSupplySoldOut();
    error TotalSupplySoldOut();
    error UnauthorizedMinter(address caller);
    error ZeroAddress();

    event BaseURIUpdated(string newBaseURI);
    event PurchasedMinted(address indexed recipient, uint256 indexed tokenId);
    event ReferralMinted(address indexed recipient, uint256 indexed tokenId);
    event SaleContractUpdated(address indexed saleContract);

    /// @notice Maximum founder NFT supply across purchased and referral mints.
    uint256 public constant MAX_TOTAL_SUPPLY = 100;

    /// @notice Maximum referral NFT supply.
    uint256 public constant MAX_REFERRAL_SUPPLY = 70;

    /// @notice Authorized sale contract that can mint NFTs.
    address public saleContract;

    /// @notice Count of purchased NFTs minted on-chain.
    uint256 public purchasedMinted;

    /// @notice Count of referral NFTs minted on-chain.
    uint256 public referralMinted;

    /// @notice Token-level purchased marker required by the project spec.
    mapping(uint256 => bool) public isPurchasedNFT;

    /// @notice One-per-address referral mint tracking.
    mapping(address => bool) public hasReferralNFT;

    string private baseTokenURI;

    modifier onlySaleContract() {
        if (msg.sender != saleContract) {
            revert UnauthorizedMinter(msg.sender);
        }
        _;
    }

    /// @param name_ ERC721 collection name.
    /// @param symbol_ ERC721 collection symbol.
    /// @param initialOwner Initial owner with admin privileges.
    constructor(string memory name_, string memory symbol_, address initialOwner)
        ERC721A(name_, symbol_)
        Ownable(initialOwner)
    {}

    /// @notice Sets the authorized sale contract.
    /// @param newSaleContract Authorized sale contract.
    function setSaleContract(address newSaleContract) external onlyOwner {
        if (newSaleContract == address(0)) {
            revert ZeroAddress();
        }

        saleContract = newSaleContract;
        emit SaleContractUpdated(newSaleContract);
    }

    /// @notice Sets the collection base URI.
    /// @param newBaseURI New base URI.
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /// @notice Mints one purchased NFT to a recipient.
    /// @param recipient Recipient address.
    /// @return tokenId Newly minted token id.
    function mintPurchased(address recipient) external onlySaleContract returns (uint256 tokenId) {
        if (recipient == address(0)) {
            revert ZeroAddress();
        }
        if (totalSupply() >= MAX_TOTAL_SUPPLY) {
            revert TotalSupplySoldOut();
        }

        tokenId = _nextTokenId();
        purchasedMinted += 1;
        isPurchasedNFT[tokenId] = true;
        _safeMint(recipient, 1);

        emit PurchasedMinted(recipient, tokenId);
    }

    /// @notice Mints one referral NFT to a recipient.
    /// @param recipient Recipient address.
    /// @return tokenId Newly minted token id.
    function mintReferral(address recipient) external onlySaleContract returns (uint256 tokenId) {
        if (recipient == address(0)) {
            revert ZeroAddress();
        }
        if (hasReferralNFT[recipient]) {
            revert ReferralAlreadyMinted(recipient);
        }
        if (referralMinted >= MAX_REFERRAL_SUPPLY) {
            revert ReferralSupplySoldOut();
        }
        if (totalSupply() >= MAX_TOTAL_SUPPLY) {
            revert TotalSupplySoldOut();
        }

        tokenId = _nextTokenId();
        referralMinted += 1;
        hasReferralNFT[recipient] = true;
        _safeMint(recipient, 1);

        emit ReferralMinted(recipient, tokenId);
    }

    /// @notice Remaining capacity available to purchased mints under the total supply cap.
    function remainingPurchasedSupply() external view returns (uint256) {
        return MAX_TOTAL_SUPPLY - totalSupply();
    }

    /// @notice Remaining referral NFT supply.
    function remainingReferralSupply() external view returns (uint256) {
        return MAX_REFERRAL_SUPPLY - referralMinted;
    }

    /// @notice Remaining total NFT supply.
    function remainingTotalSupply() external view returns (uint256) {
        return MAX_TOTAL_SUPPLY - totalSupply();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }
}
