# Reward Funder Contract Rollout Execution

## Status

- Created: 2026-03-25
- State: Implementation completed, targeted CI verification passed

## Notes

- 本任务用于承接 `reward-flow-hardening-and-reward-funder` 的中期 follow-up。
- 本轮按新的约束执行：
  - `CI` 继续自动化
  - `UAT` 继续手工执行真钱包/测试钱包操作
  - server/admin 不持有链上资金私钥，不直接代替钱包执行 on-chain funding / publish

## Initial Findings

1. 当前 [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol) 的 `depositRewards()` 只能从 `owner/msg.sender` 注资。
2. 当前 [DeploySettlementClaim.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol) 仅支持 `OWNER` 与 `ROOT_PUBLISHER`，没有 `rewardFunder` 角色。
3. server/admin 现阶段已完成“prepare / activate”拆分，但链上 funding 仍是外部脚本步骤，尚未进入受控后台流程。
4. 本任务默认目标是：`CI 继续自动化覆盖核心逻辑，UAT 继续手工执行真钱包/测试钱包操作。`
5. 资金来源口径已明确为：
   - 抽奖/排名 `USDT` 奖励来源于 `checkinReceiverAddress`
   - NFT 周补贴来源于 `financeWallet`

## Implementation Log

### 1. Contract / Deployment / Manifest

- 更新 [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)
  - 新增 `rewardFunder`
  - 构造函数改为接收 `initialRewardFunder`
  - 新增 `setRewardFunder(address)`
  - 保留旧 `depositRewards(uint256)` 作为 fallback
  - 新增 `depositRewardsFromFunder(uint256)`，由 `owner / rootPublisher` 触发，从 `rewardFunder` 通过 `transferFrom` 注资
  - `RewardsDeposited` 事件增加 `caller / funder` 维度
- 更新 [DeploySettlementClaim.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol)
  - 新增 `REWARD_FUNDER`
- 更新 [MerkleClaim.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/MerkleClaim.t.sol)
  - 覆盖 `rewardFunder` happy path / access control / unauthorized revert
- 更新 promotion env / manifest / CI helper
  - [scripts/promotion-env/lib.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)
  - [scripts/promotion-env/deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs)
  - [scripts/ci/lib/anvil.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/anvil.mjs)
  - [scripts/ci/lib/contracts.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/contracts.mjs)
  - [scripts/ci/lib/manifest.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/manifest.mjs)
  - `config/promotion-envs/*/manifest.json`
- 明确资金来源角色字段：
  - `roles.rewardFunderAddress`
  - 默认优先映射 `checkinReceiverAddress`

### 2. Server / Admin / Shared Models

- 共享 admin contract 新增：
  - [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
  - [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- server 新增 reward publication orchestration：
  - [reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts)
  - [reward-publication.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.spec.ts)
- `RewardPublicationService` 只做：
  - 读取 draft merkle
  - 读取 on-chain `rewardFunder / epochRoot / allowance / balance / distributor balance`
  - 产出 blocker 列表
  - 仅在 `root + funding + db not activated` 全满足时允许 `activate`
- admin 新增 preview / activate API：
  - [admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
  - [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
  - [admin-reward-publication-request.dto.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/dto/admin-reward-publication-request.dto.ts)
- admin 前端新增 reward publication 面板：
  - [apps/admin/src/api/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
  - [apps/admin/src/queries/admin.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
  - [apps/admin/src/features/ops/components/ops-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/ops/components/ops-page.tsx)

### 3. Boundary Tightening During Implementation

- 为避免 Jest 单测被模块 barrel 级联拉起整棵 Nest module tree，本轮把若干 service import 改成直接文件引用：
  - [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
  - [checkin-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.ts)
  - [lottery-ticket.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-ticket.service.ts)
  - [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- 为消除 `viem` 地址类型错误，[reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts) 在进入链上读调用前先用 `getAddress(...)` 标准化 `Address`

## Verification

### Commands Run

```bash
pnpm --dir packages/common build
node --check scripts/promotion-env/deploy-contract-suite.mjs
node --check scripts/ci/lib/contracts.mjs
node --check scripts/ci/lib/manifest.mjs
node --check scripts/ci/lib/anvil.mjs
forge test --match-contract MerkleClaim
pnpm --dir apps/server test -- admin-ops.service.spec.ts reward-publication.service.spec.ts rewards.service.spec.ts claims-read.service.spec.ts claim-sync.service.spec.ts
pnpm --dir apps/server build
pnpm --dir apps/admin typecheck
pnpm --dir apps/admin build
```

### Results

- `packages/common build` 通过
- `node --check` for touched scripts 全通过
- `forge test --match-contract MerkleClaim` 通过，`8/8`
- `apps/server` targeted tests 通过，`29/29`
- `apps/server build` 通过
- `apps/admin typecheck` 通过
- `apps/admin build` 通过
  - 保留既有 wallet connector warnings：
    - `@metamask/sdk`
    - `@walletconnect/ethereum-provider`
    - `@coinbase/wallet-sdk`
    - `@safe-global/*`
    - `porto`
    - `@base-org/account`

## Deviations From Plan

1. 本轮没有把链上 `deposit -> publish` 私钥执行权放进 server/admin。
   - 原因：已确认新的交付要求是 `CI 自动、UAT 手工`
   - 结果：server/admin 只做 readiness preview 与安全 activate，不直接替代钱包执行链上资金动作

2. 本轮把中期方案落实为：
   - `MerkleClaim` 支持 `rewardFunder`
   - admin/server 支持预览与激活
   - on-chain funding / root publish 仍然保留脚本或人工钱包操作

3. 本轮没有改动 `Settlement` 的周补贴资金模型。
   - 仅在计划和 manifest 口径中明确：`NFT` 周补贴来源仍是 `financeWallet`

## Residual Risks / Follow-ups

1. 当前新方案仍依赖：
   - `rewardFunder` 先完成 allowance
   - 钱包或脚本先完成 on-chain deposit / publish
   - 再由 admin 执行 activate
2. 若下一轮要把 `deposit + publish` 做成更强的一体化后台流程，需要重新评估：
   - 私钥托管边界
   - 审计日志
   - 幂等键与失败恢复
3. 需要在新部署环境上做手工 UAT，验证：
   - `checkinReceiverAddress -> MerkleClaim` 的 allowance / deposit / publish / claim
   - `financeWallet -> Settlement` 的 subsidy funding / publish / claim

## Manual UAT Prep Follow-up

- 在实际准备 `fork-anvil` 半自动 UAT 时发现两处本地 helper 漏洞，并已修复：
  1. [scripts/ci/lib/anvil.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/anvil.mjs)
     - 本地部署后回写 runtime manifest 时漏掉 `roles.rewardFunderAddress`
  2. [scripts/uat/weekly-fork-lib.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/weekly-fork-lib.mjs)
     - `local-deploy` 模式下派生 fork manifest 时漏掉 `rewardFunderAddress`
- 额外运行：
  - `PROMOTION_ENV=fork-anvil pnpm promotion-env:fork:reset`
  - `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase prepare --restart-services --target-wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - `node --check scripts/ci/lib/anvil.mjs`
  - `node --check scripts/uat/weekly-fork-lib.mjs`
- 当前 `fork-anvil` 已准备完成：
  - `rewardFunderAddress = checkinReceiverAddress = owner = 0xf39F...2266`
  - 目标钱包 `0x3C44...93BC` 已具备 UAT 场景数据
  - 本周 synthetic participant 共 `23` 个

## Completion Summary

- 中期 `rewardFunder` 方案已完成代码实现
- 资金来源口径已在 plan/config 中明确：
  - 抽奖/排名 `USDT` -> `checkinReceiverAddress`
  - NFT 周补贴 -> `financeWallet`
- 本轮已完成 CI 侧验证
- 下一步进入新的部署环境后，需要按手工 UAT 路径完成真实资金流 smoke
