# Plan: Phase 11 - Token Tax, Dividend Settlement & Burn Pool

## 1. Objective
实现发行后阶段的 AURA Token 交易税、NFT 分红、回购销毁与定时烧池逻辑。

## 2. Scope
- AURA Token ERC20 + mint cap
- 仅对 DEX Pair 生效的买/卖各 3.5% 税
- 60% 交易税进入 NFT 分红结算
- 40% 用于回购销毁
- 烧池子：每小时 0.25%，底池低于阈值停止
- 外部触发器接口（Gelato / Keeper）
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

## 5. Current State
- 发行切换完成后才可进入
- 尚无 AURA Token / tax / burn 实现

## 6. Target State
- 代币上 DEX 后，买卖税与分红结算按规范执行
- 普通转账免税
- 烧池与回购销毁具备可验证行为

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

## 9. Milestones

### Milestone 1 — Tax gating and transfer rules
**Goal**
- 实现仅对 DEX Pair 生效的税逻辑

**Affected files/modules**
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/test/AURAToken*`

**Implementation notes**
- 明确 pair whitelist / exclusion 规则
- 普通 wallet-to-wallet 转账必须免税

**Risks**
- pair 检测错误

**Verification**
- commands:
  - `forge test --match-path test/AURAToken*`
- expected result:
  - 买卖有税，普通转账无税，边界场景测试通过

**Approval checkpoint**
- yes

### Milestone 2 — Dividend routing and buyback/burn
**Goal**
- 实现 60% 分红 / 40% 回购销毁的资金路由

**Affected files/modules**
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/src/Settlement.sol`
- `apps/contracts/test/*`

**Implementation notes**
- 与 NFT 分红结算的接口边界要清晰

**Risks**
- 路由比例错误或无法审计

**Verification**
- commands:
  - `forge test --match-path test/Dividend*`
- expected result:
  - 税收分流比例与样例一致

**Approval checkpoint**
- yes

### Milestone 3 — Burn pool scheduler integration
**Goal**
- 实现 burnPool 与外部 keeper 触发接口

**Affected files/modules**
- `apps/contracts/src/AURAToken.sol`
- `apps/contracts/test/BurnPool*`
- `apps/server/*`（如需要运维接口）

**Implementation notes**
- 不在用户 transfer 中触发 burnPool

**Risks**
- 调度不触发或过度触发

**Verification**
- commands:
  - `forge test --match-path test/BurnPool*`
- expected result:
  - 每小时 0.25%，低于阈值停止的逻辑正确

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 上 DEX 前需至少完成完整 fork 测试
- 税与烧池逻辑变更需要单独审计检查

## 11. Final Verification Checklist
- [ ] 普通转账免税
- [ ] 买卖各 3.5% 税
- [ ] 60% 分红 / 40% 回购销毁正确
- [ ] burnPool 定时逻辑正确
- [ ] 发行后分红流程与 NFT 持仓口径一致

## 12. Approval Request
请审批 Phase 11 计划；通过后进入 Token 税、分红与烧池实现。
