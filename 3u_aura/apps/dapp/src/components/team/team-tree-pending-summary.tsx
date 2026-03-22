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
          <p className="text-sm text-white/50">{rootLabel}</p>
          <p className="mt-1 text-2xl font-bold text-white">{pendingCount + placedCount + 1}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
          <Users className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{t("team.summary.pending")}</p>
          <p className="mt-1 text-lg font-semibold text-white">{pendingCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{t("team.summary.placed")}</p>
          <p className="mt-1 text-lg font-semibold text-white">{placedCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{t("team.summary.flow")}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold text-white">
            <ArrowRightLeft className="h-4 w-4 text-aura-primary" />
            {t("team.summary.live")}
          </p>
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/55">
        <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
        {t("team.summary.note")}
      </div>
    </GlassCard>
  );
}
