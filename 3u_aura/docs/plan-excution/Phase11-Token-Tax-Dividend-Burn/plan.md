# Plan: Phase 11 - Token Tax, Dividend Settlement & Burn Pool

## 1. Objective
实现发行后阶段的 AURA Token 税逻辑、NFT 分红、回购/销毁、全局熔断与定时烧池逻辑，并与 launch-ready token baseline 对齐。

## 2. Scope
- launch-ready AURA Token 税逻辑与交易边界
- 仅对 DEX Pair 生效的买/卖各 3.5% 税
- 明确区分 AURA 腿与 USDT 腿的税路由
- USDT 腿：60% NFT 分红，40% 回购销毁
- AURA 腿：直接销毁；触发熔断后改入 DAO / 生态池
- 烧池子：每小时 0.25%，全局熔断后停止并改走 fallback
- 外部触发器接口（Gelato / Keeper）
- mixed-asset 路由所需的 router / operator / admin-console 边界
- server / dapp 状态与查询对接

## 3. Out of Scope
- 治理权
- 复杂做市策略
- 多链扩展

## 4. Assumptions
- 交易税不应误伤普通转账
- 烧池由外部定时调用，不在用户交易中触发
- 分红只在发行后启用
- 购买型与推广型 NFT 都参与交易税分红
- `< 1000 万` 的全局熔断同时作用于直接销毁、回购销毁和烧池
- Phase 10 最终 cutover 前需已有 launch-ready token / claim interface 基线
- mixed-asset 路由不必全部塞进 ERC20 transfer hook，可由 router / operator 配合完成

## 5. Current State
- 需要与 Phase 10 联合冻结上线接口
- 尚无完整的 tax / dividend / burn / fallback 实现

## 6. Target State
- 代币上 DEX 后，买卖税与分红结算按规范执行
- 普通转账免税
- 烧池与回购销毁具备可验证行为
- 熔断触发后可停止销毁并将资产导向 DAO / 生态池

## 7. Architecture Impact
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/src/Settlement.sol`（如需扩展）
- `apps/contracts/test/*`
- `apps/server/*`
- `apps/dapp/*`

## 8. Risks
- 税逻辑误伤普通转账
- pair / liquidity add-remove 边界错误
- burnPool 调度设计不安全
- 税与分红的资金路由不清晰
- AURA / USDT 两条资产腿处理混淆
- 熔断后 fallback 未生效导致供应下限失守

## 9. Milestones

### Milestone 1 — Tax gating, pair rules and launch-ready baseline
**Goal**
- 实现仅对 DEX Pair 生效的税逻辑，并冻结供 Phase 10 使用的 launch-ready token baseline

**Affected files/modules**
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/test/AURAToken*`

**Implementation notes**
- 明确 pair whitelist / exclusion 规则
- 普通 wallet-to-wallet 转账必须免税
- 与 Phase 10 共用的接口和事件在此 milestone 内冻结

**Risks**
- pair 检测错误
- cutover 前接口仍漂移

**Verification**
- commands:
  - `forge test --match-path test/AURAToken*`
- expected result:
  - 买卖有税，普通转账无税，边界场景测试通过
  - launch-ready token baseline 可供 Phase 10 回归

**Approval checkpoint**
- yes

### Milestone 2 — Mixed-asset routing, dividend split and DAO fallback
**Goal**
- 实现 USDT 腿 60% 分红 / 40% 回购销毁，以及 AURA 腿直接销毁 / 熔断 fallback 的路由

**Affected files/modules**
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/src/Settlement.sol`
- `apps/contracts/test/*`
- `apps/server/*`（如需 operator / admin-console 配合）

**Implementation notes**
- 与 NFT 分红结算的接口边界要清晰
- 明确哪些资产流由 token 处理，哪些由 router / operator / admin-console 处理
- 熔断后必须把待销毁资产改路由到 DAO / 生态池，而不是静默丢弃

**Risks**
- 路由比例错误或无法审计
- AURA / USDT 资产腿职责不清

**Verification**
- commands:
  - `forge test --match-path test/Dividend*`
- expected result:
  - USDT 腿 60% / 40% 分流正确
  - AURA 腿销毁与 DAO fallback 规则可验证

**Approval checkpoint**
- yes

### Milestone 3 — Burn pool scheduler and global circuit breaker
**Goal**
- 实现 burnPool 与外部 keeper 触发接口，并让其服从全局熔断规则

**Affected files/modules**
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/test/BurnPool*`
- `apps/server/*`（如需要运维接口）

**Implementation notes**
- 不在用户 transfer 中触发 burnPool
- 低于阈值后 burnPool 必须停止，并与其他销毁路径共用 fallback 规则

**Risks**
- 调度不触发或过度触发
- 全局熔断只覆盖部分销毁路径

**Verification**
- commands:
  - `forge test --match-path test/BurnPool*`
- expected result:
  - 每小时 0.25%，低于阈值停止并走 fallback 的逻辑正确

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 上 DEX 前需至少完成完整 fork 测试
- 税与烧池逻辑变更需要单独审计检查
- mixed-asset 路由职责变更时，必须同步更新 operator / admin-console 文档

## 11. Final Verification Checklist
- [ ] 普通转账免税
- [ ] 买卖各 3.5% 税
- [ ] USDT 腿 60% 分红 / 40% 回购销毁正确
- [ ] AURA 腿销毁与 DAO fallback 正确
- [ ] burnPool 定时逻辑与全局熔断正确
- [ ] 发行后分红流程与 NFT 持仓口径一致

## 12. Approval Request
请审批 Phase 11 计划；该 Phase 应与 Phase 10 联合评审，以先冻结 launch-ready token baseline，再进入上线后税逻辑实现。
