# Fork-Anvil Wallet UI Recovery Execution

## Progress Log

- 2026-03-25: 创建执行记录文件，等待计划批准后实施。
- 2026-03-25: 确认根因不是页面删除，而是 `dapp/admin` 钱包层编译失败导致的本地 404 / provider 异常。
- 2026-03-25: 创建并批准恢复计划。
- 2026-03-25: 发现 `@rainbow-me/rainbowkit` / `getDefaultConfig` 导入链会在本地 Webpack dev 编译中拉入未安装的可选 connector 依赖，触发模块缺失。
- 2026-03-25: 对 `apps/dapp` 与 `apps/admin` 改为最小化 `wagmi` 配置：
  - `src/lib/wagmi-config.tsx` 改用 `createConfig + injected`
  - `src/components/providers/web3-provider.tsx` 移除 `RainbowKitProvider`
  - `wallet button` 改为纯 `wagmi` 版本，不再依赖 `ConnectButton.Custom`
- 2026-03-25: `fork-anvil` 的 `dapp.public.env` / `admin.public.env` 切换为手工 UAT 友好的 `NEXT_PUBLIC_E2E_INJECTED_WALLET=false`
- 2026-03-25: 清理本地 dapp/admin 旧进程与 `.next` 缓存，避免热更新残留。
- 2026-03-25: 最终使用显式 `127.0.0.1` 方式手工拉起本地 dev 服务：
  - `node scripts/promotion-env/run-with-env.mjs --target dapp --env fork-anvil -- pnpm --dir apps/dapp exec next dev --webpack -H 127.0.0.1 -p 3200`
  - `node scripts/promotion-env/run-with-env.mjs --target admin --env fork-anvil -- pnpm --dir apps/admin exec next dev --webpack -H 127.0.0.1 -p 3201`
- 2026-03-25: 运行态观察：
  - dapp/admin 启动日志均报告 `Ready`
  - 当前 Codex sandbox 内的 `curl 127.0.0.1:3200/3201` 仍返回连接失败，和服务端日志不一致；判断为本地进程/沙箱可见性差异，需以浏览器手工刷新作为最终 UAT 判定。
