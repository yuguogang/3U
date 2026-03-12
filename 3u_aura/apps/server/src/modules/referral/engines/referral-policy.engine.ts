import { type User, UserStatus } from '@/db';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReferralPendingPlacementView } from '3u-aura-common';

@Injectable()
export class ReferralPolicyEngine {
  assertInviteCode(inviteCode: string): void {
    if (!inviteCode.trim()) {
      throw new BadRequestException('inviteCode is required');
    }
  }

  assertInviterExists(
    inviter?: Pick<User, 'id' | 'inviteCode' | 'status'> | null,
  ): asserts inviter is Pick<User, 'id' | 'inviteCode' | 'status'> {
    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }
  }

  assertBindAllowed(params: {
    inviter: Pick<User, 'id' | 'status'>;
    user: Pick<User, 'id' | 'inviterId' | 'parentId' | 'status'>;
  }): void {
    const { inviter, user } = params;

    if (user.status !== UserStatus.ACTIVE) {
      throw new ConflictException('User account is not active');
    }

    if (user.id === inviter.id) {
      throw new BadRequestException('Users cannot bind themselves as inviter');
    }

    if (inviter.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Inviter account is not active');
    }

    if (user.parentId) {
      throw new ConflictException(
        'Placement is already frozen; inviter can no longer be changed',
      );
    }

    if (user.inviterId && user.inviterId !== inviter.id) {
      throw new ConflictException(
        'Inviter is already bound and cannot be changed',
      );
    }
  }

  buildPendingPlacementView(
    invitee: Pick<
      User,
      'createdAt' | 'id' | 'inviterId' | 'parentId' | 'walletAddress'
    >,
  ): ReferralPendingPlacementView {
    if (!invitee.inviterId) {
      throw new ConflictException(
        'Pending placement invitee must already have an inviter',
      );
    }

    return {
      inviterId: invitee.inviterId,
      isPlacementPending: !invitee.parentId,
      registeredAt: invitee.createdAt,
      userId: invitee.id,
      walletAddress: invitee.walletAddress,
    };
  }
}
