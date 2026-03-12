import { fetchClient } from "@/lib/fetch.client";
import type {
  PromotionClaimsView,
  PromotionClaimSyncRequest,
  PromotionClaimSyncResult,
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
