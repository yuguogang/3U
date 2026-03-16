# Milestone 2 — Multi-Wallet Role Orchestration

## Goal
固定 5 钱包角色映射、隔离策略、资金阈值与运行前 precheck。

## Affected files/modules
- `config/promotion-envs/*/wallets/*.json`
- `scripts/promotion-env/prepare-wallet-fixtures.mjs`
- `apps/e2e/phase94/src/precheck.ts`
- `apps/e2e/phase94/wallet-setup/*`

## Implementation notes
- 使用显式 role -> wallet 映射，避免在测试中硬编码私钥
- public 环境与 fork 环境的钱包策略允许不同：
  - public: 复用测试链钱包
  - fork: 优先使用 deterministic anvil accounts
- precheck 至少校验：`BNB >= 0.1`、`MockUSDT >= 1000`、服务健康、manifest 可运行

## Risks
- 钱包余额被先前用例消耗后，如果没有 `wallets:prepare`，会引入伪失败
- public 钱包策略与 fork 钱包策略混用，容易造成状态污染

## Verification commands
- `PROMOTION_ENV=<env> pnpm --dir apps/e2e/phase94 run wallets:prepare`
- `PROMOTION_ENV=<env> pnpm --dir apps/e2e/phase94 run test:precheck`

## Expected outputs
- 钱包角色、资金阈值、补资流程被固定
- 测试运行前可快速判断是前置缺失还是业务失败
