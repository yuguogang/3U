"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { AdminPromotionRoleKey, AdminWeeklySettlementStepKey } from "3u-aura-common";
import {
  formatAddress,
  formatAtomic,
  formatCount,
  formatDateTime,
  formatJson,
} from "@/lib/admin-format";
import {
  useExecuteEpochSyncMutation,
  useExecuteRewardPublicationMutation,
  useExecuteWeeklySettlementDraftMutation,
  useExecuteWeeklySettlementPublishMutation,
  useWeeklySettlementQuery,
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

const merkleClaimAbi = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositRewardsFromFunder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "merkleRoot", type: "bytes32" },
    ],
    name: "publishRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

function toneForStatus(status: "BLOCKED" | "COMPLETED" | "FAILED" | "READY") {
  if (status === "COMPLETED") {
    return "success" as const;
  }
  if (status === "READY") {
    return "warning" as const;
  }
  return "danger" as const;
}

function hasRole(
  roles: Array<{ key: AdminPromotionRoleKey; matchesOperator: boolean }>,
  ...keys: AdminPromotionRoleKey[]
) {
  return roles.some((role) => role.matchesOperator && keys.includes(role.key));
}

export function WeeklySettlementPage() {
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
  const [referenceAt, setReferenceAt] = useState("");
  const [epochNo, setEpochNo] = useState("");
  const [rewardJsonUri, setRewardJsonUri] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txLabel, setTxLabel] = useState<string>("");

  const weeklySettlementQuery = useWeeklySettlementQuery(
    {
      epochNo: epochNo ? Number(epochNo) : undefined,
      referenceAt: referenceAt || undefined,
    },
    enabled,
  );
  const executeEpochSyncMutation = useExecuteEpochSyncMutation();
  const executeDraftMutation = useExecuteWeeklySettlementDraftMutation();
  const executePublishMutation = useExecuteWeeklySettlementPublishMutation();
  const executeActivateMutation = useExecuteRewardPublicationMutation();
  const txReceipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  useEffect(() => {
    if (!epochNo && weeklySettlementQuery.data?.selectedEpoch?.epochNo) {
      setEpochNo(String(weeklySettlementQuery.data.selectedEpoch.epochNo));
    }
  }, [epochNo, weeklySettlementQuery.data?.selectedEpoch?.epochNo]);

  useEffect(() => {
    if (!txReceipt.data) {
      return;
    }

    setSnapshot(
      formatJson({
        action: txLabel,
        hash: txHash,
        receipt: txReceipt.data,
      }),
    );
    setTxHash(undefined);
    void weeklySettlementQuery.refetch();
  }, [txHash, txLabel, txReceipt.data, weeklySettlementQuery]);

  if (!enabled) {
    return (
      <EmptyState
        description="周结算向导需要管理员钱包登录后才能查看。"
        title="Admin session required"
      />
    );
  }

  if (weeklySettlementQuery.isLoading) {
    return <LoadingState label="Loading weekly settlement center" />;
  }

  if (weeklySettlementQuery.error) {
    return <ErrorState error={weeklySettlementQuery.error} />;
  }

  const overview = weeklySettlementQuery.data;
  if (!overview) {
    return (
      <EmptyState
        description="周结算中心没有返回数据。先检查 server 的 `/api/v1/admin/settlement/weekly`。"
        title="No settlement data"
      />
    );
  }

  const operatorCanPublish = hasRole(
    overview.roles,
    "OWNER",
    "ROOT_PUBLISHER",
  );
  const hasGas = Boolean(
    nativeBalance.data && nativeBalance.data.value > BigInt(0),
  );
  const nativeBalanceText = nativeBalance.data
    ? formatAtomic(nativeBalance.data.value.toString(), 18)
    : "0";
  const rootStep = overview.steps.find((step) => step.key === "PUBLISH_ROOT");
  const fundStep = overview.steps.find(
    (step) => step.key === "FUND_DISTRIBUTOR",
  );
  const selectedEpochStatus =
    overview.selectedEpoch?.status ?? overview.currentBoundary.status ?? "-";

  const latestEpochText = overview.latestEpochs.length
    ? overview.latestEpochs
        .map((epoch) => `#${epoch.epochNo} ${epoch.status}`)
        .join(" / ")
    : "No history";

  const executeWalletAction = async (
    stepKey: AdminWeeklySettlementStepKey,
  ) => {
    const step = overview.steps.find((item) => item.key === stepKey);
    if (!step?.action?.contractAddress) {
      return;
    }

    if (step.action.functionName === "depositRewardsFromFunder") {
      const hash = await writeContractAsync({
        abi: merkleClaimAbi,
        address: step.action.contractAddress as `0x${string}`,
        args: [BigInt(step.action.args[0] ?? "0")],
        functionName: "depositRewardsFromFunder",
      });
      setTxLabel(step.action.label);
      setTxHash(hash);
      return;
    }

    const hash = await writeContractAsync({
      abi: merkleClaimAbi,
      address: step.action.contractAddress as `0x${string}`,
      args: [
        BigInt(step.action.args[0] ?? "0"),
        (step.action.args[1] ?? "") as `0x${string}`,
      ],
      functionName: "publishRoot",
    });
    setTxLabel(step.action.label);
    setTxHash(hash);
  };

  const handleEpochSync = async () => {
    const result = await executeEpochSyncMutation.mutateAsync({
      referenceAt: referenceAt || undefined,
    });
    setSnapshot(formatJson(result));
    await weeklySettlementQuery.refetch();
  };

  const handleGenerateDraft = async () => {
    if (!overview.selectedEpoch) {
      return;
    }

    const result = await executeDraftMutation.mutateAsync({
      epochNo: overview.selectedEpoch.epochNo,
    });
    setSnapshot(formatJson(result));
    await weeklySettlementQuery.refetch();
  };

  const handlePublishDraft = async () => {
    if (!overview.selectedEpoch) {
      return;
    }

    const result = await executePublishMutation.mutateAsync({
      epochNo: overview.selectedEpoch.epochNo,
    });
    setSnapshot(formatJson(result));
    await weeklySettlementQuery.refetch();
  };

  const handleActivateClaims = async () => {
    if (!overview.selectedEpoch) {
      return;
    }

    const result = await executeActivateMutation.mutateAsync({
      epochNo: overview.selectedEpoch.epochNo,
      rewardJsonUri: rewardJsonUri || undefined,
    });
    setSnapshot(formatJson(result));
    await weeklySettlementQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <PageIntro
        description="把周结算拆成清晰的 6 步：先同步 epoch，再生成与发布 draft，然后完成链上 funding / root，最后激活 claims。页面直接显示 blockers、所需角色和可执行的钱包动作。"
        title="Weekly Settlement"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Selected Epoch"
          value={`#${overview.selectedEpoch?.epochNo ?? overview.currentBoundary.epochNo}`}
        />
        <MetricCard label="Epoch Status" tone="accent" value={selectedEpochStatus} />
        <MetricCard
          label="Participants"
          value={formatCount(overview.selectedEpoch?.participantCount)}
        />
        <MetricCard
          label="Qualified Tickets"
          value={formatCount(overview.selectedEpoch?.qualifiedTicketCount)}
        />
        <MetricCard
          label="Weekly Reward"
          value={formatAtomic(overview.totalRewardAmountAtomic, 6, "USDT")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel>
          <PanelTitle
            description="`referenceAt` 用于复盘特定边界，`epochNo` 用于查看历史期。空值默认看当前边界。"
            title="Scope"
          />
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="weekly-reference-at">Reference At</FieldLabel>
              <TextInput
                id="weekly-reference-at"
                onChange={(event) => setReferenceAt(event.target.value)}
                placeholder="2026-04-03T00:00:00.000Z"
                value={referenceAt}
              />
            </div>
            <div>
              <FieldLabel htmlFor="weekly-epoch-no">Epoch No</FieldLabel>
              <TextInput
                id="weekly-epoch-no"
                onChange={(event) => setEpochNo(event.target.value)}
                placeholder={String(overview.currentBoundary.epochNo)}
                value={epochNo}
              />
            </div>
            <div>
              <FieldLabel htmlFor="reward-json-uri">Reward JSON URI</FieldLabel>
              <TextInput
                id="reward-json-uri"
                onChange={(event) => setRewardJsonUri(event.target.value)}
                placeholder="ipfs://weekly-root.json"
                value={rewardJsonUri}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                disabled={weeklySettlementQuery.isFetching}
                onClick={() => weeklySettlementQuery.refetch()}
              >
                {weeklySettlementQuery.isFetching ? "Refreshing..." : "Refresh"}
              </ActionButton>
              <ActionButton
                disabled={executeEpochSyncMutation.isPending}
                onClick={handleEpochSync}
                tone="danger"
              >
                {executeEpochSyncMutation.isPending ? "Syncing..." : "Execute epoch sync"}
              </ActionButton>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            description="当前连接钱包需要匹配 owner/rootPublisher 才能完成链上 funding 和 root publish。"
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
                <span>Connected chain</span>
                <StatusPill
                  tone={chainId === overview.chainId ? "success" : "warning"}
                >
                  {chainId ?? "-"}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Owner / root publisher</span>
                <StatusPill tone={operatorCanPublish ? "success" : "warning"}>
                  {operatorCanPublish ? "Matched" : "Required"}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>Native balance</span>
                <StatusPill tone={hasGas ? "success" : "warning"}>
                  {nativeBalanceText}
                </StatusPill>
              </div>
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

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel>
          <PanelTitle
            description="每一步都显示 server 判断出的状态和 blockers，按钮只在真正可执行时开放。"
            title="Settlement Steps"
          />
          <div className="grid gap-4">
            {overview.steps.map((step) => (
              <div
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                key={step.key}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{step.label}</div>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {step.description}
                    </p>
                    {step.value ? (
                      <p className="mt-2 text-xs font-mono text-slate-500">
                        {step.value}
                      </p>
                    ) : null}
                  </div>
                  <StatusPill tone={toneForStatus(step.status)}>
                    {step.status}
                  </StatusPill>
                </div>
                {step.blockers.length ? (
                  <div className="mt-3 space-y-2 text-sm text-rose-200">
                    {step.blockers.map((blocker: string) => (
                      <div key={blocker}>- {blocker}</div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {step.key === "GENERATE_DRAFT" ? (
                    <ActionButton
                      disabled={
                        executeDraftMutation.isPending || step.status !== "READY"
                      }
                      onClick={handleGenerateDraft}
                    >
                      {executeDraftMutation.isPending ? "Generating..." : "Generate draft"}
                    </ActionButton>
                  ) : null}
                  {step.key === "PUBLISH_DRAFT" ? (
                    <ActionButton
                      disabled={
                        executePublishMutation.isPending || step.status !== "READY"
                      }
                      onClick={handlePublishDraft}
                    >
                      {executePublishMutation.isPending ? "Publishing..." : "Publish draft"}
                    </ActionButton>
                  ) : null}
                  {step.key === "FUND_DISTRIBUTOR" ? (
                    <ActionButton
                      disabled={
                        txReceipt.isLoading ||
                        step.status !== "READY" ||
                        !operatorCanPublish ||
                        !hasGas ||
                        !fundStep?.action?.enabled
                      }
                      onClick={() => executeWalletAction("FUND_DISTRIBUTOR")}
                    >
                      {txReceipt.isLoading && txLabel === "Fund distributor"
                        ? "Funding..."
                        : "Fund distributor"}
                    </ActionButton>
                  ) : null}
                  {step.key === "PUBLISH_ROOT" ? (
                    <ActionButton
                      disabled={
                        txReceipt.isLoading ||
                        step.status !== "READY" ||
                        !operatorCanPublish ||
                        !hasGas ||
                        !rootStep?.action?.enabled
                      }
                      onClick={() => executeWalletAction("PUBLISH_ROOT")}
                    >
                      {txReceipt.isLoading && txLabel === "Publish root"
                        ? "Publishing..."
                        : "Publish root"}
                    </ActionButton>
                  ) : null}
                  {step.key === "ACTIVATE_CLAIMS" ? (
                    <ActionButton
                      disabled={
                        executeActivateMutation.isPending || step.status !== "READY"
                      }
                      onClick={handleActivateClaims}
                      tone="danger"
                    >
                      {executeActivateMutation.isPending ? "Activating..." : "Activate claims"}
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelTitle
              description="这里聚合了奖励发布前最关键的 readiness 指标。"
              title="Readiness"
            />
            <div className="space-y-3 text-sm text-slate-300">
              {overview.checks.map((check) => (
                <div key={check.key} className="rounded-2xl border border-white/8 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{check.label}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {check.description}
                      </div>
                    </div>
                    <StatusPill tone={toneForStatus(check.status)}>
                      {check.status}
                    </StatusPill>
                  </div>
                  {check.value ? (
                    <div className="mt-2 font-mono text-xs text-slate-400">
                      {check.value}
                    </div>
                  ) : null}
                  {check.blockers.length ? (
                    <div className="mt-2 space-y-1 text-xs text-rose-200">
                      {check.blockers.map((blocker: string) => (
                        <div key={blocker}>- {blocker}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelTitle
              description="这些字段是 weekly chain flow 真正依赖的链上值。"
              title="Chain State"
            />
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Distributor</span>
                <span className="font-mono text-xs">
                  {formatAddress(overview.merkleDistributorAddress)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reward funder</span>
                <span className="font-mono text-xs">
                  {formatAddress(overview.rewardFunderAddress)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment token</span>
                <span className="font-mono text-xs">
                  {formatAddress(overview.paymentTokenAddress)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Draft root</span>
                <span className="max-w-[220px] truncate font-mono text-xs">
                  {overview.draftMerkleRoot}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>On-chain root</span>
                <span className="max-w-[220px] truncate font-mono text-xs">
                  {overview.onChainMerkleRoot ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Distributor balance</span>
                <span>{formatAtomic(overview.distributorBalanceAtomic, 6, "USDT")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Funder allowance</span>
                <span>{formatAtomic(overview.rewardFunderAllowanceAtomic, 6, "USDT")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Funder balance</span>
                <span>{formatAtomic(overview.rewardFunderBalanceAtomic, 6, "USDT")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Funding shortfall</span>
                <span>{formatAtomic(overview.fundingShortfallAtomic, 6, "USDT")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Recent epochs</span>
                <span className="max-w-[220px] text-right text-xs">
                  {latestEpochText}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Current boundary</span>
                <span className="text-right text-xs">
                  {formatDateTime(overview.currentBoundary.startAt)}
                  <br />
                  {formatDateTime(overview.currentBoundary.endAt)}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {snapshot ? <JsonPreview title="Operation Result" value={snapshot} /> : null}
    </div>
  );
}
