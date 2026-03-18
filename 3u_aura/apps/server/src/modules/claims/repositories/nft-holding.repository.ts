import {
  DbService,
  NftHolding,
  NftStatus,
  NftType,
  Prisma,
} from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class NftHoldingRepository {
  constructor(private readonly db: DbService) {}

  async upsertPurchasedHolding(
    data: {
      chainId: number;
      contractAddress: string;
      mintTxHash: string;
      mintedAt: Date;
      purchasedPriceUsdt?: Prisma.Decimal;
      tokenId: bigint;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<{ created: boolean; holding: NftHolding }> {
    const existing = await executor.nftHolding.findUnique({
      where: {
        chainId_contractAddress_tokenId: {
          chainId: data.chainId,
          contractAddress: data.contractAddress,
          tokenId: data.tokenId,
        },
      },
    });

    if (!existing) {
      const holding = await executor.nftHolding.create({
        data: {
          chainId: data.chainId,
          contractAddress: data.contractAddress,
          mintTxHash: data.mintTxHash,
          mintTxHashKey: this.toTxHashKey(data.chainId, data.mintTxHash),
          mintedAt: data.mintedAt,
          nftType: NftType.PURCHASED,
          purchasedPriceUsdt: data.purchasedPriceUsdt,
          status: NftStatus.ACTIVE,
          tokenId: data.tokenId,
          userId: data.userId,
        },
      });

      return {
        created: true,
        holding,
      };
    }

    const nextMintTxHashKey = this.toTxHashKey(data.chainId, data.mintTxHash);
    const updateData: Prisma.NftHoldingUpdateInput = {};

    if (existing.userId !== data.userId) {
      updateData.user = {
        connect: { id: data.userId },
      };
    }
    if (existing.status !== NftStatus.ACTIVE) {
      updateData.status = NftStatus.ACTIVE;
    }
    if (existing.mintTxHash !== data.mintTxHash) {
      updateData.mintTxHash = data.mintTxHash;
      updateData.mintTxHashKey = nextMintTxHashKey;
    }
    if (existing.mintedAt.getTime() !== data.mintedAt.getTime()) {
      updateData.mintedAt = data.mintedAt;
    }
    if (
      data.purchasedPriceUsdt &&
      existing.purchasedPriceUsdt?.toFixed(0) !== data.purchasedPriceUsdt.toFixed(0)
    ) {
      updateData.purchasedPriceUsdt = data.purchasedPriceUsdt;
    }

    if (!Object.keys(updateData).length) {
      return {
        created: false,
        holding: existing,
      };
    }

    const holding = await executor.nftHolding.update({
      where: { id: existing.id },
      data: updateData,
    });

    return {
      created: false,
      holding,
    };
  }

  async upsertReferralHolding(
    data: {
      chainId: number;
      contractAddress: string;
      mintTxHash: string;
      mintedAt: Date;
      tokenId: bigint;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<{ created: boolean; holding: NftHolding }> {
    const existing = await executor.nftHolding.findUnique({
      where: {
        chainId_contractAddress_tokenId: {
          chainId: data.chainId,
          contractAddress: data.contractAddress,
          tokenId: data.tokenId,
        },
      },
    });

    if (!existing) {
      const holding = await executor.nftHolding.create({
        data: {
          chainId: data.chainId,
          contractAddress: data.contractAddress,
          mintTxHash: data.mintTxHash,
          mintTxHashKey: this.toTxHashKey(data.chainId, data.mintTxHash),
          mintedAt: data.mintedAt,
          nftType: NftType.REFERRAL,
          status: NftStatus.ACTIVE,
          tokenId: data.tokenId,
          userId: data.userId,
        },
      });

      return {
        created: true,
        holding,
      };
    }

    const nextMintTxHashKey = this.toTxHashKey(data.chainId, data.mintTxHash);
    const updateData: Prisma.NftHoldingUpdateInput = {};

    if (existing.userId !== data.userId) {
      updateData.user = {
        connect: { id: data.userId },
      };
    }
    if (existing.status !== NftStatus.ACTIVE) {
      updateData.status = NftStatus.ACTIVE;
    }
    if (existing.nftType !== NftType.REFERRAL) {
      updateData.nftType = NftType.REFERRAL;
    }
    if (existing.mintTxHash !== data.mintTxHash) {
      updateData.mintTxHash = data.mintTxHash;
      updateData.mintTxHashKey = nextMintTxHashKey;
    }
    if (existing.mintedAt.getTime() !== data.mintedAt.getTime()) {
      updateData.mintedAt = data.mintedAt;
    }

    if (!Object.keys(updateData).length) {
      return {
        created: false,
        holding: existing,
      };
    }

    const holding = await executor.nftHolding.update({
      where: { id: existing.id },
      data: updateData,
    });

    return {
      created: false,
      holding,
    };
  }

  private toTxHashKey(chainId: number, txHash: string): string {
    return `${chainId}:${txHash.toLowerCase()}`;
  }
}
