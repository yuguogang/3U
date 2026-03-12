import { concat, encodeAbiParameters, keccak256, toHex, type Hex } from 'viem';
import { recoverAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Eip712PayloadEngine } from './eip712-payload.engine';

const EIP712_DOMAIN_TYPEHASH = keccak256(
  toHex(
    'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
  ),
);
const REFERRAL_MINT_TYPEHASH = keccak256(
  toHex('ReferralMint(address recipient,uint256 nonce,uint256 expiry)'),
);
const NAME_HASH = keccak256(toHex('3U AURA Founder NFT Sale'));
const VERSION_HASH = keccak256(toHex('1'));

describe('Eip712PayloadEngine', () => {
  const engine = new Eip712PayloadEngine();
  const privateKey =
    '0x000000000000000000000000000000000000000000000000000000000000beef';
  const signerAddress = privateKeyToAccount(privateKey).address;
  const payload = {
    recipient: '0x1111111111111111111111111111111111111111',
    chainId: 56,
    contractAddress: '0x9999999999999999999999999999999999999999',
    nonce: 7,
    expiry: 1773317700,
    expiresAt: '2026-03-12T12:15:00.000Z',
  } as const;

  it('builds the same digest as the canonical EIP712 formula', () => {
    const domainSeparator = keccak256(
      encodeAbiParameters(
        [
          { type: 'bytes32' },
          { type: 'bytes32' },
          { type: 'bytes32' },
          { type: 'uint256' },
          { type: 'address' },
        ],
        [
          EIP712_DOMAIN_TYPEHASH,
          NAME_HASH,
          VERSION_HASH,
          BigInt(payload.chainId),
          payload.contractAddress,
        ],
      ),
    );
    const structHash = keccak256(
      encodeAbiParameters(
        [
          { type: 'bytes32' },
          { type: 'address' },
          { type: 'uint256' },
          { type: 'uint256' },
        ],
        [
          REFERRAL_MINT_TYPEHASH,
          payload.recipient,
          BigInt(payload.nonce),
          BigInt(payload.expiry),
        ],
      ),
    );
    const expectedDigest = keccak256(
      concat(['0x1901', domainSeparator, structHash] as Hex[]),
    );

    expect(engine.buildReferralMintDigest(payload)).toBe(expectedDigest);
  });

  it('signs referral payloads that recover to the configured signer', async () => {
    const digest = engine.buildReferralMintDigest(payload);
    const signature = await engine.signReferralMintPayload(payload, privateKey);

    expect(await recoverAddress({ hash: digest, signature })).toBe(
      signerAddress,
    );
    expect(engine.getSignerAddress(privateKey)).toBe(signerAddress);
  });
});
