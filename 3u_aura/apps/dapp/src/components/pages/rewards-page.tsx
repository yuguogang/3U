"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Clock,
  Coins,
  Dice5,
  Gift,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { RewardType } from "3u-aura-common";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
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
  formatUsdtAtomic,
  formatWalletAddress,
  parseAtomicToBigInt,
} from "@/lib/promotion-format";
import { useMyClaimsQuery } from "@/queries/claims.query";
import { useCurrentEpochQuery, useRevealLotteryMutation } from "@/queries/promotion.query";
import {
  useLatestWeeklyResultsQuery,
  useMyRewardsQuery,
} from "@/queries/rewards.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function RewardsPage() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const rewardsQuery = useMyRewardsQuery(isAuthenticated && hasHydrated);
  const latestWeeklyResultsQuery = useLatestWeeklyResultsQuery(
    isAuthenticated && hasHydrated,
  );
  const claimsQuery = useMyClaimsQuery(isAuthenticated && hasHydrated);
  const epochQuery = useCurrentEpochQuery();
  const revealLotteryMutation = useRevealLotteryMutation();
  const profile = profileQuery.data?.profile;
  const [revealingEpochId, setRevealingEpochId] = useState<string | null>(null);

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
  const latestWeeklyResults = latestWeeklyResultsQuery.data;
  const isRevealingCurrentEpoch =
    latestWeeklyResults?.epochId !== undefined &&
    revealingEpochId === latestWeeklyResults.epochId;

  async function handleRevealLottery() {
    if (!latestWeeklyResults?.myLottery.canReveal) {
      return;
    }

    setRevealingEpochId(latestWeeklyResults.epochId);
    try {
      await revealLotteryMutation.mutateAsync({
        epochId: latestWeeklyResults.epochId,
      });
      await new Promise((resolve) => setTimeout(resolve, 1400));
    } finally {
      setRevealingEpochId(null);
    }
  }

  return (
    <MobileLayout
      eyebrow={t("rewards.eyebrow")}
      title={t("rewards.title")}
    >
      <div className="space-y-6">
        {/* Total Rewards Card */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-[var(--shell-text-soft)]">
                  {t("rewards.summary.totalAura")}
                </p>
                <h2 className="text-3xl font-bold font-mono text-[var(--shell-title)]">
                  {formatAuraAtomic(totalAuraFromProfile.toString())}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--shell-inset)]">
                <Trophy className="w-6 h-6 text-aura-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[var(--shell-border)] pt-4">
              <div>
                <p className="text-xs text-[var(--shell-text-soft)]">
                  {t("rewards.summary.fromCheckin")}
                </p>
                <p className="text-lg font-semibold text-[var(--shell-title)]">
                  {profile ? formatAuraAtomic(profile.totalAuraFromCheckin) : "0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--shell-text-soft)]">
                  {t("rewards.summary.fromReferrals")}
                </p>
                <p className="text-lg font-semibold text-[var(--shell-title)]">
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
          <h2 className="mb-3 text-sm font-medium text-[var(--shell-text-muted)]">
            {t("rewards.schedule.title")}
          </h2>
          <GlassCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--shell-text-soft)]">
                  {t("rewards.schedule.startTime")}
                </span>
                <span className="font-mono text-[var(--shell-title)]">
                  {formatDateTime(epochQuery.data?.startAt, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--shell-text-soft)]">
                  {t("rewards.schedule.endTime")}
                </span>
                <span className="font-mono text-[var(--shell-title)]">
                  {formatDateTime(epochQuery.data?.endAt, locale)}
                </span>
              </div>
              <div className="border-t border-[var(--shell-border)] pt-4">
                <div className="flex items-center gap-2 text-xs text-aura-primary">
                  <Zap className="w-3 h-3" />
                  <span>{t("rewards.schedule.settlementNote")}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--shell-text-muted)]">
              {t("rewards.weekly.title")}
            </h2>
            {latestWeeklyResults?.publishedAt ? (
              <span className="text-[10px] text-[var(--shell-text-soft)]">
                {t("rewards.weekly.publishedAt", {
                  date: formatDateTime(latestWeeklyResults.publishedAt, locale),
                })}
              </span>
            ) : null}
          </div>

          {latestWeeklyResultsQuery.isLoading ? (
            <SectionCardSkeleton rows={2} />
          ) : latestWeeklyResultsQuery.error instanceof Error ? (
            <SectionErrorState
              title={t("rewards.weekly.errorTitle")}
              description={latestWeeklyResultsQuery.error.message}
            />
          ) : !latestWeeklyResults ? (
            <SectionEmptyState
              title={t("rewards.weekly.emptyTitle")}
              description={t("rewards.weekly.emptyDescription")}
            />
          ) : (
            <div className="space-y-3">
              <GlassCard className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--shell-text-soft)]">
                      {t("rewards.weekly.lotteryTitle")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--shell-title)]">
                      #{latestWeeklyResults.epochNo}
                    </p>
                    <p className="mt-1 text-xs text-[var(--shell-text-soft)]">
                      {t("rewards.weekly.participants", {
                        participants: latestWeeklyResults.participantCount,
                        qualified: latestWeeklyResults.qualifiedTicketCount,
                      })}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--shell-inset)]">
                    {isRevealingCurrentEpoch ? (
                      <Dice5 className="h-5 w-5 animate-spin text-aura-primary" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-aura-primary" />
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--shell-border)] bg-[var(--glass-bg-strong)] p-4">
                  {isRevealingCurrentEpoch ? (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.revealingTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {t("rewards.weekly.revealingDescription")}
                      </p>
                    </>
                  ) : latestWeeklyResults.myLottery.resultStatus === "PENDING" ? (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.pendingTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {t("rewards.weekly.pendingDescription")}
                      </p>
                      {latestWeeklyResults.myLottery.canReveal ? (
                        <Button
                          type="button"
                          className="mt-4 h-10 rounded-xl bg-aura-primary text-black hover:bg-aura-primary-light"
                          disabled={revealLotteryMutation.isPending}
                          onClick={handleRevealLottery}
                        >
                          {t("rewards.weekly.revealButton")}
                        </Button>
                      ) : null}
                    </>
                  ) : latestWeeklyResults.myLottery.resultStatus === "WON" ? (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.wonTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {t("rewards.weekly.wonDescription", {
                          amount: formatUsdtAtomic(
                            latestWeeklyResults.myLottery.amountUsdt ?? "0",
                          ),
                          prize:
                            latestWeeklyResults.myLottery.prizeLabel
                              ? t(
                                  `rewards.weekly.prize.${latestWeeklyResults.myLottery.prizeLabel}`,
                                )
                              : "-",
                        })}
                      </p>
                      {latestWeeklyResults.myLottery.claimStatus === "CLAIMABLE" ? (
                        <Button
                          asChild
                          className="mt-4 h-10 rounded-xl bg-[var(--shell-badge-bg)] text-[var(--shell-badge-fg)] hover:opacity-90"
                        >
                          <Link href="/claims">
                            {t("rewards.weekly.viewClaims")}
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </>
                  ) : latestWeeklyResults.myLottery.resultStatus === "LOST" ? (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.lostTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {latestWeeklyResults.myLottery.amountAura
                          ? t("rewards.weekly.lostDescriptionConsolation", {
                              amount: formatAuraAtomic(
                                latestWeeklyResults.myLottery.amountAura,
                              ),
                            })
                          : t("rewards.weekly.lostDescription")}
                      </p>
                    </>
                  ) : latestWeeklyResults.myLottery.resultStatus ===
                    "NOT_QUALIFIED" ? (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.notQualifiedTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {t("rewards.weekly.notQualifiedDescription")}
                      </p>
                    </>
                  ) : latestWeeklyResults.myLottery.resultStatus ===
                    "ROLLED_OVER" ? (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.rolledOverTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {t("rewards.weekly.rolledOverDescription")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("rewards.weekly.notParticipatingTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--shell-copy)]">
                        {t("rewards.weekly.notParticipatingDescription")}
                      </p>
                    </>
                  )}
                </div>
              </GlassCard>

              <div className="grid gap-3 xl:grid-cols-2">
                <GlassCard className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-aura-primary" />
                    <h3 className="text-sm font-medium text-[var(--shell-title)]">
                      {t("rewards.weekly.winnersTitle")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {latestWeeklyResults.lotteryWinners.length ? (
                      latestWeeklyResults.lotteryWinners.map((winner) => (
                        <div
                          key={`${winner.userId}:${winner.prizeLabel}`}
                          className="flex items-center justify-between rounded-2xl border border-[var(--shell-border)] bg-[var(--glass-bg-strong)] px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-[var(--shell-title)]">
                              {t(`rewards.weekly.prize.${winner.prizeLabel}`)}
                            </p>
                            <p className="text-[10px] text-[var(--shell-text-soft)]">
                              {formatWalletAddress(winner.walletAddress)}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-[var(--shell-title)]">
                            {formatUsdtAtomic(winner.amountUsdt)} USDT
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--shell-text-soft)]">
                        {t("rewards.weekly.winnersEmpty")}
                      </p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-aura-primary" />
                    <h3 className="text-sm font-medium text-[var(--shell-title)]">
                      {t("rewards.weekly.rankingTitle")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {latestWeeklyResults.rankingEntries.length ? (
                      latestWeeklyResults.rankingEntries.map((entry) => (
                        <div
                          key={`${entry.userId}:${entry.rank}`}
                          className={cn(
                            "flex items-center justify-between rounded-2xl border px-3 py-2",
                            entry.isCurrentUser
                              ? "border-aura-primary/30 bg-aura-primary/10"
                              : "border-[var(--shell-border)] bg-[var(--glass-bg-strong)]",
                          )}
                        >
                          <div>
                            <p className="text-xs font-medium text-[var(--shell-title)]">
                              #{entry.rank}
                            </p>
                            <p className="text-[10px] text-[var(--shell-text-soft)]">
                              {formatWalletAddress(entry.walletAddress)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-[var(--shell-title)]">
                              {formatUsdtAtomic(entry.amountUsdt)} USDT
                            </p>
                            {entry.isCurrentUser ? (
                              <p className="text-[10px] text-aura-primary">
                                {t("rewards.weekly.you")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--shell-text-soft)]">
                        {t("rewards.weekly.rankingEmpty")}
                      </p>
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </section>

        {/* Reward Feed */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--shell-text-muted)]">
              {t("rewards.feed.title")}
            </h2>
            <span className="rounded-full bg-[var(--shell-inset)] px-2 py-0.5 text-[10px] font-bold text-[var(--shell-text-soft)]">
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
                const statusLabel = reward.claimStatus
                  ? t(`shared.promotion.claimStatus.${reward.claimStatus}`)
                  : reward.status === "CLAIMABLE"
                    ? t("shared.promotion.claimStatus.CLAIMABLE")
                    : reward.status === "CLAIMED"
                      ? t("shared.promotion.claimStatus.CLAIMED")
                      : reward.status === "VOIDED" || reward.status === "EXPIRED"
                        ? t("shared.promotion.claimStatus.VOIDED")
                        : t("shared.promotion.claimStatus.PENDING");
                const rewardAmountLabel = isAuraReward
                  ? `+${formatAuraAtomic(reward.amountAura)} ${t("shared.units.aura")}`
                  : `+${formatUsdtAtomic(reward.amountUsdt)} ${t("shared.units.usdt")}`;

                return (
                  <GlassCard key={reward.rewardId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            isAuraReward ? "bg-aura-primary/10" : "bg-blue-500/10",
                          )}
                        >
                          <Coins
                            className={cn(
                              "h-5 w-5",
                              isAuraReward ? "text-aura-primary" : "text-blue-400",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--shell-title)]">
                            {t(`shared.promotion.rewardType.${reward.rewardType}`)}
                          </p>
                          <p className="text-[10px] text-[var(--shell-text-soft)]">
                            {new Date(reward.createdAt).toLocaleString(locale)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[var(--shell-title)]">
                          {rewardAmountLabel}
                        </p>
                        <p className="text-[10px] text-[var(--shell-text-soft)]">
                          {statusLabel}
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
