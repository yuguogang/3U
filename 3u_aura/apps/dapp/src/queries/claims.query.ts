"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PromotionClaimSyncRequest } from "3u-aura-common";
import { apiGetMyClaims, apiSyncMyClaim } from "@/api/claims";
import { rewardsQueryKey } from "@/queries/rewards.query";

export const claimsQueryKey = ["promotion", "claims", "me"] as const;

export function useMyClaimsQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetMyClaims,
    queryKey: claimsQueryKey,
  });
}

export function useSyncMyClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PromotionClaimSyncRequest) => apiSyncMyClaim(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: claimsQueryKey }),
        queryClient.invalidateQueries({ queryKey: rewardsQueryKey }),
      ]);
    },
  });
}
