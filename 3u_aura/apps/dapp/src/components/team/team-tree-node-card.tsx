"use client";

import type { ReactNode } from "react";
import { Diamond, TreePine, Wallet, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { cn } from "@/lib/utils";
import { formatAuraAtomic, formatUsdtAtomic } from "@/lib/promotion-format";
import { TeamPosition } from "3u-aura-common";
import {
  formatCompactWallet,
  formatCompactId,
  getAvatarPalette,
  getTreeNodeLabel,
  type TeamTreeNodeLike,
} from "./team-tree-utils";

export interface TeamTreeNodeCardProps {
  node: TeamTreeNodeLike;
  className?: string;
  active?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  compact?: boolean;
  selectedPlacementKey?: string | null;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
}

function createIdenticonCells(seed: string) {
  const hash = seed.split("").reduce((acc, char) => {
    const next = acc * 31 + char.charCodeAt(0);
    return next & 0x7fffffff;
  }, 7);

  const cells: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const bitIndex = row * 3 + col;
      const filled = ((hash >> bitIndex) & 1) === 1;
      if (filled) {
        cells.push({ x: col, y: row });
        if (col !== 2) {
          cells.push({ x: 4 - col, y: row });
        }
      }
    }
  }

  return cells;
}

function NodeAvatar({ seed }: { seed: string }) {
  const palette = getAvatarPalette(seed);
  const cells = createIdenticonCells(seed);

  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${palette.glow}, transparent 60%), linear-gradient(135deg, ${palette.light}, ${palette.dark})`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-90">
        {cells.map((cell, index) => (
          <rect
            key={`${cell.x}-${cell.y}-${index}`}
            x={18 + cell.x * 14}
            y={14 + cell.y * 14}
            width="12"
            height="12"
            rx="3"
            fill="rgba(255,255,255,0.96)"
          />
        ))}
      </svg>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
    </div>
  );
}

function TeamBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "accent";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : tone === "accent"
          ? "border-aura-primary/20 bg-aura-primary/10 text-aura-primary"
          : "border-white/10 bg-white/5 text-white/70";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

export function TeamTreeNodeCard({
  node,
  className,
  active = false,
  highlighted = false,
  selected = false,
  compact = false,
  selectedPlacementKey,
  onSelectOpenSlot,
}: TeamTreeNodeCardProps) {
  const nodeLabel = getTreeNodeLabel(node);
  const walletLabel = formatCompactWallet(node.walletAddress);
  const auraLabel = formatAuraAtomic(node.totalAuraAtomic);
  const leftVolume = formatUsdtAtomic(node.leftTeamVolume);
  const rightVolume = formatUsdtAtomic(node.rightTeamVolume);
  const smallLeg = formatUsdtAtomic(node.smallLegVolume);

  const cardTone = active || selected || highlighted ? "highlight" : "default";

  return (
    <GlassCard
      variant={cardTone}
      className={cn(
        "relative overflow-hidden p-4",
        compact && "p-3",
        className,
      )}
      hoverEffect={false}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,86,54,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(65,132,255,0.08),transparent_35%)]" />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <NodeAvatar seed={node.walletAddress} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{nodeLabel}</p>
              {node.isRoot && <TeamBadge tone="accent">Root</TeamBadge>}
              {node.hasPurchasedNft && <TeamBadge tone="positive">NFT</TeamBadge>}
              {node.hasReferralNft && <TeamBadge tone="warning">Referral NFT</TeamBadge>}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/45">
              <Wallet className="h-3.5 w-3.5" />
              <span className="font-mono">{walletLabel}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TeamBadge tone="neutral">Depth {node.depth}</TeamBadge>
              {node.teamPosition ? (
                <TeamBadge tone="neutral">
                  {node.teamPosition === TeamPosition.LEFT ? "Left" : "Right"}
                </TeamBadge>
              ) : null}
              {node.inviteCode ? <TeamBadge tone="accent">Invite {node.inviteCode}</TeamBadge> : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">AURA</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{auraLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Left</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{leftVolume}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Right</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{rightVolume}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-aura-primary" />
            <span>Small leg {smallLeg}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {node.openChildPositions.length > 0 ? (
              node.openChildPositions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => onSelectOpenSlot?.(node, position)}
                  className={cn(
                    "rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98]",
                    !onSelectOpenSlot && "cursor-default",
                  )}
                >
                  <TeamBadge
                    tone={
                      selectedPlacementKey === `${node.userId}:${position}`
                        ? "warning"
                        : position === TeamPosition.LEFT
                          ? "positive"
                          : "accent"
                    }
                  >
                    {position === TeamPosition.LEFT ? "Open Left" : "Open Right"}
                  </TeamBadge>
                </button>
              ))
            ) : (
              <TeamBadge tone="warning">Fully occupied</TeamBadge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1">
            <TreePine className="h-3.5 w-3.5" />
            {node.parentId ? `Parent ${formatCompactId(node.parentId)}` : "No parent"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Diamond className="h-3.5 w-3.5" />
            {node.rewardLabel?.trim() || `NFT ${node.nftTierLabel ?? "unknown"}`}
          </span>
        </div>

        {active || selected || highlighted ? (
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-aura-primary/35" />
        ) : null}
      </div>
    </GlassCard>
  );
}
