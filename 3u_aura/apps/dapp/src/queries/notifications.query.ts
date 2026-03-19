"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  DappNotificationListQuery,
  DappNotificationMarkReadRequest,
} from "3u-aura-common";
import {
  apiGetMyNotifications,
  apiGetMyNotificationUnreadCount,
  apiMarkMyNotificationsRead,
} from "@/api/notifications";

const DEFAULT_TAKE = 20;

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: (take: number) => ["notifications", "list", take] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useMyNotificationsInfiniteQuery(enabled: boolean = true) {
  return useInfiniteQuery({
    enabled,
    initialPageParam: { skip: 0, take: DEFAULT_TAKE } satisfies DappNotificationListQuery,
    queryFn: ({ pageParam }) => apiGetMyNotifications(pageParam),
    queryKey: notificationQueryKeys.list(DEFAULT_TAKE),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
}

export function useMyNotificationUnreadCountQuery(enabled: boolean = true) {
  return useQuery({
    enabled,
    queryFn: apiGetMyNotificationUnreadCount,
    queryKey: notificationQueryKeys.unreadCount,
  });
}

export function useMarkMyNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: DappNotificationMarkReadRequest) =>
      apiMarkMyNotificationsRead(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
      ]);
    },
  });
}
