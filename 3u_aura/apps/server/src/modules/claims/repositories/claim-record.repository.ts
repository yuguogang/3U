import {
  ClaimRecord,
  ClaimStatus,
  ClaimType,
  DbService,
  EpochStatus,
  Prisma,
} from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class ClaimRecordRepository {
  constructor(private readonly db: DbService) {}

  async createDraftClaim(
    data: {
      amount: Prisma.Decimal;
      chainId: number;
      claimType: ClaimType;
      contractAddress?: string;
      epochId: string;
      merkleIndex: number;
      merkleProofJson: Prisma.InputJsonValue;
      rewardId: string;
      root: string;
      tokenSymbol: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<ClaimRecord> {
    return executor.claimRecord.create({
      data: {
        amount: data.amount,
        chainId: data.chainId,
        claimType: data.claimType,
        contractAddress: data.contractAddress,
        epochId: data.epochId,
        merkleIndex: data.merkleIndex,
        merkleProofJson: data.merkleProofJson,
        rewardId: data.rewardId,
        root: data.root,
        status: ClaimStatus.PENDING,
        tokenSymbol: data.tokenSymbol,
        userId: data.userId,
      },
    });
  }

  async deleteClaimsByEpochAndTypes(
    data: {
      claimTypes: ClaimType[];
      epochId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.claimRecord.deleteMany({
      where: {
        claimType: { in: data.claimTypes },
        epochId: data.epochId,
      },
    });
  }

  async listClaimsByEpochAndTypes(
    data: {
      claimTypes: ClaimType[];
      epochId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<
    Array<
      Pick<
        ClaimRecord,
        | 'amount'
        | 'claimType'
        | 'id'
        | 'merkleIndex'
        | 'rewardId'
        | 'root'
        | 'status'
      >
    >
  > {
    return executor.claimRecord.findMany({
      where: {
        claimType: { in: data.claimTypes },
        epochId: data.epochId,
      },
      orderBy: [{ claimType: 'asc' }, { merkleIndex: 'asc' }],
      select: {
        amount: true,
        claimType: true,
        id: true,
        merkleIndex: true,
        rewardId: true,
        root: true,
        status: true,
      },
    });
  }

  async markClaimsClaimable(
    data: {
      claimTypes: ClaimType[];
      epochId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.claimRecord.updateMany({
      where: {
        claimType: { in: data.claimTypes },
        epochId: data.epochId,
      },
      data: {
        status: ClaimStatus.CLAIMABLE,
      },
    });
  }

  async listMerkleClaimsForUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<
    Array<
      Pick<
        ClaimRecord,
        | 'amount'
        | 'chainId'
        | 'claimType'
        | 'claimedAt'
        | 'contractAddress'
        | 'epochId'
        | 'id'
        | 'merkleIndex'
        | 'merkleProofJson'
        | 'root'
        | 'status'
        | 'tokenSymbol'
        | 'txHash'
      > & {
        epoch: {
          epochNo: number;
          status: EpochStatus;
        } | null;
      }
    >
  > {
    return executor.claimRecord.findMany({
      where: {
        userId,
        claimType: {
          in: [ClaimType.MERKLE_LOTTERY, ClaimType.MERKLE_RANKING],
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        amount: true,
        chainId: true,
        claimType: true,
        claimedAt: true,
        contractAddress: true,
        epochId: true,
        id: true,
        merkleIndex: true,
        merkleProofJson: true,
        root: true,
        status: true,
        tokenSymbol: true,
        txHash: true,
        epoch: {
          select: {
            epochNo: true,
            status: true,
          },
        },
      },
    });
  }

  async findMerkleClaimForSync(
    data: {
      claimRecordId: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<
    | (Pick<
        ClaimRecord,
        | 'chainId'
        | 'claimType'
        | 'claimedAt'
        | 'contractAddress'
        | 'id'
        | 'merkleIndex'
        | 'rewardId'
        | 'status'
        | 'txHash'
      > & {
        epoch: {
          epochNo: number;
        } | null;
      })
    | null
  > {
    return executor.claimRecord.findFirst({
      where: {
        id: data.claimRecordId,
        userId: data.userId,
        claimType: {
          in: [ClaimType.MERKLE_LOTTERY, ClaimType.MERKLE_RANKING],
        },
      },
      select: {
        chainId: true,
        claimType: true,
        claimedAt: true,
        contractAddress: true,
        id: true,
        merkleIndex: true,
        rewardId: true,
        status: true,
        txHash: true,
        epoch: {
          select: {
            epochNo: true,
          },
        },
      },
    });
  }

  async markClaimed(
    data: {
      claimRecordId: string;
      claimedAt: Date;
      txHash: string;
      txHashKey: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<ClaimRecord> {
    return executor.claimRecord.update({
      where: { id: data.claimRecordId },
      data: {
        claimedAt: data.claimedAt,
        status: ClaimStatus.CLAIMED,
        txHash: data.txHash,
        txHashKey: data.txHashKey,
      },
    });
  }
}
