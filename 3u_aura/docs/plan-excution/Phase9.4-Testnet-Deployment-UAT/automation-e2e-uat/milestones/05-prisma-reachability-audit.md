# Milestone 5 — Prisma Reachability Audit

## Goal
为 `uat-mockusdt`、`testnet-live`、`release` 建立一份明确的 Prisma 审计矩阵，先区分 schema 漂移、数据库不可达、环境不可运行。

## Affected files/modules
- `apps/server/prisma/schema.prisma`
- `config/promotion-envs/{uat-mockusdt,testnet-live,release}/manifest.json`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/execution.md`

## Implementation notes
- 统一通过 `scripts/promotion-env/run-with-env.mjs` 执行 `prisma migrate status`
- 任何 `P1001` 都必须和 `lsof` / `docker ps` / `nc -vz 127.0.0.1 5433` 一起解释
- `release` 若仍为 `status=planned`，明确标记为 `blocked-not-runnable`

## Risks
- 将受限沙箱的本地 TCP 限制误判为数据库故障
- 在未确认 manifest 可运行前误对 `release` 进行 DB 诊断

## Verification commands
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate status`
- `lsof -nP -iTCP:5433 -sTCP:LISTEN`
- `docker ps -a --filter name=aura_postgres --format '{{.Names}}	{{.Status}}	{{.Ports}}'`
- `nc -vz 127.0.0.1 5433`

## Expected outputs
- 三环境结论被统一归类为 `up-to-date` / `drifted-but-repairable` / `blocked-unreachable` / `blocked-not-runnable`
