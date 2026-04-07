import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NftEligibilityQuery,
  NftEligibilityStatus,
  NftEligibilityView,
} from '3u-aura-common';
import { ReferralGrantSummary } from '../repositories/nft-eligibility.repository';

const REQUIRED_CHECKIN_COUNT = 30;
const REQUIRED_SMALL_LEG_USDT_ATOMIC = '6000000000';

@Injectable()
export class NftEligibilityPolicyEngine {
  normalizeQuery(query: NftEligibilityQuery): NftEligibilityQuery {
    return query;
  }

  assertEligibilitySourceExists<T>(snapshot: T | null): asserts snapshot is T {
    if (!snapshot) {
      throw new NotFoundException('Eligibility source not found');
    }
  }

  assertEligibleForSigning(view: NftEligibilityView): void {
    if (view.claimableMintCount <= 0) {
      throw new ConflictException(
        'NFT referral mint is not currently eligible',
      );
    }
  }

  assertGiftable(_view: NftEligibilityView): void {
    // Gift flow now permits issuing additional referral grants to the same wallet.
  }

  assertApprovable(view: NftEligibilityView): void {
    if (
      view.status !== NftEligibilityStatus.PENDING_APPROVAL &&
      view.status !== NftEligibilityStatus.REJECTED &&
      view.status !== NftEligibilityStatus.APPROVED &&
      view.status !== NftEligibilityStatus.EXPIRED &&
      view.status !== NftEligibilityStatus.MINTED
    ) {
      throw new ConflictException(
        'NFT referral approval is not allowed for the current eligibility state',
      );
    }
  }

  assertRejectable(view: NftEligibilityView): void {
    if (
      view.claimableMintCount <= 0 &&
      view.status !== NftEligibilityStatus.PENDING_APPROVAL &&
      view.status !== NftEligibilityStatus.REJECTED &&
      view.status !== NftEligibilityStatus.APPROVED &&
      view.status !== NftEligibilityStatus.EXPIRED
    ) {
      throw new ConflictException(
        'NFT referral rejection is not allowed for the current eligibility state',
      );
    }
  }

  deriveBaseStatus(params: {
    expiresAt?: Date | null;
    personalCheckinCount: number;
    previousStatus?: NftEligibilityStatus | null;
    smallLegVolumeAtomic: string;
  }): NftEligibilityStatus {
    const previousStatus = params.previousStatus?.toString();

    if (previousStatus === NftEligibilityStatus.APPROVED) {
      return NftEligibilityStatus.APPROVED;
    }

    const meetsThresholds =
      params.personalCheckinCount >= REQUIRED_CHECKIN_COUNT &&
      BigInt(params.smallLegVolumeAtomic) >=
        BigInt(REQUIRED_SMALL_LEG_USDT_ATOMIC);

    if (!meetsThresholds) {
      return NftEligibilityStatus.INELIGIBLE;
    }

    if (previousStatus === NftEligibilityStatus.REVOKED) {
      return NftEligibilityStatus.REVOKED;
    }

    if (
      previousStatus === NftEligibilityStatus.SIGNED &&
      params.expiresAt &&
      params.expiresAt.getTime() > Date.now()
    ) {
      return NftEligibilityStatus.SIGNED;
    }

    if (previousStatus === NftEligibilityStatus.SIGNED) {
      return NftEligibilityStatus.EXPIRED;
    }

    if (previousStatus === NftEligibilityStatus.EXPIRED) {
      return NftEligibilityStatus.EXPIRED;
    }

    if (previousStatus === NftEligibilityStatus.REJECTED) {
      return NftEligibilityStatus.REJECTED;
    }

    if (previousStatus === NftEligibilityStatus.PENDING_APPROVAL) {
      return NftEligibilityStatus.PENDING_APPROVAL;
    }

    return NftEligibilityStatus.PENDING_APPROVAL;
  }

  deriveSummaryStatus(params: {
    baseStatus: NftEligibilityStatus;
    grantSummary: ReferralGrantSummary;
  }): NftEligibilityStatus {
    if (params.grantSummary.signedGrantCount > 0) {
      return NftEligibilityStatus.SIGNED;
    }

    if (params.grantSummary.approvedGrantCount > 0) {
      return NftEligibilityStatus.APPROVED;
    }

    if (params.grantSummary.expiredGrantCount > 0) {
      return NftEligibilityStatus.EXPIRED;
    }

    if (params.grantSummary.mintedReferralCount > 0) {
      return NftEligibilityStatus.MINTED;
    }

    if (
      params.baseStatus === NftEligibilityStatus.REJECTED ||
      params.baseStatus === NftEligibilityStatus.REVOKED ||
      params.baseStatus === NftEligibilityStatus.INELIGIBLE ||
      params.baseStatus === NftEligibilityStatus.PENDING_APPROVAL
    ) {
      return params.baseStatus;
    }

    return params.baseStatus;
  }

  toView(params: {
    approvedAt?: Date | null;
    approvedByWallet?: string | null;
    claimableMintCount: number;
    decisionReason?: string | null;
    expiresAt?: Date | null;
    mintedReferralCount: number;
    mintedTokenId?: bigint | null;
    personalCheckinCount: number;
    rejectedAt?: Date | null;
    rejectedByWallet?: string | null;
    signedAt?: Date | null;
    smallLegVolumeAtomic: string;
    status: NftEligibilityStatus;
    userId: string;
  }): NftEligibilityView {
    return {
      approvedAt: params.approvedAt ?? undefined,
      approvedByWallet: params.approvedByWallet ?? undefined,
      claimableMintCount: params.claimableMintCount,
      decisionReason: params.decisionReason ?? undefined,
      expiresAt: params.expiresAt ?? undefined,
      mintedReferralCount: params.mintedReferralCount,
      mintedTokenId: params.mintedTokenId?.toString(),
      personalCheckinCount: params.personalCheckinCount,
      rejectedAt: params.rejectedAt ?? undefined,
      rejectedByWallet: params.rejectedByWallet ?? undefined,
      requiredCheckinCount: REQUIRED_CHECKIN_COUNT,
      requiredSmallLegUsdt: REQUIRED_SMALL_LEG_USDT_ATOMIC,
      signedAt: params.signedAt ?? undefined,
      smallLegVolumeUsdt: params.smallLegVolumeAtomic,
      status: params.status,
      userId: params.userId,
    };
  }
}
