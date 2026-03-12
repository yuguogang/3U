import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedDomainModule } from '../shared';
import { StatsModule } from '../stats';
import { WeeklyEpochPolicyEngine } from './engines/weekly-epoch-policy.engine';
import { WeeklyEpochRepository } from './repositories/weekly-epoch.repository';
import { WeeklyEpochApplicationService } from './services/weekly-epoch-application.service';
import { WeeklyEpochController } from './weekly-epoch.controller';

@Module({
  imports: [ConfigModule, SharedDomainModule, StatsModule],
  controllers: [WeeklyEpochController],
  providers: [
    WeeklyEpochApplicationService,
    WeeklyEpochPolicyEngine,
    WeeklyEpochRepository,
  ],
  exports: [
    WeeklyEpochApplicationService,
    WeeklyEpochPolicyEngine,
    WeeklyEpochRepository,
  ],
})
export class EpochModule {}
