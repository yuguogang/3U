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
  const purchasedMinted =
    BigInt(30) - (contractState.remainingSupply?.purchasedRemaining ?? BigInt(30));
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
              value={purchasedMinted.toString()}
              unit="/ 30"
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
              <p className="text-xs text-[var(--shell-text-soft)] mb-1">{t("nft.summary.owned")}</p>
              <p className="text-2xl font-bold text-[var(--shell-title)] font-mono">
                {nftBalance.toString()}
              </p>
            </GlassCard>
            <GlassCard className="p-3">
              <p className="text-xs text-[var(--shell-text-soft)] mb-1">{t("nft.summary.claimable")}</p>
              <p className="text-2xl font-bold text-aura-primary font-mono">
                {canMintReferralNft ? "1" : "0"}
              </p>
            </GlassCard>
          </div>
        </section>

        {!isCorrectReadChain && (
          <GlassCard className="border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="flex items-center gap-3 text-amber-500">
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
          <GlassCard variant="elevated" className="overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-aura-primary/20 to-aura-primary-dark/20 flex items-center justify-center relative">
              <div className="absolute top-4 left-4 flex gap-0.5">
                {[1,2,3,4].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                LEGENDARY
              </div>
              <Gem className="w-24 h-24 text-aura-primary opacity-50" />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--shell-title)]">{t("nft.purchased.cardTitle")}</h3>
                <p className="text-xs text-[var(--shell-text-soft)]">{t("nft.purchased.cardDescription")}</p>
              </div>
              
              <div className="flex items-center justify-between py-3 border-y border-[var(--shell-border)]">
                <div>
                  <p className="text-[10px] text-[var(--shell-text-soft)] uppercase">{t("nft.purchased.price")}</p>
                  <p className="text-lg font-mono font-bold text-[var(--shell-title)]">{formatUsdtAtomic(purchasePrice)} USDT</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--shell-text-soft)] uppercase">{t("nft.purchased.yourBalance")}</p>
                  <p className="text-sm font-mono text-[var(--shell-copy)]">{formatUsdtAtomic(usdtBalance)} USDT</p>
                </div>
              </div>

              {!isApprovalSatisfied ? (
                <Button
                  onClick={handleApprove}
                  className="w-full h-12 bg-[var(--shell-badge-bg)] text-[var(--shell-badge-fg)] hover:opacity-90 font-bold rounded-xl"
                  disabled={approveWrite.isPending || !isCorrectWriteChain}
                >
                  {approveWrite.isPending ? t("nft.purchased.approving") : t("nft.purchased.approveButton")}
                </Button>
              ) : (
                <Button
                  onClick={handleBuy}
                  className="w-full h-12 bg-gradient-to-r from-aura-primary to-aura-primary-dark text-white font-bold rounded-xl shadow-glow-sm"
                  disabled={buyWrite.isPending || !isCorrectWriteChain}
                >
                  {buyWrite.isPending ? t("nft.purchased.purchasing") : t("nft.purchased.buyButton")}
                </Button>
              )}

              {buyReceipt.isSuccess && (
                <div className="p-3 rounded-lg bg-aura-success/10 border border-aura-success/20 text-aura-success text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t("nft.purchased.success")}
                </div>
              )}
            </div>
          </GlassCard>
        </section>

        {/* Referral NFT Section */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-medium text-[var(--shell-text-muted)] mb-3 flex items-center gap-2">
            <Gem className="w-4 h-4" />
            <span>{t("nft.referral.sectionTitle")}</span>
          </h2>
          <GlassCard className="p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-[var(--shell-title)]">{t("nft.referral.cardTitle")}</h3>
                <p className="text-xs text-[var(--shell-text-soft)]">{t("nft.referral.cardDescription")}</p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold",
                canMintReferralNft ? "bg-aura-success/20 text-aura-success" : "bg-[var(--shell-inset)] text-[var(--shell-text-soft)]"
              )}>
                {eligibilityStatusLabel}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className="text-[var(--shell-text-soft)]">{t("nft.referral.personalCheckins")}</span>
                  <span className="text-[var(--shell-copy)]">{eligibility?.personalCheckinCount || 0} / {eligibility?.requiredCheckinCount || 30}</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--shell-inset)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-aura-primary transition-all duration-500" 
                    style={{ width: `${checkinProgress}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className="text-[var(--shell-text-soft)]">{t("nft.referral.smallLegVolume")}</span>
                  <span className="text-[var(--shell-copy)]">{formatUsdtAtomic(eligibility?.smallLegVolumeUsdt || "0")} / {formatUsdtAtomic(eligibility?.requiredSmallLegUsdt || "6000000000")}</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--shell-inset)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${smallLegProgress}%` }} 
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleReferralMint}
              className="w-full h-11 bg-[var(--shell-inset)] border border-[var(--shell-border)] text-[var(--shell-title)] hover:bg-[var(--shell-control-hover)] rounded-xl"
              disabled={!canMintReferralNft || referralMintWrite.isPending || !isCorrectWriteChain}
            >
              {referralMintWrite.isPending ? t("nft.referral.minting") : t("nft.referral.button")}
            </Button>

            {referralMintReceipt.isSuccess && (
              <div className="p-3 rounded-lg bg-aura-success/10 border border-aura-success/20 text-aura-success text-xs flex items-center gap-2">
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
              <div className="w-10 h-10 rounded-xl bg-aura-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-aura-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--shell-title)]">{t("nft.benefits.weeklySubsidies.title")}</p>
                <p className="text-xs text-[var(--shell-text-soft)] leading-relaxed">{t("nft.benefits.weeklySubsidies.description")}</p>
              </div>
            </GlassCard>
            <GlassCard className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-400" />
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
