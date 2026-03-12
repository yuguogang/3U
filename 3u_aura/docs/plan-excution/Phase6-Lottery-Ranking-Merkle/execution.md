# Execution

## Status
Completed

## Started At
2026-03-11 18:55:06 +0800

## Summary
- 完成 weekly lottery / ranking payout engine。
- 完成 `WeeklyReward / MerkleLeaf / ClaimRecord` 草稿生成与 publish 分离流程。
- 新增 `claims` 与 `merkle` 模块，接入 `RewardsService` 的 `draft / publish` 编排。
- 新增 `settle-weekly-epoch-rewards.ts` 手工脚本入口。
- 补充 `Phase6` 关键单测并通过全量 `apps/server` 测试。

## Implemented Work

### 1. Lottery / Ranking Draft Materialization
- 新增 [lottery-payout.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/engines/lottery-payout.engine.ts)。
- 新增 [ranking-payout.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/ranking/engines/ranking-payout.engine.ts)。
- 完成 [lottery-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-settlement.service.ts) 和 [ranking-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/ranking/services/ranking-settlement.service.ts) 的 draft 写路径。
- 修正 ranking underfilled 周的滚存口径：未占用名次奖金不前摊，直接滚到下一周。

### 2. Merkle / Claim Draft Pipeline
- 新增 [merkle-draft.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/engines/merkle-draft.engine.ts)。
- 新增 [merkle-draft.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/services/merkle-draft.service.ts)。
- 新增 [merkle-leaf.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/repositories/merkle-leaf.repository.ts)。
- 新增 [claim-record.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/claim-record.repository.ts)。
- 新增 [claim-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claim-publication.service.ts)。
- `LOTTERY_USDT / RANKING_USDT` 现在会生成 `WeeklyReward -> MerkleLeaf -> ClaimRecord` 三层一致的草稿。

### 3. Rewards Orchestration
- 完成 [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)：
  - `materializeEpochRewards(epochId)` 负责 draft。
  - `publishEpochRewards(epochId, rewardJsonUri?)` 负责发布。
- 发布阶段会：
  - 发布 merkle root 并把 `ClaimRecord / WeeklyReward` 标成 `CLAIMABLE`
  - 把未中奖安慰奖写入 `AuraLedger`
  - 把安慰奖累计到 `UserProfile / UserDailyStat`
  - 把抽奖与排名的未发放部分滚到下一周池子

### 4. Script / Module Wiring
- 新增 [settle-weekly-epoch-rewards.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/settle-weekly-epoch-rewards.ts)。
- 新增 [claims.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/claims.module.ts) 和 [merkle.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/merkle.module.ts)。
- 更新 [aura-domain.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/aura-domain.module.ts) 和 [index.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/index.ts)。

## Deviations From Original Plan
- 计划原本把安慰奖账本和下周滚存放在 payout materialization 阶段。实际实现改成：
  - `draft` 只生成可审计草稿，不落最终账本，不推进下一周奖池。
  - `publish` 才做不可逆状态迁移。
- 这样可以避免 dry-run / rerun 时重复发安慰奖、重复给下一周加池子的幂等问题，审计边界更清晰。
- consolation AURA 没有额外做 weekly merkle claim，而是保持内部账本语义，符合当前 schema 与前置 model 决策。

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec jest --runInBand src/modules/lottery/engines/lottery-payout.engine.spec.ts src/modules/ranking/engines/ranking-payout.engine.spec.ts src/modules/merkle/engines/merkle-draft.engine.spec.ts src/modules/rewards/services/rewards.service.spec.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec jest --runInBand src/modules/lottery/engines/lottery-payout.engine.spec.ts src/modules/ranking/engines/ranking-payout.engine.spec.ts src/modules/merkle/engines/merkle-draft.engine.spec.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/aura-domain.module.spec.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec jest --runInBand
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint src/modules/rewards/services/rewards.service.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/repositories/weekly-reward.repository.ts src/modules/lottery/services/lottery-settlement.service.ts src/modules/lottery/engines/lottery-payout.engine.ts src/modules/lottery/engines/lottery-payout.engine.spec.ts src/modules/ranking/services/ranking-settlement.service.ts src/modules/ranking/engines/ranking-payout.engine.ts src/modules/ranking/engines/ranking-payout.engine.spec.ts src/modules/merkle/engines/merkle-draft.engine.ts src/modules/merkle/engines/merkle-draft.engine.spec.ts src/modules/merkle/services/merkle-draft.service.ts src/modules/merkle/repositories/merkle-leaf.repository.ts src/modules/merkle/merkle.module.ts src/modules/claims/repositories/claim-record.repository.ts src/modules/claims/services/claim-publication.service.ts src/modules/claims/claims.module.ts src/modules/aura-domain.module.ts src/modules/index.ts src/modules/stats/repositories/stats.repository.ts src/modules/ledger/repositories/ledger.repository.ts scripts/settle-weekly-epoch-rewards.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint --fix src/modules/rewards/services/rewards.service.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/repositories/weekly-reward.repository.ts src/modules/lottery/services/lottery-settlement.service.ts src/modules/lottery/engines/lottery-payout.engine.ts src/modules/lottery/engines/lottery-payout.engine.spec.ts src/modules/ranking/services/ranking-settlement.service.ts src/modules/ranking/engines/ranking-payout.engine.ts src/modules/ranking/engines/ranking-payout.engine.spec.ts src/modules/merkle/engines/merkle-draft.engine.ts src/modules/merkle/engines/merkle-draft.engine.spec.ts src/modules/merkle/services/merkle-draft.service.ts src/modules/merkle/repositories/merkle-leaf.repository.ts src/modules/merkle/merkle.module.ts src/modules/claims/repositories/claim-record.repository.ts src/modules/claims/services/claim-publication.service.ts src/modules/claims/claims.module.ts src/modules/aura-domain.module.ts src/modules/index.ts src/modules/stats/repositories/stats.repository.ts src/modules/ledger/repositories/ledger.repository.ts scripts/settle-weekly-epoch-rewards.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm tsx scripts/settle-weekly-epoch-rewards.ts
```

## Verification Results
- `packages/common` build: passed
- `apps/server` build: passed
- `apps/server` full test: passed
  - `16` suites
  - `40` tests
- `apps/server` target eslint: passed with warnings only
- `settle-weekly-epoch-rewards.ts` smoke:
  - 无参数运行时正确返回 usage error
  - 参数解析入口可用

## Residual Notes
- `eslint` 还保留 `rewards.service.spec.ts` 的 `no-unsafe-argument` warning，都是测试 mock 注入警告，不影响业务代码。
- publish 现在依赖先已有 draft 数据；如果没有先跑 draft，会在 publish 阶段报错，这是刻意保留的安全边界。
- 当前 merkle 编码方案为 `address + rewardTypeCode + amount`，pair hash 采用 commutative sort；后续合约 Phase 需要按同一规则对齐测试向量。
