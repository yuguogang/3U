"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/admin-format";
import { useAuditLogsQuery } from "@/queries/admin.query";
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

export function AuditPage() {
  const enabled = useAdminSessionReady();
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const query = useAuditLogsQuery(
    {
      action: action || undefined,
      skip: 0,
      take: 20,
      targetType: targetType || undefined,
    },
    enabled,
  );

  if (!enabled) {
    return (
      <EmptyState
        description="审计轨迹只对后台 operator 可见。"
        title="Admin session required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="所有 admin 写动作都应该落到 `AdminAuditLog`。这页用于验证 repair/sync 是否真正持久化。"
        title="Audit Trail"
      />

      <Panel>
        <PanelTitle description="按 action 和 target type 过滤。" title="Filters" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="audit-action">Action</FieldLabel>
            <TextInput
              id="audit-action"
              onChange={(event) => setAction(event.target.value)}
              placeholder="admin.ops.claim-sync.execute"
              value={action}
            />
          </div>
          <div>
            <FieldLabel htmlFor="audit-target-type">Target Type</FieldLabel>
            <TextInput
              id="audit-target-type"
              onChange={(event) => setTargetType(event.target.value)}
              placeholder="Claim or WeeklyEpoch"
              value={targetType}
            />
          </div>
        </div>
      </Panel>

      {query.isLoading ? <LoadingState label="Loading audit logs" /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {query.data ? (
        <Panel>
          <PanelTitle
            description={`Showing ${query.data.items.length} of ${query.data.count} log entries.`}
            title="Audit Entries"
          />
          <DataTable
            columns={["Created", "Action", "Operator", "Target", "Payload"]}
          >
            {query.data.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4 text-slate-400">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-4 text-slate-200">{item.action}</td>
                <td className="px-4 py-4 text-slate-300">{item.operatorWallet || "-"}</td>
                <td className="px-4 py-4 text-slate-300">
                  {item.targetType || "-"}
                  {item.targetId ? (
                    <div className="mt-1 text-xs text-slate-500">{item.targetId}</div>
                  ) : null}
                </td>
                <td className="max-w-[320px] px-4 py-4">
                  <pre className="overflow-x-auto text-xs leading-6 text-slate-400">
                    {item.payload ? JSON.stringify(item.payload, null, 2) : "-"}
                  </pre>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}
    </div>
  );
}
