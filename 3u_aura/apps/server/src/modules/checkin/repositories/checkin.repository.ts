import { Checkin, DbService, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;
type CheckinWithPaymentReceipt = Prisma.CheckinGetPayload<{
  include: { paymentReceipt: true };
}>;

@Injectable()
export class CheckinRepository {
  constructor(private readonly db: DbService) {}

  async findByTxHashKey(
    txHashKey: string,
    executor: DbExecutor = this.db,
  ): Promise<CheckinWithPaymentReceipt | null> {
    return executor.checkin.findUnique({
      where: { txHashKey },
      include: { paymentReceipt: true },
    });
  }

  async findLatestForDate(
    userId: string,
    dateKey: string,
    executor: DbExecutor = this.db,
  ): Promise<Pick<Checkin, 'checkinCountToday'> | null> {
    return executor.checkin.findFirst({
      where: { dateKey, userId },
      orderBy: { checkinCountToday: 'desc' },
      select: { checkinCountToday: true },
    });
  }

  async createConfirmedCheckin(
    data: {
      chainId: number;
      checkinCountToday: number;
      confirmedAt: Date;
      dateKey: string;
      isCountedForStreak: boolean;
      payAmountUsdt: Prisma.Decimal;
      payToken: string;
      rewardAuraAmount: Prisma.Decimal;
      txHash: string;
      txHashKey: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<Checkin> {
    return executor.checkin.create({
      data: {
        chainId: data.chainId,
        checkinCountToday: data.checkinCountToday,
        confirmedAt: data.confirmedAt,
        dateKey: data.dateKey,
        isCountedForStreak: data.isCountedForStreak,
        payAmountUsdt: data.payAmountUsdt,
        payToken: data.payToken,
        rewardAuraAmount: data.rewardAuraAmount,
        status: 'CONFIRMED',
        txHash: data.txHash,
        txHashKey: data.txHashKey,
        userId: data.userId,
      },
    });
  }
}
