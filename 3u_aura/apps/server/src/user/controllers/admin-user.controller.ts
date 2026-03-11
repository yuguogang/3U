import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { UserSearchDto, UpdateUserStatusDto } from '../dto/user-search.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(private readonly userService: UserService) { }

  @Get('/')
  async search(@Query() { skip, take, search, status }: UserSearchDto) {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { inviteCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.userService.count({ where }),
      query: (paginateArgs) =>
        this.userService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.userService.toClient(item)),
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.userService.findOne({
      where: { id },
    });
    return this.userService.toClient(user);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: UpdateUserStatusDto,
  ) {
    const user = await this.userService.update({
      where: { id },
      data: { status },
    });
    return this.userService.toClient(user);
  }
}
