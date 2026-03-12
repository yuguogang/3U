import {
  ClaimStatus as DbClaimStatus,
  ClaimType,
  type User,
} from '@/db';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClaimStatus as CommonClaimStatus,
  PromotionClaimSyncRequest,
  PromotionClaimSyncResult,
} from '3u-aura-common';
import { WeeklyRewardRepository } from '../../rewards/repositories/weekly-reward.repository';
import {
  AuditSeamService,
  PromotionChainClientService,
  TransactionOrchestratorService,
} from '../../shared';
import { ClaimSyncChainRepository } from '../repositories/claim-sync-chain.repository';
import { ClaimRecordRepository } from '../repositories/claim-record.repository';
import { NftSubsidyClaimRepository } from '../repositories/nft-subsidy-claim.repository';

type ClaimActor = Pick<User, 'id' | 'walletAddress'>;

@Injectable()
export class ClaimSyncService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly claimSyncChainRepository: ClaimSyncChainRepository,
    private readonly claimRecordRepository: ClaimRecordRepository,
    private readonly nftSubsidyClaimRepository: NftSubsidyClaimRepository,
    private readonly promotionChainClientService: PromotionChainClientService,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async syncClaimForUser(
    user: ClaimActor,
    command: PromotionClaimSyncRequest,
  ): Promise<PromotionClaimSyncResult> {
    if (command.claimRecordId) {
      return this.syncMerkleClaim(user, command.claimRecordId, command.txHash);
    }

    return this.syncSubsidyClaim(user, command.subsidyClaimId!, command.txHash);
  }

  private async syncMerkleClaim(
    user: ClaimActor,
    claimRecordId: string,
    txHash: string,
  ): Promise<PromotionClaimSyncResult> {
    const claim = await this.claimRecordRepository.findMerkleClaimForSync({
      claimRecordId,
      userId: user.id,
    });
    if (!claim || claim.merkleIndex === null || !claim.epoch) {
      throw new NotFoundException('Merkle claim record not found');
    }

    const normalizedTxHash = txHash.toLowerCase();
    if (claim.status === DbClaimStatus.CLAIMED) {
      return this.toAlreadySyncedResult({
        chainId: claim.chainId,
        claimedAt: claim.claimedAt,
        claimRecordId,
        existingTxHash: claim.txHash,
        normalizedTxHash,
      });
    }
    const contractAddress =
      claim.contractAddress ??
      this.promotionChainClientService.getRuntimeConfig()
        .merkleDistributorAddress;
    if (!contractAddress) {
      throw new ConflictException('Merkle claim contractAddress is not configured');
    }

    const verified = await this.claimSyncChainRepository.verifyMerkleClaim({
      account: user.walletAddress,
      chainId: claim.chainId,
      contractAddress,
      epochNo: claim.epoch.epochNo,
      merkleIndex: claim.merkleIndex,
      txHash: normalizedTxHash,
    });

    await this.transactionOrchestrator.run(async (tx) => {
      await this.claimRecordRepository.markClaimed(
        {
          claimRecordId,
          claimedAt: verified.claimedAt,
          txHash: verified.txHash,
          txHashKey: this.toTxHashKey(claim.chainId, verified.txHash),
        },
        tx,
      );

      if (claim.rewardId) {
        await this.weeklyRewardRepository.markRewardClaimed(
          {
            claimedAt: verified.claimedAt,
            rewardId: claim.rewardId,
          },
          tx,
        );
      }
    });

    await this.auditSeam.record({
      action: 'claims.sync.merkle',
      payload: {
        chainId: claim.chainId,
        claimRecordId,
        claimType: claim.claimType as ClaimType,
        txHash: verified.txHash,
      },
      targetId: claimRecordId,
      targetType: 'ClaimRecord',
    });

    return {
      chainId: claim.chainId,
      claimRecordId,
      claimedAt: verified.claimedAt,
      status: CommonClaimStatus.CLAIMED,
      txHash: verified.txHash,
    };
  }

  private async syncSubsidyClaim(
    user: ClaimActor,
    subsidyClaimId: string,
    txHash: string,
  ): Promise<PromotionClaimSyncResult> {
    const claim = await this.nftSubsidyClaimRepository.findClaimForSync({
      subsidyClaimId,
      userId: user.id,
    });
    if (!claim) {
      throw new NotFoundException('NFT subsidy claim record not found');
    }

    const normalizedTxHash = txHash.toLowerCase();
    if (claim.status === DbClaimStatus.CLAIMED) {
      return this.toAlreadySyncedResult({
        chainId: claim.chainId,
        claimedAt: claim.claimedAt,
        existingTxHash: claim.txHash,
        normalizedTxHash,
        subsidyClaimId,
      });
    }
    const contractAddress =
      claim.contractAddress ??
      this.promotionChainClientService.getRuntimeConfig().settlementAddress;
    if (!contractAddress) {
      throw new ConflictException('Settlement contractAddress is not configured');
    }

    const verified = await this.claimSyncChainRepository.verifySubsidyClaim({
      account: user.walletAddress,
      chainId: claim.chainId,
      contractAddress,
      epochNo: claim.epoch.epochNo,
      tokenId: claim.nftHolding.tokenId.toString(),
      txHash: normalizedTxHash,
    });

    await this.transactionOrchestrator.run(async (tx) => {
      await this.nftSubsidyClaimRepository.markClaimed(
        {
          claimedAt: verified.claimedAt,
          subsidyClaimId,
          txHash: verified.txHash,
          txHashKey: this.toTxHashKey(claim.chainId, verified.txHash),
        },
        tx,
      );
    });

    await this.auditSeam.record({
      action: 'claims.sync.subsidy',
      payload: {
        chainId: claim.chainId,
        subsidyClaimId,
        txHash: verified.txHash,
      },
      targetId: subsidyClaimId,
      targetType: 'NftSubsidyClaim',
    });

    return {
      chainId: claim.chainId,
      claimedAt: verified.claimedAt,
      status: CommonClaimStatus.CLAIMED,
      subsidyClaimId,
      txHash: verified.txHash,
    };
  }

  private toAlreadySyncedResult(params: {
    chainId: number;
    claimedAt: Date | null;
    claimRecordId?: string;
    existingTxHash: string | null;
    normalizedTxHash: string;
    subsidyClaimId?: string;
  }): PromotionClaimSyncResult {
    if (
      params.existingTxHash &&
      params.existingTxHash.toLowerCase() !== params.normalizedTxHash
    ) {
      throw new ConflictException(
        'Claim is already synced with a different txHash',
      );
    }
    if (!params.claimedAt) {
      throw new ConflictException('Claim is marked claimed without claimedAt');
    }

    return {
      chainId: params.chainId,
      claimRecordId: params.claimRecordId,
      claimedAt: params.claimedAt,
      status: CommonClaimStatus.CLAIMED,
      subsidyClaimId: params.subsidyClaimId,
      txHash: params.existingTxHash ?? params.normalizedTxHash,
    };
  }

  private toTxHashKey(chainId: number, txHash: string): string {
    return `${chainId}:${txHash.toLowerCase()}`;
  }
}
