import { Module } from '@nestjs/common';
import { EpochModule } from '../epoch';
import { StatsModule } from '../stats';
import { WeeklyRewardRepository } from '../rewards/repositories/weekly-reward.repository';
import { SharedDomainModule } from '../shared';
import { ClaimsController } from './controllers/claims.controller';
import { ClaimSyncChainRepository } from './repositories/claim-sync-chain.repository';
import { ClaimRecordRepository } from './repositories/claim-record.repository';
import { NftHoldingRepository } from './repositories/nft-holding.repository';
import { NftSubsidyClaimRepository } from './repositories/nft-subsidy-claim.repository';
import { PurchasedNftChainRepository } from './repositories/purchased-nft-chain.repository';
import { ClaimPublicationService } from './services/claim-publication.service';
import { ClaimSyncService } from './services/claim-sync.service';
import { ClaimsReadService } from './services/claims-read.service';
import { PurchasedNftSyncService } from './services/purchased-nft-sync.service';

@Module({
  imports: [SharedDomainModule, StatsModule, EpochModule],
  controllers: [ClaimsController],
  providers: [
    ClaimSyncChainRepository,
    ClaimSyncService,
    ClaimRecordRepository,
    NftHoldingRepository,
    NftSubsidyClaimRepository,
    PurchasedNftChainRepository,
    PurchasedNftSyncService,
    WeeklyRewardRepository,
    ClaimsReadService,
    ClaimPublicationService,
  ],
  exports: [
    ClaimSyncChainRepository,
    ClaimSyncService,
    ClaimRecordRepository,
    NftHoldingRepository,
    NftSubsidyClaimRepository,
    PurchasedNftChainRepository,
    PurchasedNftSyncService,
    WeeklyRewardRepository,
    ClaimsReadService,
    ClaimPublicationService,
  ],
})
export class ClaimsModule {}
