"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGetLatestWeeklyResults, apiGetMyRewards } from "@/api/rewards";

export const rewardsQueryKey = ["promotion", "rewards", "me"] as const;
export const latestWeeklyResultsQueryKey = [
  "promotion",
  "rewards",
  "latest-weekly-results",
] as const;

export function useMyRewardsQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetMyRewards,
    queryKey: rewardsQueryKey,
  });
}

export function useLatestWeeklyResultsQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetLatestWeeklyResults,
    queryKey: latestWeeklyResultsQueryKey,
  });
}
