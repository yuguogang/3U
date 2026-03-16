# Milestone 8 — Weekly Flow Matrix

## Goal
在 `fork-anvil` 上把 subsidy、lottery、ranking、weekly merkle claim 的正常路径、人数不足路径、以及 blocked 条件拆清楚，并把结果语义固定下来。

## Status Snapshot
- 已完成：`publishSubsidyEpoch -> sync -> claimPurchasedSubsidy` 的 fork 自动化主路径
- 已落地 Wave 1 的首批代码骨架：
  - `executeAdminEpochSync()` helper 已补到 E2E server API 层
  - `tests/weekly-fork/rollover.spec.ts` 已建好
  - 当前仍缺本机权限上下文下的真实 runner 验证
- 待补：lottery / ranking 的 threshold-met happy path、below-threshold rollover path 的显式用例、weekly merkle claim 的链上 publish / funding bridge
- 当前不建议再把 weekly 流程塞回 public `test:uat`

## Result Semantics
- `success`
  - 分支结果符合预期；包括人数不足后进入 rollover 的业务分支
- `blocked`
  - 前置条件无法构造或环境能力尚未补齐，例如 synthetic participants、root publisher bridge、MerkleClaim 资金注入
- `failed`
  - 前置条件已满足，但链上、DB、API、UI 任一断言与预期不一致

## Recommended Test Packs
- Pack A — Below-threshold rollover
  - 目标：`participantCount < minimumParticipants` 时，验证 rollover / no-settlement 为预期成功路径
  - 参与者：保留当前 5 个真实可控账户，不额外凑人数
  - 断言：`prepareRolloverForEpoch()` 返回 `rolledOver=true`，下一期 rollover pool 增长，lottery/ranking/merkle claim 不产出 claimable 记录
- Pack B — Subsidy happy path
  - 目标：`buyNFT -> publishSubsidyEpoch -> txHash sync -> claimPurchasedSubsidy`
  - 状态：已实现并应继续作为 weekly suite 的稳定基线
- Pack C — Threshold-met minimal happy path
  - 目标：在不追求全量 bucket 的前提下，验证 epoch 可进入结算、lottery/ranking draft 可生成、可观测面出现 reward / claim 数据
  - 参与者：5 个真实账户 + synthetic participants
- Pack D — Lottery happy path
  - partial 版本：满足阈值但不追求四档奖池全部满配，验证 deterministic winners 与 rollover
  - full-bucket 版本：建议至少 `20` 名 eligible participants，覆盖 `FIRST/SECOND/THIRD/LUCKY` 全部 bucket
- Pack E — Ranking happy path
  - partial 版本：至少 3 个合格 candidate，验证 rank1-3 与 rollover
  - full-top10 版本：至少 10 个合格 candidate，验证 top10 分配与 deterministic dust
- Pack F — Weekly merkle claim happy path
  - 目标：完成 `draft rewards -> publish rewards -> depositRewards -> publishRoot -> dapp claim -> claim sync-back`
  - 当前状态：DB 侧 draft/publish 能力已存在，但链上 `depositRewards()` / `publishRoot()` 仍需专门 bridge helper

## Implementation Waves
- Wave 1 — `WF-02` below-threshold rollover
  - 目标：先把“人数不足也是成功分支”固定下来，避免后面继续把 rollover 误判成 blocked/fail
  - 推荐新 spec：`apps/e2e/phase94/tests/weekly-fork/rollover.spec.ts`
  - 优先复用：
    - `bootstrapDappSession()`
    - `previewAdminEpochSync()`
    - 新增 `executeAdminEpochSync()` helper，调用 `/api/v1/admin/ops/epochs/sync`
  - 断言层级：
    - API：`processedEpochs[*].rollover.rolledOver === true`
    - DB/read-model：下一期 `rolloverUsdt` 增长，当前期不出现 claimable rows
    - UI：`/rewards`、`/claims` 对观察钱包保持空或 no-claim 状态
- Wave 2 — `WF-03` threshold-met minimal happy path
  - 目标：在不追求 full bucket 的前提下，先让 `participantCount >= minimumParticipants` 的最小 happy path 稳定可构造
  - 推荐新 spec：`apps/e2e/phase94/tests/weekly-fork/threshold-met.spec.ts`
  - 推荐新增 fixture helper：
    - `apps/e2e/phase94/src/weekly-fork-fixtures.ts`
    - 或 `scripts/uat/seed-weekly-fork-fixtures.mjs`
  - 推荐构造内容：
    - synthetic participants 的 `UserDailyStat.countedCheckinDays`
    - synthetic participants 的 `UserDailyStat.smallLegVolumeUsdt`
    - 至少少量真实 `PoolSplitFact`
  - 说明：`participantCount` 只靠人数不够，weekly reward/claim happy path 还需要非零 pool
- Wave 3 — `WF-04` / `WF-05` lottery + `WF-06` / `WF-07` ranking
  - 目标：把 lottery/ranking 从“人数够了”推进到“奖励草稿/可观测结果正确”
  - 推荐新 specs：
    - `apps/e2e/phase94/tests/weekly-fork/lottery.spec.ts`
    - `apps/e2e/phase94/tests/weekly-fork/ranking.spec.ts`
  - 推荐 orchestration：
    - 先执行 epoch sync
    - 再通过 `apps/server/scripts/settle-weekly-epoch-rewards.ts --mode draft` 生成 weekly rewards draft
  - 说明：
    - 当前仓库里没有现成 admin API 去调用 `materializeEpochRewards()` / `publishEpochRewards()`
    - 近期最小实现建议是为 E2E 添加一个 shell/tsx wrapper，而不是先改业务 API
- Wave 4 — `WF-08` / `WF-09` weekly merkle claim
  - 目标：把 weekly merkle claim 从“只有 DB root posted”推进到真正链上 claim happy path
  - 推荐新 spec：`apps/e2e/phase94/tests/weekly-fork/merkle-claim.spec.ts`
  - 推荐新增链上 helper：
    - `depositMerkleRewardsOnFork()`
    - `publishMerkleRootOnFork()`
  - 推荐流程：
    - `settle-weekly-epoch-rewards.ts --mode draft`
    - `settle-weekly-epoch-rewards.ts --mode publish`
    - `MerkleClaim.depositRewards()`
    - `MerkleClaim.publishRoot()`
    - dapp `/claims` 页面发起 claim
    - `syncMyClaim()` 回写链上 receipt

## Required Helper Additions
- `apps/e2e/phase94/src/weekly-fork-fixtures.ts`
  - 统一封装 synthetic participants、daily stats、pool funding 的 setup 逻辑
- `apps/e2e/phase94/src/weekly-fork-chain.ts`
  - 新增 `depositMerkleRewardsOnFork()`
  - 新增 `publishMerkleRootOnFork()`
- `apps/e2e/phase94/src/weekly-fork-rewards.ts`
  - 作为 `apps/server/scripts/settle-weekly-epoch-rewards.ts` 的轻量封装，供 specs 调用 draft/publish

## Existing Entrypoints To Reuse
- epoch boundary / preview
  - `/api/v1/epoch/boundary`
  - `/api/v1/admin/ops/epochs/sync/preview`
- epoch execute
  - `/api/v1/admin/ops/epochs/sync`
- reward draft / publish
  - `apps/server/scripts/settle-weekly-epoch-rewards.ts`
- subsidy chain path
  - `publishSubsidyEpochOnFork()`
  - `claimPurchasedSubsidyOnFork()`
- dapp claim UI
  - `/claims`

## Recommended Data Strategy
- 真实 UI actors
  - 继续使用 `admin/referrer/userA/userB/userC`
  - 至少保留 1~2 个真实可控账户作为 rewards/claims 页面观察对象
- synthetic participants
  - 推荐只承担“凑人数 / 凑 ranking 增量 / 凑 lottery streak”职责，不承担 UI 主角行为
  - 推荐在隔离 fork schema 中通过 setup script 写入 `User`、`UserDailyStat`，而不是再额外堆更多浏览器钱包
- pool funding
  - weekly pool 金额来自 `PoolSplitFact`
  - 推荐继续使用少量真实 check-in 产生真实 pool，再由 synthetic participants 只负责人数与排名条件，避免伪造过多 payment/checkin 关联数据

## Key Preconditions To Model Explicitly
- `minimumParticipants`
  - 来源：`WeeklyEpochPolicyEngine`
  - 当前默认值为 `12`
- lottery qualification
  - 依赖 epoch 窗口内 `countedCheckinDays`
- ranking qualification
  - 依赖 `UserDailyStat.smallLegVolumeUsdt` 的增量
- weekly merkle claim
  - 需要 reward draft / publish
  - 需要 `MerkleClaim.depositRewards()`
  - 需要 `MerkleClaim.publishRoot()`
  - 需要链上 txHash sync-back
- weekly reward draft/publish
  - 当前只有 `apps/server/scripts/settle-weekly-epoch-rewards.ts`
  - 尚无直接供 E2E 复用的 admin API

## Risks
- 只凑人数、不凑 pool，会导致 reward/claim 为零，happy path 失去验收价值
- 通过降低 `minimumParticipants` 伪造 happy path，会失去产品级验收意义
- 若 synthetic participants 直接承担 UI 行为，测试成本和不稳定性会急剧上升
- 若 weekly merkle claim 只做到 DB `ROOT_POSTED` 而没有链上 `publishRoot()`，不能算真正的链上 happy path

## Verification commands
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/subsidy-claim.spec.ts`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/lottery.spec.ts`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/ranking.spec.ts`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/merkle-claim.spec.ts`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run test:weekly-fork`

## Expected outputs
- rollover path 被明确认定为预期成功分支，而不是 skip
- threshold-met happy path 有稳定构造方案，不依赖“自然等一周”
- lottery / ranking / subsidy / merkle claim 的边界和职责被拆清楚
- 对需要更多账号、更大团队规模的场景，能明确判断是 `blocked` 还是 `failed`
