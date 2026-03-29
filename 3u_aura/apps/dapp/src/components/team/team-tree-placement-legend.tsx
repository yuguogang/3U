"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Crown, GitBranch, GripVertical, Link2, Sparkles, Trees, UserRound, Users } from "lucide-react";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { cn } from "@/lib/utils";

function LegendPill({
  icon,
  label,
  className,
}: {
  icon: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--shell-border)] bg-[var(--shell-inset)] px-2.5 py-1 text-[11px] text-[var(--shell-text-muted)]",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export function TeamTreePlacementLegend({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Common");
  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--shell-title)]">{t("team.legend.title")}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--shell-text-soft)]">
            {t("team.legend.description")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LegendPill icon={<Crown className="h-3.5 w-3.5" />} label={t("team.legend.root")} />
            <LegendPill icon={<Link2 className="h-3.5 w-3.5" />} label={t("team.legend.direct")} />
            <LegendPill icon={<Users className="h-3.5 w-3.5" />} label={t("team.legend.hasTeam")} />
            <LegendPill icon={<Trees className="h-3.5 w-3.5" />} label={t("team.legend.subtree")} />
            <LegendPill icon={<UserRound className="h-3.5 w-3.5" />} label={t("team.legend.leaf")} />
            <LegendPill icon={<GripVertical className="h-3.5 w-3.5" />} label={t("team.legend.dragPending")} />
            <LegendPill icon={<Sparkles className="h-3.5 w-3.5" />} label={t("team.legend.selected")} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
