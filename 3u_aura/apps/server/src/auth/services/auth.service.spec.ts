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
      bindInviterForUserTx: jest.fn(),
    };

    const service = new AuthService(
      configService as any,
      db as any,
      userService as any,
      cacheManager as any,
      jwtService as any,
      refreshTokenService as any,
      referralService as any,
    );

    jest.spyOn(service, 'generateMessage').mockResolvedValue({
      expired: Math.floor(Date.now() / 1000) + 300,
      message: `${SignatureScenarios.SIGNIN} Nonce: nonce`,
    });

    return {
      db,
      referralService,
      service,
      userService,
    };
  };

  it('creates a new referred user without issuing invite code before auto-bind', async () => {
    const { db, referralService, service, userService } = createService();
    userService.findOne.mockResolvedValue(null);

    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user_1',
          walletAddress: basePayload.address,
          inviteCode: null,
          status: UserStatus.ACTIVE,
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'user_1',
          walletAddress: basePayload.address,
          inviteCode: 'SHARE123',
          status: UserStatus.ACTIVE,
        }),
      },
    };
    db.$transaction.mockImplementation((operation: (tx: object) => Promise<unknown>) =>
      operation(tx as any),
    );

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
    expect(referralService.bindInviterForUserTx).toHaveBeenCalledWith(
      { id: 'user_1' },
      { inviteCode: 'INVITER01' },
      tx,
      expect.objectContaining({
        auditAction: 'referral.bind-inviter.auto-onboarded',
      }),
    );
    expect(result.inviteCode).toBe('SHARE123');
  });

  it('creates a new unreferred user without auto-binding', async () => {
    const { db, referralService, service, userService } = createService();
    userService.findOne.mockResolvedValue(null);

    const tx = {
      user: {
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

    expect(referralService.bindInviterForUserTx).not.toHaveBeenCalled();
    expect(result.inviteCode).toBeNull();
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
});
