"use client";

import { useMemo } from "react";
import { Coins, Ticket, Trophy, TrendingUp, Clock, Zap, Gift } from "lucide-react";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
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
import { cn } from "@/lib/utils";

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

  const totalAuraFromProfile = useMemo(() => {
    if (!profile) return BigInt(0);
    return (
      BigInt(profile.totalAuraFromCheckin ?? "0") +
      BigInt(profile.totalAuraFromDirect ?? "0") +
      BigInt(profile.totalAuraFromIndirect ?? "0") +
      BigInt(profile.totalAuraFromConsolation ?? "0")
    );
  }, [profile]);

  return (
    <MobileLayout
      eyebrow="Promotion / Rewards"
      title="My Rewards"
    >
      <div className="space-y-6">
        {/* Total Rewards Card */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/50 mb-1">Total Accumulated AURA</p>
                <h2 className="text-3xl font-bold font-mono text-white">
                  {formatAuraAtomic(totalAuraFromProfile.toString())}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-aura-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
              <div>
                <p className="text-xs text-white/50">From Check-in</p>
                <p className="text-lg font-semibold text-white">{profile ? formatAuraAtomic(profile.totalAuraFromCheckin) : "0"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">From Referrals</p>
                <p className="text-lg font-semibold text-white">
                  {profile ? formatAuraAtomic((BigInt(profile.totalAuraFromDirect) + BigInt(profile.totalAuraFromIndirect)).toString()) : "0"}
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Stats Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Current Epoch"
              value={`#${epochQuery.data?.epochNo || 0}`}
              subValue={epochQuery.data?.status || "Loading..."}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label="Pending Claims"
              value={claimsQuery.data?.merkleClaims.length ?? 0}
              subValue="Ready to claim"
              icon={<Gift className="w-5 h-5" />}
              highlight={!!claimsQuery.data?.merkleClaims.length}
            />
          </div>
        </section>

        {/* Epoch Details */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">Epoch Schedule</h2>
          <GlassCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Start Time</span>
                <span className="text-white font-mono">{formatDateTime(epochQuery.data?.startAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">End Time</span>
                <span className="text-white font-mono">{formatDateTime(epochQuery.data?.endAt)}</span>
              </div>
              <div className="pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-aura-primary">
                  <Zap className="w-3 h-3" />
                  <span>Settlement happens every Sunday at 00:00 UTC</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Reward Feed */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70">Recent Rewards</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px] font-bold">
              {rewardsQuery.data?.length ?? 0} Total
            </span>
          </div>
          
          <div className="space-y-3">
            {!rewardsQuery.data || rewardsQuery.data.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-white/30 italic">No rewards found yet.</p>
              </div>
            ) : (
              rewardsQuery.data.map((reward) => (
                <GlassCard key={reward.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        reward.rewardType === "CHECKIN" ? "bg-aura-primary/10" : "bg-blue-500/10"
                      )}>
                        <Coins className={cn(
                          "w-5 h-5",
                          reward.rewardType === "CHECKIN" ? "text-aura-primary" : "text-blue-400"
                        )} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{reward.rewardType}</p>
                        <p className="text-[10px] text-white/40">{new Date(reward.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">+{formatAuraAtomic(reward.amountAura)} AURA</p>
                      <p className="text-[10px] text-white/40">{reward.claimStatus}</p>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
