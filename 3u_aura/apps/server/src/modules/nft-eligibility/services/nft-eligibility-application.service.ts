import {
  NftEligibilityQuery,
  NftEligibilityStatus,
  NftEligibilityView,
  NftReferralGrantSource,
  NftReferralSignatureRequest,
} from '3u-aura-common';
import { Prisma } from '@/db';
import { Injectable } from '@nestjs/common';
import {
  NftEligibilityPolicyEngine,
} from '../engines/nft-eligibility-policy.engine';
import {
  NftEligibilityRepository,
  ReferralGrantSummary,
} from '../repositories/nft-eligibility.repository';

type EligibilitySnapshotRecord = Awaited<
  ReturnType<NftEligibilityRepository['upsertEligibilitySnapshot']>
>;

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
    const previousStatus = this.toCommonStatus(snapshot.nftEligibility?.status);
    const grantSummary =
      await this.nftEligibilityRepository.summarizeGrantsForUser(snapshot.id);
    const baseStatus = this.nftEligibilityPolicyEngine.deriveBaseStatus({
      expiresAt: snapshot.nftEligibility?.expiresAt,
      personalCheckinCount,
      previousStatus,
      smallLegVolumeAtomic,
    });
    const summaryStatus = this.nftEligibilityPolicyEngine.deriveSummaryStatus({
      baseStatus,
      grantSummary,
    });
    const persisted =
      await this.nftEligibilityRepository.upsertEligibilitySnapshot({
        ...this.toSnapshotMetadata(grantSummary),
        personalCheckinCount,
        smallLegVolumeUsdt: new Prisma.Decimal(smallLegVolumeAtomic),
        status: summaryStatus,
        userId: snapshot.id,
      });

    return this.toView({
      grantSummary,
      persisted,
      personalCheckinCount,
      smallLegVolumeAtomic,
      status: summaryStatus,
    });
  }

  async prepareReferralMint(
    request: NftReferralSignatureRequest,
  ): Promise<NftEligibilityView> {
    return this.getCurrentEligibility({ walletAddress: request.recipient });
  }

  async approveReferralMintEligibility(input: {
    decisionReason?: string;
    operatorWallet: string;
    userId: string;
  }): Promise<NftEligibilityView> {
    const current = await this.getCurrentEligibility({ userId: input.userId });
    this.nftEligibilityPolicyEngine.assertApprovable(current);

    await this.nftEligibilityRepository.markApproved({
      ...input,
      source: NftReferralGrantSource.QUALIFIED_APPROVAL,
    });

    return this.getCurrentEligibility({ userId: input.userId });
  }

  async giftReferralMintEligibility(input: {
    decisionReason?: string;
    operatorWallet: string;
    userId: string;
  }): Promise<NftEligibilityView> {
    const current = await this.getCurrentEligibility({ userId: input.userId });
    this.nftEligibilityPolicyEngine.assertGiftable(current);

    await this.nftEligibilityRepository.markApproved({
      ...input,
      source: NftReferralGrantSource.MANUAL_GIFT,
    });

    return this.getCurrentEligibility({ userId: input.userId });
  }

  async rejectReferralMintEligibility(input: {
    decisionReason: string;
    operatorWallet: string;
    userId: string;
  }): Promise<NftEligibilityView> {
    const current = await this.getCurrentEligibility({ userId: input.userId });
    this.nftEligibilityPolicyEngine.assertRejectable(current);

    await this.nftEligibilityRepository.markRejected(input);

    return this.getCurrentEligibility({ userId: input.userId });
  }

  private toSnapshotMetadata(grantSummary: ReferralGrantSummary) {
    const referenceGrant =
      grantSummary.latestActiveGrant ??
      grantSummary.latestRejectedGrant ??
      grantSummary.latestMintedGrant ??
      grantSummary.latestGrant;

    return {
      approvedAt: referenceGrant?.approvedAt ?? null,
      approvedByWallet: referenceGrant?.approvedByWallet ?? null,
      decisionReason: referenceGrant?.decisionReason ?? null,
      expiresAt: grantSummary.latestActiveGrant?.expiresAt ?? null,
      mintedAt: grantSummary.latestMintedGrant?.mintedAt ?? null,
      mintedTokenId: grantSummary.latestMintedGrant?.mintedTokenId ?? null,
      rejectedAt: grantSummary.latestRejectedGrant?.rejectedAt ?? null,
      rejectedByWallet: grantSummary.latestRejectedGrant?.rejectedByWallet ?? null,
      signedAt: grantSummary.latestActiveGrant?.signedAt ?? null,
    };
  }

  private toView(params: {
    grantSummary: ReferralGrantSummary;
    persisted: EligibilitySnapshotRecord;
    personalCheckinCount: number;
    smallLegVolumeAtomic: string;
    status: NftEligibilityStatus;
  }): NftEligibilityView {
    return this.nftEligibilityPolicyEngine.toView({
      approvedAt: params.persisted.approvedAt,
      approvedByWallet: params.persisted.approvedByWallet,
      claimableMintCount: params.grantSummary.claimableMintCount,
      decisionReason: params.persisted.decisionReason,
      expiresAt: params.persisted.expiresAt,
      mintedReferralCount: params.grantSummary.mintedReferralCount,
      mintedTokenId: params.persisted.mintedTokenId,
      personalCheckinCount: params.personalCheckinCount,
      rejectedAt: params.persisted.rejectedAt,
      rejectedByWallet: params.persisted.rejectedByWallet,
      signedAt: params.persisted.signedAt,
      smallLegVolumeAtomic: params.smallLegVolumeAtomic,
      status: params.status,
      userId: params.persisted.userId,
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
