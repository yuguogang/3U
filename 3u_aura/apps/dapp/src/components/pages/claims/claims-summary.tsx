"use client";

import React from "react";
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
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Claimable Now"
        value={claimableCount}
        subValue={claimableCount > 0 ? `~${totalClaimableAmount} ${currency}` : undefined}
        icon={<Gift className="w-5 h-5" />}
        highlight={claimableCount > 0}
      />
      <StatCard
        label="Total History"
        value={totalCount}
        subValue="Records found"
        icon={<History className="w-5 h-5" />}
      />
    </div>
  );
}
