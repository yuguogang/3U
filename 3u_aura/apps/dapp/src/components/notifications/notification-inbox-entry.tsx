"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyNotificationUnreadCountQuery } from "@/queries/notifications.query";
import { useAuthStore } from "@/store/auth.store";

export function NotificationInboxEntry() {
  const pathname = usePathname();
  const t = useTranslations("Common");
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const unreadQuery = useMyNotificationUnreadCountQuery(
    isAuthenticated && hasHydrated,
  );

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  const unreadCount = unreadQuery.data?.unreadCount ?? 0;
  const isActive = pathname.startsWith("/notifications");

  return (
    <Link
      href="/notifications"
      aria-label={t("notifications.entryAria")}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
        isActive
          ? "border-aura-primary/40 bg-aura-primary/12 text-aura-primary"
          : "border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white",
      )}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-aura-primary px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      ) : null}
    </Link>
  );
}
