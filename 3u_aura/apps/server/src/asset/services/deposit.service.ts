import { Prisma, DbService, type Deposit } from '@/db';
import { Injectable, Logger } from '@nestjs/common';
import { DepositStates, ClientDeposit } from '3u-aura-common';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.DepositCountArgs) {
    const data = await this.db.deposit.count(args);

    return data;
  }

  async create(args: Prisma.DepositCreateArgs) {
    const data = await this.db.deposit.create(args);

    return data;
  }

  async findMany<T extends Prisma.DepositFindManyArgs>(
    args: T,
  ): Promise<Prisma.DepositGetPayload<T>[]> {
    return this.db.deposit.findMany(args) as any;
  }

  async findOne<T extends Prisma.DepositFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.DepositGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.deposit[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.DepositUpdateArgs) {
    const data = await this.db.deposit.update(args);

    return data;
  }

  async updateState(
    id: string,
    state: DepositStates | Prisma.DepositUpdateInput,
  ) {
    const result = await this.update({
      where: { id },
      data: typeof state === 'string' ? { state } : state,
    });

    return result;
  }

  toClient(data?: Deposit) {
    if (!data) return undefined;

    return {
      ...data,
    } as unknown as ClientDeposit;
  }
}
