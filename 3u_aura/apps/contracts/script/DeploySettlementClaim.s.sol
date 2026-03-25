// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {MerkleClaim} from "../src/MerkleClaim.sol";
import {Settlement} from "../src/Settlement.sol";

/// @title DeploySettlementClaim
/// @notice Deploys Settlement and MerkleClaim and wires their publisher roles.
contract DeploySettlementClaim is Script {
    function run() external returns (Settlement settlement, MerkleClaim merkleClaim) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address broadcaster = vm.addr(deployerPrivateKey);
        address finalOwner = vm.envOr("OWNER", broadcaster);
        address founderNFTAddress = vm.envAddress("FOUNDER_NFT_ADDRESS");
        address rewardFunder = vm.envOr("REWARD_FUNDER", broadcaster);
        address usdtAddress = vm.envAddress("USDT_ADDRESS");
        address settlementPublisher = vm.envOr("SETTLEMENT_PUBLISHER", broadcaster);
        address rootPublisher = vm.envOr("ROOT_PUBLISHER", broadcaster);
        uint256 maxSubsidyEpochs = vm.envOr("MAX_SUBSIDY_EPOCHS", uint256(12));

        vm.startBroadcast(deployerPrivateKey);

        settlement = new Settlement(broadcaster, founderNFTAddress, usdtAddress, maxSubsidyEpochs);
        merkleClaim = new MerkleClaim(broadcaster, usdtAddress, rewardFunder);

        settlement.setEpochPublisher(settlementPublisher);
        merkleClaim.setRootPublisher(rootPublisher);

        if (finalOwner != broadcaster) {
            settlement.transferOwnership(finalOwner);
            merkleClaim.transferOwnership(finalOwner);
        }

        vm.stopBroadcast();
    }
}
