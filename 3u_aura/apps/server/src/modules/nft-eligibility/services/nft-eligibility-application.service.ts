import {
  NftEligibilityQuery,
  NftEligibilityStatus,
  NftEligibilityView,
  NftReferralSignatureRequest,
} from '3u-aura-common';
import { NftEligibilityStatus as DbNftEligibilityStatus, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';
import { NftEligibilityPolicyEngine } from '../engines/nft-eligibility-policy.engine';
import { NftEligibilityRepository } from '../repositories/nft-eligibility.repository';

@Injectable()
export class NftEligibilityApplicationService {
  constructor(
    private readonly nftEligibilityPolicyEngine: NftEligibilityPolicyEngine,
    private readonly nftEligibilityRepository: NftEligibilityRepository,
  ) {}

  async getCurrentEligibility(
    query: NftEligibilityQuery,
  ): Promise<NftEligibilityView> {
    this.nftEligibilityPolicyEngine.normalizeQuery(query);
    const snapshot = query.userId
      ? await this.nftEligibilityRepository.findCurrentByUser(query.userId)
      : await this.nftEligibilityRepository.findCurrentByWallet(
          query.walletAddress!,
        );
    this.nftEligibilityPolicyEngine.assertEligibilitySourceExists(snapshot);

    const personalCheckinCount = snapshot.profile?.totalCheckinCount ?? 0;
    const smallLegVolumeAtomic = snapshot.profile?.smallLegVolume?.toFixed(0) ?? '0';
    const status = this.nftEligibilityPolicyEngine.deriveStatus({
      expiresAt: snapshot.nftEligibility?.expiresAt,
      hasReferralNft: snapshot.profile?.hasReferralNft ?? false,
      mintedTokenId: snapshot.nftEligibility?.mintedTokenId,
      personalCheckinCount,
      previousStatus: this.toCommonStatus(snapshot.nftEligibility?.status),
      smallLegVolumeAtomic,
    });
    const persisted = await this.nftEligibilityRepository.upsertEligibilitySnapshot(
      {
        personalCheckinCount,
        smallLegVolumeUsdt: new Prisma.Decimal(smallLegVolumeAtomic),
        status,
        userId: snapshot.id,
      },
    );

    return this.nftEligibilityPolicyEngine.toView({
      expiresAt: persisted.expiresAt,
      mintedTokenId: persisted.mintedTokenId,
      personalCheckinCount,
      smallLegVolumeAtomic,
      status,
      userId: snapshot.id,
    });
  }

  async prepareReferralMint(
    request: NftReferralSignatureRequest,
  ): Promise<NftEligibilityView> {
    this.nftEligibilityPolicyEngine.assertSignatureRequest(request);

    return this.getCurrentEligibility({ walletAddress: request.recipient });
  }

  private toCommonStatus(
    status?: DbNftEligibilityStatus | null,
  ): NftEligibilityStatus | undefined {
    switch (status) {
      case DbNftEligibilityStatus.ELIGIBLE:
        return NftEligibilityStatus.ELIGIBLE;
      case DbNftEligibilityStatus.SIGNED:
        return NftEligibilityStatus.SIGNED;
      case DbNftEligibilityStatus.MINTED:
        return NftEligibilityStatus.MINTED;
      case DbNftEligibilityStatus.EXPIRED:
        return NftEligibilityStatus.EXPIRED;
      case DbNftEligibilityStatus.REVOKED:
        return NftEligibilityStatus.REVOKED;
      case DbNftEligibilityStatus.INELIGIBLE:
        return NftEligibilityStatus.INELIGIBLE;
      default:
        return undefined;
    }
  }
}
