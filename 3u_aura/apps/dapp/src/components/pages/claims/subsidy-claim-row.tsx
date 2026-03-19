"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsdtAtomic } from "@/lib/promotion-format";
import type { PromotionNftSubsidyClaimView, ClaimStatus } from "3u-aura-common";

interface SubsidyClaimRowProps {
  claim: PromotionNftSubsidyClaimView;
  isPending: boolean;
  onClaim: (claim: PromotionNftSubsidyClaimView) => void;
}

const STATUS_LABELS: Partial<Record<ClaimStatus, string>> = {
  CLAIMABLE: "Claimable",
  CLAIMED: "Claimed",
  PENDING: "Claimable",
  FAILED: "Failed",
  VOIDED: "Voided",
};

export function SubsidyClaimRow({
  claim,
  isPending,
  onClaim,
}: SubsidyClaimRowProps) {
  const isClaimable = claim.status === "PENDING";
  const isClaimed = claim.status === "CLAIMED";

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Gem className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              NFT #{claim.tokenId} Subsidy
            </p>
            <p className="text-[10px] text-white/40">Epoch #{claim.epochNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-white">
              +{formatUsdtAtomic(claim.amountUsdt)}
            </p>
            <p className="text-[10px] text-white/50">USDT</p>
          </div>
          {isClaimable ? (
            <Button
              size="sm"
              className="h-8 min-w-[64px] text-xs bg-blue-500 hover:bg-blue-600"
              disabled={isPending}
              onClick={() => onClaim(claim)}
            >
              {isPending ? "..." : "Claim"}
            </Button>
          ) : (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                isClaimed
                  ? "bg-aura-success/20 text-aura-success"
                  : "bg-white/5 text-white/40"
              )}
            >
              {STATUS_LABELS[claim.status] ?? claim.status}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
