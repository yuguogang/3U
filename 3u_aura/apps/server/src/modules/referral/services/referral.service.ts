import { Prisma, type User } from '@/db';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ReferralBindInviterInput,
  ReferralInviterBindingView,
  ReferralPendingPlacementView,
} from '3u-aura-common';
import { nanoid } from 'nanoid';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { ReferralPolicyEngine } from '../engines/referral-policy.engine';
import {
  ReferralBindingUser,
  ReferralRepository,
} from '../repositories/referral.repository';

type ReferralActor = Pick<User, 'id'>;

@Injectable()
export class ReferralService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly referralPolicyEngine: ReferralPolicyEngine,
    private readonly referralRepository: ReferralRepository,
  ) {}

  async bindInviterForUser(
    user: ReferralActor,
    command: ReferralBindInviterInput,
  ): Promise<ReferralInviterBindingView> {
    return this.transactionOrchestrator.run((tx) =>
      this.bindInviterForUserTx(user, command, tx, {
        auditAction: 'referral.bind-inviter.confirmed',
        idempotentAuditAction: 'referral.bind-inviter.idempotent',
      }),
    );
  }

  async bindInviterForUserTx(
    user: ReferralActor,
    command: ReferralBindInviterInput,
    tx: Prisma.TransactionClient,
    options?: {
      auditAction?: string;
      idempotentAuditAction?: string;
    },
  ): Promise<ReferralInviterBindingView> {
    this.referralPolicyEngine.assertInviteCode(command.inviteCode);

    const bindingUser = await this.referralRepository.findUserForBinding(
      user.id,
      tx,
    );
    if (!bindingUser) {
      throw new NotFoundException('User not found');
    }

    const inviter = await this.referralRepository.findInviterByInviteCode(
      command.inviteCode,
      tx,
    );
    this.referralPolicyEngine.assertInviterExists(inviter);
    this.referralPolicyEngine.assertBindAllowed({
      inviter,
      user: bindingUser,
    });

    const inviterAlreadyBound = bindingUser.inviterId === inviter.id;
    const boundUser = inviterAlreadyBound
      ? bindingUser
      : await this.referralRepository.bindInviter(bindingUser.id, inviter.id, tx);

    await this.auditSeam.record({
      action: inviterAlreadyBound
        ? options?.idempotentAuditAction ?? 'referral.bind-inviter.idempotent'
        : options?.auditAction ?? 'referral.bind-inviter.confirmed',
      targetId: boundUser.id,
      targetType: 'User',
      payload: {
        inviteCode: inviter.inviteCode,
        inviterId: inviter.id,
        userId: boundUser.id,
      },
    });

    return {
      inviterId: inviter.id,
      inviterInviteCode: inviter.inviteCode ?? undefined,
      isPlacementPending: !boundUser.parentId,
      userId: boundUser.id,
    };
  }

  async listPendingPlacementInvitees(
    user: ReferralActor,
  ): Promise<ReferralPendingPlacementView[]> {
    const invitees = await this.referralRepository.listPendingPlacementInvitees(
      user.id,
    );

    return invitees.map((invitee) =>
      this.referralPolicyEngine.buildPendingPlacementView(invitee),
    );
  }

  async issueInviteCodeIfMissingForUserTx(
    userId: string,
    tx: Prisma.TransactionClient,
  ) {
    const user = await this.referralRepository.findUserForBinding(userId, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.inviteCode) {
      return user;
    }

    while (true) {
      const candidate = this.generateInviteCode();
      const existing =
        await this.referralRepository.findInviterByInviteCode(candidate, tx);
      if (existing) {
        continue;
      }

      return this.referralRepository.assignInviteCode(user.id, candidate, tx);
    }
  }

  private generateInviteCode() {
    return nanoid(8).toUpperCase();
  }
}
