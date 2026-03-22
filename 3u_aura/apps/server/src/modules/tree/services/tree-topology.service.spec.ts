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
      ensureSelfClosure: jest.fn().mockResolvedValue(undefined),
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
});
