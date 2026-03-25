import { Module } from '@nestjs/common';
import { EpochModule } from '../epoch';
import { LedgerModule } from '../ledger';
import { LotteryModule } from '../lottery';
import { MerkleModule } from '../merkle';
import { RankingModule } from '../ranking';
import { ReferralModule } from '../referral';
import { SharedDomainModule } from '../shared';
import { StatsModule } from '../stats';
import { RewardsController } from './controllers/rewards.controller';
import { RewardAllocationEngine } from './engines/reward-allocation.engine';
import { WeeklyRewardRepository } from './repositories/weekly-reward.repository';
import { RewardPublicationService } from './services/reward-publication.service';
import { RewardsReadService } from './services/rewards-read.service';
import { RewardsService } from './services/rewards.service';

@Module({
  imports: [
    SharedDomainModule,
    EpochModule,
    LedgerModule,
    LotteryModule,
    MerkleModule,
    RankingModule,
    ReferralModule,
    StatsModule,
  ],
  controllers: [RewardsController],
  providers: [
    RewardsService,
    RewardsReadService,
    RewardPublicationService,
    RewardAllocationEngine,
    WeeklyRewardRepository,
  ],
  exports: [
    RewardsService,
    RewardsReadService,
    RewardPublicationService,
    RewardAllocationEngine,
    WeeklyRewardRepository,
  ],
})
export class RewardsModule {}
