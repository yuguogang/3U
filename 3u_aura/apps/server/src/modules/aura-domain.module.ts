import { Module } from '@nestjs/common';
import { AuditModule } from './audit';
import { AdminModule } from './admin';
import { CheckinModule } from './checkin';
import { ClaimsModule } from './claims';
import { EpochModule } from './epoch';
import { LedgerModule } from './ledger';
import { LotteryModule } from './lottery';
import { MerkleModule } from './merkle';
import { NftEligibilityModule } from './nft-eligibility';
import { PaymentModule } from './payment';
import { RankingModule } from './ranking';
import { ReferralModule } from './referral';
import { RewardsModule } from './rewards';
import { SharedDomainModule } from './shared';
import { SigningModule } from './signing';
import { StatsModule } from './stats';
import { TreeModule } from './tree';
import { VolumeModule } from './volume';

@Module({
  imports: [
    SharedDomainModule,
    AdminModule,
    CheckinModule,
    PaymentModule,
    ClaimsModule,
    LedgerModule,
    StatsModule,
    ReferralModule,
    TreeModule,
    VolumeModule,
    RewardsModule,
    EpochModule,
    LotteryModule,
    RankingModule,
    MerkleModule,
    NftEligibilityModule,
    SigningModule,
    AuditModule,
  ],
})
export class AuraDomainModule {}
