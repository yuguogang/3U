import { Prisma, UserStatus, type User } from '@/db';
import { ConflictException, Injectable } from '@nestjs/common';
import {
  ReferralBindPlacementInput,
  ReferralPlacementSlotView,
  ReferralPlacementView,
  TeamPosition,
} from '3u-aura-common';
import { ReferralService } from '../../referral';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { PlacementPolicyEngine } from '../engines/placement-policy.engine';
import { TeamClosureRepository } from '../repositories/team-closure.repository';

type TreeActor = Pick<User, 'id'>;

@Injectable()
export class TreeTopologyService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly placementPolicyEngine: PlacementPolicyEngine,
    private readonly teamClosureRepository: TeamClosureRepository,
    private readonly referralService: ReferralService,
  ) {}

  async initializeRootUserTx(
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const rootUser = await this.teamClosureRepository.findParentForPlacement(
      userId,
      tx,
    );
    this.placementPolicyEngine.assertParentExists(rootUser);

    if (rootUser.inviterId || rootUser.parentId) {
      return;
    }

    const alreadyInitialized = await this.teamClosureRepository.hasSelfClosure(
      rootUser.id,
      tx,
    );
    if (alreadyInitialized) {
      return;
    }

    await this.teamClosureRepository.ensureSelfClosure(rootUser.id, tx);
    await this.auditSeam.record({
      action: 'tree.root.initialized',
      targetId: rootUser.id,
      targetType: 'User',
      payload: {
        parentId: null,
        placementKey: null,
        teamPosition: null,
        userId: rootUser.id,
      },
    });
  }

  async bindPlacementForInviter(
    user: TreeActor,
    command: ReferralBindPlacementInput,
  ): Promise<ReferralPlacementView> {
    this.placementPolicyEngine.assertPlacementCommand(command);

    return this.transactionOrchestrator.run(async (tx) => {
      const inviter = await this.teamClosureRepository.findParentForPlacement(
        user.id,
        tx,
      );
      this.placementPolicyEngine.assertInviterActorExists(inviter);

      if (inviter.status !== UserStatus.ACTIVE) {
        throw new ConflictException('Inviter account is not active');
      }

      return this.bindPlacementWithinTree(
        {
          expectedInviterId: inviter.id,
          parentId: command.parentId,
          placementRootId: inviter.id,
          placementUserId: command.placementUserId,
          teamPosition: command.teamPosition,
        },
        tx,
      );
    });
  }

  async repairPlacementForUser(
    user: TreeActor,
    command: Omit<ReferralBindPlacementInput, 'placementUserId'>,
  ): Promise<ReferralPlacementView> {
    this.placementPolicyEngine.assertPlacementCommand({
      ...command,
      placementUserId: user.id,
    });

    return this.transactionOrchestrator.run(async (tx) => {
      const placementUser =
        await this.teamClosureRepository.findUserForPlacement(user.id, tx);
      this.placementPolicyEngine.assertUserExists(placementUser);

      if (!placementUser.inviterId) {
        throw new ConflictException(
          'Bind inviter before choosing a tree placement',
        );
      }

      return this.bindPlacementWithinTree(
        {
          parentId: command.parentId,
          placementRootId: placementUser.inviterId,
          placementUser,
          placementUserId: user.id,
          teamPosition: command.teamPosition,
          auditAction: 'tree.bind-placement.repaired',
        },
        tx,
      );
    });
  }

  async listSelectableSlotsForInviter(
    user: TreeActor,
  ): Promise<ReferralPlacementSlotView[]> {
    const inviter = await this.teamClosureRepository.findParentForPlacement(
      user.id,
    );
    this.placementPolicyEngine.assertInviterActorExists(inviter);

    if (inviter.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Inviter account is not active');
    }

    const subtreeParents =
      await this.teamClosureRepository.listSelectableParents(inviter.id);
    const selectableParents =
      subtreeParents.length > 0
        ? subtreeParents
        : inviter.parentId === null && inviter.inviterId === null
          ? [{ ...inviter, depth: 0 }]
          : [];
    const occupiedPositions =
      await this.teamClosureRepository.listOccupiedChildPositions(
        selectableParents.map((parent) => parent.id),
      );
    const occupiedKeys = new Set(
      occupiedPositions.map((row) => `${row.parentId}:${row.teamPosition}`),
    );

    return selectableParents.flatMap((parent) => {
      if (parent.status !== UserStatus.ACTIVE) {
        return [];
      }

      return [TeamPosition.LEFT, TeamPosition.RIGHT]
        .filter(
          (teamPosition) => !occupiedKeys.has(`${parent.id}:${teamPosition}`),
        )
        .map((teamPosition) =>
          this.placementPolicyEngine.buildSelectableSlotView({
            depth: parent.depth,
            parentId: parent.id,
            parentWalletAddress: parent.walletAddress,
            teamPosition,
          }),
        );
    });
  }

  private async bindPlacementWithinTree(
    params: {
      auditAction?: string;
      expectedInviterId?: string;
      parentId: string;
      placementRootId: string;
      placementUser?: Awaited<
        ReturnType<TeamClosureRepository['findUserForPlacement']>
      >;
      placementUserId: string;
      teamPosition: ReferralBindPlacementInput['teamPosition'];
    },
    tx: Prisma.TransactionClient,
  ): Promise<ReferralPlacementView> {
    const placementKey = this.placementPolicyEngine.buildPlacementKey({
      placementUserId: params.placementUserId,
      parentId: params.parentId,
      teamPosition: params.teamPosition,
    });
    const placementUser =
      params.placementUser ??
      (await this.teamClosureRepository.findUserForPlacement(
        params.placementUserId,
        tx,
      ));
    this.placementPolicyEngine.assertUserExists(placementUser);

    const parent = await this.teamClosureRepository.findParentForPlacement(
      params.parentId,
      tx,
    );
    this.placementPolicyEngine.assertParentExists(parent);

    const existingOccupant =
      await this.teamClosureRepository.findByPlacementKey(placementKey, tx);
    const allowedByPlacementTree =
      parent.id === params.placementRootId ||
      (await this.teamClosureRepository.hasAncestorLink(
        params.placementRootId,
        parent.id,
        tx,
      ));
    const parentHasSelfClosure =
      await this.teamClosureRepository.hasSelfClosure(parent.id, tx);
    const parentIsReady =
      parentHasSelfClosure ||
      (parent.parentId === null && parent.inviterId === null);

    this.placementPolicyEngine.assertPlacementAllowed({
      allowedByPlacementTree,
      existingOccupantId: existingOccupant?.id,
      expectedInviterId: params.expectedInviterId,
      parent,
      parentIsReady,
      requestedPlacementKey: placementKey,
      user: placementUser,
    });

    if (
      placementUser.parentId === params.parentId &&
      placementUser.placementKey === placementKey &&
      placementUser.teamPosition === params.teamPosition
    ) {
      return this.placementPolicyEngine.buildPlacementView({
        inviterId: placementUser.inviterId,
        parentId: params.parentId,
        placementKey,
        teamPosition: params.teamPosition,
        userId: placementUser.id,
      });
    }

    await this.teamClosureRepository.ensureSelfClosure(parent.id, tx);
    const parentAncestors = await this.teamClosureRepository.listAncestorRows(
      parent.id,
      tx,
    );

    const boundUser = await this.teamClosureRepository.bindPlacement(
      {
        parentId: params.parentId,
        placementKey,
        teamPosition: params.teamPosition,
        userId: placementUser.id,
      },
      tx,
    );

    const shareReadyUser =
      await this.referralService.issueInviteCodeIfMissingForUserTx(
        boundUser.id,
        tx,
      );

    await this.teamClosureRepository.insertClosureRows(
      this.placementPolicyEngine.buildClosureRows(
        shareReadyUser.id,
        parentAncestors,
      ),
      tx,
    );

    await this.auditSeam.record({
      action: params.auditAction ?? 'tree.bind-placement.confirmed',
      targetId: boundUser.id,
      targetType: 'User',
      payload: {
        parentId: params.parentId,
        placementKey,
        teamPosition: params.teamPosition,
        userId: shareReadyUser.id,
      },
    });

    return this.placementPolicyEngine.buildPlacementView({
      inviterId: shareReadyUser.inviterId,
      parentId: params.parentId,
      placementKey,
      teamPosition: params.teamPosition,
      userId: shareReadyUser.id,
    });
  }
}
