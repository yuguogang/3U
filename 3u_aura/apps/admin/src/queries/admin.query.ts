"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminApproveReferralNftRequest,
  AdminAuditLogListQuery,
  AdminCheckinIssueListQuery,
  AdminCheckinRepairRequest,
  AdminClaimIssueListQuery,
  AdminClaimSyncRequest,
  AdminEpochSyncRequest,
  AdminNftEligibilityListQuery,
  AdminPendingPlacementListQuery,
  AdminRejectReferralNftRequest,
  AdminUserListQuery,
} from "3u-aura-common";
import {
  apiApproveReferralNft,
  apiExecuteCheckinRepair,
  apiExecuteClaimSync,
  apiExecuteEpochSync,
  apiGetAdminOverview,
  apiGetAdminUsers,
  apiGetAuditLogs,
  apiGetCheckinIssues,
  apiGetClaimIssues,
  apiGetNftEligibility,
  apiGetPendingPlacements,
  apiPreviewCheckinRepair,
  apiPreviewClaimSync,
  apiPreviewEpochSync,
  apiRejectReferralNft,
} from "@/api/admin";

export const adminQueryKeys = {
  audit: (query: AdminAuditLogListQuery) => ["admin", "audit", query] as const,
  checkins: (query: AdminCheckinIssueListQuery) =>
    ["admin", "checkins", query] as const,
  claims: (query: AdminClaimIssueListQuery) =>
    ["admin", "claims", query] as const,
  nftEligibility: (query: AdminNftEligibilityListQuery) =>
    ["admin", "nft-eligibility", query] as const,
  overview: ["admin", "overview"] as const,
  placements: (query: AdminPendingPlacementListQuery) =>
    ["admin", "placements", query] as const,
  users: (query: AdminUserListQuery) => ["admin", "users", query] as const,
};

export function useAdminOverviewQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: apiGetAdminOverview,
    queryKey: adminQueryKeys.overview,
  });
}

export function useAdminUsersQuery(
  query: AdminUserListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetAdminUsers(query),
    queryKey: adminQueryKeys.users(query),
  });
}

export function usePendingPlacementsQuery(
  query: AdminPendingPlacementListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetPendingPlacements(query),
    queryKey: adminQueryKeys.placements(query),
  });
}

export function useCheckinIssuesQuery(
  query: AdminCheckinIssueListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetCheckinIssues(query),
    queryKey: adminQueryKeys.checkins(query),
  });
}

export function useClaimIssuesQuery(
  query: AdminClaimIssueListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetClaimIssues(query),
    queryKey: adminQueryKeys.claims(query),
  });
}

export function useNftEligibilityQuery(
  query: AdminNftEligibilityListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetNftEligibility(query),
    queryKey: adminQueryKeys.nftEligibility(query),
  });
}

export function useAuditLogsQuery(
  query: AdminAuditLogListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetAuditLogs(query),
    queryKey: adminQueryKeys.audit(query),
  });
}

export function usePreviewCheckinRepairMutation() {
  return useMutation({
    mutationFn: (body: AdminCheckinRepairRequest) => apiPreviewCheckinRepair(body),
    mutationKey: ["admin", "ops", "checkins", "preview"],
  });
}

export function useExecuteCheckinRepairMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminCheckinRepairRequest) => apiExecuteCheckinRepair(body),
    mutationKey: ["admin", "ops", "checkins", "execute"],
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: ["admin", "checkins"] }),
      ]);
    },
  });
}

export function usePreviewClaimSyncMutation() {
  return useMutation({
    mutationFn: (body: AdminClaimSyncRequest) => apiPreviewClaimSync(body),
    mutationKey: ["admin", "ops", "claims", "preview"],
  });
}

export function useExecuteClaimSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminClaimSyncRequest) => apiExecuteClaimSync(body),
    mutationKey: ["admin", "ops", "claims", "execute"],
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: ["admin", "claims"] }),
      ]);
    },
  });
}

export function usePreviewEpochSyncMutation() {
  return useMutation({
    mutationFn: (body: AdminEpochSyncRequest) => apiPreviewEpochSync(body),
    mutationKey: ["admin", "ops", "epochs", "preview"],
  });
}

export function useExecuteEpochSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminEpochSyncRequest) => apiExecuteEpochSync(body),
    mutationKey: ["admin", "ops", "epochs", "execute"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useApproveReferralNftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminApproveReferralNftRequest) =>
      apiApproveReferralNft(body),
    mutationKey: ["admin", "ops", "nft-eligibility", "approve"],
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: ["admin", "nft-eligibility"] }),
      ]);
    },
  });
}

export function useRejectReferralNftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminRejectReferralNftRequest) =>
      apiRejectReferralNft(body),
    mutationKey: ["admin", "ops", "nft-eligibility", "reject"],
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: ["admin", "nft-eligibility"] }),
      ]);
    },
  });
}
