"use client";

import { useMemo, useState } from "react";
import { GitBranch, Link2, Network, UserPlus, Users, Share2, Copy, Check, ChevronDown, ChevronUp, Wallet, TrendingUp } from "lucide-react";
import type {
  ReferralPendingPlacementView,
  ReferralPlacementSlotView,
} from "3u-aura-common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import {
  formatDateTime,
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
import { cn } from "@/lib/utils";

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
  const [copied, setCopied] = useState(false);
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

  const handleCopyInvite = () => {
    if (user?.inviteCode) {
      navigator.clipboard.writeText(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        </section>

        {/* Invite Code */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">Your Invite Code</h2>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="text-lg font-mono font-semibold text-white">{user?.inviteCode || "---"}</p>
                  <p className="text-xs text-white/50">Share to invite friends</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInvite}
                className="h-9 border-white/10 hover:bg-white/5"
              >
                {copied ? <Check className="w-4 h-4 text-aura-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </GlassCard>
        </section>

        {/* Bind Inviter */}
        {!profile?.inviterId && (
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-sm font-medium text-white/70 mb-3">Bind Inviter</h2>
            <GlassCard className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
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
            {pendingPlacements.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-white/30 italic">No pending placements found.</p>
              </div>
            ) : (
              pendingPlacements.map((p) => (
                <GlassCard
                  key={p.id}
                  variant={selectedPlacementUserId === p.id ? "highlight" : "default"}
                  className="p-3"
                  onClick={() => setSelectedPlacementUserId(p.id)}
                  hoverEffect
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatWalletAddress(p.address)}
                        </p>
                        <p className="text-[10px] text-white/40">
                          Joined {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selectedPlacementUserId === p.id && (
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
              {selectableSlots.length === 0 ? (
                <p className="text-xs text-white/30 italic py-4">No available slots found.</p>
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
                            Parent: {formatWalletAddress(slot.parentAddress)}
                          </p>
                          <p className="text-[10px] text-white/40">
                            Position: {slot.teamPosition === 1 ? "Left" : "Right"}
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
            </div>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}
