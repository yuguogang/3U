import { Prisma, BalanceLog, DbService } from '@/db';
import { ClientBalanceLog } from '3u-aura-common';

import { Injectable } from '@nestjs/common';

@Injectable()
export class BalanceLogService {
  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.BalanceLogCountArgs) {
    const data = await this.db.balanceLog.count(args);

    return data;
  }

  async create(args: Prisma.BalanceLogCreateArgs) {
    const data = await this.db.balanceLog.create(args);

    return data;
  }

  async findMany<T extends Prisma.BalanceLogFindManyArgs>(
    args: T,
  ): Promise<Prisma.BalanceLogGetPayload<T>[]> {
    return this.db.balanceLog.findMany(args) as any;
  }

  async findOne<T extends Prisma.BalanceLogFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.BalanceLogGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.balanceLog[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.BalanceLogUpdateArgs) {
    const data = await this.db.balanceLog.update(args);

    return data;
  }

  async withBalanceLog({
    balanceLog,
    exception = true,
  }: {
    balanceLog: string | BalanceLog;
    exception?: boolean;
  }) {
    return typeof balanceLog === 'string'
      ? await this.findOne({ where: { id: balanceLog }, exception })
      : balanceLog;
  }

  toClient(data: BalanceLog) {
    return {
      ...data,
    } as unknown as ClientBalanceLog;
  }
}
