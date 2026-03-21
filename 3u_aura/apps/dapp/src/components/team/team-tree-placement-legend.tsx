"use client";

import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowDownRight, Crown, GitBranch, GripVertical, Link2, LockKeyhole, Sparkles, Trees, UserRound, Users } from "lucide-react";
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
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70",
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
  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Placement Legend</p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            The tree stays binary. Direct referrals and deeper subtree members use different visual cues, and pending members can be dragged or tapped into any open subtree slot.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LegendPill icon={<Crown className="h-3.5 w-3.5" />} label="Root" />
            <LegendPill icon={<Link2 className="h-3.5 w-3.5" />} label="Direct" />
            <LegendPill icon={<Users className="h-3.5 w-3.5" />} label="Has team" />
            <LegendPill icon={<Trees className="h-3.5 w-3.5" />} label="Subtree" />
            <LegendPill icon={<UserRound className="h-3.5 w-3.5" />} label="Leaf node" />
            <LegendPill icon={<ArrowDownLeft className="h-3.5 w-3.5" />} label="Place left" />
            <LegendPill icon={<ArrowDownRight className="h-3.5 w-3.5" />} label="Place right" />
            <LegendPill icon={<GripVertical className="h-3.5 w-3.5" />} label="Drag pending" />
            <LegendPill icon={<LockKeyhole className="h-3.5 w-3.5" />} label="Occupied" />
            <LegendPill icon={<Sparkles className="h-3.5 w-3.5" />} label="Selected" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
