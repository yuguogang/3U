"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, Share2, Copy, Check, TrendingUp, TrendingDown, QrCode, Sparkles } from "lucide-react";
import type {
  ReferralPendingPlacementView,
  TeamPosition,
  TeamTreeNodeView,
} from "3u-aura-common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import {
  TeamTreePendingSummary,
  TeamTreePlacementLegend,
  TeamTreeView,
  PendingMemberCard,
} from "@/components/team";
import {
  SectionCardSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "@/components/ui-custom/section-state";
import {
  formatAuraAtomic,
  formatUsdtAtomic,
  formatWalletAddress,
} from "@/lib/promotion-format";
import {
  useBindInviterMutation,
  useBindPlacementMutation,
  usePendingPlacementsQuery,
  useTeamTreeSnapshotQuery,
} from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import {
  normalizeReferralCode,
  PENDING_REFERRAL_CODE_STORAGE_KEY,
  resolvePendingReferralCode,
} from "@/lib/referral";
import { buildTeamTree } from "@/lib/team-tree";

const EMPTY_PENDING_PLACEMENTS: ReferralPendingPlacementView[] = [];

export function TeamPage() {
  const searchParams = useSearchParams();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const pendingPlacementQuery = usePendingPlacementsQuery(
    isAuthenticated && hasHydrated,
  );
  const bindInviterMutation = useBindInviterMutation();
  const bindPlacementMutation = useBindPlacementMutation();
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPlacementUserId, setSelectedPlacementUserId] = useState<
    string | null
  >(null);
  const [draggingPendingUserId, setDraggingPendingUserId] = useState<string | null>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [treeDepth, setTreeDepth] = useState(4);
  const autoBindAttemptKeyRef = useRef<string | null>(null);
  
  const user = profileQuery.data;
  const profile = user?.profile;
  const pendingPlacements =
    pendingPlacementQuery.data ?? EMPTY_PENDING_PLACEMENTS;
  const referralCodeFromUrl = normalizeReferralCode(searchParams.get("ref"));
  const isRootUser = Boolean(
    user && !user.inviterId && !user.parentId && user.inviteCode,
  );
  const isTreeReady = Boolean(user?.parentId || isRootUser);
  const isAwaitingOwnPlacement = Boolean(user?.inviterId && !user?.parentId);
  const hasShareAccess = Boolean(isTreeReady && user?.inviteCode);
  const treeSnapshotQuery = useTeamTreeSnapshotQuery(
    { depth: treeDepth },
    isAuthenticated && hasHydrated && isTreeReady,
  );
  const treeRoot = useMemo(
    () =>
      buildTeamTree(
        treeSnapshotQuery.data?.nodes,
        treeSnapshotQuery.data?.rootUserId,
      ),
    [treeSnapshotQuery.data],
  );
  const selectedPlacementUser = useMemo(
    () =>
      pendingPlacements.find((item) => item.userId === selectedPlacementUserId) ??
      null,
    [pendingPlacements, selectedPlacementUserId],
  );
  const selectedSlot = useMemo(() => {
    if (!selectedSlotKey) {
      return null;
    }

    const [parentId, teamPosition] = selectedSlotKey.split(":");
    if (!parentId || !teamPosition) {
      return null;
    }

    if (teamPosition !== "LEFT" && teamPosition !== "RIGHT") {
      return null;
    }

    const parentNode = treeSnapshotQuery.data?.nodes.find(
      (node) => node.userId === parentId,
    );
    if (!parentNode) {
      return null;
    }

    return {
      parentId,
      parentNode,
      teamPosition: teamPosition as TeamPosition,
    };
  }, [selectedSlotKey, treeSnapshotQuery.data?.nodes]);
  const totalTreeAura = useMemo(() => {
    const nodes = treeSnapshotQuery.data?.nodes ?? [];
    return nodes.reduce(
      (sum, node) => sum + BigInt(node.totalAuraAtomic),
      BigInt(0),
    );
  }, [treeSnapshotQuery.data?.nodes]);
  const placedCount = Math.max((treeSnapshotQuery.data?.nodes.length ?? 1) - 1, 0);
  const treeSnapshot = treeSnapshotQuery.data;
  const appOrigin =
    typeof window === "undefined" ? "" : window.location.origin;
  const shareLink = useMemo(() => {
    if (!hasShareAccess || !user?.inviteCode || !appOrigin) {
      return "";
    }

    return `${appOrigin}/team?ref=${encodeURIComponent(user.inviteCode)}`;
  }, [appOrigin, hasShareAccess, user?.inviteCode]);
  const qrCodeUrl = useMemo(() => {
    if (!shareLink) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      shareLink,
    )}`;
  }, [shareLink]);

  useEffect(() => {
    if (!referralCodeFromUrl || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      PENDING_REFERRAL_CODE_STORAGE_KEY,
      referralCodeFromUrl,
    );
  }, [referralCodeFromUrl]);

  useEffect(() => {
    const pendingReferralCode = resolvePendingReferralCode(referralCodeFromUrl);
    if (!pendingReferralCode || !hasHydrated || !isAuthenticated || !user) {
      return;
    }

    // Root users and already-bound users should not be rebound automatically.
    if (user.inviterId || user.parentId || user.inviteCode) {
      return;
    }

    if (bindInviterMutation.isPending) {
      return;
    }

    const attemptKey = `${user.id}:${pendingReferralCode}`;
    if (autoBindAttemptKeyRef.current === attemptKey) {
      return;
    }

    autoBindAttemptKeyRef.current = attemptKey;

    bindInviterMutation.mutate(
      { inviteCode: pendingReferralCode },
      {
        onSuccess: () => {
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(
              PENDING_REFERRAL_CODE_STORAGE_KEY,
            );
          }
        },
      },
    );
  }, [
    bindInviterMutation,
    hasHydrated,
    isAuthenticated,
    referralCodeFromUrl,
    user,
  ]);

  async function handleBindInviter() {
    await bindInviterMutation.mutateAsync({
      inviteCode: inviteCode.trim(),
    });
    setInviteCode("");
  }

  async function handleBindPlacement() {
    if (!selectedPlacementUserId || !selectedSlot) {
      return;
    }

    await bindPlacementMutation.mutateAsync({
      parentId: selectedSlot.parentId,
      placementUserId: selectedPlacementUserId,
      teamPosition: selectedSlot.teamPosition,
    });
    setSelectedPlacementUserId(null);
    setSelectedSlotKey(null);
  }

  function handleTreeSlotSelect(node: TeamTreeNodeView, position: TeamPosition) {
    setSelectedSlotKey(`${node.userId}:${position}`);
  }

  function handlePendingMemberSelect(userId: string | null) {
    setSelectedPlacementUserId(userId);
    if (!userId) {
      setSelectedSlotKey(null);
    }
  }

  function handleDropPendingOnSlot(
    node: TeamTreeNodeView,
    position: TeamPosition,
    pendingUserId: string,
  ) {
    setDraggingPendingUserId(null);
    setSelectedPlacementUserId(pendingUserId);
    setSelectedSlotKey(`${node.userId}:${position}`);
  }

  const handleCopyInvite = async () => {
    if (user?.inviteCode) {
      await navigator.clipboard.writeText(user.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyShareLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <MobileLayout
      eyebrow="Promotion / Team"
      title="My Team"
    >
      <div className="space-y-6">
        {/* Team Overview */}
        <section className="animate-fade-in">
          <div className="space-y-3">
            <TeamTreePendingSummary
              pendingCount={pendingPlacements.length}
              placedCount={placedCount}
              rootLabel={isRootUser ? "Root Team" : "Subtree Team"}
            />

            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/50">Left Leg</span>
                </div>
                <p className="text-lg font-semibold text-white font-mono">
                  {profile ? formatUsdtAtomic(profile.leftTeamVolume) : "0"}
                </p>
                <p className="text-xs text-white/40">USDT Volume</p>
              </GlassCard>
              <GlassCard className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-white/50">Right Leg</span>
                </div>
                <p className="text-lg font-semibold text-white font-mono">
                  {profile ? formatUsdtAtomic(profile.rightTeamVolume) : "0"}
                </p>
                <p className="text-xs text-white/40">USDT Volume</p>
              </GlassCard>
            </div>

            <GlassCard variant="highlight" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/50">Small Leg Volume</p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {profile ? formatUsdtAtomic(profile.smallLegVolume) : "0"} <span className="text-xs text-white/50 font-sans">USDT</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-aura-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-aura-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
                <div>
                  <p className="text-xs text-white/50">Left Leg</p>
                  <p className="text-lg font-semibold text-white">{profile ? formatUsdtAtomic(profile.leftTeamVolume) : "0"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Right Leg</p>
                  <p className="text-lg font-semibold text-white">{profile ? formatUsdtAtomic(profile.rightTeamVolume) : "0"}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Tree Snapshot */}
        {isTreeReady && (
          <section className="animate-slide-up" style={{ animationDelay: "0.08s" }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-white/70">Tree Snapshot</h2>
                <p className="mt-1 text-xs text-white/45">
                  Compact subtree view for placement decisions. Tap nodes for details, expand branches on demand, and place pending members into any open subtree slot.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={treeDepth <= 2}
                  onClick={() => setTreeDepth((current) => Math.max(2, current - 1))}
                  className="h-8 border-white/10 px-3 text-xs hover:bg-white/5"
                >
                  Depth -1
                </Button>
                <span className="text-xs text-white/50">D{treeDepth}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={treeDepth >= 8}
                  onClick={() => setTreeDepth((current) => Math.min(8, current + 1))}
                  className="h-8 border-white/10 px-3 text-xs hover:bg-white/5"
                >
                  Depth +1
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <TeamTreePlacementLegend />

              <GlassCard className="p-4">
              <div className="grid grid-cols-3 gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Visible Nodes
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white font-mono">
                    {treeSnapshotQuery.data?.nodes.length ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Pending
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white font-mono">
                    {pendingPlacements.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Tree AURA
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatAuraAtomic(totalTreeAura.toString())}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {treeSnapshotQuery.isLoading ? (
                  <SectionCardSkeleton rows={3} />
                ) : treeSnapshotQuery.error instanceof Error ? (
                  <SectionErrorState
                    title="Unable to load tree snapshot"
                    description={treeSnapshotQuery.error.message}
                  />
                ) : !treeRoot ? (
                  <SectionEmptyState
                    title="Tree snapshot unavailable"
                    description="Reconnect and refresh after your latest placement changes."
                  />
                ) : (
                  <TeamTreeView
                    snapshot={treeSnapshot!}
                    anchorUserId={user?.id}
                    maxDepth={treeDepth}
                    focusedUserId={selectedPlacementUserId ?? undefined}
                    selectedPendingUserId={draggingPendingUserId ?? selectedPlacementUserId}
                    selectedParentId={selectedSlot?.parentId}
                    selectedPlacementKey={selectedSlotKey}
                    onSelectOpenSlot={handleTreeSlotSelect}
                    onDropPendingOnSlot={handleDropPendingOnSlot}
                  />
                )}
              </div>
              </GlassCard>
            </div>
          </section>
        )}

        {/* Share Center */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">Share Center</h2>
          {hasShareAccess ? (
            <div className="space-y-3">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-aura-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-mono font-semibold text-white">
                        {user?.inviteCode}
                      </p>
                      <p className="text-xs text-white/50">
                        Share this code or the full referral link below
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyInvite}
                    className="h-9 border-white/10 hover:bg-white/5"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-aura-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                      Referral Link
                    </p>
                    <p className="mt-2 break-all text-sm text-white/80">
                      {shareLink}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShareLink}
                    className="h-9 shrink-0 border-white/10 hover:bg-white/5"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-aura-success" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5 text-aura-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Referral QR Code</p>
                    <p className="text-xs text-white/50">
                      Scanning this code opens your referral link with the invite code embedded.
                    </p>
                    {qrCodeUrl ? (
                      <>
                        <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-white p-3">
                          <a
                            href={qrCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open referral QR code in a new tab"
                          >
                            <img
                              alt="Referral QR code"
                              className="h-40 w-40 rounded-lg"
                              src={qrCodeUrl}
                            />
                          </a>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyShareLink}
                            className="border-white/10 hover:bg-white/5"
                          >
                            {copiedLink ? (
                              <Check className="w-4 h-4 text-aura-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-white/10 hover:bg-white/5"
                          >
                            <a href={qrCodeUrl} target="_blank" rel="noreferrer">
                              <QrCode className="w-4 h-4" />
                              Open QR
                            </a>
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </GlassCard>
            </div>
          ) : isAwaitingOwnPlacement ? (
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Share unlocks after your own placement
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    Your inviter binding is already saved. Once your upstream places you
                    into the tree, your own invite code, referral link, and QR code will
                    unlock automatically.
                  </p>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Share unlocks after inviter binding
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    Users who first arrive through a referral link bind automatically. If
                    you entered directly, bind an inviter below first. Your own invite code,
                    referral link, and QR code will appear after you are both bound and
                    placed into the tree.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </section>

        {/* Bind Inviter */}
        {!isRootUser && !user?.inviterId && (
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-sm font-medium text-white/70 mb-3">Bind Inviter</h2>
            <GlassCard className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    placeholder="Enter upstream invite code"
                    value={inviteCode}
                    onChange={(e) => {
                      if (bindInviterMutation.isError) {
                        bindInviterMutation.reset();
                      }
                      setInviteCode(e.target.value);
                    }}
                    className="h-10 pl-9 bg-white/5 border-white/10"
                  />
                </div>
                <Button
                  onClick={handleBindInviter}
                  disabled={!inviteCode.trim() || bindInviterMutation.isPending}
                  className="bg-aura-primary hover:bg-aura-primary-dark"
                >
                  Bind
                </Button>
              </div>
              {bindInviterMutation.isError && (
                <div className="mt-3 rounded-xl border border-aura-error/20 bg-aura-error/10 px-3 py-2 text-sm text-aura-error">
                  {bindInviterMutation.error instanceof Error
                    ? bindInviterMutation.error.message
                    : "Inviter bind failed"}
                </div>
              )}
            </GlassCard>
          </section>
        )}

        {/* Pending Placements */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70">Pending Placements</h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
              {pendingPlacements.length} Total
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingPlacementQuery.isLoading ? (
              <SectionCardSkeleton rows={2} />
            ) : pendingPlacementQuery.error instanceof Error ? (
              <SectionErrorState
                title="Unable to load pending placements"
                description={pendingPlacementQuery.error.message}
              />
            ) : pendingPlacements.length === 0 ? (
              <SectionEmptyState
                title="No pending placements"
                description="Newly joined referrals waiting for placement will appear here."
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {pendingPlacements.map((p) => (
                  <PendingMemberCard
                    key={p.userId}
                    userId={p.userId}
                    walletAddress={p.walletAddress}
                    registeredAt={p.registeredAt}
                    dragging={draggingPendingUserId === p.userId}
                    selected={selectedPlacementUserId === p.userId}
                    onClick={() =>
                      handlePendingMemberSelect(
                        selectedPlacementUserId === p.userId ? null : p.userId,
                      )
                    }
                    onDragStart={(userId) => {
                      setDraggingPendingUserId(userId);
                      setSelectedPlacementUserId(userId);
                    }}
                    onDragEnd={() => setDraggingPendingUserId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Placement Confirmation */}
        {selectedPlacementUserId && (
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-sm font-medium text-white/70 mb-3">Placement Confirmation</h2>
            <GlassCard className="p-4">
              <div className="space-y-3">
                <div className="rounded-2xl border border-aura-primary/15 bg-aura-primary/8 px-3 py-2 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-aura-primary" />
                    {draggingPendingUserId
                      ? "Drop the pending member onto any glowing LEFT or RIGHT slot, then confirm the final placement."
                      : selectedPlacementUserId
                        ? "Choose a glowing LEFT or RIGHT slot in the tree. The summary below will update before you confirm."
                        : "Select a pending member first, then choose a subtree slot."}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Pending Member
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {selectedPlacementUser
                      ? formatWalletAddress(selectedPlacementUser.walletAddress)
                      : "Select a pending member above"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Selected Slot
                  </p>
                  {selectedSlot ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-white">
                        Parent {formatWalletAddress(selectedSlot.parentNode.walletAddress)}
                      </p>
                      <p className="text-xs text-white/50">
                        {selectedSlot.teamPosition === "LEFT" ? "Left" : "Right"} child slot
                      </p>
                      <p className="text-xs text-white/40">
                        This keeps referral and placement semantics intact: direct referral remains unchanged, while the subtree parent and side define the actual binary-tree mount.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-white/50">
                      Tap or drop onto an arrow slot in the tree above to choose the target.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
              <Button
                className="w-full bg-aura-primary hover:bg-aura-primary-dark font-bold"
                disabled={!selectedSlotKey || bindPlacementMutation.isPending}
                onClick={handleBindPlacement}
              >
                {bindPlacementMutation.isPending ? "Confirming..." : "Confirm Placement"}
              </Button>
              {bindPlacementMutation.isError && (
                <div className="mt-3 rounded-xl border border-aura-error/20 bg-aura-error/10 px-3 py-2 text-sm text-aura-error">
                  {bindPlacementMutation.error instanceof Error
                    ? bindPlacementMutation.error.message
                    : "Placement binding failed"}
                </div>
              )}
              </div>
            </GlassCard>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}
