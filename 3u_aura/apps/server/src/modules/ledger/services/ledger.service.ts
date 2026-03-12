import { Injectable, NotImplementedException } from '@nestjs/common';
import { LedgerPolicyEngine } from '../engines/ledger-policy.engine';
import { LedgerRepository } from '../repositories/ledger.repository';

@Injectable()
export class LedgerService {
  constructor(
    private readonly ledgerPolicyEngine: LedgerPolicyEngine,
    private readonly ledgerRepository: LedgerRepository,
  ) {}

  async appendForSource(_sourceRefId: string): Promise<void> {
    void this.ledgerPolicyEngine;
    void this.ledgerRepository;
    throw new NotImplementedException('Implemented in Phase2-Checkin-Accounting');
  }
}
