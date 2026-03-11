# Plan: Phase 2 - Check-in Accounting, Idempotency & Pool Split

## 1. Objective
实现推广阶段的签到主闭环：支付 3 USDT，写入 PaymentReceipt、Checkin、AuraLedger，并稳定维护 Lottery/Treasury 的拆分口径。

## 2. Scope
- Check-in API contract
- 链上回执验证后的 transactional write path
- PaymentReceipt / Checkin / AuraLedger / UserDailyStat / UserProfile 累计
- 同天多次签到只记 1 天 streak，但交易量和 AURA 累计
- 每笔签到的 30% / 70% 资金池拆分事实记录
- 幂等、补单、审计日志

## 3. Out of Scope
- 推荐树上卷
- 直推/间推奖励
- 周门票 / 抽奖 / 排名
- NFT 资格与签名
- 发行总 claim

## 4. Assumptions
- DApp 负责发起钱包授权与支付
- server 在事务外做链上确认，在事务内落库
- 所有资金/奖励写入必须有业务幂等键
- 池子拆分先做数据库事实记录，不在本 Phase 映射链上 Treasury

## 5. Current State
- 已有相关 Prisma 模型
- 尚无完整 check-in service orchestration
- 尚无补单脚本与重复请求保护

## 6. Target State
- 一次合法签到可完整落库
- 重试、重复提交、重复 tx 回执不会重复发奖励
- 池子拆分与内部账本记录一致，可支持后续周结算

## 7. Architecture Impact
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/payment/*`
- `apps/server/src/modules/ledger/*`
- `apps/server/src/modules/stats/*`
- `apps/server/src/modules/audit/*`
- `packages/common/src/*`

## 8. Risks
- 1000 AURA 重复记账
- streak 规则错误
- PaymentReceipt 与 Checkin 脱节
- transaction 中混入 RPC 调用

## 9. Milestones

### Milestone 1 — DTO / controller / service skeleton
**Goal**
- 定义请求与响应 schema，建立 check-in skeleton

**Affected files/modules**
- `apps/server/src/modules/checkin/*`
- `packages/common/src/*`

**Implementation notes**
- controller 只做 validation / auth / mapping
- business rule 放 engine / service

**Risks**
- DTO 过早耦合数据库细节

**Verification**
- commands:
  - `pnpm --filter server lint`
  - `pnpm --filter server typecheck`
- expected result:
  - 编译与类型通过

**Approval checkpoint**
- no

### Milestone 2 — Transactional write path
**Goal**
- 在单个 Prisma transaction 内写入 PaymentReceipt / Checkin / AuraLedger / 日统计与累计统计

**Affected files/modules**
- `apps/server/src/modules/checkin/services/*`
- `apps/server/src/modules/payment/services/*`
- `apps/server/src/modules/ledger/services/*`
- `apps/server/prisma/*`

**Implementation notes**
- 使用 txHashKey / business key 做幂等
- 事务外做验链，事务内只做状态与账本写入

**Risks**
- duplicate / retry path 难处理

**Verification**
- commands:
  - `pnpm --filter server test -- checkin`
- expected result:
  - happy path / duplicate / retry / rollback 全部通过

**Approval checkpoint**
- yes

### Milestone 3 — Pool split / audit / repair tools
**Goal**
- 实现 0.9U / 2.1U 的池子事实记录、审计日志、补单脚本

**Affected files/modules**
- `apps/server/src/modules/stats/*`
- `apps/server/src/modules/audit/*`
- `apps/server/scripts/*`

**Implementation notes**
- 补单脚本必须可重复执行并写 AdminAuditLog

**Risks**
- 后续周结算读取口径错误

**Verification**
- commands:
  - `pnpm --filter server test -- stats`
  - `pnpm --filter server test -- audit`
- expected result:
  - 池子拆分与签到金额对齐，可审计、可修复

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 所有写入按事务失败整体回滚
- 手工修复必须只通过脚本与审计表进行
- 任何重放风险都优先通过业务键封住

## 11. Final Verification Checklist
- [ ] 同天多签仅计 1 天 streak
- [ ] 交易量与 AURA 奖励可累计
- [ ] duplicate tx / retry request 不会重复发奖励
- [ ] 池子拆分记录与总金额一致
- [ ] 补单脚本具备幂等与审计

## 12. Approval Request
请审批 Phase 2 计划；通过后进入签到、支付回执、内部账本实现。
