import { Prisma, WeeklyEpoch } from '@/db';
import { Injectable } from '@nestjs/common';
import { WeeklyRewardRepository } from '../../rewards/repositories/weekly-reward.repository';
import { RankingPayoutEngine } from '../engines/ranking-payout.engine';
import { RankingSnapshotRepository } from '../repositories/ranking-snapshot.repository';

export interface RankingSettlementResult {
  draftRewardCount: number;
  rankingRolloverUsdt: string;
}

@Injectable()
export class RankingSettlementService {
  constructor(
    private readonly rankingPayoutEngine: RankingPayoutEngine,
    private readonly rankingSnapshotRepository: RankingSnapshotRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async materializeForEpoch(
    epoch: WeeklyEpoch,
    dateKeyFromInclusive: string,
    dateKeyToExclusive: string,
    tx: Prisma.TransactionClient,
  ): Promise<RankingSettlementResult> {
    const candidates = await this.rankingSnapshotRepository.listEpochCandidates(
      {
        dateKeyFromInclusive,
        dateKeyToExclusive,
      },
      tx,
    );
    const projection = this.rankingPayoutEngine.projectPayout({
      candidates,
      rankingPoolUsdt: epoch.rankingPoolUsdt.toFixed(0),
    });

    await this.weeklyRewardRepository.deleteDraftRewardsByTypes(
      {
        epochId: epoch.id,
        rewardTypes: ['RANKING_USDT'],
      },
      tx,
    );

    for (const allocation of projection.allocations) {
      await this.weeklyRewardRepository.createReward(
        {
          amountUsdt: new Prisma.Decimal(allocation.amountUsdt),
          distributionKey: allocation.distributionKey,
          epochId: epoch.id,
          rank: allocation.rank,
          rewardType: 'RANKING_USDT',
          sourceNote: `Weekly ranking reward for rank ${allocation.rank}`,
          userId: allocation.userId,
        },
        tx,
      );
    }

    return {
      draftRewardCount: projection.allocations.length,
      rankingRolloverUsdt: projection.rolloverUsdt,
    };
  }
}
