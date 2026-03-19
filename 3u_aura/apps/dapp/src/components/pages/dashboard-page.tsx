"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  Gem,
  ShieldAlert,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Zap,
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

  const quickActions = [
    { 
      href: "/checkin", 
      label: "Check-in", 
      icon: CalendarCheck2, 
      color: "bg-aura-primary",
    },
    { 
      href: "/team", 
      label: "Team", 
      icon: Users, 
      color: "bg-blue-500",
    },
    { 
      href: "/rewards", 
      label: "Rewards", 
      icon: Trophy, 
      color: "bg-yellow-500",
    },
    { 
      href: "/nft", 
      label: "NFT", 
      icon: Gem, 
      color: "bg-purple-500",
    },
  ];

  return (
    <MobileLayout
      eyebrow="Promotion Dashboard"
      title="AURA HUB"
    >
      <div className="space-y-6">
        {/* Hero Stats */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="text-center">
              <p className="text-sm text-white/50 mb-2">Total Earnings (AURA)</p>
              <h1 className="text-4xl font-bold font-mono mb-1 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                {profile ? formatAuraAtomic(profile.totalAuraFromCheckin) : "0.00"}
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
              Please connect your wallet and sign the message to access your personalized dashboard and rewards.
            </p>
          </GlassCard>
        ) : null}

        {/* Quick Actions */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200",
                    "group-hover:scale-105 group-active:scale-95",
                    action.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-white/60 group-hover:text-white/90 transition-colors">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Current Epoch"
              value={`#${epoch?.epochNo || 0}`}
              subValue={epoch?.status || "Loading..."}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label="Small Leg Vol"
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
        <section className="animate-slide-up space-y-3" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-sm font-medium text-white/70">Milestones & Alerts</h2>
          <div className="grid grid-cols-1 gap-3">
            {pendingPlacementQuery.data && pendingPlacementQuery.data.length > 0 && (
              <GlassCard variant="elevated" className="p-4 border-blue-500/20 bg-blue-500/5" onClick={() => {}} hoverEffect>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Pending Placements</p>
                      <p className="text-xs text-blue-100/50">
                        {pendingPlacementQuery.data.length} users waiting for tree placement
                      </p>
                    </div>
                  </div>
                  <Link href="/team" className="text-xs text-blue-400 font-medium">View</Link>
                </div>
              </GlassCard>
            )}

            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">NFT Eligibility</p>
                    <p className="text-xs text-white/50">
                      {eligibilityQuery.data?.status || "Checking..."}
                    </p>
                  </div>
                </div>
                <Link href="/nft" className="text-xs text-orange-400 font-medium">Details</Link>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
