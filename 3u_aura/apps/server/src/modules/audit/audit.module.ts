import { Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { AuditPolicyEngine } from './engines/audit-policy.engine';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditTrailService } from './services/audit-trail.service';

@Module({
  imports: [SharedDomainModule],
  providers: [AuditTrailService, AuditPolicyEngine, AuditLogRepository],
  exports: [AuditTrailService, AuditPolicyEngine, AuditLogRepository],
})
export class AuditModule {}
