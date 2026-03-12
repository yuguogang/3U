"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGetMyRewards } from "@/api/rewards";

export const rewardsQueryKey = ["promotion", "rewards", "me"] as const;

export function useMyRewardsQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetMyRewards,
    queryKey: rewardsQueryKey,
  });
}
