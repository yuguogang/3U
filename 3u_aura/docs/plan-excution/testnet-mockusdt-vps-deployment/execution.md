# Testnet MockUSDT VPS Deployment — Execution Log

## Status

- In progress
- Repo-side VPS deployment assets created
- Awaiting real VPS/domain/secrets input before remote execution

## Plan Reference

- Plan: `docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md`

## Research Summary

- 仓库已有 manifest 驱动的 promotion-env 体系，可导出 server/dapp/admin/contracts 环境变量
- 合约部署已可通过 `scripts/promotion-env/deploy-contract-suite.mjs` 自动完成
- 本地已有基础设施参考 `docker-compose.yml`，但更偏开发态，不能直接作为 VPS 最终交付
- 服务编排逻辑已有本地版本：
  - `scripts/uat/start-promotion-services.mjs`
  - `scripts/uat/promotion-service-lib.mjs`
- 仓库当前缺少：
  - 面向空白服务器的 runbook
  - systemd unit 模板
  - Nginx 配置模板
  - 域名 / HTTPS 操作文档
  - 面向 VPS 的基础设施部署脚本

## Commands Run During Planning

- `rg -n "nginx|systemd|pm2|deploy|ubuntu|server setup|redis|postgres|docker compose|docker-compose|Caddy|ssl|certbot" -S docs scripts apps`
- `find scripts -maxdepth 3 -type f | sort`
- `cat apps/server/package.json`
- `cat apps/dapp/package.json`
- `cat apps/admin/package.json`
- `sed -n '1,260p' scripts/promotion-env/lib.mjs`
- `sed -n '1,260p' scripts/uat/promotion-service-lib.mjs`
- `sed -n '1,220p' docker-compose.yml`
- `sed -n '1,260p' docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/deployment-manifest.template.md`

## Preliminary Recommendation

- 推荐部署模型：
  - Docker Compose 承载 Postgres / Redis
  - systemd 承载 Node 服务
  - Nginx 提供域名反代与 HTTPS
- 推荐交付物：
  - VPS runbook
  - infra/bootstrap 脚本
  - app deploy/restart/smoke 脚本
  - systemd 模板
  - Nginx 模板

## 2026-03-25 Plan Refresh Notes

- Updated the VPS deployment plan from “document/script delivery only” to “prepare for real Ubuntu deployment execution”.
- Refreshed the plan so it now assumes:
  - latest `fork-anvil` validated app/runtime behavior
  - split funding wallets
  - real BSC Testnet chain environment
  - old `testnet-live` server deployment may be deleted and rebuilt
- Explicitly tied runtime deployment to current package scripts:
  - `apps/server env:start:prod`
  - `apps/dapp env:build` / `env:start`
  - `apps/admin env:build` / `env:start`

## Additional Commands Run During Plan Refresh

- `sed -n '1,320p' docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md`
- `sed -n '1,260p' scripts/promotion-env/lib.mjs`
- `node --input-type=module -e "import fs from 'fs'; const p=['apps/server/package.json','apps/dapp/package.json','apps/admin/package.json']; for (const f of p){ const j=JSON.parse(fs.readFileSync(f,'utf8')); console.log('FILE',f); console.log(JSON.stringify(j.scripts,null,2)); }"`
- `sed -n '1,260p' config/promotion-envs/fork-anvil/manifest.json`

## 2026-03-25 Implementation Progress

### New Directories And Templates Added

- Created `/Users/ygg/vs/ai/3U/3u_aura/ops/docker/testnet-mockusdt.compose.yml`
- Created `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.server.env.example`
- Created `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.shared.env.example`
- Created:
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-server.service.template`
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-dapp.service.template`
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-admin.service.template`
- Created `/Users/ygg/vs/ai/3U/3u_aura/ops/nginx/testnet-mockusdt.conf.template`
- Created deployment scripts:
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/bootstrap-vps.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/install-docker-stack.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/render-nginx-config.mjs`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/deploy-testnet-mockusdt.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/restart-testnet-mockusdt.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/smoke-test-testnet-mockusdt.sh`
- Created runbooks:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-rollback.md`

### Runtime Behavior Captured In Assets

- Deployment scripts are aligned to current package scripts:
  - `apps/server env:start:prod`
  - `apps/dapp env:build` / `env:start`
  - `apps/admin env:build` / `env:start`
- systemd templates load:
  - target-specific env files
  - shared secrets file for DB credentials / WalletConnect
- Nginx template proxies to internal ports:
  - `3110`
  - `3100`
  - `3101`

## Verification Run

### Commands

- `bash -n scripts/deploy/bootstrap-vps.sh && bash -n scripts/deploy/install-docker-stack.sh && bash -n scripts/deploy/deploy-testnet-mockusdt.sh && bash -n scripts/deploy/restart-testnet-mockusdt.sh && bash -n scripts/deploy/smoke-test-testnet-mockusdt.sh`
- `node --check scripts/deploy/render-nginx-config.mjs && node --check scripts/promotion-env/lib.mjs`
- `node scripts/deploy/render-nginx-config.mjs --api-domain api.example.com --app-domain app.example.com --admin-domain admin.example.com >/tmp/testnet-mockusdt.nginx.out && sed -n '1,220p' /tmp/testnet-mockusdt.nginx.out`
- `rg --files config/promotion-envs/testnet-mockusdt docs/runbooks ops scripts/deploy | sort`

### Results

- All shell deployment scripts passed `bash -n`
- Node renderer and updated promotion-env library passed syntax check
- Nginx template rendered successfully with sample domains
- Expected deployment asset files are present in repo

## Remaining Blockers

- No remote VPS execution has been attempted in this turn
- No DNS / TLS / SSH / private key inputs were provided yet
- Compose template was not executed against a real Ubuntu host in this turn

## 2026-03-25 Handoff Update After Local Contract Deployment

- Deployment mode was finalized as:
  - local machine deploys contracts
  - isolated Ubuntu VPS deploys only infra + app/server/admin
- Remote handoff was updated to include:
  - final domains
  - final role addresses
  - deployed contract addresses
  - gas warnings for `rewardFunder` / `settlementPublisher`
- See:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md`
