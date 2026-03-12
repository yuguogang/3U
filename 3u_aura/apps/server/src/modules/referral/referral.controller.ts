import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BindInviterDto } from './dto';
import { ReferralService } from './services/referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('pending-placement')
  async getPendingPlacementInvitees(@CurrentUser() user: User) {
    return this.referralService.listPendingPlacementInvitees(user);
  }

  @Post('inviter/bind')
  @HttpCode(HttpStatus.OK)
  async bindInviter(@CurrentUser() user: User, @Body() body: BindInviterDto) {
    return this.referralService.bindInviterForUser(user, body);
  }
}
