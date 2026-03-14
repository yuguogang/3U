// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {FounderNFT} from "../src/FounderNFT.sol";
import {NFTSale} from "../src/NFTSale.sol";

/// @title DeployNFTCore
/// @notice Deploys FounderNFT and NFTSale, wires the sale role, and optionally transfers ownership.
contract DeployNFTCore is Script {
    function run() external returns (FounderNFT founderNFT, NFTSale sale) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address broadcaster = vm.addr(deployerPrivateKey);
        address finalOwner = vm.envOr("OWNER", broadcaster);
        address usdtAddress = vm.envAddress("USDT_ADDRESS");
        address financeWallet = vm.envAddress("FINANCE_WALLET");
        address referralSigner = vm.envAddress("REFERRAL_SIGNER_ADDRESS");
        string memory collectionName = vm.envOr("NFT_NAME", string("3U AURA Founder NFT"));
        string memory collectionSymbol = vm.envOr("NFT_SYMBOL", string("3UAURA"));
        string memory baseURI = vm.envOr("BASE_URI", string(""));

        vm.startBroadcast(deployerPrivateKey);

        founderNFT = new FounderNFT(collectionName, collectionSymbol, broadcaster);
        sale = new NFTSale(
            broadcaster,
            address(founderNFT),
            usdtAddress,
            financeWallet,
            referralSigner
        );

        founderNFT.setSaleContract(address(sale));
        if (bytes(baseURI).length > 0) {
            founderNFT.setBaseURI(baseURI);
        }

        if (finalOwner != broadcaster) {
            founderNFT.transferOwnership(finalOwner);
            sale.transferOwnership(finalOwner);
        }

        vm.stopBroadcast();
    }
}
