# Plan: Phase 9 - DApp Promotion MVP

## 1. Objective
实现推广阶段 DApp 最小闭环：连接钱包、签到、待挂树处理、团队数据、奖励查询、NFT 页面、claim 页面。

## 2. Scope
- 钱包连接与网络校验
- Check-in 页面
- Dashboard：累计签到、AURA 内部账本、门票、NFT 状态
- Team 页面：邀请关系、左右区 / 小区数据、待挂树列表、可挂点选择
- Lottery / Ranking 页面：本周资格、历史结果
- NFT 页面：购买型购买、推广型资格进度、签名 mint
- Claim 页面：weekly claim / NFT 补贴 claim
- hooks / adapters / UI 分层

## 3. Out of Scope
- 发行后交易页
- DEX 交易税展示
- 治理页
- 复杂团队树图形化
- 完整团队树渲染 read model 后端补建
- 自动 spillover / 自动寻位 / 自动换边

## 4. Assumptions
- `Phase9.0-Dapp-Baseline-Rebuild` 已先完成，`apps/dapp` 已脱离旧套利/理财壳子并恢复 `lint / typecheck / build` 基线
- server API 和合约接口已基本稳定
- UI 只消费 API / hooks / adapters，不自定义业务规则
- 首期可以先做实用型页面，再做视觉优化
- `Phase3.1` 已提供：
  - `GET /referral/pending-placement`
  - `GET /tree/placement/selectable-slots`
  - `POST /tree/placement/bind`
- 第一版挂树体验允许基于“待挂树列表 + 可挂点列表”完成，不要求后端先提供完整团队树 read model

## 5. Current State
- dapp 工程已存在
- `Phase9.0` 完成前，dapp 仍含旧业务页面和失效 shared 依赖，不能直接作为推广页面实现基座
- server 已有 inviter 代挂树、待挂树列表、可挂点查询能力，但 dapp 还未消费

## 6. Target State
- 用户可以完整跑通推广阶段主要路径
- inviter 可以处理直接推荐注册后的待挂树队列，并为其选择合法挂点
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
- DApp 需要自己把“待挂树列表 + 可挂点列表”组织成可操作体验，若交互设计过重会反向逼出不必要的后端 read model
- 当前可挂点接口按 inviter 子树读取构造，用户规模上升后可能需要分页、层序窗口化或只展示前 N 层候选位

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

### Milestone 2 — Check-in / dashboard / team / pending-placement views
**Goal**
- 完成签到、累计数据、团队摘要、待挂树处理展示

**Affected files/modules**
- `apps/dapp/src/app/(promotion)/*`
- `apps/dapp/src/components/*`
- `apps/dapp/src/hooks/*`

**Implementation notes**
- 优先展示准确数据，不先追求图形化树图
- Team 页面第一版至少应支持：
  - inviter 查看待挂树成员列表
  - 选择某个待挂树成员
  - 拉取并展示可挂点列表
  - 确认 `parentId + teamPosition` 完成挂树
- 如后端仍未提供完整团队树 read model，UI 以列表、层级路径、父节点标签等轻量方式表达，不阻塞主流程

**Risks**
- optimistic UI 与 server 状态不一致
- 待挂树交互若试图一次性渲染全树，复杂度和性能都会失控

**Verification**
- commands:
  - `pnpm --filter dapp test`
- expected result:
  - check-in / dashboard / team / pending-placement 核心路径可演示

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
- [ ] inviter 可查看待挂树列表并完成挂树
- [ ] NFT 购买与签名 mint 页面可用
- [ ] Claim 与补贴页面可用
- [ ] UI 未直接实现复杂业务规则

## 12. Approval Request
请在 `Phase9.0-Dapp-Baseline-Rebuild` 完成后审批 Phase 9；通过后进入推广阶段 DApp MVP 实现。
