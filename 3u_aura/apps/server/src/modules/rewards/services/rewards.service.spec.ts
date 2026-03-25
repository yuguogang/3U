import { Prisma, UserStatus } from '@/db';
import { EpochStatus, EpochType } from '3u-aura-common';
import { RewardsService } from './rewards.service';
import { RewardAllocationEngine } from '../engines/reward-allocation.engine';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid',
}));

describe('RewardsService', () => {
  const createService = () => {
    const ledgerRepository = {
      createConsolationReward: jest.fn().mockResolvedValue(undefined),
      createReferralReward: jest.fn().mockResolvedValue(undefined),
      findConfirmedBySource: jest.fn().mockResolvedValue(null),
      sumConfirmedConsolationAmountByUser: jest
        .fn()
        .mockResolvedValue(new Prisma.Decimal((100n * 10n ** 18n).toString())),
      sumConfirmedConsolationAmountByUserAndEpoch: jest
        .fn()
        .mockResolvedValue(new Prisma.Decimal((100n * 10n ** 18n).toString())),
    };
    const referralRepository = {
      findUserForBinding: jest.fn(),
    };
    const transactionOrchestrator = {
      run: jest.fn(async (operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const weeklyEpochPolicyEngine = {
      projectEpochByNo: jest.fn().mockReturnValue({
        endAt: new Date('2026-03-22T16:00:00.000Z'),
        epochNo: 2,
        epochType: EpochType.WEEKLY_PROMOTION,
        referenceAt: new Date('2026-03-15T16:00:00.000Z'),
        startAt: new Date('2026-03-15T16:00:00.000Z'),
        status: EpochStatus.OPEN,
      }),
      toDateKey: jest
        .fn()
        .mockReturnValueOnce('2026-03-09')
        .mockReturnValueOnce('2026-03-16')
        .mockReturnValueOnce('2026-03-15'),
    };
    const weeklyEpochRepository = {
      ensureEpoch: jest.fn().mockResolvedValue({
        id: 'epoch_2',
      }),
      findByEpochNo: jest.fn().mockResolvedValue({
        id: 'epoch_2',
      }),
      findById: jest.fn(),
      incrementPreparedPools: jest.fn().mockResolvedValue(undefined),
    };
    const lotterySettlementService = {
      materializeForEpoch: jest.fn().mockResolvedValue({
        consolationCount: 2,
        draftRewardCount: 8,
        lotteryRolloverUsdt: '400',
      }),
    };
    const merkleDraftService = {
      materializeForEpoch: jest.fn().mockResolvedValue({
        claimCount: 4,
        leafCount: 4,
        merkleRoot:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
      }),
      publishDraftForEpoch: jest.fn().mockResolvedValue({
        claimCount: 4,
        merkleRoot:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
      }),
    };
    const rankingSettlementService = {
      materializeForEpoch: jest.fn().mockResolvedValue({
        draftRewardCount: 3,
        rankingRolloverUsdt: '480',
      }),
    };
    const statsRepository = {
      applyProfileReferralRewardProjection: jest
        .fn()
        .mockResolvedValue(undefined),
      applyProfileConsolationProjection: jest.fn().mockResolvedValue(undefined),
      ensureUserProfile: jest.fn().mockResolvedValue(undefined),
      setDailyConsolationProjection: jest.fn().mockResolvedValue(undefined),
      setProfileConsolationProjection: jest.fn().mockResolvedValue(undefined),
      upsertDailyConsolationProjection: jest.fn().mockResolvedValue(undefined),
      upsertDailyReferralRewardProjection: jest
        .fn()
        .mockResolvedValue(undefined),
    };
    const weeklyRewardRepository = {
      listConsolationRewardsForProjection: jest.fn().mockResolvedValue([]),
      listRewardsByTypes: jest.fn().mockResolvedValue([]),
    };

    const service = new RewardsService(
      transactionOrchestrator as any,
      weeklyEpochPolicyEngine as any,
      weeklyEpochRepository as any,
      ledgerRepository as any,
      lotterySettlementService as any,
      merkleDraftService as any,
      referralRepository as any,
      new RewardAllocationEngine(),
      rankingSettlementService as any,
      statsRepository as any,
      weeklyRewardRepository as any,
    );

    return {
      ledgerRepository,
      lotterySettlementService,
      merkleDraftService,
      referralRepository,
      service,
      statsRepository,
      transactionOrchestrator,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
      weeklyRewardRepository,
    };
  };

  it('creates direct and indirect referral rewards for active inviters', async () => {
    const { ledgerRepository, referralRepository, service, statsRepository } =
      createService();

    referralRepository.findUserForBinding
      .mockResolvedValueOnce({
        id: 'user_1',
        inviterId: 'inviter_direct',
      })
      .mockResolvedValueOnce({
        id: 'inviter_direct',
        inviterId: 'inviter_indirect',
        status: UserStatus.ACTIVE,
      })
      .mockResolvedValueOnce({
        id: 'inviter_indirect',
        inviterId: null,
        status: UserStatus.ACTIVE,
      });

    await service.applyReferralRewardsForCheckin(
      {
        checkinId: 'checkin_1',
        dateKey: '2026-03-11',
        rewardAuraAmountAtomic: '1000',
        userId: 'user_1',
      },
      {} as Prisma.TransactionClient,
    );

    expect(ledgerRepository.createReferralReward).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        amount: new Prisma.Decimal('100'),
        sourceType: 'DIRECT_REFERRAL',
        userId: 'inviter_direct',
      }),
      expect.any(Object),
    );
    expect(ledgerRepository.createReferralReward).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        amount: new Prisma.Decimal('50'),
        sourceType: 'INDIRECT_REFERRAL',
        userId: 'inviter_indirect',
      }),
      expect.any(Object),
    );
    expect(
      statsRepository.upsertDailyReferralRewardProjection,
    ).toHaveBeenCalledTimes(2);
    expect(
      statsRepository.applyProfileReferralRewardProjection,
    ).toHaveBeenCalledTimes(2);
  });

  it('skips duplicate or inactive inviter rewards', async () => {
    const { ledgerRepository, referralRepository, service, statsRepository } =
      createService();

    referralRepository.findUserForBinding
      .mockResolvedValueOnce({
        id: 'user_1',
        inviterId: 'inviter_direct',
      })
      .mockResolvedValueOnce({
        id: 'inviter_direct',
        inviterId: 'inviter_indirect',
        status: UserStatus.ACTIVE,
      })
      .mockResolvedValueOnce({
        id: 'inviter_indirect',
        inviterId: null,
        status: UserStatus.BLOCKED,
      });
    ledgerRepository.findConfirmedBySource.mockResolvedValueOnce({
      id: 'ledger_existing',
    });

    await service.applyReferralRewardsForCheckin(
      {
        checkinId: 'checkin_1',
        dateKey: '2026-03-11',
        rewardAuraAmountAtomic: '1000',
        userId: 'user_1',
      },
      {} as Prisma.TransactionClient,
    );

    expect(ledgerRepository.createReferralReward).not.toHaveBeenCalled();
    expect(
      statsRepository.upsertDailyReferralRewardProjection,
    ).not.toHaveBeenCalled();
  });

  it('drafts weekly rewards and merkle claim data for a calculating epoch', async () => {
    const {
      lotterySettlementService,
      merkleDraftService,
      service,
      weeklyEpochRepository,
    } = createService();

    weeklyEpochRepository.findById.mockResolvedValue({
      endAt: new Date('2026-03-15T16:00:00.000Z'),
      epochNo: 1,
      epochType: EpochType.WEEKLY_PROMOTION,
      id: 'epoch_1',
      startAt: new Date('2026-03-08T16:00:00.000Z'),
      status: EpochStatus.CALCULATING,
    });

    const result = await service.materializeEpochRewards('epoch_1');

    expect(lotterySettlementService.materializeForEpoch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'epoch_1' }),
      expect.any(Object),
    );
    expect(merkleDraftService.materializeForEpoch).toHaveBeenCalledWith(
      'epoch_1',
      expect.any(Object),
    );
    expect(result).toEqual(
      expect.objectContaining({
        dateKeyFromInclusive: '2026-03-09',
        dateKeyToExclusive: '2026-03-16',
        epochId: 'epoch_1',
        mode: 'draft',
      }),
    );
  });

  it('publishes draft rewards, applies rollovers, and confirms consolation ledger facts once', async () => {
    const {
      ledgerRepository,
      merkleDraftService,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
      weeklyRewardRepository,
    } = createService();

    weeklyEpochRepository.findById.mockResolvedValue({
      endAt: new Date('2026-03-15T16:00:00.000Z'),
      epochNo: 1,
      epochType: EpochType.WEEKLY_PROMOTION,
      id: 'epoch_1',
      lotteryPoolUsdt: new Prisma.Decimal(1000),
      rankingPoolUsdt: new Prisma.Decimal(1000),
      startAt: new Date('2026-03-08T16:00:00.000Z'),
      status: EpochStatus.CALCULATING,
    });
    weeklyRewardRepository.listRewardsByTypes.mockResolvedValue([
      {
        amountAura: new Prisma.Decimal(0),
        amountUsdt: new Prisma.Decimal(600),
        distributionKey: 'LOTTERY_FIRST_PRIZE',
        epochId: 'epoch_1',
        id: 'reward_lottery',
        rank: null,
        rewardType: 'LOTTERY_USDT',
        status: 'PENDING',
        user: {
          walletAddress: '0x0000000000000000000000000000000000000001',
        },
        userId: 'user_1',
      },
      {
        amountAura: new Prisma.Decimal(0),
        amountUsdt: new Prisma.Decimal(520),
        distributionKey: 'RANK_1',
        epochId: 'epoch_1',
        id: 'reward_ranking',
        rank: 1,
        rewardType: 'RANKING_USDT',
        status: 'PENDING',
        user: {
          walletAddress: '0x0000000000000000000000000000000000000002',
        },
        userId: 'user_2',
      },
      {
        amountAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
        amountUsdt: new Prisma.Decimal(0),
        distributionKey: 'CONSOLATION_DEFAULT',
        epochId: 'epoch_1',
        id: 'reward_consolation',
        rank: null,
        rewardType: 'CONSOLATION_AURA',
        status: 'PENDING',
        user: {
          walletAddress: '0x0000000000000000000000000000000000000003',
        },
        userId: 'user_3',
      },
    ]);
    ledgerRepository.findConfirmedBySource.mockResolvedValue(null);
    weeklyEpochPolicyEngine.toDateKey.mockReset();
    weeklyEpochPolicyEngine.toDateKey.mockReturnValue('2026-03-15');

    const result = await service.publishEpochRewards(
      'epoch_1',
      'ipfs://phase6-root.json',
    );

    expect(weeklyEpochRepository.incrementPreparedPools).toHaveBeenCalledWith(
      {
        epochId: 'epoch_2',
        lotteryPoolUsdt: new Prisma.Decimal(400),
        rankingPoolUsdt: new Prisma.Decimal(480),
      },
      expect.any(Object),
    );
    expect(ledgerRepository.createConsolationReward).toHaveBeenCalledWith(
      expect.objectContaining({
        epochId: 'epoch_1',
        sourceRefId: 'reward_consolation',
        sourceRefType: 'WEEKLY_REWARD',
        userId: 'user_3',
      }),
      expect.any(Object),
    );
    expect(
      statsRepository.setDailyConsolationProjection,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: '2026-03-15',
        userId: 'user_3',
      }),
      expect.any(Object),
    );
    expect(merkleDraftService.publishDraftForEpoch).toHaveBeenCalledWith(
      'epoch_1',
      'ipfs://phase6-root.json',
      expect.any(Object),
    );
    expect(result).toEqual(
      expect.objectContaining({
        consolationCount: 1,
        lotteryRolloverUsdt: '400',
        mode: 'publish',
        rankingRolloverUsdt: '480',
      }),
    );
  });

  it('self-heals consolation projections when ledger already exists', async () => {
    const {
      ledgerRepository,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
      weeklyRewardRepository,
    } = createService();

    weeklyEpochRepository.findById.mockResolvedValue({
      endAt: new Date('2026-03-15T16:00:00.000Z'),
      epochNo: 1,
      epochType: EpochType.WEEKLY_PROMOTION,
      id: 'epoch_1',
      lotteryPoolUsdt: new Prisma.Decimal(1000),
      rankingPoolUsdt: new Prisma.Decimal(1000),
      startAt: new Date('2026-03-08T16:00:00.000Z'),
      status: EpochStatus.CALCULATING,
    });
    weeklyRewardRepository.listRewardsByTypes.mockResolvedValue([
      {
        amountAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
        amountUsdt: new Prisma.Decimal(0),
        distributionKey: 'CONSOLATION_DEFAULT',
        epochId: 'epoch_1',
        id: 'reward_consolation',
        rank: null,
        rewardType: 'CONSOLATION_AURA',
        status: 'PENDING',
        user: {
          walletAddress: '0x0000000000000000000000000000000000000003',
        },
        userId: 'user_3',
      },
    ]);
    ledgerRepository.findConfirmedBySource.mockResolvedValue({
      id: 'ledger_existing',
    });
    weeklyEpochPolicyEngine.toDateKey.mockReset();
    weeklyEpochPolicyEngine.toDateKey.mockReturnValue('2026-03-15');

    const result = await service.publishEpochRewards('epoch_1');

    expect(ledgerRepository.createConsolationReward).not.toHaveBeenCalled();
    expect(statsRepository.setDailyConsolationProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        amountAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
        dateKey: '2026-03-15',
        userId: 'user_3',
      }),
      expect.any(Object),
    );
    expect(statsRepository.setProfileConsolationProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
        userId: 'user_3',
      }),
      expect.any(Object),
    );
    expect(result.consolationCount).toBe(0);
  });

  it('reconciles consolation projections for a wallet-scoped backfill run', async () => {
    const {
      ledgerRepository,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyRewardRepository,
    } = createService();

    weeklyRewardRepository.listConsolationRewardsForProjection.mockResolvedValue([
        {
          amountAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
          epoch: {
            endAt: new Date('2026-03-15T16:00:00.000Z'),
          },
          epochId: 'epoch_1',
          id: 'reward_consolation',
          user: {
            walletAddress: '0x0000000000000000000000000000000000000003',
          },
          userId: 'user_3',
        },
      ]);
    weeklyEpochPolicyEngine.toDateKey.mockReset();
    weeklyEpochPolicyEngine.toDateKey.mockReturnValue('2026-03-15');

    const result = await service.syncConsolationProjections({
      walletAddress: '0x0000000000000000000000000000000000000003',
    });

    expect(
      weeklyRewardRepository.listConsolationRewardsForProjection,
    ).toHaveBeenCalledWith(
      {
        walletAddress: '0x0000000000000000000000000000000000000003',
      },
      expect.any(Object),
    );
    expect(
      ledgerRepository.sumConfirmedConsolationAmountByUserAndEpoch,
    ).toHaveBeenCalledWith(
      {
        epochId: 'epoch_1',
        userId: 'user_3',
      },
      expect.any(Object),
    );
    expect(statsRepository.setProfileConsolationProjection).toHaveBeenCalled();
    expect(result).toEqual({
      processedRewards: 1,
      skippedRewardsWithoutLedger: 0,
      userCount: 1,
      walletAddresses: ['0x0000000000000000000000000000000000000003'],
    });
  });

  it('creates missing consolation ledger during backfill before projecting totals', async () => {
    const {
      ledgerRepository,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyRewardRepository,
    } = createService();

    weeklyRewardRepository.listConsolationRewardsForProjection.mockResolvedValue([
      {
        amountAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
        epoch: {
          endAt: new Date('2026-03-15T16:00:00.000Z'),
        },
        epochId: 'epoch_1',
        id: 'reward_consolation',
        user: {
          walletAddress: '0x0000000000000000000000000000000000000003',
        },
        userId: 'user_3',
      },
    ]);
    ledgerRepository.findConfirmedBySource.mockResolvedValue(null);
    ledgerRepository.sumConfirmedConsolationAmountByUserAndEpoch
      .mockResolvedValueOnce(new Prisma.Decimal(0))
      .mockResolvedValueOnce(new Prisma.Decimal((100n * 10n ** 18n).toString()));
    ledgerRepository.sumConfirmedConsolationAmountByUser.mockResolvedValue(
      new Prisma.Decimal((100n * 10n ** 18n).toString()),
    );
    weeklyEpochPolicyEngine.toDateKey.mockReset();
    weeklyEpochPolicyEngine.toDateKey.mockReturnValue('2026-03-15');

    const result = await service.syncConsolationProjections({
      walletAddress: '0x0000000000000000000000000000000000000003',
    });

    expect(ledgerRepository.createConsolationReward).toHaveBeenCalledWith(
      expect.objectContaining({
        epochId: 'epoch_1',
        sourceRefId: 'reward_consolation',
        userId: 'user_3',
      }),
      expect.any(Object),
    );
    expect(statsRepository.setDailyConsolationProjection).toHaveBeenCalled();
    expect(result.processedRewards).toBe(1);
    expect(result.skippedRewardsWithoutLedger).toBe(0);
  });
});
