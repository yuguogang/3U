// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

/// @title DeployMockUSDT
/// @notice Deploys a standalone MockUSDT token for isolated UAT environments.
contract DeployMockUSDT is Script {
    function run() external returns (MockUSDT token) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        token = new MockUSDT();
        vm.stopBroadcast();
    }
}
