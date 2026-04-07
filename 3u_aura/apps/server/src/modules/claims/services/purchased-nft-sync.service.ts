import {
  ClaimStatus,
  EpochStatus as DbEpochStatus,
  EpochType as DbEpochType,
  Prisma,
  type User,
} from '@/db';
import { Injectable } from '@nestjs/common';
import {
  EpochStatus,
  EpochType,
  PromotionPurchasedNftRefreshResult,
  PromotionPurchasedNftSyncResult,
} from '3u-aura-common';
import { WeeklyEpochPolicyEngine } from '../../epoch/engines/weekly-epoch-policy.engine';
import { WeeklyEpochRepository } from '../../epoch/repositories/weekly-epoch.repository';
import { StatsRepository } from '../../stats';
import {
  AuditSeamService,
  TransactionOrchestratorService,
} from '../../shared';
import {
  PurchasedNftChainRepository,
  type PublishedSubsidyEpochOnChain,
} from '../repositories/purchased-nft-chain.repository';
import { NftHoldingRepository } from '../repositories/nft-holding.repository';
import { NftSubsidyClaimRepository } from '../repositories/nft-subsidy-claim.repository';

type SyncActor = Pick<User, 'id' | 'walletAddress'>;

export interface PurchasedNftSyncResult {
  activePurchasedTokenIds: bigint[];
  claimsCreated: number;
  claimsUpdated: number;
  hasPurchasedNft: boolean;
  holdingsCreated: number;
  publishedSubsidyEpochs: number;
}

@Injectable()
export class PurchasedNftSyncService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly purchasedNftChainRepository: PurchasedNftChainRepository,
    private readonly nftHoldingRepository: NftHoldingRepository,
    private readonly nftSubsidyClaimRepository: NftSubsidyClaimRepository,
    private readonly weeklyEpochPolicyEngine: WeeklyEpochPolicyEngine,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
    private readonly statsRepository: StatsRepository,
  ) {}

  async syncStateForUser(
    user: SyncActor,
  ): Promise<PromotionPurchasedNftRefreshResult> {
    const [purchasedMints, publishedEpochs] = await Promise.all([
      this.purchasedNftChainRepository.listPurchasedMintsForOwner(
        user.walletAddress,
      ),
      this.purchasedNftChainRepository.listPublishedSubsidyEpochs(),
    ]);
    const result = await this.projectPurchasedState(
      user,
      purchasedMints,
      publishedEpochs,
    );

    return {
      activePurchasedTokenIds: result.activePurchasedTokenIds.map((tokenId) =>
        tokenId.toString(),
      ),
      claimsCreated: result.claimsCreated,
      claimsUpdated: result.claimsUpdated,
      hasPurchasedNft: result.hasPurchasedNft,
      holdingsCreated: result.holdingsCreated,
      publishedSubsidyEpochs: result.publishedSubsidyEpochs,
    };
  }

  async syncPurchaseForUser(
    user: SyncActor,
    txHash: string,
  ): Promise<PromotionPurchasedNftSyncResult> {
    const [purchasedMint, publishedEpochs] = await Promise.all([
      this.purchasedNftChainRepository.getPurchasedMintByTxHash({
        buyer: user.walletAddress,
        txHash,
      }),
      this.purchasedNftChainRepository.listPublishedSubsidyEpochs(),
    ]);
    const result = await this.projectPurchasedState(
      user,
      [purchasedMint],
      publishedEpochs,
    );

    return {
      chainId: purchasedMint.chainId,
      claimsCreated: result.claimsCreated,
      claimsUpdated: result.claimsUpdated,
      hasPurchasedNft: result.hasPurchasedNft,
      holdingsCreated: result.holdingsCreated,
      mintedAt: purchasedMint.mintedAt,
      publishedSubsidyEpochs: result.publishedSubsidyEpochs,
      tokenId: purchasedMint.tokenId.toString(),
      txHash: purchasedMint.mintTxHash,
    };
  }

  private async projectPurchasedState(
    user: SyncActor,
    purchasedMints: Array<{
      chainId: number;
      contractAddress: string;
      mintTxHash: string;
      mintedAt: Date;
      purchasedPriceUsdt: string;
      tokenId: bigint;
    }>,
    publishedEpochs: PublishedSubsidyEpochOnChain[],
  ): Promise<PurchasedNftSyncResult> {
    const activePurchasedTokenIds = purchasedMints.map((mint) => mint.tokenId);
    const hasPurchasedNft = activePurchasedTokenIds.length > 0;
    const now = Date.now();

    const result = await this.transactionOrchestrator.run(async (tx) => {
      await this.statsRepository.ensureUserProfile(user.id, tx);
      await this.statsRepository.setPurchasedNftFlag(
        {
          hasPurchasedNft,
          userId: user.id,
        },
        tx,
      );

      let holdingsCreated = 0;
      let claimsCreated = 0;
      let claimsUpdated = 0;
      const persistedHoldings: Array<{
        id: string;
        tokenId: bigint;
      }> = [];

      for (const purchasedMint of purchasedMints) {
        const persisted = await this.nftHoldingRepository.upsertPurchasedHolding(
          {
            chainId: purchasedMint.chainId,
            contractAddress: purchasedMint.contractAddress,
            mintTxHash: purchasedMint.mintTxHash,
            mintedAt: purchasedMint.mintedAt,
            purchasedPriceUsdt: new Prisma.Decimal(
              purchasedMint.purchasedPriceUsdt,
            ),
            tokenId: purchasedMint.tokenId,
            userId: user.id,
          },
          tx,
        );
        persistedHoldings.push(persisted.holding);
        if (persisted.created) {
          holdingsCreated += 1;
        }
      }

      for (const publishedEpoch of publishedEpochs) {
        const epoch = await this.ensureSubsidyEpoch(publishedEpoch, tx);

        for (const holding of persistedHoldings) {
          if (holding.tokenId > publishedEpoch.maxEligibleTokenId) {
            continue;
          }

          const projectedClaim =
            await this.nftSubsidyClaimRepository.upsertProjectedClaim(
              {
                amountUsdt: new Prisma.Decimal(
                  publishedEpoch.subsidyAmountUsdt,
                ),
                chainId: publishedEpoch.chainId,
                contractAddress: publishedEpoch.contractAddress,
                epochId: epoch.id,
                nftHoldingId: holding.id,
                status:
                  publishedEpoch.claimDeadline.getTime() <= now
                    ? ClaimStatus.VOIDED
                    : ClaimStatus.PENDING,
                userId: user.id,
              },
              tx,
            );

          if (projectedClaim.created) {
            claimsCreated += 1;
          } else if (projectedClaim.updated) {
            claimsUpdated += 1;
          }
        }
      }

      return {
        activePurchasedTokenIds,
        claimsCreated,
        claimsUpdated,
        hasPurchasedNft,
        holdingsCreated,
        publishedSubsidyEpochs: publishedEpochs.length,
      };
    });

    if (
      result.holdingsCreated > 0 ||
      result.claimsCreated > 0 ||
      result.claimsUpdated > 0
    ) {
      await this.auditSeam.record({
        action: 'claims.purchased-nft.sync',
        payload: {
          activePurchasedTokenIds: result.activePurchasedTokenIds.map((tokenId) =>
            tokenId.toString(),
          ),
          claimsCreated: result.claimsCreated,
          claimsUpdated: result.claimsUpdated,
          holdingsCreated: result.holdingsCreated,
          publishedSubsidyEpochs: result.publishedSubsidyEpochs,
        },
        targetId: user.id,
        targetType: 'User',
      });
    }

    return result;
  }

  private async ensureSubsidyEpoch(
    publishedEpoch: PublishedSubsidyEpochOnChain,
    tx: Prisma.TransactionClient,
  ) {
    const existing = await this.weeklyEpochRepository.findByEpochNo(
      DbEpochType.NFT_SUBSIDY,
      publishedEpoch.epochNo,
      tx,
    );
    if (existing) {
      return existing;
    }

    const projection = this.weeklyEpochPolicyEngine.projectEpochByNo(
      publishedEpoch.epochNo,
      EpochType.NFT_SUBSIDY,
      publishedEpoch.publishedAt,
    );

    return this.weeklyEpochRepository.ensureEpoch(
      {
        endAt: projection.endAt,
        epochNo: projection.epochNo,
        epochType: DbEpochType.NFT_SUBSIDY,
        startAt: projection.startAt,
        status: this.toDbEpochStatus(projection.status),
      },
      tx,
    );
  }

  private toDbEpochStatus(status: EpochStatus): DbEpochStatus {
    switch (status) {
      case EpochStatus.OPEN:
        return DbEpochStatus.OPEN;
      case EpochStatus.CALCULATING:
        return DbEpochStatus.CALCULATING;
      case EpochStatus.ROOT_POSTED:
        return DbEpochStatus.ROOT_POSTED;
      case EpochStatus.SETTLED:
        return DbEpochStatus.SETTLED;
      case EpochStatus.CANCELLED:
        return DbEpochStatus.CANCELLED;
      case EpochStatus.PENDING:
      default:
        return DbEpochStatus.PENDING;
    }
  }
}
