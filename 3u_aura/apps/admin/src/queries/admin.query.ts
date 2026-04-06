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
  AdminNotificationArchiveRequest,
  AdminNotificationCreateRequest,
  AdminNotificationListQuery,
  AdminNotificationPublishRequest,
  AdminNotificationUnpublishRequest,
  AdminNotificationUpdateRequest,
  AdminPendingPlacementListQuery,
  AdminRejectReferralNftRequest,
  AdminRewardPublicationRequest,
  AdminSubsidyCenterQuery,
  AdminSubsidyPublicationRequest,
  AdminUserListQuery,
  AdminWeeklySettlementEpochRequest,
  AdminWeeklySettlementQuery,
} from "3u-aura-common";
import {
  apiApproveReferralNft,
  apiArchiveAdminNotification,
  apiCreateAdminNotification,
  apiGetAdminNotifications,
  apiExecuteCheckinRepair,
  apiExecuteClaimSync,
  apiExecuteEpochSync,
  apiExecuteRewardPublication,
  apiExecuteWeeklySettlementDraft,
  apiExecuteWeeklySettlementPublish,
  apiGetAdminOverview,
  apiGetSubsidyOverview,
  apiGetAdminUsers,
  apiGetAuditLogs,
  apiGetCheckinIssues,
  apiGetClaimIssues,
  apiGetNftEligibility,
  apiGetPendingPlacements,
  apiGetWeeklySettlement,
  apiGiftReferralNft,
  apiPublishAdminNotification,
  apiPreviewCheckinRepair,
  apiPreviewClaimSync,
  apiPreviewEpochSync,
  apiPreviewSubsidyPublish,
  apiPreviewRewardPublication,
  apiRejectReferralNft,
  apiUnpublishAdminNotification,
  apiUpdateAdminNotification,
  type AdminGiftReferralNftRequest,
} from "@/api/admin";

export const adminQueryKeys = {
  audit: (query: AdminAuditLogListQuery) => ["admin", "audit", query] as const,
  checkins: (query: AdminCheckinIssueListQuery) =>
    ["admin", "checkins", query] as const,
  claims: (query: AdminClaimIssueListQuery) =>
    ["admin", "claims", query] as const,
  nftEligibility: (query: AdminNftEligibilityListQuery) =>
    ["admin", "nft-eligibility", query] as const,
  notifications: (query: AdminNotificationListQuery) =>
    ["admin", "notifications", query] as const,
  overview: ["admin", "overview"] as const,
  placements: (query: AdminPendingPlacementListQuery) =>
    ["admin", "placements", query] as const,
  subsidyOverview: ["admin", "subsidy", "overview"] as const,
  users: (query: AdminUserListQuery) => ["admin", "users", query] as const,
  weeklySettlement: (query: AdminWeeklySettlementQuery) =>
    ["admin", "settlement", "weekly", query] as const,
};

export function useAdminOverviewQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: apiGetAdminOverview,
    queryKey: adminQueryKeys.overview,
  });
}

export function useWeeklySettlementQuery(
  query: AdminWeeklySettlementQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetWeeklySettlement(query),
    queryKey: adminQueryKeys.weeklySettlement(query),
  });
}

export function useSubsidyOverviewQuery(
  query: AdminSubsidyCenterQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetSubsidyOverview(query),
    queryKey: [...adminQueryKeys.subsidyOverview, query],
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

export function useAdminNotificationsQuery(
  query: AdminNotificationListQuery,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    queryFn: () => apiGetAdminNotifications(query),
    queryKey: adminQueryKeys.notifications(query),
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

export function usePreviewRewardPublicationMutation() {
  return useMutation({
    mutationFn: (body: AdminRewardPublicationRequest) =>
      apiPreviewRewardPublication(body),
    mutationKey: ["admin", "ops", "rewards", "publish", "preview"],
  });
}

export function useExecuteRewardPublicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminRewardPublicationRequest) =>
      apiExecuteRewardPublication(body),
    mutationKey: ["admin", "ops", "rewards", "publish", "execute"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useExecuteWeeklySettlementDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminWeeklySettlementEpochRequest) =>
      apiExecuteWeeklySettlementDraft(body),
    mutationKey: ["admin", "ops", "settlement", "weekly", "draft"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "settlement"] });
    },
  });
}

export function useExecuteWeeklySettlementPublishMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminWeeklySettlementEpochRequest) =>
      apiExecuteWeeklySettlementPublish(body),
    mutationKey: ["admin", "ops", "settlement", "weekly", "publish"],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "settlement"] });
    },
  });
}

export function usePreviewSubsidyPublishMutation() {
  return useMutation({
    mutationFn: (body: AdminSubsidyPublicationRequest) =>
      apiPreviewSubsidyPublish(body),
    mutationKey: ["admin", "ops", "subsidy", "publish", "preview"],
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

export function useGiftReferralNftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminGiftReferralNftRequest) => apiGiftReferralNft(body),
    mutationKey: ["admin", "ops", "nft-eligibility", "gift"],
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: ["admin", "nft-eligibility"] }),
      ]);
    },
  });
}

function invalidateAdminNotificationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
    queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  ]);
}

export function useCreateAdminNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminNotificationCreateRequest) =>
      apiCreateAdminNotification(body),
    mutationKey: ["admin", "notifications", "create"],
    onSuccess: async () => {
      await invalidateAdminNotificationQueries(queryClient);
    },
  });
}

export function useUpdateAdminNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminNotificationUpdateRequest) =>
      apiUpdateAdminNotification(body),
    mutationKey: ["admin", "notifications", "update"],
    onSuccess: async () => {
      await invalidateAdminNotificationQueries(queryClient);
    },
  });
}

export function usePublishAdminNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminNotificationPublishRequest) =>
      apiPublishAdminNotification(body),
    mutationKey: ["admin", "notifications", "publish"],
    onSuccess: async () => {
      await invalidateAdminNotificationQueries(queryClient);
    },
  });
}

export function useUnpublishAdminNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminNotificationUnpublishRequest) =>
      apiUnpublishAdminNotification(body),
    mutationKey: ["admin", "notifications", "unpublish"],
    onSuccess: async () => {
      await invalidateAdminNotificationQueries(queryClient);
    },
  });
}

export function useArchiveAdminNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminNotificationArchiveRequest) =>
      apiArchiveAdminNotification(body),
    mutationKey: ["admin", "notifications", "archive"],
    onSuccess: async () => {
      await invalidateAdminNotificationQueries(queryClient);
    },
  });
}
