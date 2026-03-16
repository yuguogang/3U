"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Hash, Wallet } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, MobileLayout } from "@/components/layout/mobile-layout";
import {
  formatAuraAtomic,
  formatDateTime,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import { promotionChainId } from "@/lib/promotion-contracts";
import { useSubmitCheckinMutation } from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";

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

  const chainLabel = useMemo(() => {
    if (!effectiveChainId) {
      return `Target chain ${promotionChainId}`;
    }

    return effectiveChainId === promotionChainId
      ? `Connected chain ${effectiveChainId}`
      : `Connected chain ${effectiveChainId}, target ${promotionChainId}`;
  }, [effectiveChainId]);

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
      title="Submit daily check-in"
      description="This page submits a wallet-originated payment receipt to the server. The server now verifies the actual on-chain USDT transfer against the configured promotion token and receiver before any check-in is recorded."
    >
      <div className="space-y-4">
        {!isWalletReady ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/8 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Connect the wallet and complete sign-in before submitting a check-in receipt.
              </p>
            </div>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
              Check-in rules
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              <div className="flex items-start gap-3">
                <Wallet className="mt-1 h-4 w-4 text-orange-300" />
                <p>
                  Submit one confirmed 3 USDT payment receipt per action. The payer address must match the authenticated wallet.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="mt-1 h-4 w-4 text-orange-300" />
                <p>
                  Submission stays tx-hash based on the client, but the server now checks the on-chain receipt, token, receiver, payer, and fixed 3 USDT amount before confirming the check-in.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              <p>Fixed amount: {formatUsdtAtomic("3000000")} USDT</p>
              <p className="mt-2">AURA reward: {formatAuraAtomic("1000000000000000000000")}</p>
              <p className="mt-2">{chainLabel}</p>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
              Current profile
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Streak</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {profile?.currentStreakDays ?? 0}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Total check-ins</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {profile?.totalCheckinCount ?? 0}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Last check-in</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatDateTime(profile?.lastCheckinDate)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Paid total</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatUsdtAtomic(profile?.totalCheckinUsdt)}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
                Submit receipt
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Confirm a check-in tx hash
              </h2>
            </div>
            {checkinMutation.isSuccess && submittedTxHash ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Submitted
              </span>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="txHash">
                Tx hash
              </label>
              <Input
                id="txHash"
                data-testid="checkin-txhash-input"
                placeholder="0x..."
                value={txHash}
                onChange={(event) => setTxHash(event.target.value)}
              />
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              <p>Authenticated payer: {effectiveAddress ?? "-"}</p>
              <p className="mt-2">
                Server normalizes this into a deterministic `chainId:txHash` idempotency key.
              </p>
            </div>
            {checkinMutation.error ? (
              <p className="text-sm text-rose-300">
                {checkinMutation.error instanceof Error
                  ? checkinMutation.error.message
                  : "Check-in submission failed"}
              </p>
            ) : null}
            <Button
              data-testid="checkin-submit-button"
              className="h-11 rounded-2xl px-6"
              disabled={
                !isWalletReady ||
                checkinMutation.isPending ||
                !txHash.trim()
              }
              type="submit"
            >
              {checkinMutation.isPending ? "Submitting..." : "Submit Check-In"}
            </Button>
          </form>
        </GlassCard>
      </div>
    </MobileLayout>
  );
}
