import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthSignatureSigninInput, DEVICES, SignatureScenarios } from '3u-aura-common';
import { isAddress, getAddress, verifyMessage } from 'viem';
import * as dayjs from 'dayjs';
import { Cache } from 'cache-manager';
import { randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import { DbService, type User } from '@/db';
import { UserService } from '@/user';
import { ConfigService } from '@nestjs/config';
import { UserStatuses } from '3u-aura-common';
import { RefreshTokenService } from './refresh-token.service';

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
  ) {}

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

  // 生成随机 Nonce
  async generateMessage({
    address,
    scenario,
  }: {
    address: string;
    scenario: SignatureScenarios;
  }) {
    const expiredSeconds = 5 * 60; // 5 分钟有效
    const key = `sign_msg:${scenario}:${address}`;
    let data = await this.cacheManager.get<{
      expired: number;
      message: string;
    }>(key);
    if (
      !data ||
      dayjs.unix(data.expired).subtract(15, 'seconds').isBefore(new Date())
    ) {
      const nonce = this.generateNonce();

      const expired = dayjs().add(expiredSeconds, 'seconds');

      const message = `${scenario} Nonce: ${nonce}
Expired: ${expired.format('YYYY/MM/DD HH:mm:ss')}`;
      data = { message, expired: expired.unix() };
      await this.cacheManager.set(key, data, expiredSeconds * 1000);
    }

    return data;
  }

  generateNonce() {
    const nonceBytes = randomBytes(16); // 保持 16 字节的熵

    // 转换为标准的 Base64 字符串
    const base64String = nonceBytes.toString('base64');

    // 替换 Base64 中不适合作为 URL/Cookie/字段的特殊字符 (+, /, =)
    // 转换为 Base64URL Safe 格式
    const base64UrlSafe = base64String
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, ''); // 移除填充字符 =

    return base64UrlSafe;
  }

  async signinBySignature(payload: AuthSignatureSigninInput) {
    const { message: storedMessage } = await this.generateMessage({
      address: payload.address,
      scenario: SignatureScenarios.SIGNIN,
    });

    const valid = await verifyMessage({
      message: storedMessage,
      signature: payload.signature as any,
      address: payload.address as any,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 查询钱包是否存在,存在则直接登录
    let user = await this.userService.findOne({
      where: { address: payload.address },
      exception: false,
    });
    if (!user) {
      // 没有则创建新用户
      const username = nanoid();
      const password = nanoid();
      user = await this.db.$transaction(async () => {
        if (!payload.name) {
          throw new BadRequestException('User name must be set');
        }

        const user = await this.userService.create({
          data: {
            name: payload.name,
            username,
            email: `${username}@crypto-keep.com`,
            password,
            address: payload.address,
            chain: payload.chain,
            status: UserStatuses.ACTIVE, // 新创建的用户默认启用
          },
        });

        return user;
      });
    }

    // 检查用户状态：只有启用状态（status = 1）的用户才能登录
    if (user.status !== UserStatuses.ACTIVE) {
      throw new UnauthorizedException('User account is disabled');
    }

    return user;
  }

  async createRefreshTokenRecord(userId: number, device: DEVICES) {
    const token = nanoid();

    const refreshAccessToken = await this.jwtService.sign(
      {
        sub: token,
      },
      {
        secret: this.configService.get('auth.jwt.refresh.secret'),
        ...this.configService.get('auth.jwt.refresh.signOptions'),
      },
    );
    const { exp: refreshAccessTokenExpired } =
      await this.jwtService.decode(refreshAccessToken);

    const record = await this.refreshTokenService.create({
      data: {
        userId,
        token,
        device,
        expiredAt: new Date(refreshAccessTokenExpired * 1000),
      },
    });
    return { refreshAccessToken, refreshAccessTokenExpired, record };
  }

  async createTokensForUser(user: User, device: DEVICES) {
    const accessToken = await this.jwtService.sign(
      {
        sub: user.id,
      },
      {
        secret: this.configService.get('auth.jwt.secret'),
        ...this.configService.get('auth.jwt.signOptions'),
      },
    );
    const { exp: accessTokenExpired } =
      await this.jwtService.decode(accessToken);
    // 重新获取的时候去掉旧的
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

  async signinByPassword(username: string, password: string) {
    const user = await this.userService.findOne({
      where: { username },
      exception: false,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const valid = this.userService.verifyPassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.status !== UserStatuses.ACTIVE) {
      throw new UnauthorizedException('User account is disabled');
    }

    return user;
  }

  async revokeRefreshTokenFormUser(user: User, device: DEVICES) {
    // 清除掉用户登出的的access_token和过期的access_token
    await this.refreshTokenService.deleteAll({
      where: {
        OR: [{ userId: user.id, device }, { expiredAt: { lte: new Date() } }],
      },
    });
  }
}
