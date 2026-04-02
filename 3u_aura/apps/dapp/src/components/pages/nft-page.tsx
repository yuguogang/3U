"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Gem,
  ShieldAlert,
  ShoppingBag,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { GoldmintEmblem } from "@/components/branding/goldmint-emblem";
import { GoldmintShieldCard } from "@/components/branding/goldmint-shield-card";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import {
  erc20Abi,
  isPromotionChain,
  nftSaleAbi,
  promotionChainId,
  promotionContracts,
} from "@/lib/promotion-contracts";
import { NftEligibilityStatus } from "3u-aura-common";
import {
  formatPercent,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import { usePromotionContractState } from "@/hooks/use-promotion-contract-state";
import {
  useCurrentEligibilityQuery,
  useReferralMintSignatureMutation,
} from "@/queries/promotion.query";
import {
  useSyncMyPurchasedNftMutation,
  useSyncMyReferralNftMutation,
} from "@/queries/claims.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function NftPage() {
  const t = useTranslations("Common");
  const chainId = useChainId();
  const { address } = useAccount();
  const { authAddress, hasHydrated, isAuthenticated } = useAuthStore();
  const useAutomationInjectedWallet =
    process.env.NEXT_PUBLIC_E2E_INJECTED_WALLET === "true";
  const hasAutomationSession =
    useAutomationInjectedWallet && hasHydrated && isAuthenticated;
  const effectiveAddress =
    address ?? (hasAutomationSession ? authAddress ?? undefined : undefined);
  const effectiveReadChainId = hasAutomationSession
    ? promotionChainId
    : chainId;
  const contractState = usePromotionContractState(
    effectiveAddress as `0x${string}` | undefined,
  );
  const eligibilityQuery = useCurrentEligibilityQuery(
    effectiveAddress ?? undefined,
    Boolean(isAuthenticated && hasHydrated && effectiveAddress),
  );
  const signatureMutation = useReferralMintSignatureMutation();
  const syncPurchasedNftMutation = useSyncMyPurchasedNftMutation();
  const syncReferralNftMutation = useSyncMyReferralNftMutation();
  const approveWrite = useWriteContract();
  const buyWrite = useWriteContract();
  const referralMintWrite = useWriteContract();
  const [cardFace, setCardFace] = useState<"front" | "back" | "detail">("front");
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [buyHash, setBuyHash] = useState<`0x${string}` | undefined>();
  const [referralMintHash, setReferralMintHash] = useState<
    `0x${string}` | undefined
  >();

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const buyReceipt = useWaitForTransactionReceipt({
    hash: buyHash,
  });
  const referralMintReceipt = useWaitForTransactionReceipt({
    hash: referralMintHash,
  });

  const purchasePrice = contractState.purchasePrice ?? BigInt(0);
  const allowance = contractState.allowance ?? BigInt(0);
  const nftBalance = contractState.nftBalance ?? BigInt(0);
  const usdtBalance = contractState.usdtBalance ?? BigInt(0);
  const purchasedRemaining =
    contractState.remainingSupply?.purchasedRemaining ?? BigInt(0);
  const referralMinted =
    BigInt(70) - (contractState.remainingSupply?.referralRemaining ?? BigInt(70));
  const nftSaleAddress = promotionContracts.nftSaleAddress;
  const paymentTokenAddress = promotionContracts.paymentTokenAddress;
  const isCorrectReadChain = isPromotionChain(effectiveReadChainId);
  const isCorrectWriteChain = isPromotionChain(chainId);
  const eligibility = eligibilityQuery.data;
  const eligibilityStatusLabel = eligibility?.status
    ? t(`shared.promotion.eligibilityStatus.${eligibility.status}`)
    : t("shared.promotion.eligibilityStatus.LOCKED");
  const canMintReferralNft =
    eligibility?.status === NftEligibilityStatus.APPROVED ||
    eligibility?.status === NftEligibilityStatus.EXPIRED ||
    eligibility?.status === NftEligibilityStatus.SIGNED;
  
  const checkinProgress = eligibility
    ? formatPercent(
        eligibility.personalCheckinCount,
        eligibility.requiredCheckinCount,
      )
    : 0;
  const smallLegProgress = eligibility
    ? formatPercent(
        Number(eligibility.smallLegVolumeUsdt) || 0,
        Number(eligibility.requiredSmallLegUsdt) || 1,
      )
    : 0;

  const isApprovalSatisfied =
    allowance >= purchasePrice && purchasePrice > BigInt(0);
  const {
    refetchAllowance,
    refetchNftBalance,
    refetchRemainingSupply,
    refetchUsdtBalance,
  } =
    contractState;
  const isApproveConfirmed = approveReceipt.isSuccess;
  const isBuyConfirmed = buyReceipt.isSuccess;
  const shieldCardCopy = {
    frontRibbon: t("nft.purchased.frontRibbon"),
    frontSubtitle: t("nft.purchased.frontSubtitle"),
    backBadge: t("nft.purchased.backBadge"),
    backSerialLabel: t("nft.purchased.backSerialLabel"),
    backTierLabel: t("nft.purchased.backTierLabel"),
    backTierValue: t("nft.purchased.backTierValue"),
    backRightsLabel: t("nft.purchased.backRightsLabel"),
    backLedgerLabel: t("nft.purchased.backLedgerLabel"),
    backRegistryLabel: t("nft.purchased.backRegistryLabel"),
    backRegistryValue: t("nft.purchased.backRegistryValue"),
    detailBadge: t("nft.purchased.detailBadge"),
    detailSubtitle: t("nft.purchased.detailSubtitle"),
    detailLabelSurface: t("nft.purchased.detailLabelSurface"),
    detailValueSurface: t("nft.purchased.detailValueSurface"),
    detailLabelCore: t("nft.purchased.detailLabelCore"),
    detailValueCore: t("nft.purchased.detailValueCore"),
    detailLabelSupply: t("nft.purchased.detailLabelSupply"),
    detailValueSupply: t("nft.purchased.detailValueSupply"),
    detailLabelClaim: t("nft.purchased.detailLabelClaim"),
    detailValueClaim: t("nft.purchased.detailValueClaim"),
    detailCertificateLabel: t("nft.purchased.detailCertificateLabel"),
    detailCertificateBody: t("nft.purchased.detailCertificateBody"),
    detailArchiveLabel: t("nft.purchased.detailArchiveLabel"),
    footerFront: t("nft.purchased.footerFront"),
    footerBack: t("nft.purchased.footerBack"),
    footerDetail: t("nft.purchased.footerDetail"),
  };

  useEffect(() => {
    if (!isApproveConfirmed) {
      return;
    }

    void refetchAllowance();
  }, [isApproveConfirmed, refetchAllowance]);

  useEffect(() => {
    if (!isBuyConfirmed) {
      return;
    }

    void Promise.all([
      buyHash
        ? syncPurchasedNftMutation.mutateAsync({ txHash: buyHash })
        : Promise.resolve(),
      refetchAllowance(),
      refetchNftBalance(),
      refetchRemainingSupply(),
      refetchUsdtBalance(),
    ]);
  }, [
    buyHash,
    isBuyConfirmed,
    refetchAllowance,
    refetchNftBalance,
    refetchRemainingSupply,
    refetchUsdtBalance,
    syncPurchasedNftMutation,
  ]);

  useEffect(() => {
    if (!referralMintReceipt.isSuccess) {
      return;
    }

    void Promise.all([
      referralMintHash
        ? syncReferralNftMutation.mutateAsync({ txHash: referralMintHash })
        : Promise.resolve(),
      refetchNftBalance(),
      refetchRemainingSupply(),
    ]);
  }, [
    referralMintHash,
    referralMintReceipt.isSuccess,
    refetchNftBalance,
    refetchRemainingSupply,
    syncReferralNftMutation,
  ]);

  const handleApprove = async () => {
    if (!purchasePrice || !paymentTokenAddress || !nftSaleAddress) return;
    const hash = await approveWrite.writeContractAsync({
      address: paymentTokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [nftSaleAddress, purchasePrice],
    });
    setApproveHash(hash);
  };

  const handleBuy = async () => {
    if (!nftSaleAddress) return;
    const hash = await buyWrite.writeContractAsync({
      address: nftSaleAddress,
      abi: nftSaleAbi,
      functionName: "buyNFT",
    });
    setBuyHash(hash);
  };

  const handleReferralMint = async () => {
    if (!effectiveAddress || !nftSaleAddress) return;
    const result = await signatureMutation.mutateAsync({
      chainId: promotionChainId,
      recipient: effectiveAddress,
    });

    const hash = await referralMintWrite.writeContractAsync({
      address: nftSaleAddress,
      abi: nftSaleAbi,
      functionName: "mintNFTByReferral",
      args: [
        BigInt(result.nonce),
        BigInt(result.expiry),
        result.signature as `0x${string}`,
      ],
    });
    setReferralMintHash(hash);
  };

  return (
    <MobileLayout
      eyebrow={t("nft.eyebrow")}
      title={t("nft.title")}
    >
      <div className="space-y-6">
        {/* NFT Overview */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t("nft.stats.purchasedMinted")}
              value={purchasedRemaining.toString()}
              icon={<ShoppingBag className="w-5 h-5" />}
            />
            <StatCard
              label={t("nft.stats.referralMinted")}
              value={referralMinted.toString()}
              unit="/ 70"
              icon={<Gem className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* My NFTs Summary */}
        <section className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-3">
              <p className="mb-1 text-xs text-[var(--shell-text-soft)]">{t("nft.summary.owned")}</p>
              <p className="text-2xl font-bold text-[var(--shell-title)] font-mono">
                {nftBalance.toString()}
              </p>
            </GlassCard>
            <GlassCard className="p-3">
              <p className="mb-1 text-xs text-[var(--shell-text-soft)]">{t("nft.summary.claimable")}</p>
              <p className="goldmint-heading font-brand text-2xl font-semibold">
                {canMintReferralNft ? "1" : "0"}
              </p>
            </GlassCard>
          </div>
        </section>

        {!isCorrectReadChain && (
          <GlassCard className="border border-[rgba(197,138,52,0.3)] bg-[rgba(197,138,52,0.1)] p-5">
            <div className="flex items-center gap-3 text-[#9d6a29]">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-sm font-medium">{t("shared.status.wrongNetwork")}</p>
            </div>
            <p className="mt-2 text-xs text-[var(--shell-text-muted)] leading-relaxed">
              {t("nft.wrongNetwork.description", { chainId: promotionChainId })}
            </p>
          </GlassCard>
        )}

        {/* Purchased NFT Section */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-medium text-[var(--shell-text-muted)] mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>{t("nft.purchased.sectionTitle")}</span>
          </h2>
          <div className="goldmint-bronze-panel goldmint-outline-card overflow-hidden rounded-[2.15rem] p-4 sm:p-5">
            <div className="grid gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d9bb7a]">
                    {t("nft.purchased.surfaceBadge")}
                  </p>
                  <h3 className="font-brand mt-2 text-[1.52rem] font-semibold leading-none text-[#fff0c7]">
                    {t("nft.purchased.cardTitle")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#ccb37d]">
                    {t("nft.purchased.cardDescription")}
                  </p>
                </div>
                <div className="goldmint-etched-plaque shrink-0 rounded-[1.15rem] px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a5a22]">
                    {t("nft.purchased.remaining")}
                  </p>
                  <p className="mt-1 text-lg font-mono font-semibold text-[#352315]">
                    {purchasedRemaining.toString()}
                  </p>
                </div>
              </div>

              <div className="goldmint-metal-stage rounded-[1.45rem] p-2">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["front", t("nft.purchased.previewFront")],
                    ["back", t("nft.purchased.previewBack")],
                    ["detail", t("nft.purchased.previewDetail")],
                  ] as const).map(([face, label]) => (
                    <button
                      key={face}
                      type="button"
                      onClick={() => setCardFace(face)}
                      className={cn(
                        "rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all",
                        cardFace === face
                          ? "goldmint-metal-button"
                          : "goldmint-toolbar-pill hover:brightness-[1.05]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <GoldmintShieldCard
                className="aspect-[4/5]"
                mode={cardFace}
                badge={t("nft.purchased.surfaceBadge")}
                footer={t("nft.purchased.cardTitle")}
                serialLabel={t("nft.purchased.serialLabel")}
                utilityItems={[
                  t("nft.purchased.utilityOne"),
                  t("nft.purchased.utilityTwo"),
                  t("nft.purchased.utilityThree"),
                ]}
                copy={shieldCardCopy}
              />

              <div className="goldmint-light-card goldmint-etched-plaque rounded-[1.7rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1 text-[#d2ae64]">
                      {[1, 2, 3, 4].map((star) => (
                        <Star key={star} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--shell-text-soft)]">
                      {isApprovalSatisfied
                        ? t("nft.purchased.purchaseHint")
                        : t("nft.purchased.approvalHelp")}
                    </p>
                  </div>
                  <div className="goldmint-pill rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--shell-badge-fg)]">
                    {isApprovalSatisfied
                      ? t("nft.purchased.approvalReady")
                      : t("nft.purchased.approvalHint")}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="goldmint-light-card goldmint-outline-card rounded-2xl border bg-[rgba(255,250,239,0.84)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--shell-text-soft)]">
                      {t("nft.purchased.price")}
                    </p>
                    <p className="mt-2 text-lg font-mono font-semibold text-[var(--shell-title)]">
                      {formatUsdtAtomic(purchasePrice)} USDT
                    </p>
                  </div>
                  <div className="goldmint-light-card goldmint-outline-card rounded-2xl border bg-[rgba(255,249,236,0.7)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--shell-text-soft)]">
                      {t("nft.purchased.yourBalance")}
                    </p>
                    <p className="mt-2 text-lg font-mono font-semibold text-[var(--shell-title)]">
                      {formatUsdtAtomic(usdtBalance)} USDT
                    </p>
                  </div>
                </div>

                <div className="goldmint-light-card goldmint-outline-card mt-3 rounded-2xl border bg-[rgba(255,250,239,0.84)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--shell-text-soft)]">
                        {t("nft.purchased.remaining")}
                      </p>
                      <p className="mt-2 text-lg font-mono font-semibold text-[var(--shell-title)]">
                        {purchasedRemaining.toString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface-strong)] px-3 py-1.5 text-[11px] font-medium text-[var(--shell-copy)]">
                      <GoldmintEmblem compact className="h-6 w-6" />
                      <span>
                        {isApprovalSatisfied
                          ? t("nft.purchased.approvalReady")
                          : t("nft.purchased.approvalHint")}
                      </span>
                    </div>
                  </div>
                </div>

                {!isApprovalSatisfied ? (
                  <Button
                    onClick={handleApprove}
                    className="goldmint-metal-button mt-5 h-12 w-full rounded-xl font-semibold hover:brightness-[1.02]"
                    disabled={approveWrite.isPending || !isCorrectWriteChain}
                  >
                    {approveWrite.isPending
                      ? t("nft.purchased.approving")
                      : t("nft.purchased.approveButton")}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuy}
                    className="goldmint-metal-button mt-5 h-12 w-full rounded-xl font-semibold hover:brightness-[1.02]"
                    disabled={buyWrite.isPending || !isCorrectWriteChain}
                  >
                    {buyWrite.isPending
                      ? t("nft.purchased.purchasing")
                      : t("nft.purchased.buyButton")}
                  </Button>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="goldmint-light-card goldmint-outline-card rounded-2xl border bg-[rgba(255,250,239,0.82)] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--shell-text-soft)]">
                      {t("nft.purchased.detailLabelSurface")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--shell-title)]">
                      {t("nft.purchased.detailValueSurface")}
                    </p>
                  </div>
                  <div className="goldmint-light-card goldmint-outline-card rounded-2xl border bg-[rgba(255,250,239,0.82)] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--shell-text-soft)]">
                      {t("nft.purchased.detailLabelFinish")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--shell-title)]">
                      {t("nft.purchased.detailValueFinish")}
                    </p>
                  </div>
                  <div className="goldmint-light-card goldmint-outline-card rounded-2xl border bg-[rgba(255,250,239,0.82)] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--shell-text-soft)]">
                      {t("nft.purchased.detailLabelClaim")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--shell-title)]">
                      {t("nft.purchased.detailValueClaim")}
                    </p>
                  </div>
                </div>

                {buyReceipt.isSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-aura-success/20 bg-aura-success/10 p-3 text-xs text-aura-success">
                    <CheckCircle2 className="w-4 h-4" />
                    {t("nft.purchased.success")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Referral NFT Section */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-medium text-[var(--shell-text-muted)] mb-3 flex items-center gap-2">
            <Gem className="w-4 h-4" />
            <span>{t("nft.referral.sectionTitle")}</span>
          </h2>
          <GlassCard className="goldmint-light-card goldmint-outline-card bg-[linear-gradient(180deg,rgba(255,252,244,0.98)_0%,rgba(236,223,194,0.9)_100%)] p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="goldmint-coin rounded-[1.25rem] p-2">
                  <GoldmintEmblem compact className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-brand text-[1.35rem] font-semibold leading-none text-[var(--shell-title)]">
                    {t("nft.referral.cardTitle")}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--shell-text-soft)]">
                    {t("nft.referral.cardDescription")}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]",
                  canMintReferralNft
                    ? "bg-aura-success/20 text-aura-success"
                    : "goldmint-pill text-[var(--shell-badge-fg)]",
                )}
              >
                {eligibilityStatusLabel}
              </div>
            </div>

            <div className="goldmint-light-card goldmint-outline-card rounded-[1.6rem] border bg-[linear-gradient(160deg,rgba(27,67,107,0.18),rgba(255,250,241,0.86))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.28em]">
                    <span className="text-[var(--shell-text-soft)]">
                      {t("nft.referral.personalCheckins")}
                    </span>
                    <span className="text-[var(--shell-copy)]">
                      {eligibility?.personalCheckinCount || 0} / {eligibility?.requiredCheckinCount || 30}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--shell-inset)]">
                    <div
                      className="h-full bg-[linear-gradient(90deg,#87602a_0%,#dcb469_48%,#8f6329_100%)] transition-all duration-500"
                      style={{ width: `${checkinProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.28em]">
                    <span className="text-[var(--shell-text-soft)]">
                      {t("nft.referral.smallLegVolume")}
                    </span>
                    <span className="text-[var(--shell-copy)]">
                      {formatUsdtAtomic(eligibility?.smallLegVolumeUsdt || "0")} /{" "}
                      {formatUsdtAtomic(eligibility?.requiredSmallLegUsdt || "6000000000")}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--shell-inset)]">
                    <div
                      className="h-full bg-[linear-gradient(90deg,#1a3f61_0%,#3b6f9a_50%,#17344d_100%)] transition-all duration-500"
                      style={{ width: `${smallLegProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleReferralMint}
              className={cn(
                "h-11 w-full rounded-xl font-semibold",
                canMintReferralNft
                  ? "goldmint-metal-button hover:brightness-[1.02]"
                  : "border border-[var(--shell-border)] bg-[var(--shell-inset)] text-[var(--shell-title)] hover:bg-[var(--shell-control-hover)]",
              )}
              disabled={!canMintReferralNft || referralMintWrite.isPending || !isCorrectWriteChain}
            >
              {referralMintWrite.isPending
                ? t("nft.referral.minting")
                : t("nft.referral.button")}
            </Button>

            <p className="text-xs leading-relaxed text-[var(--shell-text-soft)]">
              {canMintReferralNft
                ? t("nft.referral.readyHint")
                : t("nft.referral.lockedHint")}
            </p>

            {referralMintReceipt.isSuccess && (
              <div className="flex items-center gap-2 rounded-2xl border border-aura-success/20 bg-aura-success/10 p-3 text-xs text-aura-success">
                <CheckCircle2 className="w-4 h-4" />
                {t("nft.referral.success")}
              </div>
            )}
          </GlassCard>
        </section>

        {/* Benefits Info */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-sm font-medium text-[var(--shell-text-muted)] mb-3">{t("nft.benefits.title")}</h2>
          <div className="grid grid-cols-1 gap-3">
            <GlassCard className="p-4 flex items-start gap-4">
              <div className="goldmint-coin flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Zap className="w-5 h-5 text-aura-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--shell-title)]">{t("nft.benefits.weeklySubsidies.title")}</p>
                <p className="text-xs text-[var(--shell-text-soft)] leading-relaxed">{t("nft.benefits.weeklySubsidies.description")}</p>
              </div>
            </GlassCard>
            <GlassCard className="p-4 flex items-start gap-4">
              <div className="goldmint-coin flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <TrendingUp className="w-5 h-5 text-[#315f87]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--shell-title)]">{t("nft.benefits.revenueSharing.title")}</p>
                <p className="text-xs text-[var(--shell-text-soft)] leading-relaxed">{t("nft.benefits.revenueSharing.description")}</p>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
