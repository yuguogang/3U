# Execution

## Status
In progress.

## Last Updated
2026-03-14 (updated)

## Summary
- 已落地独立 `apps/e2e/phase94` 自动化工程，并接上 `uat-mockusdt` 的 manifest、钱包目录、`uat-report.json` 与 artifacts 目录。
- 已为 `dapp/admin` 增加关键操作位的 `data-testid`，减少自动化依赖文案定位。
- 已通过两条真实验证：
  - `precheck`：环境清单、服务健康、5 钱包资金阈值校验通过
  - `shell smoke`：`dapp/admin` 页面可达并可在 Playwright 中稳定打开
- 当前主要阻塞不是钱包资金，而是 `RainbowKit/wagmi + MetaMask SDK` 在自动化上下文下未弹出扩展通知页，导致 `connectToDapp()` 无法继续。

## Work Completed
- 新增 E2E 项目目录与配置：
  - `apps/e2e/phase94/package.json`
  - `apps/e2e/phase94/tsconfig.json`
  - `apps/e2e/phase94/playwright.config.ts`
  - `apps/e2e/phase94/reports/.gitignore`
- 新增运行时与报告模块：
  - `apps/e2e/phase94/src/runtime.ts`
  - `apps/e2e/phase94/src/report.ts`
  - `apps/e2e/phase94/src/global-setup.ts`
  - `apps/e2e/phase94/src/precheck.ts`
  - `apps/e2e/phase94/src/smoke.ts`
  - `apps/e2e/phase94/src/metamask-session.ts`
- 新增钱包 setup 与缓存脚本：
  - `apps/e2e/phase94/wallet-setup/*.setup.ts`
  - `apps/e2e/phase94/scripts/build-wallet-cache.mjs`
- 新增首批测试：
  - `apps/e2e/phase94/tests/precheck.spec.ts`
  - `apps/e2e/phase94/tests/smoke/shell.spec.ts`
  - `apps/e2e/phase94/tests/smoke/dapp-referrer-login.spec.ts`
  - `apps/e2e/phase94/tests/smoke/admin-login.spec.ts`
- 更新 workspace 以纳入嵌套 E2E 项目：
  - `pnpm-workspace.yaml`
- 为自动化补充稳定选择器：
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/admin/src/components/auth/admin-wallet-button.tsx`
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`

## Commands Run
- `pnpm install`
- `pnpm --dir apps/e2e/phase94 run typecheck`
- `pnpm --dir apps/e2e/phase94 exec playwright --version`
- `pnpm --dir apps/e2e/phase94 exec playwright install chromium`
- `pnpm --dir apps/e2e/phase94 run test:precheck`
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/shell.spec.ts`
- `pnpm --dir apps/e2e/phase94 exec synpress wallet-setup -f`
- `pnpm --dir apps/e2e/phase94 run wallets:build:serial`
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/dapp-referrer-login.spec.ts`
- `view_image` for failed smoke screenshots

## Verification Results
- `pnpm --dir apps/e2e/phase94 run typecheck`
  - 通过。
- `pnpm --dir apps/e2e/phase94 run test:precheck`
  - 通过。
  - 已验证：
    - `uat-mockusdt` manifest `status=active`
    - `server` 健康检查返回 `200`
    - `admin/referrer/userA/userB/userC` 5 个钱包均满足目标 `tBNB/MockUSDT` 阈值
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/shell.spec.ts`
  - 通过。
  - 已验证：
    - `dapp` 首页可达
    - `admin /dashboard` 可达
    - Playwright 有头模式可在本机稳定启动
- `pnpm --dir apps/e2e/phase94 exec synpress wallet-setup -f`
  - 失败。
  - 根因：Synpress CLI 内部 `waitForExtensionOnLoadPage()` 超时硬编码为 `5s`，MetaMask 扩展未能在该时限内就绪。
- `pnpm --dir apps/e2e/phase94 run wallets:build:serial`
  - 失败。
  - 串行构建避免了并发问题，但仍被同一 `5s` 扩展加载超时阻塞。
- `pnpm --dir apps/e2e/phase94 exec playwright test tests/smoke/dapp-referrer-login.spec.ts`
  - 失败，超时 `120s`。
  - 失败截图表明：
    - MetaMask 已打开并切到 `Account 2 / BSC Testnet`
    - dapp 的 RainbowKit modal 停在 `Opening MetaMask...`
    - 自动化上下文下没有出现 MetaMask notification page，因此 `connectToDapp()` 无法继续

## Deviations From Original Plan
- 原计划的 `Synpress wallet cache` 作为 Milestone 1 基础能力先行；实际执行时被 Synpress CLI 对扩展加载页的 `5s` 硬编码超时阻塞。
- 为避免停在第三方 CLI 内部实现，本次新增了 `src/metamask-session.ts`，改为 `Playwright persistent context + Synpress MetaMask API` 直连扩展。
- 即使绕过 CLI 缓存后，`RainbowKit/wagmi` 的 `MetaMask` 连接在自动化上下文下仍未弹出扩展通知页，因此登录 smoke 目前记为 `blocked by connector/runtime interaction`。

## Next Required Actions
- 继续定位 `RainbowKit/wagmi + MetaMask` 连接器在自动化上下文下不生成 notification page 的原因。
- 若短期内无法稳定弹出连接通知页，补一个后备路径：
  - 用测试钱包私钥在 Node 侧完成签名登录
  - 通过 localStorage/session bootstrap 驱动 `dapp/admin` 的已登录 UI 流程
  - 把链上动作与 UI/API 断言拆开执行
- 在连接器阻塞解除后，再推进：
  - `admin` 登录 smoke
  - `referrer -> userA` bind/placement
  - check-in / buy NFT / claim 自动化
