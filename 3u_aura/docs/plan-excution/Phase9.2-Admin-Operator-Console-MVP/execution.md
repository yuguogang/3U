# Execution

## Status
Completed with verification notes.

## Completed At
2026-03-12 19:26:46 +0800

## Summary
- 新建独立 `apps/admin`，落成 promotion 阶段最小 admin/operator console，不再把后台能力继续塞进 `apps/dapp`。
- `apps/server` 已补齐 admin allowlist、后台 guard、`/api/v1/admin/*` 读写入口，以及 `AdminAuditLog` 持久化。
- 后台第一版已覆盖 overview、用户检索、待挂树列表、check-in/claim/NFT eligibility 异常、audit trail、claim sync replay / epoch sync / check-in repair 操作面。
- 业务口径保持不变：`referral NFT` 仍然是自动资格签名，没有切到人工审批流。

## Implemented Work

### 1. Shared Admin Contracts
- 新增 admin query/request contracts：
  - [admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
  - [admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- 统一从 shared package 导出，供 server DTO 和 admin app query 复用：
  - [index.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/index.ts)
  - [index.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/index.ts)

### 2. Admin Auth And Audit Hardening
- admin allowlist 进入配置层：
  - [config.types.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.types.ts)
  - [config.configuration.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts)
- 新增后台权限服务与 guard：
  - [admin-permission.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/admin-permission.service.ts)
  - [admin-wallet.guard.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/guards/admin-wallet.guard.ts)
  - [admin-permission.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/admin-permission.service.spec.ts)
- admin 登录接口接入真实 allowlist 校验：
  - [admin-auth.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/controllers/admin-auth.controller.ts)
  - [auth.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/auth.module.ts)
  - [index.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/index.ts)
- `AdminAuditLog` 持久化落地，不再是 no-op：
  - [audit-log.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/audit/repositories/audit-log.repository.ts)

### 3. Server Admin Read Models And Operator APIs
- 新增 admin 模块，统一收口后台 controller / service / repository：
  - [admin.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin.module.ts)
  - [admin-console.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-console.controller.ts)
  - [admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
  - [admin-console.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-console.service.ts)
  - [admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
  - [admin-console.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/repositories/admin-console.repository.ts)
  - [admin-ops.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.spec.ts)
- `AuraDomainModule` 与 module barrel 已接入 admin 模块：
  - [aura-domain.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/aura-domain.module.ts)
  - [index.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/index.ts)
- 用户管理侧补齐 admin 检索筛选：
  - [admin-user.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/user/controllers/admin-user.controller.ts)
  - [user-search.dto.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/user/dto/user-search.dto.ts)

### 4. Independent `apps/admin` Console
- 新建独立 Next.js admin app：
  - [package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/package.json)
  - [layout.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/layout.tsx)
  - [dashboard layout](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/layout.tsx)
- 页面与 shell：
  - [dashboard page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/page.tsx)
  - [users page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/users/page.tsx)
  - [placements page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/placements/page.tsx)
  - [checkins page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/checkins/page.tsx)
  - [claims page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/claims/page.tsx)
  - [nft eligibility page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/nft-eligibility/page.tsx)
  - [audit page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/audit/page.tsx)
  - [ops page](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/dashboard/ops/page.tsx)
  - [admin shell](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/layout/admin-shell.tsx)
- 管理后台的数据接入、wallet auth 和 query 层：
  - [admin api](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
  - [auth api](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/auth.ts)
  - [admin queries](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
  - [auth queries](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/auth.query.ts)
  - [web3 provider](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/providers/web3-provider.tsx)
  - [admin wallet button](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/auth/admin-wallet-button.tsx)

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura && pnpm install --no-frozen-lockfile
cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint src/auth/**/*.ts src/modules/admin/**/*.ts src/user/controllers/admin-user.controller.ts src/user/dto/user-search.dto.ts src/configuration/*.ts src/modules/audit/repositories/audit-log.repository.ts src/modules/aura-domain.module.spec.ts --fix
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand
cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run lint
cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run typecheck
cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run build
```

## Verification Results
- `pnpm install --no-frozen-lockfile`: passed
  - 由于本地工作区依赖曾被清空，这一步恢复了 workspace `node_modules`，并更新了 [pnpm-lock.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml)
- `packages/common` `pnpm run build`: passed
- `apps/server` targeted `eslint`: passed
- `apps/server` `pnpm run build`: passed
- `apps/server` `pnpm test -- --runInBand`: passed
  - `22` suites / `61` tests
- `apps/admin` `pnpm run lint`: passed
- `apps/admin` `pnpm run typecheck`: passed
- `apps/admin` `pnpm run build`: passed
  - routes emitted:
    - `/`
    - `/dashboard`
    - `/dashboard/users`
    - `/dashboard/placements`
    - `/dashboard/checkins`
    - `/dashboard/claims`
    - `/dashboard/nft-eligibility`
    - `/dashboard/audit`
    - `/dashboard/ops`

## Deviations And Fixes
- 计划里默认现有工作区依赖可直接复用；实际执行时 `node_modules` 已丢失。
  - Fix: 运行 `pnpm install --no-frozen-lockfile` 恢复 workspace 依赖。
  - Impact: [pnpm-lock.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml) 产生变更，应保留。
- server 全量测试初次失败，不是 admin 业务逻辑问题，而是 module smoke test 被新增 auth provider 链拖住。
  - Fix 1: 在 [index.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/index.ts) 补齐 `JwtStrategy` / `JwtRefreshStrategy` 导出。
  - Fix 2: 在 [auth.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/auth.module.ts) 显式导入 `ConfigModule`。
  - Fix 3: 在 [aura-domain.module.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/aura-domain.module.spec.ts) 显式 mock `AuthService` / `AdminPermissionService`，让测试只验证域模块装配，不被 auth cache 依赖污染。
- `apps/admin` build 通过，但 RainbowKit / wagmi optional connectors 仍会发出 `Module not found` warnings。
  - Impact: 不阻塞产物生成。
  - Decision: 本 phase 不继续清理 connector 集合，留作后续降噪项。

## Residual Notes
- 当前后台是 MVP，不是完整 RBAC 平台。权限模型仍是“钱包登录 + allowlist”。
- `referral NFT` 仍是自动资格签名，没有引入人工审批状态机、审批 API 或审批页面。
- 这次只完成 promotion 阶段 admin/operator 最小闭环，没有展开 `Phase10/11` 的发行切换或税务后台。
- `chainId = 97` 仍是当前联调口径；本 phase 没有执行真实测试链广播或远程环境演练。
