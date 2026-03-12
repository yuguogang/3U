// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {Ownable} from "../src/access/Ownable.sol";
import {MerkleClaim} from "../src/MerkleClaim.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";

contract MerkleClaimTest is Test {
    using stdJson for string;

    MerkleClaim private merkleClaim;
    MockUSDT private usdt;

    address private owner = makeAddr("owner");
    address private publisher = makeAddr("publisher");
    address private outsider = makeAddr("outsider");

    string private fixtureJson;

    function setUp() public {
        string memory root = vm.projectRoot();

        usdt = new MockUSDT();
        merkleClaim = new MerkleClaim(owner, address(usdt));

        vm.prank(owner);
        merkleClaim.setRootPublisher(publisher);

        fixtureJson = vm.readFile(string.concat(root, "/test/fixtures/weekly-merkle-golden-sample.local.json"));
    }

    function testClaimWithGoldenSampleSucceeds() public {
        uint256 epochId = fixtureJson.readUint(".epochId");
        bytes32 merkleRoot = fixtureJson.readBytes32(".merkleRoot");
        address account = fixtureJson.readAddress(".leaves[0].account");
        uint256 index = fixtureJson.readUint(".leaves[0].index");
        uint8 rewardTypeCode = uint8(fixtureJson.readUint(".leaves[0].rewardTypeCode"));
        uint256 amount = fixtureJson.readUint(".leaves[0].amount");
        bytes32[] memory proof = abi.decode(fixtureJson.parseRaw(".leaves[0].proof"), (bytes32[]));

        _fundAndPublish(epochId, merkleRoot, _fixtureTotalAmount());

        vm.prank(account);
        merkleClaim.claim(epochId, index, rewardTypeCode, amount, proof);

        assertEq(usdt.balanceOf(account), amount);
        assertTrue(merkleClaim.isClaimed(epochId, index));
    }

    function testDuplicateClaimReverts() public {
        uint256 epochId = fixtureJson.readUint(".epochId");
        bytes32 merkleRoot = fixtureJson.readBytes32(".merkleRoot");
        address account = fixtureJson.readAddress(".leaves[0].account");
        uint256 index = fixtureJson.readUint(".leaves[0].index");
        uint8 rewardTypeCode = uint8(fixtureJson.readUint(".leaves[0].rewardTypeCode"));
        uint256 amount = fixtureJson.readUint(".leaves[0].amount");
        bytes32[] memory proof = abi.decode(fixtureJson.parseRaw(".leaves[0].proof"), (bytes32[]));

        _fundAndPublish(epochId, merkleRoot, amount);

        vm.prank(account);
        merkleClaim.claim(epochId, index, rewardTypeCode, amount, proof);

        vm.expectRevert(abi.encodeWithSelector(MerkleClaim.AlreadyClaimed.selector, epochId, index));
        vm.prank(account);
        merkleClaim.claim(epochId, index, rewardTypeCode, amount, proof);
    }

    function testWrongProofReverts() public {
        uint256 epochId = fixtureJson.readUint(".epochId");
        bytes32 merkleRoot = fixtureJson.readBytes32(".merkleRoot");
        address account = fixtureJson.readAddress(".leaves[0].account");
        uint256 index = fixtureJson.readUint(".leaves[0].index");
        uint8 rewardTypeCode = uint8(fixtureJson.readUint(".leaves[0].rewardTypeCode"));
        uint256 amount = fixtureJson.readUint(".leaves[0].amount");
        bytes32[] memory wrongProof = abi.decode(fixtureJson.parseRaw(".leaves[1].proof"), (bytes32[]));

        _fundAndPublish(epochId, merkleRoot, amount);

        vm.expectRevert(MerkleClaim.InvalidMerkleProof.selector);
        vm.prank(account);
        merkleClaim.claim(epochId, index, rewardTypeCode, amount, wrongProof);
    }

    function testOnlyOwnerCanUpdatePublisher() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, outsider));
        vm.prank(outsider);
        merkleClaim.setRootPublisher(outsider);
    }

    function testRootIsImmutableOncePublished() public {
        uint256 epochId = fixtureJson.readUint(".epochId");
        bytes32 merkleRoot = fixtureJson.readBytes32(".merkleRoot");

        vm.prank(publisher);
        merkleClaim.publishRoot(epochId, merkleRoot);

        vm.expectRevert(abi.encodeWithSelector(MerkleClaim.EpochRootAlreadyPublished.selector, epochId));
        vm.prank(publisher);
        merkleClaim.publishRoot(epochId, merkleRoot);
    }

    function _fundAndPublish(uint256 epochId, bytes32 merkleRoot, uint256 amount) private {
        usdt.mint(owner, amount);
        vm.startPrank(owner);
        usdt.approve(address(merkleClaim), amount);
        merkleClaim.depositRewards(amount);
        vm.stopPrank();

        vm.prank(publisher);
        merkleClaim.publishRoot(epochId, merkleRoot);
    }

    function _fixtureTotalAmount() private view returns (uint256 totalAmount) {
        totalAmount += fixtureJson.readUint(".leaves[0].amount");
        totalAmount += fixtureJson.readUint(".leaves[1].amount");
        totalAmount += fixtureJson.readUint(".leaves[2].amount");
    }
}
