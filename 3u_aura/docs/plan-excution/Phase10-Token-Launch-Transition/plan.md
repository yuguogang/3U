# Plan: Phase 10 - Token Launch Transition, Genesis Claim & Promotion Shutdown

## 1. Objective
实现 AURA 上线前后的状态切换：发行前内部账本汇总成发行总 claim，推广奖励永久停止，系统进入纯交易/分红阶段。

## 2. Scope
- TokenGenesisRoot / TokenGenesisLeaf 生成
- 发行总 claim 数据管道
- 推广阶段功能停用开关
- 停止签到、推荐奖励、安慰奖、抽奖、排名、NFT 周补贴
- 推广型 NFT 签名 mint 保持可用
- 切换前审计与 dry-run
- DApp 切换状态展示

## 3. Out of Scope
- DEX 税与烧池实现
- 交易页
- 治理权

## 4. Assumptions
- 所有发行前 AURA 奖励通过内部账本汇总
- 推广型 NFT 在发行后仍可按资格签名 mint
- weekly USDT 类奖励与 NFT 周补贴在发行后永久停止

## 5. Current State
- 前序阶段将产生日常账本、weekly reward 与 NFT 状态
- 尚无 genesis claim root 生成与状态切换流程

## 6. Target State
- 上线前可生成并验证发行总 claim
- 一键切换后，推广逻辑不可继续产生新奖励
- DApp 与 server 对当前阶段判断一致

## 7. Architecture Impact
- `apps/server/src/modules/genesis-claim/*`
- `apps/server/src/modules/config/*`
- `apps/dapp/src/app/*`
- `apps/contracts/*`（如需 AURA claim 对接）
- `packages/common/*`

## 8. Risks
- 切换后仍继续记账
- genesis claim 汇总遗漏或重复
- DApp 阶段判断与 server 配置不一致
- 切换不可回滚

## 9. Milestones

### Milestone 1 — Genesis aggregation pipeline
**Goal**
- 将所有发行前 AURA 账本汇总为 TokenGenesisRoot / Leaf

**Affected files/modules**
- `apps/server/src/modules/genesis-claim/*`
- `apps/server/src/modules/ledger/*`

**Implementation notes**
- 必须保留可复算的快照时间点

**Risks**
- 漏算 / 重算重复

**Verification**
- commands:
  - `pnpm --filter server test -- genesis-claim`
- expected result:
  - 汇总金额与 ledger 总额一致，可生成 leaf 数据

**Approval checkpoint**
- yes

### Milestone 2 — Promotion shutdown guards
**Goal**
- 用 config / feature flag 停止签到、推荐、抽奖、排名、周补贴

**Affected files/modules**
- `apps/server/src/modules/config/*`
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/lottery/*`
- `apps/server/src/modules/rewards/*`
- `apps/server/src/modules/settlement/*`

**Implementation notes**
- 所有高风险入口统一检查 phase status

**Risks**
- 部分入口遗漏

**Verification**
- commands:
  - `pnpm --filter server test -- phase-gates`
- expected result:
  - 发行后被停用的入口全部拒绝新奖励产生

**Approval checkpoint**
- yes

### Milestone 3 — Transition UX and operator checklist
**Goal**
- 完成 DApp 阶段切换展示和 operator 执行清单

**Affected files/modules**
- `apps/dapp/src/app/*`
- `docs/plan-excution/*`

**Implementation notes**
- 必须给出上线前 checklist 与 dry-run 输出

**Risks**
- 运营误操作

**Verification**
- commands:
  - `pnpm --filter dapp build`
- expected result:
  - 用户端阶段状态与 server 一致，切换 checklist 可执行

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 切换前必须保留 final snapshot
- 正式切换前至少 dry-run 一次完整流程
- 切换后仅允许有限回滚窗口

## 11. Final Verification Checklist
- [ ] 发行前 ledger 可汇总成 genesis claim
- [ ] 停用的推广逻辑全部被 phase gate 阻断
- [ ] 推广型 NFT 签名 mint 边界已明确
- [ ] DApp 与 server 阶段判断一致
- [ ] 切换 operator checklist 完整

## 12. Approval Request
请审批 Phase 10 计划；通过后进入发行切换与推广逻辑停用实现。
