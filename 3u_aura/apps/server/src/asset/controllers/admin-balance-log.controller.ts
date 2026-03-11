import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BalanceLogService } from '../services/balance-log.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { AdminBalanceLogSearchDto } from '../dto/admin-balance-log-search.dto';

@Controller('admin/balance-logs')
@UseGuards(JwtAuthGuard)
export class AdminBalanceLogController {
  constructor(private readonly balanceLogService: BalanceLogService) {}

  @Get('/')
  async search(
    @Query()
    { skip, take, search, type, biz, userId }: AdminBalanceLogSearchDto,
  ) {
    const where: Prisma.BalanceLogWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (biz) {
      where.biz = biz;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { biz: { contains: search } },
        { bizId: { contains: search } },
      ];
    }

    const orderBy: Prisma.BalanceLogOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.balanceLogService.count({ where }),
      query: (paginateArgs) =>
        this.balanceLogService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.balanceLogService.toClient(item)),
    };
  }
}
