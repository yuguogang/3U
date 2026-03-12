"use client";

import { useMemo } from "react";
import { Coins, Ticket, Trophy } from "lucide-react";
import { GlassCard, MobileLayout } from "@/components/layout/mobile-layout";
import {
  formatAuraAtomic,
  formatDateTime,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import { useMyClaimsQuery } from "@/queries/claims.query";
import { useCurrentEpochQuery } from "@/queries/promotion.query";
import { useMyRewardsQuery } from "@/queries/rewards.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";

export function RewardsPage() {
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const rewardsQuery = useMyRewardsQuery(isAuthenticated && hasHydrated);
  const claimsQuery = useMyClaimsQuery(isAuthenticated && hasHydrated);
  const epochQuery = useCurrentEpochQuery();
  const profile = profileQuery.data?.profile;

  const rewardTotals = useMemo(() => {
    const rewards = rewardsQuery.data ?? [];

    return rewards.reduce(
      (accumulator, reward) => {
        accumulator.usdt += BigInt(reward.amountUsdt);
        accumulator.aura += BigInt(reward.amountAura);
        if (reward.claimStatus === "CLAIMABLE") {
          accumulator.claimable += 1;
        }

        return accumulator;
      },
      {
        aura: BigInt(0),
        claimable: 0,
        usdt: BigInt(0),
      },
    );
  }, [rewardsQuery.data]);

  return (
    <MobileLayout
      eyebrow="Promotion / Rewards"
      title="Rewards and weekly epochs"
      description="This page stays on the read side: it surfaces epoch status, cumulative AURA, and the published reward feed without reconstructing settlement logic inside the client."
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-white">
              <Ticket className="h-5 w-5 text-orange-300" />
              <h2 className="text-base font-semibold">Current epoch</h2>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">
              #{epochQuery.data?.epochNo ?? "-"}
            </p>
            <p className="mt-2 text-sm text-white/65">
              {epochQuery.data?.status ?? "Loading"}
            </p>
            <p className="mt-3 text-xs text-white/45">
              {formatDateTime(epochQuery.data?.startAt)} to{" "}
              {formatDateTime(epochQuery.data?.endAt)}
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-white">
              <Coins className="h-5 w-5 text-orange-300" />
              <h2 className="text-base font-semibold">AURA totals</h2>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">
              {formatAuraAtomic(rewardTotals.aura)}
            </p>
            <p className="mt-2 text-sm text-white/65">Reward feed total</p>
            <p className="mt-3 text-xs text-white/45">
              Check-in/direct/indirect/consolation profile total:{" "}
              {formatAuraAtomic(
                (
                  BigInt(profile?.totalAuraFromCheckin ?? "0") +
                  BigInt(profile?.totalAuraFromDirect ?? "0") +
                  BigInt(profile?.totalAuraFromIndirect ?? "0") +
                  BigInt(profile?.totalAuraFromConsolation ?? "0")
                ).toString(),
              )}
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-white">
              <Trophy className="h-5 w-5 text-orange-300" />
              <h2 className="text-base font-semibold">Claim feed</h2>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">
              {claimsQuery.data?.merkleClaims.length ?? 0}
            </p>
            <p className="mt-2 text-sm text-white/65">
              Weekly merkle claims published
            </p>
            <p className="mt-3 text-xs text-white/45">
              Claimable rewards in feed: {rewardTotals.claimable}
            </p>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
                Reward feed
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Published reward records
              </h2>
            </div>
            <div className="text-right text-sm text-white/55">
              <p>Total USDT: {formatUsdtAtomic(rewardTotals.usdt.toString())}</p>
              <p className="mt-1">Total entries: {rewardsQuery.data?.length ?? 0}</p>
            </div>
          </div>

          {!rewardsQuery.data?.length ? (
            <p className="text-sm leading-6 text-white/68">
              No reward rows are visible for this wallet yet. That can mean the current epoch is still open, not enough participants caused rollover, or no published reward set exists for this account.
            </p>
          ) : (
            <div className="grid gap-3">
              {rewardsQuery.data.map((reward) => (
                <div
                  key={reward.rewardId}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {reward.rewardType}
                        {reward.rank ? ` · Rank ${reward.rank}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        Epoch #{reward.epochNo} · {reward.status} ·{" "}
                        {reward.claimStatus ?? "NO_CLAIM"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-white">
                      <p>{formatUsdtAtomic(reward.amountUsdt)} USDT</p>
                      <p className="mt-1 text-white/55">
                        {formatAuraAtomic(reward.amountAura)} AURA
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-white/35">
                    {reward.distributionKey} · created{" "}
                    {formatDateTime(reward.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </MobileLayout>
  );
}
