"use client";

import type { ReactNode } from "react";
import { Crown, GitBranch, Link2, Sparkles, Trees, UserRound, Users } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TeamPosition } from "3u-aura-common";
import { formatAuraAtomic, formatUsdtAtomic } from "@/lib/promotion-format";
import { cn } from "@/lib/utils";
import {
  formatCompactWallet,
  formatCompactId,
  getAvatarPalette,
  getTreeNodeLabel,
  type TeamTreeNodeLike,
} from "./team-tree-utils";

type NodeRelationTone = "self" | "direct" | "descendant";

function DetailIdenticon({ seed }: { seed: string }) {
  const palette = getAvatarPalette(seed);

  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${palette.glow}, transparent 60%), linear-gradient(135deg, ${palette.light}, ${palette.dark})`,
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
    </div>
  );
}

function InfoPill({
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function getRelationLabel(relationTone: NodeRelationTone) {
  if (relationTone === "self") return "You";
  if (relationTone === "direct") return "Direct";
  return "Subtree";
}

export function TeamTreeNodeDetailsSheet({
  node,
  relationTone,
  open,
  onOpenChange,
}: {
  node: TeamTreeNodeLike | null;
  relationTone: NodeRelationTone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!node) {
    return null;
  }

  const nodeLabel = getTreeNodeLabel(node);
  const childCount = node.childCount ?? 0;
  const hasChildren = childCount > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-white/10 bg-[#0b0708]/95 text-white backdrop-blur-xl"
      >
        <SheetHeader className="pb-2">
          <div className="flex items-start gap-3">
            <DetailIdenticon seed={node.walletAddress} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-left text-lg font-semibold text-white">
                  {nodeLabel}
                </SheetTitle>
                {node.isRoot ? (
                  <InfoPill tone="accent">
                    <Crown className="h-3 w-3" />
                    Root
                  </InfoPill>
                ) : null}
                <InfoPill tone={relationTone === "direct" ? "positive" : "neutral"}>
                  {relationTone === "direct" ? (
                    <Link2 className="h-3 w-3" />
                  ) : (
                    <Trees className="h-3 w-3" />
                  )}
                  {getRelationLabel(relationTone)}
                </InfoPill>
              </div>
              <SheetDescription className="mt-1 text-left text-sm text-white/45">
                {formatCompactWallet(node.walletAddress)}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <InfoPill>Depth {node.depth}</InfoPill>
                {node.teamPosition ? (
                  <InfoPill tone="neutral">{node.teamPosition === TeamPosition.LEFT ? "Left" : "Right"}</InfoPill>
                ) : null}
                {hasChildren ? (
                  <InfoPill tone="neutral">
                    <Users className="h-3 w-3" />
                    {childCount} child
                    {childCount === 1 ? "" : "ren"}
                  </InfoPill>
                ) : (
                  <InfoPill tone="neutral">
                    <UserRound className="h-3 w-3" />
                    Leaf
                  </InfoPill>
                )}
                {node.inviteCode ? <InfoPill tone="accent">Invite {node.inviteCode}</InfoPill> : null}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 px-4 pb-4">
          <MetricCard label="Aura" value={formatAuraAtomic(node.totalAuraAtomic)} />
          <MetricCard label="Left" value={formatUsdtAtomic(node.leftTeamVolume)} />
          <MetricCard label="Right" value={formatUsdtAtomic(node.rightTeamVolume)} />
        </div>

        <div className="space-y-3 px-4 pb-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm text-white/70">
                <Sparkles className="h-4 w-4 text-aura-primary" />
                Small leg {formatUsdtAtomic(node.smallLegVolume)}
              </div>
              <InfoPill tone={node.openChildPositions.length > 0 ? "positive" : "warning"}>
                {node.openChildPositions.length > 0
                  ? `Open ${node.openChildPositions.join(" / ")}`
                  : "Fully occupied"}
              </InfoPill>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Parent</p>
              <p className="mt-2 text-sm text-white/75">
                {node.parentId ? formatCompactId(node.parentId) : "No parent"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Rewards / NFT</p>
              <p className="mt-2 text-sm text-white/75">
                {node.rewardLabel?.trim() || `NFT ${node.nftTierLabel ?? "unknown"}`}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-aura-primary" />
              {relationTone === "direct"
                ? "This member is your direct referral and also belongs to your current subtree."
                : relationTone === "self"
                  ? "This is your own current node inside the binary-tree view."
                  : "This member belongs to your subtree but is not directly invited by you."}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
