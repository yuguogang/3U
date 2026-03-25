import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { User } from '@/db';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  PromotionCurrentLotteryParticipationView,
  PromotionLotteryOutcomeView,
} from '3u-aura-common';
import {
  LotteryParticipateRequestDto,
  LotteryRevealRequestDto,
} from './dto';
import { LotteryTicketService } from './services/lottery-ticket.service';

@Controller('lottery')
@UseGuards(JwtAuthGuard)
export class LotteryController {
  constructor(private readonly lotteryTicketService: LotteryTicketService) {}

  @Get('current')
  getCurrentLottery(
    @CurrentUser() user: User,
  ): Promise<PromotionCurrentLotteryParticipationView> {
    return this.lotteryTicketService.getCurrentLotteryForUser(user.id);
  }

  @Post('participate')
  @HttpCode(HttpStatus.OK)
  participate(
    @CurrentUser() user: User,
    @Body() command: LotteryParticipateRequestDto,
  ): Promise<PromotionCurrentLotteryParticipationView> {
    return this.lotteryTicketService.participateInCurrentEpoch(
      user.id,
      command.epochId,
    );
  }

  @Post('reveal')
  @HttpCode(HttpStatus.OK)
  reveal(
    @CurrentUser() user: User,
    @Body() command: LotteryRevealRequestDto,
  ): Promise<PromotionLotteryOutcomeView> {
    return this.lotteryTicketService.revealResultForEpoch(
      user.id,
      command.epochId,
    );
  }
}
