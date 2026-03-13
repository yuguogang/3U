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
import { AdminPermissionService, AdminWalletGuard, JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import {
  type UpdateUserStatusInput,
  type UserSearchInput,
  UserSearchDto,
  UpdateUserStatusDto,
} from '../dto/user-search.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminWalletGuard)
export class AdminUserController {
  constructor(
    private readonly adminPermissionService: AdminPermissionService,
    private readonly userService: UserService,
  ) {}

  @Get('/')
  async search(@Query() queryDto: UserSearchDto) {
    const { skip, take, search, status } = queryDto as UserSearchInput;
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
          include: { profile: true },
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => ({
        ...this.userService.toClient(item),
        isAdminAllowed: this.adminPermissionService.isAdminWallet(
          item.walletAddress,
        ),
      })),
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.userService.findOne({
      include: { profile: true },
      where: { id },
    });
    return {
      ...this.userService.toClient(user),
      isAdminAllowed: this.adminPermissionService.isAdminWallet(
        user.walletAddress,
      ),
    };
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    const { status } = body as UpdateUserStatusInput;
    const user = await this.userService.update({
      where: { id },
      data: { status },
    });
    return this.userService.toClient(user);
  }
}
