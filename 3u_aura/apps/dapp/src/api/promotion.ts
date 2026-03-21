import { fetchClient } from "@/lib/fetch.client";
import type {
  NftEligibilityView,
  NftReferralSignatureRequest,
  PromotionCheckinRequest,
  PromotionCheckinResult,
  ReferralMintSignaturePayload,
  ReferralBindInviterInput,
  ReferralBindPlacementInput,
  ReferralInviterBindingView,
  ReferralPendingPlacementView,
  ReferralPlacementSlotView,
  ReferralPlacementView,
  ReferralSignaturePreview,
  TeamTreeSnapshotQuery,
  TeamTreeSnapshotView,
  WeeklyEpochBoundaryView,
} from "3u-aura-common";

export async function apiSubmitCheckin(input: PromotionCheckinRequest) {
  return fetchClient<PromotionCheckinResult>("/api/v1/checkin", {
    body: input,
    method: "POST",
  });
}

export async function apiBindInviter(input: ReferralBindInviterInput) {
  return fetchClient<ReferralInviterBindingView>("/api/v1/referral/inviter/bind", {
    body: input,
    method: "POST",
  });
}

export async function apiGetPendingPlacements() {
  return fetchClient<ReferralPendingPlacementView[]>("/api/v1/referral/pending-placement");
}

export async function apiGetSelectableSlots() {
  return fetchClient<ReferralPlacementSlotView[]>("/api/v1/tree/placement/selectable-slots");
}

export async function apiGetTeamTreeSnapshot(query?: TeamTreeSnapshotQuery) {
  return fetchClient<TeamTreeSnapshotView>("/api/v1/tree/subtree", {
    query,
  });
}

export async function apiBindPlacement(input: ReferralBindPlacementInput) {
  return fetchClient<ReferralPlacementView>("/api/v1/tree/placement/bind", {
    body: input,
    method: "POST",
  });
}

export async function apiGetCurrentEligibility(walletAddress?: string) {
  return fetchClient<NftEligibilityView>("/api/v1/nft-eligibility/current", {
    query: walletAddress ? { walletAddress } : undefined,
  });
}

export async function apiGetCurrentEpoch() {
  return fetchClient<WeeklyEpochBoundaryView>("/api/v1/epoch/boundary", {
    auth: false,
  });
}

export async function apiPrepareReferralMintPreview(
  input: NftReferralSignatureRequest,
) {
  return fetchClient<ReferralSignaturePreview>("/api/v1/signing/referral-mint-preview", {
    body: input,
    method: "POST",
  });
}

export async function apiIssueReferralMintSignature(
  input: NftReferralSignatureRequest,
) {
  return fetchClient<ReferralMintSignaturePayload>(
    "/api/v1/signing/referral-mint-signature",
    {
      body: input,
      method: "POST",
    },
  );
}
