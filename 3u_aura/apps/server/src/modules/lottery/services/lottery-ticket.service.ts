import {
  EpochStatus as DbEpochStatus,
  EpochType as DbEpochType,
  Prisma,
} from '@/db';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClaimStatus,
  EpochStatus,
  EpochType,
  PromotionCurrentLotteryParticipationView,
  PromotionLotteryOutcomeView,
} from '3u-aura-common';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { StatsRepository } from '../../stats';
import {
  WeeklyEpochPolicyEngine,
  WeeklyEpochRepository,
} from '../../epoch';
import { WeeklyRewardRepository } from '../../rewards/repositories/weekly-reward.repository';
import { LotteryQualificationEngine } from '../engines/lottery-qualification.engine';
import { LotteryTicketRepository } from '../repositories/lottery-ticket.repository';

export interface LotteryTicketRefreshResult {
  eligibleUserIds: string[];
  epochId: string;
  participantCount: number;
  qualifiedTicketCount: number;
}

type TxExecutor = Prisma.TransactionClient | undefined;

@Injectable()
export class LotteryTicketService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly lotteryQualificationEngine: LotteryQualificationEngine,
    private readonly lotteryTicketRepository: LotteryTicketRepository,
    private readonly statsRepository: StatsRepository,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly weeklyEpochPolicyEngine: WeeklyEpochPolicyEngine,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async getCurrentLotteryForUser(
    userId: string,
  ): Promise<PromotionCurrentLotteryParticipationView> {
    const epoch = await this.resolveCurrentPromotionEpoch();
    const summary = await this.getUserEpochQualification(epoch.id, userId);
    const ticket = await this.lotteryTicketRepository.findByEpochAndUser(
      epoch.id,
      userId,
    );

    return {
      canParticipate:
        epoch.status === DbEpochStatus.OPEN && !ticket?.isParticipating,
      currentStreakDays: summary.countedCheckinDays,
      daysUntilTicket: Math.max(0, 7 - summary.countedCheckinDays),
      endAt: epoch.endAt,
      epochId: epoch.id,
      epochNo: epoch.epochNo,
      epochStatus: epoch.status as EpochStatus,
      isCurrentlyQualified: summary.isEligible,
      isParticipating: ticket?.isParticipating ?? false,
      participatedAt: ticket?.participatedAt ?? undefined,
      startAt: epoch.startAt,
    };
  }

  async participateInCurrentEpoch(
    userId: string,
    requestedEpochId?: string,
  ): Promise<PromotionCurrentLotteryParticipationView> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = requestedEpochId
        ? await this.weeklyEpochRepository.findById(requestedEpochId, tx)
        : await this.resolveCurrentPromotionEpoch(tx);
      if (!epoch || epoch.epochType !== DbEpochType.WEEKLY_PROMOTION) {
        throw new NotFoundException('Weekly promotion epoch not found');
      }
      if (epoch.status !== DbEpochStatus.OPEN) {
        throw new BadRequestException(
          'Lottery participation is only available while the epoch is open',
        );
      }

      const summary = await this.getUserEpochQualification(epoch.id, userId, tx);
      const existing = await this.lotteryTicketRepository.findByEpochAndUser(
        epoch.id,
        userId,
        tx,
      );

      if (!existing?.isParticipating) {
        await this.lotteryTicketRepository.markParticipating(
          {
            epochId: epoch.id,
            isEligible: summary.isEligible,
            participatedAt: new Date(),
            streakDays: summary.countedCheckinDays,
            ticketCount: summary.isEligible ? 1 : 0,
            userId,
          },
          tx,
        );

        await this.auditSeam.record({
          action: 'lottery.ticket.participate',
          payload: {
            epochNo: epoch.epochNo,
            isEligibleAtParticipation: summary.isEligible,
            streakDaysAtParticipation: summary.countedCheckinDays,
          },
          targetId: epoch.id,
          targetType: 'WeeklyEpoch',
        });
      }

      const ticket = await this.lotteryTicketRepository.findByEpochAndUser(
        epoch.id,
        userId,
        tx,
      );

      return {
        canParticipate: false,
        currentStreakDays: summary.countedCheckinDays,
        daysUntilTicket: Math.max(0, 7 - summary.countedCheckinDays),
        endAt: epoch.endAt,
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as EpochStatus,
        isCurrentlyQualified: summary.isEligible,
        isParticipating: ticket?.isParticipating ?? true,
        participatedAt: ticket?.participatedAt ?? undefined,
        startAt: epoch.startAt,
      };
    });
  }

  async revealResultForEpoch(
    userId: string,
    epochId: string,
  ): Promise<PromotionLotteryOutcomeView> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.weeklyEpochRepository.findById(epochId, tx);
      if (!epoch || epoch.epochType !== DbEpochType.WEEKLY_PROMOTION) {
        throw new NotFoundException('Weekly promotion epoch not found');
      }
      if (
        !this.isRevealableEpochStatus(epoch.status)
      ) {
        throw new BadRequestException(
          'Lottery result is not ready to reveal for this epoch',
        );
      }

      const ticket = await this.lotteryTicketRepository.findByEpochAndUser(
        epoch.id,
        userId,
        tx,
      );

      if (ticket?.isParticipating && !ticket.isResultRevealed) {
        await this.lotteryTicketRepository.markResultRevealed(
          {
            epochId: epoch.id,
            revealedAt: new Date(),
            userId,
          },
          tx,
        );

        await this.auditSeam.record({
          action: 'lottery.result.reveal',
          payload: {
            epochNo: epoch.epochNo,
          },
          targetId: epoch.id,
          targetType: 'WeeklyEpoch',
        });
      }

      return this.buildLotteryOutcome(epoch.id, userId, tx);
    });
  }

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
      const ticketState = await this.lotteryTicketRepository.countEpochTicketState(
        epoch.id,
        tx,
      );
      await this.weeklyEpochRepository.updateTicketCounts(
        {
          epochId: epoch.id,
          participantCount: ticketState.participantCount,
          qualifiedTicketCount: ticketState.qualifiedTicketCount,
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
          participantCount: ticketState.participantCount,
          qualifiedTicketCount: ticketState.qualifiedTicketCount,
        },
      });

      return {
        eligibleUserIds,
        epochId: epoch.id,
        participantCount: ticketState.participantCount,
        qualifiedTicketCount: ticketState.qualifiedTicketCount,
      };
    });
  }

  async getLotteryOutcomeForEpoch(
    userId: string,
    epochId: string,
  ): Promise<PromotionLotteryOutcomeView> {
    const epoch = await this.weeklyEpochRepository.findById(epochId);
    if (!epoch || epoch.epochType !== DbEpochType.WEEKLY_PROMOTION) {
      throw new NotFoundException('Weekly promotion epoch not found');
    }

    return this.buildLotteryOutcome(epoch.id, userId);
  }

  private async resolveCurrentPromotionEpoch(tx?: TxExecutor) {
    const projection = this.weeklyEpochPolicyEngine.projectBoundary({
      epochType: EpochType.WEEKLY_PROMOTION,
    });

    return this.weeklyEpochRepository.ensureEpoch(
      {
        endAt: projection.endAt,
        epochNo: projection.epochNo,
        epochType: DbEpochType.WEEKLY_PROMOTION,
        startAt: projection.startAt,
        status: projection.status as DbEpochStatus,
      },
      tx,
    );
  }

  private async getUserEpochQualification(
    epochId: string,
    userId: string,
    tx?: TxExecutor,
  ): Promise<{
    countedCheckinDays: number;
    isEligible: boolean;
  }> {
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
    const summary = await this.statsRepository.summarizeUserEpochCheckinDays(
      {
        dateKeyFromInclusive,
        dateKeyToExclusive,
        userId,
      },
      tx,
    );

    return {
      countedCheckinDays: summary.countedCheckinDays,
      isEligible: this.lotteryQualificationEngine.qualifiesForTicket(
        summary.countedCheckinDays,
      ),
    };
  }

  private async buildLotteryOutcome(
    epochId: string,
    userId: string,
    tx?: TxExecutor,
  ): Promise<PromotionLotteryOutcomeView> {
    const [epoch, ticket, rewards] = await Promise.all([
      this.weeklyEpochRepository.findById(epochId, tx),
      this.lotteryTicketRepository.findByEpochAndUser(epochId, userId, tx),
      this.weeklyRewardRepository.listUserRewardsByEpochAndTypes(
        {
          epochId,
          rewardTypes: ['LOTTERY_USDT', 'CONSOLATION_AURA'],
          userId,
        },
        tx,
      ),
    ]);
    if (!epoch || epoch.epochType !== DbEpochType.WEEKLY_PROMOTION) {
      throw new NotFoundException('Weekly promotion epoch not found');
    }

    const lotteryReward = rewards.find(
      (reward) => reward.rewardType === 'LOTTERY_USDT',
    );
    const consolationReward = rewards.find(
      (reward) => reward.rewardType === 'CONSOLATION_AURA',
    );

    if (!ticket?.isParticipating) {
      return {
        canReveal: false,
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as EpochStatus,
        isEligible: ticket?.isEligible ?? false,
        isParticipating: false,
        isRevealed: ticket?.isResultRevealed ?? false,
        resultStatus: 'NOT_PARTICIPATING',
      };
    }

    if (
      !ticket.isResultRevealed &&
      this.isRevealableEpochStatus(epoch.status)
    ) {
      return {
        canReveal: true,
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as EpochStatus,
        isEligible: ticket.isEligible,
        isParticipating: true,
        isRevealed: false,
        participatedAt: ticket.participatedAt ?? undefined,
        resultStatus: 'PENDING',
      };
    }

    if (epoch.status === DbEpochStatus.CANCELLED) {
      return {
        canReveal: false,
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as EpochStatus,
        isEligible: ticket.isEligible,
        isParticipating: true,
        isRevealed: ticket.isResultRevealed,
        participatedAt: ticket.participatedAt ?? undefined,
        resultStatus: 'ROLLED_OVER',
        revealedAt: ticket.revealedAt ?? undefined,
      };
    }

    if (!ticket.isEligible) {
      return {
        canReveal: false,
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as EpochStatus,
        isEligible: false,
        isParticipating: true,
        isRevealed: ticket.isResultRevealed,
        participatedAt: ticket.participatedAt ?? undefined,
        resultStatus: 'NOT_QUALIFIED',
        revealedAt: ticket.revealedAt ?? undefined,
      };
    }

    if (lotteryReward) {
      return {
        amountUsdt: lotteryReward.amountUsdt.toFixed(0),
        canReveal: false,
        claimRecordId: lotteryReward.claimRecords[0]?.id,
        claimStatus: lotteryReward.claimRecords[0]?.status as
          | ClaimStatus
          | undefined,
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        epochStatus: epoch.status as EpochStatus,
        isEligible: true,
        isParticipating: true,
        isRevealed: true,
        participatedAt: ticket.participatedAt ?? undefined,
        prizeLabel: this.toPrizeLabel(lotteryReward.distributionKey),
        resultStatus: 'WON',
        revealedAt: ticket.revealedAt ?? undefined,
      };
    }

    return {
      amountAura: consolationReward?.amountAura.toFixed(0),
      canReveal: false,
      epochId: epoch.id,
      epochNo: epoch.epochNo,
      epochStatus: epoch.status as EpochStatus,
      isEligible: true,
      isParticipating: true,
      isRevealed: true,
      participatedAt: ticket.participatedAt ?? undefined,
      resultStatus: 'LOST',
      revealedAt: ticket.revealedAt ?? undefined,
    };
  }

  private toPrizeLabel(
    distributionKey: string,
  ): PromotionLotteryOutcomeView['prizeLabel'] {
    if (distributionKey.startsWith('LOTTERY_FIRST_PRIZE')) {
      return 'FIRST';
    }
    if (distributionKey.startsWith('LOTTERY_SECOND_PRIZE')) {
      return 'SECOND';
    }
    if (distributionKey.startsWith('LOTTERY_THIRD_PRIZE')) {
      return 'THIRD';
    }

    return 'LUCKY';
  }

  private isRevealableEpochStatus(status: DbEpochStatus): boolean {
    return (
      status === DbEpochStatus.ROOT_POSTED ||
      status === DbEpochStatus.SETTLED ||
      status === DbEpochStatus.CANCELLED
    );
  }
}
