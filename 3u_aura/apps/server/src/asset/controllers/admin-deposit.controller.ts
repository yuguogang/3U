import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepositService } from '../services/deposit.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { AdminDepositSearchDto } from '../dto/admin-deposit-search.dto';
import { AdminUpdateDepositStatusDto } from '../dto/admin-update-deposit-status.dto';

@Controller('admin/deposits')
@UseGuards(JwtAuthGuard)
export class AdminDepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get('/')
  async search(@Query() { skip, take, search, status }: AdminDepositSearchDto) {
    const where: Prisma.DepositWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const orderBy: Prisma.DepositOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.depositService.count({ where }),
      query: (paginateArgs) =>
        this.depositService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.depositService.toClient(item)),
    };
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: AdminUpdateDepositStatusDto,
  ) {
    const deposit = await this.depositService.update({
      where: { id },
      data: { status },
    });
    return this.depositService.toClient(deposit);
  }
}
