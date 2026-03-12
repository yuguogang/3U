import { DbService, Prisma, TeamPosition as DbTeamPosition } from '@/db';
import { Injectable } from '@nestjs/common';
import { TeamPosition } from '3u-aura-common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class VolumeSnapshotRepository {
  constructor(private readonly db: DbService) {}

  async findCheckinSource(
    sourceCheckinId: string,
    executor: DbExecutor = this.db,
  ): Promise<
    | Pick<
        Prisma.CheckinGetPayload<{
          select: {
            dateKey: true;
            id: true;
            payAmountUsdt: true;
            userId: true;
          };
        }>,
        'dateKey' | 'id' | 'payAmountUsdt' | 'userId'
      >
    | null
  > {
    return executor.checkin.findUnique({
      where: { id: sourceCheckinId },
      select: {
        dateKey: true,
        id: true,
        payAmountUsdt: true,
        userId: true,
      },
    });
  }

  async listPropagationPath(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<
    Array<{
      ancestorId: string;
      depth: number;
      teamPosition: TeamPosition | null;
    }>
  > {
    const rows = await executor.teamClosure.findMany({
      where: { descendantId: userId },
      orderBy: { depth: 'asc' },
      select: {
        depth: true,
        ancestor: {
          select: {
            id: true,
            teamPosition: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      ancestorId: row.ancestor.id,
      depth: row.depth,
      teamPosition: this.toCommonTeamPosition(row.ancestor.teamPosition),
    }));
  }

  private toCommonTeamPosition(
    position: DbTeamPosition | null,
  ): TeamPosition | null {
    switch (position) {
      case DbTeamPosition.LEFT:
        return TeamPosition.LEFT;
      case DbTeamPosition.RIGHT:
        return TeamPosition.RIGHT;
      default:
        return null;
    }
  }
}
