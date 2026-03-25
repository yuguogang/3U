# Reward Funder Contract Rollout

## 1. Objective

为 `MerkleClaim` 建立一套可审计、可回滚的中期资金流方案，将当前“`owner` 自带资金调用 `depositRewards()` 注资”的模式升级为“按奖励类型绑定明确资金来源，由受控 funder 出资、`owner / rootPublisher` 负责发布”的模型，并同步规划 server/admin/部署脚本的联动改造与验证路径。

## 2. Scope

### 2.1 In Scope

- 改造 [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol) 的注资角色与权限模型
- 更新 Merkle claim 相关部署脚本与环境配置
- 设计并实施 server/admin 的“funding 校验 -> 链上注资 -> publish root -> DB activate”发布流程
- 增加合约测试、server 测试与 CI 验证
- 在 fork/new test deployment 上完成新合约 smoke 验证
- 明确奖励资金来源职责：
  - 抽奖/排名 `USDT` 奖励来源于 `checkinReceiverAddress`
  - NFT 周补贴来源于 `financeWallet`

### 2.2 Touched Modules

- [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)
- [DeploySettlementClaim.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol)
- `apps/contracts/test/*` 中对应 Merkle claim 测试
- [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [claim-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claim-publication.service.ts)
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts) 及相关 shared admin DTO
- `scripts/uat/*`、`scripts/ci/*` 中 Merkle funding/publish helper
- `config/promotion-envs/*/manifest.json`

## 3. Out Of Scope

- 不改动 `Settlement` 的 NFT 周补贴资金模型
- 不改造签到收款、NFT 售卖收款到财务总账的完整资金架构
- 不将 AURA 安慰奖改成链上 claim
- 不在旧合约上热切换生产资金流；必须走新部署环境验证

## 4. Assumptions

### 4.1 Product / Ops Assumptions

- 抽奖奖、排名奖继续通过 `MerkleClaim` 发放
- `checkinReceiverAddress` 代表签到收款资金来源
- `financeWallet` 代表购买型 NFT 收款资金来源
- 发布 root 的权限仍由 `owner` 或显式 publisher 角色控制，不直接交给财务钱包

### 4.2 Technical Assumptions

- 新模型仍以 ERC20 `transferFrom` 为核心，不引入额外 vault 合约
- 仍保留“先链上 funding，再 publish root，再 DB activate”三阶段语义
- 旧环境与旧合约在迁移期需要并行保留
- 抽奖/排名与周补贴允许采用不同的资金来源角色，不强行收敛为同一个 funder

### 4.3 Risk Assumptions

- 资金流与权限模型变更属于 `Critical`
- 任何“可领取”暴露都必须以链上 funding + root 达标为前提
- 新合约必须通过 Foundry 覆盖 access control / allowance / balance / double publish / claim happy path / revert path

## 5. Architecture Impact

### 5.1 Current Constraints

- 当前 [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol) 的 `depositRewards(uint256 amount)` 仅允许 `onlyOwner`，且 `transferFrom(msg.sender, address(this), amount)`，因此资金只能来自调用者自己。
- [DeploySettlementClaim.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol) 当前只配置 `OWNER` 与 `ROOT_PUBLISHER`，不存在独立 `rewardFunder` 角色。
- server/admin 目前可以编排 DB prepare/activate，但链上注资仍是脚本外部动作，缺少受控的资金就绪判断与可观测状态。

### 5.2 Target Architecture

- `MerkleClaim` 新增与签到奖励资金池绑定的 `rewardFunder` 角色，默认指向 `checkinReceiverAddress`
- 目标职责拆分：
  - `rewardFunder`: 提供抽奖/排名奖励资金来源并授予 allowance
  - `owner`: 变更高权限配置，例如更新 `rewardFunder`、`rootPublisher`
  - `rootPublisher`: 发布 root
- 新的发布流程：
  1. server/admin 先读取本周 draft，总结应发总额
  2. 校验 `rewardFunder` 的 allowance / balance
  3. 由受控调用执行 `depositRewardsFromFunder(...)`
  4. 成功后发布 root
  5. 仅在链上状态确认后激活 DB claimability

### 5.3 Migration Boundary

- 旧合约：继续用于当前短期测试与现有环境
- 新合约：在新的 fork/test deployment 环境验证后，再考虑切入后续测试服务器
- 环境 manifest 必须显式区分旧/新 Merkle distributor 地址与角色钱包
- `Settlement` 继续沿用单独资金语义，中期明确默认由 `financeWallet` 承担周补贴资金来源

## 6. Milestones

## 6.1 Milestone A: Contract Role Model Design And Tests

### goal

为 `MerkleClaim` 引入与签到奖池绑定的 `rewardFunder` 角色并完成可审计的合约接口设计。

### affected files/modules

- [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)
- `apps/contracts/test/*`

### implementation notes

- 评估并确定接口形态，优先考虑：
  - `setRewardFunder(address)`
  - `depositRewardsFromFunder(uint256 amount)` 或等价受控接口
- 保持 `publishRoot()` 与 claim 语义不变，避免扩大 blast radius
- 该 funder 默认映射为 `checkinReceiverAddress`，只服务抽奖/排名 `USDT` 奖励，不混用 NFT 周补贴资金来源
- 明确事件：
  - `RewardFunderUpdated`
  - 资金注入事件中区分 `caller` 与 `funder`
- 明确 revert：
  - `UnauthorizedFunder`
  - `InsufficientAllowance`
  - `InsufficientBalance`（若通过 token revert 传达则需在测试覆盖）

### risks

- 权限边界设计不清会让资金角色和发布角色混淆
- 若把“注资”和“发布”做成单函数，失败恢复会更难审计

### verification commands

- `forge test --match-contract MerkleClaim*`
- `forge test --match-test testRewardFunder*`

### expected outputs

- 新版合约接口定稿
- Foundry 测试覆盖新资金角色的 happy path 和 revert path

## 6.2 Milestone B: Deployment And Manifest Wiring

### goal

让部署脚本与环境清单支持按奖励类型拆分的资金来源，并明确迁移配置。

### affected files/modules

- [DeploySettlementClaim.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol)
- `config/promotion-envs/*/manifest.json`
- 相关 env/sample 配置

### implementation notes

- 在部署阶段注入 `REWARD_FUNDER`
- 明确 `OWNER / ROOT_PUBLISHER / REWARD_FUNDER` 三者的默认关系与可覆盖关系
- 在 manifest 中明确：
  - `checkinReceiverAddress` 用于抽奖/排名奖励资金来源
  - `financeWallet` 用于 NFT 周补贴资金来源
- 为 manifest 增补新角色字段，避免 server/admin 再从松散 env 中猜测

### risks

- 角色字段缺失会导致新环境配置不完整
- 旧环境 manifest 兼容处理不当会影响现有脚本

### verification commands

- `forge script ...DeploySettlementClaim... --sig run`
- `node --check scripts/ci/lib/manifest.mjs`

### expected outputs

- 新部署脚本可部署含 `rewardFunder` 的 Merkle claim
- manifest 可以作为角色配置单一真源

## 6.3 Milestone C: Server/Admin Publication Orchestration

### goal

把“资金就绪 + root 发布 + DB activate”做成受控、可观测的后台发布流程，并在后台口径中明确奖励资金来源。

### affected files/modules

- [claim-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claim-publication.service.ts)
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- shared admin DTO / UI models

### implementation notes

- 增加“发布预览”与“执行发布”区分：
  - preview：返回 merkle total、allowance/balance/funding status/root status
  - execute：串联 deposit -> publish -> activate
- 若链上 deposit 成功但 publish 失败，系统必须可重试，且不重复 DB activate
- 若 publish 成功但 DB activate 失败，系统必须支持 replay activate
- admin 返回的结果应能告诉操作者缺的是：
  - allowance
  - balance
  - funding tx
  - root already published
  - db activation pending

### risks

- 后台执行与脚本执行并存时可能出现重复触发
- 若不加业务幂等键，重试路径可能重复注资

### verification commands

- `pnpm --dir apps/server test`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin build`

### expected outputs

- server/admin 可以完整表达 reward funding 状态
- execute path 可安全重试，不再依赖“先手工猜测合约状态”

## 6.4 Milestone D: CI / Manual UAT Rollout

### goal

建立“CI 覆盖核心逻辑 + UAT 手工确认资金路径”的交付方式，并固定奖励资金来源口径。

### affected files/modules

- `scripts/ci/*`
- `scripts/uat/*`
- 相关 runbook / execution 文档

### implementation notes

- CI 负责：
  - 合约测试
  - server/admin build + targeted tests
  - 关键 helper 语法与流程验证
- UAT 负责：
  - 新环境部署
  - 使用 `checkinReceiverAddress -> MerkleClaim` 实际 allowance / deposit / publish / claim 测试
  - 使用 `financeWallet -> Settlement` 实际 subsidy funding / publish / claim 测试
  - admin 页面状态确认

### risks

- 若 CI 试图直接承接真钱包操作，会引入不必要的密钥风险
- 若 UAT runbook 不清晰，新的三角色模型容易操作失误

### verification commands

- `forge test`
- `pnpm --dir apps/server test`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin build`

### expected outputs

- 一套稳定的 CI 验证最小集
- 一份清晰的手工 UAT 验收步骤

## 7. Approval Checkpoint

本任务属于 `Critical`，因为它直接改变：

- Merkle claim 资金来源
- 合约权限模型
- 发布/领取的安全边界

在你批准本计划前，不进入实现与新合约部署。

## 8. Rollback / Recovery Notes

### 8.1 Contract Rollback

- 新合约通过新环境部署验证，不覆盖旧合约
- 若新方案失败，旧 `owner depositRewards()` 方案继续保留为 fallback

### 8.2 Operational Rollback

- 若 server/admin 新编排不稳定，可临时回退到“脚本 funding + publish + activate”旧流程
- DB activation 必须保持可重放，避免半完成状态卡死

## 9. Final Verification Checklist

- `MerkleClaim` 已支持独立 `rewardFunder`
- `rewardFunder` allowance / balance / funding / publish / activate 路径均有测试覆盖
- 新部署脚本与 manifest 角色定义一致
- 资金来源口径已固定：
  - 抽奖/排名奖励 `USDT` 来自 `checkinReceiverAddress`
  - NFT 周补贴 `USDT` 来自 `financeWallet`
- server/admin 不会在链上资金未就绪时暴露可领取状态
- 旧合约流程可保留作为紧急回退路径
