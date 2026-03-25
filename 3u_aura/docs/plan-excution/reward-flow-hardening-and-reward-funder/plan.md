# Reward Flow Hardening And Reward Funder

## 1. Objective

收口本轮 `fork-anvil` 测试中暴露出来的周奖励链路异常，并为下一次迭代准备一套可审计的中期资金流方案，使 `抽奖奖 / 排名奖 / NFT 周补贴` 的发布与领取过程更稳定、更可观测，同时为 `financeWallet -> MerkleDistributor` 的受控注资模型建立实施路径。

## 2. Scope

### 2.1 本轮需要规划的内容

- 周奖励发布链路的异常清单、根因、影响面与修复优先级
- `MerkleDistributor` 资金与 root 发布链路的短期硬化方案
- `Purchased NFT` 补贴投影链路的短期硬化方案
- 中期 `rewardFunder / financeWallet` 注资模型的合约、后端、后台联动方案
- 回归测试与验收口径

### 2.2 计划覆盖的系统边界

- [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)
- [Settlement.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol)
- [claim-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claim-publication.service.ts)
- [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- `scripts/uat/*` 与 `scripts/ci/.runtime/fork-anvil/*`

## 3. Out Of Scope

- 这次不直接实施新的合约部署
- 这次不直接上线 `financeWallet -> MerkleDistributor` 自动注资
- 不改写签到资金池、NFT 售卖收款、财务清算的全链路资金架构
- 不把数据库累计 AURA 直接改成链上 ERC20 余额模型

## 4. Assumptions

### 4.1 环境假设

- `fork-anvil` 继续作为周奖励测试主环境
- `testnet-live` 仍保持现有合约与环境定义，不在本轮直接替换
- 当前奖励领取依赖 `MerkleDistributor` 与 `Settlement` 两条独立链路

### 4.2 业务假设

- 抽奖奖、排名奖继续通过 `MerkleDistributor` 发放
- NFT 周补贴继续通过 `Settlement` 发放
- AURA 安慰奖继续保持“数据库累计、非链上 claim”语义

### 4.3 风险假设

- 资金流、claimability、root 发布、补贴发布均属于 Critical 路径
- 中期方案需要重发合约并在新部署上回归验证

## 5. Architecture Impact

### 5.1 当前已确认的异常点

1. `ClaimRecord/WeeklyReward` 可先被标记为 `CLAIMABLE`，但链上 `MerkleDistributor` 可能尚未完成 `depositRewards + publishRoot`，导致前端显示可领、钱包侧交易估算失败。
2. `fork-anvil` 存在 `config/promotion-envs/*` 与 `scripts/ci/.runtime/*` 双份运行态，地址漂移时会导致 helper 读到错误合约地址。
3. `sync-purchased-nft-state.ts` 依赖完整 `AppModule`，在脚本环境下容易被 `tsx` IPC/`express` 依赖拖垮，不适合作为 UAT 基础设施脚本。
4. NFT 周补贴的“链上发布”和“DB 投影”目前是分离步骤，缺少更直接的前置校验与故障提示。

### 5.2 中期目标架构

- 为 `MerkleClaim` 增加明确的 `rewardFunder` 资金角色，默认可指向 `financeWallet`
- 将“周奖励发布”升级为可控的两阶段流程：
  1. 资金准备校验与注资
  2. Root 发布与 DB 状态切换
- 后端/Admin 改为只在链上资金与 root 状态达标后才将相关奖励暴露为可领取

## 6. Milestones

## 6.1 Milestone A: Short-Term Reward Flow Hardening

### goal

消除“页面显示可领取，但链上实际不可领取”的状态错位。

### affected files/modules

- [claim-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claim-publication.service.ts)
- [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- 相关 `ClaimRecord / WeeklyReward / WeeklyEpoch` 发布路径
- 可能新增的后台发布脚本或服务层 orchestrator

### implementation notes

- 将 DB `CLAIMABLE` 状态与链上 `deposit + publishRoot` 成功后的时点绑定
- 统一增加链上前置校验：
  - `MerkleDistributor` 余额是否足够
  - 指定 epoch root 是否已发布
- 对 `Settlement` 补贴链路增加同类前置校验：
  - subsidy epoch 是否已发布
  - 合约预算是否足够
- 前端/后台若读到“尚未链上就绪”，应返回明确错误而不是让钱包侧盲目估算失败

### risks

- 历史数据可能存在已发布 DB 状态与链上状态不一致，需要补 reconcile
- 如果直接收紧条件，旧环境中部分 claim 可能暂时被隐藏

### verification commands

- `pnpm --dir apps/server test`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin build`
- `pnpm --dir apps/dapp build`
- `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase settle`

### expected outputs

- 用户在 `Claims` 页只会看到真正能在链上成功提交的奖励
- 后台或脚本能明确告诉操作者缺的是 `funding` 还是 `root`

## 6.2 Milestone B: Purchased NFT Sync Script Hardening

### goal

把 NFT 周补贴测试与投影从“依赖完整 Nest 容器的脆弱脚本”改造成稳定的 UAT 基础设施能力。

### affected files/modules

- [sync-purchased-nft-state.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/uat/sync-purchased-nft-state.ts)
- [purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- [purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- [scripts/uat/sync-weekly-fork-purchased-nft-state.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/sync-weekly-fork-purchased-nft-state.mjs)

### implementation notes

- 改成轻量脚本模式，避免直接启动完整 `AppModule`
- 优先复用已有 repository/service 逻辑，但通过更轻的入口注入依赖
- 为脚本输出增加结构化错误，区分：
  - 地址配置错误
  - 买入事件未找到
  - subsidy epoch 未发布
  - DB upsert 失败

### risks

- 如果抽离不当，可能复制一份业务逻辑，增加维护成本
- 需要兼顾 `syncPurchaseForUser(txHash)` 与“扫描 owner 全量状态”两种模式

### verification commands

- `pnpm --dir apps/server test -- purchased-nft-sync.service.spec.ts`
- `node scripts/uat/sync-weekly-fork-purchased-nft-state.mjs --env fork-anvil --wallet <wallet>`

### expected outputs

- UAT 脚本能稳定将购买型 NFT 投影为 `holding + subsidy claim`
- 失败时 stderr 可直接定位根因

## 6.3 Milestone C: Fork Runtime Source Of Truth Cleanup

### goal

消除 `fork-anvil` 多份 manifest/runtime 的地址漂移问题。

### affected files/modules

- `config/promotion-envs/fork-anvil/*`
- `scripts/ci/.runtime/fork-anvil/*`
- [scripts/ci/lib/manifest.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/manifest.mjs)

### implementation notes

- 明确 `fork-anvil` 运行态的单一真源
- 清理 `runtime.json` 中重复键和旧合约地址残留
- 对 helper 加入一致性校验，发现 manifest 地址冲突时直接报错

### risks

- 改动 helper 读取顺序可能影响现有 CI/UAT 脚本

### verification commands

- `node --input-type=module -e '...loadManifest(\"fork-anvil\")...'`
- `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase prepare`
- `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase settle`

### expected outputs

- 所有 helper 对同一环境读取到相同合约地址
- 不再出现链上有 NFT 但 helper 指向不存在合约地址的情况

## 6.4 Milestone D: Mid-Term Reward Funder Contract Design

### goal

设计并评审 `financeWallet -> MerkleDistributor` 的中期方案，为下一迭代的合约重发与后台联动做准备。

### affected files/modules

- [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)
- 相关部署脚本
- server/admin 奖励发布入口
- 环境 manifest 与角色配置

### implementation notes

- 推荐新增明确资金角色，例如 `rewardFunder`
- 目标语义：
  - `owner/rootPublisher` 负责控制发布
  - `rewardFunder` 负责出资
  - 合约从 `rewardFunder` 执行 `transferFrom` 到 `MerkleDistributor`
- 建议设计为受控两步：
  1. 校验 `rewardFunder` allowance + balance
  2. 成功注资后发布 root
- 需要同步设计失败恢复与幂等策略：
  - 已注资未发布
  - 已发布未标记 DB
  - 重试时重复调用

### risks

- 涉及资金权限与合约能力变化，必须重发合约
- 必须补完整的 Foundry 测试：
  - 未授权调用
  - allowance 不足
  - balance 不足
  - 重复发布
  - 注资后 claim

### verification commands

- `pnpm test:contracts` 或 `forge test`
- `pnpm --dir apps/server test`
- 新 fork/new testnet 部署 smoke tests

### expected outputs

- 一份可实施的合约/API/后台联动设计
- 明确“短期继续用旧合约，中期重发新合约”的迁移边界

## 7. Approval Checkpoint

本计划属于 Critical 级别，原因是它覆盖：

- claimability 状态切换
- Merkle 资金注入与 root 发布
- NFT 周补贴投影与发放
- 中期合约权限与资金流改造

在你批准前，不进入实现。

## 8. Rollback / Recovery Notes

### 8.1 短期硬化回滚

- 保留当前脚本化 `approve -> deposit -> publish` 路径作为兜底
- 若新的 server/admin 发布编排异常，可临时退回脚本方案

### 8.2 中期合约方案回滚

- 不在旧合约上原地替换
- 必须通过新部署环境验证
- 若新方案异常，旧合约与旧流程继续保留作为 fallback

## 9. Final Verification Checklist

- 周奖励在 DB 中被标记 `CLAIMABLE` 前，链上 `funding/root` 已就绪
- 用户领取前不会再遇到“页面可领但钱包估算失败”的状态
- Purchased NFT UAT 同步脚本可稳定运行，不依赖完整 Web 容器
- `fork-anvil` helper 与 runtime 地址保持一致
- `rewardFunder` 中期设计形成明确实施清单与测试要求
- `execution.md` 记录实际实施、验证、偏差与未完成项
