import { DomainAuditEvent } from '../../shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogRepository {
  async append(_event: DomainAuditEvent): Promise<void> {
    // Concrete audit persistence lands in a later phase once audit storage is finalized.
  }
}
