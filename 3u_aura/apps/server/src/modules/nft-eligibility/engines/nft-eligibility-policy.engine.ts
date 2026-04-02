import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NftEligibilityQuery,
  NftEligibilityStatus,
  NftEligibilityView,
  NftReferralSignatureRequest,
} from '3u-aura-common';

const REQUIRED_CHECKIN_COUNT = 30;
const REQUIRED_SMALL_LEG_USDT_ATOMIC = '6000000000';

@Injectable()
export class NftEligibilityPolicyEngine {
  normalizeQuery(query: NftEligibilityQuery): NftEligibilityQuery {
    return query;
  }

  assertSignatureRequest(request: NftReferralSignatureRequest): void {
    void request;
    // Placeholder for Phase 4 signature gating.
  }

  assertEligibilitySourceExists<T>(snapshot: T | null): asserts snapshot is T {
    if (!snapshot) {
      throw new NotFoundException('Eligibility source not found');
    }
  }

  assertEligibleForSigning(view: NftEligibilityView): void {
    if (
      view.status !== NftEligibilityStatus.APPROVED &&
      view.status !== NftEligibilityStatus.EXPIRED &&
      view.status !== NftEligibilityStatus.SIGNED
    ) {
      throw new ConflictException(
        'NFT referral mint is not currently eligible',
      );
    }
  }

  assertGiftable(view: NftEligibilityView): void {
    if (
      view.status === NftEligibilityStatus.SIGNED ||
      view.status === NftEligibilityStatus.MINTED
    ) {
      throw new ConflictException(
        'NFT referral gift is not allowed for the current eligibility state',
      );
    }
  }

  assertApprovable(view: NftEligibilityView): void {
    if (
      view.status !== NftEligibilityStatus.PENDING_APPROVAL &&
      view.status !== NftEligibilityStatus.REJECTED &&
      view.status !== NftEligibilityStatus.APPROVED &&
      view.status !== NftEligibilityStatus.EXPIRED
    ) {
      throw new ConflictException(
        'NFT referral approval is not allowed for the current eligibility state',
      );
    }
  }

  assertRejectable(view: NftEligibilityView): void {
    if (
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

  deriveStatus(params: {
    expiresAt?: Date | null;
    hasReferralNft: boolean;
    mintedTokenId?: bigint | null;
    personalCheckinCount: number;
    previousStatus?: NftEligibilityStatus | null;
    smallLegVolumeAtomic: string;
  }): NftEligibilityStatus {
    const previousStatus = params.previousStatus?.toString();

    if (params.hasReferralNft || params.mintedTokenId) {
      return NftEligibilityStatus.MINTED;
    }

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

  toView(params: {
    approvedAt?: Date | null;
    approvedByWallet?: string | null;
    decisionReason?: string | null;
    expiresAt?: Date | null;
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
      decisionReason: params.decisionReason ?? undefined,
      expiresAt: params.expiresAt ?? undefined,
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
