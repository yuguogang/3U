import { Prisma, DbService, type User } from '@/db';
import type { ClientUser } from '3u-aura-common';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly db: DbService) { }

  async count(args?: Prisma.UserCountArgs) {
    const data = await this.db.user.count(args);

    return data;
  }

  async create(args: Prisma.UserCreateArgs) {
    return this.db.user.create(args);
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

    const user = await this.db.user[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    );

    return user as any;
  }

  async findById(id: string, exception = true): Promise<User | null> {
    return this.db.user[exception ? 'findFirstOrThrow' : 'findFirst']({
      where: { id },
    }) as any;
  }

  async findClientProfileById(id: string): Promise<ClientUser> {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as unknown as ClientUser;
  }

  async update(args: Prisma.UserUpdateArgs) {
    const data = await this.db.user.update(args);
    return data;
  }

  async withUser({
    user,
    exception = true,
  }: {
    user: string | User;
    exception?: boolean;
  }) {
    if (typeof user === 'string') {
      return await this.findById(user, exception);
    }
    return user;
  }

  toClient(data?: User) {
    if (data) {
      const { ...user } = data as any;
      return user as ClientUser;
    }
    return data;
  }
}
