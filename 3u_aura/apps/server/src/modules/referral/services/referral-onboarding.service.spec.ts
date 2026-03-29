jest.mock('nanoid', () => ({
  nanoid: () => 'SHARE123',
}));

import { ReferralOnboardingService } from './referral-onboarding.service';

describe('ReferralOnboardingService', () => {
  const actor = { id: 'user_1' };
  const command = { inviteCode: 'INVITER01' };

  const createService = () => {
    const transactionOrchestrator = {
      run: jest.fn((operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const referralService = {
      bindInviterForUserTx: jest.fn(),
    };
    const treeTopologyService = {
      tryAutoPlaceForBoundUser: jest.fn(),
    };

    const service = new ReferralOnboardingService(
      transactionOrchestrator as any,
      referralService as any,
      treeTopologyService as any,
    );

    return {
      referralService,
      service,
      transactionOrchestrator,
      treeTopologyService,
    };
  };

  it('returns a non-pending binding when auto-placement succeeds', async () => {
    const { referralService, service, treeTopologyService } = createService();
    referralService.bindInviterForUserTx.mockResolvedValue({
      inviterId: 'inviter_1',
      inviterInviteCode: 'INVITER01',
      isPlacementPending: true,
      userId: actor.id,
    });
    treeTopologyService.tryAutoPlaceForBoundUser.mockResolvedValue({
      isPlacementPending: false,
      placement: {
        inviterId: 'inviter_1',
        parentId: 'parent_1',
        placementKey: 'parent_1:LEFT',
        teamPosition: 'LEFT',
        userId: actor.id,
      },
    });

    const result = await service.bindInviterAndAttemptAutoPlacement(
      actor,
      command,
    );

    expect(referralService.bindInviterForUserTx).toHaveBeenCalledWith(
      actor,
      command,
      expect.any(Object),
      expect.objectContaining({
        auditAction: 'referral.bind-inviter.confirmed',
      }),
    );
    expect(treeTopologyService.tryAutoPlaceForBoundUser).toHaveBeenCalledWith(
      actor.id,
      expect.objectContaining({
        auditAction: 'tree.bind-placement.auto-confirmed',
      }),
    );
    expect(result).toEqual({
      inviterId: 'inviter_1',
      inviterInviteCode: 'INVITER01',
      isPlacementPending: false,
      userId: actor.id,
    });
  });

  it('preserves pending state when auto-placement defers', async () => {
    const { referralService, service, treeTopologyService } = createService();
    referralService.bindInviterForUserTx.mockResolvedValue({
      inviterId: 'inviter_1',
      inviterInviteCode: 'INVITER01',
      isPlacementPending: true,
      userId: actor.id,
    });
    treeTopologyService.tryAutoPlaceForBoundUser.mockResolvedValue({
      isPlacementPending: true,
      reason: 'no-auto-slot',
    });

    const result = await service.bindInviterAndAttemptAutoPlacement(
      actor,
      command,
    );

    expect(result).toEqual({
      inviterId: 'inviter_1',
      inviterInviteCode: 'INVITER01',
      isPlacementPending: true,
      userId: actor.id,
    });
  });
});
