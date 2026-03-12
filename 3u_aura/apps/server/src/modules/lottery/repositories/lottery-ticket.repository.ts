import { DbService, LotteryTicket, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class LotteryTicketRepository {
  constructor(private readonly db: DbService) {}

  async upsertTicket(
    data: {
      epochId: string;
      isEligible: boolean;
      qualifiedAt?: Date;
      streakDays: number;
      ticketCount: number;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<LotteryTicket> {
    return executor.lotteryTicket.upsert({
      where: {
        epochId_userId: {
          epochId: data.epochId,
          userId: data.userId,
        },
      },
      create: {
        epochId: data.epochId,
        isEligible: data.isEligible,
        qualifiedAt: data.qualifiedAt,
        streakDays: data.streakDays,
        ticketCount: data.ticketCount,
        userId: data.userId,
      },
      update: {
        isEligible: data.isEligible,
        qualifiedAt: data.qualifiedAt,
        streakDays: data.streakDays,
        ticketCount: data.ticketCount,
      },
    });
  }

  async clearTicketsOutsideUserSet(
    data: {
      epochId: string;
      userIds: string[];
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.lotteryTicket.updateMany({
      where: {
        epochId: data.epochId,
        ...(data.userIds.length ? { userId: { notIn: data.userIds } } : {}),
      },
      data: {
        isEligible: false,
        qualifiedAt: null,
        streakDays: 0,
        ticketCount: 0,
      },
    });
  }

  async listEligibleTicketsForSettlement(
    epochId: string,
    executor: DbExecutor = this.db,
  ): Promise<Array<{ userId: string }>> {
    return executor.lotteryTicket.findMany({
      where: {
        epochId,
        isEligible: true,
        ticketCount: { gt: 0 },
      },
      orderBy: { userId: 'asc' },
      select: {
        userId: true,
      },
    });
  }
}
