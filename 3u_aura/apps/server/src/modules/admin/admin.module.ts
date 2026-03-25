import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user';
import { AuditModule } from '../audit';
import { CheckinModule } from '../checkin';
import { ClaimsModule } from '../claims';
import { EpochModule } from '../epoch';
import { LotteryModule } from '../lottery';
import { NftEligibilityModule } from '../nft-eligibility';
import { WeeklyRewardRepository } from '../rewards';
import { AdminConsoleController } from './admin-console.controller';
import { AdminOpsController } from './admin-ops.controller';
import { AdminConsoleRepository } from './repositories/admin-console.repository';
import { AdminConsoleService } from './services/admin-console.service';
import { AdminOpsService } from './services/admin-ops.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    CheckinModule,
    ClaimsModule,
    EpochModule,
    LotteryModule,
    NftEligibilityModule,
    UserModule,
  ],
  controllers: [AdminConsoleController, AdminOpsController],
  providers: [
    AdminConsoleRepository,
    AdminConsoleService,
    AdminOpsService,
    WeeklyRewardRepository,
  ],
  exports: [AdminConsoleRepository, AdminConsoleService, AdminOpsService],
})
export class AdminModule {}
