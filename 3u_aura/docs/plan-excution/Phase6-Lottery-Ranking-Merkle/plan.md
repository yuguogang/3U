# Plan: Phase 6 - Lottery, Ranking, Consolation & Merkle Data Pipeline

## 1. Objective
实现每周抽奖、排名奖金、未中奖安慰奖，以及 WeeklyReward / MerkleLeaf / ClaimRecord 的生成管道。

## 2. Scope
- 抽奖 50% 中奖率：floor(participants / 2)
- 奖项结构：一/二/三等奖 + 幸运奖
- 未中奖用户 100 AURA 安慰奖
- 小区增量 >= 300U 的 weekly ranking
- 排名分配：1/2/3/4-10
- WeeklyReward / MerkleLeaf / ClaimRecord 草稿生成
- root dry-run / publish 前置流程

## 3. Out of Scope
- 链上 MerkleClaim 合约
- DApp claim 页
- 发行总 claim
- Token 税分红

## 4. Assumptions
- 本期抽奖先用 deterministic 方案便于复算
- 奖励结果由后端离线计算
- 只有推广阶段生效，发行后永久停止

## 5. Current State
- 已有 epoch / ticket / ranking 指标前置准备
- 尚无 payout engine 与 merkle builder

## 6. Target State
- 每周可稳定输出抽奖结果、排名结果、安慰奖账本与 claim 数据
- root 发布前支持 dry-run、复算与审计

## 7. Architecture Impact
- `apps/server/src/modules/lottery/*`
- `apps/server/src/modules/ranking/*`
- `apps/server/src/modules/merkle/*`
- `apps/server/src/modules/claims/*`
- `apps/server/src/queues/*`
- `packages/common/src/*`

## 8. Risks
- ranking 增量定义漂移
- 未中奖安慰奖重复发放
- Merkle 编码与合约不一致
- root publish 顺序不安全

## 9. Milestones

### Milestone 1 — Lottery payout engine
**Goal**
- 完成中奖人数、奖项分桶、幸运奖平分、安慰奖生成

**Affected files/modules**
- `apps/server/src/modules/lottery/engines/*`
- `apps/server/src/modules/ledger/*`

**Implementation notes**
- 先可复算，再考虑替换随机源
- 安慰奖通过 ledger sourceType 标记

**Risks**
- 中奖与未中奖集合边界错误

**Verification**
- commands:
  - `pnpm --filter server test -- lottery-engine`
- expected result:
  - n/2 中奖人数、奖项金额、安慰奖逻辑通过

**Approval checkpoint**
- yes

### Milestone 2 — Ranking payout engine
**Goal**
- 完成 weekly small-leg 增量门槛 300U 与 1/2/3/4-10 分配

**Affected files/modules**
- `apps/server/src/modules/ranking/*`
- `apps/server/src/modules/rewards/*`

**Implementation notes**
- 明确 tie-breaker 与不足 10 人时的分配策略
- distributionKey 保持稳定

**Risks**
- 并列排名口径不明确

**Verification**
- commands:
  - `pnpm --filter server test -- ranking`
- expected result:
  - 奖池比例与门槛判断可复算

**Approval checkpoint**
- yes

### Milestone 3 — Merkle draft / root publish pipeline
**Goal**
- 生成 WeeklyReward / MerkleLeaf / ClaimRecord 草稿，并支持 dry-run 与 publish 分离

**Affected files/modules**
- `apps/server/src/modules/merkle/*`
- `apps/server/src/modules/claims/*`
- `apps/server/src/queues/*`

**Implementation notes**
- 保留 golden sample，供合约测试复用
- root publish 前状态不应变为 claimable

**Risks**
- hash / encoding 漂移
- 重跑 job 造成重复奖励草稿

**Verification**
- commands:
  - `pnpm --filter server test -- merkle`
  - `pnpm --filter server test -- claims`
- expected result:
  - leaf / reward / claim 数据三者一致，dry-run / publish 有清晰状态边界

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- publish root 前允许清理草稿重算
- publish 后禁止静默修改 leaf 数据
- golden sample 需长期保留回归测试

## 11. Final Verification Checklist
- [ ] 中奖人数为 floor(n/2)
- [ ] participants < 12 时不开奖并滚存
- [ ] 未中奖用户获得 100 AURA 安慰奖
- [ ] weekly ranking 门槛与奖池比例正确
- [ ] Merkle 草稿与 reward / claim 数据一致

## 12. Approval Request
请审批 Phase 6 计划；通过后进入抽奖、排名与 Merkle 数据管道实现。
