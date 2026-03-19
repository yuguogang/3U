"use client";

import Link from "next/link";
import { useMemo } from "react";
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
      BigInt(profile.totalAuraFromCheckin ?? "0") +
      BigInt(profile.totalAuraFromDirect ?? "0") +
      BigInt(profile.totalAuraFromIndirect ?? "0") +
      BigInt(profile.totalAuraFromConsolation ?? "0")
    );
  }, [profile]);

  const featureCards = [
    {
      href: "/checkin",
      title: "Daily Check-in",
      description: "Earn 1000 AURA daily",
      icon: CalendarCheck2,
      color: "text-aura-primary",
      bgColor: "bg-aura-primary/10",
    },
    {
      href: "/team",
      title: "My Team",
      description: "View network",
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      href: "/rewards",
      title: "Rewards",
      description: "View earnings",
      icon: Trophy,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      href: "/nft",
      title: "NFT Market",
      description: "Buy & Claim NFTs",
      icon: Gem,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      href: "/claims",
      title: "Claims",
      description: "Pending rewards",
      icon: Gift,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      href: "/", // Placeholder
      title: "Lottery",
      description: `0 tickets`,
      icon: Zap,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <MobileLayout eyebrow="Promotion Dashboard" title="AURA HUB">
      <div className="space-y-6">
        {/* Hero Stats */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="text-center">
              <p className="text-sm text-white/50 mb-2">
                Total Accumulated AURA
              </p>
              <h1 className="text-4xl font-bold font-mono mb-1 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                {formatAuraAtomic(totalAura.toString())}
              </h1>
              <p className="text-sm text-white/40">≈ $0.00 USD</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <TrendingUp className="w-4 h-4 text-aura-success" />
                <span className="text-sm text-aura-success">+0.0%</span>
                <span className="text-xs text-white/40 ml-1">this week</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {!isConnected || !isAuthenticated ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="mb-3 flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="text-sm font-semibold">Wallet sign-in required</h2>
            </div>
            <p className="mb-4 text-xs leading-5 text-amber-100/60">
              Please connect your wallet and sign the message to access your
              personalized dashboard and rewards.
            </p>
          </GlassCard>
        ) : null}

        {/* Stats Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Current Epoch"
              value={`#${epoch?.epochNo || 0}`}
              subValue={epoch?.status || "Loading..."}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label="Small Leg Volume"
              value={profile ? formatUsdtAtomic(profile.smallLegVolume) : "0"}
              unit="USDT"
              subValue="Current Progress"
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
          <h2 className="text-sm font-medium text-white/70">
            Milestones & Alerts
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
                          <p className="text-sm font-medium text-white">
                            Pending Placements
                          </p>
                          <p className="text-xs text-blue-100/50">
                            {pendingPlacementQuery.data.length} users waiting for
                            tree placement
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-400 font-medium">
                        View
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
                      <p className="text-sm font-medium text-white">
                        NFT Eligibility
                      </p>
                      <p className="text-xs text-white/50">
                        {eligibilityQuery.data?.status || "Checking..."}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 font-medium">
                    Details
                  </span>
                </div>
              </Link>
            </GlassCard>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <GlassCard variant="interactive" className="p-4 h-full">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                        card.bgColor,
                      )}
                    >
                      <Icon className={cn("w-5 h-5", card.color)} />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/50">{card.description}</p>
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
                <h3 className="text-sm font-medium text-white mb-1">
                  Invite Friends
                </h3>
                <p className="text-xs text-white/50">
                  Earn 10% from direct referrals
                </p>
              </div>
              <Button
                size="sm"
                className="bg-aura-primary hover:bg-aura-primary-dark"
                asChild
              >
                <Link href="/team">
                  Share
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
