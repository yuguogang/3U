import { ConflictException } from '@nestjs/common';
import { TeamPosition, UserStatus } from '3u-aura-common';
import { PlacementPolicyEngine } from '../engines/placement-policy.engine';
import { TreeTopologyService } from './tree-topology.service';

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
      listSelectableParents: jest.fn(),
      listAncestorRows: jest.fn(),
    };

    const service = new TreeTopologyService(
      auditSeam as any,
      transactionOrchestrator as any,
      new PlacementPolicyEngine(),
      teamClosureRepository as any,
    );

    return {
      auditSeam,
      service,
      teamClosureRepository,
    };
  };

  it('binds a placement and inserts closure rows', async () => {
    const { auditSeam, service, teamClosureRepository } = createService();
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

    const result = await service.bindPlacementForInviter(actor, command);

    expect(teamClosureRepository.bindPlacement).toHaveBeenCalled();
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
});
