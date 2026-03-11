import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BalanceService } from '../services/balance.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { BizTypes, paginate } from '3u-aura-common';
import { AdminBalanceSearchDto } from '../dto/admin-balance-search.dto';
import { AdminBalanceChangeDto } from '../dto/admin-balance-change.dto';

@Controller('admin/balances')
@UseGuards(JwtAuthGuard)
export class AdminBalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('/')
  async search(
    @Query() { skip, take, search, userId, assetId }: AdminBalanceSearchDto,
  ) {
    const where: Prisma.BalanceWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.symbol = { contains: search };
    }

    const orderBy: Prisma.BalanceOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.balanceService.count({ where }),
      query: (paginateArgs) =>
        this.balanceService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.balanceService.toClient(item)),
    };
  }

  @Post('change')
  async change(@Body() data: AdminBalanceChangeDto) {
    if (data.type === 'ADD') {
      await this.balanceService.change({
        toUser: data.userId,
        toAsset: data.symbol,
        toAmount: data.amount,
        biz: data.type,
      });
    } else {
      await this.balanceService.change({
        fromUser: data.userId,
        fromAsset: data.symbol,
        fromAmount: data.amount,
        biz: data.type,
      });
    }

    return { success: true };
  }
}
