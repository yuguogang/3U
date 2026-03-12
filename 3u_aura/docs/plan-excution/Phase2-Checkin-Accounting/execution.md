# Execution

## Status
Completed with verification notes.

## Notes
- 审批后已完成 `Phase2` 的主实现闭环，范围包括：
  - `POST /api/v1/checkin` 鉴权 API 入口
  - request-bound 的支付边界校验
  - `PaymentReceipt / Checkin / AuraLedger / UserDailyStat / UserProfile` 单事务写入
  - `PoolSplitFact` 每笔拆分事实记录
  - duplicate txHash 幂等返回
  - dangling `PaymentReceipt` 的补单式修复路径
  - `apps/server/scripts/repair-checkin.ts` 幂等补单脚本
- 新增的 `PoolSplitFact` 是本 phase 的最小 schema 扩展，用于把 `3 U -> 0.9 U lottery + 2.1 U treasury` 做成稳定事实来源。
- 当前链上回执“验证”只做到 request-bound 校验和 txHash 业务键收口，尚未接入真实 RPC / USDT 合约事件解析。
- 核心代码落点：
  - `apps/server/src/modules/checkin/*`
  - `apps/server/src/modules/payment/*`
  - `apps/server/src/modules/ledger/*`
  - `apps/server/src/modules/stats/*`
  - `apps/server/src/modules/shared/*`
  - `apps/server/scripts/repair-checkin.ts`
  - `apps/server/prisma/schema.prisma`
  - `apps/server/prisma/migrations/20260311_phase2_checkin_pool_split_fact/migration.sql`

## Commands Run
- `pnpm run db:generate`
  - workdir: `apps/server`
- `pnpm run build`
  - workdir: `packages/common`
- `pnpm run build`
  - workdir: `apps/server`
- `pnpm run test -- checkin`
  - workdir: `apps/server`
- `pnpm exec prisma validate --schema prisma/schema.prisma`
  - workdir: `apps/server`
- `pnpm run test`
  - workdir: `apps/server`
- `pnpm tsx scripts/repair-checkin.ts`
  - workdir: `apps/server`

## Verification Results
- `pnpm run db:generate` in `apps/server`
  - Passed.
- `pnpm run build` in `packages/common`
  - Passed.
- `pnpm run build` in `apps/server`
  - Passed.
- `pnpm run test -- checkin` in `apps/server`
  - Passed. `checkin` 相关 2 个 test suites、6 个测试通过，覆盖：
    - happy path
    - duplicate txHash
    - dangling receipt repair
    - ownership conflict
    - streak projection
    - pool split projection
- `pnpm exec prisma validate --schema prisma/schema.prisma`
  - Passed.
- `pnpm run test` in `apps/server`
  - Passed. 当前共 3 个 suites、7 个测试全部通过。
- `pnpm tsx scripts/repair-checkin.ts` in `apps/server`
  - Passed as a smoke check for script loading and argument parsing; exited with usage message because required args were intentionally omitted.

## Deviations From Plan
- 原计划中的“链上回执验证”没有接入真实链上 RPC / USDT Transfer 事件校验。
  - Reason: 当前仓库配置中没有可用的链 RPC、USDT 合约地址、收款地址和确认策略配置。
  - Outcome: 本 phase 先冻结 `request -> verification seam -> transaction write path` 结构，并通过 `payerAddress + amountAtomic + tokenSymbol + txHashKey` 做 deterministic 边界校验；后续需要在 payment adapter 中替换成真实验链实现。
- 为了承接“池子拆分事实记录”，本 phase 新增了 `PoolSplitFact` schema 和 migration。
  - Reason: 现有 schema 只有 `PaymentReceipt / Checkin / UserDailyStat / WeeklyEpoch`，不足以表达“每笔拆分事实”。
  - Outcome: 后续周结算和资金审计可以直接读取稳定事实表，而不是从累计值倒推。
- 审计日志当前只对 repair script 明确落 `AdminAuditLog`。
  - Reason: 自动 check-in path 的跨事务审计持久化方案还未冻结，不宜在本 phase 伪造半成品审计写入。
  - Outcome: 用户签到主链路仍保留 `AuditSeamService` 调用点，repair 工具则已具备可审计入口。

## Follow-up Risks
- 在接入真实链上回执验证前，`POST /checkin` 仍不能视为生产级支付确认入口。
- `PoolSplitFact` 已经解决“每笔拆分事实”，但本 phase 还没有把这些事实汇总进 weekly epoch pool；这部分留到 `Phase5/6` 消费。
- `repair-checkin.ts` 目前依赖手工传入用户和交易参数；进入运维阶段后，建议再补一个只读 dry-run 模式和批量扫描入口。

## Historical Follow-up
- 上述“真实链上回执验证”缺口已在 [Phase9.1 execution](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9.1-Promotion-Closure-Integration/execution.md#L1) 中通过 payment verification seam 收口；本文件保留的是 `Phase2` 完成当时的历史状态。
