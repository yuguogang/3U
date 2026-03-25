# Testnet MockUSDT VPS Deployment Plan

## 1. Objective

为一台 **全新 Ubuntu VPS** 部署并上线最新 `fork-anvil` 已验证架构对应的 **真实 BSC Testnet MockUSDT** 环境，覆盖：

- PostgreSQL / Redis 基础设施
- `apps/server` / `apps/dapp` / `apps/admin` 生产运行
- Nginx 反向代理、域名、HTTPS
- 与最新链上环境 manifest 的对接
- 最终可进行手工 UAT，而不是依赖本地节点

本计划不再停留在“只交付文档和脚本”，而是为**真实 Ubuntu 部署实施**做准备；真正远程执行时仍需要服务器 SSH 权限、域名/DNS、RPC 与部署私钥。

## 2. Scope

- 冻结 Ubuntu 服务器目录结构、用户、端口、进程模型
- 提供并落地基础设施脚本：
  - Docker Engine
  - Docker Compose Plugin
  - Postgres
  - Redis
- 提供并落地应用部署脚本：
  - `server`
  - `dapp`
  - `admin`
- 提供并落地：
  - systemd units
  - Nginx 模板
  - TLS / Certbot 流程
- 将 VPS 部署与新的 `testnet-mockusdt` manifest/env 体系打通
- 设计上线后手工 UAT / smoke 流程

## 3. Out of Scope

- 不在本计划里设计 CI/CD 自动发布流水线
- 不容器化 `server / dapp / admin`
- 不处理生产环境 `release`
- 不支持多机集群或高可用
- 不在没有 SSH / 域名 / 私钥前提下假装执行远程上线

## 4. Assumptions

- 目标服务器是 Ubuntu 22.04 或 24.04
- 目标是一台单机 VPS
- 可开放公网端口 `80/443/22`
- 可以提供：
  - SSH 登录方式
  - 目标域名与 DNS 控制权
  - BSC Testnet RPC
  - WalletConnect Project ID
  - 部署用私钥与运营角色钱包地址
- 应用运行继续使用仓库现有生产脚本：
  - `apps/server`: `env:start:prod`
  - `apps/dapp`: `env:build` + `env:start`
  - `apps/admin`: `env:build` + `env:start`
- 新链上环境使用 `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt`

## 5. Architecture Impact

### 5.1 Production Topology Decision

采用：

- **Docker for infra**
  - Postgres
  - Redis
- **systemd for apps**
  - `server`
  - `dapp`
  - `admin`
- **Nginx for public ingress**
  - `api.<domain>`
  - `app.<domain>`
  - `admin.<domain>`

原因：

- 仓库已具备成熟的 `pnpm build/start` 与 promotion-env 导出能力
- 不需要额外引入镜像构建与镜像仓库复杂度
- 贴近当前本地与 UAT 运行方式，定位问题更直接

### 5.2 Latest App Runtime Requirements

VPS 部署必须反映当前最新 `fork-anvil` 实战结果：

- dapp/server/admin 都必须读取同一份新 manifest 派生 env
- 不能出现 dapp 使用旧收款地址、server 用新收款地址的错配
- claims 页需要依赖 server 读取链上时间修正过期补贴展示
- Admin 钱包连接需要与实际浏览器扩展/站点权限兼容

### 5.3 Funding And Role Separation Requirements

VPS 上线后的真实 testnet 环境必须保留最新 split funding 角色：

- `checkinReceiverAddress = rewardFunderAddress`
  - 负责签到收款
  - 负责抽奖/排名奖励注资来源
- `financeWallet = settlementPublisher`
  - 负责 NFT 售卖收款
  - 负责周补贴注资与发布来源

这不是文档口径，而是部署时必须写进 manifest/env/合约角色的真实配置。

## 6. Milestones

### Milestone 1: Freeze Deployment Inputs And Server Conventions

- Goal:
  - 冻结 VPS 上的目录、端口、域名与服务命名
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/*`
- Implementation notes:
  - 建议目录：
    - `/opt/3u-aura/current`
    - `/opt/3u-aura/shared`
    - `/opt/3u-aura/releases/<timestamp>`
    - `/etc/3u-aura`
    - `/var/log/3u-aura`
  - 建议本机端口：
    - server `3110`
    - dapp `3100`
    - admin `3101`
  - 建议域名：
    - `api.<domain>`
    - `app.<domain>`
    - `admin.<domain>`
- Risks:
  - 端口、域名、systemd unit 命名不一致，后面脚本难以自动化
- Verification commands:
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target admin`
- Expected outputs:
  - 一套冻结的 VPS 运行约定，可作为脚本与 runbook 的基础

### Milestone 2: Add Ubuntu Bootstrap And Infra Assets

- Goal:
  - 提供可重复执行的 Ubuntu 初始化和 infra 部署脚本
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/bootstrap-vps.sh`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/install-docker-stack.sh`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/docker/testnet-mockusdt.compose.yml`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.server.env.example`（planned）
- Implementation notes:
  - `bootstrap-vps.sh` 负责：
    - 安装基础包
    - 安装 Docker Engine / Compose Plugin
    - 创建目录与 system user
    - 初始化防火墙建议
  - infra compose 只包含：
    - Postgres
    - Redis
  - 不暴露开发辅助工具
  - 必须有健康检查与持久卷
- Risks:
  - 直接复用根目录开发 compose 会带入错误端口或开发工具
- Verification commands:
  - `docker compose -f ops/docker/testnet-mockusdt.compose.yml config`
  - `bash scripts/deploy/bootstrap-vps.sh --help`
  - `bash scripts/deploy/install-docker-stack.sh --help`
- Expected outputs:
  - Ubuntu 初始化脚本
  - 面向线上测试服的最小 infra compose

### Milestone 3: Add App Release / Restart / Smoke Scripts

- Goal:
  - 将 server/dapp/admin 的发布、重启、冒烟脚本化
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/deploy-testnet-mockusdt.sh`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/restart-testnet-mockusdt.sh`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/smoke-test-testnet-mockusdt.sh`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-server.service.template`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-dapp.service.template`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-admin.service.template`（planned）
- Implementation notes:
  - `deploy-testnet-mockusdt.sh` 负责：
    - 安装依赖
    - build
    - 导出 env
    - 渲染 systemd units
    - restart 服务
  - 必须直接复用当前 package scripts：
    - `pnpm --dir apps/server build`
    - `pnpm --dir apps/server env:start:prod`
    - `pnpm --dir apps/dapp env:build`
    - `pnpm --dir apps/dapp env:start`
    - `pnpm --dir apps/admin env:build`
    - `pnpm --dir apps/admin env:start`
  - release 目录建议按时间戳保留最近若干版本，便于回滚
- Risks:
  - build 成功但 systemd 仍指向旧 release
  - env 未刷新导致服务拿旧收款地址/旧 token 地址
- Verification commands:
  - `systemd-analyze verify ops/systemd/*.service.template`
  - `bash scripts/deploy/smoke-test-testnet-mockusdt.sh --help`
- Expected outputs:
  - 一套可重复的应用发布/重启/冒烟脚本

### Milestone 4: Add Nginx, Domain, TLS, And Runtime Health Templates

- Goal:
  - 提供可直接上线的反向代理与证书配置模板
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/nginx/testnet-mockusdt.conf.template`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/render-nginx-config.mjs`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`（planned）
- Implementation notes:
  - 反代关系：
    - `api.<domain>` -> `127.0.0.1:3110`
    - `app.<domain>` -> `127.0.0.1:3100`
    - `admin.<domain>` -> `127.0.0.1:3101`
  - runbook 需覆盖：
    - DNS A 记录
    - `sites-available/sites-enabled`
    - `certbot --nginx`
    - 防火墙与续期
  - 必须包含健康检查路径：
    - `/api/v1/health`
    - `/`
    - `/dashboard`
- Risks:
  - Host header 配置不当导致静态资源或登录流程异常
  - 域名解析未生效导致证书申请失败
- Verification commands:
  - `nginx -t`
  - `curl -I https://api.<domain>/api/v1/health`
  - `curl -I https://app.<domain>`
  - `curl -I https://admin.<domain>/dashboard`
- Expected outputs:
  - 可渲染 Nginx 模板
  - 可执行的 DNS/TLS 操作手册

### Milestone 5: Remote Deployment And Handover Checklist

- Goal:
  - 为真实远程部署和手工 UAT 提供最终执行顺序与交接清单
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-rollback.md`（planned）
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-vps-deployment/execution.md`
- Implementation notes:
  - runbook 需包含完整顺序：
    - 服务器初始化
    - infra 启动
    - 链上环境部署/回填 manifest
    - server/dapp/admin 部署
    - Nginx/TLS
    - 资金准备
    - 手工 UAT
  - 需要单独列出“真正远程执行前必须由你提供”的输入：
    - VPS IP / SSH
    - 域名
    - RPC
    - WalletConnect Project ID
    - 部署私钥
    - 各运营角色地址
- Risks:
  - 没有这些输入就无法真正远程上线
  - 文档没写清 secrets 来源，接手人会卡住
- Verification commands:
  - 文档 walkthrough
  - smoke 脚本 dry-run / help 输出
- Expected outputs:
  - 一套可以交给运维或我后续直接执行的 Ubuntu 部署方案

## 7. Approval Checkpoint

进入实施前，需要你确认以下默认前提：

- Ubuntu 单机 VPS
- Docker 仅承载 Postgres / Redis
- `server / dapp / admin` 用 systemd
- Nginx + Certbot
- 新链上环境是 `testnet-mockusdt`
- 旧测试服可删除重建
- 真正远程执行时由你提供 SSH / 域名 / 部署私钥 / RPC 等必要输入

## 8. Rollback / Recovery Notes

- 所有远程部署必须保留旧配置备份：
  - 旧 Nginx site
  - 旧 systemd unit
  - 旧 env 文件
  - 旧 release 目录
- 新版本验收失败时：
  - 停掉新 systemd units
  - 切回旧 release symlink
  - 恢复旧 Nginx 配置
- 若链上环境已部署但服务器侧失败：
  - 保留新 manifest 与 broadcast
  - 不继续切换域名流量

## 9. Final Verification Checklist

- 存在 Ubuntu bootstrap 与 Docker infra 脚本
- 存在 `server / dapp / admin` 的部署与 restart 脚本
- 存在 systemd 模板
- 存在 Nginx 模板与 TLS 文档
- 文档明确 split funding 角色与链上地址来源
- 文档明确远程执行所需输入
- smoke 脚本覆盖 API / app / admin 健康检查
