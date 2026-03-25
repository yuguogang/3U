# Consolation AURA Profile Projection Fix — Execution Log

## Status
Implemented and verified on `fork-anvil`.

## Investigation Notes

### 2026-03-25 — Initial Triage
- 现象：
  - `Rewards` 页可见目标用户的 `100 AURA` 安慰奖
  - `Claims` 页没有该条记录
  - 首页总 AURA 仍为 `0`
- 目标钱包：
  - `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

### Code Findings
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
  - `publishEpochRewards()` 在处理 `CONSOLATION_AURA` 时，原本一旦发现已有 `CONSOLATION` ledger 就直接 `continue`
  - 这会让缺失的 profile/daily projection 永远没有机会自愈
- [stats.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats/repositories/stats.repository.ts)
  - 原本只有 `increment` 语义，没有“按 ledger 汇总值覆盖”的 projection 接口
- [dashboard-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx)
  - 首页总 AURA 直接依赖 `profile.totalAuraFromConsolation`

### Data Findings
- 对目标钱包的 fork 数据直接查库后，确认实际故障形态比最初预估更早一步：
  - `WeeklyReward.CONSOLATION_AURA` 存在
  - `AuraLedger(sourceType=CONSOLATION)` 不存在
  - `UserProfile.totalAuraFromConsolation = 0`
- 也就是说，这次不仅是“投影没补”，而是“ledger + 投影”都缺失

## Implementation Notes

### Server Code Changes
- 更新 [ledger.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/ledger/repositories/ledger.repository.ts)
  - 新增：
    - `sumConfirmedConsolationAmountByUser(...)`
    - `sumConfirmedConsolationAmountByUserAndEpoch(...)`
- 更新 [stats.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats/repositories/stats.repository.ts)
  - 新增：
    - `setProfileConsolationProjection(...)`
    - `setDailyConsolationProjection(...)`
  - 让回补按 ledger 汇总值“覆盖”而不是继续 `increment`
- 更新 [weekly-reward.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/repositories/weekly-reward.repository.ts)
  - 新增 `listConsolationRewardsForProjection(...)`
- 更新 [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
  - 发布路径统一走 `syncConsolationProjectionForEpoch(...)`
  - 若 projection/backfill 时发现 ledger 缺失，会先补建 ledger，再按 ledger 汇总值同步 daily/profile

### Backfill Script
- 新增 [reconcile-consolation-aura.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/reconcile-consolation-aura.ts)
  - 采用直连 PG + Prisma adapter
  - 不依赖 Nest 注入链
  - 支持按 `wallet / user-id / epoch-id` 精确回填
- 新增 [reconcile-weekly-fork-consolation-aura.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/reconcile-weekly-fork-consolation-aura.mjs)
  - 通过 `promotion-env` 注入 `fork-anvil` 环境

### Tests
- 扩展 [rewards.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.spec.ts)
  - 覆盖“ledger 已存在时自愈 projection”
  - 覆盖“wallet 范围回填”
  - 覆盖“ledger 缺失时先补 ledger 再投影”

## Commands Run
```bash
rg -n "Consolation|CONSOLATION|totalAuraFromConsolation|applyProfileConsolationProjection|upsertDailyConsolationProjection|WeeklyReward" apps/server apps/dapp packages/common
sed -n '1,260p' apps/server/src/modules/rewards/services/rewards.service.ts
sed -n '1,380p' apps/server/src/modules/stats/repositories/stats.repository.ts
sed -n '1,220p' apps/dapp/src/components/pages/dashboard-page.tsx
sed -n '1,180p' apps/server/src/modules/ledger/repositories/ledger.repository.ts
sed -n '1,420p' apps/server/src/modules/rewards/services/rewards.service.spec.ts
node --check scripts/uat/reconcile-weekly-fork-consolation-aura.mjs
pnpm --dir apps/server test -- rewards.service.spec.ts
pnpm --dir apps/server build
node scripts/uat/reconcile-weekly-fork-consolation-aura.mjs --env fork-anvil --wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
node scripts/promotion-env/run-with-env.mjs --target server --env fork-anvil -- pnpm --dir apps/server exec node --input-type=module -e '...verify WeeklyReward/AuraLedger/UserProfile...'
```

## Verification Results
- `pnpm --dir apps/server test -- rewards.service.spec.ts`
  - passed, `7/7`
- `pnpm --dir apps/server build`
  - passed at least once after code changes
- `node scripts/uat/reconcile-weekly-fork-consolation-aura.mjs --env fork-anvil --wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - returned `processedRewards = 1`
- 回填后 DB 核对结果：
  - `WeeklyReward.amountAura = 100000000000000000000`
  - `AuraLedger.amount = 100000000000000000000`
  - `UserProfile.totalAuraFromConsolation = 100000000000000000000`

## Final Conclusion
- 该问题不是前端展示问题，而是后端奖励一致性问题
- 最终实际根因是：
  - 历史数据中存在 `WeeklyReward` 已写入，但 `CONSOLATION ledger` 和 `UserProfile` 累计都缺失的状态
  - 原发布路径对“ledger 已存在但 projection 缺失”也缺少自愈能力
- 当前代码已覆盖这两类问题：
  - 发布路径可自愈 projection
  - backfill 可补建缺失 ledger 并同步 projection
- 目标钱包 `0x3C44...93BC` 的 `100 AURA` 已经补回 profile，总累计现在应恢复正确

## Deviations
- 最初计划假设“ledger 已存在但 projection 缺失”是主故障形态
- 实际 fork 数据显示更早一步的 `ledger` 也可能缺失，因此回填实现扩大为“补 ledger + 补 projection”
- `pnpm --dir apps/server build` 中途出现一次 `ENOTEMPTY .../dist`，重试后通过
