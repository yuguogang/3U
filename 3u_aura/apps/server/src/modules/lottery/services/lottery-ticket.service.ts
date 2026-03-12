import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { StatsRepository } from '../../stats';
import { WeeklyEpochRepository } from '../../epoch';
import { LotteryQualificationEngine } from '../engines/lottery-qualification.engine';
import { LotteryTicketRepository } from '../repositories/lottery-ticket.repository';

export interface LotteryTicketRefreshResult {
  eligibleUserIds: string[];
  epochId: string;
  participantCount: number;
  qualifiedTicketCount: number;
}

@Injectable()
export class LotteryTicketService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly lotteryQualificationEngine: LotteryQualificationEngine,
    private readonly lotteryTicketRepository: LotteryTicketRepository,
    private readonly statsRepository: StatsRepository,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
  ) {}

  async refreshEligibilityForEpoch(
    epochId: string,
  ): Promise<LotteryTicketRefreshResult> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.weeklyEpochRepository.findById(epochId, tx);
      if (!epoch) {
        throw new NotFoundException('Weekly epoch not found');
      }

      const dateKeyFromInclusive = this.lotteryQualificationEngine.toDateKey(
        epoch.startAt,
      );
      const dateKeyToExclusive = this.lotteryQualificationEngine.toDateKey(
        epoch.endAt,
      );
      const summaries = await this.statsRepository.summarizeEpochCheckinDays(
        {
          dateKeyFromInclusive,
          dateKeyToExclusive,
        },
        tx,
      );
      const touchedUserIds: string[] = [];
      const eligibleUserIds: string[] = [];

      for (const summary of summaries) {
        touchedUserIds.push(summary.userId);
        const isEligible = this.lotteryQualificationEngine.qualifiesForTicket(
          summary.countedCheckinDays,
        );
        if (isEligible) {
          eligibleUserIds.push(summary.userId);
        }

        await this.lotteryTicketRepository.upsertTicket(
          {
            epochId: epoch.id,
            isEligible,
            qualifiedAt: isEligible ? epoch.endAt : undefined,
            streakDays: summary.countedCheckinDays,
            ticketCount: isEligible ? 1 : 0,
            userId: summary.userId,
          },
          tx,
        );
      }

      await this.lotteryTicketRepository.clearTicketsOutsideUserSet(
        {
          epochId: epoch.id,
          userIds: touchedUserIds,
        },
        tx,
      );
      await this.weeklyEpochRepository.updateTicketCounts(
        {
          epochId: epoch.id,
          participantCount: eligibleUserIds.length,
          qualifiedTicketCount: eligibleUserIds.length,
        },
        tx,
      );

      await this.auditSeam.record({
        action: 'lottery.ticket.refresh',
        targetId: epoch.id,
        targetType: 'WeeklyEpoch',
        payload: {
          dateKeyFromInclusive,
          dateKeyToExclusive,
          participantCount: eligibleUserIds.length,
          qualifiedTicketCount: eligibleUserIds.length,
        },
      });

      return {
        eligibleUserIds,
        epochId: epoch.id,
        participantCount: eligibleUserIds.length,
        qualifiedTicketCount: eligibleUserIds.length,
      };
    });
  }
}
