# Plan: Phase 12 - Ops, QA, Security Review & Release Gates

## 1. Objective
在业务实现完成后，补齐联调、回归、运维脚本、安全检查和发布门禁。

## 2. Scope
- 端到端联调清单
- server / contracts / dapp 回归矩阵
- golden sample / fixture 固化
- operator runbook
- 风险清单与人工 review 点
- 发布前 gate

## 3. Out of Scope
- 新功能开发
- 新协议规则引入

## 4. Assumptions
- 主要业务路径已实现
- 各 Phase 的 execution 记录齐全

## 5. Current State
- 需要在前序 Phase 完成后统一收口

## 6. Target State
- 有清晰的发布前 checklist
- 有可重复执行的验证命令
- 有高风险路径的人审清单

## 7. Architecture Impact
- 全仓库
- `docs/plan-excution/*`
- CI / scripts / test fixtures

## 8. Risks
- 关键路径未回归
- 文档与代码不一致
- 运营脚本不可重复
- 审计样例缺失

## 9. Milestones

### Milestone 1 — Cross-app verification matrix
**Goal**
- 建立 server / contracts / dapp 的跨层验证矩阵

**Affected files/modules**
- `docs/plan-excution/*`
- `scripts/*`
- `tests/*`

**Implementation notes**
- 优先列出资金与资格相关路径

**Risks**
- 漏掉跨层漂移问题

**Verification**
- commands:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
- expected result:
  - 形成统一矩阵与基线结果

**Approval checkpoint**
- yes

### Milestone 2 — Operator runbook and emergency procedures
**Goal**
- 建立 operator 执行手册、回滚策略、异常处理 SOP

**Affected files/modules**
- `docs/*`
- `scripts/*`

**Implementation notes**
- 覆盖：补单、rollover、root publish、launch transition

**Risks**
- 运营手工操作不可追踪

**Verification**
- commands:
  - 手工演练脚本与 dry-run 清单
- expected result:
  - 运维动作具备可执行 SOP

**Approval checkpoint**
- yes

### Milestone 3 — Release gates and security checklist
**Goal**
- 定义发布门禁与关键安全检查清单

**Affected files/modules**
- `docs/*`
- `CI / scripts`

**Implementation notes**
- 合约、资金、签名、Merkle、phase gate 都要入表

**Risks**
- 发布前缺少硬 gate

**Verification**
- commands:
  - `pnpm build`
  - `forge test`
- expected result:
  - 发布门禁可被逐项勾选并执行

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- release 前保留 freeze 窗口
- 任何 skip 项必须写明原因与补救方案

## 11. Final Verification Checklist
- [ ] 全仓 lint / typecheck / test / build 可跑
- [ ] operator runbook 完整
- [ ] emergency procedure 明确
- [ ] release gates 与 security checklist 完整
- [ ] 各 Phase execution 记录齐全

## 12. Approval Request
请审批 Phase 12 计划；通过后进入统一 QA、运维与发布门禁整理。
