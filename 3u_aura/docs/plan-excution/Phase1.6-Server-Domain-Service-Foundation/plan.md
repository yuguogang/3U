# Plan: Phase 1.6 - Server Domain & Service Foundation

## 1. Objective
在 `schema/model` 已稳定、`apps/server` 历史模块已清理的前提下，先建立后端业务层的统一骨架，为 `Phase2` 到 `Phase5` 的签到、推荐树、体量上卷、周周期与资格模块提供一致的 controller / application service / domain engine / repository 分层。

## 2. Scope
- 新建并注册 AURA 核心业务模块骨架：
  - `checkin`
  - `payment`
  - `ledger`
  - `stats`
  - `referral`
  - `tree`
  - `volume`
  - `rewards`
  - `epoch`
  - `lottery`
  - `nft-eligibility`
  - `signing`
  - `audit`
- 为高风险聚合定义 repository 边界与 Prisma adapter 落点
- 为主要命令/查询定义 shared contract 与 Zod schema 落点
- 冻结 service / engine / repository 的职责边界和目录约定
- 为后续 Phase 预留测试入口与 transaction orchestration seam

## 3. Out of Scope
- 不实现签到入账、推荐上卷、奖励发放、周结算、NFT 签名等具体业务规则
- 不新增 schema 变更或 migration
- 不实现 BullMQ job、cron 调度、链上 RPC 验证细节
- 不实现 contracts / dapp 侧逻辑
- 不引入与当前 phase 无关的横向基础设施重构

## 4. Assumptions
- 当前 `apps/server/prisma/schema.prisma` 已可作为持久化事实模型继续演进
- `AuthModule` / `UserModule` 保持现状，只作为后续业务模块的入口依赖
- API / shared model 的金额字段继续以原子单位字符串表达，对外转换留给后续 service / adapter
- controller 必须保持薄层；复杂规则必须进入 service / engine
- repository 层只负责 persistence，不承载业务策略
- 该前置任务完成后，`Phase2` 到 `Phase5` 可以直接在既定骨架内填充业务实现，而不是重新发明模块结构

## 5. Current State
- 当前 `apps/server/src` 只存在 `auth`、`user`、`db`、`configuration` 等基础骨架
- `Phase2` 到 `Phase5` 计划都已假定 `apps/server/src/modules/*` 存在，但代码中尚未落地
- `packages/common` 目前只有基础 enums / models / validators，尚未定义推广阶段核心命令/查询 contract
- 如果直接进入 `Phase2` 业务实现，后续 `Phase3` 到 `Phase5` 很容易出现目录、事务边界、DTO 来源不一致的问题

## 6. Target State
- `apps/server` 具备可编译的业务模块骨架与统一目录规范
- 每个高风险领域都明确分为：
  - controller：输入校验 / auth / response mapping
  - application service：事务编排与幂等入口
  - domain engine：纯业务计算与规则判定
  - repository / adapter：Prisma 读写与外部依赖封装
- `packages/common` 拥有后续 Phase 可复用的 command / query schema 落点
- 后续 Phase 开发可以直接围绕既定边界补业务，而不是边做边讨论结构

## 7. Architecture Impact
- `apps/server/src/app.module.ts`
- `apps/server/src/modules/*`
- `apps/server/src/modules/shared/*`（如 transaction / audit / idempotency seam 需要）
- `packages/common/src/validators/*`
- `packages/common/src/models/*`
- `packages/common/src/index.ts`

## 8. Risks
- 过度抽象，提前引入过多空接口，导致骨架大于价值
- 如果 shared contract 设计过深，会与未来真实 API 形态脱节
- repository 边界如果切得不清，后续 service 仍会直接操作 Prisma
- 若 transaction seam 定义含糊，后续高风险写路径仍可能把 RPC 混入事务
- 如果一次性铺太多模块，可能出现大量无测试、无调用的空文件

## 9. Milestones

### Milestone 1 — Module map and directory convention freeze
**Goal**
- 落地 AURA 后端业务模块骨架，并冻结统一目录约定

**Affected files/modules**
- `apps/server/src/app.module.ts`
- `apps/server/src/modules/*`

**Implementation notes**
- 每个业务域至少明确 `module.ts`、`index.ts`、`services/`、`engines/`、`repositories/`、`dto/` 的落点
- controller 仅在当前阶段确有入口需求时创建；不要为“可能会用”先堆控制器
- 统一采用 feature-sliced 目录，而不是按 `controllers/services/repositories` 横切全局大目录
- 为跨域共用能力单独收敛到 `modules/shared/*`，避免散落复制

**Risks**
- 模块过细导致依赖图难维护
- 目录规范未冻结，后续 phase 仍会漂移

**Verification commands**
- `pnpm run build`
  - workdir: `apps/server`

**Expected outputs**
- `apps/server` 可以在新增模块骨架后继续通过编译
- 新模块结构与 `Phase2` 到 `Phase5` 的计划命名一致

**Approval checkpoint**
- yes

### Milestone 2 — Shared contracts and repository boundary definition
**Goal**
- 定义推广阶段主要 command / query schema 与 repository 边界，避免 DTO 和 Prisma 类型在各模块中散落复制

**Affected files/modules**
- `packages/common/src/validators/*`
- `packages/common/src/models/*`
- `packages/common/src/index.ts`
- `apps/server/src/modules/*/repositories/*`
- `apps/server/src/modules/*/dto/*`

**Implementation notes**
- 只定义后续 phase 明确会用到的 contract：
  - check-in request / result
  - inviter / placement bind
  - NFT eligibility query / signer input
  - weekly epoch boundary query
- repository 先定义“聚合读写入口”，不要把 Prisma 的每张表方法简单包一层
- shared contract 与 server DTO 的关系应清晰：shared 负责跨层契约，server DTO 只负责 Nest request mapping

**Risks**
- shared types 和 server DTO 发生重复定义
- repository 设计过于贴表，失去聚合边界意义

**Verification commands**
- `pnpm run build`
  - workdir: `packages/common`
- `pnpm run build`
  - workdir: `apps/server`

**Expected outputs**
- `packages/common` 对推广阶段基础 contract 有明确承载位置
- `apps/server` 内部不再需要直接把 Prisma 类型当成外部 API 契约

**Approval checkpoint**
- yes

### Milestone 3 — Application service and domain engine seams
**Goal**
- 为高风险流程建立 application service 与 domain engine 的职责边界，以及统一的 transaction / idempotency 入口约定

**Affected files/modules**
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/referral/*`
- `apps/server/src/modules/volume/*`
- `apps/server/src/modules/epoch/*`
- `apps/server/src/modules/nft-eligibility/*`
- `apps/server/src/modules/shared/*`

**Implementation notes**
- application service 负责：
  - 事务编排
  - 幂等键检查
  - repository 调用顺序
  - 审计落点
- domain engine 负责：
  - streak 口径
  - placement rule
  - small-leg / weekly increment 计算输入输出
  - NFT 资格判定输入输出
- 明确“事务外做 RPC / 验链，事务内只做持久化”的接口边界
- 本阶段可使用 placeholder / `NotImplemented` 方式冻结 seam，但不得偷偷塞真实业务规则

**Risks**
- service 和 engine 之间边界过虚，后续仍会被写成大泥球 service
- placeholder 过多而没有测试约束，导致结构失真

**Verification commands**
- `pnpm run build`
  - workdir: `apps/server`
- `pnpm run test`
  - workdir: `apps/server`

**Expected outputs**
- 高风险流程的 service / engine / transaction seam 已有可编译、可测试的落点
- 后续 Phase 可以直接在对应 seam 内增量实现业务逻辑

**Approval checkpoint**
- yes

### Milestone 4 — Test baseline and phase handoff constraints
**Goal**
- 建立最小测试基线与 handoff 规则，确保后续每个业务 phase 不会绕开既定架构边界

**Affected files/modules**
- `apps/server/test/*`
- `apps/server/src/modules/*`
- `docs/plan-excution/Phase2-Checkin-Accounting/plan.md`
- `docs/plan-excution/Phase3-Referral-Tree-Core/plan.md`
- `docs/plan-excution/Phase4-Volume-Propagation-Rewards/plan.md`
- `docs/plan-excution/Phase5-Weekly-Epoch-Ticketing/plan.md`

**Implementation notes**
- 增加 skeleton 级 smoke tests，验证模块注入、service 构造与 shared contract 导入正常
- 如本前置任务改变了 `Phase2` 到 `Phase5` 的目录假设，需要同步修正计划文档
- handoff 规则应明确：后续 phase 不得直接在 controller 内写业务，不得跳过 repository / engine 分层

**Risks**
- 只建目录不建测试，后续结构很快失控
- 计划与实际模块命名不同步

**Verification commands**
- `pnpm run test`
  - workdir: `apps/server`
- `pnpm run build`
  - workdir: `apps/server`

**Expected outputs**
- 模块骨架至少具备最小 smoke coverage
- `Phase2` 到 `Phase5` 计划与真实代码结构重新对齐

**Approval checkpoint**
- yes

## 10. Approval Checkpoint
这是一个 `Major / Critical` 前置任务：它不直接发钱，但会决定后续所有高风险写路径落在哪些 service / engine / repository 边界里。必须先审批本计划，再进入实现。

## 11. Rollback / Recovery Notes
- 如果 Milestone 1 后发现模块切分过细，可在不改 schema 的前提下回收模块并合并目录
- 如果 shared contract 设计与真实 phase 需求偏差过大，可只保留 validator/model 落点，不强行保留过深的 command abstraction
- 如果 `pnpm run test` 因仓库基线不足无法稳定通过，可在 execution 中明确记录，先以 build + targeted smoke test 作为阶段出口
- 若某个业务域在实现期证明确实不需要独立 module，可在后续 phase 审批时重新合并，但必须同步更新计划文档

## 12. Final Verification Checklist
- [ ] `apps/server/src/modules/*` 业务骨架已建立且命名统一
- [ ] controller / service / engine / repository 边界已明确
- [ ] `packages/common` 已有推广阶段基础 contract 落点
- [ ] transaction / idempotency seam 已预留，不要求在 controller 内处理高风险流程
- [ ] `apps/server` build 通过
- [ ] `apps/server` test 通过，或 execution 中有明确的基线说明
- [ ] `Phase2` 到 `Phase5` 的目录假设与实际代码一致

## 13. Approval Request
请审批该前置计划。通过后我会先实现后端业务层骨架与 shared contract 基线，再进入 `Phase2` 到 `Phase5` 的具体业务逻辑。
