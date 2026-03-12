import {
  NftReferralSignatureRequest,
  ReferralMintPayloadBase,
  ReferralMintSignaturePayload,
  ReferralSignaturePreview,
} from '3u-aura-common';
import { Injectable } from '@nestjs/common';
import { getAddress, hashTypedData, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const REFERRAL_MINT_TYPES = {
  ReferralMint: [
    { name: 'recipient', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
  ],
} as const;

const SIGNING_DOMAIN_NAME = '3U AURA Founder NFT Sale';
const SIGNING_DOMAIN_VERSION = '1';

@Injectable()
export class Eip712PayloadEngine {
  buildReferralMintPreview(
    request: NftReferralSignatureRequest,
    nonce: number,
    expiry: number,
  ): ReferralSignaturePreview {
    return this.buildPayloadBase(request, nonce, expiry);
  }

  buildReferralMintDigest(payload: ReferralMintPayloadBase): Hex {
    return hashTypedData(this.buildTypedData(payload));
  }

  async signReferralMintPayload(
    payload: ReferralMintPayloadBase,
    privateKey: string,
  ): Promise<Hex> {
    const account = privateKeyToAccount(this.normalizePrivateKey(privateKey));

    return account.signTypedData(this.buildTypedData(payload));
  }

  getSignerAddress(privateKey: string): string {
    return privateKeyToAccount(this.normalizePrivateKey(privateKey)).address;
  }

  buildReferralMintSignaturePayload(params: {
    payload: ReferralMintPayloadBase;
    issuedAt: string;
    signature: Hex;
  }): ReferralMintSignaturePayload {
    return {
      ...params.payload,
      digest: this.buildReferralMintDigest(params.payload),
      issuedAt: params.issuedAt,
      signature: params.signature,
    };
  }

  private buildPayloadBase(
    request: NftReferralSignatureRequest,
    nonce: number,
    expiry: number,
  ): ReferralMintPayloadBase {
    return {
      recipient: getAddress(request.recipient),
      chainId: request.chainId,
      contractAddress: getAddress(request.contractAddress!),
      nonce,
      expiry,
      expiresAt: new Date(expiry * 1000).toISOString(),
    };
  }

  private buildTypedData(payload: ReferralMintPayloadBase) {
    return {
      domain: {
        chainId: payload.chainId,
        name: SIGNING_DOMAIN_NAME,
        verifyingContract: getAddress(payload.contractAddress),
        version: SIGNING_DOMAIN_VERSION,
      },
      message: {
        recipient: getAddress(payload.recipient),
        nonce: BigInt(payload.nonce),
        expiry: BigInt(payload.expiry),
      },
      primaryType: 'ReferralMint' as const,
      types: REFERRAL_MINT_TYPES,
    };
  }

  private normalizePrivateKey(privateKey: string): Hex {
    if (privateKey.startsWith('0x')) {
      return privateKey as Hex;
    }

    const normalizedPrivateKey = `0x${privateKey}`;

    return normalizedPrivateKey as Hex;
  }
}
