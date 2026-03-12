import { ConflictException } from '@nestjs/common';
import { UserStatus } from '3u-aura-common';
import { ReferralService } from './referral.service';
import { ReferralPolicyEngine } from '../engines/referral-policy.engine';

describe('ReferralService', () => {
  const actor = { id: 'user_1' };
  const command = { inviteCode: 'INVITER01' };

  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const transactionOrchestrator = {
      run: jest.fn((operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const referralRepository = {
      bindInviter: jest.fn(),
      findInviterByInviteCode: jest.fn(),
      findUserForBinding: jest.fn(),
      listPendingPlacementInvitees: jest.fn(),
    };

    const service = new ReferralService(
      auditSeam as any,
      transactionOrchestrator as any,
      new ReferralPolicyEngine(),
      referralRepository as any,
    );

    return {
      auditSeam,
      referralRepository,
      service,
    };
  };

  it('binds inviter for a user', async () => {
    const { auditSeam, referralRepository, service } = createService();
    referralRepository.findUserForBinding.mockResolvedValue({
      id: actor.id,
      inviteCode: 'USER1',
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
    });
    referralRepository.findInviterByInviteCode.mockResolvedValue({
      id: 'inviter_1',
      inviteCode: 'INVITER01',
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
    });
    referralRepository.bindInviter.mockResolvedValue({
      id: actor.id,
      inviteCode: 'USER1',
      inviterId: 'inviter_1',
      parentId: null,
      status: UserStatus.ACTIVE,
    });

    const result = await service.bindInviterForUser(actor, command);

    expect(referralRepository.bindInviter).toHaveBeenCalledWith(
      actor.id,
      'inviter_1',
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'referral.bind-inviter.confirmed' }),
    );
    expect(result).toEqual({
      inviterId: 'inviter_1',
      inviterInviteCode: 'INVITER01',
      isPlacementPending: true,
      userId: actor.id,
    });
  });

  it('returns idempotently when inviter is already bound to the same user', async () => {
    const { auditSeam, referralRepository, service } = createService();
    referralRepository.findUserForBinding.mockResolvedValue({
      id: actor.id,
      inviteCode: 'USER1',
      inviterId: 'inviter_1',
      parentId: null,
      status: UserStatus.ACTIVE,
    });
    referralRepository.findInviterByInviteCode.mockResolvedValue({
      id: 'inviter_1',
      inviteCode: 'INVITER01',
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
    });

    const result = await service.bindInviterForUser(actor, command);

    expect(referralRepository.bindInviter).not.toHaveBeenCalled();
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'referral.bind-inviter.idempotent' }),
    );
    expect(result.inviterId).toBe('inviter_1');
  });

  it('rejects binding a different inviter once frozen', async () => {
    const { referralRepository, service } = createService();
    referralRepository.findUserForBinding.mockResolvedValue({
      id: actor.id,
      inviteCode: 'USER1',
      inviterId: 'inviter_existing',
      parentId: null,
      status: UserStatus.ACTIVE,
    });
    referralRepository.findInviterByInviteCode.mockResolvedValue({
      id: 'inviter_1',
      inviteCode: 'INVITER01',
      inviterId: null,
      parentId: null,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.bindInviterForUser(actor, command),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists pending placement invitees for the inviter', async () => {
    const { referralRepository, service } = createService();
    referralRepository.listPendingPlacementInvitees.mockResolvedValue([
      {
        createdAt: new Date('2026-03-11T00:00:00.000Z'),
        id: 'user_2',
        inviterId: actor.id,
        parentId: null,
        walletAddress: '0x2222222222222222222222222222222222222222',
      },
    ]);

    const result = await service.listPendingPlacementInvitees(actor);

    expect(
      referralRepository.listPendingPlacementInvitees,
    ).toHaveBeenCalledWith(actor.id);
    expect(result).toEqual([
      {
        inviterId: actor.id,
        isPlacementPending: true,
        registeredAt: new Date('2026-03-11T00:00:00.000Z'),
        userId: 'user_2',
        walletAddress: '0x2222222222222222222222222222222222222222',
      },
    ]);
  });
});
