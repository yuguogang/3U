import { DbService, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class RankingSnapshotRepository {
  constructor(private readonly db: DbService) {}

  async listEpochCandidates(
    data: {
      dateKeyFromInclusive: string;
      dateKeyToExclusive: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<Array<{ incrementUsdt: string; userId: string }>> {
    const users = await executor.user.findMany({
      where: {
        dailyStats: {
          some: {
            dateKey: {
              lt: data.dateKeyToExclusive,
            },
          },
        },
      },
      select: {
        id: true,
        dailyStats: {
          where: {
            dateKey: {
              lt: data.dateKeyToExclusive,
            },
          },
          orderBy: {
            dateKey: 'asc',
          },
          select: {
            dateKey: true,
            smallLegVolumeUsdt: true,
          },
        },
      },
    });

    return users.map((user) => {
      const baseline = [...user.dailyStats]
        .filter((stat) => stat.dateKey < data.dateKeyFromInclusive)
        .at(-1);
      const current = [...user.dailyStats]
        .filter((stat) => stat.dateKey < data.dateKeyToExclusive)
        .at(-1);
      const increment =
        BigInt(current?.smallLegVolumeUsdt.toFixed(0) ?? '0') -
        BigInt(baseline?.smallLegVolumeUsdt.toFixed(0) ?? '0');

      return {
        incrementUsdt: increment > 0n ? increment.toString() : '0',
        userId: user.id,
      };
    });
  }
}
