import { Prisma, DbService, Asset, Balance, BalanceLog, User } from '@/db';

import { Injectable } from '@nestjs/common';
import { AssetService } from './asset.sevice';
// import { BalanceManager } from '../manager/balance.manager';
import { BigNumber } from 'bignumber.js';
import { UserService } from '@/user';
import { UnexpectedValueException } from '@/exceptions';
import { InsufficientBalanceException } from '../exceptions/insufficient-balance.exception';
import { BalanceLogService } from './balance-log.service';
import { BalanceLogTypes, AssetStatuses } from '3u-aura-common';

export type ChangeOptions = {
  fromUser?: number | User;
  fromAsset?: number | string | Asset;
  fromAmount?: string | number | BigNumber;

  toUser?: number | User;
  toAsset?: number | string | Asset;
  toAmount?: string | number | BigNumber;

  biz: string;
  bizId?: string;

  data?: Record<string, any>;
};

export type FreezeOptions = {
  user: User;
  asset: number | string | Asset;
  amount: string | number | BigNumber;
  biz: string;
  bizId?: string;

  data?: Record<string, any>;
};

export type UnfreezeOptions = {
  balanceLog: string | BalanceLog;
};

export type ReleaseOptions = {
  balanceLog: string | BalanceLog;
};

@Injectable()
export class BalanceService {
  constructor(
    private readonly db: DbService,
    private readonly balanceLogService: BalanceLogService,
    private readonly userService: UserService,
    private readonly assetService: AssetService,
  ) {}

  async count(args?: Prisma.BalanceCountArgs) {
    const data = await this.db.balance.count(args);

    return data;
  }

  async create(args: Prisma.BalanceCreateArgs) {
    const data = await this.db.balance.create(args);

    return data;
  }

  async findMany<T extends Prisma.BalanceFindManyArgs>(
    args: T,
  ): Promise<Prisma.BalanceGetPayload<T>[]> {
    return this.db.balance.findMany(args) as any;
  }

  async findOne<T extends Prisma.BalanceFindFirstArgs>(
    args: T & { exception?: boolean },
  ): Promise<Prisma.BalanceGetPayload<T>> {
    const { exception = true, ...rest } = args;

    return this.db.balance[exception ? 'findFirstOrThrow' : 'findFirst'](
      rest as any,
    ) as any;
  }

  async findOneOrCreate<T extends Prisma.BalanceFindFirstArgs>(
    args: T & { create: Prisma.BalanceCreateArgs },
  ): Promise<Prisma.BalanceGetPayload<T>> {
    const { create, ...rest } = args;
    let data = await this.findOne<T>({ ...rest, exception: false } as any);

    if (!data) {
      data = (await this.create(create)) as any;
    }

    return data;
  }

  async update(args: Prisma.BalanceUpdateArgs) {
    const data = await this.db.balance.update(args);

    return data;
  }

  async getBalancesByUser(user: User) {
    const assets = await this.db.asset.findMany({
      where: {
        status: AssetStatuses.ENABLE,
      },
    });

    const balances = await this.findMany({
      where: {
        userId: user.id,
      },
    });

    return assets.map((asset) => {
      const balance = balances.find(
        (balance) => balance.symbol === asset.symbol,
      );

      return {
        id: balance?.id,
        amount: balance?.amount || 0,
        frozen: balance?.frozen || 0,
        createdAt: balance?.createdAt,
        updatedAt: balance?.updatedAt,
        symbol: asset.symbol,
        userId: user.id,
        ...balance,
        asset,
      };
    });
  }

  // 获取资产余额, 如果没有默认会创建空的余额记录
  async getAssetBalanceByUser({ user, asset }: { user: User; asset: Asset }) {
    return this.findOneOrCreate({
      where: {
        userId: user.id,
        symbol: asset.symbol,
      },
      create: {
        data: {
          userId: user.id,
          symbol: asset.symbol,
          amount: 0,
          frozen: 0,
        },
      },
    });
  }

  // 更新余额额度 安全写法避免 并发超扣, 并发超扣, 并发超扣, 双花
  private async safeUpdateBalance({
    userId,
    symbol,
    amount,
  }: {
    userId: number;
    symbol: string;
    amount: BigNumber;
  }) {
    // 使用原生 SQL 在 MySQL 的 DECIMAL(65,18) 上做加减，避免任何 JS/Prisma 层面的精度问题
    // 仍然通过 WHERE amount >= ... 保持并发安全扣款语义
    if (amount.gt(0)) {
      const inc = amount.toString();

      // NOTE: 使用 ? 占位符参数绑定（Prisma 会走 prepared statement），避免 SQL 注入
      const affected = await this.db.$executeRawUnsafe(
        `UPDATE Balance
         SET amount = amount + CAST(? AS DECIMAL(65, 18))
         WHERE userId = ? AND symbol = ?`,
        inc,
        userId,
        symbol,
      );

      if (!(affected > 0)) throw new InsufficientBalanceException();
    } else {
      const dec = amount.abs().toString();

      const affected = await this.db.$executeRawUnsafe(
        `UPDATE Balance
         SET amount = amount - CAST(? AS DECIMAL(65, 18))
         WHERE userId = ?
           AND symbol = ?
           AND amount >= CAST(? AS DECIMAL(65, 18))`,
        dec,
        userId,
        symbol,
        dec,
      );

      if (!(affected > 0)) throw new InsufficientBalanceException();
    }

    return await this.findOne({ where: { userId, symbol } });
  }

  // 余额变动操作
  async change({
    fromUser: _fromUser,
    fromAsset: _fromAsset,
    fromAmount,
    toUser: _toUser,
    toAsset: _toAsset,
    toAmount,
    biz,
    bizId,
    data,
  }: ChangeOptions) {
    // 只有当 fromAmount 和 toAmount 不为 undefined 时才处理
    // 允许值为 0（会创建 balance log 但不会改变余额）

    // 来源用户参数校验
    const fromUser = _fromUser
      ? await this.userService.withUser({ user: _fromUser, exception: false })
      : undefined;
    if (_fromUser && !fromUser) {
      const fromUserId =
        typeof _fromUser === 'number' ? _fromUser : _fromUser.id;
      throw new UnexpectedValueException(`用户ID ${fromUserId} 不存在`);
    }
    const fromAsset = _fromAsset
      ? await this.assetService.withAsset({
          asset: _fromAsset,
          exception: false,
        })
      : undefined;
    if (fromUser && !fromAsset) {
      throw new UnexpectedValueException('fromAsset with fromUser must be set');
    }

    // 目标用户参数校验
    const toUser = _toUser
      ? await this.userService.withUser({ user: _toUser, exception: false })
      : undefined;
    if (_toUser && !toUser) {
      const toUserId = typeof _toUser === 'number' ? _toUser : _toUser.id;
      throw new UnexpectedValueException(`用户ID ${toUserId} 不存在`);
    }
    const toAsset = _toAsset
      ? await this.assetService.withAsset({ asset: _toAsset, exception: false })
      : undefined;
    if (toUser && !toAsset) {
      throw new UnexpectedValueException('toAsset with toUser must be set');
    }

    // 来源用户和目标用户必须指定一个
    if (!fromUser && !toUser) {
      throw new UnexpectedValueException('fromUser and toUser are required');
    }

    // 事务执行
    return this.db.$transaction(
      async () => {
        // 获取关联资产余额
        let fromBalance =
          fromUser && fromAsset
            ? await this.getAssetBalanceByUser({
                user: fromUser,
                asset: fromAsset,
              })
            : undefined;
        let finalFromBalance:
          | (Balance & { balanceLogs: BalanceLog[] })
          | undefined;
        // 如果 fromAmount 不为 undefined 且来源余额存在，则处理（允许值为 0）
        if (fromAmount !== undefined && fromBalance) {
          const fromAmountBN = new BigNumber(fromAmount).abs();
          const fromBeforeAmount = fromBalance.amount;
          const fromBeforeFrozen = fromBalance.frozen;
          const changeAmount = fromAmountBN.negated(); // 转成负数扣款额度

          // 只有当金额大于 0 时才实际更新余额，否则只创建 balance log
          if (fromAmountBN.gt(0)) {
            fromBalance = await this.safeUpdateBalance({
              userId: fromBalance.userId,
              symbol: fromBalance.symbol,
              amount: changeAmount,
            });
          }

          const fromBalanceLog = await this.balanceLogService.create({
            data: {
              type: BalanceLogTypes.EXPENSE,
              change: changeAmount.toString(),
              amount: fromBalance.amount,
              beforeAmount: fromBeforeAmount,
              frozen: fromBalance.frozen,
              beforeFrozen: fromBeforeFrozen,
              userId: fromBalance.userId,
              symbol: fromBalance.symbol,

              biz,
              bizId,
              data,
            },
          });

          finalFromBalance = {
            ...fromBalance,
            balanceLogs: [fromBalanceLog],
          };
        }

        let toBalance =
          toUser && toAsset
            ? await this.getAssetBalanceByUser({ user: toUser, asset: toAsset })
            : undefined;
        let finalToBalance:
          | (Balance & { balanceLogs: BalanceLog[] })
          | undefined;
        // 如果 toAmount 不为 undefined 且目标余额存在，则处理（允许值为 0）
        if (toAmount !== undefined && toBalance) {
          const toAmountBN = new BigNumber(toAmount).abs();
          const toBeforeAmount = toBalance.amount;
          const toBeforeFrozen = toBalance.frozen;
          const changeAmount = toAmountBN; // 正数增加额度

          // 只有当金额大于 0 时才实际更新余额，否则只创建 balance log
          if (toAmountBN.gt(0)) {
            toBalance = await this.safeUpdateBalance({
              userId: toBalance.userId,
              symbol: toBalance.symbol,
              amount: changeAmount,
            });
          }

          const toBalanceLog = await this.balanceLogService.create({
            data: {
              type: BalanceLogTypes.INCOME,
              change: changeAmount.toString(),
              amount: toBalance.amount,
              beforeAmount: toBeforeAmount,
              frozen: toBalance.frozen,
              beforeFrozen: toBeforeFrozen,
              userId: toBalance.userId,
              symbol: toBalance.symbol,

              biz,
              bizId,
              data,
            },
          });

          finalToBalance = {
            ...toBalance,
            balanceLogs: [toBalanceLog],
          };
        }

        return { fromBalance: finalFromBalance, toBalance: finalToBalance };
      },
      { timeout: 10_000 },
    );
  }

  // 冻结余额额度 安全写法避免 并发超扣, 并发超扣, 并发超扣, 双花
  private async safeFeezeBalance({
    userId,
    symbol,
    amount,
  }: {
    userId: number;
    symbol: string;
    amount: BigNumber;
  }) {
    const data: Prisma.BalanceUpdateManyMutationInput = {};
    const where: Prisma.BalanceWhereInput = {
      userId,
      symbol,
    };

    const finalAmount = new Prisma.Decimal(amount.abs().toString()); // 用string转换作为Decimal类型,避免精度丢失

    // 必须要大于额度 才能扣除
    where.amount = {
      gte: finalAmount,
    };

    // 减少余额
    data.amount = {
      decrement: finalAmount,
    };
    // 增加冻结额度
    data.frozen = {
      increment: finalAmount,
    };

    const { count } = await this.db.balance.updateMany({
      where,
      data,
    });

    if (!(count > 0)) throw new InsufficientBalanceException();

    const balance = await this.findOne({ where: { userId, symbol } });

    return balance;
  }

  // 余额冻结操作
  async freeze({ user, asset, amount, biz, bizId, data }: FreezeOptions) {
    amount = new BigNumber(amount);
    if (!amount.gt(0)) {
      throw new UnexpectedValueException(
        'Amount must be valid positive number',
      );
    }

    // 目标用户参数校验
    user = await this.userService.withUser({ user });

    asset = await this.assetService.withAsset({ asset });

    return this.db.$transaction(
      async () => {
        let balance = await this.getAssetBalanceByUser({ user, asset });

        if (balance.amount.lt(amount.toString())) {
          throw new InsufficientBalanceException('Insufficient balance');
        }
        const changeAmount = amount;
        const beforeAmount = balance.amount;
        const beforeFrozen = balance.frozen;
        balance = await this.safeFeezeBalance({
          userId: balance.userId,
          symbol: balance.symbol,
          amount: changeAmount,
        });

        const balanceLog = await this.balanceLogService.create({
          data: {
            type: BalanceLogTypes.FREEZE, // 冻结
            change: changeAmount.toString(),
            amount: balance.amount,
            beforeAmount,
            frozen: balance.frozen,
            beforeFrozen,
            userId: balance.userId,
            symbol: balance.symbol,

            biz,
            bizId,
            data,
          },
        });

        const finalBalance = {
          ...balance,
          balanceLogs: [balanceLog],
        };

        return finalBalance;
      },
      { timeout: 10_000 },
    );
  }

  // 冻结额度返还 安全写法避免 并发超扣, 并发超扣, 并发超扣, 双花
  private async safeUnfreezeBalance({
    userId,
    symbol,
    amount,
  }: {
    userId: number;
    symbol: string;
    amount: BigNumber;
  }) {
    // 使用原生 SQL 在 MySQL 的 DECIMAL(65,18) 上做加减，避免任何 JS/Prisma 层面的精度问题
    // 仍然通过 WHERE frozen >= ... 保持并发安全语义
    const dec = amount.abs().toString();

    const affected = await this.db.$executeRawUnsafe(
      `UPDATE Balance
       SET amount = amount + CAST(? AS DECIMAL(65, 18)),
           frozen = frozen - CAST(? AS DECIMAL(65, 18))
       WHERE userId = ?
         AND symbol = ?
         AND frozen >= CAST(? AS DECIMAL(65, 18))`,
      dec,
      dec,
      userId,
      symbol,
      dec,
    );

    if (!(affected > 0)) throw new InsufficientBalanceException();

    return await this.findOne({ where: { userId, symbol } });
  }

  // 冻结额度返还: 冻结额度扣除, 返还额度到余额中
  async unfreeze({ balanceLog }: UnfreezeOptions) {
    balanceLog = await this.balanceLogService.withBalanceLog({ balanceLog });

    // 注意：这里传入的 balanceLog 通常是 FREEZE 日志
    // - balanceLog.change: 本次冻结的额度（应为正数）
    // - balanceLog.beforeFrozen / balanceLog.frozen: 冻结前后的 frozen（差值应等于 change）
    const logFrozen = new BigNumber(balanceLog.frozen.toString());
    const logBeforeFrozen = new BigNumber(balanceLog.beforeFrozen.toString());
    const calcChangeAmount = logFrozen.minus(logBeforeFrozen);

    const changeAmount = new BigNumber(balanceLog.change.toString());
    if (
      changeAmount.isNaN() ||
      !changeAmount.gt(0) ||
      calcChangeAmount.isNaN() ||
      !calcChangeAmount.gt(0) ||
      !calcChangeAmount.eq(changeAmount)
    ) {
      // 日志不可信/不匹配，直接拒绝执行，避免错误解冻造成资产风险
      throw new UnexpectedValueException('Invalid balance log for unfreeze');
    }

    // 目标用户参数校验
    const user = await this.userService.withUser({ user: balanceLog.userId });

    const asset = await this.assetService.withAsset({
      asset: balanceLog.symbol,
    });

    const biz = balanceLog.biz;
    const bizId = balanceLog.bizId;
    const data = {};

    return this.db.$transaction(
      async () => {
        let balance = await this.getAssetBalanceByUser({ user, asset });
        const beforeAmount = balance.amount;
        const beforeFrozen = balance.frozen;
        balance = await this.safeUnfreezeBalance({
          userId: balance.userId,
          symbol: balance.symbol,
          amount: changeAmount,
        });

        const balanceLog = await this.balanceLogService.create({
          data: {
            type: BalanceLogTypes.UNFREEZE, // 解冻返还
            change: changeAmount.toString(),
            amount: balance.amount,
            beforeAmount,
            frozen: balance.frozen,
            beforeFrozen,
            userId: balance.userId,
            symbol: balance.symbol,

            biz,
            bizId,
            data,
          },
        });

        const finalBalance = {
          ...balance,
          balanceLogs: [balanceLog],
        };

        return finalBalance;
      },
      { timeout: 10_000 },
    );
  }

  // 释放冻结额度, 减少冻结额度, 不返还额度到余额中
  private async safeReleaseBalance({
    userId,
    symbol,
    amount,
  }: {
    userId: number;
    symbol: string;
    amount: BigNumber;
  }) {
    // 使用原生 SQL 在 MySQL 的 DECIMAL(65,18) 上做加减，避免任何 JS/Prisma 层面的精度问题
    // 仍然通过 WHERE frozen >= ... 保持并发安全语义
    const dec = amount.abs().toString();

    const affected = await this.db.$executeRawUnsafe(
      `UPDATE Balance
       SET frozen = frozen - CAST(? AS DECIMAL(65, 18))
       WHERE userId = ?
         AND symbol = ?
         AND frozen >= CAST(? AS DECIMAL(65, 18))`,
      dec,
      userId,
      symbol,
      dec,
    );

    if (!(affected > 0)) throw new InsufficientBalanceException();

    return await this.findOne({ where: { userId, symbol } });
  }

  // 释放冻结 扣除冻结额度, 直接
  async release({ balanceLog }: ReleaseOptions) {
    balanceLog = await this.balanceLogService.withBalanceLog({ balanceLog });

    // 注意：这里传入的 balanceLog 通常是 FREEZE 日志
    // - balanceLog.change: 本次冻结的额度（应为正数）
    // - balanceLog.beforeFrozen / balanceLog.frozen: 冻结前后的 frozen（差值应等于 change）
    const logFrozen = new BigNumber(balanceLog.frozen.toString());
    const logBeforeFrozen = new BigNumber(balanceLog.beforeFrozen.toString());
    const calcChangeAmount = logFrozen.minus(logBeforeFrozen);

    const changeAmount = new BigNumber(balanceLog.change.toString());
    if (
      changeAmount.isNaN() ||
      !changeAmount.gt(0) ||
      calcChangeAmount.isNaN() ||
      !calcChangeAmount.gt(0) ||
      !calcChangeAmount.eq(changeAmount)
    ) {
      // 日志不可信/不匹配，直接拒绝执行，避免错误释放造成资产风险
      throw new UnexpectedValueException('Invalid balance log for release');
    }

    // 目标用户参数校验
    const user = await this.userService.withUser({ user: balanceLog.userId });

    const asset = await this.assetService.withAsset({
      asset: balanceLog.symbol,
    });

    const biz = balanceLog.biz;
    const bizId = balanceLog.bizId;
    const data = {};

    return this.db.$transaction(
      async () => {
        let balance = await this.getAssetBalanceByUser({ user, asset });
        const beforeAmount = balance.amount;
        const beforeFrozen = balance.frozen;
        balance = await this.safeReleaseBalance({
          userId: balance.userId,
          symbol: balance.symbol,
          amount: changeAmount,
        });

        const balanceLog = await this.balanceLogService.create({
          data: {
            type: BalanceLogTypes.RELEASE, // 释放冻结
            change: changeAmount.toString(),
            amount: balance.amount,
            beforeAmount,
            frozen: balance.frozen,
            beforeFrozen,
            userId: balance.userId,
            symbol: balance.symbol,

            biz,
            bizId,
            data,
          },
        });

        const finalBalance = {
          ...balance,
          balanceLogs: [balanceLog],
        };

        return finalBalance;
      },
      { timeout: 10_000 },
    );
  }

  toClient(data?: Balance) {
    if (data) {
      return {
        ...data,
        amount: data.amount.toNumber(),
        frozen: data.frozen.toNumber(),
      };
    }

    return data;
  }
}
