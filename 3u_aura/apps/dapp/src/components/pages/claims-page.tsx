"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldAlert,
  Gem,
  AlertCircle,
  Trophy,
  InboxIcon,
} from "lucide-react";
import {
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import {
  isPromotionChain,
  merkleClaimAbi,
  promotionChainId,
  promotionContracts,
  rewardTypeCodeFromClaimType,
  settlementAbi,
} from "@/lib/promotion-contracts";
import { formatUsdtAtomic } from "@/lib/promotion-format";
import {
  useMyClaimsQuery,
  useSyncMyClaimMutation,
} from "@/queries/claims.query";
import { useAuthStore } from "@/store/auth.store";
import {
  PromotionMerkleClaimView,
  PromotionNftSubsidyClaimView,
} from "3u-aura-common";
import { ClaimsSummary } from "./claims/claims-summary";
import {
  ClaimsSummarySkeleton,
  ClaimsLoadingCard,
} from "./claims/claims-loading";
import { MerkleClaimRow } from "./claims/merkle-claim-row";
import { SubsidyClaimRow } from "./claims/subsidy-claim-row";

type PendingClaimSync = {
  claimRecordId?: string;
  subsidyClaimId?: string;
};

export function ClaimsPage() {
  const t = useTranslations("Common");
  const chainId = useChainId();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const claimsQuery = useMyClaimsQuery(isAuthenticated && hasHydrated);
  const claimSyncMutation = useSyncMyClaimMutation();
  const merkleWrite = useWriteContract();
  const subsidyWrite = useWriteContract();
  const [merkleHash, setMerkleHash] = useState<`0x${string}` | undefined>();
  const [subsidyHash, setSubsidyHash] = useState<`0x${string}` | undefined>();
  const [pendingMerkleSync, setPendingMerkleSync] =
    useState<PendingClaimSync | null>(null);
  const [pendingSubsidySync, setPendingSubsidySync] =
    useState<PendingClaimSync | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const triggeredSyncHashes = useRef<Set<string>>(new Set());

  const merkleReceipt = useWaitForTransactionReceipt({ hash: merkleHash });
  const subsidyReceipt = useWaitForTransactionReceipt({ hash: subsidyHash });
  const isCorrectChain = isPromotionChain(chainId);

  const { merkleClaims, nftSubsidyClaims } = useMemo(() => {
    return {
      merkleClaims: claimsQuery.data?.merkleClaims ?? [],
      nftSubsidyClaims: claimsQuery.data?.nftSubsidyClaims ?? [],
    };
  }, [claimsQuery.data]);

  const claimSummary = useMemo(() => {
    const claimableMerkle = merkleClaims.filter(
      (c) => c.status === "CLAIMABLE",
    ).length;
    const claimableSubsidy = nftSubsidyClaims.filter(
      (c) => c.status === "PENDING",
    ).length;
    const totalClaimableMerkle = merkleClaims
      .filter((c) => c.status === "CLAIMABLE")
      .reduce((acc, c) => acc + BigInt(c.amount), BigInt(0));
    const totalClaimableSubsidy = nftSubsidyClaims
      .filter((c) => c.status === "PENDING")
      .reduce((acc, c) => acc + BigInt(c.amountUsdt), BigInt(0));
    const totalClaimable =
      totalClaimableMerkle + totalClaimableSubsidy;
    return {
      claimableMerkle,
      claimableSubsidy,
      claimableTotal: claimableMerkle + claimableSubsidy,
      totalCount: merkleClaims.length + nftSubsidyClaims.length,
      totalClaimableFormatted: formatUsdtAtomic(totalClaimable),
    };
  }, [merkleClaims, nftSubsidyClaims]);

  useEffect(() => {
    if (
      !merkleReceipt.isSuccess ||
      !merkleHash ||
      !pendingMerkleSync?.claimRecordId ||
      triggeredSyncHashes.current.has(merkleHash)
    ) {
      return;
    }

    triggeredSyncHashes.current.add(merkleHash);
    void claimSyncMutation
      .mutateAsync({
        claimRecordId: pendingMerkleSync.claimRecordId,
        txHash: merkleHash,
      })
      .then(() => {
        setPendingMerkleSync(null);
      })
      .catch((error: unknown) => {
        triggeredSyncHashes.current.delete(merkleHash);
        setPendingMerkleSync(null);
        setSyncError(
          error instanceof Error
            ? error.message
            : t("claims.sync.merkleFallbackError"),
        );
      });
  }, [claimSyncMutation, merkleHash, merkleReceipt.isSuccess, pendingMerkleSync, t]);

  useEffect(() => {
    if (
      !subsidyReceipt.isSuccess ||
      !subsidyHash ||
      !pendingSubsidySync?.subsidyClaimId ||
      triggeredSyncHashes.current.has(subsidyHash)
    ) {
      return;
    }

    triggeredSyncHashes.current.add(subsidyHash);
    void claimSyncMutation
      .mutateAsync({
        subsidyClaimId: pendingSubsidySync.subsidyClaimId,
        txHash: subsidyHash,
      })
      .then(() => {
        setPendingSubsidySync(null);
      })
      .catch((error: unknown) => {
        triggeredSyncHashes.current.delete(subsidyHash);
        setPendingSubsidySync(null);
        setSyncError(
          error instanceof Error
            ? error.message
            : t("claims.sync.subsidyFallbackError"),
        );
      });
  }, [claimSyncMutation, subsidyHash, subsidyReceipt.isSuccess, pendingSubsidySync, t]);

  async function handleClaimMerkle(claim: PromotionMerkleClaimView) {
    if (!isCorrectChain || !promotionContracts.merkleClaimAddress) return;
    const hash = await merkleWrite.writeContractAsync({
      address: promotionContracts.merkleClaimAddress,
      abi: merkleClaimAbi,
      functionName: "claim",
      args: [
        BigInt(claim.epochNo),
        BigInt(claim.merkleIndex || 0),
        rewardTypeCodeFromClaimType(claim.claimType)!,
        BigInt(claim.amount),
        claim.merkleProof as `0x${string}`[],
      ],
    });
    setMerkleHash(hash);
    setPendingMerkleSync({ claimRecordId: claim.claimRecordId });
  }

  async function handleClaimSubsidy(claim: PromotionNftSubsidyClaimView) {
    if (!isCorrectChain || !promotionContracts.settlementAddress) return;
    const hash = await subsidyWrite.writeContractAsync({
      address: promotionContracts.settlementAddress,
      abi: settlementAbi,
      functionName: "claimPurchasedSubsidy",
      args: [BigInt(claim.epochNo), BigInt(claim.tokenId)],
    });
    setSubsidyHash(hash);
    setPendingSubsidySync({ subsidyClaimId: claim.subsidyClaimId });
  }

  return (
    <MobileLayout
      eyebrow={t("claims.eyebrow")}
      title={t("claims.title")}
    >
      <div className="space-y-6">
        {/* ─── Section 1: Summary ─── */}
        <section className="animate-fade-in">
          {claimsQuery.isLoading ? (
            <ClaimsSummarySkeleton />
          ) : (
            <ClaimsSummary
              claimableCount={claimSummary.claimableTotal}
              totalCount={claimSummary.totalCount}
              totalClaimableAmount={claimSummary.totalClaimableFormatted}
              currency="USDT"
            />
          )}
        </section>

        {/* ─── Section 2: Banners ─── */}
        {!isCorrectChain && (
          <GlassCard className="border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{t("shared.status.wrongNetwork")}</p>
            </div>
            <p className="mt-2 text-xs text-amber-100/60 leading-relaxed">
              {t("claims.wrongNetwork.description", { chainId: promotionChainId })}
            </p>
          </GlassCard>
        )}

        {syncError && (
          <GlassCard className="border border-aura-error/20 bg-aura-error/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-aura-error shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-aura-error">{t("claims.sync.title")}</p>
              <p className="text-xs text-aura-error/70">{syncError}</p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] mt-2 border-aura-error/20"
                onClick={() => setSyncError(null)}
              >
                {t("shared.buttons.dismiss")}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* ─── Section 3: Lottery & Ranking (Merkle) ─── */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-aura-primary" />
              <span>{t("claims.sections.merkle.title")}</span>
            </h2>
            <span className="text-[10px] text-white/40">
              {claimSummary.claimableMerkle > 0
                ? t("claims.sections.merkle.badgeClaimable", {
                    count: claimSummary.claimableMerkle,
                  })
                : t("claims.sections.merkle.badgeTotal", {
                    count: merkleClaims.length,
                  })}
            </span>
          </div>

          {claimsQuery.isLoading ? (
            <ClaimsLoadingCard />
          ) : merkleClaims.length === 0 ? (
            <GlassCard className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <InboxIcon className="w-8 h-8 text-white/20" />
                <p className="text-sm text-white/40">{t("claims.sections.merkle.emptyTitle")}</p>
                <p className="text-[10px] text-white/20">
                  {t("claims.sections.merkle.emptyDescription")}
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {merkleClaims.map((claim) => (
                <MerkleClaimRow
                  key={claim.claimRecordId}
                  claim={claim}
                  isPending={
                    merkleWrite.isPending &&
                    pendingMerkleSync?.claimRecordId === claim.claimRecordId
                  }
                  onClaim={handleClaimMerkle}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Section 4: NFT Subsidies ─── */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Gem className="w-4 h-4 text-blue-400" />
              <span>{t("claims.sections.subsidy.title")}</span>
            </h2>
            <span className="text-[10px] text-white/40">
              {claimSummary.claimableSubsidy > 0
                ? t("claims.sections.subsidy.badgeClaimable", {
                    count: claimSummary.claimableSubsidy,
                  })
                : t("claims.sections.subsidy.badgeTotal", {
                    count: nftSubsidyClaims.length,
                  })}
            </span>
          </div>

          {claimsQuery.isLoading ? (
            <ClaimsLoadingCard />
          ) : nftSubsidyClaims.length === 0 ? (
            <GlassCard className="p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <InboxIcon className="w-8 h-8 text-white/20" />
                <p className="text-sm text-white/40">{t("claims.sections.subsidy.emptyTitle")}</p>
                <p className="text-[10px] text-white/20">
                  {t("claims.sections.subsidy.emptyDescription")}
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {nftSubsidyClaims.map((claim) => (
                <SubsidyClaimRow
                  key={claim.subsidyClaimId}
                  claim={claim}
                  isPending={
                    subsidyWrite.isPending &&
                    pendingSubsidySync?.subsidyClaimId === claim.subsidyClaimId
                  }
                  onClaim={handleClaimSubsidy}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileLayout>
  );
}
