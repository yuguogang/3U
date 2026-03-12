import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { User } from '@/db';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { PromotionCheckinResult } from '3u-aura-common';
import { CheckinRequestDto } from './dto';
import { CheckinApplicationService } from './services/checkin-application.service';

@Controller('checkin')
@UseGuards(JwtAuthGuard)
export class CheckinController {
  constructor(
    private readonly checkinApplicationService: CheckinApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submit(
    @CurrentUser() user: User,
    @Body() command: CheckinRequestDto,
  ): Promise<PromotionCheckinResult> {
    return this.checkinApplicationService.submitCheckinForUser(user, command);
  }
}
