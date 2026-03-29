"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarCheck2,
  Gem,
  ShieldAlert,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Zap,
  Gift,
  Share2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import {
  formatAuraAtomic,
  parseAtomicToBigInt,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import {
  useCurrentEligibilityQuery,
  useCurrentEpochQuery,
  usePendingPlacementsQuery,
} from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const t = useTranslations("Common");
  const { address, isConnected } = useAccount();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const epochQuery = useCurrentEpochQuery();
  const eligibilityQuery = useCurrentEligibilityQuery(
    address,
    Boolean(isAuthenticated && hasHydrated && address),
  );
  const pendingPlacementQuery = usePendingPlacementsQuery(
    isAuthenticated && hasHydrated,
  );

  const profile = profileQuery.data?.profile;
  const epoch = epochQuery.data;

  const totalAura = useMemo(() => {
    if (!profile) return BigInt(0);
    return (
      parseAtomicToBigInt(profile.totalAuraFromCheckin) +
      parseAtomicToBigInt(profile.totalAuraFromDirect) +
      parseAtomicToBigInt(profile.totalAuraFromIndirect) +
      parseAtomicToBigInt(profile.totalAuraFromConsolation)
    );
  }, [profile]);

  const epochStatusLabel = epoch?.status
    ? t(`shared.promotion.epochStatus.${epoch.status}`)
    : t("shared.status.loading");
  const eligibilityStatusLabel = eligibilityQuery.data?.status
    ? t(`shared.promotion.eligibilityStatus.${eligibilityQuery.data.status}`)
    : t("shared.status.checking");
  const featureCards = [
    {
      href: "/checkin",
      title: t("dashboard.features.checkin.title"),
      description: t("dashboard.features.checkin.description"),
      icon: CalendarCheck2,
      color: "text-aura-primary",
      bgColor: "bg-aura-primary/10",
    },
    {
      href: "/team",
      title: t("dashboard.features.team.title"),
      description: t("dashboard.features.team.description"),
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      href: "/rewards",
      title: t("dashboard.features.rewards.title"),
      description: t("dashboard.features.rewards.description"),
      icon: Trophy,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      href: "/nft",
      title: t("dashboard.features.nft.title"),
      description: t("dashboard.features.nft.description"),
      icon: Gem,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      href: "/claims",
      title: t("dashboard.features.claims.title"),
      description: t("dashboard.features.claims.description"),
      icon: Gift,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      href: "/", // Placeholder
      title: t("dashboard.features.lottery.title"),
      description: t("dashboard.features.lottery.description", { count: 0 }),
      icon: Zap,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <MobileLayout
      eyebrow={t("dashboard.eyebrow")}
      title={t("dashboard.title")}
    >
      <div className="space-y-6">
        {/* Hero Stats */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="text-center">
              <p className="mb-2 text-sm text-[var(--shell-text-soft)]">
                {t("dashboard.hero.totalAura")}
              </p>
              <h1
                className="mb-1 bg-clip-text text-4xl font-bold font-mono text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--shell-heading-gradient-start), var(--shell-heading-gradient-end))",
                }}
              >
                {formatAuraAtomic(totalAura.toString())}
              </h1>
              <p className="text-sm text-[var(--shell-text-soft)]">{t("dashboard.hero.approxUsd")}</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <TrendingUp className="w-4 h-4 text-aura-success" />
                <span className="text-sm text-aura-success">{t("dashboard.hero.weeklyChange")}</span>
                <span className="ml-1 text-xs text-[var(--shell-text-soft)]">{t("dashboard.hero.thisWeek")}</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {!isConnected || !isAuthenticated ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="mb-3 flex items-center gap-3 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="text-sm font-semibold">{t("dashboard.auth.title")}</h2>
            </div>
            <p className="mb-4 text-xs leading-5 text-[var(--shell-text-muted)]">
              {t("dashboard.auth.description")}
            </p>
          </GlassCard>
        ) : null}

        {/* Stats Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t("dashboard.stats.currentEpoch.label")}
              value={`#${epoch?.epochNo || 0}`}
              subValue={epochStatusLabel}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label={t("dashboard.stats.smallLeg.label")}
              value={profile ? formatUsdtAtomic(profile.smallLegVolume) : "0"}
              unit="USDT"
              subValue={t("dashboard.stats.smallLeg.subValue")}
              icon={<Users className="w-5 h-5" />}
              trend="up"
              change={{ value: 0, type: "neutral" }}
            />
          </div>
        </section>

        {/* Team & NFT Info */}
        <section
          className="animate-slide-up space-y-3"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-sm font-medium text-[var(--shell-text-muted)]">
            {t("dashboard.milestones.title")}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {pendingPlacementQuery.data &&
              pendingPlacementQuery.data.length > 0 && (
                <GlassCard
                  variant="elevated"
                  className="p-4 border-blue-500/20 bg-blue-500/5"
                  hoverEffect
                >
                  <Link href="/team">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--shell-title)]">
                            {t("dashboard.milestones.pendingPlacements.title")}
                          </p>
                          <p className="text-xs text-[var(--shell-text-soft)]">
                            {t("dashboard.milestones.pendingPlacements.description", {
                              count: pendingPlacementQuery.data.length,
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-400 font-medium">
                        {t("shared.buttons.view")}
                      </span>
                    </div>
                  </Link>
                </GlassCard>
              )}

            <GlassCard variant="elevated" className="p-4" hoverEffect>
              <Link href="/nft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--shell-title)]">
                        {t("dashboard.milestones.nftEligibility.title")}
                      </p>
                      <p className="text-xs text-[var(--shell-text-soft)]">
                        {eligibilityStatusLabel}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 font-medium">
                    {t("shared.buttons.details")}
                  </span>
                </div>
              </Link>
            </GlassCard>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="mb-3 text-sm font-medium text-[var(--shell-text-muted)]">{t("dashboard.features.title")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <GlassCard variant="interactive" className="h-full p-4">
                    <div
                      className={cn(
                        "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
                        card.bgColor,
                      )}
                    >
                      <Icon className={cn("w-5 h-5", card.color)} />
                    </div>
                    <h3 className="mb-1 text-sm font-medium text-[var(--shell-title)]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[var(--shell-text-soft)]">{card.description}</p>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Referral Banner */}
        <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-1 text-sm font-medium text-[var(--shell-title)]">
                  {t("dashboard.referral.title")}
                </h3>
                <p className="text-xs text-[var(--shell-text-soft)]">
                  {t("dashboard.referral.description")}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-aura-primary hover:bg-aura-primary-dark"
                asChild
              >
                <Link href="/team">
                  {t("shared.buttons.share")}
                  <Share2 className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </GlassCard>
        </section>
      </div>
    </MobileLayout>
  );
}
