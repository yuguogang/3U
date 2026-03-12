import { fetchClient } from "@/lib/fetch.client";
import type { PromotionRewardView } from "3u-aura-common";

export async function apiGetMyRewards() {
  return fetchClient<PromotionRewardView[]>("/api/v1/rewards/me");
}
