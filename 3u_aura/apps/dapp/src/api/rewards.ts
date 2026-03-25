import { fetchClient } from "@/lib/fetch.client";
import type {
  PromotionRewardView,
  PromotionWeeklyResultsView,
} from "3u-aura-common";

export async function apiGetMyRewards() {
  return fetchClient<PromotionRewardView[]>("/api/v1/rewards/me");
}

export async function apiGetLatestWeeklyResults() {
  return fetchClient<PromotionWeeklyResultsView | null>(
    "/api/v1/rewards/me/latest-weekly-results",
  );
}
