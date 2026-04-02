"use client";

import { useState } from "react";
import { NftEligibilityStatus } from "3u-aura-common";
import { formatAddress, formatAtomic, formatDateTime } from "@/lib/admin-format";
import {
  useApproveReferralNftMutation,
  useGiftReferralNftMutation,
  useNftEligibilityQuery,
  useRejectReferralNftMutation,
} from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  ActionButton,
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

export function NftEligibilityPage() {
  const enabled = useAdminSessionReady();
  const [decisionReasons, setDecisionReasons] = useState<Record<string, string>>({});
  const [giftDecisionReason, setGiftDecisionReason] = useState("");
  const [giftUserId, setGiftUserId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | NftEligibilityStatus>("");
  const approveMutation = useApproveReferralNftMutation();
  const giftMutation = useGiftReferralNftMutation();
  const query = useNftEligibilityQuery(
    {
      search: search || undefined,
      skip: 0,
      status: status || undefined,
      take: 20,
    },
    enabled,
  );
  const rejectMutation = useRejectReferralNftMutation();

  if (!enabled) {
    return (
      <EmptyState
        description="NFT eligibility 列表需要管理员会话。"
        title="Admin session required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        description="Referral NFT 现在保留人工审批，同时新增后台赠送入口。这里既是待审列表，也是查看拒绝原因、批准记录、signed/minted 积压和赠送入口的主页面。"
        title="NFT Eligibility"
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Panel>
          <PanelTitle description="按钱包地址和 eligibility status 过滤。" title="Filters" />
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div>
              <FieldLabel htmlFor="eligibility-search">Search</FieldLabel>
              <TextInput
                id="eligibility-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="wallet or userId"
                value={search}
              />
            </div>
            <div>
              <FieldLabel htmlFor="eligibility-status">Status</FieldLabel>
              <SelectInput
                id="eligibility-status"
                onChange={(event) =>
                  setStatus(
                    (event.target.value || "") as "" | NftEligibilityStatus,
                  )
                }
                value={status}
              >
                <option value="">All</option>
                <option value={NftEligibilityStatus.PENDING_APPROVAL}>PENDING_APPROVAL</option>
                <option value={NftEligibilityStatus.APPROVED}>APPROVED</option>
                <option value={NftEligibilityStatus.SIGNED}>SIGNED</option>
                <option value={NftEligibilityStatus.MINTED}>MINTED</option>
                <option value={NftEligibilityStatus.REJECTED}>REJECTED</option>
                <option value={NftEligibilityStatus.REVOKED}>REVOKED</option>
                <option value={NftEligibilityStatus.EXPIRED}>EXPIRED</option>
              </SelectInput>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            description="赠送流程保留现有 mint 领取方式，但独立于人工审批。"
            title="Referral Gift"
          />
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor="gift-user-id">User ID</FieldLabel>
              <TextInput
                id="gift-user-id"
                onChange={(event) => setGiftUserId(event.target.value)}
                placeholder="user id"
                value={giftUserId}
              />
            </div>
            <div>
              <FieldLabel htmlFor="gift-decision-reason">Gift reason</FieldLabel>
              <TextInput
                id="gift-decision-reason"
                onChange={(event) => setGiftDecisionReason(event.target.value)}
                placeholder="optional note for audit trail"
                value={giftDecisionReason}
              />
            </div>
            <p className="text-xs leading-6 text-slate-400">
              Gifted referral eligibility should still route through the existing mint/signature path and keep the one-wallet-one-referral rule.
            </p>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                disabled={giftMutation.isPending || !giftUserId.trim()}
                onClick={async () => {
                  await giftMutation.mutateAsync({
                    decisionReason: giftDecisionReason.trim() || undefined,
                    userId: giftUserId.trim(),
                  });
                  setGiftUserId("");
                  setGiftDecisionReason("");
                }}
              >
                {giftMutation.isPending ? "Granting..." : "Grant gift"}
              </ActionButton>
            </div>
          </div>
        </Panel>
      </div>

      {query.isLoading ? <LoadingState label="Loading NFT eligibility" /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {query.data ? (
        <Panel>
          <PanelTitle
            description={`Showing ${query.data.items.length} of ${query.data.count} records.`}
            title="Eligibility Listing"
          />
          <DataTable
            columns={[
              "Wallet",
              "Status",
              "Check-ins",
              "Small Leg",
              "Decision",
              "Timeline",
              "Actions",
            ]}
          >
            {query.data.items.map((item) => (
              <tr key={item.userId}>
                <td className="px-4 py-4">
                  <div className="font-medium text-white">{formatAddress(item.walletAddress)}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.userId}</div>
                </td>
                <td className="px-4 py-4">
                  <StatusPill
                    tone={
                      item.status === "MINTED"
                        ? "success"
                        : item.status === "APPROVED" || item.status === "PENDING_APPROVAL"
                          ? "warning"
                          : item.status === "REJECTED"
                            ? "danger"
                        : item.status === "SIGNED"
                          ? "warning"
                          : "default"
                    }
                  >
                    {item.status}
                  </StatusPill>
                </td>
                <td className="px-4 py-4 text-slate-300">{item.personalCheckinCount}</td>
                <td className="px-4 py-4 text-slate-300">
                  {formatAtomic(item.smallLegVolumeUsdt, 6, "USDT")}
                </td>
                <td className="px-4 py-4 text-xs leading-6 text-slate-300">
                  <div>Approved by: {formatAddress(item.approvedByWallet)}</div>
                  <div>Rejected by: {formatAddress(item.rejectedByWallet)}</div>
                  <div className="mt-1 text-slate-400">
                    {item.decisionReason || "-"}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs leading-6 text-slate-400">
                  <div>Approved: {formatDateTime(item.approvedAt)}</div>
                  <div>Rejected: {formatDateTime(item.rejectedAt)}</div>
                  <div>Signed: {formatDateTime(item.signedAt)}</div>
                  <div>Minted: {formatDateTime(item.mintedAt)}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex min-w-[240px] flex-col gap-3">
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/50"
                      onChange={(event) =>
                        setDecisionReasons((current) => ({
                          ...current,
                          [item.userId]: event.target.value,
                        }))
                      }
                      placeholder="decision reason"
                      value={decisionReasons[item.userId] || ""}
                    />
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        disabled={
                          approveMutation.isPending ||
                          ![
                            NftEligibilityStatus.PENDING_APPROVAL,
                            NftEligibilityStatus.REJECTED,
                            NftEligibilityStatus.EXPIRED,
                          ].includes(item.status)
                        }
                        onClick={async () => {
                          await approveMutation.mutateAsync({
                            decisionReason: decisionReasons[item.userId] || undefined,
                            userId: item.userId,
                          });
                        }}
                      >
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </ActionButton>
                      <ActionButton
                        disabled={
                          rejectMutation.isPending ||
                          !decisionReasons[item.userId]?.trim() ||
                          ![
                            NftEligibilityStatus.PENDING_APPROVAL,
                            NftEligibilityStatus.APPROVED,
                            NftEligibilityStatus.EXPIRED,
                          ].includes(item.status)
                        }
                        onClick={async () => {
                          await rejectMutation.mutateAsync({
                            decisionReason: decisionReasons[item.userId].trim(),
                            userId: item.userId,
                          });
                        }}
                        tone="danger"
                      >
                        {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                      </ActionButton>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}
    </div>
  );
}
