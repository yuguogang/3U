"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PromotionClaimSyncRequest,
  PromotionPurchasedNftSyncRequest,
  PromotionReferralNftSyncRequest,
} from "3u-aura-common";
import {
  apiGetMyClaims,
  apiRefreshMyPurchasedNft,
  apiSyncMyClaim,
  apiSyncMyPurchasedNft,
  apiSyncMyReferralNft,
} from "@/api/claims";
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

function invalidateClaimDependentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["profile"] }),
    queryClient.invalidateQueries({ queryKey: claimsQueryKey }),
    queryClient.invalidateQueries({ queryKey: rewardsQueryKey }),
  ]);
}

export function useSyncMyPurchasedNftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PromotionPurchasedNftSyncRequest) =>
      apiSyncMyPurchasedNft(input),
    onSuccess: async () => {
      await invalidateClaimDependentQueries(queryClient);
    },
  });
}

export function useRefreshMyPurchasedNftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiRefreshMyPurchasedNft(),
    onSuccess: async () => {
      await invalidateClaimDependentQueries(queryClient);
    },
  });
}

export function useSyncMyReferralNftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PromotionReferralNftSyncRequest) =>
      apiSyncMyReferralNft(input),
    onSuccess: async () => {
      await invalidateClaimDependentQueries(queryClient);
    },
  });
}
