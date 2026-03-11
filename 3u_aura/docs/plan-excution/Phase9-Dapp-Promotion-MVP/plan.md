# Plan: Phase 9 - DApp Promotion MVP

## 1. Objective
实现推广阶段 DApp 最小闭环：连接钱包、签到、团队数据、奖励查询、NFT 页面、claim 页面。

## 2. Scope
- 钱包连接与网络校验
- Check-in 页面
- Dashboard：累计签到、AURA 内部账本、门票、NFT 状态
- Team 页面：邀请关系、左右区 / 小区数据
- Lottery / Ranking 页面：本周资格、历史结果
- NFT 页面：购买型购买、推广型资格进度、签名 mint
- Claim 页面：weekly claim / NFT 补贴 claim
- hooks / adapters / UI 分层

## 3. Out of Scope
- 发行后交易页
- DEX 交易税展示
- 治理页
- 复杂团队树图形化

## 4. Assumptions
- server API 和合约接口已基本稳定
- UI 只消费 API / hooks / adapters，不自定义业务规则
- 首期可以先做实用型页面，再做视觉优化

## 5. Current State
- dapp 工程已存在
- 尚未有推广阶段核心页面

## 6. Target State
- 用户可以完整跑通推广阶段主要路径
- 页面结构清晰，业务逻辑不混在 UI 中
- 关键 hooks 可测试

## 7. Architecture Impact
- `apps/dapp/src/app/*`
- `apps/dapp/src/components/*`
- `apps/dapp/src/hooks/*`
- `apps/dapp/src/services/*`
- `packages/common/*`

## 8. Risks
- UI 直接拼合约参数
- use client 滥用
- 页面状态与 server 事实来源不一致
- 同时接 server 与 contract 时边界混乱

## 9. Milestones

### Milestone 1 — App shell / wallet / shared adapters
**Goal**
- 建立页面骨架、钱包连接、network guard、shared client adapters

**Affected files/modules**
- `apps/dapp/src/app/*`
- `apps/dapp/src/hooks/*`
- `apps/dapp/src/services/*`

**Implementation notes**
- 先把 hooks / services 定型，再接 UI

**Risks**
- adapter 层过薄，导致 UI 直接处理业务细节

**Verification**
- commands:
  - `pnpm --filter dapp lint`
  - `pnpm --filter dapp typecheck`
- expected result:
  - 基础壳子与 wallet path 可用

**Approval checkpoint**
- yes

### Milestone 2 — Check-in / dashboard / team views
**Goal**
- 完成签到、累计数据、团队摘要展示

**Affected files/modules**
- `apps/dapp/src/app/(promotion)/*`
- `apps/dapp/src/components/*`
- `apps/dapp/src/hooks/*`

**Implementation notes**
- 优先展示准确数据，不先追求图形化树图

**Risks**
- optimistic UI 与 server 状态不一致

**Verification**
- commands:
  - `pnpm --filter dapp test`
- expected result:
  - check-in / dashboard / team 核心路径可演示

**Approval checkpoint**
- yes

### Milestone 3 — NFT / claim / weekly reward views
**Goal**
- 完成 NFT 购买、资格进度、签名 mint、weekly claim、补贴 claim 页面

**Affected files/modules**
- `apps/dapp/src/app/(promotion)/*`
- `apps/dapp/src/services/contracts/*`
- `apps/dapp/src/hooks/*`

**Implementation notes**
- 签名 mint 与 Merkle claim 的准备数据尽量从 server 获取

**Risks**
- 同时处理 server 数据与链上交易状态较复杂

**Verification**
- commands:
  - `pnpm --filter dapp test`
  - `pnpm --filter dapp build`
- expected result:
  - 推广阶段核心页面可构建并可手动联调

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- UI 改动优先保持 adapter / hook 边界稳定
- 页面未完成时可通过 feature flag 隐藏入口

## 11. Final Verification Checklist
- [ ] 钱包连接与网络校验正常
- [ ] Check-in / Dashboard / Team 页面可用
- [ ] NFT 购买与签名 mint 页面可用
- [ ] Claim 与补贴页面可用
- [ ] UI 未直接实现复杂业务规则

## 12. Approval Request
请审批 Phase 9 计划；通过后进入推广阶段 DApp MVP 实现。
