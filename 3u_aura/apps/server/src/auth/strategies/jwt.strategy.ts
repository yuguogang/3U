import { UserService } from '@/user';
import { UserStatuses } from '3u-aura-common';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.jwt.secret'),
    });
  }

  async validate(payload: any) {
    if (!payload.sub) return null;
    const user = await this.userService.findOne({
      where: { id: payload.sub },
      exception: false,
    });
    if (!user) return null;

    // 检查用户状态：只有启用状态（status = 1）的用户才能通过验证
    if (user.status !== UserStatuses.ACTIVE) {
      return null;
    }

    return { ...user, device: payload.device };
  }
}
