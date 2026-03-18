import { Module } from '@nestjs/common';
import { EpochModule } from '../epoch';
import { NftEligibilityModule } from '../nft-eligibility';
import { StatsModule } from '../stats';
import { WeeklyRewardRepository } from '../rewards/repositories/weekly-reward.repository';
import { SharedDomainModule } from '../shared';
import { ClaimsController } from './controllers/claims.controller';
import { ClaimSyncChainRepository } from './repositories/claim-sync-chain.repository';
import { ClaimRecordRepository } from './repositories/claim-record.repository';
import { NftHoldingRepository } from './repositories/nft-holding.repository';
import { NftSubsidyClaimRepository } from './repositories/nft-subsidy-claim.repository';
import { PurchasedNftChainRepository } from './repositories/purchased-nft-chain.repository';
import { ReferralNftChainRepository } from './repositories/referral-nft-chain.repository';
import { ClaimPublicationService } from './services/claim-publication.service';
import { ClaimSyncService } from './services/claim-sync.service';
import { ClaimsReadService } from './services/claims-read.service';
import { PurchasedNftSyncService } from './services/purchased-nft-sync.service';
import { ReferralNftSyncService } from './services/referral-nft-sync.service';

@Module({
  imports: [SharedDomainModule, StatsModule, EpochModule, NftEligibilityModule],
  controllers: [ClaimsController],
  providers: [
    ClaimSyncChainRepository,
    ClaimSyncService,
    ClaimRecordRepository,
    NftHoldingRepository,
    NftSubsidyClaimRepository,
    PurchasedNftChainRepository,
    PurchasedNftSyncService,
    ReferralNftChainRepository,
    ReferralNftSyncService,
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
    ReferralNftChainRepository,
    ReferralNftSyncService,
    WeeklyRewardRepository,
    ClaimsReadService,
    ClaimPublicationService,
  ],
})
export class ClaimsModule {}
