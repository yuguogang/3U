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
        isParticipating: true,
        ticketCount: { gt: 0 },
      },
      orderBy: { userId: 'asc' },
      select: {
        userId: true,
      },
    });
  }

  async findByEpochAndUser(
    epochId: string,
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<LotteryTicket | null> {
    return executor.lotteryTicket.findUnique({
      where: {
        epochId_userId: {
          epochId,
          userId,
        },
      },
    });
  }

  async listUnrevealedParticipatingEpochIdsForUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<string[]> {
    const tickets = await executor.lotteryTicket.findMany({
      where: {
        userId,
        isParticipating: true,
        isResultRevealed: false,
      },
      select: {
        epochId: true,
      },
    });

    return tickets.map((ticket) => ticket.epochId);
  }

  async markParticipating(
    data: {
      epochId: string;
      isEligible: boolean;
      participatedAt: Date;
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
        isParticipating: true,
        participatedAt: data.participatedAt,
        streakDays: data.streakDays,
        ticketCount: data.ticketCount,
        userId: data.userId,
      },
      update: {
        isEligible: data.isEligible,
        isParticipating: true,
        participatedAt: data.participatedAt,
        streakDays: data.streakDays,
        ticketCount: data.ticketCount,
      },
    });
  }

  async markResultRevealed(
    data: {
      epochId: string;
      revealedAt: Date;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<LotteryTicket> {
    return executor.lotteryTicket.update({
      where: {
        epochId_userId: {
          epochId: data.epochId,
          userId: data.userId,
        },
      },
      data: {
        isResultRevealed: true,
        revealedAt: data.revealedAt,
      },
    });
  }

  async countEpochTicketState(
    epochId: string,
    executor: DbExecutor = this.db,
  ): Promise<{
    participantCount: number;
    qualifiedTicketCount: number;
  }> {
    const [qualifiedTicketCount, participantCount] = await Promise.all([
      executor.lotteryTicket.count({
        where: {
          epochId,
          isEligible: true,
          ticketCount: { gt: 0 },
        },
      }),
      executor.lotteryTicket.count({
        where: {
          epochId,
          isEligible: true,
          isParticipating: true,
          ticketCount: { gt: 0 },
        },
      }),
    ]);

    return {
      participantCount,
      qualifiedTicketCount,
    };
  }
}
