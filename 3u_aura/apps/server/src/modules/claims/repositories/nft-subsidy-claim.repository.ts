import { ClaimStatus, DbService, NftSubsidyClaim, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class NftSubsidyClaimRepository {
  constructor(private readonly db: DbService) {}

  async countProjectedClaimsForEpoch(
    epochId: string,
    executor: DbExecutor = this.db,
  ): Promise<number> {
    return executor.nftSubsidyClaim.count({
      where: {
        epochId,
      },
    });
  }

  async listClaimsForUser(
    userId: string,
    options: {
      tokenIds?: bigint[];
    } = {},
    executor: DbExecutor = this.db,
  ): Promise<
    Array<
      Pick<
        NftSubsidyClaim,
        | 'amountUsdt'
        | 'chainId'
        | 'claimedAt'
        | 'contractAddress'
        | 'epochId'
        | 'id'
        | 'status'
        | 'txHash'
      > & {
        epoch: {
          epochNo: number;
        };
        nftHolding: {
          tokenId: bigint;
        };
      }
    >
  > {
    return executor.nftSubsidyClaim.findMany({
      where: {
        ...(options.tokenIds
          ? {
              nftHolding: {
                tokenId: {
                  in: options.tokenIds,
                },
              },
            }
          : {}),
        userId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        amountUsdt: true,
        chainId: true,
        claimedAt: true,
        contractAddress: true,
        epochId: true,
        id: true,
        status: true,
        txHash: true,
        epoch: {
          select: {
            epochNo: true,
          },
        },
        nftHolding: {
          select: {
            tokenId: true,
          },
        },
      },
    });
  }

  async upsertProjectedClaim(
    data: {
      amountUsdt: Prisma.Decimal;
      chainId: number;
      contractAddress: string;
      epochId: string;
      nftHoldingId: string;
      status: ClaimStatus;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<{ created: boolean; claim: NftSubsidyClaim; updated: boolean }> {
    const existing = await executor.nftSubsidyClaim.findUnique({
      where: {
        nftHoldingId_epochId: {
          epochId: data.epochId,
          nftHoldingId: data.nftHoldingId,
        },
      },
    });

    if (!existing) {
      const claim = await executor.nftSubsidyClaim.create({
        data: {
          amountUsdt: data.amountUsdt,
          chainId: data.chainId,
          contractAddress: data.contractAddress,
          epochId: data.epochId,
          nftHoldingId: data.nftHoldingId,
          status: data.status,
          userId: data.userId,
        },
      });

      return {
        claim,
        created: true,
        updated: false,
      };
    }

    const updateData: Prisma.NftSubsidyClaimUpdateInput = {};

    if (existing.amountUsdt.toFixed(0) !== data.amountUsdt.toFixed(0)) {
      updateData.amountUsdt = data.amountUsdt;
    }
    if (existing.chainId !== data.chainId) {
      updateData.chainId = data.chainId;
    }
    if (existing.contractAddress !== data.contractAddress) {
      updateData.contractAddress = data.contractAddress;
    }
    if (
      existing.status !== ClaimStatus.CLAIMED &&
      existing.status !== data.status
    ) {
      updateData.status = data.status;
    }
    if (existing.status !== ClaimStatus.CLAIMED && existing.userId !== data.userId) {
      updateData.user = {
        connect: { id: data.userId },
      };
    }

    if (!Object.keys(updateData).length) {
      return {
        claim: existing,
        created: false,
        updated: false,
      };
    }

    const claim = await executor.nftSubsidyClaim.update({
      where: { id: existing.id },
      data: updateData,
    });

    return {
      claim,
      created: false,
      updated: true,
    };
  }

  async findClaimForSync(
    data: {
      subsidyClaimId: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<
    | (Pick<
        NftSubsidyClaim,
        | 'chainId'
        | 'claimedAt'
        | 'contractAddress'
        | 'id'
        | 'status'
        | 'txHash'
      > & {
        epoch: {
          epochNo: number;
        };
        nftHolding: {
          tokenId: bigint;
        };
      })
    | null
  > {
    return executor.nftSubsidyClaim.findFirst({
      where: {
        id: data.subsidyClaimId,
        userId: data.userId,
      },
      select: {
        chainId: true,
        claimedAt: true,
        contractAddress: true,
        id: true,
        status: true,
        txHash: true,
        epoch: {
          select: {
            epochNo: true,
          },
        },
        nftHolding: {
          select: {
            tokenId: true,
          },
        },
      },
    });
  }

  async markClaimed(
    data: {
      claimedAt: Date;
      subsidyClaimId: string;
      txHash: string;
      txHashKey: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<NftSubsidyClaim> {
    return executor.nftSubsidyClaim.update({
      where: { id: data.subsidyClaimId },
      data: {
        claimedAt: data.claimedAt,
        status: ClaimStatus.CLAIMED,
        txHash: data.txHash,
        txHashKey: data.txHashKey,
      },
    });
  }
}
