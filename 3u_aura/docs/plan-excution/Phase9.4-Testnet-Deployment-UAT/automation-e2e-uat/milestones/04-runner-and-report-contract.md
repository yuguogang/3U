# Milestone 4 — Runner And Report Contract

## Goal
固化本地/CI runner、exit code 语义、artifacts 目录与 `uat-report.json` 报告格式。

## Affected files/modules
- `apps/e2e/phase94/package.json`
- `apps/e2e/phase94/src/report.ts`
- `apps/e2e/phase94/reports/*`
- `scripts/uat/*`

## Implementation notes
- exit code 语义：
  - `0`: pass
  - `1`: fail
  - `2`: blocked / precondition unmet
- 报告语义：
  - `success`: 断言通过且链路完整
  - `failed`: 断言失败
  - `blocked`: 前置条件不满足
- `test:core` / `test:uat` / `test:weekly-fork` 需要统一先跑 `wallets:prepare` 与 `precheck` 的策略

## Risks
- broad suite 若把 precheck 排在花费型用例后面，会造成伪失败
- CI 与本地的浏览器 / 权限差异可能让 artifacts 不一致

## Verification commands
- `PROMOTION_ENV=<env> pnpm --dir apps/e2e/phase94 run test:core`
- `PROMOTION_ENV=<env> pnpm --dir apps/e2e/phase94 run test:uat`
- `PROMOTION_ENV=<env> pnpm --dir apps/e2e/phase94 run test:weekly-fork`

## Expected outputs
- runner 顺序、报告结构、artifacts 目录固定
- `execution.md` 可以直接引用结果而不需要手工拼装
