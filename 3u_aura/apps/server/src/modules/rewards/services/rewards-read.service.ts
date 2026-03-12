import { Injectable } from '@nestjs/common';
import {
  ClaimStatus,
  ClaimType,
  EpochType,
  PromotionRewardView,
  RewardStatus,
  RewardType,
} from '3u-aura-common';
import { WeeklyRewardRepository } from '../repositories/weekly-reward.repository';

@Injectable()
export class RewardsReadService {
  constructor(
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async listRewardsForUser(userId: string): Promise<PromotionRewardView[]> {
    const rewards = await this.weeklyRewardRepository.listRewardsForUser(userId);

    return rewards.map((reward) => ({
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
}
