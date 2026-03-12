import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger';
import { PaymentModule } from '../payment';
import { RewardsModule } from '../rewards';
import { SharedDomainModule } from '../shared';
import { StatsModule } from '../stats';
import { VolumeModule } from '../volume';
import { CheckinController } from './checkin.controller';
import { CheckinPolicyEngine } from './engines/checkin-policy.engine';
import { CheckinRepository } from './repositories/checkin.repository';
import { CheckinApplicationService } from './services/checkin-application.service';

@Module({
  imports: [
    SharedDomainModule,
    PaymentModule,
    LedgerModule,
    StatsModule,
    VolumeModule,
    RewardsModule,
  ],
  controllers: [CheckinController],
  providers: [
    CheckinApplicationService,
    CheckinPolicyEngine,
    CheckinRepository,
  ],
  exports: [CheckinApplicationService, CheckinPolicyEngine, CheckinRepository],
})
export class CheckinModule {}
