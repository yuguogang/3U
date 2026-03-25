import type {
  AdminApproveReferralNftRequest,
  AdminNotificationArchiveRequest,
  AdminNotificationCreateRequest,
  AdminNotificationItemView,
  AdminNotificationListQuery,
  AdminNotificationPublishRequest,
  AdminNotificationUnpublishRequest,
  AdminNotificationUpdateRequest,
  AdminAuditLogListQuery,
  AdminAuditLogView,
  AdminCheckinIssueListQuery,
  AdminCheckinIssueView,
  AdminCheckinRepairPreviewView,
  AdminCheckinRepairRequest,
  AdminClaimIssueListQuery,
  AdminClaimIssueView,
  AdminClaimSyncPreviewView,
  AdminClaimSyncRequest,
  AdminEpochSyncPreviewView,
  AdminEpochSyncRequest,
  AdminNftEligibilityListItemView,
  AdminNftEligibilityListQuery,
  AdminOperationResultEnvelope,
  AdminOverviewView,
  AdminPendingPlacementItemView,
  AdminPendingPlacementListQuery,
  AdminRejectReferralNftRequest,
  AdminRewardPublicationExecuteView,
  AdminRewardPublicationPreviewView,
  AdminRewardPublicationRequest,
  AdminUserListItemView,
  AdminUserListQuery,
  PaginateData,
} from "3u-aura-common";
import { fetchClient } from "@/lib/fetch.client";

export async function apiGetAdminOverview() {
  return fetchClient<AdminOverviewView>("/api/v1/admin/overview");
}

export async function apiGetAdminUsers(query: AdminUserListQuery) {
  return fetchClient<PaginateData<AdminUserListItemView>>("/api/v1/admin/users", {
    method: "GET",
    query,
  });
}

export async function apiGetPendingPlacements(
  query: AdminPendingPlacementListQuery,
) {
  return fetchClient<PaginateData<AdminPendingPlacementItemView>>(
    "/api/v1/admin/placements/pending",
    {
      method: "GET",
      query,
    },
  );
}

export async function apiGetCheckinIssues(query: AdminCheckinIssueListQuery) {
  return fetchClient<PaginateData<AdminCheckinIssueView>>("/api/v1/admin/checkins", {
    method: "GET",
    query,
  });
}

export async function apiGetClaimIssues(query: AdminClaimIssueListQuery) {
  return fetchClient<PaginateData<AdminClaimIssueView>>("/api/v1/admin/claims", {
    method: "GET",
    query,
  });
}

export async function apiGetNftEligibility(
  query: AdminNftEligibilityListQuery,
) {
  return fetchClient<PaginateData<AdminNftEligibilityListItemView>>(
    "/api/v1/admin/nft-eligibility",
    {
      method: "GET",
      query,
    },
  );
}

export async function apiGetAuditLogs(query: AdminAuditLogListQuery) {
  return fetchClient<PaginateData<AdminAuditLogView>>("/api/v1/admin/audit", {
    method: "GET",
    query,
  });
}

export async function apiGetAdminNotifications(
  query: AdminNotificationListQuery,
) {
  return fetchClient<PaginateData<AdminNotificationItemView>>(
    "/api/v1/admin/notifications",
    {
      method: "GET",
      query,
    },
  );
}

export async function apiCreateAdminNotification(
  body: AdminNotificationCreateRequest,
) {
  return fetchClient<AdminNotificationItemView>("/api/v1/admin/notifications/create", {
    body,
    method: "POST",
  });
}

export async function apiUpdateAdminNotification(
  body: AdminNotificationUpdateRequest,
) {
  return fetchClient<AdminNotificationItemView>("/api/v1/admin/notifications/update", {
    body,
    method: "POST",
  });
}

export async function apiPublishAdminNotification(
  body: AdminNotificationPublishRequest,
) {
  return fetchClient<AdminNotificationItemView>(
    "/api/v1/admin/notifications/publish",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiUnpublishAdminNotification(
  body: AdminNotificationUnpublishRequest,
) {
  return fetchClient<AdminNotificationItemView>(
    "/api/v1/admin/notifications/unpublish",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiArchiveAdminNotification(
  body: AdminNotificationArchiveRequest,
) {
  return fetchClient<AdminNotificationItemView>(
    "/api/v1/admin/notifications/archive",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiPreviewCheckinRepair(
  body: AdminCheckinRepairRequest,
) {
  return fetchClient<AdminOperationResultEnvelope<AdminCheckinRepairPreviewView>>(
    "/api/v1/admin/ops/checkins/repair/preview",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiExecuteCheckinRepair(
  body: AdminCheckinRepairRequest,
) {
  return fetchClient<AdminOperationResultEnvelope<Record<string, unknown>>>(
    "/api/v1/admin/ops/checkins/repair",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiPreviewClaimSync(body: AdminClaimSyncRequest) {
  return fetchClient<AdminOperationResultEnvelope<AdminClaimSyncPreviewView>>(
    "/api/v1/admin/ops/claims/sync/preview",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiExecuteClaimSync(body: AdminClaimSyncRequest) {
  return fetchClient<AdminOperationResultEnvelope<Record<string, unknown>>>(
    "/api/v1/admin/ops/claims/sync",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiPreviewEpochSync(body: AdminEpochSyncRequest) {
  return fetchClient<AdminOperationResultEnvelope<AdminEpochSyncPreviewView>>(
    "/api/v1/admin/ops/epochs/sync/preview",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiExecuteEpochSync(body: AdminEpochSyncRequest) {
  return fetchClient<AdminOperationResultEnvelope<Record<string, unknown>>>(
    "/api/v1/admin/ops/epochs/sync",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiPreviewRewardPublication(
  body: AdminRewardPublicationRequest,
) {
  return fetchClient<
    AdminOperationResultEnvelope<AdminRewardPublicationPreviewView>
  >("/api/v1/admin/ops/rewards/publish/preview", {
    body,
    method: "POST",
  });
}

export async function apiExecuteRewardPublication(
  body: AdminRewardPublicationRequest,
) {
  return fetchClient<
    AdminOperationResultEnvelope<AdminRewardPublicationExecuteView>
  >("/api/v1/admin/ops/rewards/publish", {
    body,
    method: "POST",
  });
}

export async function apiApproveReferralNft(
  body: AdminApproveReferralNftRequest,
) {
  return fetchClient<AdminOperationResultEnvelope<Record<string, unknown>>>(
    "/api/v1/admin/ops/nft-eligibility/approve",
    {
      body,
      method: "POST",
    },
  );
}

export async function apiRejectReferralNft(
  body: AdminRejectReferralNftRequest,
) {
  return fetchClient<AdminOperationResultEnvelope<Record<string, unknown>>>(
    "/api/v1/admin/ops/nft-eligibility/reject",
    {
      body,
      method: "POST",
    },
  );
}
