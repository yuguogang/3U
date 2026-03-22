"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsdtAtomic } from "@/lib/promotion-format";
import type { PromotionMerkleClaimView } from "3u-aura-common";

interface MerkleClaimRowProps {
  claim: PromotionMerkleClaimView;
  isPending: boolean;
  onClaim: (claim: PromotionMerkleClaimView) => void;
}

export function MerkleClaimRow({
  claim,
  isPending,
  onClaim,
}: MerkleClaimRowProps) {
  const t = useTranslations("Common");
  const isClaimable = claim.status === "CLAIMABLE";
  const isClaimed = claim.status === "CLAIMED";

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-aura-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-aura-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {t(`shared.promotion.claimType.${claim.claimType}`)}
            </p>
            <p className="text-[10px] text-white/40">{t("claims.rows.epoch", { epochNo: claim.epochNo })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-white">
              +{formatUsdtAtomic(claim.amount)}
            </p>
            <p className="text-[10px] text-white/50">{claim.tokenSymbol}</p>
          </div>
          {isClaimable ? (
            <Button
              size="sm"
              className="h-8 min-w-[64px] text-xs bg-aura-primary hover:bg-aura-primary-dark"
              disabled={isPending}
              onClick={() => onClaim(claim)}
            >
              {isPending ? t("shared.status.processingShort") : t("shared.buttons.claim")}
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
              {t(`shared.promotion.claimStatus.${claim.status}`)}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
