import { Prisma, type User } from '@/db';
import { Injectable } from '@nestjs/common';
import {
  ReferralBindInviterInput,
  ReferralInviterBindingView,
} from '3u-aura-common';
import { TransactionOrchestratorService } from '../../shared';
import { TreeTopologyService } from '../../tree/services/tree-topology.service';
import { ReferralService } from './referral.service';

type ReferralActor = Pick<User, 'id'>;

@Injectable()
export class ReferralOnboardingService {
  constructor(
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly referralService: ReferralService,
    private readonly treeTopologyService: TreeTopologyService,
  ) {}

  async bindInviterAndAttemptAutoPlacement(
    user: ReferralActor,
    command: ReferralBindInviterInput,
    options?: {
      bindAuditAction?: string;
      bindIdempotentAuditAction?: string;
      placementAuditAction?: string;
      placementDeferredAuditAction?: string;
    },
  ): Promise<ReferralInviterBindingView> {
    const binding = await this.transactionOrchestrator.run((tx) =>
      this.referralService.bindInviterForUserTx(user, command, tx, {
        auditAction:
          options?.bindAuditAction ?? 'referral.bind-inviter.confirmed',
        idempotentAuditAction:
          options?.bindIdempotentAuditAction ??
          'referral.bind-inviter.idempotent',
      }),
    );
    const autoPlacement =
      await this.treeTopologyService.tryAutoPlaceForBoundUser(user.id, {
        auditAction:
          options?.placementAuditAction ??
          'tree.bind-placement.auto-confirmed',
        deferredAuditAction:
          options?.placementDeferredAuditAction ??
          'tree.bind-placement.auto-deferred',
      });

    return {
      ...binding,
      isPlacementPending: autoPlacement.isPlacementPending,
    };
  }

  async bindInviterForUserTx(
    user: ReferralActor,
    command: ReferralBindInviterInput,
    tx: Prisma.TransactionClient,
    options?: {
      bindAuditAction?: string;
      bindIdempotentAuditAction?: string;
    },
  ): Promise<ReferralInviterBindingView> {
    return this.referralService.bindInviterForUserTx(user, command, tx, {
      auditAction: options?.bindAuditAction ?? 'referral.bind-inviter.confirmed',
      idempotentAuditAction:
        options?.bindIdempotentAuditAction ?? 'referral.bind-inviter.idempotent',
    });
  }
}
