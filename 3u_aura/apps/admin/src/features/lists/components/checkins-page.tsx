"use client";

import { useMemo, useState } from "react";
import { formatAddress, formatAtomic, formatDateTime, formatJson } from "@/lib/admin-format";
import {
  useCheckinIssuesQuery,
  useExecuteCheckinRepairMutation,
  usePreviewCheckinRepairMutation,
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

export function CheckinsPage() {
  const enabled = useAdminSessionReady();
  const [search, setSearch] = useState("");
  const [onlyUnlinked, setOnlyUnlinked] = useState("true");
  const [userId, setUserId] = useState("");
  const [payerAddress, setPayerAddress] = useState("");
  const [txHash, setTxHash] = useState("");
  const [chainId, setChainId] = useState("97");
  const [amountAtomic, setAmountAtomic] = useState("3000000");
  const [operationSnapshot, setOperationSnapshot] = useState<string | null>(null);

  const listQuery = useCheckinIssuesQuery(
    {
      onlyUnlinked: onlyUnlinked === "true" ? true : undefined,
      search: search || undefined,
      skip: 0,
      take: 20,
    },
    enabled,
  );
  const previewMutation = usePreviewCheckinRepairMutation();
  const executeMutation = useExecuteCheckinRepairMutation();

  const requestPayload = useMemo(
    () => ({
      amountAtomic,
      chainId: Number(chainId),
      payerAddress,
      txHash,
      userId,
    }),
    [amountAtomic, chainId, payerAddress, txHash, userId],
  );

  if (!enabled) {
    return (
      <EmptyState
        description="签到补单是后台受保护写动作，必须先完成管理员登录。"
        title="Admin session required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="这页优先处理 check-in payment receipt 与 checkin 记录脱钩的场景。第一版仅支持 dry-run 和显式执行，不暴露批量改库。"
        title="Check-in Issues"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelTitle
            description="优先关注 onlyUnlinked=true 的 payment receipt。"
            title="Issue Listing"
          />
          <div className="mb-4 grid gap-4 md:grid-cols-[2fr_1fr]">
            <div>
              <FieldLabel htmlFor="checkin-search">Search</FieldLabel>
              <TextInput
                id="checkin-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="tx hash, payer or wallet"
                value={search}
              />
            </div>
            <div>
              <FieldLabel htmlFor="checkin-unlinked">Filter</FieldLabel>
              <SelectInput
                id="checkin-unlinked"
                onChange={(event) => setOnlyUnlinked(event.target.value)}
                value={onlyUnlinked}
              >
                <option value="true">Only unlinked</option>
                <option value="all">All receipts</option>
              </SelectInput>
            </div>
          </div>

          {listQuery.isLoading ? <LoadingState label="Loading check-in issues" /> : null}
          {listQuery.error ? <ErrorState error={listQuery.error} /> : null}
          {listQuery.data ? (
            <DataTable
              columns={[
                "Wallet",
                "Tx Hash",
                "Amount",
                "Status",
                "Check-in",
                "Created",
              ]}
            >
              {listQuery.data.items.map((item) => (
                <tr key={item.paymentReceiptId}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{formatAddress(item.walletAddress)}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.userId}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.txHash || "-"}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {formatAtomic(item.amountAtomic, 6, "USDT")}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill>{item.paymentStatus}</StatusPill>
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {item.checkinId ? item.checkinId : "Unlinked"}
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {formatDateTime(item.createdAt)}
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : null}
        </Panel>

        <Panel>
          <PanelTitle
            description="输入明确 business key 后先预演，再执行。"
            title="Check-in Repair"
          />
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="checkin-user-id">User ID</FieldLabel>
              <TextInput id="checkin-user-id" onChange={(event) => setUserId(event.target.value)} value={userId} />
            </div>
            <div>
              <FieldLabel htmlFor="checkin-payer-address">Payer Address</FieldLabel>
              <TextInput
                id="checkin-payer-address"
                onChange={(event) => setPayerAddress(event.target.value)}
                placeholder="0x..."
                value={payerAddress}
              />
            </div>
            <div>
              <FieldLabel htmlFor="checkin-tx-hash">Tx Hash</FieldLabel>
              <TextInput
                id="checkin-tx-hash"
                onChange={(event) => setTxHash(event.target.value)}
                placeholder="0x..."
                value={txHash}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="checkin-chain-id">Chain ID</FieldLabel>
                <TextInput
                  id="checkin-chain-id"
                  onChange={(event) => setChainId(event.target.value)}
                  value={chainId}
                />
              </div>
              <div>
                <FieldLabel htmlFor="checkin-amount">Amount Atomic</FieldLabel>
                <TextInput
                  id="checkin-amount"
                  onChange={(event) => setAmountAtomic(event.target.value)}
                  value={amountAtomic}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                disabled={previewMutation.isPending}
                onClick={async () => {
                  const result = await previewMutation.mutateAsync(requestPayload);
                  setOperationSnapshot(formatJson(result));
                }}
              >
                {previewMutation.isPending ? "Previewing..." : "Preview repair"}
              </ActionButton>
              <ActionButton
                disabled={executeMutation.isPending}
                onClick={async () => {
                  const result = await executeMutation.mutateAsync(requestPayload);
                  setOperationSnapshot(formatJson(result));
                }}
                tone="danger"
              >
                {executeMutation.isPending ? "Executing..." : "Execute repair"}
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
