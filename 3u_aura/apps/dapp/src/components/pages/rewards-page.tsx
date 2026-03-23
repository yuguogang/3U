"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Coins, Trophy, Clock, Zap, Gift } from "lucide-react";
import { RewardType } from "3u-aura-common";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import {
  SectionCardSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "@/components/ui-custom/section-state";
import StatCard from "@/components/ui-custom/stat-card";
import {
  formatAuraAtomic,
  formatDateTime,
  parseAtomicToBigInt,
} from "@/lib/promotion-format";
import { useMyClaimsQuery } from "@/queries/claims.query";
import { useCurrentEpochQuery } from "@/queries/promotion.query";
import { useMyRewardsQuery } from "@/queries/rewards.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function RewardsPage() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const rewardsQuery = useMyRewardsQuery(isAuthenticated && hasHydrated);
  const claimsQuery = useMyClaimsQuery(isAuthenticated && hasHydrated);
  const epochQuery = useCurrentEpochQuery();
  const profile = profileQuery.data?.profile;

  useMemo(() => {
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
      parseAtomicToBigInt(profile.totalAuraFromCheckin) +
      parseAtomicToBigInt(profile.totalAuraFromDirect) +
      parseAtomicToBigInt(profile.totalAuraFromIndirect) +
      parseAtomicToBigInt(profile.totalAuraFromConsolation)
    );
  }, [profile]);
  const epochStatusLabel = epochQuery.data?.status
    ? t(`shared.promotion.epochStatus.${epochQuery.data.status}`)
    : t("shared.status.loading");

  return (
    <MobileLayout
      eyebrow={t("rewards.eyebrow")}
      title={t("rewards.title")}
    >
      <div className="space-y-6">
        {/* Total Rewards Card */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/50 mb-1">{t("rewards.summary.totalAura")}</p>
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
                <p className="text-xs text-white/50">{t("rewards.summary.fromCheckin")}</p>
                <p className="text-lg font-semibold text-white">{profile ? formatAuraAtomic(profile.totalAuraFromCheckin) : "0"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">{t("rewards.summary.fromReferrals")}</p>
                <p className="text-lg font-semibold text-white">
                  {profile
                    ? formatAuraAtomic(
                        (
                          parseAtomicToBigInt(profile.totalAuraFromDirect) +
                          parseAtomicToBigInt(profile.totalAuraFromIndirect)
                        ).toString(),
                      )
                    : "0"}
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Stats Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t("rewards.stats.currentEpoch.label")}
              value={`#${epochQuery.data?.epochNo || 0}`}
              subValue={epochStatusLabel}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label={t("rewards.stats.pendingClaims.label")}
              value={claimsQuery.data?.merkleClaims.length ?? 0}
              subValue={t("rewards.stats.pendingClaims.subValue")}
              icon={<Gift className="w-5 h-5" />}
              highlight={!!claimsQuery.data?.merkleClaims.length}
            />
          </div>
        </section>

        {/* Epoch Details */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">{t("rewards.schedule.title")}</h2>
          <GlassCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">{t("rewards.schedule.startTime")}</span>
                <span className="text-white font-mono">{formatDateTime(epochQuery.data?.startAt, locale)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">{t("rewards.schedule.endTime")}</span>
                <span className="text-white font-mono">{formatDateTime(epochQuery.data?.endAt, locale)}</span>
              </div>
              <div className="pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs text-aura-primary">
                  <Zap className="w-3 h-3" />
                  <span>{t("rewards.schedule.settlementNote")}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Reward Feed */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70">{t("rewards.feed.title")}</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[10px] font-bold">
              {t("rewards.feed.totalBadge", { count: rewardsQuery.data?.length ?? 0 })}
            </span>
          </div>
          
          <div className="space-y-3">
            {rewardsQuery.isLoading ? (
              <SectionCardSkeleton rows={3} />
            ) : rewardsQuery.error instanceof Error ? (
              <SectionErrorState
                title={t("rewards.feed.errorTitle")}
                description={rewardsQuery.error.message}
              />
            ) : !rewardsQuery.data || rewardsQuery.data.length === 0 ? (
              <SectionEmptyState
                title={t("rewards.feed.emptyTitle")}
                description={t("rewards.feed.emptyDescription")}
              />
            ) : (
              rewardsQuery.data.map((reward) => {
                const isAuraReward =
                  reward.rewardType === RewardType.CONSOLATION_AURA ||
                  BigInt(reward.amountAura) > BigInt(0);

                return (
                <GlassCard key={reward.rewardId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isAuraReward ? "bg-aura-primary/10" : "bg-blue-500/10"
                      )}>
                        <Coins className={cn(
                          "w-5 h-5",
                          isAuraReward ? "text-aura-primary" : "text-blue-400"
                        )} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {t(`shared.promotion.rewardType.${reward.rewardType}`)}
                        </p>
                        <p className="text-[10px] text-white/40">
                          {new Date(reward.createdAt).toLocaleString(locale)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        +{formatAuraAtomic(reward.amountAura)} {t("shared.units.aura")}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {t(`shared.promotion.claimStatus.${reward.claimStatus}`)}
                      </p>
                    </div>
                  </div>
                </GlassCard>
                );
              })
            )}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
