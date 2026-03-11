import {
  BadRequestException,
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
import { z } from 'zod';
import * as dayjs from 'dayjs';

import { AuthService } from '../services/auth.service';
import { SignatureMessageDto } from '../dto/signature-message.dto';
import { SignatureSigninDto } from '../dto/signature-signin.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserService } from '@/user';
import type { User } from '@/db';

const nonceQuerySchema = z.object({
  address: z.string().min(1, 'Address required'),
});

const verifyBodySchema = z.object({
  address: z.string().min(1, 'Address required'),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]{130,132}$/, 'Invalid signature format'),
  message: z.string().min(1, 'Message required'),
});

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
    // 实际项目中应将 Nonce 存储到数据库并关联到该地址，设置过期时间
    const message = await this.authService.generateMessage({
      address,
      scenario,
    });
    return message;
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
    } = await this.authService.createTokensForUser(user, payload.device);
    this.setRefreshCookie(res, {
      refreshAccessToken,
      refreshAccessTokenExpired,
    });
    return { accessToken, accessTokenExpired };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    const fullUser = await this.userService.findOne({
      where: { id: user.id },
      exception: true,
    });
    const valid = this.userService.verifyPassword(
      dto.currentPassword,
      fullUser.password,
    );
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.userService.update({
      where: { id: user.id },
      data: {
        password: this.userService.hashPassword(dto.newPassword),
      },
    });
    return { success: true };
  }

  private cookieOptions(expiresIn: number = 60 * 60 * 24 * 30 * 1000) {
    const isProd = !!this.configService.get('prod');
    const sameSite = (isProd ? 'none' : 'lax') as any;
    const secure = isProd;

    return {
      httpOnly: true,
      // sameSite: 'strict' as const,
      sameSite,
      secure,
      // domain: process.env.COOKIE_DOMAIN || undefined,
      // path: '/auth/refresh',
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
