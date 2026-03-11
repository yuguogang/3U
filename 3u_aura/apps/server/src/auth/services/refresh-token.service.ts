import type { Prisma } from '@/db';

import { DbService } from '@/db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.RefreshTokenCountArgs) {
    const data = await this.db.refreshToken.count(args);

    return data;
  }

  async create(args: Prisma.RefreshTokenCreateArgs) {
    const user = await this.db.refreshToken.create(args);

    return user;
  }

  async deleteAll(args: Prisma.RefreshTokenDeleteManyArgs) {
    const data = await this.db.refreshToken.deleteMany(args);

    return data;
  }

  async findOne<T extends Prisma.RefreshTokenFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.RefreshTokenGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.refreshToken[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.RefreshTokenUpdateArgs) {
    const data = await this.db.refreshToken.update(args);

    return data;
  }
}
