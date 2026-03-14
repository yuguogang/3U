// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

/// @title MintMockUSDT
/// @notice Mints MockUSDT to a target wallet for isolated UAT funding flows.
contract MintMockUSDT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("USDT_ADDRESS");
        address recipient = vm.envAddress("MINT_RECIPIENT");
        uint256 amount = vm.envUint("MINT_AMOUNT");

        vm.startBroadcast(deployerPrivateKey);
        MockUSDT(tokenAddress).mint(recipient, amount);
        vm.stopBroadcast();
    }
}
