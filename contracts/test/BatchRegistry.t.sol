// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BatchRegistry} from "../src/BatchRegistry.sol";

interface Vm {
    function prank(address msgSender) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata revertData) external;
}

contract BatchRegistryTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    BatchRegistry internal registry;
    address internal producer = address(0xA11CE);
    address internal consumer1 = address(0xB0B);
    address internal consumer2 = address(0xCAFE);

    function setUp() public {
        registry = new BatchRegistry();
    }

    function testCreateAndVerifyBatch() public {
        setUp();
        string memory secret = "a8f9c1e0";
        bytes32 secretHash = registry.hashSecret(secret);
        string memory cid = "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

        vm.prank(producer);
        uint256 batchId = registry.createBatch(cid, secretHash);

        require(batchId == 1001, "Expected initial batchId 1001");

        BatchRegistry.VerificationResult memory res = registry.verifyBatch(batchId, secret);
        require(res.isAuthentic, "Should be authentic");
        require(!res.alreadyClaimed, "Should not be claimed yet");
        require(res.batch.producer == producer, "Producer mismatch");
        require(
            keccak256(bytes(res.batch.ipfsCID)) == keccak256(bytes(cid)),
            "CID mismatch"
        );
    }

    function testSingleClaimBlocksDuplicateScans() public {
        setUp();
        string memory secret = "a8f9c1e0";
        bytes32 secretHash = registry.hashSecret(secret);

        vm.warp(1700000000);
        vm.prank(producer);
        uint256 batchId = registry.createBatch("QmCoffeeBatch101", secretHash);

        // First consumer scan claims the genuine product
        vm.warp(1700003600);
        vm.prank(consumer1);
        registry.claimBatch(batchId, secret);

        // Verify state updated to claimed
        BatchRegistry.VerificationResult memory afterClaim = registry.verifyBatch(batchId, secret);
        require(afterClaim.isAuthentic, "Still authentic batch");
        require(afterClaim.alreadyClaimed, "Must be marked as alreadyClaimed");
        require(afterClaim.claimedAt == 1700003600, "Claim timestamp mismatch");

        // Second scan of cloned QR code must revert on claim
        vm.warp(1700007200);
        vm.prank(consumer2);
        vm.expectRevert(
            abi.encodeWithSelector(BatchRegistry.AlreadyClaimed.selector, batchId, 1700003600)
        );
        registry.claimBatch(batchId, secret);
    }

    function testSerializedLabelSheetUnits() public {
        setUp();
        string memory unit1Secret = "jar-01-secret";
        string memory unit2Secret = "jar-02-secret";
        bytes32 unit1Hash = registry.hashSecret(unit1Secret);
        bytes32 unit2Hash = registry.hashSecret(unit2Secret);

        bytes32[] memory unitHashes = new bytes32[](2);
        unitHashes[0] = unit1Hash;
        unitHashes[1] = unit2Hash;

        vm.prank(producer);
        uint256 batchId = registry.createSerializedBatch("QmHoneyBatch202", unit1Hash, unitHashes);

        // Claim jar 1
        vm.warp(1700010000);
        vm.prank(consumer1);
        registry.claimBatch(batchId, unit1Secret);

        // Jar 1 is claimed, Jar 2 is still unclaimed
        BatchRegistry.VerificationResult memory res1 = registry.verifyBatch(batchId, unit1Secret);
        BatchRegistry.VerificationResult memory res2 = registry.verifyBatch(batchId, unit2Secret);

        require(res1.isAuthentic && res1.alreadyClaimed, "Jar 1 should be claimed");
        require(res2.isAuthentic && !res2.alreadyClaimed, "Jar 2 should still be unclaimed");
        require(res2.totalUnits == 2 && res2.claimedUnits == 1, "Unit count mismatch");
    }
}

