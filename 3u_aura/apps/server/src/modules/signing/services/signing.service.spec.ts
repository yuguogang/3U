import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigOptions } from '@/configuration';
import { NftEligibilityStatus } from '3u-aura-common';
import { ConfigService } from '@nestjs/config';
import { recoverAddress, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NftEligibilityApplicationService } from '../../nft-eligibility';
import { NftEligibilityRepository } from '../../nft-eligibility/repositories/nft-eligibility.repository';
import { Eip712PayloadEngine } from '../engines/eip712-payload.engine';
import { SigningNonceRepository } from '../repositories/signing-nonce.repository';
import { SigningService } from './signing.service';

describe('SigningService', () => {
  const signerPrivateKey =
    '0x000000000000000000000000000000000000000000000000000000000000beef';
  const signerAddress = privateKeyToAccount(signerPrivateKey).address;
  const request = {
    chainId: 97,
    recipient: '0x1111111111111111111111111111111111111111',
  };
  const contractAddress = '0x9999999999999999999999999999999999999999';

  const createService = () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'promotion') {
          return {
            claimChainId: 97,
            nftSaleAddress: contractAddress,
            referralSignerPrivateKey: signerPrivateKey,
            referralSignatureTtlSeconds: 900,
          };
        }

        return undefined;
      }),
    };
    const nftEligibilityApplicationService = {
      getCurrentEligibility: jest.fn(),
    };
    const nftEligibilityRepository = {
      markSignedPayload: jest.fn().mockResolvedValue(undefined),
    };
    const signingNonceRepository = {
      readSigningState: jest.fn().mockResolvedValue({
        nonce: 7,
        referralSigner: signerAddress,
      }),
    };

    const service = new SigningService(
      configService as unknown as ConfigService<ConfigOptions>,
      new Eip712PayloadEngine(),
      nftEligibilityApplicationService as unknown as NftEligibilityApplicationService,
      nftEligibilityRepository as unknown as NftEligibilityRepository,
      signingNonceRepository as unknown as SigningNonceRepository,
    );

    return {
      configService,
      nftEligibilityApplicationService,
      nftEligibilityRepository,
      service,
      signingNonceRepository,
    };
  };

  it('creates a referral mint preview with the configured contract and chain nonce', async () => {
    const {
      nftEligibilityApplicationService,
      nftEligibilityRepository,
      service,
      signingNonceRepository,
    } = createService();
    nftEligibilityApplicationService.getCurrentEligibility.mockResolvedValue({
      status: NftEligibilityStatus.APPROVED,
      userId: 'user_1',
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-03-12T12:00:00.000Z'));
    try {
      const result = await service.prepareReferralMintPayload(request);

      expect(signingNonceRepository.readSigningState).toHaveBeenCalledWith({
        contractAddress,
        recipient: request.recipient,
      });
      expect(result).toEqual({
        chainId: 97,
        contractAddress,
        expiry: 1773317700,
        expiresAt: '2026-03-12T12:15:00.000Z',
        nonce: 7,
        recipient: request.recipient,
      });
      expect(nftEligibilityRepository.markSignedPayload).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('issues a real referral mint signature aligned to the on-chain nonce', async () => {
    const {
      nftEligibilityApplicationService,
      nftEligibilityRepository,
      service,
    } = createService();
    nftEligibilityApplicationService.getCurrentEligibility.mockResolvedValue({
      status: NftEligibilityStatus.APPROVED,
      userId: 'user_1',
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-03-12T12:00:00.000Z'));
    try {
      const result = await service.issueReferralMintSignature(request);

      expect(result.contractAddress).toBe(contractAddress);
      expect(result.digest).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(
        await recoverAddress({
          hash: result.digest as Hex,
          signature: result.signature as Hex,
        }),
      ).toBe(signerAddress);
      expect(nftEligibilityRepository.markSignedPayload).toHaveBeenCalledWith({
        expiresAt: new Date('2026-03-12T12:15:00.000Z'),
        payloadHash: result.digest,
        signedNonce: 7,
        userId: 'user_1',
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects signing when the user is not eligible', async () => {
    const {
      nftEligibilityApplicationService,
      service,
      signingNonceRepository,
    } = createService();
    nftEligibilityApplicationService.getCurrentEligibility.mockResolvedValue({
      status: NftEligibilityStatus.PENDING_APPROVAL,
      userId: 'user_1',
    });

    await expect(
      service.prepareReferralMintPayload(request),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(signingNonceRepository.readSigningState).not.toHaveBeenCalled();
  });

  it('rejects requests that exceed the configured signature ttl window', async () => {
    const {
      nftEligibilityApplicationService,
      service,
      signingNonceRepository,
    } = createService();
    nftEligibilityApplicationService.getCurrentEligibility.mockResolvedValue({
      status: NftEligibilityStatus.APPROVED,
      userId: 'user_1',
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-03-12T12:00:00.000Z'));
    try {
      await expect(
        service.prepareReferralMintPayload({
          ...request,
          expiresAt: '2026-03-12T12:30:01.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(signingNonceRepository.readSigningState).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects signing when the configured key does not match the on-chain signer', async () => {
    const {
      nftEligibilityApplicationService,
      service,
      signingNonceRepository,
    } = createService();
    nftEligibilityApplicationService.getCurrentEligibility.mockResolvedValue({
      status: NftEligibilityStatus.APPROVED,
      userId: 'user_1',
    });
    signingNonceRepository.readSigningState.mockResolvedValue({
      nonce: 7,
      referralSigner: '0x2222222222222222222222222222222222222222',
    });

    await expect(
      service.issueReferralMintSignature(request),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
