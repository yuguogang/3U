import { Module } from '@nestjs/common';
import { WeeklyRewardRepository } from '../rewards/repositories/weekly-reward.repository';
import { SharedDomainModule } from '../shared';
import { ClaimsController } from './controllers/claims.controller';
import { ClaimSyncChainRepository } from './repositories/claim-sync-chain.repository';
import { ClaimRecordRepository } from './repositories/claim-record.repository';
import { NftSubsidyClaimRepository } from './repositories/nft-subsidy-claim.repository';
import { ClaimPublicationService } from './services/claim-publication.service';
import { ClaimSyncService } from './services/claim-sync.service';
import { ClaimsReadService } from './services/claims-read.service';

@Module({
  imports: [SharedDomainModule],
  controllers: [ClaimsController],
  providers: [
    ClaimSyncChainRepository,
    ClaimSyncService,
    ClaimRecordRepository,
    NftSubsidyClaimRepository,
    WeeklyRewardRepository,
    ClaimsReadService,
    ClaimPublicationService,
  ],
  exports: [
    ClaimSyncChainRepository,
    ClaimSyncService,
    ClaimRecordRepository,
    NftSubsidyClaimRepository,
    WeeklyRewardRepository,
    ClaimsReadService,
    ClaimPublicationService,
  ],
})
export class ClaimsModule {}
