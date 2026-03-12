import { ClaimStatus, DbService, NftSubsidyClaim, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class NftSubsidyClaimRepository {
  constructor(private readonly db: DbService) {}

  async listClaimsForUser(
    userId: string,
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
