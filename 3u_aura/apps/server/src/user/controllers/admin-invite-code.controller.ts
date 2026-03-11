import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InviteCodeService } from '../services/invite-code.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { AdminInviteCodeSearchDto } from '../dto/admin-invite-code-search.dto';
import { AdminUpdateInviteCodeStatusDto } from '../dto/admin-update-invite-code-status.dto';

@Controller('admin/invite-codes')
@UseGuards(JwtAuthGuard)
export class AdminInviteCodeController {
  constructor(private readonly inviteCodeService: InviteCodeService) {}

  @Get('/')
  async search(
    @Query() { skip, take, search, status }: AdminInviteCodeSearchDto,
  ) {
    const where: Prisma.InviteCodeWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.code = { contains: search };
    }

    const orderBy: Prisma.InviteCodeOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.inviteCodeService.count({ where }),
      query: (paginateArgs) =>
        this.inviteCodeService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.inviteCodeService.toClient(item)),
    };
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: AdminUpdateInviteCodeStatusDto,
  ) {
    const inviteCode = await this.inviteCodeService.update({
      where: { id },
      data: { status },
    });
    return this.inviteCodeService.toClient(inviteCode);
  }
}
