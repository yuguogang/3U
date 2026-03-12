import {
  DbService,
  Prisma,
  RewardStatus,
  RewardType,
  WeeklyReward,
} from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class WeeklyRewardRepository {
  constructor(private readonly db: DbService) {}

  async createReward(
    data: {
      amountAura?: Prisma.Decimal;
      amountUsdt?: Prisma.Decimal;
      distributionKey: string;
      epochId: string;
      rank?: number;
      rewardType: RewardType;
      sourceNote?: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyReward> {
    return executor.weeklyReward.create({
      data: {
        amountAura: data.amountAura,
        amountUsdt: data.amountUsdt,
        distributionKey: data.distributionKey,
        epochId: data.epochId,
        rank: data.rank,
        rewardType: data.rewardType,
        sourceNote: data.sourceNote,
        userId: data.userId,
      },
    });
  }

  async deleteDraftRewardsByTypes(
    data: {
      epochId: string;
      rewardTypes: RewardType[];
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    const rewards = await executor.weeklyReward.findMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
      select: {
        id: true,
      },
    });
    const rewardIds = rewards.map((reward) => reward.id);

    if (rewardIds.length) {
      await executor.claimRecord.deleteMany({
        where: {
          rewardId: { in: rewardIds },
        },
      });
      await executor.merkleLeaf.deleteMany({
        where: {
          rewardId: { in: rewardIds },
        },
      });
    }

    await executor.weeklyReward.deleteMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
    });
  }

  async listRewardsForMerkleDraft(
    data: {
      epochId: string;
      rewardTypes: RewardType[];
    },
    executor: DbExecutor = this.db,
  ): Promise<
    Array<
      Pick<
        WeeklyReward,
        | 'amountAura'
        | 'amountUsdt'
        | 'distributionKey'
        | 'epochId'
        | 'id'
        | 'rewardType'
        | 'userId'
      > & {
        user: {
          walletAddress: string;
        };
      }
    >
  > {
    return executor.weeklyReward.findMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
      orderBy: [
        {
          user: {
            walletAddress: 'asc',
          },
        },
        { rewardType: 'asc' },
        { distributionKey: 'asc' },
      ],
      select: {
        amountAura: true,
        amountUsdt: true,
        distributionKey: true,
        epochId: true,
        id: true,
        rewardType: true,
        userId: true,
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
  }

  async listRewardsByTypes(
    data: {
      epochId: string;
      rewardTypes: RewardType[];
    },
    executor: DbExecutor = this.db,
  ): Promise<
    Array<
      Pick<
        WeeklyReward,
        | 'amountAura'
        | 'amountUsdt'
        | 'distributionKey'
        | 'epochId'
        | 'id'
        | 'rank'
        | 'rewardType'
        | 'status'
        | 'userId'
      > & {
        user: {
          walletAddress: string;
        };
      }
    >
  > {
    return executor.weeklyReward.findMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
      orderBy: [
        { rewardType: 'asc' },
        { distributionKey: 'asc' },
        { userId: 'asc' },
      ],
      select: {
        amountAura: true,
        amountUsdt: true,
        distributionKey: true,
        epochId: true,
        id: true,
        rank: true,
        rewardType: true,
        status: true,
        userId: true,
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
  }

  async resetMerkleDraftMetadata(
    data: {
      epochId: string;
      rewardTypes: RewardType[];
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.weeklyReward.updateMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
      data: {
        merkleIndex: null,
        merkleLeafHash: null,
        proofJsonUri: null,
        status: RewardStatus.PENDING,
      },
    });
  }

  async updateMerkleDraftMetadata(
    data: {
      merkleIndex: number;
      merkleLeafHash: string;
      rewardId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyReward> {
    return executor.weeklyReward.update({
      where: { id: data.rewardId },
      data: {
        merkleIndex: data.merkleIndex,
        merkleLeafHash: data.merkleLeafHash,
      },
    });
  }

  async markRewardsClaimable(
    data: {
      epochId: string;
      rewardTypes: RewardType[];
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.weeklyReward.updateMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
      data: {
        status: RewardStatus.CLAIMABLE,
      },
    });
  }

  async markRewardClaimed(
    data: {
      claimedAt: Date;
      rewardId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.weeklyReward.update({
      where: { id: data.rewardId },
      data: {
        claimedAt: data.claimedAt,
        status: RewardStatus.CLAIMED,
      },
    });
  }

  async listRewardsForUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<
    Array<
      Pick<
        WeeklyReward,
        | 'amountAura'
        | 'amountUsdt'
        | 'createdAt'
        | 'distributionKey'
        | 'epochId'
        | 'id'
        | 'rank'
        | 'rewardType'
        | 'status'
      > & {
        claimRecords: Array<{
          claimType: import('@/db').ClaimType;
          id: string;
          status: import('@/db').ClaimStatus;
        }>;
        epoch: {
          epochNo: number;
          epochType: import('@/db').EpochType;
        };
      }
    >
  > {
    return executor.weeklyReward.findMany({
      where: {
        userId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        amountAura: true,
        amountUsdt: true,
        createdAt: true,
        distributionKey: true,
        epochId: true,
        id: true,
        rank: true,
        rewardType: true,
        status: true,
        claimRecords: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            claimType: true,
            id: true,
            status: true,
          },
          take: 1,
        },
        epoch: {
          select: {
            epochNo: true,
            epochType: true,
          },
        },
      },
    });
  }
}
