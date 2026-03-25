# Testnet MockUSDT VPS Deployment Plan

## 1. Objective

为一台空白测试服务器提供完整的部署方案与自动化资产，使其能够在 BSC Testnet 上运行独立的 `testnet-mockusdt` 环境，包括：

- PostgreSQL / Redis 基础设施
- `apps/server` / `apps/dapp` / `apps/admin` 服务部署
- Nginx 反向代理、域名与 HTTPS 配置
- 面向后续重复部署的文档与自动脚本

## 2. Scope

- 设计并交付 VPS 部署文档 / runbook
- 设计并交付服务器基础设施脚本
- 设计并交付 Node 服务部署脚本
- 设计并交付 Nginx 配置模板与域名接线说明
- 设计并交付 systemd 服务模板与健康检查脚本
- 把部署流程与现有 promotion-env / manifest 体系接起来

## 3. Out of Scope

- 本轮不实际登录远程 VPS 执行部署
- 本轮不申请真实域名或修改 DNS
- 本轮不托管 CI/CD 平台或 GitHub Actions 发布流水线
- 本轮不做 Docker 化的 `server/admin/dapp` 镜像交付
- 本轮不切换 `release` 环境

## 4. Assumptions

- 目标机器是全新 Ubuntu 22.04 / 24.04 单机 VPS
- 允许安装 Docker Engine + Docker Compose Plugin
- Node 服务继续沿用仓库现有 `pnpm build` / `next start` / `node dist/src/main.js` 模式
- Nginx 作为唯一公网入口，HTTPS 由 Certbot / Let's Encrypt 提供
- 域名结构暂按三子域名规划：
  - `api.<domain>` -> server
  - `app.<domain>` -> dapp
  - `admin.<domain>` -> admin
- 部署目标环境为新的 `testnet-mockusdt`，不复用 `testnet-live`

## 5. Architecture Impact

### 5.1 Existing Building Blocks

- 环境变量已集中由 manifest 驱动并可导出：
  - `scripts/promotion-env/lib.mjs`
  - `scripts/promotion-env/print-env.mjs`
  - `scripts/promotion-env/run-with-env.mjs`
- 合约部署已可由环境 manifest 驱动：
  - `scripts/promotion-env/deploy-contract-suite.mjs`
- 本地服务编排已存在可复用逻辑：
  - `scripts/uat/start-promotion-services.mjs`
  - `scripts/uat/promotion-service-lib.mjs`
- 仓库已经有本地 infra 参考：
  - `docker-compose.yml`

### 5.2 Recommended Deployment Topology

推荐采用：

- `Postgres + Redis` 由 Docker Compose 承载
- `server + dapp + admin` 由 systemd 托管 Node 进程
- `Nginx` 提供 80/443 入口与反代
- `promotion-env` manifest 作为地址与 runtime env 的单一事实源

### 5.3 Option Analysis

#### Option A — Full Docker For Everything

- Pros:
  - 环境更封闭
  - 易于迁移
- Cons:
  - 当前仓库没有现成 Dockerfile / production image 流程
  - 变更面会扩大到前后端容器化与镜像发布

#### Option B — Docker For Infra, systemd For Apps

- Pros:
  - 最贴近当前仓库现状
  - Postgres / Redis 可直接复用现有 compose 思路
  - Node 应用仍按已有 `pnpm` / `build` / `start` 脚本运行
  - 调试与故障定位更直接
- Cons:
  - 需要维护 systemd unit 与 Nginx 模板

#### Decision

采用 Option B。

## 6. Milestones

### Milestone 1: Define VPS Conventions And Deployment Inputs

- Goal:
  - 冻结部署约定、目录结构、端口、域名与依赖安装方案
- Affected files/modules:
  - `docs/runbooks/testnet-mockusdt-vps-deployment.md`（planned）
  - `config/promotion-envs/testnet-mockusdt/*`（planned dependency）
  - `scripts/promotion-env/*`
- Implementation notes:
  - 明确服务器目录，例如：
    - `/opt/3u-aura`
    - `/etc/3u-aura`
    - `/var/log/3u-aura`
  - 明确公开端口与内网端口：
    - server `3110`
    - dapp `3100`
    - admin `3101`
  - 明确 system user、Node 版本、pnpm 版本
  - 明确域名接线策略与 DNS 记录要求
- Risks:
  - 目录规范和脚本输出不一致，后续 systemd / nginx 模板难以复用
- Verification commands:
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp`
- Expected outputs:
  - 一套冻结的部署约定
  - runbook 中的变量命名与 manifest 保持一致

### Milestone 2: Add Infrastructure Bootstrap Assets

- Goal:
  - 为空白 VPS 提供可重复执行的基础设施初始化脚本
- Affected files/modules:
  - `scripts/deploy/bootstrap-vps.sh`（planned）
  - `scripts/deploy/install-docker-stack.sh`（planned）
  - `ops/docker/testnet-mockusdt.compose.yml`（planned）
  - `ops/env/testnet-mockusdt.server.env.example`（planned）
- Implementation notes:
  - 脚本负责：
    - apt 基础包安装
    - Docker Engine / Compose Plugin 安装
    - 创建目录与 system user
    - 拉起 Postgres / Redis
  - Compose 文件要面向生产最小化：
    - 保留 Postgres / Redis
    - 不默认暴露 pgAdmin / Redis Commander
  - Postgres / Redis 使用持久卷与健康检查
- Risks:
  - 直接复用当前根目录 `docker-compose.yml` 会带入开发环境工具和不必要的对外端口
- Verification commands:
  - `docker compose -f ops/docker/testnet-mockusdt.compose.yml config`
  - `bash scripts/deploy/bootstrap-vps.sh --help`
- Expected outputs:
  - 一套面向 VPS 的 infra compose 与安装脚本

### Milestone 3: Add App Deploy And Service Management Scripts

- Goal:
  - 将 `server / dapp / admin` 的构建、启动、升级流程脚本化
- Affected files/modules:
  - `scripts/deploy/deploy-testnet-mockusdt.sh`（planned）
  - `scripts/deploy/restart-testnet-mockusdt.sh`（planned）
  - `scripts/deploy/smoke-test-testnet-mockusdt.sh`（planned）
  - `ops/systemd/3u-aura-server.service.template`（planned）
  - `ops/systemd/3u-aura-dapp.service.template`（planned）
  - `ops/systemd/3u-aura-admin.service.template`（planned）
- Implementation notes:
  - 脚本负责：
    - 安装依赖
    - 运行 build
    - 生成 env 文件或读取 manifest 导出
    - 写入/刷新 systemd units
    - `daemon-reload` / `enable` / `restart`
  - server 使用：
    - `pnpm --dir apps/server build`
    - `pnpm --dir apps/server env:start:prod`
  - dapp/admin 使用：
    - `pnpm --dir apps/dapp env:build`
    - `pnpm --dir apps/dapp env:start`
    - `pnpm --dir apps/admin env:build`
    - `pnpm --dir apps/admin env:start`
- Risks:
  - server 构建产物路径和 systemd `ExecStart` 漂移
  - 只 build 不 restart，会出现旧进程仍在跑
- Verification commands:
  - `systemd-analyze verify ops/systemd/*.service.template`
  - `bash scripts/deploy/smoke-test-testnet-mockusdt.sh --help`
- Expected outputs:
  - 一套可重复执行的应用部署与重启脚本
  - systemd 服务模板可以直接渲染到服务器

### Milestone 4: Add Nginx / Domain / TLS Templates And Runbook

- Goal:
  - 提供域名、Nginx、HTTPS 的标准接线文档与配置模板
- Affected files/modules:
  - `ops/nginx/testnet-mockusdt.conf.template`（planned）
  - `scripts/deploy/render-nginx-config.mjs`（planned）
  - `docs/runbooks/testnet-mockusdt-vps-deployment.md`（planned）
- Implementation notes:
  - 模板应支持：
    - `api.<domain>` -> `127.0.0.1:3110`
    - `app.<domain>` -> `127.0.0.1:3100`
    - `admin.<domain>` -> `127.0.0.1:3101`
  - runbook 需覆盖：
    - DNS A 记录
    - `sites-available` / `sites-enabled`
    - `certbot --nginx`
    - 防火墙开放 80 / 443 / 22
- Risks:
  - Host header 配置错误导致 admin/dapp 静态资源或回调域名异常
  - 先申请证书后域名未生效，导致 Certbot 失败
- Verification commands:
  - `nginx -t`
  - `curl -I https://api.<domain>/api/v1/health`
  - `curl -I https://app.<domain>`
  - `curl -I https://admin.<domain>`
- Expected outputs:
  - 可直接渲染的 Nginx 模板
  - 可执行的域名与 TLS runbook

### Milestone 5: Add Deployment Documentation And Operational Checklist

- Goal:
  - 交付一份完整的从 0 到上线 runbook
- Affected files/modules:
  - `docs/runbooks/testnet-mockusdt-vps-deployment.md`（planned）
  - `docs/runbooks/testnet-mockusdt-rollback.md`（planned）
  - `docs/plan-excution/testnet-mockusdt-vps-deployment/execution.md`
- Implementation notes:
  - 文档至少覆盖：
    - 前置条件
    - 服务器初始化
    - 基础设施部署
    - 合约部署
    - app/server/admin 部署
    - Nginx/HTTPS
    - 验收
    - 回滚
    - 常见故障排查
- Risks:
  - 脚本存在但文档不讲变量来源，后续很难接手
- Verification commands:
  - 文档 walkthrough 自检
  - smoke 脚本 dry-run / help 输出
- Expected outputs:
  - 一套新同事可独立照着执行的部署文档

## 7. Approval Checkpoint

进入实现前，需要你确认这组默认前提：

- Ubuntu 单机 VPS
- `Docker for infra + systemd for apps`
- Nginx + Certbot
- 三子域名模式：`api/app/admin`
- 本次只交付文档和自动脚本，不在此轮真正远程部署

如果这些默认前提成立，我会按这份计划进入实现。

## 8. Rollback / Recovery Notes

- 不直接改现有 `testnet-live` 服务器
- 所有新增脚本和模板先以文件交付为主
- 远程执行时遵循：
  - 先 infra
  - 再 app deploy
  - 最后切 Nginx 站点与域名
- 若新服务未通过验收：
  - 保留旧 Nginx site
  - 停掉新 systemd unit
  - 回退 env 文件和 symlink

## 9. Final Verification Checklist

- 存在面向 VPS 的 Postgres / Redis compose 文件
- 存在服务部署脚本与 systemd 模板
- 存在 Nginx 模板与域名/HTTPS 说明
- 存在完整 runbook 与 rollback 文档
- 文档中的命令与仓库现有脚本一致
- 关键健康检查路径已写入 smoke 脚本

