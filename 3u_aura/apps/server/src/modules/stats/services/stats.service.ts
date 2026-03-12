import { Injectable, NotImplementedException } from '@nestjs/common';
import { StatsPolicyEngine } from '../engines/stats-policy.engine';
import { StatsRepository } from '../repositories/stats.repository';

@Injectable()
export class StatsService {
  constructor(
    private readonly statsPolicyEngine: StatsPolicyEngine,
    private readonly statsRepository: StatsRepository,
  ) {}

  async refreshDailyProjection(_userId: string, _dateKey: string): Promise<void> {
    void this.statsPolicyEngine;
    void this.statsRepository;
    throw new NotImplementedException('Implemented in Phase2-Checkin-Accounting');
  }
}
