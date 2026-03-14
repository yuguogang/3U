"use client";

import { useMemo, useState } from "react";
import { GitBranch, Link2, Network, UserPlus } from "lucide-react";
import type {
  ReferralPendingPlacementView,
  ReferralPlacementSlotView,
} from "3u-aura-common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, MobileLayout } from "@/components/layout/mobile-layout";
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

  return (
    <MobileLayout
      eyebrow="Promotion / Team"
      title="Referral and placement"
      description="Inviter binding and binary-tree placement stay separate here. This page drives the Phase3.1 inviter-operated placement flow without requiring a full graphical tree read model."
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
              Referral identity
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <p>
                Your invite code:{" "}
                <span className="font-semibold text-white">
                  <span data-testid="team-invite-code">{user?.inviteCode ?? "-"}</span>
                </span>
              </p>
              <p>
                Inviter bound:{" "}
                <span className="font-semibold text-white">
                  {user?.inviterId ? "Yes" : "No"}
                </span>
              </p>
              <p>
                Placement frozen:{" "}
                <span className="font-semibold text-white">
                  {user?.parentId ? `${user.teamPosition} @ ${user.parentId}` : "Pending"}
                </span>
              </p>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              <p>Small leg: {formatUsdtAtomic(profile?.smallLegVolume)}</p>
              <p className="mt-2">
                Left / Right: {formatUsdtAtomic(profile?.leftTeamVolume)} /{" "}
                {formatUsdtAtomic(profile?.rightTeamVolume)}
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-white">
              <UserPlus className="h-5 w-5 text-orange-300" />
              <h2 className="text-lg font-semibold">Bind inviter</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Registration can complete before placement, but the inviter relationship must be frozen first.
            </p>
            <div className="mt-5 space-y-3">
              <Input
                data-testid="team-bind-invite-code-input"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
              {bindInviterMutation.error ? (
                <p className="text-sm text-rose-300">
                  {bindInviterMutation.error instanceof Error
                    ? bindInviterMutation.error.message
                    : "Failed to bind inviter"}
                </p>
              ) : null}
              <Button
                data-testid="team-bind-inviter-button"
                className="h-11 rounded-2xl px-6"
                disabled={
                  !isAuthenticated ||
                  Boolean(user?.inviterId) ||
                  bindInviterMutation.isPending ||
                  !inviteCode.trim()
                }
                onClick={handleBindInviter}
                type="button"
              >
                {bindInviterMutation.isPending ? "Binding..." : "Bind Inviter"}
              </Button>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-3 text-white">
            <GitBranch className="h-5 w-5 text-orange-300" />
            <h2 className="text-lg font-semibold">Pending placements</h2>
          </div>
          {!pendingPlacements.length ? (
            <p className="text-sm leading-6 text-white/68">
              No direct referrals are waiting for inviter-operated placement right now.
            </p>
          ) : (
            <div className="grid gap-3">
              {pendingPlacements.map((invitee) => (
                <button
                  key={invitee.userId}
                  data-testid={`team-pending-placement-${invitee.userId}`}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    selectedPlacementUserId === invitee.userId
                      ? "border-orange-300/50 bg-orange-400/10"
                      : "border-white/10 bg-black/20 hover:border-white/25"
                  }`}
                  onClick={() => setSelectedPlacementUserId(invitee.userId)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {formatWalletAddress(invitee.walletAddress)}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        Registered {formatDateTime(invitee.registeredAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
                      Pending
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-3 text-white">
            <Network className="h-5 w-5 text-orange-300" />
            <h2 className="text-lg font-semibold">Selectable slots</h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-white/68">
            The server enumerates inviter-subtree slots. This list-first MVP avoids building a graphical tree read model before it is justified.
          </p>
          <div className="mb-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
            <p>Returned slots: {selectableSlots.length}</p>
            <p className="mt-2">Selected invitee: {selectedPlacementUserId ?? "-"}</p>
            <p className="mt-2">
              Selected slot:{" "}
              {selectedSlot
                ? `${formatWalletAddress(selectedSlot.parentWalletAddress)} / ${selectedSlot.teamPosition} / depth ${selectedSlot.depth}`
                : "-"}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {selectableSlots.slice(0, 24).map((slot) => (
              <button
                key={slot.placementKey}
                data-testid={`team-slot-${slot.placementKey}`}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  selectedSlotKey === slot.placementKey
                    ? "border-orange-300/50 bg-orange-400/10"
                    : "border-white/10 bg-black/20 hover:border-white/25"
                }`}
                onClick={() => setSelectedSlotKey(slot.placementKey)}
                type="button"
              >
                <p className="text-sm font-semibold text-white">
                  {formatWalletAddress(slot.parentWalletAddress)}
                </p>
                <p className="mt-2 text-xs text-white/55">
                  {slot.teamPosition} · depth {slot.depth}
                </p>
                <p className="mt-2 break-all text-[11px] text-white/35">
                  {slot.parentId}
                </p>
              </button>
            ))}
          </div>

          {bindPlacementMutation.error ? (
            <p className="mt-4 text-sm text-rose-300">
              {bindPlacementMutation.error instanceof Error
                ? bindPlacementMutation.error.message
                : "Failed to bind placement"}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              data-testid="team-confirm-placement-button"
              className="h-11 rounded-2xl px-6"
              disabled={
                !selectedPlacementUserId ||
                !selectedSlot ||
                bindPlacementMutation.isPending
              }
              onClick={handleBindPlacement}
              type="button"
            >
              {bindPlacementMutation.isPending ? "Placing..." : "Confirm Placement"}
            </Button>
            <div className="inline-flex items-center gap-2 text-sm text-white/55">
              <Link2 className="h-4 w-4" />
              Placement is immutable after confirmation unless admin repair is used.
            </div>
          </div>
        </GlassCard>
      </div>
    </MobileLayout>
  );
}
