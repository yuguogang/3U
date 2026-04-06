"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { AdminPromotionRoleKey } from "3u-aura-common";
import {
  formatAddress,
  formatAtomic,
  formatCount,
  formatDateTime,
  formatJson,
} from "@/lib/admin-format";
import {
  usePreviewSubsidyPublishMutation,
  useSubsidyOverviewQuery,
} from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  FieldLabel,
  JsonPreview,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  PanelTitle,
  StatusPill,
  TextInput,
} from "@/features/lists/components/shared";

const settlementAbi = [
  {
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "subsidyAmount", type: "uint128" },
      { name: "claimDeadline", type: "uint64" },
    ],
    name: "publishSubsidyEpoch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

function hasRole(
  roles: Array<{ key: AdminPromotionRoleKey; matchesOperator: boolean }>,
  ...keys: AdminPromotionRoleKey[]
) {
  return roles.some((role) => role.matchesOperator && keys.includes(role.key));
}

export function SubsidyCenterPage() {
  const enabled = useAdminSessionReady();
  const { address } = useAccount();
  const chainId = useChainId();
  const nativeBalance = useBalance({
    address,
    query: {
      enabled: Boolean(address),
    },
  });
  const { writeContractAsync } = useWriteContract();
  const [epochNo, setEpochNo] = useState("");
  const [subsidyAmountAtomic, setSubsidyAmountAtomic] = useState("30000000");
  const [claimDeadline, setClaimDeadline] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const subsidyOverviewQuery = useSubsidyOverviewQuery({}, enabled);
  const previewPublishMutation = usePreviewSubsidyPublishMutation();
  const txReceipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  useEffect(() => {
    if (!epochNo && subsidyOverviewQuery.data?.publishedEpochs.length) {
      const nextEpoch =
        subsidyOverviewQuery.data.publishedEpochs[0]!.epochNo + 1;
      setEpochNo(String(nextEpoch));
    }
  }, [epochNo, subsidyOverviewQuery.data?.publishedEpochs]);

  useEffect(() => {
    if (!txReceipt.data) {
      return;
    }

    setSnapshot(
      formatJson({
        action: "publish-subsidy-epoch",
        hash: txHash,
        receipt: txReceipt.data,
      }),
    );
    setTxHash(undefined);
    void subsidyOverviewQuery.refetch();
  }, [txHash, txReceipt.data, subsidyOverviewQuery]);

  const previewPayload = useMemo(() => {
    if (!epochNo || !claimDeadline) {
      return null;
    }

    const parsedDeadline = new Date(claimDeadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return null;
    }

    return {
      claimDeadline: parsedDeadline.toISOString(),
      epochNo: Number(epochNo),
      subsidyAmountAtomic,
    };
  }, [claimDeadline, epochNo, subsidyAmountAtomic]);

  if (!enabled) {
    return (
      <EmptyState
        description="购买型 NFT 补贴发布需要管理员钱包登录后才能查看。"
        title="Admin session required"
      />
    );
  }

  if (subsidyOverviewQuery.isLoading) {
    return <LoadingState label="Loading subsidy center" />;
  }

  if (subsidyOverviewQuery.error) {
    return <ErrorState error={subsidyOverviewQuery.error} />;
  }

  const overview = subsidyOverviewQuery.data;
  if (!overview) {
    return (
      <EmptyState
        description="补贴中心没有返回数据。先检查 server 的 `/api/v1/admin/subsidy`。"
        title="No subsidy data"
      />
    );
  }

  const preview = previewPublishMutation.data?.result;
  const hasGas = Boolean(
    nativeBalance.data && nativeBalance.data.value > BigInt(0),
  );
  const nativeBalanceText = nativeBalance.data
    ? formatAtomic(nativeBalance.data.value.toString(), 18)
    : "0";
  const operatorCanPublish = hasRole(
    overview.roles,
    "OWNER",
    "SETTLEMENT_PUBLISHER",
  );
  const financeWalletMatched = hasRole(overview.roles, "FINANCE_WALLET", "OWNER");
  const nextSuggestedEpochNo = overview.publishedEpochs.length
    ? overview.publishedEpochs[0]!.epochNo + 1
    : 1;

  const handlePreview = async () => {
    if (!previewPayload) {
      return;
    }

    const result = await previewPublishMutation.mutateAsync(previewPayload);
    setSnapshot(formatJson(result));
  };

  const handlePublish = async () => {
    if (!preview?.walletAction?.contractAddress) {
      return;
    }

    const hash = await writeContractAsync({
      abi: settlementAbi,
      address: preview.walletAction.contractAddress as `0x${string}`,
      args: [
        BigInt(preview.walletAction.args[0] ?? "0"),
        BigInt(preview.walletAction.args[1] ?? "0"),
        BigInt(preview.walletAction.args[2] ?? "0"),
      ],
      functionName: "publishSubsidyEpoch",
    });
    setTxHash(hash);
  };

  return (
    <div className="space-y-6">
      <PageIntro
        description="购买型 NFT 补贴是独立链路。页面会先做 server-side preflight，再根据当前连接钱包的角色和 gas 情况判断是否可以真正发链上交易。"
        title="Purchased NFT Subsidy"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Published Epochs"
          value={formatCount(overview.publishedEpochs.length)}
        />
        <MetricCard
          label="Next Suggested Epoch"
          tone="accent"
          value={`#${nextSuggestedEpochNo}`}
        />
        <MetricCard label="Current Chain" value={String(chainId ?? "-")} />
        <MetricCard
          label="Current Chain Time"
          value={formatDateTime(overview.currentChainTime)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel>
          <PanelTitle
            description="先做 preview，再决定是否发链上 publish。"
            title="Publish Preflight"
          />
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="subsidy-epoch-no">Epoch No</FieldLabel>
              <TextInput
                id="subsidy-epoch-no"
                onChange={(event) => setEpochNo(event.target.value)}
                placeholder={String(nextSuggestedEpochNo)}
                value={epochNo}
              />
            </div>
            <div>
              <FieldLabel htmlFor="subsidy-amount">Subsidy Amount Atomic</FieldLabel>
              <TextInput
                id="subsidy-amount"
                onChange={(event) => setSubsidyAmountAtomic(event.target.value)}
                placeholder="30000000"
                value={subsidyAmountAtomic}
              />
            </div>
            <div>
              <FieldLabel htmlFor="subsidy-deadline">Claim Deadline</FieldLabel>
              <TextInput
                id="subsidy-deadline"
                onChange={(event) => setClaimDeadline(event.target.value)}
                type="datetime-local"
                value={claimDeadline}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                disabled={!previewPayload || previewPublishMutation.isPending}
                onClick={handlePreview}
              >
                {previewPublishMutation.isPending ? "Previewing..." : "Preview publish"}
              </ActionButton>
              <ActionButton
                disabled={
                  !preview?.canPublish ||
                  !operatorCanPublish ||
                  !hasGas ||
                  !preview.walletAction?.enabled ||
                  txReceipt.isLoading
                }
                onClick={handlePublish}
                tone="danger"
              >
                {txReceipt.isLoading ? "Publishing..." : "Publish on-chain"}
              </ActionButton>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            description="publisher 角色、MockUSDT 余额/allowance 和 gas 都会直接影响发布是否能成功。"
            title="Operator Runtime"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Connected wallet</span>
                <span className="font-mono text-xs">{formatAddress(address)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Server operator</span>
                <span className="font-mono text-xs">
                  {formatAddress(overview.operatorWallet)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Publisher role</span>
                <StatusPill tone={operatorCanPublish ? "success" : "warning"}>
                  {operatorCanPublish ? "Matched" : "Required"}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Finance wallet</span>
                <StatusPill tone={financeWalletMatched ? "success" : "warning"}>
                  {financeWalletMatched ? "Matched" : "Check"}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Native balance</span>
                <StatusPill tone={hasGas ? "success" : "warning"}>
                  {nativeBalanceText}
                </StatusPill>
              </div>
              {preview ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Operator MockUSDT</span>
                    <StatusPill
                      tone={
                        BigInt(preview.operatorBalanceAtomic) >=
                        BigInt(preview.estimatedFundingAmountAtomic)
                          ? "success"
                          : "warning"
                      }
                    >
                      {formatAtomic(preview.operatorBalanceAtomic, 6, "USDT")}
                    </StatusPill>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Operator allowance</span>
                    <StatusPill
                      tone={
                        BigInt(preview.operatorAllowanceAtomic) >=
                        BigInt(preview.estimatedFundingAmountAtomic)
                          ? "success"
                          : "warning"
                      }
                    >
                      {formatAtomic(preview.operatorAllowanceAtomic, 6, "USDT")}
                    </StatusPill>
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              {overview.roles.map((role) => (
                <div
                  className="flex items-center justify-between"
                  key={role.key}
                >
                  <span>{role.label}</span>
                  <span className="font-mono text-xs">
                    {formatAddress(role.address)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <PanelTitle
            description="preview 结果会明确告诉你当前为什么能发或不能发。"
            title="Preview Result"
          />
          {preview ? (
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Can publish</span>
                <StatusPill tone={preview.canPublish ? "success" : "warning"}>
                  {preview.canPublish ? "Yes" : "Blocked"}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Current chain time</span>
                <span>{formatDateTime(preview.currentChainTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Claim deadline</span>
                <span>{formatDateTime(preview.claimDeadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated funding</span>
                <span>{formatAtomic(preview.estimatedFundingAmountAtomic, 6, "USDT")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Settlement contract</span>
                <span className="font-mono text-xs">
                  {formatAddress(preview.settlementAddress)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment token</span>
                <span className="font-mono text-xs">
                  {formatAddress(preview.paymentTokenAddress)}
                </span>
              </div>
              {preview.blockers.length ? (
                <div className="space-y-2 text-rose-200">
                  {preview.blockers.map((blocker: string) => (
                    <div key={blocker}>- {blocker}</div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-200">
                  server-side preflight passed. 现在只剩当前连接钱包的 gas 和签名确认。
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              先填写 `epochNo`、`subsidyAmountAtomic` 和 `claimDeadline`，再做 preview。
            </p>
          )}
        </Panel>

        <Panel>
          <PanelTitle
            description="这些数据来自链上已发布的 subsidy epochs。"
            title="Published Epochs"
          />
          <div className="grid gap-4">
            {overview.publishedEpochs.length ? (
              overview.publishedEpochs.map((epoch) => (
                <div
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  key={epoch.epochNo}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white">Epoch #{epoch.epochNo}</div>
                    <StatusPill tone="success">Published</StatusPill>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Subsidy amount</span>
                      <span>{epoch.subsidyAmountUsdt} USDT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Funding locked</span>
                      <span>{formatAtomic(epoch.publishedFundingAmountAtomic, 6, "USDT")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Remaining budget</span>
                      <span>{formatAtomic(epoch.remainingBudgetAtomic, 6, "USDT")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Eligible supply</span>
                      <span>{formatCount(epoch.eligiblePurchasedSupply)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Claimed supply</span>
                      <span>{formatCount(epoch.claimedPurchasedSupply)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Published at</span>
                      <span>{formatDateTime(epoch.publishedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Claim deadline</span>
                      <span>{formatDateTime(epoch.claimDeadline)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No subsidy epoch has been published yet.</p>
            )}
          </div>
        </Panel>
      </div>

      {snapshot ? <JsonPreview title="Operation Result" value={snapshot} /> : null}
    </div>
  );
}
