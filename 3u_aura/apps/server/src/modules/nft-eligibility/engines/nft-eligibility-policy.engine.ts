import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  assertSignatureRequest(_request: NftReferralSignatureRequest): void {
    // Placeholder for Phase 4 signature gating.
  }

  assertEligibilitySourceExists<T>(
    snapshot: T | null,
  ): asserts snapshot is T {
    if (!snapshot) {
      throw new NotFoundException('Eligibility source not found');
    }
  }

  assertEligibleForSigning(view: NftEligibilityView): void {
    if (
      view.status !== NftEligibilityStatus.ELIGIBLE &&
      view.status !== NftEligibilityStatus.SIGNED
    ) {
      throw new ConflictException('NFT referral mint is not currently eligible');
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
    if (params.hasReferralNft || params.mintedTokenId) {
      return NftEligibilityStatus.MINTED;
    }

    const meetsThresholds =
      params.personalCheckinCount >= REQUIRED_CHECKIN_COUNT &&
      BigInt(params.smallLegVolumeAtomic) >= BigInt(REQUIRED_SMALL_LEG_USDT_ATOMIC);

    if (!meetsThresholds) {
      return NftEligibilityStatus.INELIGIBLE;
    }

    if (
      params.previousStatus === NftEligibilityStatus.SIGNED &&
      params.expiresAt &&
      params.expiresAt.getTime() > Date.now()
    ) {
      return NftEligibilityStatus.SIGNED;
    }

    return NftEligibilityStatus.ELIGIBLE;
  }

  toView(params: {
    expiresAt?: Date | null;
    mintedTokenId?: bigint | null;
    personalCheckinCount: number;
    smallLegVolumeAtomic: string;
    status: NftEligibilityStatus;
    userId: string;
  }): NftEligibilityView {
    return {
      expiresAt: params.expiresAt ?? undefined,
      mintedTokenId: params.mintedTokenId?.toString(),
      personalCheckinCount: params.personalCheckinCount,
      requiredCheckinCount: REQUIRED_CHECKIN_COUNT,
      requiredSmallLegUsdt: REQUIRED_SMALL_LEG_USDT_ATOMIC,
      smallLegVolumeUsdt: params.smallLegVolumeAtomic,
      status: params.status,
      userId: params.userId,
    };
  }
}
