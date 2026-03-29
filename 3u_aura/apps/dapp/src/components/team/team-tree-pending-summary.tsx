"use client";

import { useTranslations } from "next-intl";
import { Users, BadgeCheck, ArrowRightLeft } from "lucide-react";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { cn } from "@/lib/utils";

export function TeamTreePendingSummary({
  pendingCount,
  placedCount = 0,
  rootLabel = "Team",
  className,
}: {
  pendingCount: number;
  placedCount?: number;
  rootLabel?: string;
  className?: string;
}) {
  const t = useTranslations("Common");
  return (
    <GlassCard variant="highlight" className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[var(--shell-text-soft)]">{rootLabel}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--shell-title)]">{pendingCount + placedCount + 1}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
          <Users className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--shell-border)] pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--shell-text-soft)]">{t("team.summary.pending")}</p>
          <p className="mt-1 text-lg font-semibold text-[var(--shell-title)]">{pendingCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--shell-text-soft)]">{t("team.summary.placed")}</p>
          <p className="mt-1 text-lg font-semibold text-[var(--shell-title)]">{placedCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--shell-text-soft)]">{t("team.summary.flow")}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold text-[var(--shell-title)]">
            <ArrowRightLeft className="h-4 w-4 text-aura-primary" />
            {t("team.summary.live")}
          </p>
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-inset)] px-3 py-1.5 text-xs text-[var(--shell-text-muted)]">
        <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
        {t("team.summary.note")}
      </div>
    </GlassCard>
  );
}
