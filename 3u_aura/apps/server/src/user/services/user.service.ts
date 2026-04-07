import {
  Prisma,
  DbService,
  NftType,
  PaymentPurpose,
  type User,
} from '@/db';
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
        nftHoldings: {
          orderBy: {
            mintedAt: 'desc',
          },
          select: {
            mintTxHashKey: true,
            mintedAt: true,
            nftType: true,
            tokenId: true,
          },
          where: {
            nftType: NftType.PURCHASED,
          },
        },
        paymentReceipts: {
          orderBy: [
            {
              confirmedAt: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
          select: {
            amount: true,
            confirmedAt: true,
            id: true,
            status: true,
            txHash: true,
            txHashKey: true,
          },
          take: 6,
          where: {
            purpose: PaymentPurpose.NFT_PURCHASE,
          },
        },
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { nftHoldings, paymentReceipts, ...clientUser } = user;
    const purchasedHoldingByTxHashKey = new Map(
      nftHoldings
        .filter((holding) => holding.mintTxHashKey)
        .map((holding) => [holding.mintTxHashKey!, holding]),
    );

    return {
      ...clientUser,
      recentPurchasedNftActivity: paymentReceipts.map((receipt) => {
        const holding = receipt.txHashKey
          ? purchasedHoldingByTxHashKey.get(receipt.txHashKey)
          : undefined;

        return {
          amount: receipt.amount.toFixed(0),
          confirmedAt: receipt.confirmedAt ?? undefined,
          mintedAt: holding?.mintedAt ?? undefined,
          paymentReceiptId: receipt.id,
          status: receipt.status,
          tokenId: holding?.tokenId?.toString(),
          txHash: receipt.txHash ?? undefined,
        };
      }),
    } as unknown as ClientUser;
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
