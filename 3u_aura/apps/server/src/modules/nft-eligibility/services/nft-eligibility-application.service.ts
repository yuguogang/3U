import {
  NftEligibilityQuery,
  NftEligibilityStatus,
  NftEligibilityView,
  NftReferralSignatureRequest,
} from '3u-aura-common';
import { Prisma } from '@/db';
import { Injectable } from '@nestjs/common';
import { NftEligibilityPolicyEngine } from '../engines/nft-eligibility-policy.engine';
import { NftEligibilityRepository } from '../repositories/nft-eligibility.repository';

type EligibilityRecord = {
  approvedAt: Date | null;
  approvedByWallet: string | null;
  decisionReason: string | null;
  expiresAt: Date | null;
  mintedTokenId: bigint | null;
  rejectedAt: Date | null;
  rejectedByWallet: string | null;
  signedAt: Date | null;
  status: string;
  userId: string;
};

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
    const smallLegVolumeAtomic =
      snapshot.profile?.smallLegVolume?.toFixed(0) ?? '0';
    const status = this.nftEligibilityPolicyEngine.deriveStatus({
      expiresAt: snapshot.nftEligibility?.expiresAt,
      hasReferralNft: snapshot.profile?.hasReferralNft ?? false,
      mintedTokenId: snapshot.nftEligibility?.mintedTokenId,
      personalCheckinCount,
      previousStatus: this.toCommonStatus(snapshot.nftEligibility?.status),
      smallLegVolumeAtomic,
    });
    const persisted =
      (await this.nftEligibilityRepository.upsertEligibilitySnapshot({
        personalCheckinCount,
        smallLegVolumeUsdt: new Prisma.Decimal(smallLegVolumeAtomic),
        status,
        userId: snapshot.id,
      })) as EligibilityRecord;

    return this.nftEligibilityPolicyEngine.toView({
      approvedAt: persisted.approvedAt,
      approvedByWallet: persisted.approvedByWallet,
      decisionReason: persisted.decisionReason,
      expiresAt: persisted.expiresAt,
      mintedTokenId: persisted.mintedTokenId,
      personalCheckinCount,
      rejectedAt: persisted.rejectedAt,
      rejectedByWallet: persisted.rejectedByWallet,
      signedAt: persisted.signedAt,
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

  async approveReferralMintEligibility(input: {
    decisionReason?: string;
    operatorWallet: string;
    userId: string;
  }): Promise<NftEligibilityView> {
    const current = await this.getCurrentEligibility({ userId: input.userId });
    this.nftEligibilityPolicyEngine.assertApprovable(current);

    const updated = (await this.nftEligibilityRepository.markApproved(
      input,
    )) as EligibilityRecord;

    return this.nftEligibilityPolicyEngine.toView({
      approvedAt: updated.approvedAt,
      approvedByWallet: updated.approvedByWallet,
      decisionReason: updated.decisionReason,
      expiresAt: updated.expiresAt,
      mintedTokenId: updated.mintedTokenId,
      personalCheckinCount: current.personalCheckinCount,
      rejectedAt: updated.rejectedAt,
      rejectedByWallet: updated.rejectedByWallet,
      signedAt: updated.signedAt,
      smallLegVolumeAtomic: current.smallLegVolumeUsdt,
      status: updated.status as unknown as NftEligibilityStatus,
      userId: updated.userId,
    });
  }

  async rejectReferralMintEligibility(input: {
    decisionReason: string;
    operatorWallet: string;
    userId: string;
  }): Promise<NftEligibilityView> {
    const current = await this.getCurrentEligibility({ userId: input.userId });
    this.nftEligibilityPolicyEngine.assertRejectable(current);

    const updated = (await this.nftEligibilityRepository.markRejected(
      input,
    )) as EligibilityRecord;

    return this.nftEligibilityPolicyEngine.toView({
      approvedAt: updated.approvedAt,
      approvedByWallet: updated.approvedByWallet,
      decisionReason: updated.decisionReason,
      expiresAt: updated.expiresAt,
      mintedTokenId: updated.mintedTokenId,
      personalCheckinCount: current.personalCheckinCount,
      rejectedAt: updated.rejectedAt,
      rejectedByWallet: updated.rejectedByWallet,
      signedAt: updated.signedAt,
      smallLegVolumeAtomic: current.smallLegVolumeUsdt,
      status: updated.status as unknown as NftEligibilityStatus,
      userId: updated.userId,
    });
  }

  private toCommonStatus(
    status?: string | null,
  ): NftEligibilityStatus | undefined {
    switch (status) {
      case 'ELIGIBLE':
        return NftEligibilityStatus.ELIGIBLE;
      case 'PENDING_APPROVAL':
        return NftEligibilityStatus.PENDING_APPROVAL;
      case 'APPROVED':
        return NftEligibilityStatus.APPROVED;
      case 'SIGNED':
        return NftEligibilityStatus.SIGNED;
      case 'MINTED':
        return NftEligibilityStatus.MINTED;
      case 'REJECTED':
        return NftEligibilityStatus.REJECTED;
      case 'EXPIRED':
        return NftEligibilityStatus.EXPIRED;
      case 'REVOKED':
        return NftEligibilityStatus.REVOKED;
      case 'INELIGIBLE':
        return NftEligibilityStatus.INELIGIBLE;
      default:
        return undefined;
    }
  }
}
