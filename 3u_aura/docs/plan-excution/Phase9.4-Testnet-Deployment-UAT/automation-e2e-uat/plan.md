# Plan: Phase 9.4 Automation E2E UAT (Playwright + Synpress + 5 Wallets)

## 1. Objective
在 `chainId=97` 环境建立一套可重复执行的自动化 UAT 框架，使用 `Playwright + Synpress + 5` 个测试钱包，覆盖 Phase9.4 关键链路，并输出可审计证据（日志、截图、txHash、接口响应）。

## 2. Scope
- 在仓库内新增 E2E 自动化测试目录与运行脚本
- 集成 Synpress（MetaMask/钱包签名）与 Playwright（页面与 API 断言）
- 支持 5 个测试钱包角色编排：
  - admin
  - inviter
  - invitee
  - buyer
  - spare/recovery
- 覆盖可自动化的核心路径：
  - 钱包登录
  - inviter bind / placement
  - check-in 提交与接口结果校验
  - purchased NFT buy 路径校验
  - admin 侧审批动作校验
  - claim 读取与 sync-back 接口校验（在数据前置满足时）
- 输出统一 artifacts 目录（trace/screenshot/video/json 报告）

## 3. Out of Scope
- 绕过链上前置条件的业务逻辑改造
- 人工审批策略重设计
- 生产环境自动化执行
- 主网钱包或真实生产私钥接入

## 4. Assumptions
- 本地服务可稳定运行：
  - `dapp` at `3000`
  - `admin` at `3001`
  - `server` at `3010`
- `apps/server/.env`、`apps/dapp/.env`、`apps/admin/.env` 已对齐 `97` 链配置
- 已有独立测试钱包与 testnet 资金（BNB/USDT）
- 允许在本地仅使用测试私钥，并通过 `.env.local` / CI secret 注入
- 钱包编排采用你指定的关系：
  - `referrer -> userA`
  - `userA -> checkin -> buy NFT -> claim`
- 每个测试钱包初始 `gas >= 0.1 BNB`
- `referrer` 钱包初始 `USDT >= 1000`

## 5. Architecture Impact
- `apps/dapp-e2e` (new) 或 `apps/dapp/tests/e2e` (repo pattern 待确认)
- `apps/admin` E2E page objects / fixtures
- `scripts/uat/` 运行编排脚本（启动服务、注入钱包、收集 artifacts）
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`

## 5.1 Directory Contract (Proposed)
- `apps/e2e/phase94/`
- `apps/e2e/phase94/specs/`
- `apps/e2e/phase94/fixtures/wallets/`
- `apps/e2e/phase94/fixtures/wallets/admin.json`
- `apps/e2e/phase94/fixtures/wallets/referrer.json`
- `apps/e2e/phase94/fixtures/wallets/userA.json`
- `apps/e2e/phase94/fixtures/wallets/userB.json`
- `apps/e2e/phase94/fixtures/wallets/userC.json`
- `apps/e2e/phase94/reports/`
- `apps/e2e/phase94/reports/uat-report.json`
- `apps/e2e/phase94/reports/artifacts/`

## 5.2 Wallet Fixture Contract
- 单个钱包文件字段（json）：
  - `name`
  - `address`
  - `privateKeyEnv`
  - `initialBnbMin`
  - `initialUsdtMin`
  - `role`
- 私钥不进仓库明文，统一用 `privateKeyEnv` 引用环境变量
- `wallets/*.json` 仅保存地址与阈值，不保存真实私钥

## 5.3 Report Contract
- 输出文件：`apps/e2e/phase94/reports/uat-report.json`
- 最小记录结构（逐步骤 append）：
```json
{
  "test": "checkin",
  "wallet": "0xabc",
  "txHash": "0x123",
  "result": "success"
}
```
- 扩展字段（推荐）：
  - `timestamp`
  - `chainId`
  - `step`
  - `apiStatus`
  - `uiCheckpoint`
  - `error`

## 6. Milestones

### Milestone 1 — Harness Scaffolding
Goal
- 建立 Playwright + Synpress 基础工程，跑通单钱包登录 smoke。

Affected files/modules
- `package.json` / workspace 配置
- `playwright.config.*`
- Synpress config / fixture
- `scripts/uat/*`
- `apps/e2e/phase94/**/*`

Implementation notes
- 明确浏览器 profile 管理与钱包导入方式
- 固定 baseURL 与 API URL 读取逻辑
- 统一 `artifacts/uat/<timestamp>` 输出
- 创建 `wallets/*.json` 模板与 `reports/uat-report.json` 初始化器

Risks
- 浏览器扩展加载不稳定导致测试 flaky

Verification commands
- `pnpm -C <e2e-project> test --grep @smoke-login`

Expected outputs
- 单用例稳定通过，产出 trace + screenshot

### Milestone 2 — Multi-Wallet Role Orchestration
Goal
- 支持 5 钱包并行/串行角色切换与数据隔离。

Affected files/modules
- wallet fixture
- test data registry
- environment template
- funding precheck script

Implementation notes
- 使用显式 role->wallet 映射，禁止在测试中硬编码私钥
- 每次 run 生成独立 run-id，避免数据串扰
- 启动前先执行资金校验：
  - 每钱包 `BNB >= 0.1`
  - `referrer USDT >= 1000`

Risks
- 钱包状态污染导致测试互相影响

Verification commands
- `pnpm -C <e2e-project> test --grep @wallet-orchestration`

Expected outputs
- 5 钱包初始化成功，角色可重复复用

### Milestone 3 — Core Promotion Flows Automation
Goal
- 自动覆盖 Phase9.4 可自动化主路径。

Affected files/modules
- dapp page objects
- admin page objects
- API assertion helpers
- report writer (`uat-report.json`)

Implementation notes
- 每条链路输出关键证据：
  - wallet
  - txHash
  - response snapshot
  - 页面关键状态
- 对依赖前置数据的用例加 `precondition` gate，无法满足时标记 `blocked` 而非误判失败
- 固定主链路：
  - `referrer` 登录
  - `userA` 登录 + bind `referrer`
  - `referrer` 执行 placement(`userA`)
  - `userA` checkin
  - `userA` buy NFT
  - `userA` claim

Risks
- 链上确认时间波动导致 timeout

Verification commands
- `pnpm -C <e2e-project> test --grep @phase94-core`

Expected outputs
- 关键路径在自动化框架内可重复执行并产出证据

### Milestone 4 — CI/Local Runner And Report Contract
Goal
- 固化本地一键执行与报告格式，供 `execution.md` 直接引用。

Affected files/modules
- `scripts/uat/run-phase94-e2e.*`
- report json schema
- docs/runbook

Implementation notes
- 统一 exit code 语义：
  - 0: pass
  - 1: fail
  - 2: blocked/precondition unmet
- 统一 report 语义：
  - `success`: 断言通过且链路完整
  - `failed`: 断言失败
  - `blocked`: 前置条件不满足（例如 claim 数据未发布）

Risks
- CI 环境钱包扩展权限与本地不一致

Verification commands
- `./scripts/uat/run-phase94-e2e.sh`

Expected outputs
- 一份 machine-readable 报告与一份人类可读摘要

## 7. Approval Checkpoint
本计划属于 `Major/Critical`（涉及资金链路、claim、eligibility），需你确认后再进入实现阶段。

## 8. Rollback / Recovery Notes
- 自动化相关改动独立在测试目录，不直接修改生产业务逻辑
- 若引入不稳定依赖，可仅回滚 e2e 模块与脚本，不影响主应用运行

## 9. Final Verification Checklist
- [ ] Playwright + Synpress 能稳定启动并导入测试钱包
- [ ] 5 钱包角色映射无硬编码泄露
- [ ] 至少 1 条完整登录+团队链路自动化通过
- [ ] 至少 1 条 admin 审批链路自动化通过
- [ ] 报告包含 txHash/API 证据并可回溯
- [ ] `execution.md` 记录真实命令与结果
- [ ] `wallets/*.json` 与 `reports/uat-report.json` 目录契约落地
- [ ] 资金前置检查（`0.1 BNB` / `1000 USDT`）在测试前自动校验

## 10. Preparation Flow (Before First Run)
1. 填写 `wallets/*.json` 的地址与角色映射。
2. 在 `.env.local` 或运行环境注入 5 个私钥环境变量。
3. 执行 funding precheck，确认：
   - 5 钱包 gas 均 >= `0.1 BNB`
   - `referrer` 的 USDT >= `1000`
4. 启动 `server/dapp/admin` 并做 health check。
5. 清空旧 `reports/uat-report.json`，生成新 run header。
6. 执行自动化脚本并收集 artifacts。
7. 若 `blocked`，记录具体 precondition 缺失并退出码 `2`。
