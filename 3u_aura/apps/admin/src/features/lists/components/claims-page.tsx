"use client";

import { useMemo, useState } from "react";
import { ClaimStatus } from "3u-aura-common";
import { formatAddress, formatAtomic, formatJson } from "@/lib/admin-format";
import {
  useClaimIssuesQuery,
  useExecuteClaimSyncMutation,
  usePreviewClaimSyncMutation,
} from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorState,
  FieldLabel,
  JsonPreview,
  LoadingState,
  PageIntro,
  Panel,
  PanelTitle,
  SelectInput,
  StatusPill,
  TextInput,
} from "./shared";

export function ClaimsPage() {
  const enabled = useAdminSessionReady();
  const [search, setSearch] = useState("");
  const [claimKind, setClaimKind] = useState<"" | "MERKLE" | "NFT_SUBSIDY">("MERKLE");
  const [status, setStatus] = useState<"" | ClaimStatus>("");
  const [claimRecordId, setClaimRecordId] = useState("");
  const [subsidyClaimId, setSubsidyClaimId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [operationSnapshot, setOperationSnapshot] = useState<string | null>(null);

  const listQuery = useClaimIssuesQuery(
    {
      claimKind: claimKind || undefined,
      search: search || undefined,
      skip: 0,
      status: status || undefined,
      take: 20,
    },
    enabled,
  );
  const previewMutation = usePreviewClaimSyncMutation();
  const executeMutation = useExecuteClaimSyncMutation();

  const requestPayload = useMemo(
    () => ({
      ...(claimRecordId ? { claimRecordId } : {}),
      ...(subsidyClaimId ? { subsidyClaimId } : {}),
      txHash,
    }),
    [claimRecordId, subsidyClaimId, txHash],
  );

  if (!enabled) {
    return (
      <EmptyState
        description="Claim sync replay 依赖管理员签名会话。"
        title="Admin session required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="Claim 页面同时覆盖 weekly merkle 和 NFT subsidy。sync replay 仍通过 dry-run 预览先判断是否能执行。"
        title="Claim Issues"
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelTitle
            description="可按 claimKind、status、wallet/txHash 过滤。"
            title="Issue Listing"
          />
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel htmlFor="claim-search">Search</FieldLabel>
              <TextInput
                id="claim-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="wallet or tx hash"
                value={search}
              />
            </div>
            <div>
              <FieldLabel htmlFor="claim-kind">Claim Kind</FieldLabel>
              <SelectInput
                id="claim-kind"
                onChange={(event) =>
                  setClaimKind(
                    (event.target.value || "") as "" | "MERKLE" | "NFT_SUBSIDY",
                  )
                }
                value={claimKind}
              >
                <option value="MERKLE">MERKLE</option>
                <option value="NFT_SUBSIDY">NFT_SUBSIDY</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="claim-status">Status</FieldLabel>
              <SelectInput
                id="claim-status"
                onChange={(event) =>
                  setStatus((event.target.value || "") as "" | ClaimStatus)
                }
                value={status}
              >
                <option value="">All</option>
                <option value={ClaimStatus.PENDING}>PENDING</option>
                <option value={ClaimStatus.CLAIMABLE}>CLAIMABLE</option>
                <option value={ClaimStatus.CLAIMED}>CLAIMED</option>
              </SelectInput>
            </div>
          </div>

          {listQuery.isLoading ? <LoadingState label="Loading claim issues" /> : null}
          {listQuery.error ? <ErrorState error={listQuery.error} /> : null}
          {listQuery.data ? (
            <DataTable
              columns={[
                "Wallet",
                "Kind",
                "Status",
                "Epoch",
                "Amount",
                "Tx Hash",
              ]}
            >
              {listQuery.data.items.map((item) => (
                <tr key={item.recordId}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{formatAddress(item.walletAddress)}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.userId}</div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill>{item.claimKind}</StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill tone={item.status === "CLAIMED" ? "success" : "warning"}>
                      {item.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 text-slate-300">#{item.epochNo}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {formatAtomic(item.amountAtomic, 6, "USDT")}
                  </td>
                  <td className="px-4 py-4 text-slate-400">{item.txHash || "-"}</td>
                </tr>
              ))}
            </DataTable>
          ) : null}
        </Panel>

        <Panel>
          <PanelTitle
            description="必须二选一提供 claimRecordId 或 subsidyClaimId。"
            title="Claim Sync Replay"
          />
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="claim-record-id">Claim Record ID</FieldLabel>
              <TextInput
                id="claim-record-id"
                onChange={(event) => setClaimRecordId(event.target.value)}
                value={claimRecordId}
              />
            </div>
            <div>
              <FieldLabel htmlFor="subsidy-claim-id">Subsidy Claim ID</FieldLabel>
              <TextInput
                id="subsidy-claim-id"
                onChange={(event) => setSubsidyClaimId(event.target.value)}
                value={subsidyClaimId}
              />
            </div>
            <div>
              <FieldLabel htmlFor="claim-tx-hash">Tx Hash</FieldLabel>
              <TextInput
                id="claim-tx-hash"
                onChange={(event) => setTxHash(event.target.value)}
                placeholder="0x..."
                value={txHash}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                disabled={previewMutation.isPending}
                onClick={async () => {
                  const result = await previewMutation.mutateAsync(requestPayload);
                  setOperationSnapshot(formatJson(result));
                }}
              >
                {previewMutation.isPending ? "Previewing..." : "Preview sync"}
              </ActionButton>
              <ActionButton
                disabled={executeMutation.isPending}
                onClick={async () => {
                  const result = await executeMutation.mutateAsync(requestPayload);
                  setOperationSnapshot(formatJson(result));
                }}
                tone="danger"
              >
                {executeMutation.isPending ? "Executing..." : "Execute sync"}
              </ActionButton>
            </div>
          </div>
        </Panel>
      </div>

      {operationSnapshot ? (
        <JsonPreview title="Operation Result" value={operationSnapshot} />
      ) : null}
    </div>
  );
}
