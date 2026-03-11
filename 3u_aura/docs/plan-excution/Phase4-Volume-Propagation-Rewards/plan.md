# Plan: Phase 4 - Volume Propagation, Referral Rewards & Qualification Metrics

## 1. Objective
实现签到后的体量上卷、左右区 / 小区统计，以及直推 10%、间推 5% 的内部账本奖励，并输出周排名与 NFT 资格所需指标。

## 2. Scope
- 签到后 volume propagation
- left/right volume、small-leg volume 计算
- direct / indirect referral reward ledger
- UserDailyStat / UserProfile 累计更新
- NFT 资格指标：累计签到、small-leg volume
- 推广型 NFT 资格查询接口与 EIP712 signer payload 边界
- 周排名所需周增量口径准备

## 3. Out of Scope
- 周门票、开奖与 Merkle 数据生成
- NFT 合约
- DApp 团队图展示
- Token 上线后的逻辑

## 4. Assumptions
- 直推 10%、间推 5% 全部记入内部账本
- 小区 volume 定义为左右区较小者
- 每次签到的 volume 都参与上卷
- 资格条件读取的是累计指标，不因领取 NFT 被消耗

## 5. Current State
- Check-in 写路径与树结构完成后即可承接
- 尚无上卷算法与奖励账本引擎
- 尚无周增量快照逻辑

## 6. Target State
- 每次签到完成后，上级链路的左右区、小区、直推/间推奖励同步更新
- 周结算可以直接消费这些统计结果
- 合约与 DApp 可以消费稳定的 NFT 资格查询与签名服务契约

## 7. Architecture Impact
- `apps/server/src/modules/volume/*`
- `apps/server/src/modules/rewards/*`
- `apps/server/src/modules/stats/*`
- `apps/server/src/modules/nft-eligibility/*`
- `apps/server/src/modules/signing/*`
- `packages/common/src/*`

## 8. Risks
- 奖励重复发放
- 上卷算法与树路径不一致
- small-leg 口径错误影响 NFT 与排名
- 日统计与累计统计不一致
- signer payload 与合约验签口径漂移

## 9. Milestones

### Milestone 1 — Propagation engine
**Goal**
- 实现基于 closure / ancestor chain 的体量上卷引擎

**Affected files/modules**
- `apps/server/src/modules/volume/engines/*`
- `apps/server/src/modules/tree/*`

**Implementation notes**
- 优先 deterministic、可复算，不追求过早优化
- 保留 dry-run / explain 能力便于排错

**Risks**
- 大链路上卷的边界条件多

**Verification**
- commands:
  - `pnpm --filter server test -- volume`
- expected result:
  - ancestors 的左右区 / 小区结果符合样例

**Approval checkpoint**
- yes

### Milestone 2 — Referral reward ledger
**Goal**
- 实现 direct / indirect AURA 奖励写入与幂等保护

**Affected files/modules**
- `apps/server/src/modules/rewards/*`
- `apps/server/src/modules/ledger/*`

**Implementation notes**
- 使用 sourceRefId + sourceRefType 保护一次签到只产出一组推荐奖励

**Risks**
- 补单 / 重算导致重复奖励

**Verification**
- commands:
  - `pnpm --filter server test -- referral-rewards`
- expected result:
  - 直推/间推账本金额与示例对齐，重试不重复记账

**Approval checkpoint**
- yes

### Milestone 3 — Qualification snapshots and signer service contract
**Goal**
- 输出 NFT 资格和 weekly ranking 所需累计/增量指标，并冻结推广型 NFT 的签名服务契约

**Affected files/modules**
- `apps/server/src/modules/stats/*`
- `apps/server/src/modules/nft-eligibility/*`
- `apps/server/src/modules/signing/*`
- `packages/common/src/*`

**Implementation notes**
- signer service 只对已满足资格的地址签发 payload
- 提前冻结 `user / nonce / chainId / expiry` 等 payload 字段
- 资格查询与签名 payload 必须保留 dry-run / explain 能力

**Risks**
- 周增量快照口径不明导致后续 ranking 返工
- 资格口径与 signer service 脱节导致链上 mint 失败

**Verification**
- commands:
  - `pnpm --filter server test -- qualification`
  - `pnpm --filter server test -- nft-signature`
- expected result:
  - 30 次签到 / 6000U / weekly small-leg 增量指标可稳定查询
  - signer payload 稳定、重放保护边界明确

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 奖励与体量更新优先保持来源可追溯
- 任何 correction 都必须通过补偿式写入或审计脚本完成

## 11. Final Verification Checklist
- [ ] 左右区 / 小区体量口径正确
- [ ] 直推 10%、间推 5% 记账正确
- [ ] 重算 / 重试不会重复记账
- [ ] NFT 资格指标与排名指标可直接查询
- [ ] NFT 签名 payload 与资格服务边界已冻结
- [ ] 统计结果与样例用例一致

## 12. Approval Request
请审批 Phase 4 计划；通过后进入上卷体量与推荐奖励实现。
