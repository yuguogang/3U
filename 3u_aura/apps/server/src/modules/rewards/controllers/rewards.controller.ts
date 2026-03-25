import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import { Controller, Get, UseGuards } from '@nestjs/common';
import type { PromotionWeeklyResultsView } from '3u-aura-common';
import { RewardsReadService } from '../services/rewards-read.service';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsReadService: RewardsReadService) {}

  @Get('me')
  listMyRewards(@CurrentUser() user: User) {
    return this.rewardsReadService.listRewardsForUser(user.id);
  }

  @Get('me/latest-weekly-results')
  getLatestWeeklyResults(
    @CurrentUser() user: User,
  ): Promise<PromotionWeeklyResultsView | null> {
    return this.rewardsReadService.getLatestWeeklyResultsForUser(user.id);
  }
}
