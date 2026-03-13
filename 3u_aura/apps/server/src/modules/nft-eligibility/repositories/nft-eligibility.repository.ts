import {
  DbService,
  NftEligibilityStatus as DbNftEligibilityStatus,
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
}
