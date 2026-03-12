# Execution

## Status
Completed

## Completed At
2026-03-11 19:34:28 +0800

## Summary
- 完成 `Settlement` 与 `MerkleClaim` 两个核心合约。
- 完成 weekly USDT merkle claim 与购买型 NFT 周补贴 claim 的最小可审计链路。
- 完成 `packages/common` merkle 常量/样例、`apps/server` golden sample 对齐测试、`apps/contracts` Foundry 测试与部署脚本。
- 完成本 phase 的 build/test 验证闭环。

## Implemented Work

### 1. Settlement Contract
- 新增 [Settlement.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol)。
- 实现：
  - `publishSubsidyEpoch(epochId, subsidyAmount, claimDeadline)`
  - `claimPurchasedSubsidy(epochId, tokenId)`
  - `claimPurchasedSubsidyBatch(epochId, tokenIds[])`
  - `reclaimExpiredBudget(epochId, receiver)`
- 资格口径冻结为：
  - 只允许购买型 NFT 领取
  - 领取时按 NFT 当前 owner 校验
  - 唯一键为 `epoch + tokenId`
  - 只有 `publish` 当时已 minted 的购买型 token 可参与该期补贴
- `epochPublisher` 与 `owner` 权限边界已落链。

### 2. MerkleClaim Contract
- 新增 [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)。
- 新增 [MerkleProof.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/libraries/MerkleProof.sol)。
- 实现：
  - `depositRewards(amount)`
  - `publishRoot(epochId, merkleRoot)`
  - `claim(epochId, index, rewardTypeCode, amount, proof[])`
  - `isClaimed(epochId, index)`
- root 发布为单次不可变；claim 使用 bitmap 防重复；rewardTypeCode 冻结为：
  - `1 = LOTTERY`
  - `2 = RANKING`

### 3. Shared Merkle Alignment
- 新增 [merkle.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/utils/merkle.ts) 与 [index.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/utils/index.ts) 导出。
- 新增 canonical 样例 [weekly-merkle-golden-sample.json](/Users/ygg/vs/ai/3U/3u_aura/packages/common/fixtures/weekly-merkle-golden-sample.json)。
- 更新 [merkle-draft.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/engines/merkle-draft.engine.ts) 改用 shared constants。
- 新增 [merkle-golden-sample.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/engines/merkle-golden-sample.spec.ts)，对齐 root / leafHash / proof / rewardTypeCode。

### 4. Tests And Script
- 新增 [Settlement.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/Settlement.t.sol)。
- 新增 [MerkleClaim.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/MerkleClaim.t.sol)。
- 新增合约侧镜像样例 [weekly-merkle-golden-sample.local.json](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/fixtures/weekly-merkle-golden-sample.local.json)。
- 新增部署脚本 [DeploySettlementClaim.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol)。
- `Settlement.t.sol` 覆盖：
  - 单 token 领取
  - batch 领取
  - 转手后当前 owner 领取
  - referral NFT 拒绝
  - epoch 之外/补贴周期超上限拒绝
  - 重复领取拒绝
  - 预算回收
- `MerkleClaim.t.sol` 覆盖：
  - golden sample claim 成功
  - duplicate claim
  - wrong proof
  - publisher / owner 权限
  - root 不可重复发布

## Deviations From Plan
- 最初尝试让 Foundry 直接读取 [weekly-merkle-golden-sample.json](/Users/ygg/vs/ai/3U/3u_aura/packages/common/fixtures/weekly-merkle-golden-sample.json) 并通过 `fs_permissions` 开放跨包读取。实际执行时，Foundry 会按真实文件路径做权限判断，要求仓库特定绝对路径，方案不稳定且不适合提交到仓库。
- 为避免把机器绝对路径写入 `foundry.toml`，合约测试改为读取本地镜像样例 [weekly-merkle-golden-sample.local.json](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/fixtures/weekly-merkle-golden-sample.local.json)。canonical 样例仍保留在 `packages/common`，server 侧 golden sample 测试继续锚定 canonical 样例。
- 部署脚本只做了编译/测试级验证，没有连接 RPC 做 broadcast dry-run。

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec jest --runInBand src/modules/merkle/engines/merkle-draft.engine.spec.ts src/modules/merkle/engines/merkle-golden-sample.spec.ts src/modules/rewards/services/rewards.service.spec.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec jest --runInBand
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test --match-contract MerkleClaimTest -vv
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge config | sed -n '/fs_permissions/,+4p'
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test --match-contract MerkleClaimTest -vv
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge fmt --check
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test
```

## Verification Results
- `packages/common` build: passed
- `apps/server` build: passed
- `apps/server` targeted merkle tests: passed
  - `merkle-draft.engine.spec.ts`
  - `merkle-golden-sample.spec.ts`
  - `rewards.service.spec.ts`
- `apps/server` full test: passed
  - `17` suites
  - `41` tests
- `apps/contracts` `forge fmt --check`: passed
- `apps/contracts` `forge build`: passed
- `apps/contracts` `forge test`: passed
  - `5` suites
  - `33` tests

## Residual Notes
- 合约侧 golden sample 目前是 mirrored fixture，不是直接读取 `packages/common` 原始 JSON；如果后续要彻底消除镜像，需要单独设计一条可复用的生成/同步机制。
- `Settlement` 目前按 spec 只处理购买型 NFT 周补贴 claim，不负责 weekly merkle USDT。
- `MerkleClaim` 当前只覆盖 `LOTTERY / RANKING` 两类 weekly USDT claim；安慰奖 AURA 仍保持 server ledger 语义，后续进入 Phase10 genesis claim 聚合。
