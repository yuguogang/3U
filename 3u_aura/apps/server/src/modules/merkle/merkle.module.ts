import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClaimsModule } from '../claims';
import { EpochModule } from '../epoch';
import { WeeklyRewardRepository } from '../rewards/repositories/weekly-reward.repository';
import { SharedDomainModule } from '../shared';
import { MerkleDraftEngine } from './engines/merkle-draft.engine';
import { MerkleLeafRepository } from './repositories/merkle-leaf.repository';
import { MerkleDraftService } from './services/merkle-draft.service';

@Module({
  imports: [ConfigModule, SharedDomainModule, ClaimsModule, EpochModule],
  providers: [
    MerkleDraftEngine,
    MerkleLeafRepository,
    MerkleDraftService,
    WeeklyRewardRepository,
  ],
  exports: [MerkleDraftEngine, MerkleLeafRepository, MerkleDraftService],
})
export class MerkleModule {}
