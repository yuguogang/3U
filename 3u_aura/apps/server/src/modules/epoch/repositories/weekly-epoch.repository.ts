import { DbService, EpochStatus, EpochType, Prisma, WeeklyEpoch } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class WeeklyEpochRepository {
  constructor(private readonly db: DbService) {}

  async findById(
    epochId: string,
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch | null> {
    return executor.weeklyEpoch.findUnique({
      where: { id: epochId },
    });
  }

  async findByEpochNo(
    epochType: EpochType,
    epochNo: number,
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch | null> {
    return executor.weeklyEpoch.findUnique({
      where: {
        epochType_epochNo: {
          epochNo,
          epochType,
        },
      },
    });
  }

  async ensureEpoch(
    data: {
      endAt: Date;
      epochNo: number;
      epochType: EpochType;
      startAt: Date;
      status: EpochStatus;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.upsert({
      where: {
        epochType_epochNo: {
          epochNo: data.epochNo,
          epochType: data.epochType,
        },
      },
      create: {
        endAt: data.endAt,
        epochNo: data.epochNo,
        epochType: data.epochType,
        startAt: data.startAt,
        status: data.status,
      },
      update: {
        endAt: data.endAt,
        startAt: data.startAt,
      },
    });
  }

  async updateStatus(
    epochId: string,
    status: EpochStatus,
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: epochId },
      data: { status },
    });
  }

  async updateTicketCounts(
    data: {
      epochId: string;
      participantCount: number;
      qualifiedTicketCount: number;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        participantCount: data.participantCount,
        qualifiedTicketCount: data.qualifiedTicketCount,
      },
    });
  }

  async finalizeEpochPreparation(
    data: {
      calculationRemark?: string;
      epochId: string;
      lotteryPoolUsdt: Prisma.Decimal;
      rankingPoolUsdt: Prisma.Decimal;
      settledAt?: Date | null;
      snapshotAt: Date;
      status: EpochStatus;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        calculationRemark: data.calculationRemark,
        lotteryPoolUsdt: data.lotteryPoolUsdt,
        rankingPoolUsdt: data.rankingPoolUsdt,
        settledAt: data.settledAt ?? undefined,
        snapshotAt: data.snapshotAt,
        status: data.status,
      },
    });
  }

  async incrementRolloverPool(
    epochId: string,
    amount: Prisma.Decimal,
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: epochId },
      data: {
        rolloverUsdt: {
          increment: amount,
        },
      },
    });
  }

  async incrementPreparedPools(
    data: {
      epochId: string;
      lotteryPoolUsdt?: Prisma.Decimal;
      rankingPoolUsdt?: Prisma.Decimal;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        lotteryPoolUsdt: data.lotteryPoolUsdt
          ? { increment: data.lotteryPoolUsdt }
          : undefined,
        rankingPoolUsdt: data.rankingPoolUsdt
          ? { increment: data.rankingPoolUsdt }
          : undefined,
      },
    });
  }

  async publishMerkleRoot(
    data: {
      epochId: string;
      merkleRoot: string;
      rewardJsonUri?: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        merkleRoot: data.merkleRoot,
        rewardJsonUri: data.rewardJsonUri,
        status: EpochStatus.ROOT_POSTED,
      },
    });
  }

  async findLatestPromotionResultEpoch(
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch | null> {
    return executor.weeklyEpoch.findFirst({
      where: {
        epochType: EpochType.WEEKLY_PROMOTION,
        status: {
          in: [
            EpochStatus.ROOT_POSTED,
            EpochStatus.SETTLED,
            EpochStatus.CANCELLED,
          ],
        },
      },
      orderBy: { epochNo: 'desc' },
    });
  }
}
