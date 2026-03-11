import { Prisma, DbService, type User } from '@/db';
import type { ClientUser } from '3u-aura-common';

import { Injectable, Logger } from '@nestjs/common';
import { compareSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly db: DbService) {}

  async count(args?: Prisma.UserCountArgs) {
    const data = await this.db.user.count(args);

    return data;
  }

  async create(args: Prisma.UserCreateArgs) {
    return this.db.$transaction(async () => {
      // 准备用户数据，添加默认的 User 角色
      const userData: Prisma.UserCreateInput = {
        ...args.data,
        password: this.hashPassword(args.data.password),
      };

      const updatedUser = await this.db.user.create({
        ...args,
        data: userData,
      });

      return updatedUser;
    });
  }

  async findMany<T extends Prisma.UserFindManyArgs>(
    args: T,
  ): Promise<Prisma.UserGetPayload<T>[]> {
    return this.db.user.findMany(args) as any;
  }

  async findOne<T extends Prisma.UserFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.UserGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.user[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }
  async update(args: Prisma.UserUpdateArgs) {
    const data = await this.db.user.update(args);
    return data;
  }

  async withUser({
    user,
    exception = true,
  }: {
    user: number | User;
    exception?: boolean;
  }) {
    return typeof user === 'number'
      ? await this.findOne({ where: { id: user }, exception })
      : user;
  }

  toClient(data?: User) {
    if (data) {
      const { password: _password, ...user } = data as any;
      return user as ClientUser;
    }
    return data;
  }

  hashPassword(password: string) {
    return hashSync(password, 10);
  }

  verifyPassword(password: string, hashedPassword: string) {
    return compareSync(password, hashedPassword);
  }
}
