# Business Rules 3, 4, 13, 14, 15

## 1. Objective

实现并验证以下已澄清业务规则：

- `3` 签到可多次，抽奖资格按“每满 7 次签到 = 1 次抽奖资格”累计
- `4` 购买型卡牌取消当前购买上限
- `13` 邀请好友文案补充“间推 5% 奖励”
- `14` 团队长总业绩需要在后台可见
- `15` 保留现有 `REFERRAL` 审批后 mint 流程，同时新增一个后台“赠送”流程；领取仍走现有 mint 方式；同一钱包地址最多只能拥有 1 张 `REFERRAL` 卡规则不变

## 2. Scope

### 2.1 In Scope

- `checkin / lottery / rewards / stats` 的业务规则调整
- `FounderNFT / NFTSale` 的购买型 NFT 上限调整
- `dapp` 中签到、NFT、邀请好友相关文案与展示同步
- `admin` 中团队长总业绩可见性与 `REFERRAL` 赠送流程入口
- `server` 中 `REFERRAL` 资格/审批/签名流程扩展
- 对应测试、共享模型、执行记录

### 2.2 Touched Modules

- [apps/server/src/modules/checkin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin)
- [apps/server/src/modules/lottery](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery)
- [apps/server/src/modules/rewards](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards)
- [apps/server/src/modules/stats](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats)
- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)
- [apps/server/src/modules/signing](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing)
- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [apps/server/src/modules/tree](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree)
- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [apps/contracts/src/Settlement.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol)
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- [apps/dapp/src/components/pages/team-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
- [apps/dapp/messages/zh/common.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages/zh/common.json)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)

## 3. Out Of Scope

- 不处理 `6 / 7 / 8 / 11` 这些数据延迟、页面卡顿、团队页删减问题
- 不引入新的 NFT 类型；本任务仍只处理现有 `PURCHASED` 与 `REFERRAL`
- 不改变“同钱包只能有一张 `REFERRAL` 卡”的链上业务规则
- 不把 `REFERRAL` 赠送改成新的链上发放模式；仍沿用现有 mint/signature 路径
- 不在本计划中覆盖生产部署、迁移窗口或对外发布安排

## 4. Assumptions

### 4.1 Business Assumptions

- `15` 中的“赠送”表示后台可让指定钱包进入可 mint 状态，但用户仍调用现有 `mintNFTByReferral`
- `15` 需要保留现有审批 mint 流程，不替换现有流程
- `14` 中“后台可见”指 admin 接口 + admin 页面可见，不只是数据库已有数据

### 4.2 Technical Assumptions

- `3` 当前 schema 已有 `ticketCount`，默认假设可以在不新增表结构的前提下承接多票语义
- `13` 当前后端已按 `10% / 5%` 发放推荐奖励，主要缺口在文案展示
- `15` 当前链上 `FounderNFT.hasReferralNFT` 已能保证“一钱包一张 referral”

### 4.3 Open Decision Assumptions

- `4` 当前计划默认只移除购买型卡牌 `30` 张上限，不默认取消 `MAX_TOTAL_SUPPLY = 100`
- 如果产品要求“购买型卡牌 truly unlimited，且不再受总量 100 约束”，本计划需要在实现前更新

### 4.4 Risk Assumptions

- 本任务属于 `Critical`
- `3` 直接影响抽奖资格与奖励分配
- `4` 直接影响购买型 NFT 供应与 `Settlement` 的补贴资金计算
- `15` 直接影响 `REFERRAL` mint 授权边界

## 5. Architecture Impact

### 5.1 Current State

- `3` 当前允许同日多次签到，但只有当天第一次签到计入 streak/qualified days；抽奖资格由 `streakDays >= 7` 决定，`ticketCount` 目前只写 `0/1`
- `4` 当前购买型卡牌上限由链上常量 `MAX_PURCHASED_SUPPLY = 30` 控制，DApp 也显示 `/ 30`
- `13` 当前奖励引擎已计算间推 `5%`，但邀请页文案只写直推 `10%`
- `14` 当前库里已有左右区/小区业绩，但 admin 没有“团队长总业绩”专用视图或字段
- `15` 当前只有 `Referral NFT` 资格审批 -> 签名 -> 用户 mint 这一条路径，没有单独的后台赠送流程

### 5.2 Target State

- `3` 抽奖资格按签到次数累计，而不是按有效签到天数布尔判定；结算、计数、DApp 展示同步改为多票语义
- `4` 购买型 NFT 上限与前端展示同步调整，同时不破坏 `Settlement` 对 purchased supply 的资金语义
- `13` 文案与现有奖励计算口径一致
- `14` admin 可查看团队长总业绩，且来源与现有 tree/profile 统计保持一致
- `15` 后台新增赠送流程，但仍复用当前 eligibility/signing/mint 通道；原审批 mint 流程保留；单钱包单 referral 规则不变

### 5.3 Cross-Cutting Risks

- `3` 若只改 ticketCount 生成而不改 settlement/payout，会造成 UI 与结算结果不一致
- `4` 若只改 `FounderNFT` cap 而不评估 `Settlement.publishSubsidyEpoch()`，可能放大补贴资金风险
- `15` 若赠送路径绕过现有 eligibility/signing 状态机，可能造成 admin、签名、同步回写口径分裂

## 6. Milestones

## 6.1 Milestone A: Rule Freeze And Shared Contract/API Boundary

### goal

冻结这 5 条需求的精确定义，并把共享模型/API 边界定下来，避免后续 agent 并行时反复返工。

### affected files/modules

- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- 相关 validators / dto / contracts notes

### implementation notes

- 明确 `3` 的多票语义落在哪个 API 字段
- 明确 `4` 是否保留 `MAX_TOTAL_SUPPLY = 100`
- 明确 `15` 的赠送路径是“新增 admin 入口 + 复用 signing/mint”，而不是新增链上函数
- 冻结前不要并行修改 shared DTO

### risks

- 如果 `4` 的总量语义未冻结，合约 agent 会返工
- 如果 `15` 的赠送来源状态没定义清楚，admin/server 会出现两套口径

### verification commands

- `rg -n "ticketCount|daysUntilTicket|leftTeamVolume|smallLegVolume|approvedReferralNftCount" packages/common apps/server/src apps/dapp/src apps/admin/src -g '!**/node_modules/**'`

### expected outputs

- 共享 contract/API 字段列表冻结
- agent 并行边界可明确切分

## 6.2 Milestone B: Rule 3 Checkin / Lottery Multi-Ticket Refactor

### goal

把抽奖资格从“7 个有效签到日 = 1 张票”调整为“每满 7 次签到 = 1 张票”。

### affected files/modules

- [apps/server/src/modules/checkin/engines/checkin-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/engines/checkin-policy.engine.ts)
- [apps/server/src/modules/checkin/services/checkin-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.ts)
- [apps/server/src/modules/stats/repositories/stats.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats/repositories/stats.repository.ts)
- [apps/server/src/modules/lottery/engines/lottery-qualification.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/engines/lottery-qualification.engine.ts)
- [apps/server/src/modules/lottery/services/lottery-ticket.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-ticket.service.ts)
- [apps/server/src/modules/lottery/repositories/lottery-ticket.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/repositories/lottery-ticket.repository.ts)
- [apps/server/src/modules/lottery/services/lottery-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-settlement.service.ts)
- [apps/server/src/modules/lottery/engines/lottery-payout.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/engines/lottery-payout.engine.ts)
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)

### implementation notes

- 重点不是“允许多次签到”，而是“让多次签到影响 ticketCount”
- 要同步处理：
  - eligibility 计算
  - ticketCount 落库
  - participant/qualified 计数
  - settlement / payout 消费 ticketCount 的方式
  - DApp 进度展示
- 不能只改 UI 或只改 repository

### risks

- 高风险奖励路径，容易造成抽奖资格和结算结果不一致
- 若 payout 仍按 userId 单份抽样，会让“多票”只是表面生效

### verification commands

- `pnpm --dir apps/server test -- checkin-policy.engine.spec.ts checkin-application.service.spec.ts lottery-ticket.service.spec.ts`
- `pnpm --dir apps/server test -- lottery-payout.engine.spec.ts`
- `pnpm --dir apps/dapp typecheck`

### expected outputs

- 用户签到次数与抽奖票数关系符合 `7 -> 1`, `14 -> 2`, `21 -> 3`
- server/dapp/shared models 对多票语义一致

## 6.3 Milestone C: Rule 4 Purchased NFT Cap Update

### goal

调整购买型 NFT 当前购买上限，并同步链上、DApp 展示与测试。

### affected files/modules

- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [apps/contracts/src/Settlement.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol)
- `apps/contracts/test/*`
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- 相关 messages / contract config

### implementation notes

- 先确认是否只去掉 purchased cap，还是连 total cap 一并调整
- 改 cap 时必须复核 `Settlement.publishSubsidyEpoch()` 对 purchasedSupply 的依赖
- DApp 的 `/ 30`、剩余数量、按钮 gating 要与链上一致

### risks

- 这是合约高风险路径
- 若 cap 调整不完整，前端显示、测试和链上行为会漂移
- purchased supply 增长会直接影响补贴资金规模

### verification commands

- `forge test --match-contract FounderNFT`
- `forge test --match-contract NFTSale`
- `forge test --match-contract Settlement`
- `pnpm --dir apps/dapp typecheck`

### expected outputs

- 购买型 NFT 上限行为与产品定义一致
- DApp 显示不再硬编码旧上限

## 6.4 Milestone D: Rule 15 Referral Gift Flow While Preserving Existing Approval Mint

### goal

保留现有 `REFERRAL` 审批后 mint 流程，同时新增后台赠送流程，并继续沿用现有 signing/mint 通道。

### affected files/modules

- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)
- [apps/server/src/modules/signing/services/signing.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/services/signing.service.ts)
- [apps/server/src/modules/admin/services/admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [apps/server/src/modules/admin/admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
- [apps/admin/src/api/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
- [apps/admin/src/queries/admin.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
- [apps/admin/src/features/lists/components/nft-eligibility-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/lists/components/nft-eligibility-page.tsx)
- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)

### implementation notes

- 当前 one-wallet-one-referral 规则由链上 `hasReferralNFT` 保证，不能被后台赠送流程破坏
- 新流程目标应是“新增一种可 issue signature 的后台业务入口”，不是“新增 mint 函数”
- 原审批流必须继续保留，不能被 gift 流程覆盖掉

### risks

- 如果 gift 流程和 approval 流程共享状态但不区分来源，审计与排障会变难
- 如果 signing eligibility 断言不调整，后台 gift 可能拿不到签名
- 如果后台 gift 直接绕过链上 one-per-wallet 规则，最终只会在链上 revert

### verification commands

- `pnpm --dir apps/server test -- nft-eligibility-application.service.spec.ts admin-ops.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin typecheck`

### expected outputs

- 原审批 mint 流程继续可用
- 新 gift 流程可让指定钱包进入 referral mint 路径
- 单钱包单 referral 规则仍然成立

## 6.5 Milestone E: Rule 13 And 14 Surface Alignment

### goal

补齐邀请文案，并让团队长总业绩在 admin 可见。

### affected files/modules

- [apps/dapp/messages/zh/common.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages/zh/common.json)
- 其他语言消息文件
- [apps/server/src/modules/admin/repositories/admin-console.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/repositories/admin-console.repository.ts)
- [apps/server/src/modules/admin/services/admin-console.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-console.service.ts)
- [apps/server/src/modules/tree/services/tree-topology.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- admin overview/list 页面

### implementation notes

- `13` 不要改奖励算法，只要把文案补齐为现有口径
- `14` 的“总业绩”必须先定义公式：
  - 是 `left + right`
  - 还是取现有某个聚合口径
- admin 需要来源清晰，避免和 tree 页面展示口径不一致

### risks

- 若“总业绩”公式未冻结，前后端会出现重复返工
- 多语言文案若只改中文，其他语言会漂移

### verification commands

- `pnpm --dir apps/admin typecheck`
- `pnpm --dir apps/dapp typecheck`
- `rg -n "10%|5%|smallLegVolume|leftTeamVolume|rightTeamVolume" apps/dapp/messages apps/admin apps/server/src packages/common -g '!**/node_modules/**'`

### expected outputs

- 邀请页文案与现有奖励规则一致
- admin 能查看团队长总业绩

## 7. Agent Execution Model

### 7.1 Recommended Mode

采用“协调者 + 4 个实现 agent + 最后统一集成”的模式，而不是单 agent 串行完成。

### 7.2 Proposed Agent Split

1. `Agent A`：Rule 3 server domain
   - 负责 `checkin / stats / lottery / payout`
   - 不碰合约，不改 admin

2. `Agent B`：Rule 4 contracts
   - 负责 `FounderNFT / NFTSale / Settlement / forge tests`
   - 只在购买上限定义冻结后开始

3. `Agent C`：Rule 15 admin + signing flow
   - 负责 `nft-eligibility / signing / admin-ops / admin UI`
   - 目标是新增 gift 流程，同时保留原审批流

4. `Agent D`：DApp / copy / surface alignment
   - 负责 `checkin page / nft page / invite copy`
   - 等待 shared DTO 与 contract display constants 冻结后接入

### 7.3 Coordinator Responsibilities

- 冻结共享字段与业务定义
- 控制 merge 顺序：
  - `A` 与 `B` 可并行
  - `C` 可与 `A/B` 并行，但需锁定 `15` 的状态机
  - `D` 在 `A/B/C` 的 response shape 稳定后再收尾
- 统一跑最终验证
- 更新 `execution.md`

## 8. Approval Checkpoint

在你明确批准前，不进入实现。

批准时需要一并接受以下前置约束：

- `15` 保留现有审批 mint 流程，同时新增 gift 流程
- `15` 仍保持单钱包单 `REFERRAL` 规则
- `4` 当前默认只去掉 purchased cap；若你要同时取消 total cap，必须在实现前更新本计划

## 9. Rollback / Recovery Notes

- `3` 若多票语义导致结算风险，先回滚 server 侧 ticketCount/payout 逻辑，保留签到多次但恢复单票口径
- `4` 若购买型 cap 调整影响补贴资金安全，先回滚合约与 DApp cap 展示，不动其他业务模块
- `15` 若 gift 流程引入签名状态混乱，先关闭 admin gift 入口，保留原审批 mint 流程
- `13/14` 的文案和 admin 展示问题都应与高风险奖励/合约改动分离回滚

## 10. Final Verification Checklist

- [ ] `3` 的多次签到与多票语义在 server/dapp 上一致
- [ ] `3` 的结算逻辑真实消费多票而不是假多票
- [ ] `4` 的上限行为、DApp 展示、Forge 测试一致
- [ ] `4` 的 subsidy funding 语义已复核
- [ ] `13` 文案与当前 `10% / 5%` 奖励规则一致
- [ ] `14` admin 可见的“总业绩”口径已冻结且与现有 profile/tree 数据一致
- [ ] `15` 原审批 mint 流程仍可用
- [ ] `15` gift 流程可用，且不破坏单钱包单 referral 规则
- [ ] `execution.md` 记录了真实 commands、结果与偏差
