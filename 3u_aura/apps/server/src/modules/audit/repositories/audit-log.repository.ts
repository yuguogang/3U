import { DbService } from '@/db';
import { DomainAuditEvent } from '../../shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly db: DbService) {}

  async append(event: DomainAuditEvent): Promise<void> {
    await this.db.adminAuditLog.create({
      data: {
        action: event.action,
        operatorWallet: event.operatorWallet,
        payload: {
          actorId: event.actorId,
          entityId: event.entityId,
          metadata: event.metadata,
          payload: event.payload,
        },
        targetId: event.targetId,
        targetType: event.targetType,
      },
    });
  }
}
