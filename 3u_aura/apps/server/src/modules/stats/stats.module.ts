import { Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { StatsPolicyEngine } from './engines/stats-policy.engine';
import { StatsRepository } from './repositories/stats.repository';
import { StatsService } from './services/stats.service';

@Module({
  imports: [SharedDomainModule],
  providers: [StatsService, StatsPolicyEngine, StatsRepository],
  exports: [StatsService, StatsPolicyEngine, StatsRepository],
})
export class StatsModule {}
