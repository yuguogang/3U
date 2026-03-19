"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, ShieldAlert, Gift, Gem, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import {
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { GlassCard } from "@/components/ui-custom/glass-card";
import StatCard from "@/components/ui-custom/stat-card";
import {
  isPromotionChain,
  merkleClaimAbi,
  promotionChainId,
  promotionContracts,
  rewardTypeCodeFromClaimType,
  settlementAbi,
} from "@/lib/promotion-contracts";
import { formatDateTime, formatUsdtAtomic } from "@/lib/promotion-format";
import {
  useMyClaimsQuery,
  useSyncMyClaimMutation,
} from "@/queries/claims.query";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

type PendingClaimSync = {
  claimRecordId?: string;
  subsidyClaimId?: string;
};

export function ClaimsPage() {
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

  const claimSummary = useMemo(() => {
    const merkleClaims = claimsQuery.data?.merkleClaims ?? [];
    const nftSubsidyClaims = claimsQuery.data?.nftSubsidyClaims ?? [];

    return {
      claimableMerkle: merkleClaims.filter((claim) => claim.status === "CLAIMABLE")
        .length,
      claimableSubsidy: nftSubsidyClaims.filter((claim) => claim.status === "PENDING")
        .length,
      merkleCount: merkleClaims.length,
      subsidyCount: nftSubsidyClaims.length,
    };
  }, [claimsQuery.data]);

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
      .catch((error) => {
        triggeredSyncHashes.current.delete(merkleHash);
        setPendingMerkleSync(null);
        setSyncError(
          error instanceof Error
            ? error.message
            : "Failed to sync merkle claim result",
        );
      });
  }, [claimSyncMutation, merkleHash, merkleReceipt.isSuccess, pendingMerkleSync]);

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
      .catch((error) => {
        triggeredSyncHashes.current.delete(subsidyHash);
        setPendingSubsidySync(null);
        setSyncError(
          error instanceof Error
            ? error.message
            : "Failed to sync subsidy claim result",
        );
      });
  }, [claimSyncMutation, subsidyHash, subsidyReceipt.isSuccess, pendingSubsidySync]);

  async function handleClaimMerkle(claim: any) {
    if (!isCorrectChain) return;
    const hash = await merkleWrite.writeContractAsync({
      address: promotionContracts.merkleClaim,
      abi: merkleClaimAbi,
      functionName: "claim",
      args: [
        BigInt(claim.epochId),
        BigInt(claim.index),
        rewardTypeCodeFromClaimType(claim.rewardType),
        BigInt(claim.amount),
        claim.proof as `0x${string}`[],
      ],
    });
    setMerkleHash(hash);
    setPendingMerkleSync({ claimRecordId: claim.id });
  }

  async function handleClaimSubsidy(claim: any) {
    if (!isCorrectChain) return;
    const hash = await subsidyWrite.writeContractAsync({
      address: promotionContracts.settlement,
      abi: settlementAbi,
      functionName: "claimPurchasedSubsidy",
      args: [BigInt(claim.epochId), BigInt(claim.tokenId)],
    });
    setSubsidyHash(hash);
    setPendingSubsidySync({ subsidyClaimId: claim.id });
  }

  return (
    <MobileLayout
      eyebrow="Promotion / Claims"
      title="Claim Rewards"
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Pending Claims"
              value={claimSummary.claimableMerkle + claimSummary.claimableSubsidy}
              subValue="Available now"
              icon={<Gift className="w-5 h-5" />}
              highlight={claimSummary.claimableMerkle + claimSummary.claimableSubsidy > 0}
            />
            <StatCard
              label="Total History"
              value={claimSummary.merkleCount + claimSummary.subsidyCount}
              subValue="Records found"
              icon={<Clock className="w-5 h-5" />}
            />
          </div>
        </section>

        {!isCorrectChain && (
          <GlassCard className="border border-amber-400/20 bg-amber-400/5 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-sm font-medium">Wrong Network</p>
            </div>
            <p className="mt-2 text-xs text-amber-100/60 leading-relaxed">
              Please switch to the promotion chain (ID: {promotionChainId}) to claim your rewards.
            </p>
          </GlassCard>
        )}

        {syncError && (
          <GlassCard className="border border-aura-error/20 bg-aura-error/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-aura-error shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-aura-error">Sync Error</p>
              <p className="text-xs text-aura-error/70">{syncError}</p>
              <Button size="sm" variant="outline" className="h-7 text-[10px] mt-2 border-aura-error/20" onClick={() => setSyncError(null)}>
                Dismiss
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Reward Claims (Merkle) */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-aura-primary" />
              <span>Lottery & Ranking</span>
            </h2>
            <span className="text-[10px] text-white/40">{claimSummary.merkleCount} Total</span>
          </div>
          
          <div className="space-y-3">
            {claimsQuery.data?.merkleClaims.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-white/30 italic">No reward claims found.</p>
              </div>
            ) : (
              claimsQuery.data?.merkleClaims.map((claim) => (
                <GlassCard key={claim.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-aura-primary/10 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-aura-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{claim.rewardType}</p>
                        <p className="text-[10px] text-white/40">Epoch #{claim.epochId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">+{formatUsdtAtomic(claim.amount)} USDT</p>
                      <div className="mt-2">
                        {claim.status === "CLAIMABLE" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-aura-primary hover:bg-aura-primary-dark"
                            onClick={() => handleClaimMerkle(claim)}
                            disabled={merkleWrite.isPending && pendingMerkleSync?.claimRecordId === claim.id}
                          >
                            {merkleWrite.isPending && pendingMerkleSync?.claimRecordId === claim.id ? "Claiming..." : "Claim"}
                          </Button>
                        ) : (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            claim.status === "CLAIMED" ? "bg-aura-success/20 text-aura-success" : "bg-white/5 text-white/40"
                          )}>
                            {claim.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </section>

        {/* NFT Subsidies */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Gem className="w-4 h-4 text-blue-400" />
              <span>NFT Subsidies</span>
            </h2>
            <span className="text-[10px] text-white/40">{claimSummary.subsidyCount} Total</span>
          </div>
          
          <div className="space-y-3">
            {claimsQuery.data?.nftSubsidyClaims.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-white/30 italic">No subsidy claims found.</p>
              </div>
            ) : (
              claimsQuery.data?.nftSubsidyClaims.map((claim) => (
                <GlassCard key={claim.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Gem className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">NFT #{claim.tokenId} Subsidy</p>
                        <p className="text-[10px] text-white/40">Epoch #{claim.epochId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">+30 USDT</p>
                      <div className="mt-2">
                        {claim.status === "PENDING" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-blue-500 hover:bg-blue-600"
                            onClick={() => handleClaimSubsidy(claim)}
                            disabled={subsidyWrite.isPending && pendingSubsidySync?.subsidyClaimId === claim.id}
                          >
                            {subsidyWrite.isPending && pendingSubsidySync?.subsidyClaimId === claim.id ? "Claiming..." : "Claim"}
                          </Button>
                        ) : (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            claim.status === "CLAIMED" ? "bg-aura-success/20 text-aura-success" : "bg-white/5 text-white/40"
                          )}>
                            {claim.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
