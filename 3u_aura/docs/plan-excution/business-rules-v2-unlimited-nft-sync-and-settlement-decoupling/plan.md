# Business Rules V2: Unlimited NFT, Sync Hardening, And Settlement Decoupling

## 1. Objective

把当前客户确认的业务变更重新收敛成一组新的 `Critical` 任务，并显式推翻已经失效的旧假设，覆盖：

- `3` 每日签到可多次，且每满 `7` 次签到获得 `1` 次抽奖资格
- `4` NFT 不论是购买、推荐还是赠送，都不再设置数量上限
- `6 / 8` 购买后/登录后 NFT、补贴、持仓数据不同步与显示为 `0`
- `7` DApp 页面分段出现、卡顿、信息不流畅
- `9` 购买卡牌后需要有稳定可见的购买扣款记录
- `11` 团队板块删除不需要的内容
- `13` 邀请好友文案写清“间推 5% 奖励”
- `14` 团队长总业绩在后台可见
- `15` 保留现有审批 mint 流程，同时保留赠送路径，但不再受单钱包单 referral 卡限制
- `16` 周奖池改成 `50%` 抽奖 / `50%` 小区业绩排名，且抽奖不足参与人数时不应影响业绩奖本期结算
- `17` admin 周结算向导与后台处理能力继续完善，并与新的结算语义保持一致

本任务同时需要标记：

- 哪些“已完成”能力可直接沿用
- 哪些“已完成”结论已被新业务语义推翻
- 哪些问题必须在不引入完整索引器之前，先做一层过渡期的数据同步加固

## 2. Scope

### 2.1 In Scope

- 重新冻结 `3 / 4 / 6 / 7 / 8 / 9 / 11 / 13 / 14 / 15 / 16 / 17` 的最新业务语义
- 修正此前 `4` 与 `15` 的旧假设：
  - 不仅购买型 NFT 无上限
  - `REFERRAL` / `gift` 也不再受总量上限、单钱包单卡限制
- 为无限 `REFERRAL` mint / gift 设计新的 server 数据模型与签名发放路径
- 处理购买型 NFT / referral NFT / 补贴 claim 的链上与数据库同步缺口
- 把 item `9` 重述成“DApp 内稳定可见的购买记录/扣款记录”，而不是依赖第三方钱包必须展示
- 把周结算规则从：
  - `70 / 30`
  - `抽奖不足 => 整期 CANCELLED`
  调整为：
  - `50 / 50`
  - `抽奖 lane 可 rollover，但 ranking lane 仍按本期增量结算`
- 扩展现有 `admin` 的 `Settlement` / `Subsidy` 页面，使其适配新的分轨结算语义与同步前置检查
- 为 DApp 团队页 / NFT 页 / Claims 页补齐同步、性能、文案与显示稳定性
- 补充或修正 contracts / server / dapp / admin / shared / schema 的测试与执行记录

### 2.2 Touched Modules

- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [apps/contracts/test](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test)
- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- [apps/server/src/modules/checkin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin)
- [apps/server/src/modules/lottery](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery)
- [apps/server/src/modules/ranking](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/ranking)
- [apps/server/src/modules/epoch](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch)
- [apps/server/src/modules/rewards](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards)
- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [apps/server/src/modules/claims](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims)
- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)
- [apps/server/src/modules/signing](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- [apps/dapp/src/components/pages/claims-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx)
- [apps/dapp/src/components/pages/team-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [apps/dapp/messages](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages)
- [apps/admin/src/components/layout/admin-shell.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/layout/admin-shell.tsx)
- [apps/admin/src/features/settlement/components/weekly-settlement-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/settlement/components/weekly-settlement-page.tsx)
- [apps/admin/src/features/subsidy/components/subsidy-center-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/subsidy/components/subsidy-center-page.tsx)
- [apps/admin/src/features/lists/components/nft-eligibility-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/lists/components/nft-eligibility-page.tsx)

### 2.3 Carry-Forward Baselines To Preserve

以下能力不从零重做，而是纳入新任务做“保留 + 校正 + 回归验证”：

- `3` 多票口径的 server baseline 已有实现雏形
- `13` 间推 `5%` 文案已补过一轮
- `14` admin overview 已有团队长业绩展示雏形
- `15` admin `gift referral eligibility` 基础入口已存在
- `17` `Settlement` / `Subsidy` 页面骨架、query hooks、后端 API 已存在

### 2.4 Business Corrections Introduced By This Task

- 先前“`4` 完成”只去掉了购买型固定 `30` 上限，但当前代码仍有：
  - `MAX_TOTAL_SUPPLY = 100`
  - `MAX_REFERRAL_SUPPLY = 70`
  - `hasReferralNFT[recipient]`
  因此并未满足“购买 + 推荐 + 赠送都无限”的最新要求
- 先前“`15` 保持单钱包单 referral 卡”的结论已被新需求推翻
- 先前“整期 `CANCELLED`”逻辑会让 ranking reward 被 lottery gate 错误连带取消，这与 item `16` 和最新业务解释冲突

## 3. Out Of Scope

- 完整的链上索引器 / 独立 indexer worker 实现
  - 该项已单独规划在 [post-business-rules-onchain-indexer/plan.md](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/post-business-rules-onchain-indexer/plan.md)
- 强制第三方钱包 UI 必须展示 ERC20 扣款记录
- 生产 / 正式链部署切换
- 与本批需求无关的 DApp 大改版或视觉系统重做
- 重新定义购买型 NFT 补贴金额或 claim 周期规则

## 4. Assumptions

### 4.1 Product Assumptions

- `4` 的最新语义按最强版本处理：
  - 购买型 NFT 不设数量上限
  - `REFERRAL` mint / gift 也不设数量上限
  - 不再保留“单钱包单 referral 卡”业务规则
- `15` 的“审批流程 + 赠送流程”继续走现有 `mintNFTByReferral(...)` 领取方式，不新增新的链上 mint 入口
- `9` 的目标改写为：用户在 DApp 中必须稳定看到自己的购买记录、金额、交易哈希、到账结果；不再把“外部钱包必须显示”作为可验收目标
- `16` 的“按小区业绩排名奖励”继续按每个 epoch 的增量口径结算，不因 lottery 参与门槛不足而取消

### 4.2 Technical Assumptions

- 当前 `NftHolding` 足以承载一个用户多张 `PURCHASED` 和多张 `REFERRAL` NFT；真正不够的是 eligibility / signing / issuance 模型
- 当前 `NftReferralEligibility @@unique([userId])` 与单个 `mintedTokenId` 字段，无法表达“一个用户多次被批准/赠送/签名/领取 referral NFT”
- 当前 `NFTSale.referralNonces[msg.sender]` 本身支持同一地址按 nonce 连续多次 mint，只要合约端去掉 `FounderNFT.mintReferral()` 的地址级限制
- 当前 `WeeklyEpoch` 只有单一 `status` 与单一 `rolloverUsdt`，不适合长期承载“lottery rolled over but ranking settled”的双轨语义

### 4.3 Risk Assumptions

- 本任务整体属于 `Critical`
- 至少会触达：
  - 奖励规则
  - claimability
  - 资格发放
  - 合约供应边界
  - 结算状态机
  - 可能的 Prisma schema 变更
- 如果选择“最小补丁法”强行在现有单状态模型上拼接双轨结算，会显著增加后续结算与 admin 显示复杂度
- 如果在业务规则完成前不做任何同步加固，`6 / 8 / subsidy claim 缺失` 这类问题会持续污染测试结果

## 5. Architecture Impact

### 5.1 Current State

- `FounderNFT` 仍保留购买总上限 / referral 总上限 / 单地址单 referral NFT 限制
  - [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- `NFTSale.getRemainingNFT()` 仍返回基于这些上限的剩余数量
  - [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- `NftReferralEligibility` 是“每用户一行”的当前资格快照，并在同一行上记录审批、签名、mint 结果
  - [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- `giftReferralMintEligibility()` 当前只是复用 `markApproved()`，并没有多次 issuance / 历史 grant 模型
  - [apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts)
- 购买型 NFT 同步主要依赖买卡成功后的用户侧 sync，不能保证链上 owner 与 DB 投影及时一致
  - [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
  - [apps/server/src/modules/claims/services/purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- `WeeklyEpoch` 的 pool split 仍是 `70 / 30`，且 lottery minimum participant gate 会把整个 epoch 置为 `CANCELLED`
  - [apps/server/src/modules/epoch/engines/weekly-epoch-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/engines/weekly-epoch-policy.engine.ts)
  - [apps/server/src/modules/epoch/services/weekly-epoch-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/services/weekly-epoch-application.service.ts)
- `rewards.service` 仍要求 weekly epoch 为 `CALCULATING` 才能继续结算，因此 ranking lane 也被整期 `CANCELLED` 连带阻断
  - [apps/server/src/modules/rewards/services/rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- `admin` 已经有 `Settlement` / `Subsidy` 页面，但当前语义仍围绕单一 weekly status 展示
  - [apps/admin/src/features/settlement/components/weekly-settlement-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/settlement/components/weekly-settlement-page.tsx)
  - [apps/admin/src/features/subsidy/components/subsidy-center-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/subsidy/components/subsidy-center-page.tsx)

### 5.2 Target State

- NFT 供应语义：
  - 购买型 NFT 无购买上限
  - referral / gift mint 也无全局上限、无单地址上限
- `REFERRAL` 资格与“mint 授权记录”分离：
  - `当前资格快照` 继续反映用户是否满足自然达标条件
  - `审批 / 赠送 / 签名 / mint` 走可审计的 grant / issuance 记录
- 在完整索引器落地前，先引入“链上 owner 快照对账 + 后端补投影 + 客户端查询稳定化”的过渡方案，优先修复 `6 / 8 / subsidy claim 缺失`
- weekly settlement 采用“单 epoch，双结算 lane”语义：
  - `lottery lane`
  - `ranking lane`
  - 两者共享时间边界，但允许不同 outcome
- admin settlement wizard 基于双 lane 状态展示 blockers、结果与下一步动作
- DApp 购买记录不再依赖外部钱包展示，而是由系统内记录驱动

### 5.3 Recommended Data Model Direction

#### Referral Issuance

推荐不要继续把多次 `REFERRAL` mint / gift 挤在 [NftReferralEligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma) 单表里。更稳妥的方向是：

- 保留 `NftReferralEligibility` 作为“当前自然达标资格快照”
- 新增一张 grant / issuance 历史表，用于承载：
  - `source = QUALIFIED_APPROVAL | GIFT`
  - `approvedAt / approvedBy`
  - `signedNonce / payloadHash / expiresAt`
  - `mintedTokenId / mintedTxHash`
  - 独立状态流转

#### Weekly Settlement

推荐不要继续用单一 `WeeklyEpoch.status + rolloverUsdt` 拼接双轨语义。更稳妥的方向是：

- 保留 epoch 的时间边界与整体生命周期
- 新增 lane 级状态或等价结构，至少区分：
  - `lotteryStatus`
  - `rankingStatus`
  - `lotteryRolloverUsdt`
  - `rankingRolloverUsdt`

这样才能稳定表达：

- lottery 本期 rollover
- ranking 本期已 settle
- 同一个 epoch 的 root 里只包含 ranking rewards

## 6. Milestones

### Milestone 1 — Freeze Revised Semantics And Carry-Forward Boundaries

#### goal

把这批需求的最新语义与“已完成 / 已失效 / 待补齐”边界冻结，避免后续实施时继续沿用旧假设。

#### affected files/modules

- [docs/plan-excution/business-rules-v2-unlimited-nft-sync-and-settlement-decoupling/plan.md](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/business-rules-v2-unlimited-nft-sync-and-settlement-decoupling/plan.md)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)

#### implementation notes

- 把 item `9` 改写成可交付的系统内购买记录需求
- 把 item `15` 旧的“单钱包单 referral 卡”假设正式废弃
- 把 item `17` 明确为“扩展已有 settlement/subsidy center”，不是从零开始做新 admin 页面
- 给 shared view model 提前预留：
  - 多 referral issuance
  - 双 lane settlement 状态

#### risks

- 如果这一步不先冻结，后续 contract / schema / dapp / admin 会各自实现不同版本的业务语义

#### verification commands

- `rg -n "MAX_TOTAL_SUPPLY|MAX_REFERRAL_SUPPLY|hasReferralNFT|rolloverUsdt|CANCELLED|giftReferralMintEligibility" /Users/ygg/vs/ai/3U/3u_aura`
- `pnpm --dir packages/common exec tsc -p tsconfig.json --noEmit`

#### expected outputs

- 最新需求口径冻结
- 旧任务中的失效假设被显式标记

### Milestone 2 — Unlimited Purchased And Referral NFT Contract / Data Model Refactor

#### goal

让购买、推荐、赠送三条 NFT 路径都真正摆脱上限与单钱包单卡约束，并使 server 数据模型能承载多次 referral issuance。

#### affected files/modules

- [apps/contracts/src/FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [apps/contracts/src/NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [apps/contracts/test](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test)
- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)
- [apps/server/src/modules/signing](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing)
- [apps/server/src/modules/claims/services/referral-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/referral-nft-sync.service.ts)
- [apps/admin/src/features/lists/components/nft-eligibility-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/lists/components/nft-eligibility-page.tsx)

#### implementation notes

- 合约侧至少要移除：
  - `MAX_TOTAL_SUPPLY`
  - `MAX_REFERRAL_SUPPLY`
  - `hasReferralNFT` 地址级限制
  - 以及依赖这些上限的剩余供应展示接口
- server 侧不要继续把“当前资格快照”和“每次 mint 授权记录”混在一张表里
- `NFTSale.referralNonces[msg.sender]` 可继续复用，但后台需要能为同一地址多次签名/发放
- `NftHolding` 继续作为最终链上持仓投影，不必限制一个用户只能有一张 `REFERRAL`

#### risks

- 如果只改合约，不改 server eligibility / signing / sync，前后端仍会把用户锁死成单 referral 卡
- schema 改造若不保留审计轨迹，会破坏已存在的审批/赠送记录可追溯性

#### verification commands

- `pnpm --dir apps/contracts test`
- `pnpm --dir apps/contracts build`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec jest src/modules/nft-eligibility src/modules/signing src/modules/claims/services/referral-nft-sync.service.spec.ts --runInBand`

#### expected outputs

- 购买型与 referral/gift NFT 供应语义与最新需求一致
- 同一用户多次 referral issuance / mint 在 contract + server + admin 三层都可表示

### Milestone 3 — Interim Chain/DB Sync Hardening For NFT Holdings And Claims

#### goal

在完整索引器落地前，先修复最影响测试与补贴体验的同步缺口，避免用户买卡后/重登后看到 `0` 张或补贴缺失。

#### affected files/modules

- [apps/server/src/modules/claims/services/purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- [apps/server/src/modules/claims/services/referral-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/referral-nft-sync.service.ts)
- [apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- [apps/server/src/modules/claims/repositories/nft-holding.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-holding.repository.ts)
- [apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts)
- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- [apps/dapp/src/components/pages/claims-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx)

#### implementation notes

- 引入过渡期 reconcile 能力：
  - 指定钱包 reconcile
  - 指定 token range reconcile
  - 补贴发布前对 eligible token 范围做对账
- 买卡成功后的 DApp 流程不只依赖一次 txHash sync，要增加查询失效、重取与更稳的后端修复入口
- Claims / NFT 页面应优先展示“正在同步/刷新”的清晰状态，而不是空白 `0`
- 这一步不实现完整 indexer，只做足以稳定 testnet / UAT 的同步加固

#### risks

- 如果只在前端反复刷新而不修复 server projection，问题会持续复现
- 如果 reconcile 直接扫描无限全量 token，会和后续无限供应版本冲突；必须限定在钱包或 epoch 相关范围内

#### verification commands

- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec jest src/modules/claims --runInBand`
- `pnpm --dir apps/dapp exec tsc -p tsconfig.json --noEmit`

#### expected outputs

- 购买后持仓/补贴显示明显稳定
- 已知的 `chain 12 张 / DB 8 张` 这类问题可通过可重复流程修复

### Milestone 4 — DApp Experience Pass For NFT / Claims / Team

#### goal

收口 item `6 / 7 / 8 / 9 / 11 / 13` 的 DApp 体验层问题，提升页面稳定性、文案完整性与信息可见性。

#### affected files/modules

- [apps/dapp/src/components/pages/nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- [apps/dapp/src/components/pages/claims-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx)
- [apps/dapp/src/components/pages/team-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
- [apps/dapp/src/components/pages/checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
- [apps/dapp/src/components/layout/mobile-layout.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)
- [apps/dapp/messages](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages)

#### implementation notes

- 优先减少客户端 hydration 后的多段 waterfall 渲染
- 对 NFT / Claims 页补上更稳定的 loading / empty / syncing 状态
- 团队页按 item `11` 做内容精简，去掉不必要块
- 为 item `9` 增加购买记录可见性：
  - 金额
  - txHash
  - tokenId / 购买成功结果
  - 不把“外部钱包是否显示”当成成功标准
- 保留并回归验证 item `13` 的间推 `5%` 文案

#### risks

- 如果只优化样式而不减少 query waterfall，页面仍会显著分段出现
- 如果购买记录只放在 toast 而不持久化展示，客户反馈不会真正消失

#### verification commands

- `pnpm --dir apps/dapp exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/dapp build`
- `pnpm --dir apps/dapp lint`

#### expected outputs

- 登录后/购买后页面不再频繁出现“先是 0，刷几次才出来”的强烈体感
- 购买记录、邀请文案、团队内容更符合当前业务口径

### Milestone 5 — Weekly Settlement Rule Refactor: 50/50 And Lane Decoupling

#### goal

把周结算从“整期统一 gate”改造成“抽奖 lane 与 ranking lane 分轨结算”，并同步奖池比例改成 `50 / 50`。

#### affected files/modules

- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- [apps/server/src/modules/epoch/engines/weekly-epoch-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/engines/weekly-epoch-policy.engine.ts)
- [apps/server/src/modules/epoch/services/weekly-epoch-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/services/weekly-epoch-application.service.ts)
- [apps/server/src/modules/lottery](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery)
- [apps/server/src/modules/ranking](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/ranking)
- [apps/server/src/modules/rewards/services/rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- [apps/server/src/modules/rewards/services/rewards-read.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards-read.service.ts)
- [packages/common/src/models/promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)

#### implementation notes

- pool split 改成：
  - `lottery = 50%`
  - `ranking = 50%`
- `minimumParticipants` 只 gate lottery lane
- ranking lane 按当期小区业绩增量继续结算，不因 lottery lane rollover 被取消
- 需要明确新的状态表达：
  - lottery rolled over
  - ranking settled
  - 同期 root 是否只包含 ranking rewards
- read model / claims view / reward status 文案必须同步支持双轨语义

#### risks

- 若继续使用单一 `WeeklyEpoch.status` + `rolloverUsdt` 拼接，逻辑会变得隐晦且难审计
- schema 变更若不充分，会导致 admin / DApp 显示仍无法区分 ranking settled vs lottery rolled over

#### verification commands

- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec jest src/modules/epoch src/modules/lottery src/modules/ranking src/modules/rewards --runInBand`
- `pnpm --dir packages/common exec tsc -p tsconfig.json --noEmit`

#### expected outputs

- 抽奖不足参与人数时，只 rollover lottery lane
- 排名奖继续按当期增量发放
- 奖池比例与最新业务规则一致

### Milestone 6 — Settlement Wizard And Backoffice Flow Alignment

#### goal

让已存在的 `admin Settlement / Subsidy` 中心真正适配新的双轨结算与同步前置检查，不再误导运营。

#### affected files/modules

- [apps/admin/src/components/layout/admin-shell.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/layout/admin-shell.tsx)
- [apps/admin/src/features/settlement/components/weekly-settlement-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/settlement/components/weekly-settlement-page.tsx)
- [apps/admin/src/features/subsidy/components/subsidy-center-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/subsidy/components/subsidy-center-page.tsx)
- [apps/admin/src/api/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
- [apps/admin/src/queries/admin.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)

#### implementation notes

- 周结算页要从“单一 weekly status”改成“epoch overview + lottery lane + ranking lane + root/funding readiness”
- subsidy 页要增加“投影覆盖率/持仓同步缺口”可见性，避免运营在 claim 缺失时仍盲目发通知
- 若 ranking 已 settle 而 lottery rollover，admin 文案必须明确显示，不允许再以整期 cancelled 呈现
- 保留现有步骤化 UX，但补充新的 blockers / warnings / next action

#### risks

- 如果 admin 仍按旧单状态口径展示，会造成运营误判
- 如果 subsidy 页不暴露投影覆盖率，链上已发布但部分用户看不到 claim 的问题会继续反复出现

#### verification commands

- `pnpm --dir apps/admin exec tsc -p tsconfig.typecheck.json --noEmit`
- `pnpm --dir apps/admin lint`
- `pnpm --dir apps/server exec jest src/modules/admin --runInBand`

#### expected outputs

- admin 能清楚说明：
  - 当前 epoch 两条结算 lane 的状态
  - 哪一步完成了
  - 哪一步被什么条件阻塞
  - subsidy 投影是否完整

### Milestone 7 — Migration, Backfill, Testnet Verification, And Rollout Notes

#### goal

在不引入正式 indexer 的前提下，把 schema / backfill / testnet 验证 / 回滚策略整理完整，为后续发版做准备。

#### affected files/modules

- [apps/server/prisma/migrations](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/migrations)
- `apps/server/.tmp/*`
- `scripts/uat/*`
- `docs/runbooks/*`
- [docs/plan-excution/business-rules-v2-unlimited-nft-sync-and-settlement-decoupling/execution.md](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/business-rules-v2-unlimited-nft-sync-and-settlement-decoupling/execution.md)

#### implementation notes

- 为 referral issuance 的 schema 变更提供迁移与兼容说明
- 为 weekly settlement lane 化提供数据迁移或回填方案
- 为 purchased/referral holding reconcile 提供可重复执行脚本
- 在 `testnet-mockusdt` 上验证：
  - 多 referral mint
  - 50/50 结算
  - lottery rollover 不影响 ranking
  - subsidy projection 与 DApp claims 显示一致

#### risks

- 若缺少 backfill 方案，旧数据会让新逻辑在测试环境中持续失真
- 高风险变更若没有 runbook，会让下次结算再次依赖人工记忆

#### verification commands

- `pnpm --dir apps/server exec prisma migrate deploy`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/contracts test`
- `pnpm --dir apps/admin exec tsc -p tsconfig.typecheck.json --noEmit`
- `pnpm --dir apps/dapp exec tsc -p tsconfig.json --noEmit`

#### expected outputs

- schema / backfill / testnet 验证路线可执行
- rollout 与 recovery 注意事项成文

## 7. Approval Checkpoint

本任务在进入实现前，需要你明确确认以下设计选择：

- `4 / 15` 是否按本计划的强语义执行：
  - 购买型无上限
  - referral / gift 无上限
  - 取消单钱包单 referral 卡限制
- `16` 是否接受“为 clean semantics 做 schema 变更”，而不是强行在现有 `WeeklyEpoch.status` 上打补丁
- `9` 是否按“DApp 内购买记录可见”验收，而不是要求第三方钱包一定展示

若以上三点认可，本计划建议按当前架构方向实施，而不是沿用旧任务的部分假设。

## 8. Rollback / Recovery Notes

- 合约变更必须保留“旧环境地址不可原地升级”的认知，新的无限上限语义需要新部署/新 manifest 验证
- referral issuance 的 schema 变更必须保留历史审批/赠送/mint 审计轨迹，避免回滚时无法还原
- weekly settlement lane 化若需要回滚，必须明确：
  - 已生成 root 的 epoch 不能简单回退 schema 而不处理 claims
  - 已 rollover 的 lottery / ranking 需要有独立回滚说明
- 过渡期 reconcile 脚本必须保证幂等，避免重复生成 `NftHolding` 或 `NftSubsidyClaim`

## 9. Final Verification Checklist

- [ ] 购买型、推荐型、赠送型 NFT 的最新上限语义与合约一致
- [ ] server 不再把 referral issuance 锁死在“单用户单行”模型
- [ ] 多 referral mint / gift 在 admin、signing、DApp、claim sync 上都可工作
- [ ] 购买后 / 登录后 NFT 与补贴显示显著稳定，不再频繁出现 `0`
- [ ] DApp 内能稳定查看购买记录与扣款信息
- [ ] 团队页内容按业务要求精简
- [ ] 50/50 pool split 生效
- [ ] lottery 参与人数不足时仅影响 lottery lane，不影响 ranking lane
- [ ] admin settlement/subsidy center 能正确反映双 lane 状态与同步覆盖率
- [ ] Prisma migration、contract tests、server tests、admin/dapp typecheck 与必要的 smoke 验证完成
