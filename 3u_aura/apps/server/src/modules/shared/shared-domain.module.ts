import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '@/db';
import { AuditSeamService } from './services/audit-seam.service';
import { IdempotencySeamService } from './services/idempotency-seam.service';
import { PromotionChainClientService } from './services/promotion-chain-client.service';
import { TransactionOrchestratorService } from './services/transaction-orchestrator.service';

@Module({
  imports: [ConfigModule, DbModule],
  providers: [
    AuditSeamService,
    IdempotencySeamService,
    PromotionChainClientService,
    TransactionOrchestratorService,
  ],
  exports: [
    AuditSeamService,
    IdempotencySeamService,
    PromotionChainClientService,
    TransactionOrchestratorService,
  ],
})
export class SharedDomainModule {}
