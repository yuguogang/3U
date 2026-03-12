import { Prisma } from '@/db';
import { NftEligibilityStatus } from '3u-aura-common';
import { NftEligibilityApplicationService } from './nft-eligibility-application.service';
import { NftEligibilityPolicyEngine } from '../engines/nft-eligibility-policy.engine';

describe('NftEligibilityApplicationService', () => {
  const createService = () => {
    const nftEligibilityRepository = {
      findCurrentByUser: jest.fn(),
      findCurrentByWallet: jest.fn(),
      upsertEligibilitySnapshot: jest.fn(),
    };

    const service = new NftEligibilityApplicationService(
      new NftEligibilityPolicyEngine(),
      nftEligibilityRepository as any,
    );

    return {
      nftEligibilityRepository,
      service,
    };
  };

  it('returns INELIGIBLE when thresholds are not met', async () => {
    const { nftEligibilityRepository, service } = createService();
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue({
      id: 'user_1',
      nftEligibility: null,
      profile: {
        hasReferralNft: false,
        smallLegVolume: new Prisma.Decimal('5999999999'),
        totalCheckinCount: 29,
      },
    });
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      async (data: {
        personalCheckinCount: number;
        smallLegVolumeUsdt: Prisma.Decimal;
        status: NftEligibilityStatus;
        userId: string;
      }) => ({
        expiresAt: null,
        mintedTokenId: null,
        ...data,
      }),
    );

    const result = await service.getCurrentEligibility({
      walletAddress: '0x1111111111111111111111111111111111111111',
    });

    expect(result.status).toBe(NftEligibilityStatus.INELIGIBLE);
    expect(result.requiredCheckinCount).toBe(30);
    expect(result.requiredSmallLegUsdt).toBe('6000000000');
  });

  it('preserves SIGNED status while the preview is still valid', async () => {
    const { nftEligibilityRepository, service } = createService();
    const expiresAt = new Date('2026-03-11T12:15:00.000Z');
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue({
      id: 'user_1',
      nftEligibility: {
        expiresAt,
        mintedTokenId: null,
        status: NftEligibilityStatus.SIGNED,
      },
      profile: {
        hasReferralNft: false,
        smallLegVolume: new Prisma.Decimal('6000000000'),
        totalCheckinCount: 30,
      },
    });
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      async (data: {
        personalCheckinCount: number;
        smallLegVolumeUsdt: Prisma.Decimal;
        status: NftEligibilityStatus;
        userId: string;
      }) => ({
        expiresAt,
        mintedTokenId: null,
        ...data,
      }),
    );

    jest.useFakeTimers().setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
    try {
      const result = await service.getCurrentEligibility({
        walletAddress: '0x1111111111111111111111111111111111111111',
      });

      expect(result.status).toBe(NftEligibilityStatus.SIGNED);
      expect(nftEligibilityRepository.upsertEligibilitySnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NftEligibilityStatus.SIGNED,
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
