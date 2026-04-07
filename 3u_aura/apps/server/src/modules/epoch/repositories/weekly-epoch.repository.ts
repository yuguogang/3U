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
        lotteryStatus: data.status,
        rankingStatus: data.status,
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
      data: {
        lotteryStatus: status,
        rankingStatus: status,
        status,
      },
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
      lotteryStatus: EpochStatus;
      rankingPoolUsdt: Prisma.Decimal;
      rankingStatus: EpochStatus;
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
        lotteryStatus: data.lotteryStatus,
        rankingPoolUsdt: data.rankingPoolUsdt,
        rankingStatus: data.rankingStatus,
        settledAt: data.settledAt ?? undefined,
        snapshotAt: data.snapshotAt,
        status: data.status,
      },
    });
  }

  async incrementRolloverPools(
    data: {
      epochId: string;
      lotteryRolloverUsdt?: Prisma.Decimal;
      rankingRolloverUsdt?: Prisma.Decimal;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        lotteryRolloverUsdt: data.lotteryRolloverUsdt
          ? { increment: data.lotteryRolloverUsdt }
          : undefined,
        rankingRolloverUsdt: data.rankingRolloverUsdt
          ? { increment: data.rankingRolloverUsdt }
          : undefined,
        rolloverUsdt: {
          increment: new Prisma.Decimal(0)
            .plus(data.lotteryRolloverUsdt ?? 0)
            .plus(data.rankingRolloverUsdt ?? 0),
        },
      },
    });
  }

  async publishMerkleRoot(
    data: {
      epochId: string;
      lotteryStatus: EpochStatus;
      merkleRoot: string;
      rankingStatus: EpochStatus;
      rewardJsonUri?: string;
      status?: EpochStatus;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        lotteryStatus: data.lotteryStatus,
        merkleRoot: data.merkleRoot,
        rankingStatus: data.rankingStatus,
        rewardJsonUri: data.rewardJsonUri,
        status: data.status ?? EpochStatus.ROOT_POSTED,
      },
    });
  }

  async updateCalculationRemark(
    data: {
      calculationRemark?: string | null;
      epochId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<WeeklyEpoch> {
    return executor.weeklyEpoch.update({
      where: { id: data.epochId },
      data: {
        calculationRemark: data.calculationRemark,
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
