import { DbService, MerkleLeaf, Prisma, RewardType } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class MerkleLeafRepository {
  constructor(private readonly db: DbService) {}

  async createLeaf(
    data: {
      amount: Prisma.Decimal;
      epochId: string;
      leafHash: string;
      leafIndex: number;
      payloadJson: Prisma.InputJsonValue;
      proofJson: Prisma.InputJsonValue;
      rewardId: string;
      rewardType: RewardType;
      tokenSymbol: string;
      userId: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<MerkleLeaf> {
    return executor.merkleLeaf.create({
      data: {
        amount: data.amount,
        epochId: data.epochId,
        leafHash: data.leafHash,
        leafIndex: data.leafIndex,
        payloadJson: data.payloadJson,
        proofJson: data.proofJson,
        rewardId: data.rewardId,
        rewardType: data.rewardType,
        tokenSymbol: data.tokenSymbol,
        userId: data.userId,
      },
    });
  }

  async deleteLeavesByEpochAndTypes(
    data: {
      epochId: string;
      rewardTypes: RewardType[];
    },
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor.merkleLeaf.deleteMany({
      where: {
        epochId: data.epochId,
        rewardType: { in: data.rewardTypes },
      },
    });
  }
}
