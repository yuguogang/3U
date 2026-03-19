"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Hash,
  Clock,
  TrendingUp,
  Calendar,
  Check,
  Coins,
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import { promotionChainId } from "@/lib/promotion-contracts";
import { useSubmitCheckinMutation } from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function CheckinPage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { authAddress, hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const checkinMutation = useSubmitCheckinMutation();
  const [txHash, setTxHash] = useState("");

  const profile = profileQuery.data?.profile;
  const useAutomationInjectedWallet =
    process.env.NEXT_PUBLIC_E2E_INJECTED_WALLET === "true";
  const effectiveAddress =
    isConnected && address
      ? address
      : useAutomationInjectedWallet && isAuthenticated
      ? authAddress
      : null;
  const effectiveChainId =
    isConnected && chainId
      ? chainId
      : useAutomationInjectedWallet && isAuthenticated
      ? promotionChainId
      : undefined;
  const isWalletReady = Boolean(
    effectiveAddress && effectiveChainId && isAuthenticated,
  );

  const [cooldownTime, setCooldownTime] = useState(() => {
    const lastCheckinDateStr = profileQuery.data?.profile?.lastCheckinDate;
    if (!lastCheckinDateStr) return 0;
    const lastCheckinDate = new Date(lastCheckinDateStr);
    const now = new Date();
    const diff = now.getTime() - lastCheckinDate.getTime();
    return Math.max(0, Math.round(24 * 3600 - diff / 1000));
  });

  const canCheckin = useMemo(() => {
    const lastCheckinDateStr = profile?.lastCheckinDate;
    if (!lastCheckinDateStr) return true;
    const lastCheckinDate = new Date(lastCheckinDateStr);
    const now = new Date();
    const diff = now.getTime() - lastCheckinDate.getTime();
    const hoursPassed = diff / (1000 * 60 * 60);
    return hoursPassed >= 24;
  }, [profile?.lastCheckinDate]);

  useEffect(() => {
    const lastCheckinDateStr = profile?.lastCheckinDate;
    if (!lastCheckinDateStr) {
      return;
    }

    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          profileQuery.refetch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [profile?.lastCheckinDate, profileQuery]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isWalletReady || !txHash.trim()) return;

    await checkinMutation.mutateAsync({
      amountAtomic: "3000000",
      chainId: effectiveChainId!,
      payerAddress: effectiveAddress!,
      tokenSymbol: "USDT",
      txHash: txHash.trim(),
    });
    setTxHash("");
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Mock calendar data - TODO: Replace with real data from API
  const calendarDays = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    checked: i < (profile?.totalCheckinCount || 0),
    isToday: i === new Date().getDate() - 1,
  }));

  return (
    <MobileLayout eyebrow="Promotion / Check-In" title="Daily Check-in">
      <div className="space-y-6">
        {/* Big Check-in Button */}
        <section className="flex flex-col items-center py-8">
          <div
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center",
              "transition-all duration-500",
              canCheckin &&
                !checkinMutation.isPending &&
                "animate-pulse-glow",
              canCheckin
                ? "bg-gradient-to-br from-aura-primary to-aura-primary-dark"
                : "bg-white/10",
            )}
          >
            {checkinMutation.isPending ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                <span className="text-white font-medium">Submitting...</span>
              </div>
            ) : checkinMutation.isSuccess ? (
              <div className="flex flex-col items-center animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Success!</span>
                <span className="text-white/80 text-sm">+1000 AURA</span>
              </div>
            ) : canCheckin ? (
              <div className="flex flex-col items-center">
                <Calendar className="w-12 h-12 text-white mb-3" />
                <span className="text-white font-bold text-xl">Check In</span>
                <span className="text-white/70 text-sm mt-1">
                  Submit TX hash below
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Clock className="w-12 h-12 text-white/50 mb-3" />
                <span className="text-white/50 font-medium">Next in</span>
                <span className="text-white font-mono text-xl mt-1">
                  {formatTime(cooldownTime)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Submit Section */}
        {canCheckin && (
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <GlassCard variant="elevated" className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-aura-primary transition-colors">
                    <Hash className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="Paste 3 USDT transaction hash here"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl focus:border-aura-primary/50 transition-all"
                    disabled={checkinMutation.isPending || !isWalletReady}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-aura-primary to-aura-primary-dark font-bold shadow-glow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                  disabled={
                    !isWalletReady ||
                    !txHash.trim() ||
                    checkinMutation.isPending
                  }
                >
                  {checkinMutation.isPending
                    ? "Submitting..."
                    : "Submit & Earn 1000 AURA"}
                </Button>
              </form>

              {checkinMutation.isError && (
                <div className="mt-4 rounded-xl border border-aura-error/20 bg-aura-error/5 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 text-aura-error">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-xs font-medium">Submission failed</p>
                  </div>
                  <p className="mt-1 text-[10px] text-aura-error/70 leading-relaxed">
                    {checkinMutation.error.message}
                  </p>
                </div>
              )}
            </GlassCard>
          </section>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            label="Consecutive Days"
            value={profile?.currentStreakDays ?? 0}
            subValue="Keep it up!"
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
          />
          <StatCard
            label="Total Check-ins"
            value={profile?.totalCheckinCount ?? 0}
            subValue="Lifetime"
            icon={<Calendar className="w-5 h-5" />}
          />
        </section>

        {/* Progress to Next Reward */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-aura-primary" />
                <span className="text-sm text-white">Weekly Lottery Ticket</span>
              </div>
              <span className="text-xs text-aura-primary">
                {(profile?.currentStreakDays || 0) % 7}/7 days
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aura-primary to-aura-primary-light rounded-full transition-all duration-500"
                style={{
                  width: `${(((profile?.currentStreakDays || 0) % 7) / 7) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              Check in for {7 - ((profile?.currentStreakDays || 0) % 7)} more
              days to earn a lottery ticket
            </p>
          </GlassCard>
        </section>

        {/* Calendar */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">This Month</h2>
          <GlassCard className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs text-white/40 py-1"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm",
                    day.checked && "bg-aura-primary/20 text-aura-primary",
                    day.isToday && "ring-2 ring-aura-primary text-white",
                    !day.checked && !day.isToday && "text-white/50",
                  )}
                >
                  {day.checked ? <Check className="w-4 h-4" /> : day.day}
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>
    </MobileLayout>
  );
}
