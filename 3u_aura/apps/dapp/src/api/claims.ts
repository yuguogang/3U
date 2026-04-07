import { fetchClient } from "@/lib/fetch.client";
import type {
  PromotionClaimsView,
  PromotionClaimSyncRequest,
  PromotionClaimSyncResult,
  PromotionPurchasedNftRefreshResult,
  PromotionPurchasedNftSyncRequest,
  PromotionPurchasedNftSyncResult,
  PromotionReferralNftSyncRequest,
  PromotionReferralNftSyncResult,
} from "3u-aura-common";

export async function apiGetMyClaims() {
  return fetchClient<PromotionClaimsView>("/api/v1/claims/me");
}

export async function apiSyncMyClaim(input: PromotionClaimSyncRequest) {
  return fetchClient<PromotionClaimSyncResult>("/api/v1/claims/sync", {
    body: input,
    method: "POST",
  });
}

export async function apiSyncMyPurchasedNft(
  input: PromotionPurchasedNftSyncRequest,
) {
  return fetchClient<PromotionPurchasedNftSyncResult>(
    "/api/v1/claims/purchased-nft/sync",
    {
      body: input,
      method: "POST",
    },
  );
}

export async function apiRefreshMyPurchasedNft() {
  return fetchClient<PromotionPurchasedNftRefreshResult>(
    "/api/v1/claims/purchased-nft/refresh",
    {
      method: "POST",
    },
  );
}

export async function apiSyncMyReferralNft(
  input: PromotionReferralNftSyncRequest,
) {
  return fetchClient<PromotionReferralNftSyncResult>(
    "/api/v1/claims/referral-nft/sync",
    {
      body: input,
      method: "POST",
    },
  );
}
