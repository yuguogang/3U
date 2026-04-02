# CI + Manual Verification Only

## 1. Objective

把仓库当前的“自动 UAT 能力”从默认开发 / 默认 CI 路径中解耦，避免 `apps/e2e/phase94` 持续拖慢依赖安装与校验速度；保留 `scripts/ci/*` 作为自动化门禁，并把 `apps/e2e/phase94` 明确降级为按需手工验证工具链。

## 2. Scope

### 2.1 In Scope

- 调整默认 workspace / 默认验证入口，使 `apps/e2e/phase94` 不再属于仓库默认自动校验面
- 保留并澄清 `scripts/ci/*` 作为自动化 CI 验证路径
- 为手工验证保留清晰、可执行的入口与文档说明
- 记录这次改动的验证结果与任何环境限制

### 2.2 Touched Modules

- [pnpm-workspace.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-workspace.yaml)
- [package.json](/Users/ygg/vs/ai/3U/3u_aura/package.json)
- [apps/e2e/phase94/package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/package.json)
- `docs/runbooks/*` 中涉及手工 UAT / manual verification 的文档
- 如有必要，补充 `apps/e2e/phase94` 局部说明文档

## 3. Out Of Scope

- 不删除 `apps/e2e/phase94` 现有测试资产、钱包编排脚本或 `scripts/uat/*`
- 不改动业务逻辑、合约逻辑、奖励/结算逻辑或任何高风险资金路径
- 不新增新的自动化 E2E/UAT 门禁
- 不处理仓库外部、当前代码库中不可见的 CI 平台配置

## 4. Assumptions

### 4.1 Product / Delivery Assumptions

- 当前目标是“`CI` 自动 + `Manual Verification` 手工”，不是彻底删除 UAT 资产
- 自动 UAT 的主要问题是执行和依赖体积拖慢迭代速度，而不是业务覆盖本身完全失效
- 手工验证仍然需要保留，用于发版前或环境 bring-up 后的显式人工确认

### 4.2 Technical Assumptions

- `apps/e2e/phase94` 当前未被仓库内可见的根级 CI workflow 直接引用，但其作为 workspace member 仍会放大安装/解析成本
- `scripts/ci/*` 与 `apps/e2e/phase94` 已是两套独立路径，前者可继续承担自动化校验职责
- 手工 UAT 可以接受“按需安装 / 按需执行”的额外步骤，只要入口明确

### 4.3 Risk Assumptions

- 本任务属于 `Major`
- 若仅重命名脚本、不移出默认 workspace，性能收益可能不足
- 若直接删除 `apps/e2e/phase94`，会丢失现有手工验证资产，blast radius 偏大

## 5. Architecture Impact

### 5.1 Current Constraints

- [pnpm-workspace.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-workspace.yaml) 当前显式包含 `apps/e2e/*`
- [apps/e2e/phase94/package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/package.json) 当前保留 `test:uat`、`test:weekly-fork` 等自动 UAT 入口，并依赖 `@playwright/test` + `@synthetixio/synpress`
- 只读调研中，`apps/e2e/phase94` 目录体积约 `571M`
- 仓库内已有手工验证 runbook：
  - [testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
  - [testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
- `scripts/ci/run.mjs` 与 `scripts/ci/run-all.mjs` 当前不依赖 `apps/e2e/phase94`

### 5.2 Preferred Target Architecture

- 默认 workspace 与默认门禁只覆盖：
  - `apps/*` 主业务应用
  - `packages/*` shared packages
  - `scripts/ci/*` 自动化校验脚本
- `apps/e2e/phase94` 保留在仓库中，但从“默认自动验证面”改成“手工验证工具箱”
- 手工验证路径必须显式写清：
  - 什么时候用
  - 需要先做什么准备
  - 跑哪些命令
  - 不再作为默认 CI 门禁

### 5.3 Option Decision

- 方案 A：仅把文案改成“手工”，但继续保留 `apps/e2e/phase94` 在默认 workspace
  - 优点：改动最小
  - 缺点：速度收益有限
- 方案 B：把 `apps/e2e/phase94` 从默认 workspace/默认入口移出，但保留代码和手工 runbook
  - 优点：性能收益最直接，同时保留手工验证资产
  - 缺点：手工 UAT 会多一步显式安装/进入目录
- 方案 C：彻底删除自动 UAT 代码
  - 优点：仓库最干净
  - 缺点：风险最高，回滚与手工验证能力都变弱

本计划默认采用方案 B。

## 6. Milestones

## 6.1 Milestone A: Remove Automatic UAT From Default Workspace / Entry Surface

### goal

让根仓库默认安装与默认验证路径不再自动携带 `apps/e2e/phase94`。

### affected files/modules

- [pnpm-workspace.yaml](/Users/ygg/vs/ai/3U/3u_aura/pnpm-workspace.yaml)
- [package.json](/Users/ygg/vs/ai/3U/3u_aura/package.json)
- [apps/e2e/phase94/package.json](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/package.json)

### implementation notes

- 优先把 `apps/e2e/phase94` 从默认 workspace membership 中解耦
- 如需保留 root 层入口，应改成显式 `manual` 语义，避免继续暗示这是默认 CI 任务
- 避免删除现有 UAT 脚本，只做入口收缩和命名澄清

### risks

- 若 `pnpm` workspace 收缩方式不当，可能影响按需进入 `apps/e2e/phase94` 的手工执行体验
- 若只改一半入口，团队仍可能误把旧脚本当默认门禁

### verification commands

- `sed -n '1,80p' pnpm-workspace.yaml`
- `sed -n '1,120p' apps/e2e/phase94/package.json`
- `rg -n "apps/e2e|test:uat|test:weekly-fork" pnpm-workspace.yaml package.json apps/e2e/phase94/package.json`

### expected outputs

- 默认 workspace 不再把 `apps/e2e/phase94` 视为常规成员
- 自动 UAT 脚本不再表现为默认测试入口

## 6.2 Milestone B: Preserve Explicit Manual Verification Path

### goal

把手工验证路径留住并写清，避免移除自动 UAT 后出现“没人知道怎么验”的空窗。

### affected files/modules

- [testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
- [testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
- 如有必要，新增 `apps/e2e/phase94` 局部说明文档

### implementation notes

- 明确区分：
  - `CI`: `scripts/ci/*`
  - `Manual verification`: `apps/e2e/phase94` / `scripts/uat/*`
- 明确自动 UAT 不再作为默认交付要求
- 手工 runbook 需要给出最短可执行路径，而不是泛泛描述

### risks

- 文档更新不完整会导致操作者仍按旧自动 UAT 预期执行
- 手工路径若缺少前置步骤，真正需要时会重新卡住

### verification commands

- `rg -n "Manual UAT|manual verification|CI|phase94|test:uat|test:weekly-fork" docs/runbooks apps/e2e/phase94 -g '!**/node_modules/**'`

### expected outputs

- runbook 清楚说明“默认自动验证只有 CI，UAT 改为手工执行”
- 手工验证路径仍可追踪、可执行

## 6.3 Milestone C: CI Boundary Sanity Check

### goal

确认保留下来的自动化边界只剩 `scripts/ci/*`，并记录可实际运行的最小验证。

### affected files/modules

- [scripts/ci/run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs)
- [scripts/ci/run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs)
- 如需同步说明，则更新相关文档

### implementation notes

- 不扩展 `scripts/ci/*` 的职责，只确认它没有重新耦合 `apps/e2e/phase94`
- 记录当前 shell 对 `pnpm` 的可用性限制，避免把无法复现的命令写成“已验证通过”

### risks

- 如果本机没有可用 `pnpm`，完整脚本执行验证可能需要降级为语法/入口检查
- 仓库外部 CI 若仍调用旧命令，需要由后续实际流水线配置同步

### verification commands

- `node --check scripts/ci/run.mjs`
- `node --check scripts/ci/run-all.mjs`
- `rg -n "phase94|playwright|synpress|test:uat|test:weekly-fork" scripts/ci -g '!**/node_modules/**'`

### expected outputs

- `scripts/ci/*` 的自动化入口保持清晰、独立
- `execution.md` 中明确写出哪些验证已跑、哪些因环境受限未跑

## 7. Approval Checkpoint

在你批准本计划前，不进入任何实现改动。

批准后按以下顺序执行：

1. 收缩默认 workspace / 默认自动入口
2. 补齐手工验证说明
3. 运行可执行的最小 CI sanity check
4. 把真实结果补进 `execution.md`

如果你希望改成“彻底删除 `apps/e2e/phase94`”，需要先更新本计划再实施。

## 8. Rollback / Recovery Notes

- 若 workspace 收缩导致团队短期无法执行手工 UAT，可先回滚 `pnpm-workspace.yaml` 与相关脚本命名变更
- 若文档调整引起误解，可保留新旧命令映射一轮，但必须把旧入口标记为 deprecated/manual-only
- 任何回滚都不应触碰 `scripts/ci/*` 的既有自动化边界

## 9. Final Verification Checklist

- [ ] 默认 workspace / 默认入口不再暗含自动 UAT
- [ ] `apps/e2e/phase94` 仍保留为手工验证工具链
- [ ] `scripts/ci/*` 仍是唯一保留的自动化验证面
- [ ] runbook 已明确“CI + 手工验证”的新交付口径
- [ ] `execution.md` 已记录真实命令、结果与任何环境限制
