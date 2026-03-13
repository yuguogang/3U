import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { DEVICES } from '3u-aura-common';
import { AuthService } from '../services/auth.service';
import { SignatureSigninDto } from '../dto/signature-signin.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminWalletGuard } from '../guards/admin-wallet.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserService } from '@/user';
import type { User } from '@/db';
import * as dayjs from 'dayjs';
import { AdminPermissionService } from '../services/admin-permission.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly adminPermissionService: AdminPermissionService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(
    @Body() payload: SignatureSigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.signinBySignature(payload);
    this.adminPermissionService.assertAdminWallet(user.walletAddress);

    const {
      accessToken,
      accessTokenExpired,
      refreshAccessToken,
      refreshAccessTokenExpired,
    } = await this.authService.createTokensForUser(
      user,
      payload.device || DEVICES.BROWSER,
    );

    this.setRefreshCookie(res, {
      refreshAccessToken,
      refreshAccessTokenExpired,
    });

    return {
      accessToken,
      accessTokenExpired,
      user: this.userService.toClient(user),
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', this.cookieOptions());
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, AdminWalletGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return {
      isAdmin: true,
      user: this.userService.toClient(user),
    };
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
