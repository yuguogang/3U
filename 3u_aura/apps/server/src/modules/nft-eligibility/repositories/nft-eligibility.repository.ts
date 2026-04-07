import {
  DbService,
  NftEligibilityStatus as DbNftEligibilityStatus,
  NftReferralGrant,
  NftReferralGrantSource as DbNftReferralGrantSource,
  NftReferralGrantStatus as DbNftReferralGrantStatus,
  Prisma,
} from '@/db';
import { Injectable } from '@nestjs/common';
import {
  NftEligibilityStatus,
  NftReferralGrantSource,
} from '3u-aura-common';
import { getAddress } from 'viem';

type DbExecutor = DbService | Prisma.TransactionClient;

type GrantSummaryRow = Pick<
  NftReferralGrant,
  | 'approvedAt'
  | 'approvedByWallet'
  | 'createdAt'
  | 'decisionReason'
  | 'expiresAt'
  | 'mintedAt'
  | 'mintedTokenId'
  | 'rejectedAt'
  | 'rejectedByWallet'
  | 'signedAt'
  | 'status'
>;

export type ReferralGrantSummary = {
  approvedGrantCount: number;
  claimableMintCount: number;
  expiredGrantCount: number;
  latestActiveGrant: GrantSummaryRow | null;
  latestGrant: GrantSummaryRow | null;
  latestMintedGrant: GrantSummaryRow | null;
  latestRejectedGrant: GrantSummaryRow | null;
  mintedReferralCount: number;
  signedGrantCount: number;
};

@Injectable()
export class NftEligibilityRepository {
  constructor(private readonly db: DbService) {}

  async findCurrentByUser(userId: string, executor: DbExecutor = this.db) {
    return executor.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        profile: {
          select: {
            hasReferralNft: true,
            smallLegVolume: true,
            totalCheckinCount: true,
          },
        },
        nftEligibility: true,
      },
    });
  }

  async findCurrentByWallet(
    walletAddress: string,
    executor: DbExecutor = this.db,
  ) {
    return executor.user.findFirst({
      where: { walletAddress: getAddress(walletAddress) },
      select: {
        id: true,
        walletAddress: true,
        profile: {
          select: {
            hasReferralNft: true,
            smallLegVolume: true,
            totalCheckinCount: true,
          },
        },
        nftEligibility: true,
      },
    });
  }

  async summarizeGrantsForUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<ReferralGrantSummary> {
    const activeStatuses = [
      DbNftReferralGrantStatus.APPROVED,
      DbNftReferralGrantStatus.SIGNED,
      DbNftReferralGrantStatus.EXPIRED,
    ];

    const [
      approvedGrantCount,
      expiredGrantCount,
      signedGrantCount,
      mintedReferralCount,
      latestActiveGrant,
      latestGrant,
      latestMintedGrant,
      latestRejectedGrant,
    ] = await Promise.all([
      executor.nftReferralGrant.count({
        where: {
          userId,
          status: DbNftReferralGrantStatus.APPROVED,
        },
      }),
      executor.nftReferralGrant.count({
        where: {
          userId,
          status: DbNftReferralGrantStatus.EXPIRED,
        },
      }),
      executor.nftReferralGrant.count({
        where: {
          userId,
          status: DbNftReferralGrantStatus.SIGNED,
        },
      }),
      executor.nftReferralGrant.count({
        where: {
          userId,
          status: DbNftReferralGrantStatus.MINTED,
        },
      }),
      executor.nftReferralGrant.findFirst({
        where: {
          userId,
          status: { in: activeStatuses },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      executor.nftReferralGrant.findFirst({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }],
      }),
      executor.nftReferralGrant.findFirst({
        where: {
          userId,
          status: DbNftReferralGrantStatus.MINTED,
        },
        orderBy: [{ mintedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      executor.nftReferralGrant.findFirst({
        where: {
          userId,
          status: DbNftReferralGrantStatus.REJECTED,
        },
        orderBy: [{ rejectedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      approvedGrantCount,
      claimableMintCount:
        approvedGrantCount + signedGrantCount + expiredGrantCount,
      expiredGrantCount,
      latestActiveGrant,
      latestGrant,
      latestMintedGrant,
      latestRejectedGrant,
      mintedReferralCount,
      signedGrantCount,
    };
  }

  async upsertEligibilitySnapshot(
    data: {
      approvedAt?: Date | null;
      approvedByWallet?: string | null;
      decisionReason?: string | null;
      expiresAt?: Date | null;
      mintedAt?: Date | null;
      mintedTokenId?: bigint | null;
      personalCheckinCount: number;
      rejectedAt?: Date | null;
      rejectedByWallet?: string | null;
      signedAt?: Date | null;
      smallLegVolumeUsdt: Prisma.Decimal;
      status: NftEligibilityStatus;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ) {
    return executor.nftReferralEligibility.upsert({
      where: { userId: data.userId },
      create: {
        approvedAt: data.approvedAt ?? null,
        approvedByWallet: data.approvedByWallet ?? null,
        decisionReason: data.decisionReason ?? null,
        expiresAt: data.expiresAt ?? null,
        mintedAt: data.mintedAt ?? null,
        mintedTokenId: data.mintedTokenId ?? null,
        personalCheckinCount: data.personalCheckinCount,
        rejectedAt: data.rejectedAt ?? null,
        rejectedByWallet: data.rejectedByWallet ?? null,
        signedAt: data.signedAt ?? null,
        smallLegVolumeUsdt: data.smallLegVolumeUsdt,
        status: data.status as unknown as DbNftEligibilityStatus,
        userId: data.userId,
      },
      update: {
        approvedAt: data.approvedAt ?? null,
        approvedByWallet: data.approvedByWallet ?? null,
        decisionReason: data.decisionReason ?? null,
        expiresAt: data.expiresAt ?? null,
        mintedAt: data.mintedAt ?? null,
        mintedTokenId: data.mintedTokenId ?? null,
        personalCheckinCount: data.personalCheckinCount,
        rejectedAt: data.rejectedAt ?? null,
        rejectedByWallet: data.rejectedByWallet ?? null,
        signedAt: data.signedAt ?? null,
        smallLegVolumeUsdt: data.smallLegVolumeUsdt,
        status: data.status as unknown as DbNftEligibilityStatus,
      },
    });
  }

  async markApproved(
    data: {
      decisionReason?: string;
      operatorWallet: string;
      source: NftReferralGrantSource;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ) {
    const eligibility = await executor.nftReferralEligibility.upsert({
      where: { userId: data.userId },
      create: {
        approvedAt: new Date(),
        approvedByWallet: getAddress(data.operatorWallet),
        decisionReason: data.decisionReason,
        status: DbNftEligibilityStatus.APPROVED,
        userId: data.userId,
      },
      update: {
        approvedAt: new Date(),
        approvedByWallet: getAddress(data.operatorWallet),
        decisionReason: data.decisionReason,
        expiresAt: null,
        rejectedAt: null,
        rejectedByWallet: null,
        signedAt: null,
        signedNonce: null,
        signedPayloadHash: null,
        status: DbNftEligibilityStatus.APPROVED,
      },
    });

    return executor.nftReferralGrant.create({
      data: {
        approvedByWallet: getAddress(data.operatorWallet),
        decisionReason: data.decisionReason,
        eligibilityId: eligibility.id,
        source: data.source as unknown as DbNftReferralGrantSource,
        status: DbNftReferralGrantStatus.APPROVED,
        userId: data.userId,
      },
    });
  }

  async markRejected(
    data: {
      decisionReason: string;
      operatorWallet: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ) {
    const targetGrant = await executor.nftReferralGrant.findFirst({
      where: {
        userId: data.userId,
        status: {
          in: [
            DbNftReferralGrantStatus.APPROVED,
            DbNftReferralGrantStatus.SIGNED,
            DbNftReferralGrantStatus.EXPIRED,
          ],
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (targetGrant) {
      await executor.nftReferralGrant.update({
        where: { id: targetGrant.id },
        data: {
          decisionReason: data.decisionReason,
          rejectedAt: new Date(),
          rejectedByWallet: getAddress(data.operatorWallet),
          status: DbNftReferralGrantStatus.REJECTED,
        },
      });
    }

    return executor.nftReferralEligibility.update({
      where: { userId: data.userId },
      data: {
        approvedAt: null,
        approvedByWallet: null,
        decisionReason: data.decisionReason,
        expiresAt: null,
        rejectedAt: new Date(),
        rejectedByWallet: getAddress(data.operatorWallet),
        signedAt: null,
        signedNonce: null,
        signedPayloadHash: null,
        status: DbNftEligibilityStatus.REJECTED,
      },
    });
  }

  async markSignedPayload(
    data: {
      expiresAt: Date;
      payloadHash: string;
      signedNonce: number;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ) {
    const grant =
      (await executor.nftReferralGrant.findFirst({
        where: {
          userId: data.userId,
          status: DbNftReferralGrantStatus.SIGNED,
        },
        orderBy: [{ createdAt: 'asc' }],
      })) ??
      (await executor.nftReferralGrant.findFirst({
        where: {
          userId: data.userId,
          status: {
            in: [
              DbNftReferralGrantStatus.APPROVED,
              DbNftReferralGrantStatus.EXPIRED,
            ],
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      }));

    if (!grant) {
      throw new Error('No referral mint grant available for signing');
    }

    await executor.nftReferralGrant.update({
      where: { id: grant.id },
      data: {
        expiresAt: data.expiresAt,
        signedAt: new Date(),
        signedNonce: data.signedNonce,
        signedPayloadHash: data.payloadHash,
        status: DbNftReferralGrantStatus.SIGNED,
      },
    });

    return executor.nftReferralEligibility.update({
      where: { userId: data.userId },
      data: {
        expiresAt: data.expiresAt,
        signedAt: new Date(),
        signedNonce: data.signedNonce,
        signedPayloadHash: data.payloadHash,
        status: DbNftEligibilityStatus.SIGNED,
      },
    });
  }

  async markMinted(
    data: {
      chainId: number;
      mintedAt: Date;
      mintedTokenId: bigint;
      mintedTxHash: string;
      payloadHash?: string;
      signedNonce?: number;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<{ changed: boolean }> {
    const nextTxHashKey = this.toTxHashKey(data.chainId, data.mintedTxHash);
    const targetGrant =
      ((data.payloadHash || data.signedNonce !== undefined)
        ? await executor.nftReferralGrant.findFirst({
            where: {
              userId: data.userId,
              ...(data.payloadHash
                ? { signedPayloadHash: data.payloadHash }
                : {}),
              ...(data.signedNonce !== undefined
                ? { signedNonce: data.signedNonce }
                : {}),
              status: {
                in: [
                  DbNftReferralGrantStatus.APPROVED,
                  DbNftReferralGrantStatus.SIGNED,
                  DbNftReferralGrantStatus.EXPIRED,
                ],
              },
            },
            orderBy: [{ createdAt: 'asc' }],
          })
        : null) ??
      (await executor.nftReferralGrant.findFirst({
        where: {
          userId: data.userId,
          status: {
            in: [
              DbNftReferralGrantStatus.APPROVED,
              DbNftReferralGrantStatus.SIGNED,
              DbNftReferralGrantStatus.EXPIRED,
            ],
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      }));

    if (!targetGrant) {
      const duplicateGrant = await executor.nftReferralGrant.findFirst({
        where: {
          mintedTxHashKey: nextTxHashKey,
          userId: data.userId,
        },
      });

      if (duplicateGrant) {
        return { changed: false };
      }

      await executor.nftReferralGrant.create({
        data: {
          approvedAt: data.mintedAt,
          mintedAt: data.mintedAt,
          mintedTokenId: data.mintedTokenId,
          mintedTxHash: data.mintedTxHash,
          mintedTxHashKey: nextTxHashKey,
          source: DbNftReferralGrantSource.QUALIFIED_APPROVAL,
          status: DbNftReferralGrantStatus.MINTED,
          userId: data.userId,
        },
      });

      await executor.nftReferralEligibility.upsert({
        where: { userId: data.userId },
        create: {
          mintedAt: data.mintedAt,
          mintedTokenId: data.mintedTokenId,
          mintedTxHash: data.mintedTxHash,
          mintedTxHashKey: nextTxHashKey,
          status: DbNftEligibilityStatus.MINTED,
          userId: data.userId,
        },
        update: {
          mintedAt: data.mintedAt,
          mintedTokenId: data.mintedTokenId,
          mintedTxHash: data.mintedTxHash,
          mintedTxHashKey: nextTxHashKey,
          status: DbNftEligibilityStatus.MINTED,
        },
      });

      return { changed: true };
    }

    const changed =
      targetGrant.status !== DbNftReferralGrantStatus.MINTED ||
      targetGrant.mintedTokenId !== data.mintedTokenId ||
      targetGrant.mintedTxHash !== data.mintedTxHash ||
      !targetGrant.mintedAt ||
      targetGrant.mintedAt.getTime() !== data.mintedAt.getTime();

    if (!changed) {
      return { changed: false };
    }

    await executor.nftReferralGrant.update({
      where: { id: targetGrant.id },
      data: {
        mintedAt: data.mintedAt,
        mintedTokenId: data.mintedTokenId,
        mintedTxHash: data.mintedTxHash,
        mintedTxHashKey: nextTxHashKey,
        status: DbNftReferralGrantStatus.MINTED,
      },
    });

    await executor.nftReferralEligibility.upsert({
      where: { userId: data.userId },
      create: {
        mintedAt: data.mintedAt,
        mintedTokenId: data.mintedTokenId,
        mintedTxHash: data.mintedTxHash,
        mintedTxHashKey: nextTxHashKey,
        status: DbNftEligibilityStatus.MINTED,
        userId: data.userId,
      },
      update: {
        mintedAt: data.mintedAt,
        mintedTokenId: data.mintedTokenId,
        mintedTxHash: data.mintedTxHash,
        mintedTxHashKey: nextTxHashKey,
        status: DbNftEligibilityStatus.MINTED,
      },
    });

    return { changed: true };
  }

  private toTxHashKey(chainId: number, txHash: string): string {
    return `${chainId}:${txHash.toLowerCase()}`;
  }
}
