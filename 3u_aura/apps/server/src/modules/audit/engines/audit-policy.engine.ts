import { DomainAuditEvent } from '../../shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditPolicyEngine {
  normalize(event: DomainAuditEvent): DomainAuditEvent {
    return event;
  }
}
