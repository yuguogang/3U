# PNPM Version Unification Plan

## 1. Objective

统一仓库的 `pnpm` 版本口径到 `10.13.1`，消除以下不一致导致的本地与 VPS 部署漂移：

- 根 `package.json` 的 `packageManager`
- `pnpm-lock.yaml` 的 `lockfileVersion`
- 本地开发、CI、VPS runbook、部署脚本里使用的 `pnpm` 版本
- `deploy-testnet-mockusdt.sh` 等部署脚本对 lockfile 的预期

本计划目标是在**暂停当前 VPS 重试**的前提下，先在本地完成 `pnpm 10.13.1` 正式迁移、验证通过，再恢复远端部署。

## 2. Scope

- 审计仓库内所有 `pnpm` 版本声明与使用入口
- 正式迁移 `pnpm-lock.yaml` 到 `pnpm 10.13.1` 对应格式
- 设计 lockfile 迁移步骤
- 执行本地冷启动验证
- 更新相关 runbook / deploy 脚本 / packageManager 声明
- 输出基于 `pnpm 10.13.1` 的 VPS 重部署前置步骤

## 3. Out of Scope

- 本计划阶段不直接修改所有依赖版本
- 不在本计划阶段直接完成远端 VPS 重装部署
- 不顺手升级 Node、Prisma、Next、Nest 等其他依赖
- 不在未本地验证通过前，直接要求远端继续重跑整套部署

## 4. Assumptions

- 当前仓库真实问题不是“某一台机器没装对”，而是版本口径存在历史漂移
- 当前 `pnpm-lock.yaml` 仍然是老格式（`lockfileVersion: '6.0'`）
- 用户已经明确要求暂停 VPS 部署，先把仓库正式统一到 `pnpm 10.13.1`
- 本地具备足够环境先完成 lockfile 迁移与冷启动验证

## 5. Architecture Impact

### 5.1 Why This Is A Major Task

这不是单点脚本修复，而是会影响：

- monorepo 根工具链
- workspace 安装行为
- `packages/common` 构建与引用
- `apps/server` Prisma 生成与 build
- CI / deploy scripts / VPS runbook

因此按仓库规则视为 **Major**。

### 5.2 Selected Direction

本任务已确定采用：

- **全仓正式统一到 `pnpm 10.13.1`**
- **重生成并提交新的 `pnpm-lock.yaml`**
- **本地冷启动验证通过后，再回到 VPS 重部署**

### 5.3 Why The Strategy Changed

前一版短期回退到 `pnpm 8.x` 的思路，虽然能降低短期漂移，但会继续保留两套版本口径：

- 仓库近期历史里已经出现过 `pnpm 10`
- 远端已经多次因版本来回切换而出现部署困惑
- 用户明确要求先停掉 VPS，直接把仓库统一到最终目标版本

因此当前更优策略是：

1. 一次性把 `packageManager / pnpm-lock.yaml / runbooks / deploy scripts` 全部收敛到 `10.13.1`
2. 本地验证通过
3. 再让 VPS 只执行单一、清晰、最终版流程

## 6. Milestones

### Milestone 1: Audit All PNPM Version Sources

- Goal:
  - 列出仓库中所有 `pnpm` 版本来源与使用点
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/package.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/*.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/*.md`
  - CI / workflow / other scripts if present
- Implementation notes:
  - 识别：
    - `packageManager`
    - lockfile format
    - bootstrap 安装版本
    - deploy 脚本假设
    - 文档示例
    - 任何 CI 里的 `pnpm/action-setup`
- Risks:
  - 漏掉某个自动化入口，导致后续仍有版本漂移
- Verification commands:
  - `rg -n "pnpm@|pnpm-lock|frozen-lockfile|corepack prepare|pnpm/action-setup" -S .`
- Expected outputs:
  - 一张完整版本来源清单

### Milestone 2: Freeze Canonical Version And Lockfile Migration Strategy

- Goal:
  - 明确正式迁移到 `pnpm 10.13.1` 的版本与 lockfile 处理策略
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/package.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml`
  - task docs
- Implementation notes:
  - 明确本次会：
    - 将 `packageManager` 改回 `pnpm@10.13.1`
    - 使用 `pnpm 10.13.1` 正式重生成 lockfile
    - 在新 lockfile 下重新执行完整 build 验证
  - 明确“迁移完成前，VPS 不再继续重试部署”
- Risks:
  - 在迁移中使用了错误的 `pnpm 10` 次版本，导致 lockfile 仍不稳定
- Verification commands:
  - `node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync('package.json','utf8')).packageManager)"`
  - `sed -n '1,20p' pnpm-lock.yaml`
- Expected outputs:
  - 一套被批准的 `pnpm 10.13.1` 正式迁移策略

### Milestone 3: Implement Repo-Wide `pnpm 10.13.1` Alignment

- Goal:
  - 将仓库内版本声明、脚本和文档统一到同一口径
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/package.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/bootstrap-vps.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/deploy-testnet-mockusdt.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md`
  - possible CI files if found
- Implementation notes:
  - 不只改 `packageManager`
  - 还要同步：
    - 新 lockfile
    - bootstrap 安装版本
    - runbook 文案
    - deploy script 的 install 策略
    - shared package build / prisma generate 顺序
  - 需要重新检查 `pnpm 10` 下 workspace 依赖解析、脚本入口和 Prisma/Next 构建是否稳定
- Risks:
  - `pnpm 10` 重解析后引入新的依赖树变化
  - 旧的应急说明未完全清除，远端仍照旧流程操作
- Verification commands:
  - `bash -n scripts/deploy/bootstrap-vps.sh`
  - `bash -n scripts/deploy/deploy-testnet-mockusdt.sh`
  - `rg -n "pnpm@|corepack prepare|frozen-lockfile" package.json scripts docs`
- Expected outputs:
  - 仓库中只剩一个统一版本口径

### Milestone 4: Local Cold Validation Under `pnpm 10.13.1`

- Goal:
  - 在本地把统一后的安装/build/deploy关键路径验证通过
- Affected files/modules:
  - workspace install
  - `packages/common`
  - `apps/server`
  - `apps/dapp`
  - `apps/admin`
- Implementation notes:
  - 重点验证：
    - `pnpm 10.13.1` 下 frozen install 是否稳定
    - 新 lockfile 是否可重复使用
    - common build 是否满足 server/dapp/admin
    - prisma generate + server build 是否稳定
  - 必须至少做一次清理 `node_modules` 的冷启动验证
- Risks:
  - 本地缓存掩盖真实问题
- Verification commands:
  - `pnpm install --frozen-lockfile`
  - `pnpm --dir packages/common build`
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate`
  - `pnpm --dir apps/server build`
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/admin env:build`
- Expected outputs:
  - 一套本地可重复通过的构建链路

### Milestone 5: VPS Redeploy Checklist Refresh For `pnpm 10.13.1`

- Goal:
  - 将统一后的版本口径转化为远端重部署清单
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md`
  - execution log
- Implementation notes:
  - 明确远端执行前：
    - 必须安装 `pnpm@10.13.1`
    - 必须清理旧 `node_modules`
    - 必须以新的 lockfile 做冻结安装
  - 明确重部署顺序：
    - bootstrap
    - docker infra
    - sync env
    - frozen install/build
    - systemd
    - nginx
- Risks:
  - 远端继续沿用旧 node_modules，导致版本统一无效
- Verification commands:
  - 文档 walkthrough
  - `rg -n "pnpm@|node_modules|frozen-lockfile" docs/runbooks`
- Expected outputs:
  - 一份可执行的 VPS 重部署检查清单

## 7. Approval Checkpoint

已获用户确认：

- 暂停当前 VPS 部署
- 先在本地正式统一到 `pnpm 10.13.1`
- 本地验证通过后，再重回 VPS

## 8. Rollback / Recovery Notes

- 若 `pnpm 10.13.1` 迁移导致本地构建失败，可回退：
  - `package.json` 的 `packageManager`
  - `pnpm-lock.yaml`
  - 相关 deploy/runbook 变更
- 若新的 lockfile 解析出不兼容依赖树：
  - 必须回退 lockfile
  - 重新定位具体 workspace 差异后再迁移
- 若 VPS 已装歪依赖：
  - 删除远端 `node_modules`
  - 重新按批准版本 bootstrap + install

## 9. Final Verification Checklist

- `packageManager` 与新的 `pnpm 10.13.1` lockfile 口径一致
- deploy scripts 使用的 `pnpm` 版本一致
- runbooks 说明一致
- 本地冷启动安装/build 验证通过
- VPS 重部署步骤已更新
- `execution.md` 记录真实命令与结果
