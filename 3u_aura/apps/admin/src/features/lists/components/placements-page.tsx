"use client";

import { useState } from "react";
import { formatAddress, formatDateTime } from "@/lib/admin-format";
import { usePendingPlacementsQuery } from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  DataTable,
  EmptyState,
  ErrorState,
  FieldLabel,
  LoadingState,
  PageIntro,
  Panel,
  PanelTitle,
  TextInput,
} from "./shared";

export function PlacementsPage() {
  const enabled = useAdminSessionReady();
  const [search, setSearch] = useState("");
  const query = usePendingPlacementsQuery(
    {
      search: search || undefined,
      skip: 0,
      take: 20,
    },
    enabled,
  );

  if (!enabled) {
    return (
      <EmptyState
        description="挂树待办读取的是受保护的 admin read model。"
        title="Admin session required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="当前后台只展示待挂树队列，不做完整团队树渲染。团队树选择体验仍在用户 DApp 内完成。"
        title="Pending Placements"
      />

      <Panel>
        <PanelTitle description="按下级或邀请人地址搜索。" title="Filters" />
        <div className="max-w-xl">
          <FieldLabel htmlFor="placement-search">Search</FieldLabel>
          <TextInput
            id="placement-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="wallet or inviter"
            value={search}
          />
        </div>
      </Panel>

      {query.isLoading ? <LoadingState label="Loading pending placements" /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {query.data ? (
        <Panel>
          <PanelTitle
            description={`Showing ${query.data.items.length} of ${query.data.count} pending placements.`}
            title="Pending Placement Queue"
          />
          <DataTable
            columns={["Registered User", "Inviter", "Invite Code", "Registered At"]}
          >
            {query.data.items.map((item) => (
              <tr key={item.userId}>
                <td className="px-4 py-4">
                  <div className="font-medium text-white">{formatAddress(item.walletAddress)}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.userId}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-white">
                    {formatAddress(item.inviterWalletAddress)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{item.inviterId}</div>
                </td>
                <td className="px-4 py-4 text-slate-300">{item.inviteCode || "-"}</td>
                <td className="px-4 py-4 text-slate-400">
                  {formatDateTime(item.createdAt)}
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}
    </div>
  );
}
