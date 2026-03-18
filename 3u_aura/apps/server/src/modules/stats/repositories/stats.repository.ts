import {
  DbService,
  PoolSplitFact,
  Prisma,
  UserDailyStat,
  UserProfile,
} from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class StatsRepository {
  constructor(private readonly db: DbService) {}

  async findUserProfile(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<UserProfile | null> {
    return executor.userProfile.findUnique({
      where: { userId },
    });
  }

  async findDailyStat(
    userId: string,
    dateKey: string,
    executor: DbExecutor = this.db,
  ): Promise<UserDailyStat | null> {
    return executor.userDailyStat.findUnique({
      where: {
        userId_dateKey: {
          dateKey,
          userId,
        },
      },
    });
  }

  async ensureUserProfile(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async upsertDailyProjectionForCheckin(
    data: {
      countedCheckinDaysIncrement: number;
      dateKey: string;
      rewardAuraAmount: Prisma.Decimal;
      userId: string;
      volumeAmount: Prisma.Decimal;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserDailyStat> {
    return executor.userDailyStat.upsert({
      where: {
        userId_dateKey: {
          dateKey: data.dateKey,
          userId: data.userId,
        },
      },
      create: {
        countedCheckinDays: data.countedCheckinDaysIncrement,
        checkinTimes: 1,
        dateKey: data.dateKey,
        selfAuraReward: data.rewardAuraAmount,
        selfVolumeUsdt: data.volumeAmount,
        userId: data.userId,
      },
      update: {
        countedCheckinDays: {
          increment: data.countedCheckinDaysIncrement,
        },
        checkinTimes: {
          increment: 1,
        },
        selfAuraReward: {
          increment: data.rewardAuraAmount,
        },
        selfVolumeUsdt: {
          increment: data.volumeAmount,
        },
      },
    });
  }

  async applyProfileCheckinProjection(
    data: {
      currentStreakDays: number;
      lastCheckinDate: Date;
      maxStreakDays: number;
      rewardAuraAmount: Prisma.Decimal;
      totalCheckinDaysIncrement: number;
      userId: string;
      volumeAmount: Prisma.Decimal;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.update({
      where: { userId: data.userId },
      data: {
        currentStreakDays: data.currentStreakDays,
        lastCheckinDate: data.lastCheckinDate,
        maxStreakDays: data.maxStreakDays,
        totalAuraFromCheckin: {
          increment: data.rewardAuraAmount,
        },
        totalCheckinCount: {
          increment: 1,
        },
        totalCheckinDays: {
          increment: data.totalCheckinDaysIncrement,
        },
        totalCheckinUsdt: {
          increment: data.volumeAmount,
        },
      },
    });
  }

  async createPoolSplitFact(
    data: {
      checkinId: string;
      dateKey: string;
      lotteryAmount: Prisma.Decimal;
      paymentReceiptId: string;
      totalAmount: Prisma.Decimal;
      treasuryAmount: Prisma.Decimal;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<PoolSplitFact> {
    return executor.poolSplitFact.create({
      data: {
        checkinId: data.checkinId,
        dateKey: data.dateKey,
        lotteryAmountUsdt: data.lotteryAmount,
        paymentReceiptId: data.paymentReceiptId,
        totalAmountUsdt: data.totalAmount,
        treasuryAmountUsdt: data.treasuryAmount,
        userId: data.userId,
      },
    });
  }

  async upsertDailyTeamVolumeProjection(
    data: {
      dateKey: string;
      leftVolumeUsdt: Prisma.Decimal;
      rightVolumeUsdt: Prisma.Decimal;
      smallLegVolumeUsdt: Prisma.Decimal;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserDailyStat> {
    return executor.userDailyStat.upsert({
      where: {
        userId_dateKey: {
          dateKey: data.dateKey,
          userId: data.userId,
        },
      },
      create: {
        dateKey: data.dateKey,
        leftVolumeUsdt: data.leftVolumeUsdt,
        rightVolumeUsdt: data.rightVolumeUsdt,
        smallLegVolumeUsdt: data.smallLegVolumeUsdt,
        userId: data.userId,
      },
      update: {
        leftVolumeUsdt: data.leftVolumeUsdt,
        rightVolumeUsdt: data.rightVolumeUsdt,
        smallLegVolumeUsdt: data.smallLegVolumeUsdt,
      },
    });
  }

  async applyProfileTeamVolumeProjection(
    data: {
      leftTeamVolume: Prisma.Decimal;
      rightTeamVolume: Prisma.Decimal;
      smallLegVolume: Prisma.Decimal;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.update({
      where: { userId: data.userId },
      data: {
        leftTeamVolume: data.leftTeamVolume,
        rightTeamVolume: data.rightTeamVolume,
        smallLegVolume: data.smallLegVolume,
      },
    });
  }

  async upsertDailyReferralRewardProjection(
    data: {
      dateKey: string;
      directReferralAura?: Prisma.Decimal;
      indirectReferralAura?: Prisma.Decimal;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserDailyStat> {
    return executor.userDailyStat.upsert({
      where: {
        userId_dateKey: {
          dateKey: data.dateKey,
          userId: data.userId,
        },
      },
      create: {
        dateKey: data.dateKey,
        directReferralAura: data.directReferralAura ?? new Prisma.Decimal(0),
        indirectReferralAura:
          data.indirectReferralAura ?? new Prisma.Decimal(0),
        userId: data.userId,
      },
      update: {
        directReferralAura: data.directReferralAura
          ? { increment: data.directReferralAura }
          : undefined,
        indirectReferralAura: data.indirectReferralAura
          ? { increment: data.indirectReferralAura }
          : undefined,
      },
    });
  }

  async applyProfileReferralRewardProjection(
    data: {
      directReferralAura?: Prisma.Decimal;
      indirectReferralAura?: Prisma.Decimal;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.update({
      where: { userId: data.userId },
      data: {
        totalAuraFromDirect: data.directReferralAura
          ? { increment: data.directReferralAura }
          : undefined,
        totalAuraFromIndirect: data.indirectReferralAura
          ? { increment: data.indirectReferralAura }
          : undefined,
      },
    });
  }

  async setPurchasedNftFlag(
    data: {
      hasPurchasedNft: boolean;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.update({
      where: { userId: data.userId },
      data: {
        hasPurchasedNft: data.hasPurchasedNft,
      },
    });
  }

  async setReferralNftFlag(
    data: {
      hasReferralNft: boolean;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.update({
      where: { userId: data.userId },
      data: {
        hasReferralNft: data.hasReferralNft,
      },
    });
  }

  async applyProfileConsolationProjection(
    data: {
      amountAura: Prisma.Decimal;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserProfile> {
    return executor.userProfile.update({
      where: { userId: data.userId },
      data: {
        totalAuraFromConsolation: {
          increment: data.amountAura,
        },
      },
    });
  }

  async upsertDailyConsolationProjection(
    data: {
      amountAura: Prisma.Decimal;
      dateKey: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<UserDailyStat> {
    return executor.userDailyStat.upsert({
      where: {
        userId_dateKey: {
          dateKey: data.dateKey,
          userId: data.userId,
        },
      },
      create: {
        consolationAura: data.amountAura,
        dateKey: data.dateKey,
        userId: data.userId,
      },
      update: {
        consolationAura: {
          increment: data.amountAura,
        },
      },
    });
  }

  async summarizeEpochCheckinDays(
    data: {
      dateKeyFromInclusive: string;
      dateKeyToExclusive: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<
    Array<{
      countedCheckinDays: number;
      lastQualifiedDateKey?: string;
      userId: string;
    }>
  > {
    const rows = await executor.userDailyStat.groupBy({
      by: ['userId'],
      where: {
        countedCheckinDays: { gt: 0 },
        dateKey: {
          gte: data.dateKeyFromInclusive,
          lt: data.dateKeyToExclusive,
        },
      },
      _max: {
        dateKey: true,
      },
      _sum: {
        countedCheckinDays: true,
      },
    });

    return rows.map((row) => ({
      countedCheckinDays: row._sum.countedCheckinDays ?? 0,
      lastQualifiedDateKey: row._max.dateKey ?? undefined,
      userId: row.userId,
    }));
  }

  async aggregateEpochLotteryPool(
    data: {
      dateKeyFromInclusive: string;
      dateKeyToExclusive: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<Prisma.Decimal> {
    const result = await executor.poolSplitFact.aggregate({
      where: {
        dateKey: {
          gte: data.dateKeyFromInclusive,
          lt: data.dateKeyToExclusive,
        },
      },
      _sum: {
        lotteryAmountUsdt: true,
      },
    });

    return result._sum.lotteryAmountUsdt ?? new Prisma.Decimal(0);
  }
}
