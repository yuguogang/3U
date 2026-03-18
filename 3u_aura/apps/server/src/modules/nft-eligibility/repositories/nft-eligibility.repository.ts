import {
  DbService,
  NftEligibilityStatus as DbNftEligibilityStatus,
  NftReferralEligibility,
  Prisma,
} from '@/db';
import { Injectable } from '@nestjs/common';
import { NftEligibilityStatus } from '3u-aura-common';
import { getAddress } from 'viem';

type DbExecutor = DbService | Prisma.TransactionClient;

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

  async upsertEligibilitySnapshot(
    data: {
      personalCheckinCount: number;
      smallLegVolumeUsdt: Prisma.Decimal;
      status: NftEligibilityStatus;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ) {
    return executor.nftReferralEligibility.upsert({
      where: { userId: data.userId },
      create: {
        personalCheckinCount: data.personalCheckinCount,
        smallLegVolumeUsdt: data.smallLegVolumeUsdt,
        status: data.status as unknown as DbNftEligibilityStatus,
        userId: data.userId,
      },
      update: {
        personalCheckinCount: data.personalCheckinCount,
        smallLegVolumeUsdt: data.smallLegVolumeUsdt,
        status: data.status as unknown as DbNftEligibilityStatus,
      },
    });
  }

  async markApproved(
    data: {
      decisionReason?: string;
      operatorWallet: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ) {
    return executor.nftReferralEligibility.update({
      where: { userId: data.userId },
      data: {
        approvedAt: new Date(),
        approvedByWallet: getAddress(data.operatorWallet),
        decisionReason: data.decisionReason,
        expiresAt: null,
        rejectedAt: null,
        rejectedByWallet: null,
        signedAt: null,
        signedNonce: null,
        signedPayloadHash: null,
        status: NftEligibilityStatus.APPROVED,
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
        status: NftEligibilityStatus.REJECTED,
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
    return executor.nftReferralEligibility.update({
      where: { userId: data.userId },
      data: {
        expiresAt: data.expiresAt,
        signedAt: new Date(),
        signedNonce: data.signedNonce,
        signedPayloadHash: data.payloadHash,
        status: NftEligibilityStatus.SIGNED,
      },
    });
  }

  async markMinted(
    data: {
      chainId: number;
      mintedAt: Date;
      mintedTokenId: bigint;
      mintedTxHash: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<{ changed: boolean; eligibility: NftReferralEligibility }> {
    const existing = await executor.nftReferralEligibility.findUnique({
      where: { userId: data.userId },
    });
    const nextTxHashKey = this.toTxHashKey(data.chainId, data.mintedTxHash);

    if (!existing) {
      const eligibility = await executor.nftReferralEligibility.create({
        data: {
          mintedAt: data.mintedAt,
          mintedTokenId: data.mintedTokenId,
          mintedTxHash: data.mintedTxHash,
          mintedTxHashKey: nextTxHashKey,
          status: NftEligibilityStatus.MINTED as unknown as DbNftEligibilityStatus,
          userId: data.userId,
        },
      });

      return {
        changed: true,
        eligibility,
      };
    }

    const updateData: Prisma.NftReferralEligibilityUpdateInput = {};

    if (existing.status !== DbNftEligibilityStatus.MINTED) {
      updateData.status =
        NftEligibilityStatus.MINTED as unknown as DbNftEligibilityStatus;
    }
    if (existing.mintedTokenId !== data.mintedTokenId) {
      updateData.mintedTokenId = data.mintedTokenId;
    }
    if (existing.mintedTxHash !== data.mintedTxHash) {
      updateData.mintedTxHash = data.mintedTxHash;
      updateData.mintedTxHashKey = nextTxHashKey;
    }
    if (!existing.mintedAt || existing.mintedAt.getTime() !== data.mintedAt.getTime()) {
      updateData.mintedAt = data.mintedAt;
    }

    if (!Object.keys(updateData).length) {
      return {
        changed: false,
        eligibility: existing,
      };
    }

    const eligibility = await executor.nftReferralEligibility.update({
      where: { userId: data.userId },
      data: updateData,
    });

    return {
      changed: true,
      eligibility,
    };
  }

  private toTxHashKey(chainId: number, txHash: string): string {
    return `${chainId}:${txHash.toLowerCase()}`;
  }
}
