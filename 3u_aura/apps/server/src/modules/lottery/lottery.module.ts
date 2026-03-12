import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EpochModule } from '../epoch';
import { LedgerModule } from '../ledger';
import { WeeklyRewardRepository } from '../rewards/repositories/weekly-reward.repository';
import { SharedDomainModule } from '../shared';
import { StatsModule } from '../stats';
import { LotteryQualificationEngine } from './engines/lottery-qualification.engine';
import { LotteryPayoutEngine } from './engines/lottery-payout.engine';
import { LotteryTicketRepository } from './repositories/lottery-ticket.repository';
import { LotterySettlementService } from './services/lottery-settlement.service';
import { LotteryTicketService } from './services/lottery-ticket.service';

@Module({
  imports: [
    ConfigModule,
    SharedDomainModule,
    StatsModule,
    EpochModule,
    LedgerModule,
  ],
  providers: [
    LotteryTicketService,
    LotterySettlementService,
    LotteryQualificationEngine,
    LotteryPayoutEngine,
    LotteryTicketRepository,
    WeeklyRewardRepository,
  ],
  exports: [
    LotteryTicketService,
    LotterySettlementService,
    LotteryQualificationEngine,
    LotteryPayoutEngine,
    LotteryTicketRepository,
  ],
})
export class LotteryModule {}
