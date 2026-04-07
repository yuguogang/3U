import { Prisma } from '@/db';
import {
  NftEligibilityStatus,
  NftReferralGrantSource,
} from '3u-aura-common';
import { NftEligibilityApplicationService } from './nft-eligibility-application.service';
import { NftEligibilityPolicyEngine } from '../engines/nft-eligibility-policy.engine';
import type {
  NftEligibilityRepository,
  ReferralGrantSummary,
} from '../repositories/nft-eligibility.repository';

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

  const createGrantSummary = (
    overrides: Partial<ReferralGrantSummary> = {},
  ): ReferralGrantSummary => ({
    approvedGrantCount: 0,
    claimableMintCount: 0,
    expiredGrantCount: 0,
    latestActiveGrant: null,
    latestGrant: null,
    latestMintedGrant: null,
    latestRejectedGrant: null,
    mintedReferralCount: 0,
    signedGrantCount: 0,
    ...overrides,
  });

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
      approvedAt: data.approvedAt ?? null,
      approvedByWallet: data.approvedByWallet ?? null,
      decisionReason: data.decisionReason ?? null,
      rejectedAt: data.rejectedAt ?? null,
      rejectedByWallet: data.rejectedByWallet ?? null,
      signedNonce: null,
      signedPayloadHash: null,
      signedAt: data.signedAt ?? null,
      expiresAt: data.expiresAt ?? null,
      mintedTokenId: data.mintedTokenId ?? null,
      mintedTxHash: null,
      mintedTxHashKey: null,
      mintedAt: data.mintedAt ?? null,
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
      markApproved: jest.fn() as jest.MockedFunction<
        NftEligibilityRepository['markApproved']
      >,
      markRejected: jest.fn() as jest.MockedFunction<
        NftEligibilityRepository['markRejected']
      >,
      summarizeGrantsForUser: jest.fn() as jest.MockedFunction<
        NftEligibilityRepository['summarizeGrantsForUser']
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
    nftEligibilityRepository.summarizeGrantsForUser.mockResolvedValue(
      createGrantSummary(),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({
      walletAddress,
    });

    expect(result.status).toBe(NftEligibilityStatus.INELIGIBLE);
    expect(result.claimableMintCount).toBe(0);
    expect(result.mintedReferralCount).toBe(0);
  });

  it('returns PENDING_APPROVAL when thresholds are met but no grants exist yet', async () => {
    const { nftEligibilityRepository, service } = createService();
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue(
      createLookupResult({
        nftEligibility: null,
        smallLegVolume: new Prisma.Decimal('6000000000'),
        totalCheckinCount: 30,
      }),
    );
    nftEligibilityRepository.summarizeGrantsForUser.mockResolvedValue(
      createGrantSummary(),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({
      walletAddress,
    });

    expect(result.status).toBe(NftEligibilityStatus.PENDING_APPROVAL);
    expect(result.claimableMintCount).toBe(0);
  });

  it('surfaces outstanding grant counts as APPROVED summary state', async () => {
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
        smallLegVolume: new Prisma.Decimal('0'),
        totalCheckinCount: 0,
      }),
    );
    nftEligibilityRepository.summarizeGrantsForUser.mockResolvedValue(
      createGrantSummary({
        approvedGrantCount: 2,
        claimableMintCount: 2,
        latestActiveGrant: {
          approvedAt,
          approvedByWallet: '0x2222222222222222222222222222222222222222',
          createdAt: approvedAt,
          decisionReason: 'verified by admin',
          expiresAt: null,
          mintedAt: null,
          mintedTokenId: null,
          rejectedAt: null,
          rejectedByWallet: null,
          signedAt: null,
          status: 'APPROVED' as never,
        },
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({
      walletAddress,
    });

    expect(result.status).toBe(NftEligibilityStatus.APPROVED);
    expect(result.claimableMintCount).toBe(2);
    expect(result.approvedAt).toEqual(approvedAt);
  });

  it('gifts an additional referral grant for a non-qualified user', async () => {
    const { nftEligibilityRepository, service } = createService();
    nftEligibilityRepository.findCurrentByUser.mockResolvedValue(
      createLookupResult({
        nftEligibility: null,
        smallLegVolume: new Prisma.Decimal('0'),
        totalCheckinCount: 0,
      }),
    );
    nftEligibilityRepository.summarizeGrantsForUser
      .mockResolvedValueOnce(createGrantSummary())
      .mockResolvedValueOnce(
        createGrantSummary({
          approvedGrantCount: 1,
          claimableMintCount: 1,
        }),
      );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );
    nftEligibilityRepository.markApproved.mockResolvedValue({} as never);

    const result = await service.giftReferralMintEligibility({
      decisionReason: 'manual gift',
      operatorWallet: '0x2222222222222222222222222222222222222222',
      userId: 'user_1',
    });

    expect(result.status).toBe(NftEligibilityStatus.APPROVED);
    expect(result.claimableMintCount).toBe(1);
    expect(nftEligibilityRepository.markApproved).toHaveBeenCalledWith({
      decisionReason: 'manual gift',
      operatorWallet: '0x2222222222222222222222222222222222222222',
      source: NftReferralGrantSource.MANUAL_GIFT,
      userId: 'user_1',
    });
  });

  it('preserves SIGNED status while there is a signed outstanding grant', async () => {
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
    nftEligibilityRepository.summarizeGrantsForUser.mockResolvedValue(
      createGrantSummary({
        claimableMintCount: 1,
        latestActiveGrant: {
          approvedAt: new Date('2026-03-11T11:55:00.000Z'),
          approvedByWallet: '0x2222222222222222222222222222222222222222',
          createdAt: new Date('2026-03-11T11:55:00.000Z'),
          decisionReason: 'manual sign ready',
          expiresAt,
          mintedAt: null,
          mintedTokenId: null,
          rejectedAt: null,
          rejectedByWallet: null,
          signedAt: new Date('2026-03-11T12:00:00.000Z'),
          status: 'SIGNED' as never,
        },
        signedGrantCount: 1,
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({ walletAddress });

    expect(result.status).toBe(NftEligibilityStatus.SIGNED);
    expect(result.claimableMintCount).toBe(1);
    expect(result.signedAt).toEqual(new Date('2026-03-11T12:00:00.000Z'));
  });

  it('returns MINTED after a referral mint when no active grants remain', async () => {
    const { nftEligibilityRepository, service } = createService();
    const mintedAt = new Date('2026-03-11T12:30:00.000Z');
    nftEligibilityRepository.findCurrentByWallet.mockResolvedValue(
      createLookupResult({
        nftEligibility: {
          approvedAt: new Date('2026-03-11T12:00:00.000Z'),
          decisionReason: 'qualified approval',
          mintedAt,
          mintedTokenId: BigInt(1),
          status: NftEligibilityStatus.PENDING_APPROVAL,
        },
        smallLegVolume: new Prisma.Decimal('6000000000'),
        totalCheckinCount: 30,
      }),
    );
    nftEligibilityRepository.summarizeGrantsForUser.mockResolvedValue(
      createGrantSummary({
        latestMintedGrant: {
          approvedAt: new Date('2026-03-11T12:00:00.000Z'),
          approvedByWallet: '0x2222222222222222222222222222222222222222',
          createdAt: new Date('2026-03-11T12:00:00.000Z'),
          decisionReason: 'qualified approval',
          expiresAt: null,
          mintedAt,
          mintedTokenId: BigInt(1),
          rejectedAt: null,
          rejectedByWallet: null,
          signedAt: new Date('2026-03-11T12:20:00.000Z'),
          status: 'MINTED' as never,
        },
        mintedReferralCount: 1,
      }),
    );
    nftEligibilityRepository.upsertEligibilitySnapshot.mockImplementation(
      (data) => Promise.resolve(createUpsertResult(data)),
    );

    const result = await service.getCurrentEligibility({ walletAddress });

    expect(result.status).toBe(NftEligibilityStatus.MINTED);
    expect(result.claimableMintCount).toBe(0);
    expect(result.mintedReferralCount).toBe(1);
    expect(result.mintedTokenId).toBe('1');
  });
});
