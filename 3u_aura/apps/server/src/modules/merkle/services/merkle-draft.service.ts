import { Prisma, RewardType } from '@/db';
import { ConfigOptions } from '@/configuration';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaimPublicationService } from '../../claims/services/claim-publication.service';
import { ClaimRecordRepository } from '../../claims/repositories/claim-record.repository';
import { WeeklyEpochRepository } from '../../epoch/repositories/weekly-epoch.repository';
import { WeeklyRewardRepository } from '../../rewards/repositories/weekly-reward.repository';
import { MerkleDraftEngine } from '../engines/merkle-draft.engine';
import { MerkleLeafRepository } from '../repositories/merkle-leaf.repository';

const MERKLE_REWARD_TYPES: RewardType[] = ['LOTTERY_USDT', 'RANKING_USDT'];
const MERKLE_CLAIM_TYPES = ['MERKLE_LOTTERY', 'MERKLE_RANKING'] as const;

@Injectable()
export class MerkleDraftService {
  constructor(
    private readonly claimPublicationService: ClaimPublicationService,
    private readonly claimRecordRepository: ClaimRecordRepository,
    private readonly configService: ConfigService<ConfigOptions>,
    private readonly merkleDraftEngine: MerkleDraftEngine,
    private readonly merkleLeafRepository: MerkleLeafRepository,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async materializeForEpoch(
    epochId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{
    claimCount: number;
    leafCount: number;
    merkleRoot: string;
  }> {
    await this.claimRecordRepository.deleteClaimsByEpochAndTypes(
      {
        claimTypes: [...MERKLE_CLAIM_TYPES],
        epochId,
      },
      tx,
    );
    await this.merkleLeafRepository.deleteLeavesByEpochAndTypes(
      {
        epochId,
        rewardTypes: MERKLE_REWARD_TYPES,
      },
      tx,
    );
    await this.weeklyRewardRepository.resetMerkleDraftMetadata(
      {
        epochId,
        rewardTypes: MERKLE_REWARD_TYPES,
      },
      tx,
    );

    const rewards = await this.weeklyRewardRepository.listRewardsForMerkleDraft(
      {
        epochId,
        rewardTypes: MERKLE_REWARD_TYPES,
      },
      tx,
    );
    const draft = this.merkleDraftEngine.buildDraft(
      rewards.map((reward) => ({
        amount: reward.amountUsdt.toFixed(0),
        rewardId: reward.id,
        rewardType: reward.rewardType as 'LOTTERY_USDT' | 'RANKING_USDT',
        userId: reward.userId,
        walletAddress: reward.user.walletAddress,
      })),
    );
    const promotion =
      this.configService.get<ConfigOptions['promotion']>('promotion');

    for (const leaf of draft.leaves) {
      await this.merkleLeafRepository.createLeaf(
        {
          amount: new Prisma.Decimal(leaf.amount),
          epochId,
          leafHash: leaf.leafHash,
          leafIndex: leaf.leafIndex,
          payloadJson: leaf.payloadJson as Prisma.InputJsonValue,
          proofJson: leaf.proof as Prisma.InputJsonValue,
          rewardId: leaf.rewardId,
          rewardType: leaf.rewardType,
          tokenSymbol: leaf.tokenSymbol,
          userId: leaf.userId,
        },
        tx,
      );
      await this.weeklyRewardRepository.updateMerkleDraftMetadata(
        {
          merkleIndex: leaf.leafIndex,
          merkleLeafHash: leaf.leafHash,
          rewardId: leaf.rewardId,
        },
        tx,
      );
      await this.claimRecordRepository.createDraftClaim(
        {
          amount: new Prisma.Decimal(leaf.amount),
          chainId: promotion?.claimChainId ?? 97,
          claimType: leaf.claimType,
          contractAddress: promotion?.merkleDistributorAddress,
          epochId,
          merkleIndex: leaf.leafIndex,
          merkleProofJson: leaf.proof as Prisma.InputJsonValue,
          rewardId: leaf.rewardId,
          root: draft.merkleRoot,
          tokenSymbol: leaf.tokenSymbol,
          userId: leaf.userId,
        },
        tx,
      );
    }

    return {
      claimCount: draft.leaves.length,
      leafCount: draft.leaves.length,
      merkleRoot: draft.merkleRoot,
    };
  }

  async publishDraftForEpoch(
    epochId: string,
    rewardJsonUri: string | undefined,
    tx: Prisma.TransactionClient,
  ): Promise<{
    claimCount: number;
    merkleRoot: string;
  }> {
    const draft = await this.inspectDraftForEpoch(epochId, tx);
    const epoch = await this.weeklyEpochRepository.findById(epochId, tx);
    if (!epoch) {
      throw new Error(`Weekly epoch not found: ${epochId}`);
    }

    await this.claimPublicationService.markMerkleClaimsClaimable(
      epochId,
      [...MERKLE_CLAIM_TYPES],
      tx,
    );
    await this.weeklyRewardRepository.markRewardsClaimable(
      {
        epochId,
        rewardTypes: MERKLE_REWARD_TYPES,
      },
      tx,
    );
    await this.weeklyEpochRepository.publishMerkleRoot(
      {
        epochId,
        lotteryStatus:
          epoch.lotteryStatus === 'CALCULATING'
            ? 'ROOT_POSTED'
            : epoch.lotteryStatus,
        merkleRoot: draft.merkleRoot,
        rankingStatus:
          epoch.rankingStatus === 'CALCULATING'
            ? 'ROOT_POSTED'
            : epoch.rankingStatus,
        rewardJsonUri,
      },
      tx,
    );

    return draft;
  }

  async inspectDraftForEpoch(
    epochId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{
    claimCount: number;
    merkleRoot: string;
  }> {
    return this.claimPublicationService.resolveMerkleDraftRoot(
      epochId,
      [...MERKLE_CLAIM_TYPES],
      tx,
    );
  }
}
