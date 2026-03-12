# Execution

## Status
Completed

## Completed At
2026-03-12 10:15:01 +0800

## Summary
- 移除了旧的套利/理财 DApp 主路径与对应前端实现。
- 重建了 promotion 导向的 app shell、导航与 placeholder routes。
- 对齐了 `wallet/auth` 与 `packages/common` 当前真实导出。
- 恢复了 `apps/dapp` 的 `lint / typecheck / build` 基线。

## Implemented Work

### 1. Promotion App Shell
- 重写 [mobile-layout.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)，替换旧菜单、旧语言/抽屉导航与套利品牌元素。
- 重写 [layout.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/layout.tsx)，移除在线 Google Fonts，统一 metadata 到 promotion 语义。
- 更新 [globals.css](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/globals.css) 字体变量与设计系统注释，避免依赖外部字体下载。
- 新增：
  - [dashboard-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx)
  - [section-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/section-page.tsx)
  - [checkin/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/checkin/page.tsx)
  - [team/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/team/page.tsx)
  - [rewards/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/rewards/page.tsx)
  - [nft/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/nft/page.tsx)
  - [claims/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/claims/page.tsx)
- 根页面 [page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/page.tsx) 已切到新的 promotion dashboard。

### 2. Legacy Surface Removal
- 删除旧 route：
  - `binding`
  - `loan`
  - `manage`
  - `products`
  - `redeem`
  - `share`
  - `swap`
- 删除旧业务实现：
  - [finance.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/finance.ts)
  - [finance.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/finance.query.ts)
  - [products.store.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/store/products.store.ts)
  - `components/products/*`
  - 旧 `components/pages/*` 套利/借贷/赎回页面
- 删除无关 example/share/provider layout 残留，避免 lint/build 继续扫描旧壳。

### 3. Wallet/Auth Alignment
- 更新 [wallet-button.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx)，移除失效的 `Chains` import，改为读取当前 `wagmi` chain id。
- 更新 [api/auth.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/auth.ts) 和 [auth.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/auth.query.ts)，通过 shared `AuthSignatureMessageSchema` 推导 message input，而不是引用不存在的类型导出。
- 更新 [wagmi-config.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/wagmi-config.tsx) appName 到 `3U AURA`。
- 更新 [global.d.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/types/global.d.ts) 以消除 `next-intl` 模块增强的 lint error。

### 4. Scripts And Plan Dependency
- 更新 [package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/package.json)：
  - `lint` 改为 `eslint .`
  - 新增 `typecheck`
  - `dev/build` 暂切到 `webpack` 路径
- 更新 [tsconfig.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/tsconfig.json) 并完成一次新的 `.next` 路由类型生成验证。
- `Phase9` 依赖关系已保留在 [Phase9 plan](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9-Dapp-Promotion-MVP/plan.md)。

## Deviations From Plan
- 原计划没有显式要求替换 `Next 16` 的默认构建器。实际执行时，`next build` 在当前环境使用 `Turbopack` 处理 CSS loader 时触发 panic，因此把 [package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/package.json) 的 `dev/build` 切到 `--webpack`，以恢复稳定的验证链路。
- 为了先摆脱删除旧 routes 后遗留的 `.next` 类型缓存，我暂时从 `tsconfig` 移除了 `.next` 路径；随后成功 build 时，Next 自动把这些 include 重新加回，最终 `typecheck` 仍保持通过。
- 本阶段没有补 `test` 脚本或新增前端单测。原因是 `Phase9.0` 只负责基线重建，不负责完整业务页面实现；验证集中在 `lint / typecheck / build`。

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint
```

## Verification Results
- `pnpm run lint`: passed
- `pnpm run typecheck`: passed
- `pnpm run build`: passed
  - routes emitted:
    - `/`
    - `/checkin`
    - `/team`
    - `/rewards`
    - `/nft`
    - `/claims`

## Residual Notes
- `build` 仍会输出 RainbowKit / wagmi optional connector 的 `Module not found` warnings，主要涉及未安装的可选钱包 connector peer deps；当前不阻塞构建，但后续可以通过收窄 connector 配置或补 peer 依赖消掉噪音。
- 当前 `apps/dapp` 仍未配置 `test` 脚本；进入 `Phase9` 业务实现前，应决定是否补 `Vitest/RTL` 或先维持 smoke-only 验证。
