import { Prisma } from '@/db';
import { ConflictException } from '@nestjs/common';
import { TeamPosition, UserStatus } from '3u-aura-common';
import { PlacementPolicyEngine } from '../engines/placement-policy.engine';
import { TreeTopologyService } from './tree-topology.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'SHARE123',
}));

describe('TreeTopologyService', () => {
  const actor = { id: 'inviter_1' };
  const command = {
    placementUserId: 'user_1',
    parentId: 'parent_1',
    teamPosition: TeamPosition.LEFT,
  };
  const createPlacementRaceError = () =>
    Object.setPrototypeOf(
      {
        code: 'P2002',
        meta: { target: ['placementKey'] },
      },
      Prisma.PrismaClientKnownRequestError.prototype,
    );

  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const transactionOrchestrator = {
      run: jest.fn((operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const teamClosureRepository = {
      bindPlacement: jest.fn(),
      countActiveSubtreeMembers: jest.fn(),
      ensureSelfClosure: jest.fn().mockResolvedValue(undefined),
      findDirectChild: jest.fn(),
      findByPlacementKey: jest.fn(),
      findParentForPlacement: jest.fn(),
      findUserForPlacement: jest.fn(),
      hasAncestorLink: jest.fn(),
      hasSelfClosure: jest.fn(),
      insertClosureRows: jest.fn().mockResolvedValue(undefined),
      listOccupiedChildPositions: jest.fn(),
      listSubtreeNodes: jest.fn(),
      listSelectableParents: jest.fn(),
      listAncestorRows: jest.fn(),
    };
    const referralService = {
      issueInviteCodeIfMissingForUserTx: jest.fn(),
    };

    const service = new TreeTopologyService(
      auditSeam as any,
      transactionOrchestrator as any,
      new PlacementPolicyEngine(),
      teamClosureRepository as any,
      referralService as any,
    );

    return {
      auditSeam,
      referralService,
      service,
      teamClosureRepository,
    };
  };

  it('binds a placement and inserts closure rows', async () => {
    const { auditSeam, referralService, service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: 'parent_1',
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x9999999999999999999999999999999999999999',
      });
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: command.placementUserId,
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findByPlacementKey.mockResolvedValue(null);
    teamClosureRepository.hasAncestorLink.mockResolvedValue(true);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.listAncestorRows.mockResolvedValue([
      { ancestorId: 'parent_1', depth: 0 },
      { ancestorId: 'root_1', depth: 1 },
    ]);
    teamClosureRepository.bindPlacement.mockResolvedValue({
      id: command.placementUserId,
      inviterId: actor.id,
      parentId: 'parent_1',
      placementKey: 'parent_1:LEFT',
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.LEFT,
    });
    referralService.issueInviteCodeIfMissingForUserTx.mockResolvedValue({
      id: command.placementUserId,
      inviterId: actor.id,
      inviteCode: 'SHARE123',
      parentId: 'parent_1',
      placementKey: 'parent_1:LEFT',
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.LEFT,
    });

    const result = await service.bindPlacementForInviter(actor, command);

    expect(teamClosureRepository.bindPlacement).toHaveBeenCalled();
    expect(referralService.issueInviteCodeIfMissingForUserTx).toHaveBeenCalledWith(
      command.placementUserId,
      expect.any(Object),
    );
    expect(teamClosureRepository.insertClosureRows).toHaveBeenCalledWith(
      [
        {
          ancestorId: command.placementUserId,
          depth: 0,
          descendantId: command.placementUserId,
        },
        {
          ancestorId: 'parent_1',
          depth: 1,
          descendantId: command.placementUserId,
        },
        {
          ancestorId: 'root_1',
          depth: 2,
          descendantId: command.placementUserId,
        },
      ],
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tree.bind-placement.confirmed' }),
    );
    expect(result).toEqual({
      inviterId: actor.id,
      parentId: 'parent_1',
      placementKey: 'parent_1:LEFT',
      teamPosition: TeamPosition.LEFT,
      userId: command.placementUserId,
    });
  });

  it('initializes self-closure for the explicit root user only once', async () => {
    const { auditSeam, service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    teamClosureRepository.hasSelfClosure.mockResolvedValue(false);

    await service.initializeRootUserTx(actor.id, {} as any);

    expect(teamClosureRepository.ensureSelfClosure).toHaveBeenCalledWith(
      actor.id,
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tree.root.initialized' }),
    );
  });

  it('does not initialize self-closure for a non-root user', async () => {
    const { auditSeam, service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: 'root_1',
      parentId: null,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });

    await service.initializeRootUserTx(actor.id, {} as any);

    expect(teamClosureRepository.ensureSelfClosure).not.toHaveBeenCalled();
    expect(auditSeam.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tree.root.initialized' }),
    );
  });

  it('retries auto-placement when a transient placement conflict occurs', async () => {
    const { service, teamClosureRepository } = createService();
    (service as any).transactionOrchestrator.run = jest
      .fn()
      .mockResolvedValueOnce({
        isPlacementPending: true,
        reason: 'placement-conflict',
      })
      .mockResolvedValueOnce({
        isPlacementPending: false,
        placement: {
          inviterId: actor.id,
          parentId: 'retry_parent',
          placementKey: 'retry_parent:LEFT',
          teamPosition: TeamPosition.LEFT,
          userId: 'user_retry',
        },
      });

    const result = await service.tryAutoPlaceForBoundUser('user_retry');

    expect((service as any).transactionOrchestrator.run).toHaveBeenCalledTimes(2);
    expect(teamClosureRepository.findUserForPlacement).not.toHaveBeenCalled();
    expect(result).toEqual({
      isPlacementPending: false,
      placement: {
        inviterId: actor.id,
        parentId: 'retry_parent',
        placementKey: 'retry_parent:LEFT',
        teamPosition: TeamPosition.LEFT,
        userId: 'user_retry',
      },
    });
  });

  it('keeps inviter binding and falls back to pending after repeated placement races', async () => {
    const { auditSeam, service, teamClosureRepository } = createService();
    (service as any).transactionOrchestrator.run = jest
      .fn()
      .mockRejectedValue(createPlacementRaceError());
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: 'user_race',
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });

    const result = await service.tryAutoPlaceForBoundUser('user_race', {
      deferredAuditAction: 'tree.bind-placement.auto-race.deferred',
      maxAttempts: 2,
    });

    expect((service as any).transactionOrchestrator.run).toHaveBeenCalledTimes(2);
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'tree.bind-placement.auto-race.deferred',
      }),
    );
    expect(result).toEqual({
      isPlacementPending: true,
      reason: 'placement-conflict',
    });
  });

  it('returns idempotently for the same frozen placement', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: 'parent_1',
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x9999999999999999999999999999999999999999',
      });
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: command.placementUserId,
      inviterId: actor.id,
      parentId: 'parent_1',
      placementKey: 'parent_1:LEFT',
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.LEFT,
    });
    teamClosureRepository.findByPlacementKey.mockResolvedValue({
      id: command.placementUserId,
    });
    teamClosureRepository.hasAncestorLink.mockResolvedValue(true);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);

    const result = await service.bindPlacementForInviter(actor, command);

    expect(teamClosureRepository.bindPlacement).not.toHaveBeenCalled();
    expect(result.placementKey).toBe('parent_1:LEFT');
  });

  it('rejects placement when target side is occupied', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: 'parent_1',
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x9999999999999999999999999999999999999999',
      });
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: command.placementUserId,
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findByPlacementKey.mockResolvedValue({
      id: 'user_2',
    });
    teamClosureRepository.hasAncestorLink.mockResolvedValue(true);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);

    await expect(
      service.bindPlacementForInviter(actor, command),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects placement when actor is not the direct inviter', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: 'parent_1',
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x9999999999999999999999999999999999999999',
      });
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: command.placementUserId,
      inviterId: 'different_inviter',
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findByPlacementKey.mockResolvedValue(null);
    teamClosureRepository.hasAncestorLink.mockResolvedValue(true);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);

    await expect(
      service.bindPlacementForInviter(actor, command),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists selectable slots inside the inviter subtree', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    teamClosureRepository.listSelectableParents.mockResolvedValue([
      {
        depth: 0,
        id: actor.id,
        inviterId: null,
        parentId: null,
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
      {
        depth: 1,
        id: 'node_2',
        inviterId: actor.id,
        parentId: actor.id,
        status: UserStatus.ACTIVE,
        walletAddress: '0x2222222222222222222222222222222222222222',
      },
    ]);
    teamClosureRepository.listOccupiedChildPositions.mockResolvedValue([
      {
        parentId: actor.id,
        teamPosition: TeamPosition.LEFT,
      },
      {
        parentId: 'node_2',
        teamPosition: TeamPosition.RIGHT,
      },
    ]);

    const result = await service.listSelectableSlotsForInviter(actor);

    expect(result).toEqual([
      {
        depth: 0,
        parentId: actor.id,
        parentWalletAddress: '0x1111111111111111111111111111111111111111',
        placementKey: `${actor.id}:RIGHT`,
        teamPosition: TeamPosition.RIGHT,
      },
      {
        depth: 1,
        parentId: 'node_2',
        parentWalletAddress: '0x2222222222222222222222222222222222222222',
        placementKey: 'node_2:LEFT',
        teamPosition: TeamPosition.LEFT,
      },
    ]);
  });

  it('returns subtree nodes with open positions and reward summary', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.listSubtreeNodes.mockResolvedValue([
      {
        id: actor.id,
        walletAddress: '0x1111111111111111111111111111111111111111',
        inviteCode: 'ROOTCODE',
        inviterId: null,
        parentId: null,
        placementKey: null,
        status: UserStatus.ACTIVE,
        teamPosition: null,
        depth: 0,
        profile: {
          hasPurchasedNft: true,
          hasReferralNft: false,
          leftTeamVolume: { toFixed: () => '1000' },
          rightTeamVolume: { toFixed: () => '2000' },
          smallLegVolume: { toFixed: () => '1000' },
          totalAuraFromCheckin: { toFixed: () => '10' },
          totalAuraFromDirect: { toFixed: () => '20' },
          totalAuraFromIndirect: { toFixed: () => '30' },
          totalAuraFromConsolation: { toFixed: () => '40' },
        },
      },
      {
        id: 'node_2',
        walletAddress: '0x2222222222222222222222222222222222222222',
        inviteCode: null,
        inviterId: actor.id,
        parentId: actor.id,
        placementKey: `${actor.id}:LEFT`,
        status: UserStatus.ACTIVE,
        teamPosition: TeamPosition.LEFT,
        depth: 1,
        profile: null,
      },
    ]);
    teamClosureRepository.listOccupiedChildPositions.mockResolvedValue([
      { parentId: actor.id, teamPosition: TeamPosition.LEFT },
    ]);

    const result = await service.getTreeSnapshotForInviter(actor, { depth: 3 });

    expect(result).toEqual({
      rootUserId: actor.id,
      requestedDepth: 3,
      nodes: [
        {
          userId: actor.id,
          walletAddress: '0x1111111111111111111111111111111111111111',
          inviteCode: 'ROOTCODE',
          inviterId: undefined,
          parentId: undefined,
          placementKey: undefined,
          teamPosition: undefined,
          depth: 0,
          isRoot: true,
          hasPurchasedNft: true,
          hasReferralNft: false,
          totalAuraAtomic: '100',
          leftTeamVolume: '1000',
          rightTeamVolume: '2000',
          smallLegVolume: '1000',
          openChildPositions: [TeamPosition.RIGHT],
        },
        {
          userId: 'node_2',
          walletAddress: '0x2222222222222222222222222222222222222222',
          inviteCode: undefined,
          inviterId: actor.id,
          parentId: actor.id,
          placementKey: `${actor.id}:LEFT`,
          teamPosition: TeamPosition.LEFT,
          depth: 1,
          isRoot: false,
          hasPurchasedNft: false,
          hasReferralNft: false,
          totalAuraAtomic: '0',
          leftTeamVolume: '0',
          rightTeamVolume: '0',
          smallLegVolume: '0',
          openChildPositions: [TeamPosition.LEFT, TeamPosition.RIGHT],
        },
      ],
    });
  });

  it('returns a focused descendant subtree when focusUserId is valid', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.hasAncestorLink.mockResolvedValue(true);
    teamClosureRepository.listSubtreeNodes.mockResolvedValue([
      {
        id: 'node_focus',
        walletAddress: '0x2222222222222222222222222222222222222222',
        inviteCode: 'FOCUS01',
        inviterId: actor.id,
        parentId: actor.id,
        placementKey: `${actor.id}:LEFT`,
        status: UserStatus.ACTIVE,
        teamPosition: TeamPosition.LEFT,
        depth: 0,
        profile: null,
      },
      {
        id: 'node_leaf',
        walletAddress: '0x3333333333333333333333333333333333333333',
        inviteCode: null,
        inviterId: 'node_focus',
        parentId: 'node_focus',
        placementKey: 'node_focus:RIGHT',
        status: UserStatus.ACTIVE,
        teamPosition: TeamPosition.RIGHT,
        depth: 1,
        profile: null,
      },
    ]);
    teamClosureRepository.listOccupiedChildPositions.mockResolvedValue([
      { parentId: 'node_focus', teamPosition: TeamPosition.RIGHT },
    ]);

    const result = await service.getTreeSnapshotForInviter(actor, {
      depth: 4,
      focusUserId: 'node_focus',
    });

    expect(teamClosureRepository.hasAncestorLink).toHaveBeenCalledWith(
      actor.id,
      'node_focus',
    );
    expect(teamClosureRepository.listSubtreeNodes).toHaveBeenCalledWith(
      'node_focus',
      { depth: 4 },
    );
    expect(result.rootUserId).toBe('node_focus');
    expect(result.nodes[0]).toEqual({
      userId: 'node_focus',
      walletAddress: '0x2222222222222222222222222222222222222222',
      inviteCode: 'FOCUS01',
      inviterId: actor.id,
      parentId: actor.id,
      placementKey: `${actor.id}:LEFT`,
      teamPosition: TeamPosition.LEFT,
      depth: 0,
      isRoot: true,
      hasPurchasedNft: false,
      hasReferralNft: false,
      totalAuraAtomic: '0',
      leftTeamVolume: '0',
      rightTeamVolume: '0',
      smallLegVolume: '0',
      openChildPositions: [TeamPosition.LEFT],
    });
  });

  it('rejects focusUserId outside the inviter subtree', async () => {
    const { service, teamClosureRepository } = createService();
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.hasAncestorLink.mockResolvedValue(false);

    await expect(
      service.getTreeSnapshotForInviter(actor, {
        depth: 4,
        focusUserId: 'node_outside',
      }),
    ).rejects.toThrow('Focus node is outside the inviter subtree');

    expect(teamClosureRepository.listSubtreeNodes).not.toHaveBeenCalled();
  });

  it('auto-places into the weak left leg using single-line depth', async () => {
    const { referralService, service, teamClosureRepository } = createService();
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: 'user_auto',
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        profile: {
          leftTeamVolume: { toFixed: () => '10' },
          rightTeamVolume: { toFixed: () => '80' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: 'left_spine_1',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x2222222222222222222222222222222222222222',
    });
    teamClosureRepository.findDirectChild
      .mockResolvedValueOnce({
        id: 'left_spine_1',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x2222222222222222222222222222222222222222',
      })
      .mockResolvedValueOnce({
        id: 'right_spine_1',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x4444444444444444444444444444444444444444',
      })
      .mockResolvedValueOnce({
        id: 'left_spine_1',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x2222222222222222222222222222222222222222',
      })
      .mockResolvedValueOnce(null);
    teamClosureRepository.countActiveSubtreeMembers
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);
    teamClosureRepository.findByPlacementKey.mockResolvedValue(null);
    teamClosureRepository.hasAncestorLink.mockResolvedValue(true);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.listAncestorRows.mockResolvedValue([
      { ancestorId: 'left_spine_1', depth: 0 },
      { ancestorId: actor.id, depth: 1 },
    ]);
    teamClosureRepository.bindPlacement.mockResolvedValue({
      id: 'user_auto',
      inviterId: actor.id,
      parentId: 'left_spine_1',
      placementKey: 'left_spine_1:LEFT',
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.LEFT,
    });
    referralService.issueInviteCodeIfMissingForUserTx.mockResolvedValue({
      id: 'user_auto',
      inviterId: actor.id,
      inviteCode: 'SHARE123',
      parentId: 'left_spine_1',
      placementKey: 'left_spine_1:LEFT',
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.LEFT,
    });

    const result = await service.tryAutoPlaceForBoundUserTx(
      'user_auto',
      {} as any,
    );

    expect(teamClosureRepository.findDirectChild).toHaveBeenNthCalledWith(
      1,
      actor.id,
      TeamPosition.LEFT,
      expect.any(Object),
    );
    expect(teamClosureRepository.findDirectChild).toHaveBeenNthCalledWith(
      2,
      actor.id,
      TeamPosition.RIGHT,
      expect.any(Object),
    );
    expect(teamClosureRepository.findDirectChild).toHaveBeenNthCalledWith(
      3,
      actor.id,
      TeamPosition.LEFT,
      expect.any(Object),
    );
    expect(teamClosureRepository.findDirectChild).toHaveBeenNthCalledWith(
      4,
      'left_spine_1',
      TeamPosition.LEFT,
      expect.any(Object),
    );
    expect(teamClosureRepository.bindPlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: 'left_spine_1',
        teamPosition: TeamPosition.LEFT,
        userId: 'user_auto',
      }),
      expect.any(Object),
    );
    expect(result).toEqual({
      isPlacementPending: false,
      placement: {
        inviterId: actor.id,
        parentId: 'left_spine_1',
        placementKey: 'left_spine_1:LEFT',
        teamPosition: TeamPosition.LEFT,
        userId: 'user_auto',
      },
    });
  });

  it('auto-places into the weak right leg when right volume is smaller', async () => {
    const { referralService, service, teamClosureRepository } = createService();
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: 'user_right',
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        profile: {
          leftTeamVolume: { toFixed: () => '90' },
          rightTeamVolume: { toFixed: () => '20' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        profile: {
          leftTeamVolume: { toFixed: () => '90' },
          rightTeamVolume: { toFixed: () => '20' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      });
    teamClosureRepository.findDirectChild
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    teamClosureRepository.countActiveSubtreeMembers
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    teamClosureRepository.findByPlacementKey.mockResolvedValue(null);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.listAncestorRows.mockResolvedValue([
      { ancestorId: actor.id, depth: 0 },
    ]);
    teamClosureRepository.bindPlacement.mockResolvedValue({
      id: 'user_right',
      inviterId: actor.id,
      parentId: actor.id,
      placementKey: `${actor.id}:RIGHT`,
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.RIGHT,
    });
    referralService.issueInviteCodeIfMissingForUserTx.mockResolvedValue({
      id: 'user_right',
      inviterId: actor.id,
      inviteCode: 'SHARE123',
      parentId: actor.id,
      placementKey: `${actor.id}:RIGHT`,
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.RIGHT,
    });

    const result = await service.tryAutoPlaceForBoundUserTx(
      'user_right',
      {} as any,
    );

    expect(teamClosureRepository.findDirectChild).toHaveBeenCalledWith(
      actor.id,
      TeamPosition.RIGHT,
      expect.any(Object),
    );
    expect(result).toEqual({
      isPlacementPending: false,
      placement: {
        inviterId: actor.id,
        parentId: actor.id,
        placementKey: `${actor.id}:RIGHT`,
        teamPosition: TeamPosition.RIGHT,
        userId: 'user_right',
      },
    });
  });

  it('keeps the user pending when the selected spine hits an inactive child', async () => {
    const { auditSeam, service, teamClosureRepository } = createService();
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: 'user_pending',
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findParentForPlacement.mockResolvedValue({
      id: actor.id,
      inviterId: null,
      parentId: null,
      profile: {
        leftTeamVolume: { toFixed: () => '0' },
        rightTeamVolume: { toFixed: () => '50' },
      },
      status: UserStatus.ACTIVE,
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    teamClosureRepository.findDirectChild
      .mockResolvedValueOnce({
        id: 'inactive_left',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.BLOCKED,
        walletAddress: '0x3333333333333333333333333333333333333333',
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'inactive_left',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.BLOCKED,
        walletAddress: '0x3333333333333333333333333333333333333333',
      });
    teamClosureRepository.countActiveSubtreeMembers
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await service.tryAutoPlaceForBoundUserTx(
      'user_pending',
      {} as any,
    );

    expect(teamClosureRepository.bindPlacement).not.toHaveBeenCalled();
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'tree.bind-placement.auto-deferred',
      }),
    );
    expect(result).toEqual({
      isPlacementPending: true,
      reason: 'no-auto-slot',
    });
  });

  it('uses branch member count when volume is tied', async () => {
    const { referralService, service, teamClosureRepository } = createService();
    teamClosureRepository.findUserForPlacement.mockResolvedValue({
      id: 'user_tie',
      inviterId: actor.id,
      parentId: null,
      placementKey: null,
      status: UserStatus.ACTIVE,
      teamPosition: null,
    });
    teamClosureRepository.findParentForPlacement
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      })
      .mockResolvedValueOnce({
        id: actor.id,
        inviterId: null,
        parentId: null,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x1111111111111111111111111111111111111111',
      });
    teamClosureRepository.findDirectChild
      .mockResolvedValueOnce({
        id: 'left_branch',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x2222222222222222222222222222222222222222',
      })
      .mockResolvedValueOnce({
        id: 'right_branch',
        inviterId: actor.id,
        parentId: actor.id,
        profile: {
          leftTeamVolume: { toFixed: () => '0' },
          rightTeamVolume: { toFixed: () => '0' },
        },
        status: UserStatus.ACTIVE,
        walletAddress: '0x3333333333333333333333333333333333333333',
      })
      .mockResolvedValueOnce(null);
    teamClosureRepository.countActiveSubtreeMembers
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1);
    teamClosureRepository.findByPlacementKey.mockResolvedValue(null);
    teamClosureRepository.hasSelfClosure.mockResolvedValue(true);
    teamClosureRepository.listAncestorRows.mockResolvedValue([
      { ancestorId: actor.id, depth: 0 },
    ]);
    teamClosureRepository.bindPlacement.mockResolvedValue({
      id: 'user_tie',
      inviterId: actor.id,
      parentId: actor.id,
      placementKey: `${actor.id}:RIGHT`,
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.RIGHT,
    });
    referralService.issueInviteCodeIfMissingForUserTx.mockResolvedValue({
      id: 'user_tie',
      inviterId: actor.id,
      inviteCode: 'SHARE123',
      parentId: actor.id,
      placementKey: `${actor.id}:RIGHT`,
      status: UserStatus.ACTIVE,
      teamPosition: TeamPosition.RIGHT,
    });

    const result = await service.tryAutoPlaceForBoundUserTx(
      'user_tie',
      {} as any,
    );

    expect(teamClosureRepository.countActiveSubtreeMembers).toHaveBeenNthCalledWith(
      1,
      'left_branch',
      expect.any(Object),
    );
    expect(teamClosureRepository.countActiveSubtreeMembers).toHaveBeenNthCalledWith(
      2,
      'right_branch',
      expect.any(Object),
    );
    expect(teamClosureRepository.bindPlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: actor.id,
        teamPosition: TeamPosition.RIGHT,
        userId: 'user_tie',
      }),
      expect.any(Object),
    );
    expect(result).toEqual({
      isPlacementPending: false,
      placement: {
        inviterId: actor.id,
        parentId: actor.id,
        placementKey: `${actor.id}:RIGHT`,
        teamPosition: TeamPosition.RIGHT,
        userId: 'user_tie',
      },
    });
  });
});
