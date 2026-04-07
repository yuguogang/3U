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
  Zap,
  Gift,
  Share2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { GoldmintEmblem } from "@/components/branding/goldmint-emblem";
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
  const claimableReferralMintCount =
    eligibilityQuery.data?.claimableMintCount ?? 0;
  const canMintReferralNft = claimableReferralMintCount > 0;
  const featureCards = [
    {
      href: "/checkin",
      title: t("dashboard.features.checkin.title"),
      description: t("dashboard.features.checkin.description"),
      icon: CalendarCheck2,
      color: "text-aura-primary",
      bgColor: "goldmint-pill",
    },
    {
      href: "/team",
      title: t("dashboard.features.team.title"),
      description: t("dashboard.features.team.description"),
      icon: Users,
      color: "text-[#2d668f]",
      bgColor: "border border-[rgba(45,102,143,0.18)] bg-[rgba(45,102,143,0.14)]",
    },
    {
      href: "/rewards",
      title: t("dashboard.features.rewards.title"),
      description: t("dashboard.features.rewards.description"),
      icon: Trophy,
      color: "text-[#94703a]",
      bgColor: "border border-[rgba(212,171,93,0.22)] bg-[rgba(212,171,93,0.18)]",
    },
    {
      href: "/nft",
      title: t("dashboard.features.nft.title"),
      description: t("dashboard.features.nft.description"),
      icon: Gem,
      color: "text-[#315f87]",
      bgColor: "border border-[rgba(41,88,130,0.22)] bg-[rgba(41,88,130,0.16)]",
    },
    {
      href: "/claims",
      title: t("dashboard.features.claims.title"),
      description: t("dashboard.features.claims.description"),
      icon: Gift,
      color: "text-[#3f8f5c]",
      bgColor: "border border-[rgba(63,143,92,0.18)] bg-[rgba(63,143,92,0.14)]",
    },
    {
      href: "/", // Placeholder
      title: t("dashboard.features.lottery.title"),
      description: t("dashboard.features.lottery.description", { count: 0 }),
      icon: Zap,
      color: "text-[#9d6a29]",
      bgColor: "border border-[rgba(197,138,52,0.18)] bg-[rgba(197,138,52,0.14)]",
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
          <GlassCard variant="highlight" className="goldmint-hero-panel goldmint-outline-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="goldmint-plaque flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] p-2">
                <GoldmintEmblem compact className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[#72491f]">
                    {t("dashboard.hero.totalAura")}
                  </p>
                  <div className="goldmint-bronze-chip rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]">
                    $GM
                  </div>
                </div>
                <h1 className="font-brand goldmint-heading mt-2 text-4xl font-semibold leading-none">
                  {formatAuraAtomic(totalAura.toString())}
                </h1>
                <p className="mt-2 text-sm text-[#845723]">
                  {t("dashboard.hero.approxUsd")}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <div className="goldmint-coin flex h-8 w-8 items-center justify-center rounded-full">
                    <TrendingUp className="w-4 h-4 text-aura-success" />
                  </div>
                  <span className="text-aura-success">{t("dashboard.hero.weeklyChange")}</span>
                  <span className="text-xs text-[var(--shell-text-soft)]">
                    {t("dashboard.hero.thisWeek")}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="goldmint-light-card goldmint-premium-tile rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--shell-text-soft)]">
                  {t("dashboard.stats.currentEpoch.label")}
                </p>
                <p className="mt-2 text-xl font-mono font-semibold text-[var(--shell-title)]">
                  #{epoch?.epochNo || 0}
                </p>
                <p className="mt-1 text-xs text-[var(--shell-text-soft)]">{epochStatusLabel}</p>
              </div>
              <div className="goldmint-light-card goldmint-premium-tile rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--shell-text-soft)]">
                  {t("dashboard.stats.smallLeg.label")}
                </p>
                <p className="mt-2 text-xl font-mono font-semibold text-[var(--shell-title)]">
                  {profile ? formatUsdtAtomic(profile.smallLegVolume) : "0"}
                </p>
                <p className="mt-1 text-xs text-[var(--shell-text-soft)]">
                  {t("dashboard.stats.smallLeg.subValue")}
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {!isConnected || !isAuthenticated ? (
          <GlassCard className="border border-[rgba(197,138,52,0.3)] bg-[rgba(197,138,52,0.1)] p-5">
            <div className="mb-3 flex items-center gap-3 text-[#9d6a29]">
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
              label={t("dashboard.milestones.nftEligibility.title")}
              value={claimableReferralMintCount.toString()}
              subValue={eligibilityStatusLabel}
              icon={<Gem className="w-5 h-5" />}
              className="col-span-2"
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
                  className="goldmint-light-card goldmint-premium-tile goldmint-outline-card p-4"
                  hoverEffect
                >
                  <Link href="/team">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="goldmint-coin flex h-10 w-10 items-center justify-center rounded-xl">
                          <Users className="w-5 h-5 text-[#2d668f]" />
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
                      <span className="text-xs font-medium text-[#2d668f]">
                        {t("shared.buttons.view")}
                      </span>
                    </div>
                  </Link>
                </GlassCard>
              )}

            <GlassCard variant="elevated" className="goldmint-bronze-panel goldmint-outline-card p-4" hoverEffect>
              <Link href="/nft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="goldmint-coin flex h-10 w-10 items-center justify-center rounded-xl">
                      <Zap className="w-5 h-5 text-aura-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#fff0c9]">
                        {t("dashboard.milestones.nftEligibility.title")}
                      </p>
                      <p className="text-xs text-[#d7be87]">
                        {eligibilityStatusLabel}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#f1d68a]">
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
                  <GlassCard
                    variant="interactive"
                    className="goldmint-light-card goldmint-premium-tile goldmint-outline-card h-full p-4"
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-10 w-10 items-center justify-center rounded-xl goldmint-coin",
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
          <GlassCard variant="highlight" className="goldmint-hero-panel goldmint-outline-card p-4">
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
                className="goldmint-metal-button hover:brightness-[1.02]"
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
