"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, ShieldAlert } from "lucide-react";
import {
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { GlassCard, MobileLayout } from "@/components/layout/mobile-layout";
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
  }, [
    claimSyncMutation,
    pendingSubsidySync,
    subsidyHash,
    subsidyReceipt.isSuccess,
  ]);

  async function handleMerkleClaim(claimRecordId: string) {
    const claim = claimsQuery.data?.merkleClaims.find(
      (entry) => entry.claimRecordId === claimRecordId,
    );
    const rewardTypeCode = claim
      ? rewardTypeCodeFromClaimType(claim.claimType)
      : undefined;
    const contractAddress = (
      claim?.contractAddress ?? promotionContracts.merkleClaimAddress
    ) as `0x${string}` | undefined;

    if (
      !claim ||
      !rewardTypeCode ||
      !contractAddress ||
      claim.merkleIndex === undefined
    ) {
      return;
    }

    setSyncError(null);
    const hash = await merkleWrite.writeContractAsync({
      abi: merkleClaimAbi,
      address: contractAddress,
      args: [
        BigInt(claim.epochNo),
        BigInt(claim.merkleIndex),
        rewardTypeCode,
        BigInt(claim.amount),
        claim.merkleProof as `0x${string}`[],
      ],
      functionName: "claim",
    });
    setMerkleHash(hash);
    setPendingMerkleSync({ claimRecordId });
  }

  async function handleSubsidyClaim(subsidyClaimId: string) {
    const claim = claimsQuery.data?.nftSubsidyClaims.find(
      (entry) => entry.subsidyClaimId === subsidyClaimId,
    );
    const contractAddress = (
      claim?.contractAddress ?? promotionContracts.settlementAddress
    ) as `0x${string}` | undefined;

    if (!claim || !contractAddress) {
      return;
    }

    setSyncError(null);
    const hash = await subsidyWrite.writeContractAsync({
      abi: settlementAbi,
      address: contractAddress,
      args: [BigInt(claim.epochNo), BigInt(claim.tokenId)],
      functionName: "claimPurchasedSubsidy",
    });
    setSubsidyHash(hash);
    setPendingSubsidySync({ subsidyClaimId });
  }

  return (
    <MobileLayout
      eyebrow="Promotion / Claims"
      title="Claims"
      description="Weekly merkle claims use server-published proof rows, while purchased NFT subsidy claims use settlement rows. After each successful receipt the page now syncs the chain result back into server state instead of relying on a local submitted marker."
    >
      <div className="space-y-4">
        {!isCorrectChain ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/8 p-5">
            <div className="flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-sm font-medium">
                Claim actions are disabled until the wallet is on chain{" "}
                {promotionChainId}.
              </p>
            </div>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
              Weekly merkle claims
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {claimSummary.merkleCount}
            </p>
            <p className="mt-2 text-sm text-white/65">
              Claimable rows: {claimSummary.claimableMerkle}
            </p>
            {merkleReceipt.isSuccess ? (
              <p className="mt-3 text-sm text-emerald-300">
                Latest merkle claim tx confirmed and queued for server sync.
              </p>
            ) : null}
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-300/75">
              Purchased NFT subsidy
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {claimSummary.subsidyCount}
            </p>
            <p className="mt-2 text-sm text-white/65">
              Pending subsidy rows: {claimSummary.claimableSubsidy}
            </p>
            {subsidyReceipt.isSuccess ? (
              <p className="mt-3 text-sm text-emerald-300">
                Latest subsidy claim tx confirmed and queued for server sync.
              </p>
            ) : null}
          </GlassCard>
        </div>
        {syncError ? (
          <GlassCard className="border border-rose-400/20 bg-rose-400/8 p-5">
            <p className="text-sm text-rose-200">{syncError}</p>
          </GlassCard>
        ) : null}

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-3 text-white">
            <ArrowRightLeft className="h-5 w-5 text-orange-300" />
            <h2 className="text-lg font-semibold">Merkle claim rows</h2>
          </div>
          {!claimsQuery.data?.merkleClaims.length ? (
            <p className="text-sm leading-6 text-white/68">
              No weekly merkle claim rows are available for this wallet.
            </p>
          ) : (
            <div className="grid gap-3">
              {claimsQuery.data.merkleClaims.map((claim) => {
                const isSubmitted =
                  pendingMerkleSync?.claimRecordId === claim.claimRecordId;
                const hasContractAddress = Boolean(
                  claim.contractAddress ?? promotionContracts.merkleClaimAddress,
                );

                return (
                  <div
                    key={claim.claimRecordId}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {claim.claimType} · epoch #{claim.epochNo}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {claim.status} · proof length {claim.merkleProof.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {formatUsdtAtomic(claim.amount)} {claim.tokenSymbol}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          index {claim.merkleIndex ?? "-"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        className="h-10 rounded-2xl px-5"
                        disabled={
                          !isCorrectChain ||
                          !hasContractAddress ||
                          claim.status !== "CLAIMABLE" ||
                          isSubmitted ||
                          merkleWrite.isPending
                        }
                        onClick={() => handleMerkleClaim(claim.claimRecordId)}
                        type="button"
                      >
                        {isSubmitted
                          ? "Syncing..."
                          : merkleWrite.isPending
                            ? "Claiming..."
                            : "Claim weekly reward"}
                      </Button>
                      <span className="text-xs text-white/45">
                        root {claim.root?.slice(0, 10) ?? "-"} · updated{" "}
                        {formatDateTime(claim.claimedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-3 text-white">
            <ArrowRightLeft className="h-5 w-5 text-orange-300" />
            <h2 className="text-lg font-semibold">Purchased NFT subsidy rows</h2>
          </div>
          {!claimsQuery.data?.nftSubsidyClaims.length ? (
            <p className="text-sm leading-6 text-white/68">
              No purchased NFT subsidy rows are available for this wallet.
            </p>
          ) : (
            <div className="grid gap-3">
              {claimsQuery.data.nftSubsidyClaims.map((claim) => {
                const isSubmitted =
                  pendingSubsidySync?.subsidyClaimId === claim.subsidyClaimId;
                const hasContractAddress = Boolean(
                  claim.contractAddress ?? promotionContracts.settlementAddress,
                );

                return (
                  <div
                    key={claim.subsidyClaimId}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Token #{claim.tokenId} · epoch #{claim.epochNo}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {claim.status}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatUsdtAtomic(claim.amountUsdt)} USDT
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        className="h-10 rounded-2xl px-5"
                        disabled={
                          !isCorrectChain ||
                          !hasContractAddress ||
                          claim.status !== "PENDING" ||
                          isSubmitted ||
                          subsidyWrite.isPending
                        }
                        onClick={() => handleSubsidyClaim(claim.subsidyClaimId)}
                        type="button"
                      >
                        {isSubmitted
                          ? "Syncing..."
                          : subsidyWrite.isPending
                            ? "Claiming..."
                            : "Claim subsidy"}
                      </Button>
                      <span className="text-xs text-white/45">
                        updated {formatDateTime(claim.claimedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </MobileLayout>
  );
}
