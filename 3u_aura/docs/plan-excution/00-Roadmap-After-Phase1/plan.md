# Plan: 00 - Roadmap After Phase 1

## 1. Objective
基于已完成的基础设施与数据模型阶段，给出后续交付路线图、阶段依赖、审批顺序，以及复杂任务的进一步拆分原则。

## 2. Scope
- 定义推广阶段 MVP 的最小闭环
- 定义发行切换阶段与交易阶段边界
- 确定后续 Phase 顺序
- 标记必须进一步拆分的复杂任务
- 约束 server / contracts / dapp 的推进次序

## 3. Out of Scope
- 不直接编写业务代码
- 不直接执行数据库迁移
- 不直接部署合约
- 不直接实现 UI 页面

## 4. Assumptions
- Phase 1 已完成并通过验证
- 当前 Prisma schema、common types、seed 基线可继续演进
- 优先级为“先推广阶段闭环，后发行后交易闭环”
- 推广阶段所有 AURA 奖励均为内部账本，发行后统一 claim
- 发行后签到、推荐、抽奖、排名、NFT 周补贴全部停止

## 5. Current State
已完成：
- PostgreSQL / Prisma / seed 基础设施
- 初版 schema 与 shared models
- Docker 与数据库联通
- 基础 schema 验证

未完成：
- 签到业务闭环
- 推荐树与上卷体量
- 周门票 / 抽奖 / 排名 / Merkle 数据
- Founder NFT / NFTSale / Settlement / MerkleClaim
- 推广阶段 DApp
- 发行总 claim / 推广逻辑停用
- DEX 税 / 分红 / 烧池

## 6. Target State
形成一套可逐阶段审批、逐阶段实现、逐阶段验收的任务体系，使每个复杂阶段都有清晰边界与可验证输出。

## 7. Architecture Impact
- `apps/server`：先于其他层稳定业务事实来源
- `apps/contracts`：只在后端规则明确后承接 on-chain 入口
- `apps/dapp`：尽量消费已稳定的 API / adapter，不反向定义业务规则
- `packages/common`：作为 DTO / schema / enums 的单一共享源

## 8. Risks
- 提前开发 DApp 导致 API 与规则反复漂移
- 树结构与体量口径不稳定时进入周结算，后续返工巨大
- 过早进入 Token 交易税逻辑，扩散风险面
- server 与 contract 的 leaf 编码、signature payload 漂移
- 发行切换流程若未单独规划，容易出现奖励继续发放或无法 claim

## 9. Milestones

### Milestone 1 — Promotion backend foundation
**Goal**
- 完成签到、树结构、上卷体量、周结算数据管道

**Affected files/modules**
- `apps/server`
- `packages/common`

**Implementation notes**
- 先事实来源，再链上入口，再 UI

**Risks**
- server 口径若不稳，会连带影响 contracts / dapp

**Verification**
- commands:
  - `pnpm --filter server lint`
  - `pnpm --filter server test`
- expected result:
  - 核心 domain 可单测、关键流程可集成测试

**Approval checkpoint**
- yes

### Milestone 2 — Promotion contract foundation
**Goal**
- 完成 FounderNFT / NFTSale / Settlement / MerkleClaim

**Affected files/modules**
- `apps/contracts`
- `packages/common`

**Implementation notes**
- 只交付推广阶段必须能力，Token 税逻辑后置

**Risks**
- EIP712 / Merkle 编码若与后端不一致会造成整段功能不可用

**Verification**
- commands:
  - `pnpm --filter contracts test`
- expected result:
  - 购买、签名 mint、补贴 claim、Merkle claim 本地测试通过

**Approval checkpoint**
- yes

### Milestone 3 — Promotion dapp closure
**Goal**
- 完成钱包连接、签到、团队数据、奖励查询、NFT 页面、claim 页面

**Affected files/modules**
- `apps/dapp`
- `packages/common`

**Implementation notes**
- 以 hooks / adapters 消费 server + contracts，避免 UI 内混入业务

**Risks**
- 视图层绕过 server 直接定义业务规则

**Verification**
- commands:
  - `pnpm --filter dapp lint`
  - `pnpm --filter dapp test`
- expected result:
  - 推广阶段核心路径可演示

**Approval checkpoint**
- yes

### Milestone 4 — Launch transition and post-launch trading
**Goal**
- 完成推广逻辑停用、发行总 claim、DEX 税与分红阶段切换

**Affected files/modules**
- `apps/server`
- `apps/contracts`
- `apps/dapp`
- `packages/common`

**Implementation notes**
- 必须等推广阶段稳定后再推进

**Risks**
- 状态切换错误直接影响资金与资格

**Verification**
- commands:
  - `pnpm test`
  - `pnpm build`
- expected result:
  - 推广前后边界切换可验证

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 所有大阶段按目录单独推进，避免跨阶段并行大改
- 发布前通过 config / feature flag 锁定高风险开关
- 发行切换前冻结推广相关 schema 变更
- leaf 编码与签名 payload 必须保留 golden sample 用于回归

## 11. Final Verification Checklist
- [ ] 推广阶段与发行后阶段边界明确
- [ ] 后续任务已按复杂度拆分
- [ ] 合约与 DApp 推进顺序依赖明确
- [ ] 高风险状态切换单独成 Phase
- [ ] 所有 Phase 具备独立审批入口

## 12. Approval Request
请先审批本总路线图，再从 Phase 2 开始逐阶段推进。
