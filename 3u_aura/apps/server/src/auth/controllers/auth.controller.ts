import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import { DEVICES } from '3u-aura-common';

import { AuthService } from '../services/auth.service';
import { SignatureMessageDto } from '../dto/signature-message.dto';
import { SignatureSigninDto } from '../dto/signature-signin.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserService } from '@/user';
import type { User } from '@/db';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('signature_message')
  async getSignatureMessage(
    @Query() { address, scenario }: SignatureMessageDto,
  ) {
    return this.authService.generateMessage({
      address,
      scenario,
    });
  }

  @Post('signature_signin')
  async signinBySignature(
    @Body() payload: SignatureSigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.signinBySignature(payload);

    const {
      accessToken,
      accessTokenExpired,
      refreshAccessToken,
      refreshAccessTokenExpired,
    } = await this.authService.createTokensForUser(
      user,
      payload.device ?? DEVICES.BROWSER,
    );

    this.setRefreshCookie(res, {
      refreshAccessToken,
      refreshAccessTokenExpired,
    });

    return { accessToken, accessTokenExpired };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.userService.toClient(user);
  }

  private cookieOptions(expiresIn: number = 60 * 60 * 24 * 30 * 1000) {
    const isProd = this.configService.get<boolean>('prod') ?? false;
    const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';
    const secure = isProd;

    return {
      httpOnly: true,
      sameSite,
      secure,
      maxAge: expiresIn,
    };
  }

  private setRefreshCookie(
    res: Response,
    {
      refreshAccessToken,
      refreshAccessTokenExpired,
    }: { refreshAccessToken: string; refreshAccessTokenExpired: number },
  ) {
    const expiresIn =
      dayjs.unix(refreshAccessTokenExpired).diff(new Date(), 'seconds') * 1000;

    res.cookie(
      'refresh_token',
      refreshAccessToken,
      this.cookieOptions(expiresIn),
    );
  }
}
