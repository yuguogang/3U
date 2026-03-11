import { Asset, Prisma, DbService } from '@/db';
import { ClientAsset } from '3u-aura-common';

import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetService {
  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.AssetCountArgs) {
    const data = await this.db.asset.count(args);

    return data;
  }

  async create(args: Prisma.AssetCreateArgs) {
    const data = await this.db.asset.create(args);

    return data;
  }

  async findMany<T extends Prisma.AssetFindManyArgs>(
    args: T,
  ): Promise<Prisma.AssetGetPayload<T>[]> {
    return this.db.asset.findMany(args) as any;
  }

  async findOne<T extends Prisma.AssetFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.AssetGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.asset[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.AssetUpdateArgs) {
    const data = await this.db.asset.update(args);

    return data;
  }

  async withAsset<
    TInclude extends Prisma.AssetInclude | undefined = undefined,
  >({
    asset,
    include,
    exception = true,
  }: {
    asset: number | string | Asset;
    include?: TInclude;
    exception?: boolean;
  }): Promise<
    TInclude extends Prisma.AssetInclude
      ? Prisma.AssetGetPayload<{ include: TInclude }>
      : Asset
  > {
    // 如果已经是 Asset 对象，直接返回
    if (typeof asset !== 'string' && typeof asset !== 'number') {
      return asset as any;
    }

    // 根据 ID 或 symbol 查询
    const where = typeof asset === 'string' ? { symbol: asset } : { id: asset };

    const result = await this.db.asset[
      exception ? 'findFirstOrThrow' : 'findFirst'
    ]({
      where,
      include,
    } as any);

    return result as any;
  }

  toClient(data?: Asset) {
    return data ? (data as ClientAsset) : data;
  }
}
