"use client";

import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ChevronDown,
  Crosshair,
  Crown,
  GripVertical,
  Link2,
  LockKeyhole,
  Minimize2,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAuraAtomic, formatUsdtAtomic } from "@/lib/promotion-format";
import { TeamPosition } from "3u-aura-common";
import {
  formatCompactId,
  formatCompactWallet,
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
  branchExpanded?: boolean;
  detailsExpanded?: boolean;
  selectedPlacementKey?: string | null;
  selectedPendingUserId?: string | null;
  hasChildren?: boolean;
  relationTone?: NodeRelationTone;
  canFocus?: boolean;
  onToggleDetails?: () => void;
  onToggleBranch?: () => void;
  onFocusNode?: (node: TeamTreeNodeLike) => void;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
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

function getNodeVisualTone({
  relationTone,
  isRoot,
}: {
  relationTone: NodeRelationTone;
  isRoot: boolean;
}) {
  if (isRoot) {
    return {
      bg: "from-aura-primary/30 via-[#4b1918] to-[#1c0c0d]",
      border: "border-aura-primary/30",
      ring: "ring-aura-primary/35",
      text: "text-aura-primary",
    };
  }

  if (relationTone === "direct") {
    return {
      bg: "from-emerald-500/18 via-[#24321f] to-[#11130f]",
      border: "border-emerald-400/25",
      ring: "ring-emerald-400/30",
      text: "text-emerald-300",
    };
  }

  if (relationTone === "self") {
    return {
      bg: "from-sky-500/18 via-[#1d2934] to-[#111317]",
      border: "border-sky-400/25",
      ring: "ring-sky-400/30",
      text: "text-sky-200",
    };
  }

  return {
    bg: "from-white/10 via-[#242021] to-[#121012]",
    border: "border-white/10",
    ring: "ring-white/15",
    text: "text-white/80",
  };
}

function NodeGlyph({
  hasChildren,
  isRoot,
}: {
  hasChildren: boolean;
  isRoot: boolean;
}) {
  if (isRoot) {
    return <Crown className="h-5 w-5" />;
  }

  if (hasChildren) {
    return <Users className="h-5 w-5" />;
  }

  return <UserRound className="h-5 w-5" />;
}

function SlotButton({
  node,
  position,
  selectedPlacementKey,
  selectedPendingUserId,
  compact = false,
  onSelectOpenSlot,
  onDropPendingOnSlot,
}: {
  node: TeamTreeNodeLike;
  position: TeamPosition;
  selectedPlacementKey?: string | null;
  selectedPendingUserId?: string | null;
  compact?: boolean;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
}) {
  const isSelected = selectedPlacementKey === `${node.userId}:${position}`;
  const isPlacementActive = Boolean(selectedPendingUserId);
  const sizeClass = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      aria-label={position === TeamPosition.LEFT ? "Place left" : "Place right"}
      onClick={() => onSelectOpenSlot?.(node, position)}
      onDragOver={(event) => {
        if (!onDropPendingOnSlot) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (!onDropPendingOnSlot) return;
        event.preventDefault();
        const pendingUserId = event.dataTransfer.getData("text/pending-user-id");
        if (pendingUserId) {
          onDropPendingOnSlot(node, position, pendingUserId);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-all duration-200 active:scale-[0.97]",
        sizeClass,
        isSelected
          ? "border-amber-300/55 bg-amber-400/15 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_18px_rgba(251,191,36,0.22)]"
          : position === TeamPosition.LEFT
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            : "border-sky-400/25 bg-sky-400/10 text-sky-200",
        isPlacementActive && !isSelected && "animate-pulse shadow-[0_0_18px_rgba(255,86,54,0.18)]",
      )}
    >
      {position === TeamPosition.LEFT ? (
        <ArrowDownLeft className={cn(compact ? "h-4 w-4" : "h-4.5 w-4.5")} />
      ) : (
        <ArrowDownRight className={cn(compact ? "h-4 w-4" : "h-4.5 w-4.5")} />
      )}
    </button>
  );
}

function CollapsedNode({
  node,
  active,
  selected,
  branchExpanded,
  selectedPlacementKey,
  selectedPendingUserId,
  hasChildren,
  relationTone,
  onToggleDetails,
  onToggleBranch,
  onSelectOpenSlot,
  onDropPendingOnSlot,
}: Omit<
  TeamTreeNodeCardProps,
  "className" | "compact" | "detailsExpanded"
>) {
  const tone = getNodeVisualTone({ relationTone: relationTone ?? "descendant", isRoot: node.isRoot });

  return (
    <div className="flex w-[10rem] flex-col items-center gap-2 px-2">
      <div className="relative">
        <button
          type="button"
          onClick={onToggleDetails}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full border bg-gradient-to-br shadow-[0_16px_34px_rgba(0,0,0,0.28)] ring-1 ring-inset transition-all duration-200 active:scale-[0.97]",
            tone.bg,
            tone.border,
            tone.ring,
            active && "shadow-[0_0_0_1px_rgba(255,86,54,0.18),0_0_18px_rgba(255,86,54,0.22)]",
            selected && "ring-2 ring-aura-primary/45",
          )}
          aria-label={`Open details for ${getTreeNodeLabel(node)}`}
        >
          <div className={cn("relative z-10", tone.text)}>
            <NodeGlyph
              hasChildren={hasChildren ?? false}
              isRoot={node.isRoot}
            />
          </div>
          {node.inviterId && relationTone === "direct" ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-emerald-200">
              <Link2 className="h-3 w-3" />
            </span>
          ) : null}
        </button>

        {hasChildren ? (
          <button
            type="button"
            onClick={onToggleBranch}
            className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#171214] text-white/65 transition hover:bg-white/[0.08]"
            aria-label={branchExpanded ? "Collapse subtree" : "Expand subtree"}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", branchExpanded ? "rotate-0" : "-rotate-90")} />
          </button>
        ) : null}
      </div>

      <div className="max-w-[9rem] text-center">
        <p className="truncate text-xs font-semibold text-white">{getTreeNodeLabel(node)}</p>
        <p className="mt-0.5 truncate text-[10px] text-white/45">{formatCompactWallet(node.walletAddress)}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {node.openChildPositions.length > 0 ? (
          node.openChildPositions.map((position) => (
            <SlotButton
              key={position}
              node={node}
              position={position}
              compact
              selectedPlacementKey={selectedPlacementKey}
              selectedPendingUserId={selectedPendingUserId}
              onSelectOpenSlot={onSelectOpenSlot}
              onDropPendingOnSlot={onDropPendingOnSlot}
            />
          ))
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/35">
            <LockKeyhole className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

function ExpandedNode({
  node,
  active,
  selected,
  compact,
  branchExpanded,
  selectedPlacementKey,
  selectedPendingUserId,
  hasChildren,
  relationTone,
  canFocus,
  onToggleDetails,
  onToggleBranch,
  onFocusNode,
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
        "relative w-[18rem] min-w-[18rem] overflow-hidden rounded-[26px] border bg-[linear-gradient(180deg,rgba(38,18,18,0.92),rgba(20,10,10,0.92))] p-3.5 shadow-[0_22px_60px_rgba(0,0,0,0.28)]",
        selected ? "border-aura-primary/35 ring-1 ring-inset ring-aura-primary/30" : "border-white/10",
        active && "shadow-[0_0_0_1px_rgba(255,86,54,0.18),0_18px_50px_rgba(255,86,54,0.12)]",
        compact && "p-3",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,86,54,0.08),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(65,132,255,0.08),transparent_34%)]" />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <CollapsedNode
            node={node}
            active={active}
            selected={selected}
            branchExpanded={branchExpanded}
            selectedPlacementKey={selectedPlacementKey}
            selectedPendingUserId={selectedPendingUserId}
            hasChildren={hasChildren}
            relationTone={relationTone}
            onToggleDetails={onToggleDetails}
            onToggleBranch={onToggleBranch}
            onSelectOpenSlot={onSelectOpenSlot}
            onDropPendingOnSlot={onDropPendingOnSlot}
          />
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
                    ) : hasChildren ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <UserRound className="h-3 w-3" />
                    )}
                    {getRelationToneLabel(relationTone ?? "descendant")}
                  </TreeChip>
                </div>
                <p className="mt-1 text-xs text-white/45">{walletLabel}</p>
              </div>

              <button
                type="button"
                onClick={onToggleDetails}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/[0.08]"
                aria-label="Collapse node details"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <TreeChip>Depth {node.depth}</TreeChip>
              {node.teamPosition ? (
                <TreeChip>{node.teamPosition === TeamPosition.LEFT ? "Left" : "Right"}</TreeChip>
              ) : null}
              {node.inviteCode ? <TreeChip tone="accent">Invite {node.inviteCode}</TreeChip> : null}
              {canFocus ? (
                <button
                  type="button"
                  onClick={() => onFocusNode?.(node)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/[0.08]"
                >
                  <Crosshair className="h-3 w-3" />
                  Focus
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
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

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
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

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/40">
          <span>{node.parentId ? `Parent ${formatCompactId(node.parentId)}` : "No parent"}</span>
          <span>{node.rewardLabel?.trim() || `NFT ${node.nftTierLabel ?? "unknown"}`}</span>
        </div>
      </div>
    </div>
  );
}

export function TeamTreeNodeCard({
  node,
  className,
  active = false,
  selected = false,
  compact = false,
  branchExpanded = false,
  detailsExpanded = false,
  selectedPlacementKey,
  selectedPendingUserId,
  hasChildren = false,
  relationTone = "descendant",
  canFocus = false,
  onToggleDetails,
  onToggleBranch,
  onFocusNode,
  onSelectOpenSlot,
  onDropPendingOnSlot,
}: TeamTreeNodeCardProps) {
  if (detailsExpanded) {
    return (
      <ExpandedNode
        node={node}
        className={className}
        active={active}
        selected={selected}
        compact={compact}
        branchExpanded={branchExpanded}
        detailsExpanded={detailsExpanded}
        selectedPlacementKey={selectedPlacementKey}
        selectedPendingUserId={selectedPendingUserId}
        hasChildren={hasChildren}
        relationTone={relationTone}
        canFocus={canFocus}
        onToggleDetails={onToggleDetails}
        onToggleBranch={onToggleBranch}
        onFocusNode={onFocusNode}
        onSelectOpenSlot={onSelectOpenSlot}
        onDropPendingOnSlot={onDropPendingOnSlot}
      />
    );
  }

  return (
    <div className={className}>
      <CollapsedNode
        node={node}
        active={active}
        selected={selected}
        branchExpanded={branchExpanded}
        selectedPlacementKey={selectedPlacementKey}
        selectedPendingUserId={selectedPendingUserId}
        hasChildren={hasChildren}
        relationTone={relationTone}
        canFocus={canFocus}
        onToggleDetails={onToggleDetails}
        onToggleBranch={onToggleBranch}
        onFocusNode={onFocusNode}
        onSelectOpenSlot={onSelectOpenSlot}
        onDropPendingOnSlot={onDropPendingOnSlot}
      />
    </div>
  );
}
