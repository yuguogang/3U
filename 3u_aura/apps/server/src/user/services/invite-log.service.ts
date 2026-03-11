import { DbService, type InviteLog, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InviteLogService {
  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.InviteLogCountArgs) {
    const data = await this.db.inviteLog.count(args);

    return data;
  }

  async create(args: Prisma.InviteLogCreateArgs) {
    const data = await this.db.inviteLog.create(args);

    return data;
  }

  async findMany<T extends Prisma.InviteLogFindManyArgs>(
    args: T,
  ): Promise<Prisma.InviteLogGetPayload<T>[]> {
    return this.db.inviteLog.findMany(args) as any;
  }

  async findOne<T extends Prisma.InviteLogFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.InviteLogGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.inviteLog[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.InviteLogUpdateArgs) {
    const data = await this.db.inviteLog.update(args);

    return data;
  }

  toClient(inviteLog: InviteLog) {
    if (!inviteLog) {
      return undefined;
    }
    return {
      id: inviteLog.id,
      userId: inviteLog.userId,
      inviteCodeId: inviteLog.inviteCodeId,
      usedAt: inviteLog.usedAt,
    };
  }
}
