# Execution

## Status
Completed.

## Summary
- 已实现 weekly epoch 边界投影、epoch 持久化和生命周期同步。
- 已实现按周 `7` 个有效签到日生成 `1` 张门票的重算逻辑，并把参与人数回写到 `WeeklyEpoch`。
- 已实现 `participants < 12` 的 rollover 前置状态准备：本周 promotional pool 结转到下周，当前 epoch 标记为 `CANCELLED`。
- 已提供手工同步脚本，供后续 cron / queue 接入前人工触发。

## Implemented
- `apps/server/src/configuration/*`
  - 新增推广周期配置：`startAt / timezone / epochLengthDays / ticketStreakDays / minimumParticipants`。
- `apps/server/src/modules/epoch/*`
  - 实现周边界 policy engine。
  - 实现 epoch repository 的 `ensure / update / rollover increment / finalize`。
  - 实现 `WeeklyEpochApplicationService.getBoundary / syncEpochLifecycle / prepareRolloverForEpoch`。
  - 新增 `GET /epoch/boundary`。
- `apps/server/src/modules/lottery/*`
  - 实现门票资格引擎与 ticket repository。
  - 实现 `refreshEligibilityForEpoch`，基于 `UserDailyStat.countedCheckinDays` 进行每周重算。
- `apps/server/src/modules/stats/repositories/stats.repository.ts`
  - 新增按周汇总有效签到日和聚合 promotional pool 的查询能力。
- `apps/server/scripts/sync-weekly-epoch.ts`
  - 新增人工触发脚本，串联 epoch sync、ticket refresh、rollover prepare。
- `apps/server/src/modules/epoch/**/*.spec.ts`
  - 新增周边界与 rollover 单测。
- `apps/server/src/modules/lottery/**/*.spec.ts`
  - 新增 ticket qualification 单测。

## Commands Run
- `pnpm run build` in `packages/common`
- `pnpm run build` in `apps/server`
- `pnpm exec jest --runInBand` in `apps/server`
- `pnpm exec eslint "src/modules/epoch/**/*.ts" "src/modules/lottery/**/*.ts" "src/modules/stats/repositories/stats.repository.ts" "scripts/sync-weekly-epoch.ts"` in `apps/server`
- `pnpm exec eslint --fix "src/modules/epoch/**/*.ts" "src/modules/lottery/**/*.ts" "src/modules/stats/repositories/stats.repository.ts" "scripts/sync-weekly-epoch.ts"` in `apps/server`
- `pnpm run build` in `apps/server` after lint fix
- `pnpm exec jest --runInBand` in `apps/server` after lint fix

## Verification Results
- `packages/common` build：通过
- `apps/server` build：通过
- `apps/server` 全量测试：通过，`13` 个 suite / `33` 个测试全部通过
- 目标范围 `eslint`：通过，无 error；保留测试 mock 的 `no-unsafe-argument` warning

## Deviations From Plan
- 本 phase 没有接入真实 cron / BullMQ processor，只提供了手工同步脚本和可复用 service orchestration。
- 没有在本 phase 物化“rolled tickets 到 next epoch 的用户级复制”；当前只准备 epoch 级 rollover 状态和 pool 结转，真正开奖消费留到 Phase6。
- 周边界采用 `Date + Intl.DateTimeFormat` 实现，而不是额外引入时区运行时插件，目的是降低测试与运行时不一致风险。

## Risks / Follow-up
- `sync-weekly-epoch.ts` 没有在当前会话实跑，因为它依赖本地数据库连接和真实 app context；这次只做了 build / lint 级验证。
- 当前周票资格使用“本周有效签到日累计 >= 7”口径；因为 epoch 长度也是 7 天，这和 spec 一致，但如果后续引入非 7 天特殊周，需要重新审视实现。
- underfilled 周只做了 epoch 级 rollover 准备；Phase6 在开奖实现时需要明确是否把上周门票在 next epoch 按用户级继续保留或重新映射。
