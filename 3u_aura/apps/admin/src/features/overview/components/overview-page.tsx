"use client";

import Link from "next/link";
import { formatCount } from "@/lib/admin-format";
import { useAdminOverviewQuery } from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  PanelTitle,
  StatusPill,
} from "@/features/lists/components/shared";

export function OverviewPage() {
  const enabled = useAdminSessionReady();
  const overviewQuery = useAdminOverviewQuery(enabled);

  if (!enabled) {
    return (
      <EmptyState
        description="管理员页面不会匿名加载数据。先连接 allowlist 钱包并完成签名登录，再查看 promotion 统计、异常和操作台。"
        title="Admin session required"
      />
    );
  }

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading overview metrics" />;
  }

  if (overviewQuery.error) {
    return <ErrorState error={overviewQuery.error} />;
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return (
      <EmptyState
        description="概览接口没有返回内容。先检查 server 的 `/api/v1/admin/overview` 是否可访问。"
        title="No overview data"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="这套后台覆盖 promotion 阶段的最小运营闭环：看统计、查异常、做最小 repair/sync，并处理 referral NFT 人工审批。签名发放前必须先经过管理员审批。"
        eyebrow="Phase 9.3"
        title="Promotion Overview"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Users" value={formatCount(overview.totalUsers)} />
        <MetricCard label="Recent 24h" tone="accent" value={formatCount(overview.recentUsers24h)} />
        <MetricCard label="Pending Placements" tone="warning" value={formatCount(overview.pendingPlacementCount)} />
        <MetricCard label="Claimable Merkle" value={formatCount(overview.claimableMerkleClaimCount)} />
        <MetricCard label="Pending Subsidy Claims" value={formatCount(overview.pendingSubsidyClaimCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelTitle
            description="先看待审批和已批准未签名，再看 signed 与 minted 之间的积压。"
            title="Referral NFT State"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Pending Approval"
              tone="warning"
              value={formatCount(overview.pendingReferralNftApprovalCount)}
            />
            <MetricCard
              label="Approved"
              tone="accent"
              value={formatCount(overview.approvedReferralNftCount)}
            />
            <MetricCard
              label="Signed"
              tone="warning"
              value={formatCount(overview.signedReferralNftCount)}
            />
            <MetricCard
              label="Minted"
              value={formatCount(overview.mintedReferralNftCount)}
            />
          </div>
          <div className="mt-4">
            <MetricCard
              label="Rejected"
              tone="warning"
              value={formatCount(overview.rejectedReferralNftCount)}
            />
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            description="首轮联调环境按 BSC Testnet 97 口径执行。"
            title="Current Runtime"
          />
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Default chain</span>
              <StatusPill tone="warning">BSC Testnet 97</StatusPill>
            </div>
            <div className="flex items-center justify-between">
              <span>Referral NFT approval</span>
              <StatusPill tone="warning">Manual approval</StatusPill>
            </div>
            <div className="flex items-center justify-between">
              <span>Operator model</span>
              <StatusPill tone="warning">Allowlist wallets</StatusPill>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelTitle
            description="最近一期周周期的状态能直接判断 epoch/ticket/settlement 是否卡住。"
            title="Latest Weekly Epoch"
          />
          {overview.latestEpoch ? (
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Epoch No</span>
                <span className="font-medium text-white">#{overview.latestEpoch.epochNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <StatusPill>{overview.latestEpoch.status}</StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Participants</span>
                <span>{formatCount(overview.latestEpoch.participantCount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Qualified tickets</span>
                <span>{formatCount(overview.latestEpoch.qualifiedTicketCount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No weekly epoch has been materialized yet.</p>
          )}
        </Panel>

        <Panel>
          <PanelTitle
            description="这些页面对应当前 admin MVP 的主操作面。"
            title="Quick Links"
          />
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                href: "/dashboard/nft-eligibility",
                label: "Referral NFT approvals",
              },
              {
                href: "/dashboard/checkins",
                label: "Check-in repair",
              },
              {
                href: "/dashboard/ops",
                label: "Weekly epoch sync",
              },
              {
                href: "/dashboard/claims",
                label: "Claim sync replay",
              },
              {
                href: "/dashboard/notifications",
                label: "Notifications",
              },
              {
                href: "/dashboard/audit",
                label: "Audit trail",
              },
            ].map((item) => (
              <Link
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-200 transition hover:bg-white/[0.08]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle
          description="用于核对上一期已发布结果是否和 claims / 公告口径一致。"
          title="Latest Weekly Results"
        />
        {overview.latestWeeklyResults ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Result Epoch"
                value={`#${overview.latestWeeklyResults.epochNo}`}
              />
              <MetricCard
                label="Status"
                tone="accent"
                value={overview.latestWeeklyResults.status}
              />
              <MetricCard
                label="Participants"
                value={formatCount(overview.latestWeeklyResults.participantCount)}
              />
              <MetricCard
                label="Qualified"
                value={formatCount(overview.latestWeeklyResults.qualifiedTicketCount)}
              />
              <MetricCard
                label="Lottery Winners"
                value={formatCount(overview.latestWeeklyResults.lotteryWinners.length)}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Merkle root</span>
                  <span className="max-w-[240px] truncate font-mono text-xs text-slate-200">
                    {overview.latestWeeklyResults.merkleRoot ?? "Not posted"}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">Lottery winners</h3>
                  {overview.latestWeeklyResults.lotteryWinners.length ? (
                    overview.latestWeeklyResults.lotteryWinners.map((winner) => (
                      <div
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                        key={`${winner.userId}:${winner.prizeLabel}`}
                      >
                        <div>
                          <div className="font-medium text-white">{winner.prizeLabel}</div>
                          <div className="font-mono text-xs text-slate-400">
                            {winner.walletAddress}
                          </div>
                        </div>
                        <div>{winner.amountUsdt}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No lottery winners published for the latest result epoch.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Ranking top list</h3>
                {overview.latestWeeklyResults.rankingEntries.length ? (
                  overview.latestWeeklyResults.rankingEntries.map((entry) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                      key={`${entry.userId}:${entry.rank}`}
                    >
                      <div>
                        <div className="font-medium text-white">Rank #{entry.rank}</div>
                        <div className="font-mono text-xs text-slate-400">
                          {entry.walletAddress}
                        </div>
                      </div>
                      <div>{entry.amountUsdt}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No ranking winners published for the latest result epoch.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No published weekly results yet.</p>
        )}
      </Panel>
    </div>
  );
}
