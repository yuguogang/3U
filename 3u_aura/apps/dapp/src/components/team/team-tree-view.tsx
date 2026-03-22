"use client";

import { type HTMLAttributes, useMemo, useState } from "react";
import { ChevronDown, Workflow } from "lucide-react";
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
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
}

type ExpandedTreeState = Record<string, boolean>;

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
  onToggleDetails: (node: TeamTreeNodeLike) => void;
  onToggleExpand: (userId: string) => void;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
  onDropPendingOnSlot?: (
    node: TeamTreeNodeLike,
    position: TeamPosition,
    pendingUserId: string,
  ) => void;
}) {
  const hasChildren = node.children.length > 0;
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
    <div className="relative">
      <TeamTreeNodeCard
        node={node}
        active={isFocused}
        selected={isSelected}
        compact={compact}
        hasChildren={hasChildren}
        branchExpanded={isExpanded}
        detailsExpanded={detailsExpanded}
        relationTone={relationTone}
        selectedPlacementKey={selectedPlacementKey}
        selectedPendingUserId={selectedPendingUserId}
        onToggleDetails={() => onToggleDetails(node)}
        onToggleBranch={() => onToggleExpand(node.userId)}
        onSelectOpenSlot={onSelectOpenSlot}
        onDropPendingOnSlot={onDropPendingOnSlot}
      />

      {hasChildren ? (
        isExpanded ? (
          <div className="relative mt-4 pt-8">
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

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-center">
                  <span className="rounded-full border border-emerald-400/15 bg-emerald-400/8 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300/85">
                    Left
                  </span>
                </div>
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
                    onToggleDetails={onToggleDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ) : (
                  <div className="flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015] text-[11px] text-white/28">
                    Empty
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-center">
                  <span className="rounded-full border border-sky-400/15 bg-sky-400/8 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-sky-200/85">
                    Right
                  </span>
                </div>
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
                    onToggleDetails={onToggleDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ) : (
                  <div className="flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/[0.015] text-[11px] text-white/28">
                    Empty
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
                    onToggleDetails={onToggleDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggleExpand(node.userId)}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/[0.06]"
          >
            <ChevronDown className="-rotate-90 h-3.5 w-3.5" />
            Expand {node.children.length} child
            {node.children.length === 1 ? "" : "ren"}
          </button>
        )
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-white/30">
          <Workflow className="h-3.5 w-3.5" />
          Leaf node
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
  onSelectOpenSlot,
  onDropPendingOnSlot,
  ...props
}: TeamTreeViewProps) {
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
            Tap a node to inspect details
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            Expand only the branches you need
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            Drag a pending member onto a glowing slot or tap-select it first
          </span>
        </div>

        <div className="min-w-[320px] space-y-4">
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
            <div className="rounded-[28px] border border-white/8 bg-white/[0.015] p-5">
              <p className="text-sm font-medium text-white">Tree snapshot is empty</p>
              <p className="mt-2 text-xs text-white/45">
                No nodes were returned for this subtree yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
