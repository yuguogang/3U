import { type User } from '@/db';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ReferralBindInviterInput,
  ReferralInviterBindingView,
  ReferralPendingPlacementView,
} from '3u-aura-common';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { ReferralPolicyEngine } from '../engines/referral-policy.engine';
import { ReferralRepository } from '../repositories/referral.repository';

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
    this.referralPolicyEngine.assertInviteCode(command.inviteCode);

    return this.transactionOrchestrator.run(async (tx) => {
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

      const boundUser =
        bindingUser.inviterId === inviter.id
          ? bindingUser
          : await this.referralRepository.bindInviter(
              bindingUser.id,
              inviter.id,
              tx,
            );

      await this.auditSeam.record({
        action:
          bindingUser.inviterId === inviter.id
            ? 'referral.bind-inviter.idempotent'
            : 'referral.bind-inviter.confirmed',
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
    });
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
}
