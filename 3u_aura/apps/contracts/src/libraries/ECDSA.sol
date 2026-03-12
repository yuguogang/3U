// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title ECDSA
/// @notice Minimal signature recovery with malleability checks for EIP712 signatures.
library ECDSA {
    error InvalidSignature();
    error InvalidSignatureLength();

    bytes32 private constant SECP256K1N_DIV_2 = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    /// @notice Recovers the signer for a digest and signature pair.
    /// @param digest EIP712 digest.
    /// @param signature 65-byte `r || s || v` encoded signature.
    function recover(bytes32 digest, bytes memory signature) internal pure returns (address signer) {
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        if (uint256(s) > uint256(SECP256K1N_DIV_2) || (v != 27 && v != 28)) {
            revert InvalidSignature();
        }

        signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) {
            revert InvalidSignature();
        }
    }
}
