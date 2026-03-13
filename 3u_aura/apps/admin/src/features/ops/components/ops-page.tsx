"use client";

import Link from "next/link";
import { useState } from "react";
import { formatJson } from "@/lib/admin-format";
import {
  useExecuteEpochSyncMutation,
  usePreviewEpochSyncMutation,
} from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  ActionButton,
  EmptyState,
  FieldLabel,
  JsonPreview,
  PageIntro,
  Panel,
  PanelTitle,
  TextInput,
} from "@/features/lists/components/shared";

export function OpsPage() {
  const enabled = useAdminSessionReady();
  const [referenceAt, setReferenceAt] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const previewMutation = usePreviewEpochSyncMutation();
  const executeMutation = useExecuteEpochSyncMutation();

  if (!enabled) {
    return (
      <EmptyState
        description="周周期 sync 只能通过管理员会话触发。"
        title="Admin session required"
      />
    );
  }

  const payload = {
    referenceAt: referenceAt || undefined,
  };

  return (
    <div className="space-y-6">
      <PageIntro
        description="Ops 页只暴露当前 plan 里 blast radius 可控的动作。树修复、root republish、奖励重发仍保留脚本路径，不进入这版 Web MVP。"
        title="Operator Actions"
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <PanelTitle
            description="`referenceAt` 为空时，server 按当前时间推导周边界。"
            title="Weekly Epoch Sync"
          />
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="epoch-reference-at">Reference At</FieldLabel>
              <TextInput
                id="epoch-reference-at"
                onChange={(event) => setReferenceAt(event.target.value)}
                placeholder="2026-03-12T12:00:00.000Z"
                value={referenceAt}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                disabled={previewMutation.isPending}
                onClick={async () => {
                  const result = await previewMutation.mutateAsync(payload);
                  setSnapshot(formatJson(result));
                }}
              >
                {previewMutation.isPending ? "Previewing..." : "Preview sync"}
              </ActionButton>
              <ActionButton
                disabled={executeMutation.isPending}
                onClick={async () => {
                  const result = await executeMutation.mutateAsync(payload);
                  setSnapshot(formatJson(result));
                }}
                tone="danger"
              >
                {executeMutation.isPending ? "Executing..." : "Execute sync"}
              </ActionButton>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            description="第一版 operator 分散在三个页面，避免高风险动作堆成一个 giant form。"
            title="Other Operator Surfaces"
          />
          <div className="grid gap-3">
            <Link
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-200 transition hover:bg-white/[0.08]"
              href="/dashboard/checkins"
            >
              Go to check-in repair
            </Link>
            <Link
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-200 transition hover:bg-white/[0.08]"
              href="/dashboard/claims"
            >
              Go to claim sync replay
            </Link>
            <p className="rounded-2xl border border-white/10 bg-cyan-500/10 px-4 py-4 text-sm leading-7 text-cyan-100">
              Referral NFT approval has moved to the dedicated eligibility page.
              This ops page stays focused on repair and sync actions instead of
              mixing approval workflow into a generic operator form.
            </p>
          </div>
        </Panel>
      </div>

      {snapshot ? <JsonPreview title="Operation Result" value={snapshot} /> : null}
    </div>
  );
}
