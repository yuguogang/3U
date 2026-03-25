# Testnet MockUSDT VPS Deployment — Execution Log

## Status

- Planning created
- Awaiting approval

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

