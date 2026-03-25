import { type User } from '@/db';
import { Injectable } from '@nestjs/common';
import {
  ClaimStatus,
  ClaimType,
  PromotionClaimsView,
} from '3u-aura-common';
import { LotteryTicketRepository } from '../../lottery';
import { ClaimRecordRepository } from '../repositories/claim-record.repository';
import { NftSubsidyClaimRepository } from '../repositories/nft-subsidy-claim.repository';

@Injectable()
export class ClaimsReadService {
  constructor(
    private readonly claimRecordRepository: ClaimRecordRepository,
    private readonly lotteryTicketRepository: LotteryTicketRepository,
    private readonly nftSubsidyClaimRepository: NftSubsidyClaimRepository,
  ) {}

  async listClaimsForUser(
    user: Pick<User, 'id' | 'walletAddress'>,
  ): Promise<PromotionClaimsView> {
    const [merkleClaims, hiddenEpochIds, nftSubsidyClaims] = await Promise.all([
      this.claimRecordRepository.listMerkleClaimsForUser(user.id),
      this.lotteryTicketRepository.listUnrevealedParticipatingEpochIdsForUser(
        user.id,
      ),
      this.nftSubsidyClaimRepository.listClaimsForUser(user.id),
    ]);
    const hiddenEpochIdSet = new Set(hiddenEpochIds);

    return {
      merkleClaims: merkleClaims
        .filter(
          (claim) =>
            !(
              claim.claimType === ClaimType.MERKLE_LOTTERY &&
              hiddenEpochIdSet.has(claim.epochId ?? '')
            ),
        )
        .map((claim) => ({
          amount: claim.amount.toFixed(0),
          chainId: claim.chainId,
          claimRecordId: claim.id,
          claimType: claim.claimType as ClaimType,
          claimedAt: claim.claimedAt ?? undefined,
          contractAddress: claim.contractAddress ?? undefined,
          epochId: claim.epochId!,
          epochNo: claim.epoch?.epochNo ?? 0,
          merkleIndex: claim.merkleIndex ?? undefined,
          merkleProof: Array.isArray(claim.merkleProofJson)
            ? claim.merkleProofJson.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
          root: claim.root ?? undefined,
          status: claim.status as ClaimStatus,
          tokenSymbol: claim.tokenSymbol,
          txHash: claim.txHash ?? undefined,
        })),
      nftSubsidyClaims: nftSubsidyClaims.map((claim) => ({
        amountUsdt: claim.amountUsdt.toFixed(0),
        chainId: claim.chainId,
        claimedAt: claim.claimedAt ?? undefined,
        contractAddress: claim.contractAddress ?? undefined,
        epochId: claim.epochId,
        epochNo: claim.epoch.epochNo,
        status: claim.status as ClaimStatus,
        subsidyClaimId: claim.id,
        tokenId: claim.nftHolding.tokenId.toString(),
        txHash: claim.txHash ?? undefined,
      })),
    };
  }
}
