# Milestone 6 — Prisma Baseline Alignment

## Goal
对所有可达且 active 的非空数据库执行非破坏性 schema 对齐，并为已有 migrations 建立 baseline。

## Affected files/modules
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/migrations/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/execution.md`

## Implementation notes
- 默认流程：
  - `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
  - 人工审阅 SQL
  - `prisma db execute --file <diff.sql>`
  - `prisma migrate resolve --applied <migration>`
- 禁止 `migrate reset`、删库重建等破坏性手段
- `uat-mockusdt` 已完成一次基线修复，可作为模板；其他环境只在可达时执行

## Risks
- 对错误环境执行 baseline
- 把“schema 已一致”与“migration history 已 baseline”混为一谈
- 对非幂等 diff SQL 重复执行

## Verification commands
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --output /tmp/<env>_schema_diff.sql`
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma db execute --file /tmp/<env>_schema_diff.sql`
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate resolve --applied <migration_name>`
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate status`

## Expected outputs
- 所有 active 且可达环境的 schema / baseline 状态有精确结果
- 所有无法修复的环境有精确阻塞原因，而不是笼统“未完成”
