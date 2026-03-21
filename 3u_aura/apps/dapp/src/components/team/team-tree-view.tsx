"use client";

import { type HTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { GlassCard } from "@/components/ui-custom/glass-card";
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
  maxDepth?: number;
  focusedUserId?: string;
  selectedParentId?: string;
  selectedPlacementKey?: string | null;
  compact?: boolean;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
}

function TreeBranch({
  node,
  focusedUserId,
  selectedParentId,
  selectedPlacementKey,
  compact,
  onSelectOpenSlot,
}: {
  node: TeamTreeNodeBranch;
  focusedUserId?: string;
  selectedParentId?: string;
  selectedPlacementKey?: string | null;
  compact?: boolean;
  onSelectOpenSlot?: (node: TeamTreeNodeLike, position: TeamPosition) => void;
}) {
  const isFocused = focusedUserId === node.userId;
  const isSelected = selectedParentId === node.userId;

  return (
    <div className="relative">
      <TeamTreeNodeCard
        node={node}
        active={isFocused}
        selected={isSelected}
        compact={compact}
        selectedPlacementKey={selectedPlacementKey}
        onSelectOpenSlot={onSelectOpenSlot}
      />

      {node.children.length > 0 ? (
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
                  focusedUserId={focusedUserId}
                  selectedParentId={selectedParentId}
                  selectedPlacementKey={selectedPlacementKey}
                  compact={compact}
                  onSelectOpenSlot={onSelectOpenSlot}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ml-6 flex items-center gap-2 py-3 text-xs text-white/35">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          No descendants yet
        </div>
      )}
    </div>
  );
}

export function TeamTreeView({
  snapshot,
  maxDepth,
  focusedUserId,
  selectedParentId,
  selectedPlacementKey,
  compact = false,
  className,
  onSelectOpenSlot,
  ...props
}: TeamTreeViewProps) {
  const filteredNodes =
    typeof maxDepth === "number"
      ? snapshot.nodes.filter((node) => node.depth <= maxDepth)
      : snapshot.nodes;
  const roots = buildTreeBranches(filteredNodes, snapshot.rootUserId);

  return (
    <div
      className={cn("space-y-4 overflow-x-auto pb-2", className)}
      {...props}
    >
      <div className="min-w-[320px] space-y-4">
        {roots.length > 0 ? (
          roots.map((node) => (
            <GlassCard key={node.userId} className="p-4" variant={node.isRoot ? "highlight" : "default"}>
              <TreeBranch
                node={node}
                focusedUserId={focusedUserId}
                selectedParentId={selectedParentId}
                selectedPlacementKey={selectedPlacementKey}
                compact={compact}
                onSelectOpenSlot={onSelectOpenSlot}
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
  );
}
