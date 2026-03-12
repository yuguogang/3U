import { type User, UserStatus } from '@/db';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReferralBindPlacementInput,
  ReferralPlacementSlotView,
  ReferralPlacementView,
} from '3u-aura-common';

type PlacementUser = Pick<
  User,
  'id' | 'inviterId' | 'parentId' | 'placementKey' | 'status' | 'teamPosition'
>;

type PlacementParent = Pick<User, 'id' | 'inviterId' | 'parentId' | 'status'>;

@Injectable()
export class PlacementPolicyEngine {
  assertPlacementCommand(command: ReferralBindPlacementInput): void {
    if (!command.placementUserId.trim()) {
      throw new BadRequestException('placementUserId is required');
    }

    if (!command.parentId.trim()) {
      throw new BadRequestException('parentId is required');
    }
  }

  buildPlacementKey(command: ReferralBindPlacementInput): string {
    return `${command.parentId}:${command.teamPosition}`;
  }

  assertUserExists(user?: PlacementUser | null): asserts user is PlacementUser {
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  assertParentExists(
    parent?: PlacementParent | null,
  ): asserts parent is PlacementParent {
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
  }

  assertInviterActorExists(
    actor?: PlacementParent | null,
  ): asserts actor is PlacementParent {
    if (!actor) {
      throw new NotFoundException('Inviter not found');
    }
  }

  assertPlacementAllowed(params: {
    allowedByPlacementTree: boolean;
    existingOccupantId?: string | null;
    expectedInviterId?: string;
    parent: PlacementParent;
    parentIsReady: boolean;
    requestedPlacementKey: string;
    user: PlacementUser;
  }): void {
    const {
      allowedByPlacementTree,
      existingOccupantId,
      expectedInviterId,
      parent,
      parentIsReady,
      requestedPlacementKey,
      user,
    } = params;

    if (!user.inviterId) {
      throw new ConflictException(
        'Bind inviter before choosing a tree placement',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ConflictException('User account is not active');
    }

    if (parent.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Parent account is not active');
    }

    if (user.id === parent.id) {
      throw new BadRequestException('Users cannot be placed under themselves');
    }

    if (
      user.parentId &&
      user.placementKey &&
      user.placementKey !== requestedPlacementKey
    ) {
      throw new ConflictException('Tree placement is already frozen');
    }

    if (expectedInviterId && user.inviterId !== expectedInviterId) {
      throw new ConflictException(
        'Only the direct inviter can place this user',
      );
    }

    if (!allowedByPlacementTree) {
      throw new ConflictException(
        'Parent must be the inviter or a node inside the inviter subtree',
      );
    }

    if (!parentIsReady) {
      throw new ConflictException(
        'Parent must already be initialized in the tree before receiving descendants',
      );
    }

    if (existingOccupantId && existingOccupantId !== user.id) {
      throw new ConflictException(
        'The requested parent side is already occupied',
      );
    }
  }

  buildPlacementView(params: {
    inviterId?: string | null;
    parentId: string;
    placementKey: string;
    teamPosition: ReferralBindPlacementInput['teamPosition'];
    userId: string;
  }): ReferralPlacementView {
    return {
      inviterId: params.inviterId ?? undefined,
      parentId: params.parentId,
      placementKey: params.placementKey,
      teamPosition: params.teamPosition,
      userId: params.userId,
    };
  }

  buildSelectableSlotView(params: {
    depth: number;
    parentId: string;
    parentWalletAddress: string;
    teamPosition: ReferralBindPlacementInput['teamPosition'];
  }): ReferralPlacementSlotView {
    return {
      depth: params.depth,
      parentId: params.parentId,
      parentWalletAddress: params.parentWalletAddress,
      placementKey: `${params.parentId}:${params.teamPosition}`,
      teamPosition: params.teamPosition,
    };
  }

  buildClosureRows(
    descendantId: string,
    parentAncestors: Array<{ ancestorId: string; depth: number }>,
  ): Array<{ ancestorId: string; depth: number; descendantId: string }> {
    return [
      {
        ancestorId: descendantId,
        depth: 0,
        descendantId,
      },
      ...parentAncestors.map((row) => ({
        ancestorId: row.ancestorId,
        depth: row.depth + 1,
        descendantId,
      })),
    ];
  }
}
