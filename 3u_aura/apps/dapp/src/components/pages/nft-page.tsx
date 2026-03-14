"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Gem,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { GlassCard, MobileLayout } from "@/components/layout/mobile-layout";
import {
  erc20Abi,
  isPromotionChain,
  nftSaleAbi,
  promotionChainId,
  promotionContracts,
} from "@/lib/promotion-contracts";
import {
  formatPercent,
  formatDateTime,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import { usePromotionContractState } from "@/hooks/use-promotion-contract-state";
import {
  useCurrentEligibilityQuery,
  useReferralMintSignatureMutation,
  useReferralMintPreviewMutation,
} from "@/queries/promotion.query";
import { useAuthStore } from "@/store/auth.store";

export function NftPage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const contractState = usePromotionContractState();
  const eligibilityQuery = useCurrentEligibilityQuery(
    address,
    Boolean(isAuthenticated && hasHydrated && address),
  );
  const previewMutation = useReferralMintPreviewMutation();
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
  const isCorrectChain = isPromotionChain(chainId);
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
  const canRequestReferralMint =
    isConnected &&
    isAuthenticated &&
    isCorrectChain &&
    Boolean(address) &&
    Boolean(promotionContracts.nftSaleAddress);
  const canProceedReferralMint =
    eligibility?.status === "APPROVED" ||
    eligibility?.status === "SIGNED" ||
    eligibility?.status === "EXPIRED";
  const canBuyPurchasedNft =
    isConnected &&
    isAuthenticated &&
    isCorrectChain &&
    contractState.hasNftSaleConfig &&
    contractState.hasPaymentTokenConfig &&
    isApprovalSatisfied;

  const previewSummary = useMemo(() => {
    if (!previewMutation.data) {
      return null;
    }

    return {
      chainId: previewMutation.data.chainId,
      contractAddress:
        previewMutation.data.contractAddress ??
        promotionContracts.nftSaleAddress ??
        "-",
      expiresAt: previewMutation.data.expiresAt ?? "-",
      nonce: previewMutation.data.nonce ?? 0,
      recipient: previewMutation.data.recipient,
    };
  }, [previewMutation.data]);

  const signatureSummary = useMemo(() => {
    if (!signatureMutation.data) {
      return null;
    }

    return {
      contractAddress:
        signatureMutation.data.contractAddress ??
        promotionContracts.nftSaleAddress ??
        "-",
      digest: signatureMutation.data.digest,
      expiresAt: signatureMutation.data.expiresAt,
      nonce: signatureMutation.data.nonce,
      recipient: signatureMutation.data.recipient,
    };
  }, [signatureMutation.data]);

  async function handleApprove() {
    if (
      !promotionContracts.paymentTokenAddress ||
      !promotionContracts.nftSaleAddress ||
      !purchasePrice
    ) {
      return;
    }

    const hash = await approveWrite.writeContractAsync({
      abi: erc20Abi,
      address: promotionContracts.paymentTokenAddress,
      args: [promotionContracts.nftSaleAddress, purchasePrice],
      functionName: "approve",
    });
    setApproveHash(hash);
  }

  async function handleBuy() {
    if (!promotionContracts.nftSaleAddress) {
      return;
    }

    const hash = await buyWrite.writeContractAsync({
      abi: nftSaleAbi,
      address: promotionContracts.nftSaleAddress,
      functionName: "buyNFT",
    });
    setBuyHash(hash);
  }

  async function handlePrepareReferralMint() {
    if (!address) {
      return;
    }

    await previewMutation.mutateAsync({
      chainId: chainId ?? promotionChainId,
      contractAddress: promotionContracts.nftSaleAddress,
      recipient: address,
    });
  }

  async function handleReferralMint() {
    if (!address || !promotionContracts.nftSaleAddress) {
      return;
    }

    const payload = await signatureMutation.mutateAsync({
      chainId: chainId ?? promotionChainId,
      contractAddress: promotionContracts.nftSaleAddress,
      recipient: address,
    });

    const hash = await referralMintWrite.writeContractAsync({
      abi: nftSaleAbi,
      address: payload.contractAddress as `0x${string}`,
      args: [
        BigInt(payload.nonce),
        BigInt(payload.expiry),
        payload.signature as `0x${string}`,
      ],
      functionName: "mintNFTByReferral",
    });
    setReferralMintHash(hash);
  }

  return (
    <MobileLayout
      eyebrow="Promotion / NFT"
      title="Founder NFT"
      description="Purchased NFTs remain wallet-driven on the sale contract. Referral NFTs now require admin approval first; only approved users can request the backend signer payload and submit the final `mintNFTByReferral()` call on the configured promotion chain."
    >
      <div className="space-y-4">
        {!isCorrectChain ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/8 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-sm font-medium">
                Wallet is not on the promotion claim chain. Current chain:{" "}
                {chainId ?? "-"}, target chain: {promotionChainId}.
              </p>
            </div>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-white">
              <ShoppingBag className="h-5 w-5 text-orange-300" />
              <h2 className="text-lg font-semibold">Purchased NFT sale</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Purchase price</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatUsdtAtomic(purchasePrice.toString())} USDT
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">USDT balance</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatUsdtAtomic(usdtBalance.toString())} USDT
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Purchased supply left</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {contractState.remainingSupply?.purchasedRemaining?.toString() ??
                    "-"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Referral supply left</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {contractState.remainingSupply?.referralRemaining?.toString() ??
                    "-"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                data-testid="nft-approve-button"
                className="h-11 rounded-2xl px-6"
                disabled={
                  !isConnected ||
                  !isAuthenticated ||
                  !isCorrectChain ||
                  !contractState.hasNftSaleConfig ||
                  !contractState.hasPaymentTokenConfig ||
                  approveWrite.isPending
                }
                onClick={handleApprove}
                type="button"
              >
                {approveWrite.isPending ? "Approving..." : "Approve 1000 USDT"}
              </Button>
              <Button
                data-testid="nft-buy-button"
                className="h-11 rounded-2xl px-6"
                disabled={!canBuyPurchasedNft || buyWrite.isPending}
                onClick={handleBuy}
                type="button"
                variant="secondary"
              >
                {buyWrite.isPending ? "Buying..." : "Buy Purchased NFT"}
              </Button>
            </div>
            <div className="mt-4 text-sm text-white/60">
              <p>Allowance ready: {isApprovalSatisfied ? "Yes" : "No"}</p>
              <p className="mt-2">
                Current referral nonce:{" "}
                {contractState.referralNonce?.toString() ?? "0"}
              </p>
              {approveReceipt.isSuccess ? (
                <p className="mt-2 text-emerald-300">
                  Approval confirmed on-chain.
                </p>
              ) : null}
              {buyReceipt.isSuccess ? (
                <p className="mt-2 text-emerald-300">
                  Purchase tx confirmed on-chain.
                </p>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 text-white">
              <Gem className="h-5 w-5 text-orange-300" />
              <h2 className="text-lg font-semibold">Referral NFT eligibility</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-white/65">
                  <span>Check-in progress</span>
                  <span>
                    {eligibility?.personalCheckinCount ?? 0}/
                    {eligibility?.requiredCheckinCount ?? 30}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-orange-300"
                    style={{ width: `${checkinProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-white/65">
                  <span>Small leg progress</span>
                  <span>
                    {formatUsdtAtomic(eligibility?.smallLegVolumeUsdt)}/
                    {formatUsdtAtomic(eligibility?.requiredSmallLegUsdt)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-300"
                    style={{ width: `${smallLegProgress}%` }}
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                <p>
                  Status:{" "}
                  <span className="font-semibold text-white">
                    {eligibility?.status ?? "Not loaded"}
                  </span>
                </p>
                <p className="mt-2">
                  Expires at:{" "}
                  {formatDateTime(
                    previewSummary?.expiresAt ?? eligibility?.expiresAt,
                  )}
                </p>
                <p className="mt-2">
                  Approved at: {formatDateTime(eligibility?.approvedAt)}
                </p>
                <p className="mt-2">
                  Rejected at: {formatDateTime(eligibility?.rejectedAt)}
                </p>
                <p className="mt-2">
                  Decision: {eligibility?.decisionReason ?? "-"}
                </p>
              </div>
              {eligibility?.status === "PENDING_APPROVAL" ? (
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100">
                  Thresholds are met, but referral mint is waiting for admin approval.
                </div>
              ) : null}
              {eligibility?.status === "REJECTED" ? (
                <div className="rounded-3xl border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-rose-100">
                  Referral mint was rejected by the operator. Review the decision reason above before retrying.
                </div>
              ) : null}
              {eligibility?.status === "APPROVED" ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-emerald-100">
                  Approval is in place. You can now request the final signer payload and mint on-chain.
                </div>
              ) : null}
              {eligibility?.status === "EXPIRED" ? (
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100">
                  The previous signer payload expired before mint. Request a refreshed payload to continue.
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button
                  data-testid="nft-prepare-referral-button"
                  className="h-11 rounded-2xl px-6"
                  disabled={
                    !canRequestReferralMint ||
                    !canProceedReferralMint ||
                    previewMutation.isPending
                  }
                  onClick={handlePrepareReferralMint}
                  type="button"
                >
                  {previewMutation.isPending
                    ? "Preparing..."
                    : "Prepare Referral Mint"}
                </Button>
                <Button
                  data-testid="nft-referral-mint-button"
                  className="h-11 rounded-2xl px-6"
                  disabled={
                    !canRequestReferralMint ||
                    !canProceedReferralMint ||
                    signatureMutation.isPending ||
                    referralMintWrite.isPending
                  }
                  onClick={handleReferralMint}
                  type="button"
                  variant="secondary"
                >
                  {signatureMutation.isPending || referralMintWrite.isPending
                    ? "Signing & minting..."
                    : "Sign & Mint Referral NFT"}
                </Button>
              </div>
              {previewMutation.error ? (
                <p className="text-sm text-rose-300">
                  {previewMutation.error instanceof Error
                    ? previewMutation.error.message
                    : "Failed to prepare referral mint"}
                </p>
              ) : null}
              {signatureMutation.error ? (
                <p className="text-sm text-rose-300">
                  {signatureMutation.error instanceof Error
                    ? signatureMutation.error.message
                    : "Failed to issue referral mint signature"}
                </p>
              ) : null}
              {previewSummary ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-white/72">
                  <div className="mb-2 flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Preview payload prepared
                  </div>
                  <p>Recipient: {previewSummary.recipient}</p>
                  <p className="mt-1">Nonce: {previewSummary.nonce}</p>
                  <p className="mt-1">Contract: {previewSummary.contractAddress}</p>
                </div>
              ) : null}
              {signatureSummary ? (
                <div className="rounded-3xl border border-orange-300/20 bg-orange-300/8 p-4 text-sm text-white/72">
                  <div className="mb-2 flex items-center gap-2 text-orange-200">
                    <CheckCircle2 className="h-4 w-4" />
                    Final signer payload ready
                  </div>
                  <p>Recipient: {signatureSummary.recipient}</p>
                  <p className="mt-1">Nonce: {signatureSummary.nonce}</p>
                  <p className="mt-1">
                    Expires: {formatDateTime(signatureSummary.expiresAt)}
                  </p>
                  <p className="mt-1">
                    Digest: {signatureSummary.digest.slice(0, 18)}...
                  </p>
                </div>
              ) : null}
              {referralMintReceipt.isSuccess ? (
                <p className="text-sm text-emerald-300">
                  Referral NFT mint tx confirmed on-chain.
                </p>
              ) : null}
            </div>
          </GlassCard>
        </div>
      </div>
    </MobileLayout>
  );
}
