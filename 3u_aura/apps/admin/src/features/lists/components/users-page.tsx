"use client";

import { useState } from "react";
import { UserStatus } from "3u-aura-common";
import { formatAddress, formatDateTime } from "@/lib/admin-format";
import { useAdminUsersQuery } from "@/queries/admin.query";
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
  SelectInput,
  StatusPill,
  TextInput,
} from "./shared";

export function UsersPage() {
  const enabled = useAdminSessionReady();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | UserStatus>("");

  const query = useAdminUsersQuery(
    {
      search: search || undefined,
      skip: 0,
      status: status || undefined,
      take: 20,
    },
    enabled,
  );

  if (!enabled) {
    return (
      <EmptyState
        description="用户检索依赖受保护的 admin route。先完成管理员签名登录。"
        title="Admin session required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="用户页只承担运营检索，不承担树修复或资金操作。管理员 allowlist 状态直接由后端计算返回。"
        title="Users"
      />

      <Panel>
        <PanelTitle
          description="按钱包地址、邀请码和状态过滤。"
          title="Filters"
        />
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <FieldLabel htmlFor="users-search">Search</FieldLabel>
            <TextInput
              id="users-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="wallet or invite code"
              value={search}
            />
          </div>
          <div>
            <FieldLabel htmlFor="users-status">Status</FieldLabel>
            <SelectInput
              id="users-status"
              onChange={(event) =>
                setStatus((event.target.value || "") as "" | UserStatus)
              }
              value={status}
            >
              <option value="">All</option>
              <option value={UserStatus.ACTIVE}>ACTIVE</option>
              <option value={UserStatus.INACTIVE}>INACTIVE</option>
              <option value={UserStatus.BLOCKED}>BLOCKED</option>
            </SelectInput>
          </div>
        </div>
      </Panel>

      {query.isLoading ? <LoadingState label="Loading users" /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {query.data ? (
        <Panel>
          <PanelTitle
            description={`Showing ${query.data.items.length} of ${query.data.count} users.`}
            title="User Listing"
          />
          <DataTable
            columns={[
              "Wallet",
              "Invite",
              "Status",
              "Tree",
              "Admin",
              "Created",
            ]}
          >
            {query.data.items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-medium text-white">{formatAddress(item.walletAddress)}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.id}</div>
                </td>
                <td className="px-4 py-4 text-slate-300">{item.inviteCode || "-"}</td>
                <td className="px-4 py-4">
                  <StatusPill>{item.status}</StatusPill>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  {item.parentId ? "Mounted" : item.inviterId ? "Pending placement" : "No inviter"}
                </td>
                <td className="px-4 py-4">
                  <StatusPill tone={item.isAdminAllowed ? "success" : "default"}>
                    {item.isAdminAllowed ? "Allowlisted" : "User"}
                  </StatusPill>
                </td>
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
