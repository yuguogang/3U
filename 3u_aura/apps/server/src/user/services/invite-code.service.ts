import { DbService, Prisma } from '@/db';
import type { User } from '@/db';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InviteCodeStatuses } from '3u-aura-common';
import { customAlphabet } from 'nanoid';

const random6Numbers = customAlphabet('0123456789', 6);

@Injectable()
export class InviteCodeService {
  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.InviteCodeCountArgs) {
    const data = await this.db.inviteCode.count(args);

    return data;
  }

  async create(args: Prisma.InviteCodeCreateArgs) {
    const data = await this.db.inviteCode.create(args);

    return data;
  }

  async findMany<T extends Prisma.InviteCodeFindManyArgs>(
    args: T,
  ): Promise<Prisma.InviteCodeGetPayload<T>[]> {
    return this.db.inviteCode.findMany(args) as any;
  }

  async findOne<T extends Prisma.InviteCodeFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.InviteCodeGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.inviteCode[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async update(args: Prisma.InviteCodeUpdateArgs) {
    const data = await this.db.inviteCode.update(args);

    return data;
  }

  toClient(inviteCode: any) {
    if (!inviteCode) {
      return undefined;
    }
    return {
      id: inviteCode.id,
      code: inviteCode.code,
      status: inviteCode.status,
      createdAt: inviteCode.createdAt,
      expiresAt: inviteCode.expiresAt,
    };
  }

  async getByCode(code: string) {
    const invite = this.findOne({
      where: {
        code,
        status: InviteCodeStatuses.ACTIVE,
      },
    });

    return invite;
  }

  async createByUser({ user }: { user: User }) {
    const code = await this.generateUniqueCode();

    const result = await this.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
      },
    });

    return result;
  }

  /**
   * 生成唯一的邀请码（带唯一性检查和重试）
   * @param maxRetries 最大重试次数，默认10次
   * @returns 唯一的邀请码
   */
  async generateUniqueCode(maxRetries: number = 10): Promise<string> {
    let i = 1;
    while (i <= maxRetries) {
      const code = random6Numbers();

      // 检查邀请码是否已存在
      const count = await this.count({
        where: { code },
      });
      if (!(count > 0)) {
        return code;
      }
      i++;
    }

    throw new BadRequestException(
      'Can not generate unique invite code, please try again later',
    );
  }
}
