# Execution

## Status
Completed.

## Notes
- 审批后仅修改了 model / shared model 层：
  - `apps/server/prisma/schema.prisma`
  - `apps/server/prisma/seed.ts`
  - `apps/server/prisma/migrations/20260311_schema_model_alignment_hardening/migration.sql`
  - `apps/server/prisma/migrations/migration_lock.toml`
  - `packages/common/src/enums/aura.ts`
  - `packages/common/src/models/aura.ts`
- 关键变更：
  - 推广型 NFT 资格阈值改为 `30` 次累计签到 + `6000 USDT`
  - `PaymentReceipt.purpose` 改为 `PaymentPurpose` enum
  - 清理 `ClaimType.MERKLE_AURA` 与 `UserProfile.tokenLaunchClaimed`
  - `WeeklyReward` 与 `MerkleLeaf` 增加明确一对一关系
  - 金额字段统一改为原子单位整数语义的 `Decimal(78,0)`
  - `NftReferralEligibility` 改为按 `userId` 唯一，使用 `snapshotEpochId` 记录最近评估来源
  - 修复 `apps/server/prisma/seed.ts` 中重复导入/重复执行 `userSeed` 的明显缺陷
- 用户后续清理历史模块后，重新验证 `apps/server` 构建已通过。

## Commands Run
- `pnpm exec prisma validate --schema prisma/schema.prisma`
- `pnpm run db:generate`
- `pnpm run build`
  - workdir: `packages/common`
- `mkdir -p prisma/migrations/20260311_schema_model_alignment_hardening`
- `pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/20260311_schema_model_alignment_hardening/migration.sql`
- `pnpm exec prisma format --schema prisma/schema.prisma`
- `pnpm run build`
  - workdir: `apps/server`
- `pnpm run build`
  - workdir: `apps/server`
  - rerun after historical module cleanup

## Verification Results
- `pnpm exec prisma validate --schema prisma/schema.prisma`
  - Passed.
- `pnpm run db:generate`
  - Passed. Prisma client and JSON types regenerated successfully.
- `pnpm run build` in `packages/common`
  - Passed.
- `pnpm exec prisma migrate diff ...`
  - Passed. Generated initial SQL migration under `apps/server/prisma/migrations/20260311_schema_model_alignment_hardening/`.
- `pnpm run build` in `apps/server`
  - Initially failed due to pre-existing repository issues unrelated to this task.
- `pnpm run build` in `apps/server` after historical module cleanup
  - Passed.

## Deviations From Plan
- Milestone 2 originally proposed SQL `BigInt` / integer amounts. Implementation changed to `Decimal(78,0)` instead.
  - Reason: AURA total supply in 18-decimal smallest units (`1e27`) exceeds PostgreSQL `BIGINT` range.
  - Outcome: still uses integer atomic-unit storage semantics, but with a safe numeric range.
- Migration generation was produced as an initial `from-empty` SQL baseline.
  - Reason: repository had no existing Prisma migrations history to diff against.

## Follow-up Risks
- If later services expect human-readable decimal amounts instead of atomic-unit strings, conversion helpers must be introduced in the service / adapter layer before implementation proceeds.
