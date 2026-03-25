import { Injectable } from '@nestjs/common';
import {
  ClaimStatus,
  ClaimType,
  EpochType,
  PromotionWeeklyResultsView,
  PromotionRewardView,
  RewardStatus,
  RewardType,
} from '3u-aura-common';
import { WeeklyEpochRepository } from '../../epoch';
import { LotteryTicketRepository } from '../../lottery';
import { WeeklyRewardRepository } from '../repositories/weekly-reward.repository';

@Injectable()
export class RewardsReadService {
  constructor(
    private readonly lotteryTicketRepository: LotteryTicketRepository,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async listRewardsForUser(userId: string): Promise<PromotionRewardView[]> {
    const [hiddenEpochIds, rewards] = await Promise.all([
      this.lotteryTicketRepository.listUnrevealedParticipatingEpochIdsForUser(
        userId,
      ),
      this.weeklyRewardRepository.listRewardsForUser(userId),
    ]);
    const hiddenEpochSet = new Set(hiddenEpochIds);

    return rewards
      .filter(
        (reward) =>
          !(
            hiddenEpochSet.has(reward.epochId) &&
            (reward.rewardType === 'LOTTERY_USDT' ||
              reward.rewardType === 'CONSOLATION_AURA')
          ),
      )
      .map((reward) => ({
        amountAura: reward.amountAura.toFixed(0),
        amountUsdt: reward.amountUsdt.toFixed(0),
        claimRecordId: reward.claimRecords[0]?.id,
        claimStatus: reward.claimRecords[0]?.status as ClaimStatus | undefined,
        claimType: reward.claimRecords[0]?.claimType as ClaimType | undefined,
        createdAt: reward.createdAt,
        distributionKey: reward.distributionKey,
        epochId: reward.epochId,
        epochNo: reward.epoch.epochNo,
        epochType: reward.epoch.epochType as EpochType,
        rank: reward.rank ?? undefined,
        rewardId: reward.id,
        rewardType: reward.rewardType as RewardType,
        status: reward.status as RewardStatus,
      }));
  }

  async getLatestWeeklyResultsForUser(
    userId: string,
  ): Promise<PromotionWeeklyResultsView | null> {
    const epoch = await this.weeklyEpochRepository.findLatestPromotionResultEpoch();
    if (!epoch) {
      return null;
    }

    const [lotteryAndRankingRewards, userRewards, ticket] = await Promise.all([
      this.weeklyRewardRepository.listRewardsByTypes({
        epochId: epoch.id,
        rewardTypes: ['LOTTERY_USDT', 'RANKING_USDT'],
      }),
      this.weeklyRewardRepository.listUserRewardsByEpochAndTypes({
        epochId: epoch.id,
        rewardTypes: ['LOTTERY_USDT', 'CONSOLATION_AURA', 'RANKING_USDT'],
        userId,
      }),
      this.lotteryTicketRepository.findByEpochAndUser(epoch.id, userId),
    ]);

    const userRewardByType = new Map(
      userRewards.map((reward) => [reward.rewardType, reward]),
    );
    const myLotteryReward = userRewardByType.get('LOTTERY_USDT');
    const myConsolationReward = userRewardByType.get('CONSOLATION_AURA');
    const myRankingReward = userRewardByType.get('RANKING_USDT');

    return {
      endAt: epoch.endAt,
      epochId: epoch.id,
      epochNo: epoch.epochNo,
      epochStatus: epoch.status as any,
      lotteryWinners: lotteryAndRankingRewards
        .filter((reward) => reward.rewardType === 'LOTTERY_USDT')
        .map((reward) => ({
          amountUsdt: reward.amountUsdt.toFixed(0),
          prizeLabel: this.toPrizeLabel(reward.distributionKey),
          userId: reward.userId,
          walletAddress: reward.user.walletAddress,
        })),
      myLottery: this.buildLotteryOutcome({
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as any,
        lotteryReward: myLotteryReward,
        consolationReward: myConsolationReward,
        ticket,
      }),
      participantCount: epoch.participantCount,
      publishedAt: epoch.settledAt ?? epoch.snapshotAt ?? undefined,
      qualifiedTicketCount: epoch.qualifiedTicketCount,
      rankingEntries: lotteryAndRankingRewards
        .filter((reward) => reward.rewardType === 'RANKING_USDT')
        .sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER))
        .map((reward) => ({
          amountUsdt: reward.amountUsdt.toFixed(0),
          claimRecordId:
            reward.userId === userId ? myRankingReward?.claimRecords[0]?.id : undefined,
          claimStatus:
            reward.userId === userId
              ? (myRankingReward?.claimRecords[0]?.status as ClaimStatus | undefined)
              : undefined,
          isCurrentUser: reward.userId === userId,
          rank: reward.rank ?? 0,
          userId: reward.userId,
          walletAddress: reward.user.walletAddress,
        })),
      startAt: epoch.startAt,
    };
  }

  private buildLotteryOutcome(params: {
    consolationReward?: Awaited<
      ReturnType<WeeklyRewardRepository['listUserRewardsByEpochAndTypes']>
    >[number];
    epochId: string;
    epochNo: number;
    epochStatus: PromotionWeeklyResultsView['epochStatus'];
    lotteryReward?: Awaited<
      ReturnType<WeeklyRewardRepository['listUserRewardsByEpochAndTypes']>
    >[number];
    ticket:
      | Awaited<ReturnType<LotteryTicketRepository['findByEpochAndUser']>>
      | null;
  }): PromotionWeeklyResultsView['myLottery'] {
    const { consolationReward, epochId, epochNo, epochStatus, lotteryReward, ticket } =
      params;

    if (!ticket?.isParticipating) {
      return {
        canReveal: false,
        epochId,
        epochNo,
        epochStatus,
        isEligible: ticket?.isEligible ?? false,
        isParticipating: false,
        isRevealed: ticket?.isResultRevealed ?? false,
        resultStatus: 'NOT_PARTICIPATING',
      };
    }

    if (!ticket.isResultRevealed) {
      return {
        canReveal: true,
        epochId,
        epochNo,
        epochStatus,
        isEligible: ticket.isEligible,
        isParticipating: true,
        isRevealed: false,
        participatedAt: ticket.participatedAt ?? undefined,
        resultStatus: 'PENDING',
      };
    }

    if (epochStatus === 'CANCELLED') {
      return {
        canReveal: false,
        epochId,
        epochNo,
        epochStatus,
        isEligible: ticket.isEligible,
        isParticipating: true,
        isRevealed: true,
        participatedAt: ticket.participatedAt ?? undefined,
        resultStatus: 'ROLLED_OVER',
        revealedAt: ticket.revealedAt ?? undefined,
      };
    }

    if (!ticket.isEligible) {
      return {
        canReveal: false,
        epochId,
        epochNo,
        epochStatus,
        isEligible: false,
        isParticipating: true,
        isRevealed: true,
        participatedAt: ticket.participatedAt ?? undefined,
        resultStatus: 'NOT_QUALIFIED',
        revealedAt: ticket.revealedAt ?? undefined,
      };
    }

    if (lotteryReward) {
      return {
        amountUsdt: lotteryReward.amountUsdt.toFixed(0),
        canReveal: false,
        claimRecordId: lotteryReward.claimRecords[0]?.id,
        claimStatus: lotteryReward.claimRecords[0]?.status as
          | ClaimStatus
          | undefined,
        epochId,
        epochNo,
        epochStatus,
        isEligible: true,
        isParticipating: true,
        isRevealed: true,
        participatedAt: ticket.participatedAt ?? undefined,
        prizeLabel: this.toPrizeLabel(lotteryReward.distributionKey),
        resultStatus: 'WON',
        revealedAt: ticket.revealedAt ?? undefined,
      };
    }

    return {
      amountAura: consolationReward?.amountAura.toFixed(0),
      canReveal: false,
      epochId,
      epochNo,
      epochStatus,
      isEligible: true,
      isParticipating: true,
      isRevealed: true,
      participatedAt: ticket.participatedAt ?? undefined,
      resultStatus: 'LOST',
      revealedAt: ticket.revealedAt ?? undefined,
    };
  }

  private toPrizeLabel(distributionKey: string) {
    if (distributionKey.startsWith('LOTTERY_FIRST_PRIZE')) {
      return 'FIRST' as const;
    }
    if (distributionKey.startsWith('LOTTERY_SECOND_PRIZE')) {
      return 'SECOND' as const;
    }
    if (distributionKey.startsWith('LOTTERY_THIRD_PRIZE')) {
      return 'THIRD' as const;
    }

    return 'LUCKY' as const;
  }
}
