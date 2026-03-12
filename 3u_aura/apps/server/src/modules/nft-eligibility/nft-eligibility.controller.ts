import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { NftEligibilityApplicationService } from './services/nft-eligibility-application.service';

@Controller('nft-eligibility')
@UseGuards(JwtAuthGuard)
export class NftEligibilityController {
  constructor(
    private readonly nftEligibilityApplicationService: NftEligibilityApplicationService,
  ) {}

  @Get('current')
  async getCurrent(@CurrentUser() user: User) {
    return this.nftEligibilityApplicationService.getCurrentEligibility({
      walletAddress: user.walletAddress,
    });
  }
}
