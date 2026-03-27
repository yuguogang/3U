import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthSignatureSigninInput, SignatureScenarios, UserStatus } from '3u-aura-common';
import { isAddress, getAddress, verifyMessage } from 'viem';
import * as dayjs from 'dayjs';
import { Cache } from 'cache-manager';
import { randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import { DbService, type User } from '@/db';
import { UserService } from '@/user';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { ReferralService } from '@/modules/referral';
import { TreeTopologyService } from '@/modules/tree';

type AuthSignatureMessagePayload = {
  expired: number;
  message: string;
};

type RefreshTokenRecordPayload = {
  refreshAccessToken: string;
  refreshAccessTokenExpired: number;
};

type TokenBundlePayload = {
  accessToken: string;
  accessTokenExpired: number;
  refreshAccessToken: string;
  refreshAccessTokenExpired: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly db: DbService,
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly referralService: ReferralService,
    private readonly treeTopologyService: TreeTopologyService,
  ) { }

  async verifySignature(
    address: string,
    signature: `0x${string}`,
    message: string,
  ): Promise<string> {
    if (!address || !isAddress(address)) {
      throw new UnauthorizedException('Invalid address');
    }
    if (!signature || !message) {
      throw new UnauthorizedException('Signature and message required');
    }

    const isValid = await verifyMessage({
      address: getAddress(address),
      message,
      signature,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    const payload = { sub: getAddress(address), address: getAddress(address) };
    return this.jwtService.sign(payload);
  }

  async generateMessage({
    address,
    scenario,
  }: {
    address: string;
    scenario: SignatureScenarios;
  }): Promise<AuthSignatureMessagePayload> {
    const expiredSeconds = 5 * 60; // 5 minutes
    const key = `sign_msg:${scenario}:${address}`;
    let data: AuthSignatureMessagePayload | undefined;
    try {
      data = await this.cacheManager.get<AuthSignatureMessagePayload>(key);
    } catch {
      data = undefined;
    }
    if (
      !data ||
      dayjs.unix(data.expired).subtract(15, 'seconds').isBefore(new Date())
    ) {
      data = this.buildChallengeMessage(scenario, expiredSeconds);
      try {
        await this.cacheManager.set(key, data, expiredSeconds * 1000);
      } catch {
        // Fall back to stateless challenge delivery when cache is unavailable.
      }
    }

    return data;
  }

  generateNonce() {
    return randomBytes(16).toString('hex');
  }

  async signinBySignature(payload: AuthSignatureSigninInput): Promise<User> {
    const challengeMessage =
      payload.message ||
      (
        await this.generateMessage({
          address: payload.address,
          scenario: SignatureScenarios.SIGNIN,
        })
      ).message;

    this.assertChallengeMessage(challengeMessage, SignatureScenarios.SIGNIN);

    const valid = await verifyMessage({
      message: challengeMessage,
      signature: payload.signature as any,
      address: payload.address as any,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid signature');
    }

    let user = await this.userService.findOne({
      where: { walletAddress: getAddress(payload.address) },
      exception: false,
    });

    if (!user) {
      user = await this.db.$transaction(async (tx) => {
        const userCount = await tx.user.count();
        const createdUser = await tx.user.create({
          data: {
            walletAddress: getAddress(payload.address),
            status: UserStatus.ACTIVE,
            inviteCode: null,
          },
        });

        if (payload.referralCode?.trim()) {
          await this.referralService.bindInviterForUserTx(
            { id: createdUser.id },
            { inviteCode: payload.referralCode.trim().toUpperCase() },
            tx,
            {
              auditAction: 'referral.bind-inviter.auto-onboarded',
              idempotentAuditAction: 'referral.bind-inviter.auto-onboarded.idempotent',
            },
          );
        } else if (userCount === 0) {
          await this.referralService.issueInviteCodeIfMissingForUserTx(
            createdUser.id,
            tx,
          );
          await this.treeTopologyService.initializeRootUserTx(
            createdUser.id,
            tx,
          );
        }

        return tx.user.findUniqueOrThrow({
          where: { id: createdUser.id },
        });
      });
    } else if (
      payload.referralCode?.trim() &&
      !user.inviterId &&
      !user.parentId
    ) {
      user = await this.db.$transaction(async (tx) => {
        await this.referralService.bindInviterForUserTx(
          { id: user!.id },
          { inviteCode: payload.referralCode!.trim().toUpperCase() },
          tx,
          {
            auditAction: 'referral.bind-inviter.auto-signin-recovered',
            idempotentAuditAction:
              'referral.bind-inviter.auto-signin-recovered.idempotent',
          },
        );

        return tx.user.findUniqueOrThrow({
          where: { id: user!.id },
        });
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is disabled');
    }

    return user;
  }

  private buildChallengeMessage(
    scenario: SignatureScenarios,
    expiredSeconds: number,
  ): AuthSignatureMessagePayload {
    const nonce = this.generateNonce();
    const expired = dayjs().add(expiredSeconds, 'seconds');

    return {
      message: `${scenario} Nonce: ${nonce}
Expired: ${expired.format('YYYY/MM/DD HH:mm:ss')}`,
      expired: expired.unix(),
    };
  }

  private assertChallengeMessage(
    message: string,
    scenario: SignatureScenarios,
  ) {
    const [scenarioLine, expiredLine] = message.split('\n');

    if (!scenarioLine?.startsWith(`${scenario} Nonce: `)) {
      throw new UnauthorizedException('Invalid signature challenge');
    }

    const expiredAt = expiredLine?.replace('Expired: ', '').trim();
    if (!expiredAt) {
      throw new UnauthorizedException('Invalid signature challenge');
    }

    if (dayjs(expiredAt, 'YYYY/MM/DD HH:mm:ss', true).isBefore(dayjs())) {
      throw new UnauthorizedException('Signature challenge expired');
    }
  }

  async createRefreshTokenRecord(
    userId: string,
    device: string,
  ): Promise<RefreshTokenRecordPayload> {
    const token = nanoid();

    const refreshAccessToken = await this.jwtService.sign(
      { sub: token },
      {
        secret: this.configService.get('auth.jwt.refresh.secret'),
        ...this.configService.get('auth.jwt.refresh.signOptions'),
      },
    );
    const { exp: refreshAccessTokenExpired } =
      (await this.jwtService.decode(refreshAccessToken)) as any;

    await this.refreshTokenService.create({
      data: {
        userId,
        token,
        device,
        expiredAt: new Date(refreshAccessTokenExpired * 1000),
      },
    });
    return { refreshAccessToken, refreshAccessTokenExpired };
  }

  async createTokensForUser(
    user: User,
    device: string,
  ): Promise<TokenBundlePayload> {
    const accessToken = await this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('auth.jwt.secret'),
        ...this.configService.get('auth.jwt.signOptions'),
      },
    );
    const { exp: accessTokenExpired } = (await this.jwtService.decode(
      accessToken,
    )) as any;

    // Revoke old tokens for this device
    await this.revokeRefreshTokenFormUser(user, device);

    const { refreshAccessToken, refreshAccessTokenExpired } =
      await this.createRefreshTokenRecord(user.id, device);

    return {
      accessToken,
      accessTokenExpired,
      refreshAccessToken,
      refreshAccessTokenExpired,
    };
  }

  async revokeRefreshTokenFormUser(user: User, device: string) {
    await this.refreshTokenService.deleteAll({
      where: {
        OR: [{ userId: user.id, device }, { expiredAt: { lte: new Date() } }],
      },
    });
  }
}
