"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  Hash,
  TrendingUp,
  Calendar,
  Check,
  Coins,
  ArrowRight,
  Ticket,
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
import {
  useCurrentLotteryQuery,
  useParticipateLotteryMutation,
  useSubmitCheckinMutation,
} from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function CheckinPage() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const CHECKIN_AMOUNT_ATOMIC = "3000000";
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { authAddress, hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const currentLotteryQuery = useCurrentLotteryQuery(
    isAuthenticated && hasHydrated,
  );
  const participateLotteryMutation = useParticipateLotteryMutation();
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
  const currentLottery = currentLotteryQuery.data;
  const lotteryStreakDays =
    currentLottery?.currentStreakDays ?? (profile?.currentStreakDays || 0) % 7;
  const lotteryProgressDays = Math.min(lotteryStreakDays, 7);
  const remainingLotteryDays = Math.max(0, 7 - lotteryStreakDays);
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
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const sunday = new Date(Date.UTC(2024, 0, 7));
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(sunday.getTime() + index * 24 * 60 * 60 * 1000)),
    );
  }, [locale]);

  return (
    <MobileLayout
      eyebrow={t("checkin.eyebrow")}
      title={t("checkin.title")}
    >
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
                  {isTransferring
                    ? t("checkin.hero.waitingForPayment")
                    : t("checkin.hero.finalizing")}
                </span>
              </div>
            ) : checkinMutation.isSuccess ? (
              <div className="flex flex-col items-center animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-bold text-lg">{t("checkin.hero.success")}</span>
                <span className="text-white/80 text-sm">{t("checkin.hero.successReward")}</span>
              </div>
            ) : canCheckin ? (
              <div className="flex flex-col items-center">
                <Wallet className="w-12 h-12 text-white mb-3" />
                <span className="text-white font-bold text-xl">{t("checkin.hero.payAndCheckIn")}</span>
                <span className="text-white/70 text-sm mt-1">
                  {checkedInToday
                    ? t("checkin.hero.checkedToday")
                    : t("checkin.hero.tapToSend")}
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
                        {t("checkin.direct.title")}
                      </p>
                      <p className="text-xs leading-relaxed text-white/60">
                        {t("checkin.direct.description")}
                      </p>
                      {checkedInToday && (
                        <p className="text-[11px] leading-relaxed text-white/45">
                          {t("checkin.direct.checkedTodayNotice")}
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
                    ? t("checkin.direct.waitingWallet")
                    : isSubmittingCheckin
                      ? t("checkin.direct.submitting")
                      : t("checkin.direct.button")}
                </Button>

                {!directPayReady && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                    <div className="flex items-center gap-3 text-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-xs font-medium">
                        {t("checkin.direct.walletWarning", { chainId: promotionChainId })}
                      </p>
                    </div>
                  </div>
                )}

                {(showManualRecovery || transferReceipt.isError || checkinMutation.isError) && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 space-y-1">
                      <p className="text-sm font-medium text-white">
                        {t("checkin.manual.title")}
                      </p>
                      <p className="text-xs leading-relaxed text-white/50">
                        {t("checkin.manual.description")}
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-aura-primary transition-colors">
                          <Hash className="h-4 w-4" />
                        </div>
                        <Input
                          ref={manualInputRef}
                          placeholder={t("checkin.manual.placeholder")}
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
                          ? t("checkin.manual.submitting")
                          : t("checkin.manual.button")}
                      </Button>
                    </form>
                  </div>
                )}
              </div>

              {checkinMutation.isError && (
                <div className="mt-4 rounded-xl border border-aura-error/20 bg-aura-error/5 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 text-aura-error">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-xs font-medium">{t("checkin.errors.submissionTitle")}</p>
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
                    <p className="text-xs font-medium">{t("checkin.errors.transferTitle")}</p>
                  </div>
                  <p className="mt-1 text-[10px] text-aura-error/70 leading-relaxed">
                    {t("checkin.errors.transferDescription")}
                  </p>
                </div>
              )}
            </GlassCard>
          </section>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            label={t("checkin.stats.streak.label")}
            value={profile?.currentStreakDays ?? 0}
            subValue={t("checkin.stats.streak.subValue")}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
          />
          <StatCard
            label={t("checkin.stats.total.label")}
            value={profile?.totalCheckinCount ?? 0}
            subValue={t("checkin.stats.total.subValue")}
            icon={<Calendar className="w-5 h-5" />}
          />
        </section>

        {/* Progress to Next Reward */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-aura-primary" />
                <span className="text-sm text-white">{t("checkin.lottery.title")}</span>
              </div>
              <span className="text-xs text-aura-primary">
                {t("checkin.lottery.progress", {
                  current: lotteryProgressDays,
                })}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aura-primary to-aura-primary-light rounded-full transition-all duration-500"
                style={{
                  width: `${(lotteryProgressDays / 7) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              {t("checkin.lottery.remaining", {
                count: remainingLotteryDays,
              })}
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8">
                    <Ticket className="h-5 w-5 text-aura-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {t("checkin.lottery.optInTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      {currentLottery?.isParticipating
                        ? currentLottery.isCurrentlyQualified
                          ? t("checkin.lottery.joinedQualified")
                          : t("checkin.lottery.joinedPending")
                        : t("checkin.lottery.optInDescription")}
                    </p>
                  </div>
                </div>
                {currentLottery?.isParticipating ? (
                  <span className="rounded-full border border-aura-primary/30 bg-aura-primary/10 px-2.5 py-1 text-[10px] font-semibold text-aura-primary">
                    {t("checkin.lottery.joinedBadge")}
                  </span>
                ) : null}
              </div>

              {currentLotteryQuery.error instanceof Error ? (
                <p className="mt-3 text-xs text-aura-error">
                  {currentLotteryQuery.error.message}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {currentLottery?.canParticipate ? (
                  <Button
                    type="button"
                    className="h-10 rounded-xl bg-aura-primary text-black hover:bg-aura-primary-light"
                    disabled={participateLotteryMutation.isPending}
                    onClick={() => participateLotteryMutation.mutate({})}
                  >
                    {participateLotteryMutation.isPending
                      ? t("checkin.lottery.joining")
                      : t("checkin.lottery.joinButton")}
                  </Button>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50">
                    {currentLottery?.isParticipating
                      ? currentLottery.isCurrentlyQualified
                        ? t("checkin.lottery.qualifiedBadge")
                        : t("checkin.lottery.pendingBadge")
                      : isAuthenticated
                        ? t("checkin.lottery.waitingEpoch")
                        : t("checkin.lottery.signInHint")}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Calendar */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">{t("checkin.calendar.title")}</h2>
          <GlassCard className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((day, i) => (
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
