"use client";

import { type HTMLAttributes, useMemo, useState } from "react";
import { ChevronDown, Workflow } from "lucide-react";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { cn } from "@/lib/utils";
import { TeamPosition, type TeamTreeSnapshotView } from "3u-aura-common";
import { TeamTreeNodeCard } from "./team-tree-node-card";
import { TeamTreeNodeDetailsSheet } from "./team-tree-node-details-sheet";
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
  compact,
  onOpenDetails,
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
  compact?: boolean;
  onOpenDetails: (node: TeamTreeNodeLike) => void;
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
        expanded={isExpanded}
        relationTone={relationTone}
        selectedPlacementKey={selectedPlacementKey}
        selectedPendingUserId={selectedPendingUserId}
        onOpenDetails={onOpenDetails}
        onToggleExpand={() => onToggleExpand(node.userId)}
        onSelectOpenSlot={onSelectOpenSlot}
        onDropPendingOnSlot={onDropPendingOnSlot}
      />

      {hasChildren ? (
        isExpanded ? (
          <div className="relative ml-6 border-l border-white/10 pl-6 pt-4">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-full w-6 overflow-visible text-white/10"
              viewBox="0 0 24 100"
              preserveAspectRatio="none"
            >
              <line x1="12" y1="0" x2="12" y2="100" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="20" x2="24" y2="20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="space-y-4">
              {node.children.map((child) => (
                <div key={child.userId} className="relative">
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[-24px] top-0 h-full w-6 overflow-visible text-white/10"
                    viewBox="0 0 24 100"
                    preserveAspectRatio="none"
                  >
                    <line x1="12" y1="0" x2="12" y2="100" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="12" y1="20" x2="24" y2="20" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <TreeBranch
                    node={child}
                    anchorUserId={anchorUserId}
                    focusedUserId={focusedUserId}
                    selectedParentId={selectedParentId}
                    selectedPlacementKey={selectedPlacementKey}
                    selectedPendingUserId={selectedPendingUserId}
                    expandedNodeIds={expandedNodeIds}
                    compact={compact}
                    onOpenDetails={onOpenDetails}
                    onToggleExpand={onToggleExpand}
                    onSelectOpenSlot={onSelectOpenSlot}
                    onDropPendingOnSlot={onDropPendingOnSlot}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggleExpand(node.userId)}
            className="ml-6 mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45 transition hover:bg-white/[0.06]"
          >
            <ChevronDown className="-rotate-90 h-3.5 w-3.5" />
            Expand {node.children.length} child
            {node.children.length === 1 ? "" : "ren"}
          </button>
        )
      ) : (
        <div className="ml-6 flex items-center gap-2 py-3 text-xs text-white/30">
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
  const [detailNode, setDetailNode] = useState<TeamTreeNodeLike | null>(null);

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
              <GlassCard key={node.userId} className="p-4" variant={node.isRoot ? "highlight" : "default"}>
                <TreeBranch
                  node={node}
                  anchorUserId={anchorUserId}
                  focusedUserId={focusedUserId}
                  selectedParentId={selectedParentId}
                  selectedPlacementKey={selectedPlacementKey}
                  selectedPendingUserId={selectedPendingUserId}
                  expandedNodeIds={expandedNodeIds}
                  compact={compact}
                  onOpenDetails={setDetailNode}
                  onToggleExpand={(userId) =>
                    setExpansionOverrides((current) => ({
                      ...current,
                      [userId]: !(expandedNodeIds[userId] ?? false),
                    }))
                  }
                  onSelectOpenSlot={onSelectOpenSlot}
                  onDropPendingOnSlot={onDropPendingOnSlot}
                />
              </GlassCard>
            ))
          ) : (
            <GlassCard className="p-5">
              <p className="text-sm font-medium text-white">Tree snapshot is empty</p>
              <p className="mt-2 text-xs text-white/45">
                No nodes were returned for this subtree yet.
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      <TeamTreeNodeDetailsSheet
        node={detailNode}
        relationTone={
          detailNode?.userId === anchorUserId
            ? "self"
            : detailNode?.inviterId === anchorUserId
              ? "direct"
              : "descendant"
        }
        open={Boolean(detailNode)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailNode(null);
          }
        }}
      />
    </>
  );
}
