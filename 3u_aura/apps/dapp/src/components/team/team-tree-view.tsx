"use client";

import { type HTMLAttributes, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamPosition, type TeamTreeSnapshotView } from "3u-aura-common";
import { TeamTreeNodeCard } from "./team-tree-node-card";
import {
  buildTreeBranches,
  type TeamTreeNodeBranch,
  type TeamTreeNodeLike,
} from "./team-tree-utils";

export interface TeamTreeViewProps extends HTMLAttributes<HTMLDivElement> {
  snapshot: TeamTreeSnapshotView;
  anchorUserId?: string;
  maxDepth?: number;
  focusedUserId?: string;
  selectedParentId?: string;
  selectedPlacementKey?: string | null;
  selectedPendingUserId?: string | null;
  compact?: boolean;
  onFocusNode?: (node: TeamTreeNodeLike) => void;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
}

type ExpandedTreeState = Record<string, boolean>;

function SlotPlaceholder({
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
  const t = useTranslations("Common");
  const isSelected = selectedPlacementKey === `${node.userId}:${position}`;
  const isPlacementActive = Boolean(selectedPendingUserId);

  return (
    <button
      type="button"
      aria-label={
        position === TeamPosition.LEFT
          ? t("shared.promotion.tree.placeLeft")
          : t("shared.promotion.tree.placeRight")
      }
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
        "group flex min-h-[88px] min-w-[11rem] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed bg-white/[0.015] px-4 text-center transition-all duration-200",
        isSelected
          ? "border-amber-300/55 bg-amber-400/10 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_18px_rgba(251,191,36,0.16)]"
          : position === TeamPosition.LEFT
            ? "border-emerald-400/18 text-white/34 hover:border-emerald-300/28 hover:bg-emerald-400/[0.05]"
            : "border-sky-400/18 text-white/34 hover:border-sky-300/28 hover:bg-sky-400/[0.05]",
        isPlacementActive && !isSelected && "animate-pulse shadow-[0_0_18px_rgba(255,86,54,0.12)]",
      )}
    >
      <span className="text-sm font-medium tracking-wide">{t("shared.promotion.tree.empty")}</span>
      {isSelected ? (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100">
          <Sparkles className="h-3 w-3" />
          {t("team.legend.selected")}
        </span>
      ) : null}
    </button>
  );
}

function TreeBranch({
  node,
  anchorUserId,
  focusedUserId,
  selectedParentId,
  selectedPlacementKey,
  selectedPendingUserId,
  expandedNodeIds,
  expandedDetailNodeId,
  compact,
  onFocusNode,
  onToggleDetails,
  onToggleExpand,
  onSelectOpenSlot,
  onDropPendingOnSlot,
}: {
  node: TeamTreeNodeBranch;
  anchorUserId?: string;
  focusedUserId?: string;
  selectedParentId?: string;
  selectedPlacementKey?: string | null;
  selectedPendingUserId?: string | null;
  expandedNodeIds: ExpandedTreeState;
  expandedDetailNodeId?: string | null;
  compact?: boolean;
  onFocusNode?: (node: TeamTreeNodeLike) => void;
  onToggleDetails: (node: TeamTreeNodeLike) => void;
  onToggleExpand: (userId: string) => void;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
}) {
  const t = useTranslations("Common");
  const hasChildren = node.children.length > 0;
  const openLeft = node.openChildPositions.includes(TeamPosition.LEFT);
  const openRight = node.openChildPositions.includes(TeamPosition.RIGHT);
  const canExpandBranch = hasChildren || openLeft || openRight;
  const isExpanded = expandedNodeIds[node.userId] ?? false;
  const isFocused = focusedUserId === node.userId;
  const isSelected = selectedParentId === node.userId;
  const detailsExpanded = expandedDetailNodeId === node.userId;
  const leftChild = node.children.find((child) => child.teamPosition === TeamPosition.LEFT);
  const rightChild = node.children.find((child) => child.teamPosition === TeamPosition.RIGHT);
  const extraChildren = node.children.filter(
    (child) =>
      child.teamPosition !== TeamPosition.LEFT && child.teamPosition !== TeamPosition.RIGHT,
  );
  const relationTone =
    node.userId === anchorUserId
      ? "self"
      : node.inviterId === anchorUserId
        ? "direct"
        : "descendant";

  return (
    <div className="relative flex w-fit flex-col items-center">
      <TeamTreeNodeCard
        node={node}
        active={isFocused}
        selected={isSelected}
        compact={compact}
        hasChildren={hasChildren}
        canExpandBranch={canExpandBranch}
        branchExpanded={isExpanded}
        detailsExpanded={detailsExpanded}
        relationTone={relationTone}
        canFocus={!node.isRoot}
        selectedPlacementKey={selectedPlacementKey}
        selectedPendingUserId={selectedPendingUserId}
        onToggleDetails={() => onToggleDetails(node)}
        onToggleBranch={() => onToggleExpand(node.userId)}
        onFocusNode={onFocusNode}
        onSelectOpenSlot={onSelectOpenSlot}
        onDropPendingOnSlot={onDropPendingOnSlot}
      />

      {canExpandBranch ? (
        isExpanded ? (
          <div className="relative mt-4 flex w-fit flex-col items-center pt-8">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-12 w-full overflow-visible text-white/12"
              viewBox="0 0 100 48"
              preserveAspectRatio="none"
            >
              <line x1="50" y1="0" x2="50" y2="14" stroke="currentColor" strokeWidth="1.5" />
              <line x1="20" y1="14" x2="80" y2="14" stroke="currentColor" strokeWidth="1.5" />
              <line x1="20" y1="14" x2="20" y2="48" stroke="currentColor" strokeWidth="1.5" />
              <line x1="80" y1="14" x2="80" y2="48" stroke="currentColor" strokeWidth="1.5" />
            </svg>

            <div className="inline-grid grid-cols-[minmax(11rem,auto)_minmax(11rem,auto)] items-start gap-x-6 gap-y-4 pt-2">
              <div className="min-w-[11rem]">
                {leftChild ? (
                  <TreeBranch
                    node={leftChild}
                    anchorUserId={anchorUserId}
                    focusedUserId={focusedUserId}
                    selectedParentId={selectedParentId}
                    selectedPlacementKey={selectedPlacementKey}
                    selectedPendingUserId={selectedPendingUserId}
                    expandedNodeIds={expandedNodeIds}
                    expandedDetailNodeId={expandedDetailNodeId}
                    compact={compact}
                    onFocusNode={onFocusNode}
                    onToggleDetails={onToggleDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ) : openLeft ? (
                  <SlotPlaceholder
                    node={node}
                    position={TeamPosition.LEFT}
                    selectedPlacementKey={selectedPlacementKey}
                    selectedPendingUserId={selectedPendingUserId}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ) : (
                  <div className="flex min-h-[72px] min-w-[11rem] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015] text-[11px] text-white/28">
                    {t("shared.promotion.tree.empty")}
                  </div>
                )}
              </div>

              <div className="min-w-[11rem]">
                {rightChild ? (
                  <TreeBranch
                    node={rightChild}
                    anchorUserId={anchorUserId}
                    focusedUserId={focusedUserId}
                    selectedParentId={selectedParentId}
                    selectedPlacementKey={selectedPlacementKey}
                    selectedPendingUserId={selectedPendingUserId}
                    expandedNodeIds={expandedNodeIds}
                    expandedDetailNodeId={expandedDetailNodeId}
                    compact={compact}
                    onFocusNode={onFocusNode}
                    onToggleDetails={onToggleDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ) : openRight ? (
                  <SlotPlaceholder
                    node={node}
                    position={TeamPosition.RIGHT}
                    selectedPlacementKey={selectedPlacementKey}
                    selectedPendingUserId={selectedPendingUserId}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ) : (
                  <div className="flex min-h-[72px] min-w-[11rem] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015] text-[11px] text-white/28">
                    {t("shared.promotion.tree.empty")}
                  </div>
                )}
              </div>
            </div>

            {extraChildren.length > 0 ? (
              <div className="mt-4 space-y-3">
                {extraChildren.map((child) => (
                  <TreeBranch
                    key={child.userId}
                    node={child}
                    anchorUserId={anchorUserId}
                    focusedUserId={focusedUserId}
                    selectedParentId={selectedParentId}
                    selectedPlacementKey={selectedPlacementKey}
                    selectedPendingUserId={selectedPendingUserId}
                    expandedNodeIds={expandedNodeIds}
                    expandedDetailNodeId={expandedDetailNodeId}
                    compact={compact}
                    onFocusNode={onFocusNode}
                    onToggleDetails={onToggleDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-white/30">
          <Workflow className="h-3.5 w-3.5" />
          {t("shared.promotion.tree.leafNode")}
        </div>
      )}
    </div>
  );
}

export function TeamTreeView({
  snapshot,
  anchorUserId,
  maxDepth,
  focusedUserId,
  selectedParentId,
  selectedPlacementKey,
  selectedPendingUserId,
  compact = false,
  className,
  onFocusNode,
  onSelectOpenSlot,
  onDropPendingOnSlot,
  ...props
}: TeamTreeViewProps) {
  const t = useTranslations("Common");
  const [expansionOverrides, setExpansionOverrides] = useState<ExpandedTreeState>({});
  const [expandedDetailNodeId, setExpandedDetailNodeId] = useState<string | null>(null);

  const filteredNodes =
    typeof maxDepth === "number"
      ? snapshot.nodes.filter((node) => node.depth <= maxDepth)
      : snapshot.nodes;
  const roots = useMemo(
    () => buildTreeBranches(filteredNodes, snapshot.rootUserId),
    [filteredNodes, snapshot.rootUserId],
  );
  const expandedNodeIds = useMemo(() => {
    const initialState: ExpandedTreeState = {};
    for (const node of filteredNodes) {
      if (node.depth <= 1 || node.userId === selectedParentId || node.userId === anchorUserId) {
        initialState[node.userId] = true;
      }
    }
    return {
      ...initialState,
      ...expansionOverrides,
    };
  }, [anchorUserId, expansionOverrides, filteredNodes, selectedParentId]);

  return (
    <>
      <div
        className={cn("space-y-4 overflow-x-auto pb-2", className)}
        {...props}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            {t("team.tree.hints.inspect")}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            {t("team.tree.hints.focus")}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            {t("team.tree.hints.expand")}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            {t("team.tree.hints.drag")}
          </span>
        </div>

        <div className="flex min-w-max flex-col gap-4">
          {roots.length > 0 ? (
            roots.map((node) => (
              <div key={node.userId} className="rounded-[28px] border border-white/8 bg-white/[0.015] p-3 sm:p-4">
                <TreeBranch
                  node={node}
                  anchorUserId={anchorUserId}
                  focusedUserId={focusedUserId}
                  selectedParentId={selectedParentId}
                  selectedPlacementKey={selectedPlacementKey}
                  selectedPendingUserId={selectedPendingUserId}
                  expandedNodeIds={expandedNodeIds}
                  expandedDetailNodeId={expandedDetailNodeId}
                  compact={compact}
                  onFocusNode={onFocusNode}
                  onToggleDetails={(selectedNode) =>
                    setExpandedDetailNodeId((current) =>
                      current === selectedNode.userId ? null : selectedNode.userId,
                    )
                  }
                  onToggleExpand={(userId) =>
                    setExpansionOverrides((current) => ({
                      ...current,
                      [userId]: !(expandedNodeIds[userId] ?? false),
                    }))
                  }
                  onSelectOpenSlot={onSelectOpenSlot}
                  onDropPendingOnSlot={onDropPendingOnSlot}
                />
              </div>
            ))
          ) : (
            <div className="min-w-[320px] rounded-[28px] border border-white/8 bg-white/[0.015] p-5">
              <p className="text-sm font-medium text-white">{t("team.tree.emptyTitle")}</p>
              <p className="mt-2 text-xs text-white/45">
                {t("team.tree.emptyDescription")}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
