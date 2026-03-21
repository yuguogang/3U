"use client";

import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ChevronDown,
  Crown,
  GripVertical,
  Info,
  Link2,
  LockKeyhole,
  Sparkles,
  Trees,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAuraAtomic, formatUsdtAtomic } from "@/lib/promotion-format";
import { TeamPosition } from "3u-aura-common";
import {
  formatCompactWallet,
  getAvatarPalette,
  getTreeNodeLabel,
  type TeamTreeNodeLike,
} from "./team-tree-utils";

type NodeRelationTone = "self" | "direct" | "descendant";

export interface TeamTreeNodeCardProps {
  node: TeamTreeNodeLike;
  className?: string;
  active?: boolean;
  selected?: boolean;
  compact?: boolean;
  selectedPlacementKey?: string | null;
  selectedPendingUserId?: string | null;
  hasChildren?: boolean;
  expanded?: boolean;
  relationTone?: NodeRelationTone;
  onOpenDetails?: (node: TeamTreeNodeLike) => void;
  onToggleExpand?: () => void;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
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

function NodeAvatar({
  seed,
  relationTone,
  isRoot,
}: {
  seed: string;
  relationTone: NodeRelationTone;
  isRoot: boolean;
}) {
  const palette = getAvatarPalette(seed);
  const cells = createIdenticonCells(seed);
  const ringClass = isRoot
    ? "ring-aura-primary/40"
    : relationTone === "direct"
      ? "ring-emerald-400/35"
      : relationTone === "self"
        ? "ring-sky-400/35"
        : "ring-white/15";

  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 ring-1 ring-inset",
        ringClass,
      )}
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
    </div>
  );
}

function TreeChip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "accent" | "info";
  className?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : tone === "accent"
          ? "border-aura-primary/20 bg-aura-primary/10 text-aura-primary"
          : tone === "info"
            ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
            : "border-white/10 bg-white/5 text-white/70";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

function getRelationToneLabel(relationTone: NodeRelationTone) {
  if (relationTone === "self") return "You";
  if (relationTone === "direct") return "Direct";
  return "Subtree";
}

function SlotButton({
  node,
  position,
  selectedPlacementKey,
  selectedPendingUserId,
  onSelectOpenSlot,
  onDropPendingOnSlot,
}: {
  node: TeamTreeNodeLike;
  position: TeamPosition;
  selectedPlacementKey?: string | null;
  selectedPendingUserId?: string | null;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
}) {
  const isSelected = selectedPlacementKey === `${node.userId}:${position}`;
  const isPlacementActive = Boolean(selectedPendingUserId);
  const label = position === TeamPosition.LEFT ? "Place left" : "Place right";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onSelectOpenSlot?.(node, position)}
      onDragOver={(event) => {
        if (!onDropPendingOnSlot) {
          return;
        }
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (!onDropPendingOnSlot) {
          return;
        }

        event.preventDefault();
        const pendingUserId = event.dataTransfer.getData("text/pending-user-id");
        if (pendingUserId) {
          onDropPendingOnSlot(node, position, pendingUserId);
        }
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-[0.97]",
        isSelected
          ? "border-amber-300/50 bg-amber-400/15 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_18px_rgba(251,191,36,0.22)]"
          : position === TeamPosition.LEFT
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            : "border-sky-400/25 bg-sky-400/10 text-sky-200",
        isPlacementActive && !isSelected && "animate-pulse shadow-[0_0_18px_rgba(255,86,54,0.18)]",
      )}
    >
      {position === TeamPosition.LEFT ? (
        <ArrowDownLeft className="h-4.5 w-4.5" />
      ) : (
        <ArrowDownRight className="h-4.5 w-4.5" />
      )}
    </button>
  );
}

export function TeamTreeNodeCard({
  node,
  className,
  active = false,
  selected = false,
  compact = false,
  selectedPlacementKey,
  selectedPendingUserId,
  hasChildren = false,
  expanded = false,
  relationTone = "descendant",
  onOpenDetails,
  onToggleExpand,
  onSelectOpenSlot,
  onDropPendingOnSlot,
}: TeamTreeNodeCardProps) {
  const nodeLabel = getTreeNodeLabel(node);
  const walletLabel = formatCompactWallet(node.walletAddress);
  const auraLabel = formatAuraAtomic(node.totalAuraAtomic);
  const leftVolume = formatUsdtAtomic(node.leftTeamVolume);
  const rightVolume = formatUsdtAtomic(node.rightTeamVolume);
  const smallLeg = formatUsdtAtomic(node.smallLegVolume);
  const relationToneChip =
    relationTone === "direct" ? "positive" : relationTone === "self" ? "info" : "neutral";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] border bg-[linear-gradient(180deg,rgba(38,18,18,0.92),rgba(20,10,10,0.92))] p-3.5 shadow-[0_22px_60px_rgba(0,0,0,0.28)]",
        selected ? "border-aura-primary/35 ring-1 ring-inset ring-aura-primary/30" : "border-white/10",
        active && "shadow-[0_0_0_1px_rgba(255,86,54,0.18),0_18px_50px_rgba(255,86,54,0.12)]",
        compact && "p-3",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,86,54,0.08),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(65,132,255,0.08),transparent_34%)]" />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <NodeAvatar seed={node.walletAddress} relationTone={relationTone} isRoot={node.isRoot} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-base font-semibold text-white">{nodeLabel}</p>
                  {node.isRoot ? (
                    <TreeChip tone="accent">
                      <Crown className="h-3 w-3" />
                      Root
                    </TreeChip>
                  ) : null}
                  <TreeChip tone={relationToneChip}>
                    {relationTone === "direct" ? (
                      <Link2 className="h-3 w-3" />
                    ) : relationTone === "self" ? (
                      <Trees className="h-3 w-3" />
                    ) : hasChildren ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <UserRound className="h-3 w-3" />
                    )}
                    {getRelationToneLabel(relationTone)}
                  </TreeChip>
                </div>
                <p className="mt-1 text-xs text-white/45">{walletLabel}</p>
              </div>

              <div className="flex items-center gap-1">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={onToggleExpand}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/[0.08]"
                    aria-label={expanded ? "Collapse subtree" : "Expand subtree"}
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expanded ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenDetails?.(node)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/[0.08]"
                  aria-label="Open node details"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <TreeChip>Depth {node.depth}</TreeChip>
              {node.teamPosition ? (
                <TreeChip>{node.teamPosition === TeamPosition.LEFT ? "Left" : "Right"}</TreeChip>
              ) : null}
              {node.inviteCode ? <TreeChip tone="accent">Invite {node.inviteCode}</TreeChip> : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Aura</p>
            <p className="mt-1 text-sm font-semibold text-white">{auraLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Left</p>
            <p className="mt-1 text-sm font-semibold text-white">{leftVolume}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Right</p>
            <p className="mt-1 text-sm font-semibold text-white">{rightVolume}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Children</p>
            <p className="mt-1 text-sm font-semibold text-white">{node.childCount ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="inline-flex items-center gap-2 text-xs text-white/55">
            <Sparkles className="h-3.5 w-3.5 text-aura-primary" />
            <span>Small leg {smallLeg}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedPendingUserId ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-aura-primary/20 bg-aura-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-aura-primary">
                <GripVertical className="h-3 w-3" />
                Drop target
              </span>
            ) : null}
            {node.openChildPositions.length > 0 ? (
              node.openChildPositions.map((position) => (
                <SlotButton
                  key={position}
                  node={node}
                  position={position}
                  selectedPlacementKey={selectedPlacementKey}
                  selectedPendingUserId={selectedPendingUserId}
                  onSelectOpenSlot={onSelectOpenSlot}
                  onDropPendingOnSlot={onDropPendingOnSlot}
                />
              ))
            ) : (
              <TreeChip tone="warning">
                <LockKeyhole className="h-3 w-3" />
                Occupied
              </TreeChip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
