import { AuraLedger, DbService, LedgerSourceType, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class LedgerRepository {
  constructor(private readonly db: DbService) {}

  async findConfirmedBySource(
    data: {
      sourceRefId: string;
      sourceType: LedgerSourceType;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<AuraLedger | null> {
    return executor.auraLedger.findFirst({
      where: {
        sourceRefId: data.sourceRefId,
        sourceType: data.sourceType,
        status: 'CONFIRMED',
        userId: data.userId,
      },
    });
  }

  async createReferralReward(
    data: {
      amount: Prisma.Decimal;
      checkinId: string;
      notes?: string;
      sourceRefId: string;
      sourceType: 'DIRECT_REFERRAL' | 'INDIRECT_REFERRAL';
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<AuraLedger> {
    return executor.auraLedger.create({
      data: {
        amount: data.amount,
        assetType: 'AURA',
        checkinId: data.checkinId,
        notes: data.notes,
        sourceRefId: data.sourceRefId,
        sourceRefType: 'CHECKIN',
        sourceType: data.sourceType,
        status: 'CONFIRMED',
        userId: data.userId,
      },
    });
  }

  async createConsolationReward(
    data: {
      amount: Prisma.Decimal;
      epochId: string;
      notes?: string;
      sourceRefId: string;
      sourceRefType?: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<AuraLedger> {
    return executor.auraLedger.create({
      data: {
        amount: data.amount,
        assetType: 'AURA',
        epochId: data.epochId,
        notes: data.notes,
        sourceRefId: data.sourceRefId,
        sourceRefType: data.sourceRefType ?? 'WEEKLY_REWARD',
        sourceType: 'CONSOLATION',
        status: 'CONFIRMED',
        userId: data.userId,
      },
    });
  }

  async createCheckinReward(
    data: {
      amount: Prisma.Decimal;
      checkinId: string;
      notes?: string;
      sourceRefId: string;
      sourceRefType: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<AuraLedger> {
    return executor.auraLedger.create({
      data: {
        amount: data.amount,
        assetType: 'AURA',
        checkinId: data.checkinId,
        notes: data.notes,
        sourceRefId: data.sourceRefId,
        sourceRefType: data.sourceRefType,
        sourceType: 'CHECKIN',
        status: 'CONFIRMED',
        userId: data.userId,
      },
    });
  }

  async sumConfirmedConsolationAmountByUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<Prisma.Decimal> {
    const result = await executor.auraLedger.aggregate({
      where: {
        sourceType: 'CONSOLATION',
        status: 'CONFIRMED',
        userId,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  async sumConfirmedConsolationAmountByUserAndEpoch(
    data: {
      epochId: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<Prisma.Decimal> {
    const result = await executor.auraLedger.aggregate({
      where: {
        epochId: data.epochId,
        sourceType: 'CONSOLATION',
        status: 'CONFIRMED',
        userId: data.userId,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? new Prisma.Decimal(0);
  }
}
