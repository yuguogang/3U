import { type User } from '@/db';
import { Injectable } from '@nestjs/common';
import {
  NftEligibilityStatus,
  PromotionReferralNftSyncResult,
} from '3u-aura-common';
import { NftEligibilityRepository } from '../../nft-eligibility';
import { StatsRepository } from '../../stats';
import {
  AuditSeamService,
  TransactionOrchestratorService,
} from '../../shared';
import { NftHoldingRepository } from '../repositories/nft-holding.repository';
import { ReferralNftChainRepository } from '../repositories/referral-nft-chain.repository';

type SyncActor = Pick<User, 'id' | 'walletAddress'>;

@Injectable()
export class ReferralNftSyncService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly referralNftChainRepository: ReferralNftChainRepository,
    private readonly nftHoldingRepository: NftHoldingRepository,
    private readonly nftEligibilityRepository: NftEligibilityRepository,
    private readonly statsRepository: StatsRepository,
  ) {}

  async syncMintForUser(
    user: SyncActor,
    txHash: string,
  ): Promise<PromotionReferralNftSyncResult> {
    const referralMint =
      await this.referralNftChainRepository.getReferralMintByTxHash({
        recipient: user.walletAddress,
        txHash,
      });

    const result = await this.transactionOrchestrator.run(async (tx) => {
      await this.statsRepository.ensureUserProfile(user.id, tx);
      await this.statsRepository.setReferralNftFlag(
        {
          hasReferralNft: true,
          userId: user.id,
        },
        tx,
      );

      const persistedHolding = await this.nftHoldingRepository.upsertReferralHolding(
        {
          chainId: referralMint.chainId,
          contractAddress: referralMint.contractAddress,
          mintTxHash: referralMint.mintTxHash,
          mintedAt: referralMint.mintedAt,
          tokenId: referralMint.tokenId,
          userId: user.id,
        },
        tx,
      );
      const persistedEligibility = await this.nftEligibilityRepository.markMinted(
        {
          chainId: referralMint.chainId,
          mintedAt: referralMint.mintedAt,
          mintedTokenId: referralMint.tokenId,
          mintedTxHash: referralMint.mintTxHash,
          payloadHash: referralMint.digest,
          signedNonce: referralMint.nonce,
          userId: user.id,
        },
        tx,
      );

      return {
        chainId: referralMint.chainId,
        changed: persistedHolding.created || persistedEligibility.changed,
        hasReferralNft: true,
        holdingsCreated: persistedHolding.created ? 1 : 0,
        mintedAt: referralMint.mintedAt,
        status: NftEligibilityStatus.MINTED,
        tokenId: referralMint.tokenId.toString(),
        txHash: referralMint.mintTxHash,
      };
    });

    if (result.changed) {
      await this.auditSeam.record({
        action: 'claims.referral-nft.sync',
        payload: {
          chainId: result.chainId,
          hasReferralNft: result.hasReferralNft,
          holdingsCreated: result.holdingsCreated,
          status: result.status,
          tokenId: result.tokenId,
          txHash: result.txHash,
        },
        targetId: user.id,
        targetType: 'User',
      });
    }

    return {
      chainId: result.chainId,
      hasReferralNft: result.hasReferralNft,
      holdingsCreated: result.holdingsCreated,
      mintedAt: result.mintedAt,
      status: result.status,
      tokenId: result.tokenId,
      txHash: result.txHash,
    };
  }
}
