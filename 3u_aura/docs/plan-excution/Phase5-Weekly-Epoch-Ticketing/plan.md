# Plan: Phase 5 - Weekly Epoch, Ticketing & Rollover Rules

## 1. Objective
实现推广阶段每周周期、门票资格、连签 7 天规则、参与人数不足 12 人时滚入下周的机制。

## 2. Scope
- WeeklyEpoch 生命周期
- 启动后第 7 天首次开奖、之后每 7 天
- 连续签到 7 天 = 1 张门票
- 门票每周重置
- participants < 12 时不开奖并滚存
- BullMQ / cron 编排骨架

## 3. Out of Scope
- 抽奖奖金具体分桶
- 排名奖金计算
- Merkle root 发布
- 合约 claim

## 4. Assumptions
- 周期边界由 server 统一定义
- 时区必须固定并可配置
- 门票资格由 server 计算，不在链上判断

## 5. Current State
- 已有 WeeklyEpoch / LotteryTicket 模型
- 尚无 epoch scheduler 与门票生成逻辑

## 6. Target State
- 每周周期稳定创建与关闭
- 用户门票资格可重复计算
- 滚存规则成为周结算的前置输入

## 7. Architecture Impact
- `apps/server/src/modules/epoch/*`
- `apps/server/src/modules/lottery/*`
- `apps/server/src/queues/*`
- `packages/common/src/*`

## 8. Risks
- 周边界与时区错误
- 连签判定与日统计不一致
- 门票重置逻辑不明确
- epoch 重跑引发重复 ticket

## 9. Milestones

### Milestone 1 — Epoch scheduler and boundaries
**Goal**
- 定义周期创建、关闭、状态机与调度骨架

**Affected files/modules**
- `apps/server/src/modules/epoch/*`
- `apps/server/src/queues/*`

**Implementation notes**
- 先支持 dry-run 和人工触发，再接定时调度

**Risks**
- 调度时间边界问题

**Verification**
- commands:
  - `pnpm --filter server test -- epoch`
- expected result:
  - epoch 生命周期与周边界可验证

**Approval checkpoint**
- yes

### Milestone 2 — Ticket qualification engine
**Goal**
- 实现 7 天连签门票资格与每周重置逻辑

**Affected files/modules**
- `apps/server/src/modules/lottery/*`
- `apps/server/src/modules/stats/*`

**Implementation notes**
- ticketCount 先按规范保持 1 张
- 门票资格与 streak 历史必须可解释

**Risks**
- 首次开奖周与后续周口径不同

**Verification**
- commands:
  - `pnpm --filter server test -- lottery-ticket`
- expected result:
  - 7 天连签生成 1 张票，不满足条件则无票

**Approval checkpoint**
- yes

### Milestone 3 — Rollover preparation
**Goal**
- participants < 12 时将门票与奖池滚存至下周的前置状态处理

**Affected files/modules**
- `apps/server/src/modules/epoch/*`
- `apps/server/src/modules/lottery/*`
- `apps/server/src/modules/stats/*`

**Implementation notes**
- 本 Phase 只建立 rollover 状态，不做开奖分配

**Risks**
- 滚存池与原周池口径不一致

**Verification**
- commands:
  - `pnpm --filter server test -- rollover`
- expected result:
  - 不满足开奖门槛时可正确进入 rollover 状态

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 周期关闭前允许 dry-run 检查
- ticket 生成与 rollover 必须可重算

## 11. Final Verification Checklist
- [ ] 启动后第 7 天开始首次开奖
- [ ] 每 7 天一个周期
- [ ] 连签 7 天 = 1 张门票
- [ ] 门票每周重置
- [ ] 参与人数不足 12 时滚入下周

## 12. Approval Request
请审批 Phase 5 计划；通过后进入周期与门票规则实现。
