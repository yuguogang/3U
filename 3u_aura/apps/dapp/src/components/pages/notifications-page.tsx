"use client";

import { useMemo, useState } from "react";
import { Bell, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { useMarkMyNotificationsReadMutation, useMyNotificationsInfiniteQuery } from "@/queries/notifications.query";
import { useAuthStore } from "@/store/auth.store";

export function NotificationsPage() {
  const t = useTranslations("Common");
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const notificationsQuery = useMyNotificationsInfiniteQuery(
    isAuthenticated && hasHydrated,
  );
  const markReadMutation = useMarkMyNotificationsReadMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const notifications = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [notificationsQuery.data],
  );
  const unreadIds = useMemo(
    () => notifications.filter((item) => !item.isRead).map((item) => item.id),
    [notifications],
  );

  async function markRead(notificationIds: string[]) {
    if (!notificationIds.length) return;
    await markReadMutation.mutateAsync({ notificationIds });
  }

  async function handleToggle(notificationId: string) {
    const nextId = expandedId === notificationId ? null : notificationId;
    setExpandedId(nextId);

    if (!nextId) return;
    const notification = notifications.find((item) => item.id === notificationId);
    if (notification && !notification.isRead && !markReadMutation.isPending) {
      await markRead([notificationId]);
    }
  }

  return (
    <MobileLayout
      eyebrow={t("notifications.eyebrow")}
      title={t("notifications.title")}
      description={t("notifications.description")}
      actions={
        unreadIds.length > 0 ? (
          <Button
            type="button"
            size="sm"
            disabled={markReadMutation.isPending}
            onClick={() => markRead(unreadIds)}
            className="bg-aura-primary hover:bg-aura-primary-dark"
          >
            {markReadMutation.isPending
              ? t("notifications.markingRead")
              : t("notifications.markAllVisible")}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {!hasHydrated || !isAuthenticated ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                {t("notifications.authRequiredTitle")}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-100/60">
              {t("notifications.authRequiredBody")}
            </p>
          </GlassCard>
        ) : null}

        {hasHydrated && isAuthenticated && notificationsQuery.isLoading ? (
          <GlassCard className="p-6 text-sm text-white/55">
            {t("notifications.loading")}
          </GlassCard>
        ) : null}

        {hasHydrated &&
        isAuthenticated &&
        notificationsQuery.isError ? (
          <GlassCard className="border border-red-400/20 bg-red-400/5 p-5">
            <p className="text-sm font-medium text-red-200">
              {t("notifications.loadErrorTitle")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-red-100/60">
              {notificationsQuery.error instanceof Error
                ? notificationsQuery.error.message
                : t("notifications.loadErrorBody")}
            </p>
          </GlassCard>
        ) : null}

        {hasHydrated &&
        isAuthenticated &&
        !notificationsQuery.isLoading &&
        !notificationsQuery.isError &&
        notifications.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-white/35">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-white/75">
              {t("notifications.emptyTitle")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              {t("notifications.emptyBody")}
            </p>
          </GlassCard>
        ) : null}

        {notifications.map((notification) => (
          <NotificationListItem
            key={notification.id}
            isExpanded={expandedId === notification.id}
            isMarkingRead={markReadMutation.isPending}
            notification={notification}
            onMarkRead={(notificationId) => void markRead([notificationId])}
            onToggle={(notificationId) => void handleToggle(notificationId)}
          />
        ))}

        {notificationsQuery.hasNextPage ? (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={notificationsQuery.isFetchingNextPage}
              onClick={() => void notificationsQuery.fetchNextPage()}
              className="w-full border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
            >
              {notificationsQuery.isFetchingNextPage
                ? t("notifications.loadingMore")
                : t("notifications.loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}
