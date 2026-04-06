# Post Business Rules Onchain Indexer Plan

## 1. Objective

在“业务规则修改”完成并稳定之后，为 `3U AURA` 建立一套由 `server` 侧托管的正式链上索引与对账能力，降低“链上真实状态”和“数据库投影状态”不一致带来的运营、结算、补贴、claimability 风险。

本任务属于 `Critical`，因为它将直接影响：

- `check-in / PaymentReceipt`
- `PURCHASED / REFERRAL NFT` 持仓
- `NftSubsidyClaim`
- `ClaimRecord / WeeklyReward`
- 周结算前置 gate
- admin 修复与审计能力

本计划明确依赖顺序：

1. 先完成并验证当前一轮业务规则修改
2. 再启动本索引器任务

## 2. Scope

### 2.1 In Scope

- 设计并实现 `server` 域内的正式链上索引架构
- 运行时采用“独立 worker / 索引进程”，不把索引逻辑塞进 API 请求链路
- 为高风险链路建立统一的链上事件采集、原始事件持久化、投影更新、游标推进机制
- 首批覆盖以下业务对象：
  - 购买型 NFT 购买事件
  - `FounderNFT` 转账事件
  - `REFERRAL` mint 事件
  - `Settlement` 补贴领取事件
  - `MerkleClaim` 周奖励领取事件
  - check-in 对应 `USDT Transfer` / 支付验证链路的对账增强
- 为数据库新增“原始链事件 + 游标 + 投影修复”基础设施
- 在周结算 / 补贴发布前加入 release gate：
  - 链上数据未追平时禁止结算或发补贴通知
  - 关键投影不一致时明确返回 blocker
- 提供 admin / script 级别的对账与修复入口：
  - 按钱包修复
  - 按 tokenId 范围修复
  - 按 epoch 范围修复
- 为无限购买版本准备可扩展方案，不再依赖全量 `ownerOf(1..N)` 扫描作为主同步方式

### 2.2 Touched Modules

- [apps/server/src/modules/shared/services/promotion-chain-client.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/services/promotion-chain-client.service.ts)
- [apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- [apps/server/src/modules/claims/services/purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- [apps/server/src/modules/claims/services/referral-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/referral-nft-sync.service.ts)
- [apps/server/src/modules/payment/repositories/payment-verification.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/repositories/payment-verification.repository.ts)
- [apps/server/src/modules/checkin/services/checkin-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.ts)
- [apps/server/src/modules/admin/services/admin-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-settlement.service.ts)
- [apps/server/src/modules/rewards/services/reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts)
- `apps/server/src/modules/indexer/**` 或等效新模块
- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- `apps/server/prisma/migrations/**`
- `apps/server/src/modules/**/repositories/*`
- `apps/server/src/modules/**/services/*`
- `apps/server/scripts/**`
- `apps/admin/src/features/ops/**`
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)

### 2.3 User-Facing Outcomes

- 用户购买型 NFT 后，DApp 中的补贴显示不再依赖用户自己手动 sync
- 当前 owner、可领取补贴、已领取状态能更稳定反映链上真实状态
- 周结算与补贴发布前，后台可以明确知道“链上/数据库是否已对齐”
- 运维和 admin 不再依赖一次性修复脚本去补链上状态缺口

## 3. Out Of Scope

- 本轮计划内不立即实现；仅在业务规则修改完成后执行
- 不把 The Graph 作为唯一真相源
- 不用外部第三方索引服务替代自有数据库投影
- 不重写全部现有 claim / rewards / check-in 业务逻辑
- 不在第一阶段覆盖所有可能的合约事件
- 不把 server 改成托管热钱包签名器
- 不在本任务内重做整个 admin UI，只补必需的对账/诊断入口

## 4. Assumptions

### 4.1 Product / Release Assumptions

- 当前业务规则修改优先级高于索引器建设
- 购买型 NFT 在下个版本中可能取消 `30` 上限，因此不能把全量 `ownerOf(1..N)` 扫描作为长期主方案
- 周结算和补贴发布必须继续保持可审计、可阻断、可恢复

### 4.2 Technical Assumptions

- 索引器代码归 `apps/server` 管理，但运行时应为独立 worker / 独立进程
- 索引器主模式应为“增量事件索引 + 投影更新”
- `ownerOf(tokenId)` / 单钱包 repair 仅作为对账和修复手段，不作为长期主同步路径
- 数据库需要新增游标、原始链事件或等效持久化结构，因此本任务大概率包含 Prisma schema 变更与 migration
- 现有 `BullMQ`、`Redis`、`Prisma` 能承载第一版索引队列和回放能力

### 4.3 Safety Assumptions

- 结算、补贴、claim 相关发布前必须要求索引游标追平到可接受的安全区块
- 所有投影更新都必须可重放、幂等、可审计
- 外部 RPC 不稳定时，索引器需要支持分段回放、断点恢复、限流与 retry

## 5. Architecture Impact

### 5.1 Current Constraints

- 购买型 NFT 当前主要依赖用户侧同步入口：
  - [claims.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/controllers/claims.controller.ts)
- 购买型 NFT 状态投影主要靠“按钱包扫购买记录”：
  - [purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
  - [purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- 补贴合约真正认的是当前 owner：
  - [Settlement.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol)
- check-in 付款验证是实时 receipt 校验，可靠性比 NFT 投影更高：
  - [payment-verification.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/repositories/payment-verification.repository.ts)
  - [checkin-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.ts)

当前最大问题不是“无法修”，而是：

- 同步入口分散
- 投影不是持续自动维护
- 结算/补贴发布前没有强制 release gate
- 一旦 DB 漏持仓或漏 claim，只能等用户投诉后再补

### 5.2 Target Architecture

- `API Server`
  - 保持 controller / service 正常读写接口
- `Indexer Worker`
  - 独立运行
  - 持续拉取链上事件
  - 推进游标
  - 写原始事件表
  - 更新业务投影
- `Repair / Reconcile Tools`
  - 按钱包、token 范围、epoch 范围做局部重放和修复
- `Release Gate`
  - 周结算、补贴发布、通知发送前统一检查索引追平状态和投影一致性

### 5.3 Recommended Source Of Truth Strategy

- 链上合约事件与链上 view 是第一真相
- 数据库中的：
  - `PaymentReceipt`
  - `NftHolding`
  - `NftSubsidyClaim`
  - `ClaimRecord`
  - `WeeklyEpoch`
  - `WeeklyReward`
  都应视为“可重建投影”
- The Graph 可作为只读分析或辅助查询层，但不能作为结算/补贴的唯一权威来源

### 5.4 Proposed Data Layers

建议新增或等效引入以下持久化层：

- `ChainCursor`
  - 按事件流记录已同步到的区块高度
- `ChainEvent`
  - 原始链事件存档
- `ProjectionCheckpoint`
  - 记录某类投影的最后成功处理位置
- 必要时增加更细的投影表或审计表，用于：
  - token 当前 owner 投影
  - subsidy claim 投影
  - merkle claim 同步投影
  - check-in payment receipt 对账投影

### 5.5 Why The Current 30-Supply Shortcut Is Not Enough

- 目前 `FounderNFT` 的购买型上限还是 `30`，因此临时修复时用 `ownerOf(1..30)` 对账是可接受的
- 但下个版本若取消购买上限，这个手段只能保留为：
  - spot check
  - 小范围 repair
  - 发布前局部核验
- 长期主方案必须迁移到“增量事件索引”

## 6. Milestones

### 6.1 Milestone A: Indexer Architecture Freeze

#### goal

冻结“内部权威索引器”方案，明确不采用 The Graph-only 路线，并确定运行时边界、数据分层、真相源优先级。

#### affected files/modules

- [apps/server/src/modules/shared/services/promotion-chain-client.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/services/promotion-chain-client.service.ts)
- `apps/server/src/modules/indexer/**`
- `docs/decisions/**`（如需要 ADR）
- `docs/runbooks/**`

#### implementation notes

- 形成索引 worker 与 API server 的边界定义
- 定义首批索引事件清单
- 冻结“链上事件 -> 原始事件表 -> 业务投影”的标准流向
- 明确 The Graph 仅作为辅助查询层，不进入资金/claim 真相链路

#### risks

- 若边界未冻结，后续容易退化回“用户手动 sync + 临时 repair script”
- 若把 The Graph 当唯一真相，会增加高风险流程的不可控依赖

#### verification commands

- `rg -n "PurchasedNftSyncService|PaymentVerificationRepository|Settlement|MerkleClaim" apps/server/src apps/contracts/src`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`

#### expected outputs

- 索引器架构方案定稿
- 运行边界和真相源策略定稿

### 6.2 Milestone B: Persistence Foundations And Migrations

#### goal

新增索引游标、原始链事件、必要投影 checkpoint 的持久化基础设施。

#### affected files/modules

- [apps/server/prisma/schema.prisma](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma)
- `apps/server/prisma/migrations/**`
- `apps/server/src/db/**`
- `apps/server/src/modules/indexer/repositories/**`

#### implementation notes

- 设计可重放、可审计、可幂等的数据结构
- 游标应按事件流或 contract + event 维度拆分
- 原始事件表需保存：
  - chainId
  - contractAddress
  - txHash
  - logIndex
  - blockNumber
  - blockTimestamp
  - eventName
  - raw payload

#### risks

- schema 设计不合理会导致无限购买版本难以扩展
- 缺少唯一键会导致重复索引或重复投影

#### verification commands

- `pnpm --dir apps/server exec prisma validate`
- `pnpm --dir apps/server exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`

#### expected outputs

- 新增 schema 和 migration
- 原始事件层与游标层可用

### 6.3 Milestone C: Purchased NFT And Transfer Indexing

#### goal

把购买型 NFT 的“购买事件 + 转账事件 + 当前 owner 投影 + subsidy claim 投影”改成持续自动维护，不再依赖用户侧 sync。

#### affected files/modules

- [apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- [apps/server/src/modules/claims/services/purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- [apps/server/src/modules/claims/repositories/nft-holding.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-holding.repository.ts)
- [apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts)
- `apps/server/src/modules/indexer/**`

#### implementation notes

- 首先索引 `PurchasedNFTBought`
- 然后索引 `FounderNFT Transfer`
- 当前 owner 投影必须与补贴领取条件保持一致
- 补贴 claim 应基于：
  - 当期 subsidy epoch 的 `maxEligibleTokenId`
  - token 当前 owner
  - 是否已领取
- 保留按钱包 / token 范围的 repair 入口

#### risks

- 若只索引购买不索引转账，补贴 owner 仍会错
- 若 claim 投影不幂等，重放会产生重复 claim 行
- RPC `getLogs` 限流需要分页和区块窗口控制

#### verification commands

- `pnpm --dir apps/server exec jest src/modules/claims/services/purchased-nft-sync.service.spec.ts --runInBand`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- 针对测试环境跑指定钱包 reconcile smoke

#### expected outputs

- 购买型 NFT 持仓自动索引可用
- subsidy claim 投影自动维护可用
- 已知“12 张只显示 8 条”的问题可被系统性消除

### 6.4 Milestone D: Check-in Payment Reconcile Hardening

#### goal

为 `check-in` / `PaymentReceipt` 增加后台对账与补录能力，防止链上付款与 DB 签到记录失配。

#### affected files/modules

- [apps/server/src/modules/payment/repositories/payment-verification.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/repositories/payment-verification.repository.ts)
- [apps/server/src/modules/checkin/services/checkin-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.ts)
- `apps/server/src/modules/indexer/**`
- 现有 check-in repair 相关 admin / ops 页面

#### implementation notes

- 不改变当前“用户提交 txHash 即时验证”的主链路
- 追加后台对账能力：
  - 识别链上已付款但 DB 缺 `PaymentReceipt / Checkin`
  - 识别 DB receipt 存在但缺 check-in 关联
- 保持幂等与现有 repair 语义一致

#### risks

- 若误把非签到转账当签到，会污染奖励与奖池
- 这条线必须继续强校验：
  - token
  - payer
  - receiver
  - amount

#### verification commands

- `pnpm --dir apps/server exec jest src/modules/checkin/services/checkin-application.service.spec.ts --runInBand`
- `pnpm --dir apps/server exec jest src/modules/payment/repositories/payment-verification.repository.spec.ts --runInBand`

#### expected outputs

- check-in 对账能力增强
- 3U 支付与签到记录失配可被后台发现和修复

### 6.5 Milestone E: Release Gates And Admin Diagnostics

#### goal

把索引游标与投影一致性接入 admin / settlement 发布前检查，防止“数据没追平就发奖励/补贴/通知”。

#### affected files/modules

- [apps/server/src/modules/admin/services/admin-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-settlement.service.ts)
- [apps/server/src/modules/rewards/services/reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts)
- `apps/server/src/modules/indexer/services/**`
- `apps/admin/src/features/ops/**`
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)

#### implementation notes

- 增加 blockers：
  - cursor 未追平
  - 购买持仓数与 subsidy claim 数不一致
  - check-in receipt 对账未通过
- admin 需要能看见：
  - 当前链高度
  - 已同步高度
  - 延迟块数
  - 异常钱包数 / 异常 token 数
- 通知发布前也应能看清是否存在“部分用户暂看不到”的数据缺口

#### risks

- 如果 gate 太弱，仍会出现先通知后修数据
- 如果 gate 太强且解释不足，会阻塞运营但不知道怎么修

#### verification commands

- `pnpm --dir apps/server exec jest src/modules/admin/services/admin-settlement.service.spec.ts --runInBand`
- `pnpm --dir apps/admin exec tsc -p tsconfig.typecheck.json --noEmit`

#### expected outputs

- 结算/补贴发布前 gate 生效
- admin 有明确的索引健康状态和 blocker 可视化

### 6.6 Milestone F: Backfill, Replay, And Rollout

#### goal

提供历史回放与环境切换方案，把现有测试环境/正式环境平滑迁移到新索引器体系。

#### affected files/modules

- `apps/server/scripts/**`
- `docs/runbooks/**`
- `docs/plan-excution/**/execution.md`
- `apps/server/src/modules/indexer/**`

#### implementation notes

- 提供按区块范围重放
- 提供按钱包 / token / epoch 局部修复
- 为测试环境先回填已知缺失持仓，再验证补贴恢复
- runbook 必须写清楚：
  - 首次回放顺序
  - 切换前冻结动作
  - 故障恢复步骤

#### risks

- 历史回放可能造成重复投影或长时间锁表
- 切换时机不当可能与业务规则修改发布相互干扰

#### verification commands

- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec jest --runInBand`
- 测试环境 backfill / replay smoke 命令

#### expected outputs

- 可执行的回放脚本与 runbook
- 测试环境验证闭环
- 正式环境上线清单

## 7. Approval Checkpoint

本计划当前仅用于排队和设计冻结。

在以下条件同时满足前，不进入实现：

1. 当前“业务规则修改”任务已完成
2. 用户明确批准本索引器任务开始执行
3. schema / migration 变更窗口已确认

## 8. Rollback / Recovery Notes

- 索引器必须支持“停止消费但保留已写原始事件”
- 投影更新必须支持：
  - truncate projection + replay raw events
  - 按 wallet/token/epoch 局部重算
- 任何发布前 gate 接入都应能在紧急情况下临时降级，但必须留下审计记录
- 迁移失败时，优先回退到“旧链路 + 人工 repair”，而不是直接对高风险表做 ad hoc SQL

## 9. Final Verification Checklist

- 索引 worker 与 API server 边界清晰且可独立部署
- schema / migration 通过审查，唯一键与游标设计合理
- 购买型 NFT 持仓与当前 owner 投影自动维护可用
- subsidy claim 投影与链上资格边界一致
- check-in / PaymentReceipt 对账增强可用
- 周结算、补贴发布、通知发送前的 gate 生效
- 历史回放、局部 repair、测试环境 backfill 路径可执行
- `execution.md` 记录真实实现和验证结果

## 10. Recommended Agent Split (When Approved)

仅在本任务真正获批执行时使用，当前不启动。

- `Worker A`
  - 负责 Prisma schema / migration / raw event & cursor persistence
- `Worker B`
  - 负责 purchased NFT / transfer / subsidy claim indexing
- `Worker C`
  - 负责 check-in / payment reconcile hardening
- `Worker D`
  - 负责 admin diagnostics / release gates / shared DTO
- `Integrator`
  - 负责回放脚本、runbook、测试环境验证和最终收口
