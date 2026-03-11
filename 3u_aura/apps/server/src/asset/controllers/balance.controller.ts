import type { User } from '@/db';

import { CurrentUser, JwtAuthGuard } from '@/auth';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { BalanceService } from '../services/balance.service';
import { AssetService } from '../services/asset.sevice';

@Controller('balances')
@UseGuards(JwtAuthGuard)
export class BalanceController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly assetService: AssetService,
  ) {}

  @Get('/')
  async getBalances(@CurrentUser() user: User) {
    const balances = await this.balanceService.getBalancesByUser(user);
    return balances.map((balance) => ({
      ...balance,
      asset: balance.asset ? this.assetService.toClient(balance.asset) : null,
    }));
  }
}
