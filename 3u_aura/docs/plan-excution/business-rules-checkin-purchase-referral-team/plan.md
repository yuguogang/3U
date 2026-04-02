# Business Rules: Check-In, Purchase, Referral, Team Visibility

## 1. Objective

将客户新确认的 5 条业务规则整理为一组可审计、可分阶段执行的实现计划，覆盖：

- `3` 签到可多次，且每满 `7` 次签到获得 `1` 次抽奖资格
- `4` 购买型卡牌不设上限
- `13` 邀请好友文案补充“间推 5% 奖励”
- `14` 团队长总业绩在后台可见
- `15` 保留现有 `REFERRAL` 审批 mint 流程，同时新增“赠送 referral mint 资格”流程，且继续保持“一个钱包地址只能拥有一张 referral 卡”

本任务需要同时明确哪些变化只影响前后端业务逻辑，哪些变化会触及数据库，哪些变化会触及合约与重新部署边界。

## 2. Scope

### 2.1 In Scope

- 调整签到与抽奖资格规则的 server / shared / dapp 逻辑
- 评估并落地购买型卡牌“取消上限”的合约与 DApp 变更
- 更新邀请好友文案，补足间推 `5%` 奖励说明
- 为 admin/backend 增加“团队长总业绩”可见能力
- 在保留现有 referral 审批 mint 流程的前提下，增加一条后台“赠送 referral mint 资格”流程
- 为上述改动补充对应测试、执行记录与审批边界

### 2.2 Touched Modules

- [apps/server/src/modules/checkin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin)
- [apps/server/src/modules/lottery](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery)
- [apps/server/src/modules/rewards](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards)
- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)
- [apps/server/src/modules/signing](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing)
- [apps/server/src/modules/tree](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree)
- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [apps/contracts/test](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test)
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- [apps/dapp/src/components/pages/team-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
- [apps/dapp/messages](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages)
- [apps/admin/src/features/overview/components/overview-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/overview/components/overview-page.tsx)
- [apps/admin/src/features/lists/components/nft-eligibility-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/lists/components/nft-eligibility-page.tsx)

## 3. Out Of Scope

- `6 / 7 / 8` 这组三条 DApp 数据一致性与性能问题
- `11` 团队板块内容精简的具体 UI 方案与实现
- 新 NFT 类型、新卡牌合约、新链上发放模式
- 已部署生产/testnet 合约的上线切换与发布执行
- 任何超出当前 5 条规则之外的产品重构

## 4. Assumptions

### 4.1 Product Assumptions

- `4` 的“不设置上限”按更强语义处理：取消当前购买型 NFT 的全局 `30` 张上限，而不只是“取消单钱包限制”
- `15` 的“赠送流程”不是新卡牌类型，而是为现有 `REFERRAL` mint 增加一条后台授权入口
- `15` 继续保持业务约束：同一个钱包地址最多只能拥有 `1` 张 `REFERRAL` 类型卡
- `14` 的“后台数据库有显示”按“admin 后台可查询/可展示”实现，而不是仅仅保证底层表已有原始数据

### 4.2 Technical Assumptions

- `3` 当前 schema 已有 `LotteryTicket.ticketCount`，可作为多抽奖资格承载字段
- `3` 当前抽奖结算仍按“每个用户一条参与记录”工作，需要显式调整 settlement / payout 对 ticket 数量的消费方式
- `15` 当前合约入口 `mintNFTByReferral(...)` 可继续复用，不必新增链上入口
- `15` 当前 eligibility / signing / admin ops 架构可扩展出“审批赠送资格”和“常规审批资格”两条 server 入口

### 4.3 Risk Assumptions

- 本任务整体属于 `Critical`
  - `3` 直接改变抽奖资格与奖励分配语义
  - `4` 若取消全局购买上限，会影响链上供应边界
  - `15` 直接改变 referral 资格授予方式
- 任何会改动合约常量、资格状态机、ticket 计算方式的实现，都必须以小步可验证为原则

## 5. Architecture Impact

### 5.1 Current State

- `3` 当前 server 已支持同日多次签到，但只有当天第一次签到会计入 streak / counted days；抽奖资格按 `countedCheckinDays >= 7` 判定，且 `ticketCount` 当前只写 `0/1`
  - [apps/server/src/modules/checkin/engines/checkin-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/engines/checkin-policy.engine.ts)
  - [apps/server/src/modules/lottery/engines/lottery-qualification.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/engines/lottery-qualification.engine.ts)
  - [apps/server/src/modules/lottery/services/lottery-ticket.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-ticket.service.ts)
- `4` 当前购买型 NFT 的全局购买上限写死在合约 `MAX_PURCHASED_SUPPLY = 30`
  - [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- `13` 当前后端已经发放间推 `5%`，但前端邀请文案未体现
  - [apps/server/src/modules/rewards/engines/reward-allocation.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/engines/reward-allocation.engine.ts)
  - [apps/dapp/messages/zh/common.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages/zh/common.json)
- `14` 当前 `UserProfile` 已有左右区/小区业绩，但 admin 没有“团队长总业绩”专用视图
  - [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
  - [apps/server/src/modules/admin/services/admin-console.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-console.service.ts)
- `15` 当前只有“达标 -> admin 审批 -> signer 签名 -> 用户 mint”这一条 referral 路径
  - [apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts)
  - [apps/server/src/modules/signing/services/signing.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/services/signing.service.ts)
  - [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)

### 5.2 Target State

- `3` 抽奖资格由“按有效签到天数满 7 天得 1 张票”改为“按签到次数每满 7 次得 1 张票”，并在 epoch ticket refresh、participation、settlement、DApp 展示中保持一致
- `4` 购买型 NFT 不再在 UI、API、合约中表现为 `30` 张固定上限
- `13` 邀请页面和相关 copy 明确写出“直推 10% + 间推 5%”
- `14` admin 后台可以查看团队长总业绩，且该值口径与现有 left/right/small-leg 数据一致、可审计
- `15` 在保留现有审批 mint 流程的同时，新增一条“后台赠送 referral mint 资格”流程，但最终仍通过现有 mint 方式领取，并继续强制单钱包单 referral 卡

### 5.3 Contract / Schema Boundary

- `3`
  - 合约：不改
  - schema：优先不改，复用现有 `ticketCount`
- `4`
  - 合约：需要改 `FounderNFT` 购买上限语义，并同步 sale/测试/展示
  - schema：不改
- `13`
  - 合约：不改
  - schema：不改
- `14`
  - 合约：不改
  - schema：优先不改；若“总业绩”只需由现有 left/right volume 聚合得出，则通过 query/view model 层完成
- `15`
  - 合约：优先不改，复用现有 `mintNFTByReferral(...)`
  - schema：优先不改，在现有 `NftReferralEligibility` 状态机与 admin 审计上扩展赠送来源/动作；若实现中发现现有字段无法区分来源，再补 schema 变更

## 6. Milestones

### Milestone 1 — Freeze Business Semantics And Shared Contracts

#### goal

先冻结 5 条规则的最终语义与 DTO 边界，避免后续边做边改。

#### affected files/modules

- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- 如需同步产品文字，再更新相关 docs/plan 文件

#### implementation notes

- 为 `3` 明确 shared view 是否需要从“daysUntilTicket/currentStreakDays”扩展到“ticketCount/checkinProgress/checkinCount”
- 为 `14` 明确 admin view model 中“团队长总业绩”的口径
- 为 `15` 明确后台赠送流程是否需要在返回值中区分 `APPROVED` 与 `GIFTED_ELIGIBLE`；若不新增状态，则要明确如何在审计层区分

#### risks

- 如果不先冻结共享 contract，前后端会对“抽奖资格数量”和“赠送资格状态”产生不同理解

#### verification commands

- `rg -n "daysUntilTicket|currentStreakDays|ticketCount|smallLegVolume|AdminOverviewView" /Users/ygg/vs/ai/3U/3u_aura/packages/common`
- `pnpm --dir packages/common build`

#### expected outputs

- shared models / validators 对新业务语义的承载方式定稿
- 后续各 worker 可以并行开发而不反复改 contract

### Milestone 2 — Check-In Ticket Accrual Refactor

#### goal

把抽奖资格从“7 天 = 1 张票”改成“每 7 次签到 = 1 张票”，并让 refresh / participate / settlement / DApp 口径一致。

#### affected files/modules

- [apps/server/src/modules/checkin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin)
- [apps/server/src/modules/stats](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats)
- [apps/server/src/modules/lottery](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [apps/dapp/messages](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages)

#### implementation notes

- 资格基础应切到 `checkinTimes / totalCheckinCount`，而不是 `countedCheckinDays`
- `LotteryTicket.ticketCount` 要真正支持大于 `1` 的数量
- `qualifiedTicketCount` / `participantCount` / payout 抽样逻辑必须明确是否按 ticket 数量加权，而不是继续按“每用户 1 条”
- DApp 文案要从“再签到 X 天得 1 张抽奖券”改成按签到次数展示

#### risks

- 这是奖励分配核心路径，若 settlement 仍按 userId 去重，前端显示的多票与后台抽奖实际权重会不一致
- 若仍保留 `daysUntilTicket` 这类旧字段但语义已变，前后端极易出现隐藏回归

#### verification commands

- `pnpm --dir apps/server test -- --runInBand lottery-ticket lottery-settlement checkin`
- `pnpm --dir apps/server build`
- `pnpm --dir packages/common build`
- `pnpm --dir apps/dapp typecheck`

#### expected outputs

- server refresh / participate / settlement 全部按新票数规则工作
- DApp 检查页展示的新规则与后台一致

### Milestone 3 — Purchased NFT Unlimited Rollout

#### goal

取消购买型 NFT 当前固定上限，并同步 DApp 展示与测试。

#### affected files/modules

- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [apps/contracts/test](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- [apps/dapp/src/components/branding/goldmint-shield-card.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/branding/goldmint-shield-card.tsx)
- [apps/dapp/messages](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages)

#### implementation notes

- 明确“无限”是取消 `MAX_PURCHASED_SUPPLY`，还是改成只受总供应上限约束；此计划默认按“取消购买型固定 30 上限”处理
- 若合约常量变化影响部署产物，需要同步 deployment / manifest / test assumptions
- DApp 中所有 `/ 30`、`remaining`、`030` 等写死展示都要一起清理

#### risks

- 合约改动意味着需要新部署环境验证，不能假设现有已部署地址可无缝承接
- 若只改 UI 不改合约，会出现“页面无限买，链上第 31 张失败”的严重偏差

#### verification commands

- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp build`
- `pnpm --dir apps/contracts test`
- `pnpm --dir apps/contracts build`

#### expected outputs

- 合约不再对购买型 NFT 保留当前固定购买上限
- DApp 展示不再写死 `30`

### Milestone 4 — Admin Team Performance Visibility

#### goal

为后台增加“团队长总业绩”可见能力，并明确与现有 left/right/small-leg 的关系。

#### affected files/modules

- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [apps/server/src/modules/tree](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [apps/admin/src/features/overview/components/overview-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/overview/components/overview-page.tsx)

#### implementation notes

- 优先复用 `UserProfile.leftTeamVolume/rightTeamVolume/smallLegVolume`
- 若“总业绩”定义为左右区总和，应在 server 明确统一计算，不把聚合规则散落到 admin 前端
- 若需要筛选“团队长”，要明确是 `teamPosition`、根节点、还是某类 admin 查询口径

#### risks

- 如果“总业绩”口径不先统一，后台、树接口、客户理解会出现三套不同数字

#### verification commands

- `pnpm --dir apps/server test -- --runInBand admin tree`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin build`

#### expected outputs

- admin 能稳定查看团队长总业绩
- 该数据来源清晰，可从现有 profile / tree 数据审计追溯

### Milestone 5 — Referral Approval + Gift Flow Coexistence

#### goal

在不改变现有链上 mint 方式和单钱包单 referral 规则的前提下，保留现有审批 mint 流程，并新增后台赠送流程。

#### affected files/modules

- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)
- [apps/server/src/modules/signing](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing)
- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [apps/admin/src/features/lists/components/nft-eligibility-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/lists/components/nft-eligibility-page.tsx)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)

#### implementation notes

- 保留：
  - 达标 -> 审批 -> 签名 -> mint
- 新增：
  - 后台赠送 referral mint 资格 -> 签名 -> mint
- 继续依赖现有 `mintNFTByReferral(...)`
- 无论来自审批还是赠送，都必须继续服从“单钱包单 referral NFT”约束
- 审计日志要能区分：
  - 常规审批
  - 赠送授予

#### risks

- 若赠送流程直接绕开现有 eligibility / signing 守卫，可能破坏单钱包单 referral 约束
- 若不在 audit 中区分来源，后续无法分辨用户是“达标审批通过”还是“后台赠送”

#### verification commands

- `pnpm --dir apps/server test -- --runInBand nft-eligibility signing admin`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin build`
- `pnpm --dir apps/dapp typecheck`

#### expected outputs

- 原审批 mint 流程保持可用
- 新赠送流程可用
- referral 单钱包唯一性仍然保持

### Milestone 6 — Copy And Surface Alignment

#### goal

把 `13` 以及 `3/4/15` 相关前端文字和显示面同步到新规则。

#### affected files/modules

- [apps/dapp/messages/zh/common.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages/zh/common.json)
- 其他 locale 文件
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [apps/dapp/src/components/pages/team-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)

#### implementation notes

- 邀请页补充“间推 5% 奖励”
- 签到页文案从“7 天 1 张票”改成“每满 7 次签到 1 次抽奖资格”
- NFT 页清理固定 `30` 上限文案
- referral NFT 页提示要兼容“审批授予”和“赠送授予”两条来源

#### risks

- 如果只改中文，其他 locale 会产生明显不一致

#### verification commands

- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp build`
- `rg -n "/ 30|7 days|10%|5%" /Users/ygg/vs/ai/3U/3u_aura/apps/dapp`

#### expected outputs

- 主要用户触点文字与新规则一致
- 不再暴露旧的 7-day / 30-cap 文案

## 7. Agent Execution Mode

本任务适合采用“小团队并行 + 主线集成”模式，而不是单线程顺做。

### Recommended Wave 1

- `Worker A`：`apps/server` + `packages/common`
  - 负责 `3` 的 ticket 规则重构
  - 负责 `14` 的 admin/team visibility server contract
- `Worker B`：`apps/contracts`
  - 负责 `4` 的购买型 NFT 上限改动与 contract tests
- `Worker C`：`apps/server` admin / eligibility / signing
  - 负责 `15` 的 referral approval + gift flow

### Recommended Wave 2

- `Worker D`：`apps/dapp`
  - 接入 `3 / 4 / 13 / 15` 的 DApp 展示与多语言文案
- `Worker E`：`apps/admin`
  - 接入 `14 / 15` 的后台展示与操作入口

### Recommended Shared Review

- `Reviewer / Integrator`
  - 检查 shared DTO 变化是否被前后端完整消费
  - 检查 reward / eligibility 高风险路径的测试是否覆盖成功与边界场景
  - 收尾执行 build / test / plan sync

### Ownership Constraints

- `Worker A` 不写合约
- `Worker B` 不写 server/admin/dapp
- `Worker C` 不修改 `apps/contracts`
- `Worker D` 只写 `apps/dapp`
- `Worker E` 只写 `apps/admin`
- shared DTO 以 `Worker A` 为 owner，其他 workers 只在对齐后消费，避免冲突

## 8. Approval Checkpoint

这是一个 `Critical` 任务。

在你批准本计划前，不进入实现阶段。

批准后建议按以下顺序执行：

1. 先做 Milestone 1 冻结 shared 语义
2. 然后并行推进：
   - Milestone 2
   - Milestone 3
   - Milestone 5
3. 再由前台/admin 消费：
   - Milestone 4
   - Milestone 6
4. 最后统一验证、补 execution.md

## 9. Rollback / Recovery Notes

- `3` 若新票数规则导致 settlement 风险，优先回滚到原单票资格逻辑，同时保留新计划文档
- `4` 若合约边界不明确，停止在“合约+UI半同步”状态，避免出现 UI 显示无限但链上继续 30 cap
- `15` 若赠送流程打破 referral 单钱包唯一性，必须先回滚赠送入口，再排查 eligibility / signing 守卫
- 任何 rollback 都必须保留审计记录与 execution.md 偏差说明

## 10. Final Verification Checklist

- [ ] `3` 的抽奖资格改为按签到次数累计，且 settlement / DApp 一致
- [ ] `4` 的购买型卡牌上限改动在合约与 DApp 同步
- [ ] `13` 邀请好友文案包含“间推 5% 奖励”
- [ ] `14` admin 可查看团队长总业绩
- [ ] `15` 原审批 mint 流程保留，赠送流程新增，且 referral 单钱包唯一性未破坏
- [ ] 相关 build / test / contract verification 已执行
- [ ] `execution.md` 已记录真实命令、结果、偏差与风险
