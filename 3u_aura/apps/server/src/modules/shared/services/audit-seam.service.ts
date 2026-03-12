import { Injectable } from '@nestjs/common';

export interface DomainAuditEvent {
  action: string;
  actorId?: string;
  entityId?: string;
  targetType?: string;
  targetId?: string;
  operatorWallet?: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditSeamService {
  async record(_event: DomainAuditEvent): Promise<void> {
    // Intentionally a no-op. Concrete persistence lands in later phases.
  }
}
