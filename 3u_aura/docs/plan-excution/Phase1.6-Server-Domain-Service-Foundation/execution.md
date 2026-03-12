# Execution

## Status
Completed.

## Notes
- 审批后仅落地 server 业务层骨架、shared contract、DTO 和最小 smoke test，没有实现任何具体资金/奖励业务逻辑。
- 新增 `apps/server/src/modules/*` 业务模块骨架：
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
  - `shared`
- 新增 `apps/server/src/modules/aura-domain.module.ts`，并在 `app.module.ts` 中注册。
- 为后续 Phase 冻结了 `application service / domain engine / repository` 三层骨架；高风险 service 统一预留到：
  - `TransactionOrchestratorService`
  - `IdempotencySeamService`
  - `AuditSeamService`
- 在 `packages/common` 中新增推广阶段基础 contract：
  - `PromotionCheckinRequestSchema`
  - `ReferralBindInviterSchema`
  - `ReferralBindPlacementSchema`
  - `NftEligibilityQuerySchema`
  - `NftReferralSignatureRequestSchema`
  - `WeeklyEpochBoundaryQuerySchema`
- 新增共享 view/model：
  - `PromotionCheckinResult`
  - `ReferralPlacementView`
  - `NftEligibilityView`
  - `ReferralSignaturePreview`
  - `WeeklyEpochBoundaryView`
- 新增 `src/modules/aura-domain.module.spec.ts` 作为最小 smoke coverage，验证核心服务能被 Nest 容器正确装配。
- `Phase2` 到 `Phase5` 原计划中假定的 `apps/server/src/modules/*` 路径已落地，因此本次无需反向改动这些 phase 文档。

## Commands Run
- `mkdir -p apps/server/src/modules/shared/services apps/server/src/modules/checkin/{dto,engines,repositories,services} apps/server/src/modules/payment/{engines,repositories,services} apps/server/src/modules/ledger/{engines,repositories,services} apps/server/src/modules/stats/{engines,repositories,services} apps/server/src/modules/referral/{dto,engines,repositories,services} apps/server/src/modules/tree/{dto,engines,repositories,services} apps/server/src/modules/volume/{engines,repositories,services} apps/server/src/modules/rewards/{engines,repositories,services} apps/server/src/modules/epoch/{dto,engines,repositories,services} apps/server/src/modules/lottery/{engines,repositories,services} apps/server/src/modules/nft-eligibility/{dto,engines,repositories,services} apps/server/src/modules/signing/{engines,repositories,services} apps/server/src/modules/audit/{engines,repositories,services} packages/common/src/models packages/common/src/validators`
- `pnpm run build`
  - workdir: `packages/common`
- `pnpm run build`
  - workdir: `apps/server`
- `pnpm run test -- aura-domain.module.spec.ts`
  - workdir: `apps/server`
- `pnpm run test`
  - workdir: `apps/server`

## Verification Results
- `pnpm run build` in `packages/common`
  - Passed.
- `pnpm run build` in `apps/server`
  - Passed.
- `pnpm run test -- aura-domain.module.spec.ts` in `apps/server`
  - Passed.
- `pnpm run test` in `apps/server`
  - Passed. Current suite contains the new domain-module smoke test.

## Deviations From Plan
- Milestone 2 中的 shared contract 仅冻结了后续 phase 明确需要的最小 command / query / view 集合，没有提前扩展到完整 API surface。
  - Reason: 当前仍处于骨架阶段，过早定义完整 API 容易和真实业务实现脱节。
- repository 当前采用 placeholder class + method signature，而不是立即绑定 Prisma `DbService`。
  - Reason: 本阶段目标是先冻结聚合边界和目录结构，避免在无业务实现时把 repository 退化成 Prisma 透传层。
- audit 持久化仅保留 `AuditTrailService` / `AuditLogRepository` 落点，实际存储仍为 no-op。
  - Reason: schema 中尚未最终冻结审计表结构，不适合在本阶段伪造持久化模型。

## Follow-up Risks
- 目前的 application service 仍是占位实现，后续 phase 如果直接在 controller 写规则，就会绕开本次建立的边界。
- repository 尚未接入真实 Prisma 事务客户端；进入 `Phase2` 时需要首先把高风险写路径收口到 transaction seam 内。
- `packages/common` 里的 contract 目前只覆盖 promotion backend foundation 所需最小集合；后续进入周结算、Merkle、claim 时还需继续扩展，但应在对应 phase 内增量补充。
