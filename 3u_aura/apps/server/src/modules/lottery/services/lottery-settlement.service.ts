import { Prisma, WeeklyEpoch } from '@/db';
import { Injectable } from '@nestjs/common';
import { WeeklyRewardRepository } from '../../rewards/repositories/weekly-reward.repository';
import { LotteryPayoutEngine } from '../engines/lottery-payout.engine';
import { LotteryTicketRepository } from '../repositories/lottery-ticket.repository';

export interface LotterySettlementResult {
  consolationCount: number;
  draftRewardCount: number;
  lotteryRolloverUsdt: string;
}

@Injectable()
export class LotterySettlementService {
  constructor(
    private readonly lotteryPayoutEngine: LotteryPayoutEngine,
    private readonly lotteryTicketRepository: LotteryTicketRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async materializeForEpoch(
    epoch: WeeklyEpoch,
    tx: Prisma.TransactionClient,
  ): Promise<LotterySettlementResult> {
    if (epoch.lotteryStatus === 'CANCELLED') {
      await this.weeklyRewardRepository.deleteDraftRewardsByTypes(
        {
          epochId: epoch.id,
          rewardTypes: ['LOTTERY_USDT', 'CONSOLATION_AURA'],
        },
        tx,
      );

      return {
        consolationCount: 0,
        draftRewardCount: 0,
        lotteryRolloverUsdt: epoch.lotteryPoolUsdt.toFixed(0),
      };
    }

    const participants =
      await this.lotteryTicketRepository.listEligibleTicketsForSettlement(
        epoch.id,
        tx,
      );
    const participantUserIds = participants.flatMap((item) =>
      Array.from({ length: item.ticketCount }, () => item.userId),
    );
    const projection = this.lotteryPayoutEngine.projectPayout({
      epochId: epoch.id,
      lotteryPoolUsdt: epoch.lotteryPoolUsdt.toFixed(0),
      participantUserIds,
    });

    await this.weeklyRewardRepository.deleteDraftRewardsByTypes(
      {
        epochId: epoch.id,
        rewardTypes: ['LOTTERY_USDT', 'CONSOLATION_AURA'],
      },
      tx,
    );

    for (const winner of projection.winners) {
      await this.weeklyRewardRepository.createReward(
        {
          amountUsdt: new Prisma.Decimal(winner.amountUsdt),
          distributionKey: winner.distributionKey,
          epochId: epoch.id,
          rewardType: 'LOTTERY_USDT',
          sourceNote: `Lottery ${winner.prizeLabel.toLowerCase()} winner`,
          userId: winner.userId,
        },
        tx,
      );
    }

    for (const [index, userId] of projection.consolationUserIds.entries()) {
      await this.weeklyRewardRepository.createReward(
        {
          amountAura: new Prisma.Decimal((100n * 10n ** 18n).toString()),
          distributionKey: `CONSOLATION_DEFAULT_${index + 1}`,
          epochId: epoch.id,
          rewardType: 'CONSOLATION_AURA',
          sourceNote: 'Lottery consolation reward',
          userId,
        },
        tx,
      );
    }

    return {
      consolationCount: projection.consolationUserIds.length,
      draftRewardCount:
        projection.winners.length + projection.consolationUserIds.length,
      lotteryRolloverUsdt: projection.rolloverUsdt,
    };
  }
}
