"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Hash,
  TrendingUp,
  Calendar,
  Check,
  Coins,
  ArrowRight,
  Wallet,
} from "lucide-react";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import {
  erc20Abi,
  promotionChainId,
  promotionContracts,
} from "@/lib/promotion-contracts";
import { useSubmitCheckinMutation } from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function CheckinPage() {
  const CHECKIN_AMOUNT_ATOMIC = "3000000";
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { authAddress, hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const checkinMutation = useSubmitCheckinMutation();
  const transferWrite = useWriteContract();
  const [transferHash, setTransferHash] = useState<`0x${string}` | undefined>();
  const transferReceipt = useWaitForTransactionReceipt({
    hash: transferHash,
  });
  const [txHash, setTxHash] = useState("");
  const [manualRecoveryRequested, setManualRecoveryRequested] = useState(false);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const submittedAutoCheckinHashRef = useRef<string | null>(null);

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
  const paymentTokenAddress = promotionContracts.paymentTokenAddress;
  const checkinReceiverAddress = promotionContracts.checkinReceiverAddress;
  const isCorrectWriteChain = effectiveChainId === promotionChainId;
  const directPayReady = Boolean(
    isWalletReady &&
      isCorrectWriteChain &&
      paymentTokenAddress &&
      checkinReceiverAddress,
  );
  const isTransferring = transferWrite.isPending || transferReceipt.isLoading;
  const isSubmittingCheckin = checkinMutation.isPending;
  const isProcessing = isTransferring || isSubmittingCheckin;
  const showManualRecovery =
    manualRecoveryRequested ||
    transferReceipt.isError ||
    checkinMutation.isError;
  const canCheckin = true;
  const checkedInToday = (() => {
    if (!profile?.lastCheckinDate) {
      return false;
    }

    const lastCheckinDate = new Date(profile.lastCheckinDate);
    const now = new Date();

    return (
      lastCheckinDate.getFullYear() === now.getFullYear() &&
      lastCheckinDate.getMonth() === now.getMonth() &&
      lastCheckinDate.getDate() === now.getDate()
    );
  })();

  useEffect(() => {
    if (!showManualRecovery) {
      return;
    }

    manualInputRef.current?.focus();
  }, [showManualRecovery]);

  useEffect(() => {
    if (!transferReceipt.isSuccess || !transferHash || !isWalletReady) {
      return;
    }

    if (submittedAutoCheckinHashRef.current === transferHash) {
      return;
    }

    submittedAutoCheckinHashRef.current = transferHash;
    void checkinMutation.mutateAsync({
      amountAtomic: CHECKIN_AMOUNT_ATOMIC,
      chainId: effectiveChainId!,
      payerAddress: effectiveAddress!,
      tokenSymbol: "USDT",
      txHash: transferHash,
    });
  }, [
    effectiveAddress,
    effectiveChainId,
    isWalletReady,
    transferHash,
    transferReceipt.isSuccess,
    checkinMutation,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isWalletReady || !txHash.trim()) return;

    await checkinMutation.mutateAsync({
      amountAtomic: CHECKIN_AMOUNT_ATOMIC,
      chainId: effectiveChainId!,
      payerAddress: effectiveAddress!,
      tokenSymbol: "USDT",
      txHash: txHash.trim(),
    });
    setTxHash("");
  }

  async function handleDirectCheckin() {
    if (!paymentTokenAddress || !checkinReceiverAddress || !directPayReady) {
      return;
    }

    setManualRecoveryRequested(false);
    checkinMutation.reset();
    setTransferHash(undefined);
    submittedAutoCheckinHashRef.current = null;

    const hash = await transferWrite.writeContractAsync({
      address: paymentTokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [checkinReceiverAddress, BigInt(CHECKIN_AMOUNT_ATOMIC)],
    });
    setTransferHash(hash);
    setTxHash(hash);
  }

  const calendarDays = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const isToday = day === now.getDate();

      return {
        day,
        checked: checkedInToday && isToday,
        isToday,
      };
    });
  }, [checkedInToday]);

  return (
    <MobileLayout eyebrow="Promotion / Check-In" title="Daily Check-in">
      <div className="space-y-6">
        {/* Big Check-in Button */}
        <section className="flex flex-col items-center py-8">
          <button
            type="button"
            onClick={() => {
              if (canCheckin && !isProcessing && directPayReady) {
                void handleDirectCheckin();
                return;
              }

              setManualRecoveryRequested(true);
            }}
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center",
              "transition-all duration-500",
              canCheckin &&
                !isProcessing &&
                "animate-pulse-glow",
              canCheckin
                ? "bg-gradient-to-br from-aura-primary to-aura-primary-dark"
                : "bg-white/10",
              canCheckin && directPayReady && !isProcessing
                ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                : "cursor-default",
            )}
            disabled={!canCheckin || isProcessing}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                <span className="text-white font-medium">
                  {isTransferring ? "Waiting for payment..." : "Finalizing check-in..."}
                </span>
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
                <Wallet className="w-12 h-12 text-white mb-3" />
                <span className="text-white font-bold text-xl">Pay & Check In</span>
                <span className="text-white/70 text-sm mt-1">
                  {checkedInToday
                    ? "You can still check in today"
                    : "Tap to send 3 USDT"}
                </span>
              </div>
            ) : null}
          </button>
        </section>

        {canCheckin && (
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <GlassCard variant="elevated" className="p-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="mt-0.5 h-4 w-4 text-aura-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">
                        Direct check-in
                      </p>
                      <p className="text-xs leading-relaxed text-white/60">
                        Tap the red circle above to send 3 USDT directly from your wallet. After the transfer confirms, the page will automatically submit the tx hash to complete today&apos;s check-in.
                      </p>
                      {checkedInToday && (
                        <p className="text-[11px] leading-relaxed text-white/45">
                          You already checked in today. Additional same-day check-ins are still allowed, but they do not increase consecutive days.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => void handleDirectCheckin()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-aura-primary to-aura-primary-dark font-bold shadow-glow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                  disabled={!directPayReady || isProcessing}
                >
                  {isTransferring
                    ? "Waiting for wallet confirmation..."
                    : isSubmittingCheckin
                      ? "Submitting check-in..."
                      : "Pay 3 USDT & Check In"}
                </Button>

                {!directPayReady && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                    <div className="flex items-center gap-3 text-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-xs font-medium">
                        Connect wallet, sign in, and switch to chain {promotionChainId} to use direct check-in.
                      </p>
                    </div>
                  </div>
                )}

                {(showManualRecovery || transferReceipt.isError || checkinMutation.isError) && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 space-y-1">
                      <p className="text-sm font-medium text-white">
                        Manual recovery
                      </p>
                      <p className="text-xs leading-relaxed text-white/50">
                        If you already sent 3 USDT but automatic submission failed, paste the tx hash here to recover this check-in.
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-aura-primary transition-colors">
                          <Hash className="h-4 w-4" />
                        </div>
                        <Input
                          ref={manualInputRef}
                          placeholder="Paste 3 USDT transaction hash here"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl focus:border-aura-primary/50 transition-all"
                          disabled={isProcessing || !isWalletReady}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-white/8 border border-white/10 text-white hover:bg-white/12 font-bold"
                        disabled={!isWalletReady || !txHash.trim() || isProcessing}
                      >
                        {isSubmittingCheckin
                          ? "Submitting..."
                          : "Submit Existing TX Hash"}
                      </Button>
                    </form>
                  </div>
                )}
              </div>

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

              {transferReceipt.isError && (
                <div className="mt-4 rounded-xl border border-aura-error/20 bg-aura-error/5 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 text-aura-error">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-xs font-medium">Wallet transfer failed</p>
                  </div>
                  <p className="mt-1 text-[10px] text-aura-error/70 leading-relaxed">
                    The USDT transfer was not confirmed. If you already sent it from another wallet window, use manual recovery below.
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
