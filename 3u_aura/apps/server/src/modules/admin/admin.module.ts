import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user';
import { AuditModule } from '../audit';
import { CheckinModule } from '../checkin';
import { ClaimsModule } from '../claims';
import { EpochModule } from '../epoch';
import { LotteryModule } from '../lottery';
import { NftEligibilityModule } from '../nft-eligibility';
import { RewardsModule } from '../rewards';
import { SharedDomainModule } from '../shared';
import { AdminConsoleController } from './admin-console.controller';
import { AdminOpsController } from './admin-ops.controller';
import { AdminConsoleRepository } from './repositories/admin-console.repository';
import { AdminConsoleService } from './services/admin-console.service';
import { AdminOpsService } from './services/admin-ops.service';
import { AdminSettlementService } from './services/admin-settlement.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    CheckinModule,
    ClaimsModule,
    EpochModule,
    LotteryModule,
    NftEligibilityModule,
    RewardsModule,
    SharedDomainModule,
    UserModule,
  ],
  controllers: [AdminConsoleController, AdminOpsController],
  providers: [
    AdminConsoleRepository,
    AdminConsoleService,
    AdminOpsService,
    AdminSettlementService,
  ],
  exports: [
    AdminConsoleRepository,
    AdminConsoleService,
    AdminOpsService,
    AdminSettlementService,
  ],
})
export class AdminModule {}
