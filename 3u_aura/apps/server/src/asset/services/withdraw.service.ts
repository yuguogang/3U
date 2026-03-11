import { Prisma, DbService, type Withdraw } from '@/db';
import { WithdrawStates, ClientWithdraw } from '3u-aura-common';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WithdrawService {
  private readonly logger = new Logger(WithdrawService.name);

  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.WithdrawCountArgs) {
    const data = await this.db.withdraw.count(args);

    return data;
  }

  async create(args: Prisma.WithdrawCreateArgs) {
    const data = await this.db.withdraw.create(args);

    return data;
  }

  async findMany<T extends Prisma.WithdrawFindManyArgs>(
    args: T,
  ): Promise<Prisma.WithdrawGetPayload<T>[]> {
    return this.db.withdraw.findMany(args) as any;
  }

  async findOne<T extends Prisma.WithdrawFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.WithdrawGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.withdraw[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.WithdrawUpdateArgs) {
    const data = await this.db.withdraw.update(args);

    return data;
  }

  /**
   * Batch update withdraw records.
   * Used for "wakeup" scenarios (e.g. withdraw wallet top-up) to avoid query-then-loop updates.
   */
  async updateMany(args: Prisma.WithdrawUpdateManyArgs) {
    return this.db.withdraw.updateMany(args);
  }

  async updateState(
    id: string,
    state: WithdrawStates | Prisma.WithdrawUpdateInput,
  ) {
    const result = await this.update({
      where: { id },
      data: typeof state === 'object' ? state : { state },
    });

    return result;
  }

  toClient(data?: Withdraw) {
    if (!data) return undefined;

    return {
      ...data,
    } as unknown as ClientWithdraw;
  }
}
