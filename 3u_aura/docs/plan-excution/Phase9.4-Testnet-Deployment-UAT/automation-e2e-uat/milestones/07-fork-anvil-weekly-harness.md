# Milestone 7 — Fork/Anvil Weekly Harness

## Goal
建立独立于 public `test:uat` 的 weekly fork 底座，支持独立启动、停止、重置、时间推进、`referenceAt` 控制和隔离 schema。

## Affected files/modules
- `scripts/uat/*`
- `scripts/promotion-env/*`
- `config/promotion-envs/fork-anvil/*`
- `apps/e2e/phase94/src/runtime.ts`
- `apps/e2e/phase94/src/server-api.ts`
- `apps/e2e/phase94/tests/weekly-fork/*`

## Implementation notes
- 优先复用 `fork + anvil`；若 source RPC 不稳定，可回退到 local deploy manifest
- 周流程 runner 与 public 主路径解耦：
  - public: `test:uat`
  - weekly: `test:weekly-fork`
- 统一注入 fork RPC、owner / publisher 钱包、`referenceAt`、隔离 schema、独立端口
- deterministic anvil wallets 作为 fork 默认参与者，避免依赖 public testnet 钱包状态

## Risks
- anvil 时间推进与 server `new Date()` 不一致，必须显式控制 `referenceAt`
- fork 环境如果没有隔离 schema，容易误用 `public` 数据
- source RPC `missing trie node` 会污染周流程稳定性

## Verification commands
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run fork:start`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run stack:start`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run test:weekly-fork`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run stack:stop`
- `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run fork:stop`

## Expected outputs
- 一个独立、可重复、可重置的 weekly fork 底座
- runtime/config/ports/schema 的证据可被 `execution.md` 直接引用
