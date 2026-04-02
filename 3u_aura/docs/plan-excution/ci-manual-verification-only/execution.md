# CI + Manual Verification Only Execution

## Status

- Created: 2026-04-02
- State: Implementation completed with targeted verification

## Notes

- 本任务用于把仓库默认交付口径收敛为：`CI` 自动化 + `Manual Verification` 手工验证。
- 本轮已完成配置和文档收缩，没有删除 `apps/e2e/phase94` 或 `scripts/uat/*` 资产。

## Initial Findings

1. [pnpm-workspace.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-workspace.yaml) 当前显式包含 `apps/e2e/*`，因此 `apps/e2e/phase94` 仍属于默认 workspace。
2. [apps/e2e/phase94/package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/package.json) 仍暴露 `test:uat`、`test:weekly-fork` 等自动 UAT 脚本，并依赖 `@playwright/test` 与 `@synthetixio/synpress`。
3. 只读调研中，`apps/e2e/phase94` 目录体积约 `571M`，具备明显的安装/缓存拖慢风险。
4. [scripts/ci/run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs) 与 [scripts/ci/run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs) 当前未发现对 `apps/e2e/phase94` 的直接依赖。
5. 仓库内已有手工验证文档：
   - [testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
   - [testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
6. 当前 shell 环境里 `node` / `pnpm` / `corepack` 都不在 PATH，后续验证需要按实际可用二进制路径记录。

## Commands Run During Planning

```bash
pwd
ls -la
find . -maxdepth 3 \( -path '*/.github/workflows/*' -o -path './scripts/uat/*' -o -path './scripts/ci/*' -o -path './package.json' -o -path './pnpm-workspace.yaml' \) | sort
find . -path '*/.github/workflows/*.yml' -o -path '*/.github/workflows/*.yaml' | sort
sed -n '1,260p' package.json
sed -n '1,260p' scripts/ci/package.json
sed -n '1,260p' apps/e2e/phase94/package.json
sed -n '1,260p' scripts/ci/run.mjs
sed -n '1,260p' scripts/ci/run-all.mjs
sed -n '1,200p' pnpm-workspace.yaml
du -sh apps/e2e/phase94 node_modules scripts/ci apps/server apps/dapp
rg -n "pnpm --dir apps/e2e/phase94 run (test:uat|test:weekly-fork|test:core)|apps/e2e/phase94 run (test:uat|test:weekly-fork|test:core)|test:uat|test:weekly-fork|phase94" . -g '!**/node_modules/**' -g '!docs/plan-excution/**'
rg -n "scripts/ci/run-all\\.mjs|pnpm --dir scripts/ci run all|@3u-aura/ci-contracts|scripts/ci" . -g '!**/node_modules/**' -g '!docs/plan-excution/**'
rg -n "phase94|e2e|playwright|synpress|test:uat|test:weekly-fork" pnpm-lock.yaml pnpm-workspace.yaml package.json apps/e2e/phase94/package.json apps/*/package.json -g '!**/node_modules/**'
find docs/runbooks -maxdepth 2 -type f | sort
rg -n "Manual UAT|manual UAT|手工 UAT|手动验证|phase94|e2e" docs/runbooks docs -g '!docs/plan-excution/**'
git status --short
```

## Implementation Log

### 1. Default Workspace / Default Entry Surface

- 更新 [pnpm-workspace.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-workspace.yaml)
  - 移除 `apps/e2e/*`
  - 结果：`apps/e2e/phase94` 不再属于默认 workspace 安装面
- 更新 [package.json](/Users/ygg/vs/ai/3U/3u_aura/package.json)
  - 新增：
    - `ci:run`
    - `ci:all`
  - 结果：根目录现在有明确的默认自动化 CI 入口，且都指向 `scripts/ci/*`
- 更新 [pnpm-lock.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml)
  - 手动移除 `apps/e2e/phase94` importer
  - 保持其他 importer 不变，避免触碰现有业务 workspace 依赖图

### 2. Manual Verification Toolkit

- 更新 [apps/e2e/phase94/package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/package.json)
  - 新增：
    - `manual:core`
    - `manual:uat`
    - `manual:weekly-fork`
  - 保留原有 `test:*` 命令作为兼容别名
- 新增 [apps/e2e/phase94/README.md](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/README.md)
  - 明确：
    - 该目录只用于手工验证
    - 不属于默认 CI
    - 不属于默认 workspace install
    - 推荐使用 `manual:*` 入口
- 更新 [.gitignore](/Users/ygg/vs/ai/3U/3u_aura/.gitignore)
  - 忽略 `apps/e2e/phase94/pnpm-lock.yaml`
  - 结果：手工安装 phase94 依赖时，不会污染根 lockfile 提交流程

### 3. Runbook Alignment

- 更新 [testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
  - 明确 `scripts/ci/*` 是自动化 CI 路径
  - 明确 `apps/e2e/phase94` 与 `scripts/uat/*` 是手工验证工具
- 更新 [testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
  - 同步上述交付边界
  - 补充“不要把 `phase94` 重新接回默认 CI lane”的操作口径

## Verification

### Commands Run

```bash
/usr/local/n/versions/node/24.13.0/bin/node /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs install --lockfile-only --ignore-scripts
/usr/local/n/versions/node/24.13.0/bin/node /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs install --lockfile-only --ignore-scripts --offline --modules-dir /tmp/3u-aura-pnpm-modules
COREPACK_HOME=/tmp/corepack /usr/local/n/versions/node/24.13.0/bin/node /usr/local/lib/node_modules/corepack/dist/corepack.js pnpm@10.13.1 --version
/usr/local/n/versions/node/24.13.0/bin/node --check scripts/ci/run.mjs
/usr/local/n/versions/node/24.13.0/bin/node --check scripts/ci/run-all.mjs
jq '.scripts | {ci_run: .["ci:run"], ci_all: .["ci:all"]}' package.json
jq '.scripts | {manual_core: .["manual:core"], manual_uat: .["manual:uat"], manual_weekly_fork: .["manual:weekly-fork"]}' apps/e2e/phase94/package.json
rg -n "apps/e2e|ci:run|ci:all|manual:core|manual:uat|manual:weekly-fork|apps/e2e/phase94:" pnpm-workspace.yaml package.json apps/e2e/phase94/package.json pnpm-lock.yaml .gitignore apps/e2e/phase94/README.md docs/runbooks/testnet-mockusdt-vps-deployment.md docs/runbooks/testnet-mockusdt-remote-handoff.md
rg -n 'apps/e2e' pnpm-workspace.yaml
rg -n '^  apps/e2e/phase94:' pnpm-lock.yaml
git diff --stat -- .gitignore pnpm-workspace.yaml package.json pnpm-lock.yaml apps/e2e/phase94/package.json apps/e2e/phase94/README.md docs/runbooks/testnet-mockusdt-vps-deployment.md docs/runbooks/testnet-mockusdt-remote-handoff.md docs/plan-excution/ci-manual-verification-only/execution.md
```

### Results

- `node --check scripts/ci/run.mjs` 通过
- `node --check scripts/ci/run-all.mjs` 通过
- `jq` 确认根目录新增了：
  - `ci:run`
  - `ci:all`
- `jq` 确认 phase94 新增了：
  - `manual:core`
  - `manual:uat`
  - `manual:weekly-fork`
- `rg -n 'apps/e2e' pnpm-workspace.yaml` 返回空结果，说明默认 workspace 已不再包含 `apps/e2e/*`
- `rg -n '^  apps/e2e/phase94:' pnpm-lock.yaml` 返回空结果，说明 root lockfile 已不再保留 `phase94` importer
- `git diff --stat` 显示本轮主要变更集中在：
  - workspace / lock / root scripts
  - phase94 manual toolkit
  - runbook 口径同步

### Validation Limits

- 当前 shell 没有默认 PATH 级 `node` / `pnpm` / `corepack`
- 可用的全局 `pnpm` 版本是 `8.7.5`，与仓库 `pnpm-lock.yaml` 的 `lockfileVersion: '9.0'` 不兼容
- 尝试通过 `corepack` 拉起 `pnpm@10.13.1` 时，因沙箱无外网访问 `registry.npmjs.org` 而失败
- 因此本轮没有在当前环境上完成一次标准的 `pnpm install --frozen-lockfile` 复验
- 为避免 `pnpm 8` 忽略现有 lockfile 并尝试重解依赖，本轮对 `pnpm-lock.yaml` 采用了最小手工同步，只移除了 `apps/e2e/phase94` importer

## Deviations From Plan

1. 没有在当前环境上完成标准 `pnpm 10.13.1` lockfile 自动刷新。
   - 原因：`pnpm 10.13.1` 需要通过 `corepack` 下载，但沙箱没有外网访问能力。
   - 结果：对 [pnpm-lock.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml) 采用最小手工修正。

2. 没有运行完整的手工 UAT 或 `phase94` browser 测试。
   - 原因：本任务目标是移出默认自动面，而不是重新执行 Playwright/Synpress 流程。
   - 结果：仅验证了新的 manual 入口和文档边界。

## Completion Summary

- 默认 workspace 已不再自动带上 `apps/e2e/phase94`
- 根目录已明确暴露 `scripts/ci/*` 的自动化入口
- `phase94` 已被收口为显式 manual toolkit
- 部署 / handoff runbook 已同步为“CI 自动 + 手工验证”口径
