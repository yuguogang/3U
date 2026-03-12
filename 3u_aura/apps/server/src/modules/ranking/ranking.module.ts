import { Module } from '@nestjs/common';
import { EpochModule } from '../epoch';
import { WeeklyRewardRepository } from '../rewards/repositories/weekly-reward.repository';
import { SharedDomainModule } from '../shared';
import { RankingPayoutEngine } from './engines/ranking-payout.engine';
import { RankingSnapshotRepository } from './repositories/ranking-snapshot.repository';
import { RankingSettlementService } from './services/ranking-settlement.service';

@Module({
  imports: [SharedDomainModule, EpochModule],
  providers: [
    RankingPayoutEngine,
    RankingSnapshotRepository,
    RankingSettlementService,
    WeeklyRewardRepository,
  ],
  exports: [
    RankingPayoutEngine,
    RankingSnapshotRepository,
    RankingSettlementService,
  ],
})
export class RankingModule {}
