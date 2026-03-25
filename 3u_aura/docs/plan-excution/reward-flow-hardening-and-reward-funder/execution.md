# Reward Flow Hardening And Reward Funder Execution

## Status

- Created: 2026-03-25
- State: Implemented for short-term hardening; mid-term rewardFunder design retained for next iteration

## Notes

- 本任务用于收口本轮 `fork-anvil` 测试暴露的奖励链路异常，并规划下一次迭代的 `rewardFunder / financeWallet` 中期方案。
- 用户在实施中将范围调整为：`CI 优先`，`UAT 继续手工执行`，因此本轮只落地短期硬化代码、脚本与 CI 级验证，不继续扩大 UAT 自动化范围。

## Known Findings Captured For Follow-Up

1. `ClaimRecord/WeeklyReward` 可以先于链上 `depositRewards + publishRoot` 进入 `CLAIMABLE`，导致 UI 与链上真实可领状态错位。
2. `fork-anvil` 的 `config/promotion-envs` 与 `scripts/ci/.runtime` 存在地址漂移风险。
3. `sync-purchased-nft-state.ts` 作为 UAT 脚本过度依赖 `AppModule`，在脚本执行环境下稳定性不足。
4. 中期希望将 `MerkleDistributor` 注资语义从“owner 自带资金”升级为“受控从 financeWallet/rewardFunder 出资”。

## Implemented Changes

### 1. Merkle claimability activation split

- 在 [merkle-draft.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/services/merkle-draft.service.ts) 增加 `inspectDraftForEpoch()`，用于只读取 merkle root / claimCount，不提前切换 DB 可领取状态。
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts) 中：
  - `publishEpochRewards()` 改为只做 prepare/inspect，不再隐式激活 claim。
  - 新增 `activateEpochRewards()`，只在链上 funding/root 已就绪后才把 `ClaimRecord / WeeklyReward / WeeklyEpoch` 切到可领取态。
- [settle-weekly-epoch-rewards.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/settle-weekly-epoch-rewards.ts) 新增 `activate` 模式，脚本语义从 `draft|publish` 扩展为 `draft|publish|activate`。

### 2. Claims read hardening

- [claim-record.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/claim-record.repository.ts) 读取 merkle claims 时补充 `epoch.status`。
- [claims-read.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claims-read.service.ts) 增加防御性过滤：
  - 若 merkle claim 记录虽为 `CLAIMABLE`，但 epoch 尚未 `ROOT_POSTED`，则不暴露给前端。
  - 未揭晓的抽奖奖励继续隐藏。

### 3. Fork publish flow hardening

- [publish-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/publish-weekly-fork-claims.mjs) 改为只做 “prepare-publish” 信息输出，不再提前改 DB。
- 新增 [activate-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/activate-weekly-fork-claims.mjs)，单独负责在链上 funding/root 完成后激活 DB claimability。
- [run-weekly-fork-scenarios.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/run-weekly-fork-scenarios.mjs) 与 [weekly-merkle-claim-flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/weekly-merkle-claim-flow.mjs) 串联成：
  - prepare draft
  - on-chain deposit + publish root
  - activate DB claimability
- `NFT subsidy` 的 `claimDeadline` 计算改为读取最新链上 block timestamp，避免 local target timestamp 与链上时钟漂移。

### 4. Purchased NFT sync hardening

- 重写 [sync-weekly-fork-purchased-nft-state.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/sync-weekly-fork-purchased-nft-state.mjs)：
  - 不再启动完整 Nest `AppModule`
  - 直接读取 wallet fixture
  - 通过链上 `PurchasedNFTBought` 事件定位最新 purchase tx
  - 复用 server token 流程请求 `/api/v1/claims/purchased-nft/sync`
- 目标是把这条脚本稳定成 “可用于手工 UAT 准备” 的轻量基础设施，而不是脆弱的全容器脚本。

### 5. Runtime/manifest consistency guard

- [manifest.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/manifest.mjs) 增加 `config/promotion-envs/<env>` 与 `scripts/ci/.runtime/<env>` 的关键地址一致性校验。
- 发现冲突时直接报错，避免 helper 静默读取到过期 runtime。
- 同时清理了当前 `fork-anvil` runtime 里的 NFT 地址漂移与重复 env override 残留。

### 6. Tests

- [rewards.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.spec.ts)
  - 校验 `publishEpochRewards()` 只 inspect，不再隐式 publish/activate
  - 校验 `activateEpochRewards()` 才真正执行激活
  - 修复安慰奖自愈测试里的 mock 注入遗漏
- 新增 [claims-read.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claims-read.service.spec.ts)
  - 覆盖 `ROOT_POSTED` 前隐藏 merkle claim
  - 覆盖 `ROOT_POSTED/CLAIMED` 后继续可见

## Commands Run

### Syntax / script validation

- `node --check apps/server/scripts/settle-weekly-epoch-rewards.ts`
- `node --check scripts/uat/activate-weekly-fork-claims.mjs`
- `node --check scripts/uat/publish-weekly-fork-claims.mjs`
- `node --check scripts/uat/run-weekly-fork-scenarios.mjs`
- `node --check scripts/uat/sync-weekly-fork-purchased-nft-state.mjs`
- `node --check scripts/ci/lib/weekly-merkle-claim-flow.mjs`

### CI-oriented validation

- `pnpm --dir apps/server test -- rewards.service.spec.ts claims-read.service.spec.ts claim-sync.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/server lint`
- `pnpm exec eslint scripts/settle-weekly-epoch-rewards.ts src/modules/claims/repositories/claim-record.repository.ts src/modules/claims/services/claims-read.service.ts src/modules/claims/services/claims-read.service.spec.ts src/modules/merkle/services/merkle-draft.service.ts src/modules/rewards/services/rewards.service.ts src/modules/rewards/services/rewards.service.spec.ts` (from `apps/server`)

## Verification Results

- `node --check ...` for all touched scripts: passed
- `pnpm --dir apps/server test -- rewards.service.spec.ts claims-read.service.spec.ts claim-sync.service.spec.ts`: passed, `15/15`
- `pnpm --dir apps/server build`: passed
- `pnpm --dir apps/server lint`: failed on existing repository-wide lint baseline (`87 errors / 52 warnings`), not introduced by this task
- Targeted lint on this task's touched server files: no errors; remaining warnings are existing mock-heavy spec warnings in `rewards.service.spec.ts`

## Deviations From Plan

- Milestone A/B/C 已实施到“短期硬化 + CI 验证”层面。
- UAT 自动化没有继续扩张，按用户要求保持手工执行。
- Milestone D `rewardFunder / financeWallet -> MerkleDistributor` 仅保留设计结论，没有进入合约实施；该项仍需下次迭代单独作为 `Critical` 合约任务推进。

## Residual Risks / Follow-Up

1. 全量 `apps/server lint` 当前仍有仓库基线问题，本轮没有顺手做 repo-wide lint debt 清理。
2. `rewardFunder / financeWallet` 中期方案仍需新合约设计、Foundry 测试和新部署验证。
3. 手工 UAT 仍需要在实际发 root / 注资之前确认链上资金与 epoch root 状态，不过前端已不会再过早暴露“假可领”的 merkle claim。
