import { Prisma } from '@/db';
import { NftEligibilityStatus } from '3u-aura-common';
import { NftEligibilityApplicationService } from './nft-eligibility-application.service';
import { NftEligibilityPolicyEngine } from '../engines/nft-eligibility-policy.engine';
import type { NftEligibilityRepository } from '../repositories/nft-eligibility.repository';

describe('NftEligibilityApplicationService', () => {
  type FindCurrentByWalletResult = NonNullable<
    Awaited<ReturnType<NftEligibilityRepository['findCurrentByWallet']>>
  >;
  type EligibilitySnapshot = NonNullable<
    FindCurrentByWalletResult['nftEligibility']
  >;
  type UpsertEligibilityInput = Parameters<
    NftEligibilityRepository['upsertEligibilitySnapshot']
  >[0];
  type UpsertEligibilityResult = Awaited<
    ReturnType<NftEligibilityRepository['upsertEligibilitySnapshot']>
  >;

  const walletAddress = '0x1111111111111111111111111111111111111111';

  const createEligibilitySnapshot = (
    overrides: Partial<EligibilitySnapshot>,
  ): EligibilitySnapshot =>
    ({
      id: 'eligibility_1',
      userId: 'user_1',
      snapshotEpochId: null,
      personalCheckinCount: 0,
      smallLegVolumeUsdt: new Prisma.Decimal('0'),
      requiredCheckinCount: 30,
      requiredSmallLegUsdt: new Prisma.Decimal('6000000000'),
      status: NftEligibilityStatus.INELIGIBLE,
      approvedAt: null,
      approvedByWallet: null,
      decisionReason: null,
      rejectedAt: null,
      rejectedByWallet: null,
      signedNonce: null,
      signedPayloadHash: null,
      signedAt: null,
      expiresAt: null,
      mintedTokenId: null,
      mintedTxHash: null,
      mintedTxHashKey: null,
      mintedAt: null,
      remark: null,
      createdAt: new Date('2026-03-11T00:00:00.000Z'),
      updatedAt: new Date('2026-03-11T00:00:00.000Z'),
      ...overrides,
    }) as EligibilitySnapshot;

  const createLookupResult = (params: {
    nftEligibility?: Partial<EligibilitySnapshot> | null;
    smallLegVolume: Prisma.Decimal;
    totalCheckinCount: number;
  }): FindCurrentByWalletResult =>
    ({
      id: 'user_1',
      walletAddress,
      profile: {
        hasReferralNft: false,
        smallLegVolume: params.smallLegVolume,
        totalCheckinCount: params.totalCheckinCount,
      },
      nftEligibility:
        params.nftEligibility === null || params.nftEligibility === undefined
          ? null
          : createEligibilitySnapshot(params.nftEligibility),
    }) as FindCurrentByWalletResult;

  const createUpsertResult = (
    data: UpsertEligibilityInput,
    overrides: Partial<UpsertEligibilityResult> = {},
  ): UpsertEligibilityResult =>
    ({
      id: 'eligibility_1',
      userId: data.userId,
      snapshotEpochId: null,
      personalCheckinCount: data.personalCheckinCount,
      smallLegVolumeUsdt: data.smallLegVolumeUsdt,
      requiredCheckinCount: 30,
      requiredSmallLegUsdt: new Prisma.Decimal('6000000000'),
      status: data.status,
      approvedAt: null,
      approvedByWallet: null,
      decisionReason: null,
      rejectedAt: null,
      rejectedByWallet: null,
      signedNonce: null,
      signedPayloadHash: null,
      signedAt: null,
      expiresAt: null,
      mintedTokenId: null,
      mintedTxHash: null,
      mintedTxHashKey: null,
      mintedAt: null,
      remark: null,
      createdAt: new Date('2026-03-11T00:00:00.000Z'),
      updatedAt: new Date('2026-03-11T00:00:00.000Z'),
      ...overrides,
    }) as UpsertEligibilityResult;

  const createService = () => {
    const nftEligibilityRepository = {
      findCurrentByUser: jest.fn() as jest.MockedFunction<
        NftEligibilityRepository['findCurrentByUser']
      >,
      findCurrentByWallet: jest.fn() as jest.MockedFunction<
        NftEligibilityRepository['findCurrentByWallet']
      >,
      upsertEligibilitySnapshot: jest.fn() as jest.MockedFunction<
        NftEligibilityRepository['upsertEligibilitySnapshot']
      >,
    };

    const service = new NftEligibilityApplicationService(
      new NftEligibilityPolicyEngine(),
      nftEligibilityRepository as unknown as NftEligibilityRepository,
    );

    return {
      nftEligibilityRepository,
      service,
    };
  };

  it('returns INELIGIBLE when thresholds are not met', async () => {
    const { nftEligibilityRepository, service } = createService();
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue(
      createLookupResult({
        nftEligibility: null,
        smallLegVolume: new Prisma.Decimal('5999999999'),
        totalCheckinCount: 29,
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({
      walletAddress,
    });

    expect(result.status).toBe(NftEligibilityStatus.INELIGIBLE);
    expect(result.requiredCheckinCount).toBe(30);
    expect(result.requiredSmallLegUsdt).toBe('6000000000');
  });

  it('returns PENDING_APPROVAL when thresholds are met but no approval exists yet', async () => {
    const { nftEligibilityRepository, service } = createService();
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue(
      createLookupResult({
        nftEligibility: null,
        smallLegVolume: new Prisma.Decimal('6000000000'),
        totalCheckinCount: 30,
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({
      walletAddress,
    });

    expect(result.status).toBe(NftEligibilityStatus.PENDING_APPROVAL);
  });

  it('preserves APPROVED status while the user remains qualified', async () => {
    const { nftEligibilityRepository, service } = createService();
    const approvedAt = new Date('2026-03-11T12:15:00.000Z');
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue(
      createLookupResult({
        nftEligibility: {
          approvedAt,
          approvedByWallet: '0x2222222222222222222222222222222222222222',
          decisionReason: 'verified by admin',
          status: NftEligibilityStatus.APPROVED,
        },
        smallLegVolume: new Prisma.Decimal('7000000000'),
        totalCheckinCount: 35,
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) =>
        Promise.resolve(
          createUpsertResult(data, {
            approvedAt,
            approvedByWallet: '0x2222222222222222222222222222222222222222',
            decisionReason: 'verified by admin',
          }),
        ),
    );

    const result = await service.getCurrentEligibility({
      walletAddress,
    });

    expect(result.status).toBe(NftEligibilityStatus.APPROVED);
    expect(result.approvedAt).toEqual(approvedAt);
    expect(result.decisionReason).toBe('verified by admin');
  });

  it('preserves SIGNED status while the preview is still valid', async () => {
    const { nftEligibilityRepository, service } = createService();
    const expiresAt = new Date('2026-03-11T12:15:00.000Z');
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue(
      createLookupResult({
        nftEligibility: {
          expiresAt,
          signedAt: new Date('2026-03-11T12:00:00.000Z'),
          status: NftEligibilityStatus.SIGNED,
        },
        smallLegVolume: new Prisma.Decimal('6000000000'),
        totalCheckinCount: 30,
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) =>
        Promise.resolve(
          createUpsertResult(data, {
            expiresAt,
            signedAt: new Date('2026-03-11T12:00:00.000Z'),
          }),
        ),
    );

    jest.useFakeTimers().setSystemTime(new Date('2026-03-11T12:00:00.000Z'));
    try {
      const result = await service.getCurrentEligibility({
        walletAddress,
      });

      expect(result.status).toBe(NftEligibilityStatus.SIGNED);
      expect(
        nftEligibilityRepository.upsertEligibilitySnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NftEligibilityStatus.SIGNED,
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
