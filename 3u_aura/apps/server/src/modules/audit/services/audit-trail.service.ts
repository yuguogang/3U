import { DomainAuditEvent } from '../../shared';
import { Injectable } from '@nestjs/common';
import { AuditPolicyEngine } from '../engines/audit-policy.engine';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Injectable()
export class AuditTrailService {
  constructor(
    private readonly auditPolicyEngine: AuditPolicyEngine,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async record(event: DomainAuditEvent): Promise<void> {
    this.auditPolicyEngine.normalize(event);
    await this.auditLogRepository.append(event);
  }
}
