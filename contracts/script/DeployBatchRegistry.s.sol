// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BatchRegistry} from "../src/BatchRegistry.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployBatchRegistry {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (BatchRegistry deployed) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new BatchRegistry();
        vm.stopBroadcast();
    }
}