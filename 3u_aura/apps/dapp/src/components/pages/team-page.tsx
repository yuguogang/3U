"use client";

import { useMemo, useState } from "react";
import { Link2, Network, Share2, Copy, Check, Wallet, TrendingUp, TrendingDown, Users, QrCode } from "lucide-react";
import type {
  ReferralPendingPlacementView,
  ReferralPlacementSlotView,
} from "3u-aura-common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import {
  SectionCardSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "@/components/ui-custom/section-state";
import {
  formatUsdtAtomic,
  formatWalletAddress,
} from "@/lib/promotion-format";
import {
  useBindInviterMutation,
  useBindPlacementMutation,
  usePendingPlacementsQuery,
  useSelectableSlotsQuery,
} from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";

const EMPTY_PENDING_PLACEMENTS: ReferralPendingPlacementView[] = [];
const EMPTY_SELECTABLE_SLOTS: ReferralPlacementSlotView[] = [];

export function TeamPage() {
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const pendingPlacementQuery = usePendingPlacementsQuery(
    isAuthenticated && hasHydrated,
  );
  const selectableSlotsQuery = useSelectableSlotsQuery(
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
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  
  const user = profileQuery.data;
  const profile = user?.profile;
  const pendingPlacements =
    pendingPlacementQuery.data ?? EMPTY_PENDING_PLACEMENTS;
  const selectableSlots =
    selectableSlotsQuery.data ?? EMPTY_SELECTABLE_SLOTS;
  const hasShareAccess = Boolean(user?.inviterId && user?.inviteCode);
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

  const selectedSlot = useMemo(
    () =>
      selectableSlots.find((slot) => slot.placementKey === selectedSlotKey) ??
      null,
    [selectedSlotKey, selectableSlots],
  );

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
            <GlassCard variant="highlight" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/50">Total Members</p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {(pendingPlacements.length + 1).toString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-aura-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-aura-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
                <div>
                  <p className="text-xs text-white/50">Pending</p>
                  <p className="text-lg font-semibold text-white">{pendingPlacements.length}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Placed</p>
                  <p className="text-lg font-semibold text-white">0</p>
                </div>
              </div>
            </GlassCard>

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
                    referral link, and QR code will appear after that binding succeeds.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </section>

        {/* Bind Inviter */}
        {!user?.inviterId && (
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
              pendingPlacements.map((p) => (
                <GlassCard
                  key={p.userId}
                  variant={selectedPlacementUserId === p.userId ? "highlight" : "default"}
                  className="p-3"
                  onClick={() => setSelectedPlacementUserId(p.userId)}
                  hoverEffect
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatWalletAddress(p.walletAddress)}
                        </p>
                        <p className="text-[10px] text-white/40">
                          Joined {new Date(p.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selectedPlacementUserId === p.userId && (
                      <Check className="w-4 h-4 text-aura-primary" />
                    )}
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </section>

        {/* Placement Slots */}
        {selectedPlacementUserId && (
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-sm font-medium text-white/70 mb-3">Select Placement Slot</h2>
            <div className="grid grid-cols-1 gap-2">
              {selectableSlotsQuery.isLoading ? (
                <SectionCardSkeleton rows={2} />
              ) : selectableSlotsQuery.error instanceof Error ? (
                <SectionErrorState
                  title="Unable to load placement slots"
                  description={selectableSlotsQuery.error.message}
                />
              ) : selectableSlots.length === 0 ? (
                <SectionEmptyState
                  title="No placement slots available"
                  description="Try again after the latest topology updates have been processed."
                />
              ) : (
                selectableSlots.map((slot) => (
                  <GlassCard
                    key={slot.placementKey}
                    variant={selectedSlotKey === slot.placementKey ? "highlight" : "default"}
                    className="p-3"
                    onClick={() => setSelectedSlotKey(slot.placementKey)}
                    hoverEffect
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Network className="w-4 h-4 text-white/40" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Parent: {formatWalletAddress(slot.parentWalletAddress)}
                          </p>
                          <p className="text-[10px] text-white/40">
                            Position: {slot.teamPosition === "LEFT" ? "Left" : "Right"}
                          </p>
                        </div>
                      </div>
                      {selectedSlotKey === slot.placementKey && (
                        <Check className="w-4 h-4 text-aura-primary" />
                      )}
                    </div>
                  </GlassCard>
                ))
              )}
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
          </section>
        )}
      </div>
    </MobileLayout>
  );
}
