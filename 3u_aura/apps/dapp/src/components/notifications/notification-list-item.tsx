"use client";

import { useMemo } from "react";
import { BellRing, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { DappNotificationItemView } from "3u-aura-common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";
import {
  formatNotificationDate,
  notificationCategoryTranslationKey,
  resolveNotificationContent,
} from "@/components/notifications/notification-utils";
import { cn } from "@/lib/utils";

type NotificationListItemProps = {
  isExpanded: boolean;
  isMarkingRead: boolean;
  notification: DappNotificationItemView;
  onMarkRead: (notificationId: string) => void;
  onToggle: (notificationId: string) => void;
};

export function NotificationListItem({
  isExpanded,
  isMarkingRead,
  notification,
  onMarkRead,
  onToggle,
}: NotificationListItemProps) {
  const locale = useLocale();
  const t = useTranslations("Common");
  const content = useMemo(
    () => resolveNotificationContent(notification, locale),
    [locale, notification],
  );

  const publishedAt = formatNotificationDate(notification.publishedAt);
  const readAt = formatNotificationDate(notification.readAt);
  const statusLabel = notification.isRead
    ? t("notifications.read")
    : t("notifications.unread");

  return (
    <GlassCard
      className={cn(
        "p-4 transition-colors",
        notification.isRead
          ? "border-white/[0.06] bg-white/[0.03]"
          : "border-aura-primary/20 bg-aura-primary/[0.07]",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(notification.id)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge
              variant={notification.isRead ? "outline" : "secondary"}
              className={cn(
                "border-0 px-2.5",
                notification.isRead
                  ? "bg-white/[0.07] text-white/60"
                  : "bg-aura-primary/15 text-aura-primary",
              )}
            >
              {statusLabel}
            </Badge>
            <Badge
              variant="outline"
              className="border-white/[0.08] bg-white/[0.03] px-2.5 text-white/55"
            >
              {t(notificationCategoryTranslationKey(notification.category))}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-aura-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-white">
                {content?.title ?? t("notifications.missingContentTitle")}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">
                {content?.body ?? t("notifications.missingContentBody")}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                {publishedAt ? (
                  <span>
                    {t("notifications.publishedAt")}: {publishedAt}
                  </span>
                ) : null}
                {notification.isRead && readAt ? (
                  <span>
                    {t("notifications.readAt")}: {readAt}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-white/40">
          {!notification.isRead ? (
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-aura-primary" />
          ) : null}
          {isExpanded ? (
            <ChevronUp className="mt-0.5 h-4 w-4" />
          ) : (
            <ChevronDown className="mt-0.5 h-4 w-4" />
          )}
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-white/72">
            {content?.body ?? t("notifications.missingContentBody")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {!notification.isRead ? (
              <Button
                type="button"
                size="sm"
                disabled={isMarkingRead}
                onClick={() => onMarkRead(notification.id)}
                className="bg-aura-primary hover:bg-aura-primary-dark"
              >
                {isMarkingRead
                  ? t("notifications.markingRead")
                  : t("notifications.markRead")}
              </Button>
            ) : null}

            {content?.ctaHref && content?.ctaLabel ? (
              <a
                href={content.ctaHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-aura-primary hover:text-aura-primary-light"
              >
                {content.ctaLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
