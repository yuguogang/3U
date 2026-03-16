# Milestone 1 — Harness Scaffolding

## Goal
建立 `apps/e2e/phase94` 的 Playwright / Synpress 基础工程，并跑通最小 smoke 登录链路。

## Affected files/modules
- `apps/e2e/phase94/package.json`
- `apps/e2e/phase94/playwright.config.ts`
- `apps/e2e/phase94/src/*`
- `apps/e2e/phase94/tests/smoke/*`
- `pnpm-workspace.yaml`

## Implementation notes
- 固定 baseURL、API URL、artifacts 输出目录与 `uat-report.json` 初始化逻辑
- 保留 Synpress / MetaMask 能力，但主登录链路允许回退为 bootstrap session
- 该里程碑只负责让“测试能稳定启动”，不负责业务链路完整性

## Risks
- 浏览器扩展加载不稳定导致 smoke flaky
- 把“扩展 notification page 是否弹出”误当成 UAT 业务阻塞

## Verification commands
- `pnpm --dir apps/e2e/phase94 run test:precheck`
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/shell.spec.ts`
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/dapp-referrer-login.spec.ts`
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/admin-login.spec.ts`

## Expected outputs
- Smoke 用例可重复执行
- 报告目录、trace、screenshot 能稳定产出
