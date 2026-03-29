import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignatureScenarios, UserStatus } from '3u-aura-common';

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  getAddress: (value: string) => value,
  isAddress: () => true,
  verifyMessage: jest.fn().mockResolvedValue(true),
}));

jest.mock('nanoid', () => ({
  nanoid: () => 'MOCKTOKEN',
}));

describe('AuthService', () => {
  const basePayload = {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    signature: '0x' + '1'.repeat(130),
    device: 'browser',
  };

  const createService = () => {
    const configService = {
      get: jest.fn(),
    };
    const db = {
      $transaction: jest.fn(),
    };
    const userService = {
      findOne: jest.fn(),
    };
    const cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const jwtService = {
      sign: jest.fn(),
      decode: jest.fn(),
    };
    const refreshTokenService = {
      create: jest.fn(),
      deleteAll: jest.fn(),
    };
    const referralService = {
      issueInviteCodeIfMissingForUserTx: jest.fn(),
    };
    const referralOnboardingService = {
      bindInviterForUserTx: jest.fn(),
    };
    const treeTopologyService = {
      initializeRootUserTx: jest.fn(),
      tryAutoPlaceForBoundUser: jest.fn(),
    };

    const service = new AuthService(
      configService as any,
      db as any,
      userService as any,
      cacheManager as any,
      jwtService as any,
      refreshTokenService as any,
      referralService as any,
      referralOnboardingService as any,
      treeTopologyService as any,
    );

    jest.spyOn(service, 'generateMessage').mockResolvedValue({
      expired: Math.floor(Date.now() / 1000) + 300,
      message: `${SignatureScenarios.SIGNIN} Nonce: nonce\nExpired: 2099/01/01 00:00:00`,
    });

    return {
      db,
      referralOnboardingService,
      referralService,
      service,
      treeTopologyService,
      userService,
    };
  };

  it('creates a new referred user without issuing invite code before auto-bind', async () => {
    const {
      db,
      referralOnboardingService,
      referralService,
      service,
      treeTopologyService,
      userService,
    } = createService();
    userService.findOne.mockResolvedValue(null);

    const tx = {
      user: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({
          id: 'user_1',
          walletAddress: basePayload.address,
          inviteCode: null,
          status: UserStatus.ACTIVE,
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user_1',
          walletAddress: basePayload.address,
          inviteCode: null,
          status: UserStatus.ACTIVE,
        }),
      },
    };
    db.$transaction.mockImplementation((operation: (tx: object) => Promise<unknown>) =>
      operation(tx as any),
    );
    userService.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user_1',
        walletAddress: basePayload.address,
        inviterId: 'inviter_1',
        parentId: 'parent_1',
        inviteCode: 'SHARE123',
        status: UserStatus.ACTIVE,
      });

    const result = await service.signinBySignature({
      ...basePayload,
      referralCode: 'inviter01',
    });

    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        inviteCode: null,
        status: UserStatus.ACTIVE,
        walletAddress: basePayload.address,
      },
    });
    expect(referralOnboardingService.bindInviterForUserTx).toHaveBeenCalledWith(
      { id: 'user_1' },
      { inviteCode: 'INVITER01' },
      tx,
      expect.objectContaining({
        bindAuditAction: 'referral.bind-inviter.auto-onboarded',
      }),
    );
    expect(treeTopologyService.tryAutoPlaceForBoundUser).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({
        auditAction: 'tree.bind-placement.auto-onboarded',
      }),
    );
    expect(result.inviteCode).toBe('SHARE123');
  });

  it('creates a new unreferred user without auto-binding', async () => {
    const {
      db,
      referralOnboardingService,
      referralService,
      service,
      treeTopologyService,
      userService,
    } = createService();
    userService.findOne.mockResolvedValue(null);

    const tx = {
      user: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({
          id: 'user_2',
          walletAddress: basePayload.address,
          inviteCode: null,
          status: UserStatus.ACTIVE,
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user_2',
          walletAddress: basePayload.address,
          inviteCode: null,
          status: UserStatus.ACTIVE,
        }),
      },
    };
    db.$transaction.mockImplementation((operation: (tx: object) => Promise<unknown>) =>
      operation(tx as any),
    );

    const result = await service.signinBySignature(basePayload);

    expect(
      referralOnboardingService.bindInviterForUserTx,
    ).not.toHaveBeenCalled();
    expect(referralService.issueInviteCodeIfMissingForUserTx).not.toHaveBeenCalled();
    expect(treeTopologyService.initializeRootUserTx).not.toHaveBeenCalled();
    expect(result.inviteCode).toBeNull();
  });

  it('issues invite code for the first root user', async () => {
    const {
      db,
      referralOnboardingService,
      referralService,
      service,
      treeTopologyService,
      userService,
    } = createService();
    userService.findOne.mockResolvedValue(null);

    const tx = {
      user: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 'user_root',
          walletAddress: basePayload.address,
          inviteCode: null,
          status: UserStatus.ACTIVE,
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user_root',
          walletAddress: basePayload.address,
          inviteCode: 'ROOT1234',
          status: UserStatus.ACTIVE,
        }),
      },
    };
    db.$transaction.mockImplementation((operation: (tx: object) => Promise<unknown>) =>
      operation(tx as any),
    );
    referralService.issueInviteCodeIfMissingForUserTx.mockResolvedValue({
      id: 'user_root',
      walletAddress: basePayload.address,
      inviteCode: 'ROOT1234',
      status: UserStatus.ACTIVE,
    });

    const result = await service.signinBySignature(basePayload);

    expect(
      referralOnboardingService.bindInviterForUserTx,
    ).not.toHaveBeenCalled();
    expect(referralService.issueInviteCodeIfMissingForUserTx).toHaveBeenCalledWith(
      'user_root',
      tx,
    );
    expect(treeTopologyService.initializeRootUserTx).toHaveBeenCalledWith(
      'user_root',
      tx,
    );
    expect(result.inviteCode).toBe('ROOT1234');
  });

  it('rejects disabled users after sign-in verification', async () => {
    const { service, userService } = createService();
    userService.findOne.mockResolvedValue({
      id: 'user_3',
      walletAddress: basePayload.address,
      inviteCode: null,
      status: UserStatus.BLOCKED,
    });

    await expect(service.signinBySignature(basePayload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attempts auto-placement when a previously created user signs in with a referral code', async () => {
    const { db, referralOnboardingService, service, treeTopologyService, userService } = createService();
    userService.findOne.mockResolvedValue({
      id: 'user_existing',
      inviterId: null,
      parentId: null,
      inviteCode: null,
      walletAddress: basePayload.address,
      status: UserStatus.ACTIVE,
    });

    const tx = {
      user: {},
    };
    db.$transaction.mockImplementation((operation: (tx: object) => Promise<unknown>) =>
      operation(tx as any),
    );
    userService.findOne
      .mockResolvedValueOnce({
        id: 'user_existing',
        inviterId: null,
        parentId: null,
        inviteCode: null,
        walletAddress: basePayload.address,
        status: UserStatus.ACTIVE,
      })
      .mockResolvedValueOnce({
        id: 'user_existing',
        inviterId: 'inviter_1',
        parentId: 'parent_1',
        inviteCode: 'SHARE123',
        walletAddress: basePayload.address,
        status: UserStatus.ACTIVE,
      });

    const result = await service.signinBySignature({
      ...basePayload,
      referralCode: 'inviter01',
    });

    expect(
      referralOnboardingService.bindInviterForUserTx,
    ).toHaveBeenCalledWith(
      { id: 'user_existing' },
      { inviteCode: 'INVITER01' },
      tx,
      expect.objectContaining({
        bindAuditAction: 'referral.bind-inviter.auto-signin-recovered',
      }),
    );
    expect(treeTopologyService.tryAutoPlaceForBoundUser).toHaveBeenCalledWith(
      'user_existing',
      expect.objectContaining({
        auditAction: 'tree.bind-placement.auto-signin-recovered',
      }),
    );
    expect(result.inviteCode).toBe('SHARE123');
  });
});
