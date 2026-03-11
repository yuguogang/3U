import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InviteLogService } from '../services/invite-log.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { AdminInviteLogSearchDto } from '../dto/admin-invite-log-search.dto';

@Controller('admin/invite-logs')
@UseGuards(JwtAuthGuard)
export class AdminInviteLogController {
  constructor(private readonly inviteLogService: InviteLogService) {}

  @Get('/')
  async search(@Query() { skip, take, search }: AdminInviteLogSearchDto) {
    const where: Prisma.InviteLogWhereInput = {};

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { inviteCodeId: { contains: search } },
      ];
    }

    const orderBy: Prisma.InviteLogOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.inviteLogService.count({ where }),
      query: (paginateArgs) =>
        this.inviteLogService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.inviteLogService.toClient(item)),
    };
  }
}
