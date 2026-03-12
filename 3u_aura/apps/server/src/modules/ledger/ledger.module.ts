import { Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { LedgerPolicyEngine } from './engines/ledger-policy.engine';
import { LedgerRepository } from './repositories/ledger.repository';
import { LedgerService } from './services/ledger.service';

@Module({
  imports: [SharedDomainModule],
  providers: [LedgerService, LedgerPolicyEngine, LedgerRepository],
  exports: [LedgerService, LedgerPolicyEngine, LedgerRepository],
})
export class LedgerModule {}
