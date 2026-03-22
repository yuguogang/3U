"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Gift, History } from "lucide-react";
import StatCard from "@/components/ui-custom/stat-card";

interface ClaimsSummaryProps {
  claimableCount: number;
  totalCount: number;
  totalClaimableAmount: string;
  currency: string;
}

export function ClaimsSummary({
  claimableCount,
  totalCount,
  totalClaimableAmount,
  currency,
}: ClaimsSummaryProps) {
  const t = useTranslations("Common");
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label={t("claims.summary.claimableNow")}
        value={claimableCount}
        subValue={claimableCount > 0 ? `~${totalClaimableAmount} ${currency}` : undefined}
        icon={<Gift className="w-5 h-5" />}
        highlight={claimableCount > 0}
      />
      <StatCard
        label={t("claims.summary.totalHistory")}
        value={totalCount}
        subValue={t("claims.summary.recordsFound")}
        icon={<History className="w-5 h-5" />}
      />
    </div>
  );
}
