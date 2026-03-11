import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssetService } from '../services/asset.sevice';
import { JwtAuthGuard } from '@/auth';
import { Prisma } from '@/db';
import { paginate } from '3u-aura-common';
import { AdminAssetSearchDto } from '../dto/admin-asset-search.dto';
import { AdminUpdateAssetStatusDto } from '../dto/admin-update-asset-status.dto';

@Controller('admin/assets')
@UseGuards(JwtAuthGuard)
export class AdminAssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get('/')
  async search(@Query() { skip, take, search, status }: AdminAssetSearchDto) {
    const where: Prisma.AssetWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { symbol: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.AssetOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const data = await paginate({
      skip,
      take,
      count: () => this.assetService.count({ where }),
      query: (paginateArgs) =>
        this.assetService.findMany({
          where,
          ...paginateArgs,
          orderBy,
        }),
    });

    return {
      ...data,
      items: data.items.map((item) => this.assetService.toClient(item)),
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const asset = await this.assetService.findOne({
      where: { id: parseInt(id) },
    });
    return this.assetService.toClient(asset);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: AdminUpdateAssetStatusDto,
  ) {
    const asset = await this.assetService.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    return this.assetService.toClient(asset);
  }
}
