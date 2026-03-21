import { DbService, Prisma, TeamPosition, User } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

type TreePlacementUser = Pick<
  User,
  'id' | 'inviterId' | 'parentId' | 'placementKey' | 'status' | 'teamPosition'
>;

type TreePlacementParent = Pick<
  User,
  'id' | 'inviterId' | 'parentId' | 'status' | 'walletAddress'
>;

type TreeSelectableParent = Pick<
  User,
  'id' | 'inviterId' | 'parentId' | 'status' | 'walletAddress'
> & {
  depth: number;
};

type TreeSnapshotNode = Pick<
  User,
  | 'id'
  | 'walletAddress'
  | 'inviteCode'
  | 'inviterId'
  | 'parentId'
  | 'placementKey'
  | 'status'
  | 'teamPosition'
> & {
  depth: number;
  profile: null | {
    hasPurchasedNft: boolean;
    hasReferralNft: boolean;
    leftTeamVolume: Prisma.Decimal;
    rightTeamVolume: Prisma.Decimal;
    smallLegVolume: Prisma.Decimal;
    totalAuraFromCheckin: Prisma.Decimal;
    totalAuraFromConsolation: Prisma.Decimal;
    totalAuraFromDirect: Prisma.Decimal;
    totalAuraFromIndirect: Prisma.Decimal;
  };
};

@Injectable()
export class TeamClosureRepository {
  constructor(private readonly db: DbService) {}

  async findUserForPlacement(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<TreePlacementUser | null> {
    return executor.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        inviterId: true,
        parentId: true,
        placementKey: true,
        status: true,
        teamPosition: true,
      },
    });
  }

  async findParentForPlacement(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<TreePlacementParent | null> {
    return executor.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        inviterId: true,
        parentId: true,
        status: true,
        walletAddress: true,
      },
    });
  }

  async findByPlacementKey(
    placementKey: string,
    executor: DbExecutor = this.db,
  ): Promise<Pick<User, 'id'> | null> {
    return executor.user.findFirst({
      where: { placementKey },
      select: { id: true },
    });
  }

  async hasAncestorLink(
    ancestorId: string,
    descendantId: string,
    executor: DbExecutor = this.db,
  ): Promise<boolean> {
    const row = await executor.teamClosure.findFirst({
      where: { ancestorId, descendantId },
      select: { id: true },
    });

    return Boolean(row);
  }

  async hasSelfClosure(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<boolean> {
    return this.hasAncestorLink(userId, userId, executor);
  }

  async ensureSelfClosure(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.teamClosure.createMany({
      data: [
        {
          ancestorId: userId,
          depth: 0,
          descendantId: userId,
        },
      ],
      skipDuplicates: true,
    });
  }

  async listAncestorRows(
    descendantId: string,
    executor: DbExecutor = this.db,
  ): Promise<Array<{ ancestorId: string; depth: number }>> {
    return executor.teamClosure.findMany({
      where: { descendantId },
      orderBy: { depth: 'asc' },
      select: {
        ancestorId: true,
        depth: true,
      },
    });
  }

  async listSelectableParents(
    ancestorId: string,
    executor: DbExecutor = this.db,
  ): Promise<TreeSelectableParent[]> {
    const rows = await executor.teamClosure.findMany({
      where: { ancestorId },
      orderBy: [{ depth: 'asc' }, { descendantId: 'asc' }],
      select: {
        depth: true,
        descendant: {
          select: {
            id: true,
            inviterId: true,
            parentId: true,
            status: true,
            walletAddress: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      depth: row.depth,
      ...row.descendant,
    }));
  }

  async listSubtreeNodes(
    ancestorId: string,
    options?: { depth?: number },
    executor: DbExecutor = this.db,
  ): Promise<TreeSnapshotNode[]> {
    const rows = await executor.teamClosure.findMany({
      where: {
        ancestorId,
        ...(options?.depth !== undefined ? { depth: { lte: options.depth } } : {}),
      },
      orderBy: [{ depth: 'asc' }, { descendantId: 'asc' }],
      select: {
        depth: true,
        descendant: {
          select: {
            id: true,
            walletAddress: true,
            inviteCode: true,
            inviterId: true,
            parentId: true,
            placementKey: true,
            status: true,
            teamPosition: true,
            profile: {
              select: {
                hasPurchasedNft: true,
                hasReferralNft: true,
                leftTeamVolume: true,
                rightTeamVolume: true,
                smallLegVolume: true,
                totalAuraFromCheckin: true,
                totalAuraFromConsolation: true,
                totalAuraFromDirect: true,
                totalAuraFromIndirect: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      depth: row.depth,
      ...row.descendant,
    }));
  }

  async listOccupiedChildPositions(
    parentIds: string[],
    executor: DbExecutor = this.db,
  ): Promise<Array<{ parentId: string; teamPosition: TeamPosition }>> {
    if (!parentIds.length) {
      return [];
    }

    const rows = await executor.user.findMany({
      where: {
        parentId: { in: parentIds },
        teamPosition: { not: null },
      },
      select: {
        parentId: true,
        teamPosition: true,
      },
    });

    return rows.flatMap((row) =>
      row.parentId && row.teamPosition
        ? [{ parentId: row.parentId, teamPosition: row.teamPosition }]
        : [],
    );
  }

  async bindPlacement(
    data: {
      parentId: string;
      placementKey: string;
      teamPosition: TeamPosition;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<TreePlacementUser> {
    return executor.user.update({
      where: { id: data.userId },
      data: {
        parentId: data.parentId,
        placementKey: data.placementKey,
        teamPosition: data.teamPosition,
      },
      select: {
        id: true,
        inviterId: true,
        parentId: true,
        placementKey: true,
        status: true,
        teamPosition: true,
      },
    });
  }

  async insertClosureRows(
    rows: Array<{ ancestorId: string; depth: number; descendantId: string }>,
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.teamClosure.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }
}
