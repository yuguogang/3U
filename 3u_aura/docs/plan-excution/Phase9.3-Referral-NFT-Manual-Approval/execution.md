# Execution

## Status
Completed.

## Completed At
2026-03-12 19:57:14 +0800

## Summary
- 推广型 NFT 已从“达标后自动签名”切换为“达标后进入人工审批队列，审批通过后才允许请求最终 signer payload”。
- shared enums / models / validators、Prisma schema、server 状态机、admin 审批面板、dapp NFT 用户态已对齐。
- `chainId = 97` 已保留为本阶段联调目标链，并在相关 signer / server 测试口径中保持一致；本次未执行真实远程 `97` 测试网广播。
- 合约层未改动；当前限制仍然存在：签名一旦发出，链下不能撤销，除非后续新增合约能力。

## Implemented Work

### 1. Shared Contract And Spec Alignment
- 更新 `packages/common/src/enums/aura.ts`：
  - 为 `NftEligibilityStatus` 引入 `PENDING_APPROVAL / APPROVED / REJECTED`
  - 保留 `ELIGIBLE` 作为兼容态，避免旧数据和旧调用在迁移窗口内直接失配
- 更新 `packages/common/src/models/promotion.ts`：
  - `NftEligibilityView` 增加审批/拒绝/签发相关元数据
- 更新 `packages/common/src/models/admin.ts`：
  - admin overview 和 NFT eligibility 列表增加 pending/approved/rejected 统计与展示字段
- 更新 `packages/common/src/validators/admin.ts`：
  - 新增 referral NFT approve/reject 请求 schema
- 更新 `docs/spec/3U_AURA_Project_Spec_Merged_zh.md`：
  - 将推广型 NFT 铸造口径改为“管理员批准 -> 后端签名 -> 用户 mint”

### 2. Prisma Schema And Migration
- 更新 `apps/server/prisma/schema.prisma`：
  - 扩展 `NftEligibilityStatus`
  - 为 `NftReferralEligibility` 增加：
    - `approvedAt`
    - `approvedByWallet`
    - `decisionReason`
    - `rejectedAt`
    - `rejectedByWallet`
- 新增 migration：
  - `apps/server/prisma/migrations/20260312_phase93_referral_nft_manual_approval/migration.sql`
- migration 兼容策略：
  - 为历史状态保留 `ELIGIBLE`
  - 将已有 `ELIGIBLE` 数据迁移为 `PENDING_APPROVAL`

### 3. Server Workflow Hardening
- 更新 `apps/server/src/modules/nft-eligibility/engines/nft-eligibility-policy.engine.ts`：
  - 达标后不再自动写成 `ELIGIBLE`
  - 新资格默认进入 `PENDING_APPROVAL`
  - `APPROVED / REJECTED / SIGNED / EXPIRED / REVOKED` 的状态保持逻辑单独冻结
  - signer gate 收紧为仅允许 `APPROVED / EXPIRED / SIGNED`
- 更新 `apps/server/src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts`：
  - 新增 `markApproved(...)`
  - 新增 `markRejected(...)`
- 更新 `apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts`：
  - 新增 approve/reject 应用服务入口
  - 将库层状态统一映射回 shared status
- 更新 `apps/server/src/modules/signing/services/signing.service.ts`：
  - 未经审批的资格不再允许直接获取最终签名
- 更新 `apps/server/src/modules/admin/*`：
  - 新增 approve/reject DTO
  - 新增 admin ops 审批/拒绝 API
  - admin overview 与 eligibility 列表读取逻辑对齐新状态
- 更新审计链路：
  - admin approve/reject 动作落库 `AdminAuditLog`

### 4. Admin Console Approval Surface
- 更新 `apps/admin/src/api/admin.ts`
  - 新增 approve/reject API 适配
- 更新 `apps/admin/src/queries/admin.query.ts`
  - 新增 approval mutations，并在提交后刷新 overview 和 eligibility 列表
- 更新 `apps/admin/src/features/overview/components/overview-page.tsx`
  - overview 指标切换到 manual approval 语义
- 更新 `apps/admin/src/features/lists/components/nft-eligibility-page.tsx`
  - 列表支持：
    - `PENDING_APPROVAL`
    - `APPROVED`
    - `SIGNED`
    - `MINTED`
    - `REJECTED`
    - `REVOKED`
    - `EXPIRED`
  - 支持审批、拒绝、拒绝原因输入、审批/拒绝元数据展示

### 5. DApp User-Facing NFT State Update
- 更新 `apps/dapp/src/components/pages/nft-page.tsx`
  - 将推广型 NFT 改成审批驱动 UX
  - 新增以下用户态：
    - `PENDING_APPROVAL`
    - `REJECTED`
    - `APPROVED`
    - `EXPIRED`
  - 未批准前不再展示“立即获取签名”的可执行 CTA
  - 页面展示审批时间、拒绝时间和 decision reason

## Commands Run
- `cd packages/common && pnpm run build`
- `cd apps/server && pnpm exec prisma validate --schema prisma/schema.prisma`
- `cd apps/server && pnpm run db:generate`
- `cd apps/server && pnpm test -- --runInBand nft-eligibility signing admin`
- `cd apps/server && pnpm run build`
- `cd apps/admin && pnpm run typecheck`
- `cd apps/admin && pnpm run lint`
- `cd apps/admin && pnpm run build`
- `cd apps/dapp && pnpm run typecheck`
- `cd apps/dapp && pnpm run lint`
- `cd apps/dapp && pnpm run build`
- `cd apps/server && pnpm exec eslint src/modules/admin/**/*.ts src/modules/nft-eligibility/**/*.ts src/modules/signing/**/*.ts`
- `cd apps/server && pnpm test -- --runInBand`
- `cd apps/server && pnpm exec eslint src/modules/admin/**/*.ts src/modules/nft-eligibility/**/*.ts src/modules/signing/**/*.ts`
- `cd apps/server && pnpm test -- --runInBand`
- `cd apps/server && pnpm exec eslint src/modules/admin/**/*.ts src/modules/nft-eligibility/**/*.ts src/modules/signing/**/*.ts`
- `cd apps/server && pnpm test -- --runInBand`

## Verification Results
- `packages/common`
  - `pnpm run build` passed
- `apps/server`
  - `prisma validate` passed
  - `db:generate` passed
  - `pnpm run build` passed
  - targeted `jest --runInBand nft-eligibility signing admin` passed
  - final `jest --runInBand` passed: `22` suites / `65` tests
  - targeted `eslint` on `admin / nft-eligibility / signing` passed
- `apps/admin`
  - `pnpm run typecheck` passed
  - `pnpm run lint` passed
  - `pnpm run build` passed
  - build emitted existing RainbowKit / wagmi optional connector warnings but still generated production output
- `apps/dapp`
  - `pnpm run typecheck` passed
  - `pnpm run lint` passed
  - `pnpm run build` passed
  - build emitted existing RainbowKit / wagmi optional connector warnings but still generated production output

## Deviations From Plan
- `ELIGIBLE` 没有从 enum 中物理删除，而是保留为兼容态；主流程已不再写入该状态，migration 会将历史 `ELIGIBLE` 行提升为 `PENDING_APPROVAL`。
- 本 phase 未修改 `NFTSale.sol` 或引入“签发后撤销”机制；这与计划一致，但需要明确记录为当前能力边界。
- 本 phase 完成了代码层和本地验证层闭环，但没有执行真实远程 `chainId = 97` 广播联调；因此 `97` 只算目标链与测试口径已对齐，不算外部环境联调已完成。

## Debug Notes During Execution
- 首次 server targeted eslint 失败，原因是 `nft-eligibility` 新增代码存在 Prettier 和 `require-await` 问题；已修复。
- 随后的 full server test 一度失败，原因是 `nft-eligibility-application.service.spec.ts` 的 mock typing 过严，和 Prisma repository 返回类型不一致；已改为显式 typed fixture 后恢复通过。

## Residual Risks / Follow-up
- 已签发的 referral mint 签名仍然无法链下撤销；如果业务要求“审批后仍可随时吊销”，必须新增合约扩展任务。
- 当前仍是单审批人、allowlist 钱包模型，不是完整 RBAC。
- 真实 `chainId = 97` 远程联调仍需在具备 RPC、部署地址、admin 钱包和测试用户钱包后单独执行。
