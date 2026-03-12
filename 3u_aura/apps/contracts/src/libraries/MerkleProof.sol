// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MerkleProof
/// @notice Minimal commutative Merkle proof verification matching the server hash order.
library MerkleProof {
    /// @notice Verifies a proof against a root and leaf.
    function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 index = 0; index < proof.length; index++) {
            computedHash = hashPair(computedHash, proof[index]);
        }

        return computedHash == root;
    }

    /// @notice Hashes two sibling nodes using sorted order.
    function hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        return left <= right ? keccak256(abi.encodePacked(left, right)) : keccak256(abi.encodePacked(right, left));
    }
}
