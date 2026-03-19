"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Hash, Wallet, Clock, TrendingUp, Calendar, ChevronLeft } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import {
  formatAuraAtomic,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import { promotionChainId } from "@/lib/promotion-contracts";
import { useSubmitCheckinMutation } from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CheckinPage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { authAddress, hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const checkinMutation = useSubmitCheckinMutation();
  const [txHash, setTxHash] = useState("");
  const [submittedTxHash, setSubmittedTxHash] = useState<string | null>(null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!effectiveAddress || !effectiveChainId) {
      return;
    }

    const trimmedTxHash = txHash.trim();
    await checkinMutation.mutateAsync({
      amountAtomic: "3000000",
      chainId: effectiveChainId,
      payerAddress: effectiveAddress,
      tokenSymbol: "USDT",
      txHash: trimmedTxHash,
    });
    setSubmittedTxHash(trimmedTxHash);
    setTxHash("");
  }

  return (
    <MobileLayout
      eyebrow="Promotion / Check-In"
      title="Daily Check-in"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Check-ins"
              value={profile?.totalCheckinCount ?? 0}
              subValue="Lifetime"
              icon={<Calendar className="w-5 h-5" />}
            />
            <StatCard
              label="Consecutive Days"
              value={profile?.currentStreakDays ?? 0}
              subValue="Keep it up!"
              icon={<TrendingUp className="w-5 h-5" />}
              trend="up"
            />
          </div>
        </section>

        {!isWalletReady ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Wallet connection & sign-in required.
              </p>
            </div>
          </GlassCard>
        ) : null}

        {/* Submit Section */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <GlassCard variant="elevated" className="p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-aura-primary/10">
                <CalendarCheck2 className="h-8 w-8 text-aura-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Submit Check-in</h2>
              <p className="mt-1 text-xs text-white/50">
                Paste your 3 USDT transaction hash below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-aura-primary transition-colors">
                  <Hash className="h-4 w-4" />
                </div>
                <Input
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl focus:border-aura-primary/50 transition-all"
                  disabled={checkinMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-aura-primary to-aura-primary-dark font-bold shadow-glow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                disabled={!isWalletReady || !txHash.trim() || checkinMutation.isPending}
              >
                {checkinMutation.isPending ? "Submitting..." : "Submit Receipt"}
              </Button>
            </form>

            {checkinMutation.isSuccess && submittedTxHash && (
              <div className="mt-4 rounded-xl border border-aura-success/20 bg-aura-success/5 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 text-aura-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-medium">Receipt submitted successfully!</p>
                </div>
                <p className="mt-2 truncate text-[10px] text-white/40 font-mono">
                  TX: {submittedTxHash}
                </p>
              </div>
            )}

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

        {/* Info Grid */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-1 gap-3">
            <GlassCard className="p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-orange-300/75 mb-4">
                Check-in rules
              </p>
              <div className="space-y-4 text-sm leading-6 text-white/60">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-orange-300">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">Amount</p>
                    <p className="text-xs">Pay 3 USDT to the promotion address.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-orange-300">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">Reward</p>
                    <p className="text-xs">Earn 1000 AURA per check-in (recorded on server).</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}

const CalendarCheck2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/>
  </svg>
);
