import { fetchClient } from "@/lib/fetch.client";
import type {
  DappNotificationItemView,
  DappNotificationListQuery,
  DappNotificationMarkReadRequest,
  DappNotificationMarkReadResult,
  DappNotificationUnreadCountView,
  PaginateData,
} from "3u-aura-common";

export async function apiGetMyNotifications(query: DappNotificationListQuery = {}) {
  return fetchClient<PaginateData<DappNotificationItemView>>(
    "/api/v1/notifications",
    {
      method: "GET",
      query,
    },
  );
}

export async function apiGetMyNotificationUnreadCount() {
  return fetchClient<DappNotificationUnreadCountView>(
    "/api/v1/notifications/unread-count",
    {
      method: "GET",
    },
  );
}

export async function apiMarkMyNotificationsRead(
  body: DappNotificationMarkReadRequest,
) {
  return fetchClient<DappNotificationMarkReadResult>("/api/v1/notifications/read", {
    body,
    method: "POST",
  });
}
