"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Gem,
  ShieldAlert,
  ShoppingBag,
  Star,
  Lock,
  Zap,
  Info,
  TrendingUp,
  Clock,
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
import {
  formatPercent,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import { usePromotionContractState } from "@/hooks/use-promotion-contract-state";
import {
  useCurrentEligibilityQuery,
  useReferralMintSignatureMutation,
} from "@/queries/promotion.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export function NftPage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
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
  const usdtBalance = contractState.usdtBalance ?? BigInt(0);
  const isCorrectReadChain = isPromotionChain(effectiveReadChainId);
  const isCorrectWriteChain = isPromotionChain(chainId);
  const eligibility = eligibilityQuery.data;
  
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

  const handleApprove = async () => {
    if (!purchasePrice) return;
    const hash = await approveWrite.writeContractAsync({
      address: promotionContracts.usdt,
      abi: erc20Abi,
      functionName: "approve",
      args: [promotionContracts.nftSale, purchasePrice],
    });
    setApproveHash(hash);
  };

  const handleBuy = async () => {
    const hash = await buyWrite.writeContractAsync({
      address: promotionContracts.nftSale,
      abi: nftSaleAbi,
      functionName: "buyPurchasedNFT",
    });
    setBuyHash(hash);
  };

  const handleReferralMint = async () => {
    if (!effectiveAddress) return;
    const result = await signatureMutation.mutateAsync({
      chainId: promotionChainId,
      recipient: effectiveAddress,
    });

    const hash = await referralMintWrite.writeContractAsync({
      address: promotionContracts.nftSale,
      abi: nftSaleAbi,
      functionName: "mintReferralNFT",
      args: [
        result.recipient as `0x${string}`,
        BigInt(result.nonce),
        BigInt(result.expiry),
        result.signature as `0x${string}`,
      ],
    });
    setReferralMintHash(hash);
  };

  return (
    <MobileLayout
      eyebrow="Promotion / NFT"
      title="Founder NFT"
    >
      <div className="space-y-6">
        {/* NFT Overview */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Purchased Minted"
              value={contractState.purchasedMinted?.toString() || "0"}
              unit="/ 30"
              icon={<ShoppingBag className="w-5 h-5" />}
            />
            <StatCard
              label="Referral Minted"
              value={contractState.referralMinted?.toString() || "0"}
              unit="/ 70"
              icon={<Gem className="w-5 h-5" />}
            />
          </div>
        </section>

        {!isCorrectReadChain && (
          <GlassCard className="border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-sm font-medium">Wrong Network</p>
            </div>
            <p className="mt-2 text-xs text-amber-100/60 leading-relaxed">
              Please switch your wallet to the promotion chain (ID: {promotionChainId}) to interact with NFTs.
            </p>
          </GlassCard>
        )}

        {/* Purchased NFT Section */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Purchased NFT</span>
          </h2>
          <GlassCard variant="elevated" className="overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-aura-primary/20 to-aura-primary-dark/20 flex items-center justify-center relative">
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" />
                LEGENDARY
              </div>
              <Gem className="w-24 h-24 text-aura-primary opacity-50" />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Founder NFT (Sale)</h3>
                <p className="text-xs text-white/50">Exclusive benefits and weekly USDT subsidies.</p>
              </div>
              
              <div className="flex items-center justify-between py-3 border-y border-white/[0.08]">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Price</p>
                  <p className="text-lg font-mono font-bold text-white">{formatUsdtAtomic(purchasePrice)} USDT</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase">Your Balance</p>
                  <p className="text-sm font-mono text-white/70">{formatUsdtAtomic(usdtBalance)} USDT</p>
                </div>
              </div>

              {!isApprovalSatisfied ? (
                <Button
                  onClick={handleApprove}
                  className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold rounded-xl"
                  disabled={approveWrite.isPending || !isCorrectWriteChain}
                >
                  {approveWrite.isPending ? "Approving..." : "Approve USDT"}
                </Button>
              ) : (
                <Button
                  onClick={handleBuy}
                  className="w-full h-12 bg-gradient-to-r from-aura-primary to-aura-primary-dark text-white font-bold rounded-xl shadow-glow-sm"
                  disabled={buyWrite.isPending || !isCorrectWriteChain}
                >
                  {buyWrite.isPending ? "Purchasing..." : "Buy Now"}
                </Button>
              )}

              {buyReceipt.isSuccess && (
                <div className="p-3 rounded-lg bg-aura-success/10 border border-aura-success/20 text-aura-success text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Purchase successful! Check your wallet.
                </div>
              )}
            </div>
          </GlassCard>
        </section>

        {/* Referral NFT Section */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <Gem className="w-4 h-4" />
            <span>Referral NFT</span>
          </h2>
          <GlassCard className="p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-white">Milestone NFT</h3>
                <p className="text-xs text-white/50">Earned through team growth.</p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold",
                eligibility?.eligible ? "bg-aura-success/20 text-aura-success" : "bg-white/5 text-white/40"
              )}>
                {eligibility?.status || "LOCKED"}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className="text-white/40">Personal Check-ins</span>
                  <span className="text-white/70">{eligibility?.personalCheckinCount || 0} / {eligibility?.requiredCheckinCount || 30}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-aura-primary transition-all duration-500" 
                    style={{ width: `${checkinProgress}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className="text-white/40">Small Leg Volume</span>
                  <span className="text-white/70">{formatUsdtAtomic(eligibility?.smallLegVolumeUsdt || "0")} / {formatUsdtAtomic(eligibility?.requiredSmallLegUsdt || "6000000000")}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${smallLegProgress}%` }} 
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleReferralMint}
              className="w-full h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl"
              disabled={!eligibility?.eligible || referralMintWrite.isPending || !isCorrectWriteChain}
            >
              {referralMintWrite.isPending ? "Minting..." : "Claim Milestone NFT"}
            </Button>

            {referralMintReceipt.isSuccess && (
              <div className="p-3 rounded-lg bg-aura-success/10 border border-aura-success/20 text-aura-success text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                NFT minted successfully!
              </div>
            )}
          </GlassCard>
        </section>

        {/* Benefits Info */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">NFT Holder Benefits</h2>
          <div className="grid grid-cols-1 gap-3">
            <GlassCard className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-aura-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-aura-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Weekly Subsidies</p>
                <p className="text-xs text-white/50 leading-relaxed">Purchased NFT holders receive 30 USDT weekly during the promotion phase.</p>
              </div>
            </GlassCard>
            <GlassCard className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Revenue Sharing</p>
                <p className="text-xs text-white/50 leading-relaxed">All Founder NFT holders share 60% of transaction taxes after AURA token launch.</p>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
