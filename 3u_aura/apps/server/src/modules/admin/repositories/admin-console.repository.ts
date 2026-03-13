import { DbService } from '@/db';
import {
  ClaimStatus,
  ClaimType,
  EpochType,
  NftEligibilityStatus,
  PaymentPurpose,
  UserStatus,
} from '@/db';
import { Injectable } from '@nestjs/common';
import {
  paginate,
  type AdminAuditLogListQuery,
  type AdminCheckinIssueListQuery,
  type AdminClaimIssueListQuery,
  type AdminNftEligibilityListQuery,
  type AdminPendingPlacementListQuery,
} from '3u-aura-common';

@Injectable()
export class AdminConsoleRepository {
  constructor(private readonly db: DbService) {}

  async countOverview() {
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      recentUsers24h,
      pendingPlacementCount,
      pendingReferralNftApprovalCount,
      approvedReferralNftCount,
      signedReferralNftCount,
      mintedReferralNftCount,
      rejectedReferralNftCount,
      claimableMerkleClaimCount,
      pendingSubsidyClaimCount,
      latestEpoch,
    ] = await Promise.all([
      this.db.user.count(),
      this.db.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.db.user.count({ where: { createdAt: { gte: recentThreshold } } }),
      this.db.user.count({
        where: {
          inviterId: { not: null },
          parentId: null,
        },
      }),
      this.db.nftReferralEligibility.count({
        where: { status: NftEligibilityStatus.PENDING_APPROVAL },
      }),
      this.db.nftReferralEligibility.count({
        where: { status: NftEligibilityStatus.APPROVED },
      }),
      this.db.nftReferralEligibility.count({
        where: { status: NftEligibilityStatus.SIGNED },
      }),
      this.db.nftReferralEligibility.count({
        where: { status: NftEligibilityStatus.MINTED },
      }),
      this.db.nftReferralEligibility.count({
        where: { status: NftEligibilityStatus.REJECTED },
      }),
      this.db.claimRecord.count({
        where: {
          claimType: {
            in: [ClaimType.MERKLE_LOTTERY, ClaimType.MERKLE_RANKING],
          },
          status: ClaimStatus.CLAIMABLE,
        },
      }),
      this.db.nftSubsidyClaim.count({
        where: { status: ClaimStatus.PENDING },
      }),
      this.db.weeklyEpoch.findFirst({
        where: { epochType: EpochType.WEEKLY_PROMOTION },
        orderBy: { epochNo: 'desc' },
      }),
    ]);

    return {
      activeUsers,
      approvedReferralNftCount,
      claimableMerkleClaimCount,
      latestEpoch,
      mintedReferralNftCount,
      pendingPlacementCount,
      pendingReferralNftApprovalCount,
      pendingSubsidyClaimCount,
      rejectedReferralNftCount,
      recentUsers24h,
      signedReferralNftCount,
      totalUsers,
    };
  }

  async listPendingPlacements(query: AdminPendingPlacementListQuery) {
    const { search, skip = 0, take = 20 } = query;

    const where = {
      inviterId: { not: null },
      parentId: null,
      ...(search
        ? {
            OR: [
              {
                walletAddress: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                inviter: {
                  walletAddress: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                inviter: {
                  inviteCode: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    return paginate({
      count: () => this.db.user.count({ where }),
      query: (pagination) =>
        this.db.user.findMany({
          where,
          include: {
            inviter: {
              select: {
                id: true,
                inviteCode: true,
                walletAddress: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          ...pagination,
        }),
      skip,
      take,
    });
  }

  async listCheckinIssues(query: AdminCheckinIssueListQuery) {
    const { onlyUnlinked, search, skip = 0, take = 20 } = query;
    const where = {
      purpose: PaymentPurpose.CHECKIN,
      ...(onlyUnlinked ? { checkinId: null } : {}),
      ...(search
        ? {
            OR: [
              { txHash: { contains: search, mode: 'insensitive' as const } },
              {
                payerAddress: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                user: {
                  walletAddress: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    return paginate({
      count: () => this.db.paymentReceipt.count({ where }),
      query: (pagination) =>
        this.db.paymentReceipt.findMany({
          where,
          include: {
            checkin: { select: { id: true } },
            user: { select: { id: true, walletAddress: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...pagination,
        }),
      skip,
      take,
    });
  }

  async listClaimIssues(query: AdminClaimIssueListQuery) {
    const { claimKind = 'MERKLE', search, skip = 0, status, take = 20 } = query;

    if (claimKind === 'NFT_SUBSIDY') {
      const where = {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { txHash: { contains: search, mode: 'insensitive' as const } },
                {
                  user: {
                    walletAddress: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              ],
            }
          : {}),
      };

      return {
        claimKind,
        data: await paginate({
          count: () => this.db.nftSubsidyClaim.count({ where }),
          query: (pagination) =>
            this.db.nftSubsidyClaim.findMany({
              where,
              include: {
                epoch: { select: { epochNo: true } },
                nftHolding: { select: { tokenId: true } },
                user: { select: { id: true, walletAddress: true } },
              },
              orderBy: { createdAt: 'desc' },
              ...pagination,
            }),
          skip,
          take,
        }),
      };
    }

    const where = {
      claimType: {
        in: [ClaimType.MERKLE_LOTTERY, ClaimType.MERKLE_RANKING],
      },
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { txHash: { contains: search, mode: 'insensitive' as const } },
              {
                user: {
                  walletAddress: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    return {
      claimKind,
      data: await paginate({
        count: () => this.db.claimRecord.count({ where }),
        query: (pagination) =>
          this.db.claimRecord.findMany({
            where,
            include: {
              epoch: { select: { epochNo: true } },
              user: { select: { id: true, walletAddress: true } },
            },
            orderBy: { createdAt: 'desc' },
            ...pagination,
          }),
        skip,
        take,
      }),
    };
  }

  async listNftEligibility(query: AdminNftEligibilityListQuery) {
    const { search, skip = 0, status, take = 20 } = query;
    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            user: {
              walletAddress: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          }
        : {}),
    };

    return paginate({
      count: () => this.db.nftReferralEligibility.count({ where }),
      query: (pagination) =>
        this.db.nftReferralEligibility.findMany({
          where,
          include: {
            user: { select: { id: true, walletAddress: true } },
          },
          orderBy: { updatedAt: 'desc' },
          ...pagination,
        }),
      skip,
      take,
    });
  }

  async listAuditLogs(query: AdminAuditLogListQuery) {
    const { action, search, skip = 0, take = 20, targetType } = query;
    const where = {
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
      ...(search
        ? {
            OR: [
              {
                operatorWallet: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                targetId: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    return paginate({
      count: () => this.db.adminAuditLog.count({ where }),
      query: (pagination) =>
        this.db.adminAuditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...pagination,
        }),
      skip,
      take,
    });
  }

  async findUserById(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
      },
    });
  }

  async findCheckinReceiptByTxHashKey(txHashKey: string) {
    return this.db.paymentReceipt.findUnique({
      where: { txHashKey },
      include: {
        checkin: { select: { id: true } },
        user: { select: { id: true, walletAddress: true } },
      },
    });
  }

  async findMerkleClaimById(claimRecordId: string) {
    return this.db.claimRecord.findUnique({
      where: { id: claimRecordId },
      include: {
        epoch: { select: { epochNo: true } },
        user: { select: { id: true, walletAddress: true } },
      },
    });
  }

  async findSubsidyClaimById(subsidyClaimId: string) {
    return this.db.nftSubsidyClaim.findUnique({
      where: { id: subsidyClaimId },
      include: {
        epoch: { select: { epochNo: true } },
        nftHolding: { select: { tokenId: true } },
        user: { select: { id: true, walletAddress: true } },
      },
    });
  }

  async listLatestPromotionEpochs(limit: number) {
    return this.db.weeklyEpoch.findMany({
      where: { epochType: EpochType.WEEKLY_PROMOTION },
      orderBy: { epochNo: 'desc' },
      take: limit,
    });
  }
}
