import type { Request } from 'express';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { RefreshTokenService } from '../services/refresh-token.service';
import { UserStatus } from '3u-aura-common';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    super({
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: (request: Request) => {
        // 从cookie中获取
        return request.cookies?.refresh_token || null;
      },
      secretOrKey: configService.get('auth.jwt.refresh.secret', {
        infer: true,
      }),
    });
  }

  async validate(payload: any) {
    if (!payload.sub) return null;

    const token = await this.refreshTokenService.findOne({
      where: { id: payload.sub },
      include: { user: true },
      exception: false,
    });

    if (!token.user) return null;

    // 检查用户状态：只有启用状态（status = 'active'）的用户才能刷新 token
    if (token.user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return { ...token.user, device: payload.device };
  }
}
