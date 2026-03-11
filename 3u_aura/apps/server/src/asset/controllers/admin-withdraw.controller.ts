import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WithdrawService } from '../services/withdraw.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { AdminWithdrawSearchDto } from '../dto/admin-withdraw-search.dto';
import { AdminUpdateWithdrawStatusDto } from '../dto/admin-update-withdraw-status.dto';

@Controller('admin/withdraws')
@UseGuards(JwtAuthGuard)
export class AdminWithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @Get('/')
  async search(
    @Query() { skip, take, search, status }: AdminWithdrawSearchDto,
  ) {
    const where: Prisma.WithdrawWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const orderBy: Prisma.WithdrawOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.withdrawService.count({ where }),
      query: (paginateArgs) =>
        this.withdrawService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.withdrawService.toClient(item)),
    };
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: AdminUpdateWithdrawStatusDto,
  ) {
    const withdraw = await this.withdrawService.update({
      where: { id },
      data: { status },
    });
    return this.withdrawService.toClient(withdraw);
  }
}
