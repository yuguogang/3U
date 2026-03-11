# Plan: Schema Model Alignment Hardening

## 1. Objective
在项目仍处于 model 阶段、尚未落地业务逻辑之前，修正 `apps/server/prisma/schema.prisma` 中已识别的高风险模型偏差，使数据模型与当前 spec / 已审批计划保持一致，并为后续实现提供更稳的审计与链上对齐基础。

## 2. Scope
- 修正推广型 NFT 资格阈值与字段语义
- 清理/收敛 AURA claim 路径，避免 `weekly merkle AURA` 与 `token genesis claim` 双轨并存
- 将自由字符串的支付用途改为 enum
- 强化 `WeeklyReward` / `MerkleLeaf` / `ClaimRecord` 的关系约束
- 统一金额字段建模策略，优先切到最小单位整数表示
- 同步 `packages/common` 中受影响的 enums / models
- 保持当前仅在 model 层变更，不引入 service / controller / contract 业务逻辑

## 3. Out of Scope
- Check-in / rewards / merkle / genesis claim 业务实现
- Prisma migration 以外的生产数据迁移策略
- 合约、DApp、索引器实现
- 排名、抽奖、签名服务的业务代码

## 4. Assumptions
- 当前仓库仅推进到 model 阶段，可以接受开发库 reset / 重新 generate client
- 金额字段改为最小单位整数是当前最稳妥方案
- USDT 采用其链上最小单位，AURA 采用 ERC20 最小单位；展示换算留给后续 service / adapter 处理
- 推广型 NFT 资格应对齐当前计划：`30` 次累计签到与 `6000U` 小区累计业绩
- 发行前 AURA 奖励统一汇总到 `TokenGenesisRoot / TokenGenesisLeaf`，不再保留额外的 weekly AURA merkle 路径

## 5. Current State
- `NftReferralEligibility` 默认阈值仍为旧值 `7 / 3000`
- `PaymentReceipt.purpose` 仍为自由字符串
- `WeeklyReward` 与 `MerkleLeaf` 缺少显式外键绑定
- 多个金额字段仍使用 `Decimal(30, 8)`
- `ClaimType.MERKLE_AURA` 与 `UserProfile.tokenLaunchClaimed` 仍保留旧语义

## 6. Target State
- NFT 资格阈值、claim 路径、支付用途、金额模型与当前 spec / plan 一致
- `WeeklyReward` / `MerkleLeaf` / `ClaimRecord` 的职责边界清晰，可审计、可回归
- schema 与 shared models 可通过校验、生成与构建

## 7. Architecture Impact
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/seed.ts`（如字段变更需要）
- `apps/server/prisma.config.ts`（如验证路径需要）
- `packages/common/src/enums/*`
- `packages/common/src/models/*`

## 8. Risks
- 金额字段切换为最小单位整数会带来广泛类型变更
- 清理旧 claim 语义时可能影响后续未实现模块的理解
- 关系约束收紧后，seed / future fixtures 可能需要同步更新
- 若 NFT 资格字段语义命名不清，后续签名服务仍可能误用

## 9. Milestones

### Milestone 1 — Threshold and enum alignment
**Goal**
- 对齐推广型 NFT 资格阈值，并将支付用途等核心业务字段 enum 化

**Affected files/modules**
- `apps/server/prisma/schema.prisma`
- `packages/common/src/enums/*`
- `packages/common/src/models/*`

**Implementation notes**
- 将 `NftReferralEligibility` 的默认阈值改为 `30 / 6000`
- 将资格字段命名调整到能准确表达“累计签到次数”语义
- 引入 `PaymentPurpose` enum，替代 `PaymentReceipt.purpose` 自由字符串
- 同步清理 shared models 中对应的 string 字段

**Risks**
- shared models 与 Prisma schema 不一致
- 后续 seed 仍写旧值

**Verification commands**
- `pnpm exec prisma validate --schema prisma/schema.prisma`
- `pnpm run db:generate`
- `pnpm --filter packages/common build`

**Expected outputs**
- schema 校验通过
- 新 enum 与字段语义在 Prisma / common 两侧一致

**Approval checkpoint**
- yes

### Milestone 2 — Amount model hardening
**Goal**
- 将高风险金额字段从 `Decimal(30, 8)` 切换为最小单位整数表示

**Affected files/modules**
- `apps/server/prisma/schema.prisma`
- `packages/common/src/models/*`

**Implementation notes**
- 统一采用 `BigInt` / 原子单位金额字段
- 在字段注释中明确该字段对应的资产和单位
- 优先覆盖 `Checkin`、`UserProfile`、`UserDailyStat`、`AuraLedger`、`WeeklyEpoch`、`WeeklyReward`、`ClaimRecord`、`NftHolding`、`NftReferralEligibility`、`MerkleLeaf`、`NftSubsidyClaim`、`TokenGenesisRoot/Leaf`
- 因项目尚无业务逻辑，可接受开发库 reset，不做复杂兼容层

**Risks**
- 改动面广，容易漏字段
- 后续 service 若假设 Decimal，会在实现时暴露问题

**Verification commands**
- `pnpm exec prisma validate --schema prisma/schema.prisma`
- `pnpm run db:generate`
- `pnpm --filter packages/common build`

**Expected outputs**
- 关键金额字段不再依赖低精度 decimal
- shared types 可表达最小单位金额

**Approval checkpoint**
- yes

### Milestone 3 — Reward, merkle, and genesis claim normalization
**Goal**
- 收敛 weekly reward、merkle leaf、claim record、token genesis claim 的关系边界

**Affected files/modules**
- `apps/server/prisma/schema.prisma`
- `packages/common/src/enums/*`
- `packages/common/src/models/*`

**Implementation notes**
- 为 `MerkleLeaf` 与 `WeeklyReward` 增加明确关联，避免双轨 leaf 元数据漂移
- 清理 `ClaimType.MERKLE_AURA` 这类与当前 plan 不一致的 claim 语义
- 重新评估 `UserProfile.tokenLaunchClaimed` 是否应由 `ClaimRecord` / `TokenGenesisLeaf` 派生，而不是单独布尔缓存
- 保留 `TokenGenesisRoot / TokenGenesisLeaf` 作为发行前 AURA 汇总 claim 的单一事实来源

**Risks**
- 关系设计过重，影响后续 dry-run / publish 流程
- 清理旧字段时遗漏 shared enums

**Verification commands**
- `pnpm exec prisma validate --schema prisma/schema.prisma`
- `pnpm run db:generate`
- `pnpm --filter packages/common build`

**Expected outputs**
- reward / leaf / claim / genesis 四者职责边界清晰
- 不再保留明显冲突的 claim 语义

**Approval checkpoint**
- yes

### Milestone 4 — Eligibility lifecycle simplification
**Goal**
- 让推广型 NFT 资格模型更贴近“累计资格 + 当前状态”的真实业务边界

**Affected files/modules**
- `apps/server/prisma/schema.prisma`
- `packages/common/src/models/*`

**Implementation notes**
- 评估将 `NftReferralEligibility` 从“按 epoch 唯一”调整为“按 user 唯一”
- 如需保留历史，使用显式 snapshot / history 字段，而不是把当前资格绑定到每个 epoch
- 确保“资格不因领取 NFT 被消耗”可在模型层被正确表达

**Risks**
- 过早设计历史模型，增加后续实现复杂度
- 若当前/历史职责不清，签名服务仍会产生歧义

**Verification commands**
- `pnpm exec prisma validate --schema prisma/schema.prisma`
- `pnpm run db:generate`

**Expected outputs**
- NFT 资格模型不再与 weekly epoch 产生错误耦合
- 当前状态与历史来源边界明确

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 本任务仅在 model 阶段推进；若变更过大，可整体回退到当前 schema 再重新分批调整
- 若金额模型切换导致影响面超预期，可先冻结在 milestone 1 / 3，不强行推进 milestone 2
- 如 `NftReferralEligibility` 生命周期设计在评审中仍存在争议，可拆出独立计划而不阻塞其余 schema 修正

## 11. Final Verification Checklist
- [ ] NFT 资格阈值与字段语义对齐当前 spec / plan
- [ ] 支付用途不再使用自由字符串
- [ ] 高风险金额字段已切到统一最小单位表示，或有明确保留理由
- [ ] `WeeklyReward` / `MerkleLeaf` / `ClaimRecord` 关系可审计
- [ ] 发行前 AURA claim 语义只保留一条主路径
- [ ] Prisma validate / generate 通过
- [ ] `packages/common` 构建通过

## 12. Approval Request
请审批该计划。通过后我将只修改 model / shared model 层，不引入任何业务逻辑，并按 milestone 顺序完成 schema 对齐与验证。
