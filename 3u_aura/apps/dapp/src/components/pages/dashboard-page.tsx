"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  Gem,
  ReceiptText,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";
import { useAccount } from "wagmi";
import { GlassCard, GradientButton, MobileLayout } from "@/components/layout/mobile-layout";
import {
  formatAuraAtomic,
  formatDateTime,
  formatUsdtAtomic,
} from "@/lib/promotion-format";
import {
  useCurrentEligibilityQuery,
  useCurrentEpochQuery,
  usePendingPlacementsQuery,
} from "@/queries/promotion.query";
import { useUserProfileQuery } from "@/queries/user.query";
import { useAuthStore } from "@/store/auth.store";

const dashboardSections = [
  {
    href: "/checkin",
    title: "Check-In",
    description:
      "Submit a confirmed 3 USDT payment receipt into the accounting path without mixing wallet UX with server-side settlement facts.",
    icon: CalendarCheck2,
  },
  {
    href: "/team",
    title: "Team",
    description:
      "Bind inviter codes, inspect pending direct referrals, and choose frozen LEFT or RIGHT slots from the inviter subtree.",
    icon: Users,
  },
  {
    href: "/rewards",
    title: "Rewards",
    description:
      "Read current epoch status, cumulative AURA, and published reward rows without reconstructing weekly settlement logic on the client.",
    icon: Trophy,
  },
  {
    href: "/nft",
    title: "NFT",
    description:
      "Purchased NFT sale is chain-driven; referral NFT now consumes the backend signer payload and submits the final mint transaction from the wallet.",
    icon: Gem,
  },
  {
    href: "/claims",
    title: "Claims",
    description:
      "Consume weekly merkle proof rows and purchased NFT subsidy rows, then call the contracts directly from the wallet.",
    icon: ReceiptText,
  },
];

export function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const profileQuery = useUserProfileQuery(isAuthenticated && hasHydrated);
  const epochQuery = useCurrentEpochQuery();
  const eligibilityQuery = useCurrentEligibilityQuery(
    address,
    Boolean(isAuthenticated && hasHydrated && address),
  );
  const pendingPlacementQuery = usePendingPlacementsQuery(
    isAuthenticated && hasHydrated,
  );
  const profile = profileQuery.data?.profile;

  return (
    <MobileLayout
      eyebrow="Promotion Dashboard"
      title="3U AURA Promotion Hub"
      description="This frontend now reads promotion facts from the server and contracts, submits referral NFT mints with backend-issued signatures, and syncs claim receipts back into server state."
      actions={
        <>
          <GradientButton asChild>
            <Link href="/checkin">Open Check-In</Link>
          </GradientButton>
          <GradientButton asChild className="bg-white/10 shadow-none">
            <Link href="/team">Open Team</Link>
          </GradientButton>
        </>
      }
    >
      <div className="space-y-4">
        {!isConnected || !isAuthenticated ? (
          <GlassCard className="border border-amber-400/20 bg-amber-400/8 p-5">
            <div className="mb-3 flex items-center gap-3 text-amber-200">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="text-sm font-semibold">Wallet sign-in required</h2>
            </div>
            <p className="text-sm leading-6 text-white/72">
              Connect the wallet and complete signature sign-in before the dashboard can query profile, team, reward, and claim data.
            </p>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.24em] text-orange-300/75">
                Weekly Epoch
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-[11px] font-medium text-emerald-300">
                {epochQuery.data?.status ?? "Loading"}
              </span>
            </div>
            <p className="text-3xl font-semibold text-white">
              #{epochQuery.data?.epochNo ?? "-"}
            </p>
            <p className="mt-3 text-sm text-white/65">
              {formatDateTime(epochQuery.data?.startAt)} to{" "}
              {formatDateTime(epochQuery.data?.endAt)}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Pending placements</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {pendingPlacementQuery.data?.length ?? 0}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Referral NFT status</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {eligibilityQuery.data?.status ?? "Not loaded"}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-[0.24em] text-orange-300/75">
                Personal Totals
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Total check-ins</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {profile?.totalCheckinCount ?? 0}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Current streak</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {profile?.currentStreakDays ?? 0} days
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Paid USDT</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatUsdtAtomic(profile?.totalCheckinUsdt)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">AURA from check-in</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatAuraAtomic(profile?.totalAuraFromCheckin)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Left volume</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatUsdtAtomic(profile?.leftTeamVolume)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/50">Right volume</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatUsdtAtomic(profile?.rightTeamVolume)}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4">
          {dashboardSections.map((section) => {
            const Icon = section.icon;

            return (
              <GlassCard key={section.href} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-300">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>
                  <GradientButton asChild className="h-9 px-4 text-xs">
                    <Link href={section.href}>Open</Link>
                  </GradientButton>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white">{section.title}</h2>
                <p className="text-sm leading-6 text-white/68">{section.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
