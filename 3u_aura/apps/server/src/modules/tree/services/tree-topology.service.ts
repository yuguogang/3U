import { Prisma, UserStatus, type User } from '@/db';
import { ConflictException, Injectable } from '@nestjs/common';
import {
  ReferralBindPlacementInput,
  ReferralPlacementSlotView,
  ReferralPlacementView,
  TeamTreeSnapshotQuery,
  TeamTreeSnapshotView,
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

  async getTreeSnapshotForInviter(
    user: TreeActor,
    query: TeamTreeSnapshotQuery,
  ): Promise<TeamTreeSnapshotView> {
    const inviter = await this.teamClosureRepository.findParentForPlacement(
      user.id,
    );
    this.placementPolicyEngine.assertInviterActorExists(inviter);

    if (inviter.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Inviter account is not active');
    }

    const inviterHasSelfClosure =
      await this.teamClosureRepository.hasSelfClosure(inviter.id);
    const inviterIsRoot = inviter.parentId === null && inviter.inviterId === null;

    if (!inviterHasSelfClosure && !inviterIsRoot) {
      throw new ConflictException(
        'Current user is not yet initialized inside the tree',
      );
    }

    const focusRootId = query.focusUserId ?? inviter.id;
    if (
      query.focusUserId &&
      query.focusUserId !== inviter.id &&
      !(await this.teamClosureRepository.hasAncestorLink(
        inviter.id,
        query.focusUserId,
      ))
    ) {
      throw new ConflictException('Focus node is outside the inviter subtree');
    }

    const subtreeNodes = await this.teamClosureRepository.listSubtreeNodes(
      focusRootId,
      { depth: query.depth },
    );
    const occupiedPositions =
      await this.teamClosureRepository.listOccupiedChildPositions(
        subtreeNodes.map((node) => node.id),
      );
    const occupiedByParent = new Map<string, Set<TeamPosition>>();

    for (const row of occupiedPositions) {
      const parentSet = occupiedByParent.get(row.parentId) ?? new Set<TeamPosition>();
      parentSet.add(row.teamPosition as TeamPosition);
      occupiedByParent.set(row.parentId, parentSet);
    }

    return {
      rootUserId: focusRootId,
      requestedDepth: query.depth,
      nodes: subtreeNodes.map((node) => {
        const occupied = occupiedByParent.get(node.id) ?? new Set<TeamPosition>();
        const totalAuraAtomic =
          BigInt(node.profile?.totalAuraFromCheckin?.toFixed(0) ?? '0') +
          BigInt(node.profile?.totalAuraFromDirect?.toFixed(0) ?? '0') +
          BigInt(node.profile?.totalAuraFromIndirect?.toFixed(0) ?? '0') +
          BigInt(node.profile?.totalAuraFromConsolation?.toFixed(0) ?? '0');

        return {
          userId: node.id,
          walletAddress: node.walletAddress,
          inviteCode: node.inviteCode ?? undefined,
          inviterId: node.inviterId ?? undefined,
          parentId: node.parentId ?? undefined,
          placementKey: node.placementKey ?? undefined,
          teamPosition: (node.teamPosition as TeamPosition | undefined) ?? undefined,
          depth: node.depth,
          isRoot: node.id === focusRootId,
          hasPurchasedNft: node.profile?.hasPurchasedNft ?? false,
          hasReferralNft: node.profile?.hasReferralNft ?? false,
          totalAuraAtomic: totalAuraAtomic.toString(),
          leftTeamVolume: node.profile?.leftTeamVolume?.toFixed(0) ?? '0',
          rightTeamVolume: node.profile?.rightTeamVolume?.toFixed(0) ?? '0',
          smallLegVolume: node.profile?.smallLegVolume?.toFixed(0) ?? '0',
          openChildPositions: [TeamPosition.LEFT, TeamPosition.RIGHT].filter(
            (position) => !occupied.has(position),
          ),
        };
      }),
    };
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
