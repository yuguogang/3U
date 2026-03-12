"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NftReferralSignatureRequest,
  PromotionCheckinRequest,
  ReferralBindInviterInput,
  ReferralBindPlacementInput,
} from "3u-aura-common";
import {
  apiBindInviter,
  apiBindPlacement,
  apiGetCurrentEligibility,
  apiGetCurrentEpoch,
  apiGetPendingPlacements,
  apiGetSelectableSlots,
  apiIssueReferralMintSignature,
  apiPrepareReferralMintPreview,
  apiSubmitCheckin,
} from "@/api/promotion";

export const promotionQueryKeys = {
  currentEligibility: (walletAddress?: string) =>
    ["promotion", "eligibility", walletAddress ?? "me"] as const,
  currentEpoch: ["promotion", "epoch", "current"] as const,
  pendingPlacements: ["promotion", "team", "pending-placements"] as const,
  selectableSlots: ["promotion", "team", "selectable-slots"] as const,
};

export function useCurrentEpochQuery() {
  return useQuery({
    queryFn: apiGetCurrentEpoch,
    queryKey: promotionQueryKeys.currentEpoch,
  });
}

export function useCurrentEligibilityQuery(
  walletAddress?: string,
  enabled: boolean = true,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetCurrentEligibility(walletAddress),
    queryKey: promotionQueryKeys.currentEligibility(walletAddress),
  });
}

export function usePendingPlacementsQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetPendingPlacements,
    queryKey: promotionQueryKeys.pendingPlacements,
  });
}

export function useSelectableSlotsQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetSelectableSlots,
    queryKey: promotionQueryKeys.selectableSlots,
  });
}

export function useSubmitCheckinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PromotionCheckinRequest) => apiSubmitCheckin(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({
          queryKey: promotionQueryKeys.currentEligibility(),
        }),
      ]);
    },
  });
}

export function useBindInviterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReferralBindInviterInput) => apiBindInviter(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({
          queryKey: promotionQueryKeys.pendingPlacements,
        }),
      ]);
    },
  });
}

export function useBindPlacementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReferralBindPlacementInput) => apiBindPlacement(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({
          queryKey: promotionQueryKeys.pendingPlacements,
        }),
        queryClient.invalidateQueries({
          queryKey: promotionQueryKeys.selectableSlots,
        }),
      ]);
    },
  });
}

export function useReferralMintPreviewMutation() {
  return useMutation({
    mutationFn: (input: NftReferralSignatureRequest) =>
      apiPrepareReferralMintPreview(input),
  });
}

export function useReferralMintSignatureMutation() {
  return useMutation({
    mutationFn: (input: NftReferralSignatureRequest) =>
      apiIssueReferralMintSignature(input),
  });
}
