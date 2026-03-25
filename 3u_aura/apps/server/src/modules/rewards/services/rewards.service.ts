import { EpochStatus, Prisma, UserStatus, WeeklyEpoch } from '@/db';
import { Injectable } from '@nestjs/common';
import { EpochType as CommonEpochType } from '3u-aura-common';
import { WeeklyEpochPolicyEngine } from '../../epoch/engines/weekly-epoch-policy.engine';
import { WeeklyEpochRepository } from '../../epoch/repositories/weekly-epoch.repository';
import { LedgerRepository } from '../../ledger';
import { LotterySettlementService } from '../../lottery/services/lottery-settlement.service';
import { MerkleDraftService } from '../../merkle/services/merkle-draft.service';
import { ReferralRepository } from '../../referral';
import { RankingSettlementService } from '../../ranking/services/ranking-settlement.service';
import { TransactionOrchestratorService } from '../../shared/services/transaction-orchestrator.service';
import { StatsRepository } from '../../stats';
import { RewardAllocationEngine } from '../engines/reward-allocation.engine';
import { WeeklyRewardRepository } from '../repositories/weekly-reward.repository';

@Injectable()
export class RewardsService {
  constructor(
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly weeklyEpochPolicyEngine: WeeklyEpochPolicyEngine,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly lotterySettlementService: LotterySettlementService,
    private readonly merkleDraftService: MerkleDraftService,
    private readonly referralRepository: ReferralRepository,
    private readonly rewardAllocationEngine: RewardAllocationEngine,
    private readonly rankingSettlementService: RankingSettlementService,
    private readonly statsRepository: StatsRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async applyReferralRewardsForCheckin(
    data: {
      checkinId: string;
      dateKey: string;
      rewardAuraAmountAtomic: string;
      userId: string;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const rewardSourceUser = await this.referralRepository.findUserForBinding(
      data.userId,
      tx,
    );
    if (!rewardSourceUser?.inviterId) {
      return;
    }

    const directInviter = await this.referralRepository.findUserForBinding(
      rewardSourceUser.inviterId,
      tx,
    );
    const indirectInviter = directInviter?.inviterId
      ? await this.referralRepository.findUserForBinding(
          directInviter.inviterId,
          tx,
        )
      : null;
    const rewardAmounts =
      this.rewardAllocationEngine.buildReferralRewardAmounts(
        data.rewardAuraAmountAtomic,
      );

    if (directInviter?.status === UserStatus.ACTIVE) {
      await this.ensureReferralReward(
        {
          amountAtomic: rewardAmounts.directAuraAtomic,
          checkinId: data.checkinId,
          dateKey: data.dateKey,
          notes: `direct referral reward for ${data.checkinId}`,
          sourceType: 'DIRECT_REFERRAL',
          userId: directInviter.id,
        },
        tx,
      );
    }

    if (indirectInviter?.status === UserStatus.ACTIVE) {
      await this.ensureReferralReward(
        {
          amountAtomic: rewardAmounts.indirectAuraAtomic,
          checkinId: data.checkinId,
          dateKey: data.dateKey,
          notes: `indirect referral reward for ${data.checkinId}`,
          sourceType: 'INDIRECT_REFERRAL',
          userId: indirectInviter.id,
        },
        tx,
      );
    }
  }

  async materializeEpochRewards(epochId: string): Promise<{
    dateKeyFromInclusive: string;
    dateKeyToExclusive: string;
    epochId: string;
    lottery: Awaited<
      ReturnType<LotterySettlementService['materializeForEpoch']>
    >;
    merkle: Awaited<ReturnType<MerkleDraftService['materializeForEpoch']>>;
    mode: 'draft';
    ranking: Awaited<
      ReturnType<RankingSettlementService['materializeForEpoch']>
    >;
  }> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.getCalculatingEpochOrThrow(epochId, tx);
      const dateKeyFromInclusive = this.weeklyEpochPolicyEngine.toDateKey(
        epoch.startAt,
      );
      const dateKeyToExclusive = this.weeklyEpochPolicyEngine.toDateKey(
        epoch.endAt,
      );
      const lottery = await this.lotterySettlementService.materializeForEpoch(
        epoch,
        tx,
      );
      const ranking = await this.rankingSettlementService.materializeForEpoch(
        epoch,
        dateKeyFromInclusive,
        dateKeyToExclusive,
        tx,
      );
      const merkle = await this.merkleDraftService.materializeForEpoch(
        epoch.id,
        tx,
      );

      return {
        dateKeyFromInclusive,
        dateKeyToExclusive,
        epochId: epoch.id,
        lottery,
        merkle,
        mode: 'draft' as const,
        ranking,
      };
    });
  }

  async publishEpochRewards(epochId: string): Promise<{
    consolationCount: number;
    epochId: string;
    lotteryRolloverUsdt: string;
    merkle: Awaited<ReturnType<MerkleDraftService['inspectDraftForEpoch']>>;
    mode: 'publish';
    nextEpochId?: string;
    rankingRolloverUsdt: string;
  }> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.getCalculatingEpochOrThrow(epochId, tx);
      const rewards = await this.weeklyRewardRepository.listRewardsByTypes(
        {
          epochId,
          rewardTypes: ['LOTTERY_USDT', 'RANKING_USDT', 'CONSOLATION_AURA'],
        },
        tx,
      );

      const lotteryRolloverUsdt = this.calculateRolloverUsdt(
        epoch.lotteryPoolUsdt.toFixed(0),
        rewards
          .filter((reward) => reward.rewardType === 'LOTTERY_USDT')
          .reduce(
            (sum, reward) => sum + BigInt(reward.amountUsdt.toFixed(0)),
            0n,
          ),
      );
      const rankingRolloverUsdt = this.calculateRolloverUsdt(
        epoch.rankingPoolUsdt.toFixed(0),
        rewards
          .filter((reward) => reward.rewardType === 'RANKING_USDT')
          .reduce(
            (sum, reward) => sum + BigInt(reward.amountUsdt.toFixed(0)),
            0n,
          ),
      );
      const nextEpoch =
        BigInt(lotteryRolloverUsdt) > 0n || BigInt(rankingRolloverUsdt) > 0n
          ? await this.ensureNextEpoch(epoch, tx)
          : null;

      if (nextEpoch) {
        await this.weeklyEpochRepository.incrementPreparedPools(
          {
            epochId: nextEpoch.id,
            lotteryPoolUsdt:
              BigInt(lotteryRolloverUsdt) > 0n
                ? new Prisma.Decimal(lotteryRolloverUsdt)
                : undefined,
            rankingPoolUsdt:
              BigInt(rankingRolloverUsdt) > 0n
                ? new Prisma.Decimal(rankingRolloverUsdt)
                : undefined,
          },
          tx,
        );
      }

      const settlementDateKey = this.weeklyEpochPolicyEngine.toDateKey(
        new Date(epoch.endAt.getTime() - 1),
      );
      let consolationCount = 0;

      for (const reward of rewards.filter(
        (item) => item.rewardType === 'CONSOLATION_AURA',
      )) {
        const existingLedger =
          await this.ledgerRepository.findConfirmedBySource(
            {
              sourceRefId: reward.id,
              sourceType: 'CONSOLATION',
              userId: reward.userId,
            },
            tx,
          );
        if (existingLedger) {
          await this.syncConsolationProjectionForEpoch(
            {
              rewardAmountAura: reward.amountAura,
              rewardId: reward.id,
              epochId: epoch.id,
              settlementDateKey,
              userId: reward.userId,
            },
            tx,
          );
          continue;
        }

        consolationCount += 1;
        await this.ledgerRepository.createConsolationReward(
          {
            amount: reward.amountAura,
            epochId: epoch.id,
            notes: `weekly consolation reward for ${reward.id}`,
            sourceRefId: reward.id,
            sourceRefType: 'WEEKLY_REWARD',
            userId: reward.userId,
          },
          tx,
        );
        await this.syncConsolationProjectionForEpoch(
          {
            rewardAmountAura: reward.amountAura,
            rewardId: reward.id,
            epochId: epoch.id,
            settlementDateKey,
            userId: reward.userId,
          },
          tx,
        );
      }

      const merkle = await this.merkleDraftService.inspectDraftForEpoch(
        epoch.id,
        tx,
      );

      return {
        consolationCount,
        epochId: epoch.id,
        lotteryRolloverUsdt,
        merkle,
        mode: 'publish' as const,
        nextEpochId: nextEpoch?.id,
        rankingRolloverUsdt,
      };
    });
  }

  async activateEpochRewards(
    epochId: string,
    rewardJsonUri?: string,
  ): Promise<{
    epochId: string;
    merkle: Awaited<ReturnType<MerkleDraftService['publishDraftForEpoch']>>;
    mode: 'activate';
  }> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.getEpochReadyForActivationOrThrow(epochId, tx);
      const merkle = await this.merkleDraftService.publishDraftForEpoch(
        epoch.id,
        rewardJsonUri,
        tx,
      );

      return {
        epochId: epoch.id,
        merkle,
        mode: 'activate' as const,
      };
    });
  }

  async syncConsolationProjections(data?: {
    epochId?: string;
    userId?: string;
    walletAddress?: string;
  }): Promise<{
    processedRewards: number;
    skippedRewardsWithoutLedger: number;
    userCount: number;
    walletAddresses: string[];
  }> {
    return this.transactionOrchestrator.run(async (tx) => {
      const rewards =
        await this.weeklyRewardRepository.listConsolationRewardsForProjection(
          data,
          tx,
        );
      const wallets = new Set<string>();
      let processedRewards = 0;
      const skippedRewardsWithoutLedger = 0;

      for (const reward of rewards) {
        wallets.add(reward.user.walletAddress);
        const settlementDateKey = this.weeklyEpochPolicyEngine.toDateKey(
          new Date(reward.epoch.endAt.getTime() - 1),
        );
        await this.syncConsolationProjectionForEpoch(
          {
            rewardAmountAura: reward.amountAura,
            rewardId: reward.id,
            epochId: reward.epochId,
            settlementDateKey,
            userId: reward.userId,
          },
          tx,
        );
        processedRewards += 1;
      }

      return {
        processedRewards,
        skippedRewardsWithoutLedger,
        userCount: wallets.size,
        walletAddresses: [...wallets].sort(),
      };
    });
  }

  private async ensureReferralReward(
    data: {
      amountAtomic: string;
      checkinId: string;
      dateKey: string;
      notes: string;
      sourceType: 'DIRECT_REFERRAL' | 'INDIRECT_REFERRAL';
      userId: string;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const existingLedger = await this.ledgerRepository.findConfirmedBySource(
      {
        sourceRefId: data.checkinId,
        sourceType: data.sourceType,
        userId: data.userId,
      },
      tx,
    );

    if (existingLedger) {
      return;
    }

    const amount = new Prisma.Decimal(data.amountAtomic);
    await this.statsRepository.ensureUserProfile(data.userId, tx);
    await this.ledgerRepository.createReferralReward(
      {
        amount,
        checkinId: data.checkinId,
        notes: data.notes,
        sourceRefId: data.checkinId,
        sourceType: data.sourceType,
        userId: data.userId,
      },
      tx,
    );
    await this.statsRepository.upsertDailyReferralRewardProjection(
      {
        dateKey: data.dateKey,
        directReferralAura:
          data.sourceType === 'DIRECT_REFERRAL' ? amount : undefined,
        indirectReferralAura:
          data.sourceType === 'INDIRECT_REFERRAL' ? amount : undefined,
        userId: data.userId,
      },
      tx,
    );
    await this.statsRepository.applyProfileReferralRewardProjection(
      {
        directReferralAura:
          data.sourceType === 'DIRECT_REFERRAL' ? amount : undefined,
        indirectReferralAura:
          data.sourceType === 'INDIRECT_REFERRAL' ? amount : undefined,
        userId: data.userId,
      },
      tx,
    );
  }

  private calculateRolloverUsdt(
    poolAtomic: string,
    distributed: bigint,
  ): string {
    const pool = BigInt(poolAtomic);

    if (distributed > pool) {
      throw new Error('Draft reward total exceeds prepared pool');
    }

    return (pool - distributed).toString();
  }

  private async syncConsolationProjectionForEpoch(
    data: {
      rewardAmountAura: Prisma.Decimal;
      rewardId: string;
      epochId: string;
      settlementDateKey: string;
      userId: string;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const existingLedger = await this.ledgerRepository.findConfirmedBySource(
      {
        sourceRefId: data.rewardId,
        sourceType: 'CONSOLATION',
        userId: data.userId,
      },
      tx,
    );

    if (!existingLedger) {
      await this.ledgerRepository.createConsolationReward(
        {
          amount: data.rewardAmountAura,
          epochId: data.epochId,
          notes: `weekly consolation reward for ${data.rewardId}`,
          sourceRefId: data.rewardId,
          sourceRefType: 'WEEKLY_REWARD',
          userId: data.userId,
        },
        tx,
      );
    }

    await this.statsRepository.ensureUserProfile(data.userId, tx);

    const [epochConsolationAmount, totalConsolationAmount] = await Promise.all([
      this.ledgerRepository.sumConfirmedConsolationAmountByUserAndEpoch(
        {
          epochId: data.epochId,
          userId: data.userId,
        },
        tx,
      ),
      this.ledgerRepository.sumConfirmedConsolationAmountByUser(
        data.userId,
        tx,
      ),
    ]);

    await this.statsRepository.setDailyConsolationProjection(
      {
        amountAura: epochConsolationAmount,
        dateKey: data.settlementDateKey,
        userId: data.userId,
      },
      tx,
    );
    await this.statsRepository.setProfileConsolationProjection(
      {
        totalAura: totalConsolationAmount,
        userId: data.userId,
      },
      tx,
    );
  }

  private async ensureNextEpoch(
    epoch: WeeklyEpoch,
    tx: Prisma.TransactionClient,
  ): Promise<WeeklyEpoch> {
    const existing = await this.weeklyEpochRepository.findByEpochNo(
      epoch.epochType,
      epoch.epochNo + 1,
      tx,
    );
    if (existing) {
      return existing;
    }

    const projection = this.weeklyEpochPolicyEngine.projectEpochByNo(
      epoch.epochNo + 1,
      epoch.epochType as unknown as CommonEpochType,
      epoch.endAt,
    );

    return this.weeklyEpochRepository.ensureEpoch(
      {
        endAt: projection.endAt,
        epochNo: projection.epochNo,
        epochType: projection.epochType,
        startAt: projection.startAt,
        status: projection.status,
      },
      tx,
    );
  }

  private async getCalculatingEpochOrThrow(
    epochId: string,
    tx: Prisma.TransactionClient,
  ): Promise<WeeklyEpoch> {
    const epoch = await this.weeklyEpochRepository.findById(epochId, tx);

    if (!epoch) {
      throw new Error(`Weekly epoch not found: ${epochId}`);
    }
    if (epoch.status !== EpochStatus.CALCULATING) {
      throw new Error(
        `Weekly epoch ${epochId} must be CALCULATING before settlement, got ${epoch.status}`,
      );
    }

    return epoch;
  }

  private async getEpochReadyForActivationOrThrow(
    epochId: string,
    tx: Prisma.TransactionClient,
  ): Promise<WeeklyEpoch> {
    const epoch = await this.weeklyEpochRepository.findById(epochId, tx);
    if (!epoch) {
      throw new Error(`Weekly epoch not found: ${epochId}`);
    }
    if (
      epoch.status !== EpochStatus.CALCULATING &&
      epoch.status !== EpochStatus.ROOT_POSTED
    ) {
      throw new Error(
        `Weekly epoch ${epochId} must be CALCULATING or ROOT_POSTED before activation`,
      );
    }

    return epoch;
  }
}
