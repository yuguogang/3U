# Milestone 3 — Core Promotion Flows

## Goal
在 public `uat-mockusdt` 上自动覆盖实时主路径，不把周流程前置混入该主基线。

## Affected files/modules
- `apps/e2e/phase94/tests/core/*`
- `apps/e2e/phase94/src/server-api.ts`
- `apps/e2e/phase94/src/checkin-payment.ts`
- `apps/e2e/phase94/src/nft-purchase.ts`
- `apps/dapp/src/components/pages/{team,checkin,nft}.tsx`

## Implementation notes
- public 主路径只负责：登录、bind/placement、check-in、buy NFT、buy 后 txHash sync-back
- buy NFT 的写链可以由 Node 侧私钥执行；DApp 负责公共读链回读与 UI 断言
- claim 若依赖 weekly epoch / published root，不应强塞回 public 主基线

## Risks
- 把时间敏感周流程放进 public UAT，会让用例因外部状态漂移而失真
- 误把 read-model 延迟或 txHash sync 缺失看成链上买入失败

## Verification commands
- `PROMOTION_ENV=uat-mockusdt pnpm --dir apps/e2e/phase94 run test:core`
- `PROMOTION_ENV=uat-mockusdt pnpm --dir apps/e2e/phase94 run test:uat`

## Expected outputs
- public 实时主路径有一套稳定 runner
- `execution.md` 可直接引用 smoke/core 的 machine-readable 结果
