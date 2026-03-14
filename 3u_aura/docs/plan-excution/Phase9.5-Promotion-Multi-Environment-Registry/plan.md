# Plan: Phase 9.5 - Promotion Multi-Environment Registry

## 1. Objective
建立一套可审计、可切换、可复用、跨环境无共享状态的 promotion 多环境配置体系，覆盖 `uat-mockusdt`、`testnet-live`、`release` 三类环境，并为每个环境提供独立数据库、Redis/BullMQ 隔离、端口与产物命名空间；同时为 `uat-mockusdt` 提供独立的 MockUSDT 合约组、环境清单、运行时加载和自动化测试输入。

## 2. Scope
- 设计并落地 promotion 环境目录结构与 manifest 契约
- 明确 public manifest、private secrets、infra env、e2e fixtures 的边界
- 为 `apps/contracts`、`apps/server`、`apps/dapp`、`apps/admin` 提供统一环境映射方案
- 为三类环境规划独立数据库：
  - `3u_aura_uat_mockusdt`
  - `3u_aura_testnet_live`
  - `3u_aura_release`
- 为三类环境规划独立 Redis/BullMQ 隔离面：
  - 独立 Redis DB 或独立实例
  - 独立 BullMQ prefix / queue namespace
  - 独立 throttler / cache key space
- 为三类环境规划独立运行端口与前端 API base
- 为 `uat-mockusdt` 新增独立部署与资金准备流程
- 为自动化 UAT 提供可直接消费的环境输出
- 补充 runbook、manifest 模板、执行记录模板与验证命令

## 3. Out of Scope
- 修改 promotion 核心业务规则
- 主网正式发布流程
- 把所有运维逻辑做成完整 CI/CD 平台
- 引入新的权限模型或重新设计 admin RBAC
- 改写 check-in `3 USDT` / purchased NFT `1000` 价格口径

## 4. Assumptions
- 当前 `Phase9.4` 已完成一套 `chainId = 97` 的真实 testnet-live 地址接线，但尚未完成全部 UAT 闭环
- `apps/contracts` 现有部署脚本仍使用 Foundry + `.env` 输入
- `apps/server`、`apps/dapp`、`apps/admin` 当前都直接从各自 `.env` / `NEXT_PUBLIC_*` 读取 promotion 配置
- `uat-mockusdt` 与 `testnet-live` 应共享同一条链（`97`）但使用不同地址集合
- 自动化 UAT 需要稳定、可控、可重复 mint/fund 的支付代币，因此 `MockUSDT` 是首选
- secrets 不应写入版本化 manifest，也不应跨 app 混放
- 环境切换不只切合约地址，也必须切换数据库与相关持久化上下文
- 环境切换若要做到近似无风险，必须同时切换：
  - 数据库
  - Redis / BullMQ
  - server 端口 / host
  - dapp/admin 的 API base 与构建输入
  - 报告、artifact、broadcast 等输出目录命名空间

## 5. Architecture Impact

### 5.1 Affected Modules
- `apps/contracts/script/DeployNFTCore.s.sol`
- `apps/contracts/script/DeploySettlementClaim.s.sol`
- `apps/contracts/src/mocks/MockUSDT.sol`
- `apps/contracts/.env.example`
- `apps/server/src/app.module.ts`
- `apps/server/src/configuration/config.configuration.ts`
- `apps/server/prisma.config.ts`
- `apps/server/.env.example`
- `apps/dapp/src/lib/promotion-contracts.ts`
- `apps/dapp/src/lib/wagmi-config.tsx`
- `apps/dapp/.env.example`
- `apps/admin/src/lib/wagmi-config.tsx`
- `apps/admin/.env.example`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`

### 5.2 New Configuration Surface
- `config/promotion-envs/uat-mockusdt/`
- `config/promotion-envs/testnet-live/`
- `config/promotion-envs/release/`
- `config/promotion-envs/<env>/manifest.json`
- `config/promotion-envs/<env>/contracts.public.env`
- `config/promotion-envs/<env>/server.public.env`
- `config/promotion-envs/<env>/dapp.public.env`
- `config/promotion-envs/<env>/admin.public.env`
- `config/promotion-envs/<env>/notes.md`
- `config/promotion-envs/<env>/wallets.example.json`

### 5.3 Separation Rules
- public manifest:
  - chainId
  - RPC URL
  - contract addresses
  - role addresses
  - promotion business parameters
  - deployment txHash / artifact references
- private secrets:
  - broadcaster private key
  - referral signer private key
  - JWT secrets
  - database credentials
  - WalletConnect project id if treated as secret in this repo
- infra env:
  - DB / Redis / Bull / ports / hostnames
- database isolation:
  - `uat-mockusdt`、`testnet-live`、`release` 各自独立 `DATABASE_URL`
  - 同步隔离 Redis logical DB / instance
  - 同步隔离 BullMQ prefix / queue namespace
  - 同步隔离 cache / throttler key space
  - 不允许自动化 UAT 与手工 testnet-live 共用业务库
- runtime isolation:
  - 每环境独立 server port
  - 每环境独立 `NEXT_PUBLIC_API_BASE_URL`
  - 每环境独立报告、artifact、broadcast 记录目录或命名标签
- e2e fixtures:
  - wallet addresses
  - balance thresholds
  - role mapping
  - report/artifact paths

## 6. Risks
- 前端是 build-time 环境读取，若误以为运行时切换即可生效，会得到伪切换结果
- Prisma CLI 与 Nest runtime 当前并非同一套环境加载机制，若只改 server runtime 会造成 migration/seed 漂移
- `MockUSDT` 环境如果没有同时处理 `MerkleClaim.depositRewards()` 与 `Settlement.publishSubsidyEpoch()` 的资金前置，claim 自动化仍会失败
- 多环境若共用 DB / Redis，自动化 UAT 会污染当前手工联调数据
- 若只切 promotion 地址但不切数据库，会导致 eligibility / check-in / claim / reward 数据跨环境串库
- 若 Redis / BullMQ 不切，会导致队列任务、缓存、签名消息、限流状态跨环境串用
- 若端口和前端 API base 不切，前端可能连到错误后端形成“看似切换成功、实则串环境”
- 继续混放 secrets 到 tracked env/template，会扩大泄露面
- `release` 若误指向 `MockUSDT` 地址，会形成高风险错误部署

## 7. Milestones

### Milestone 1 — Environment Model And Manifest Schema Freeze
**Goal**
- 冻结 promotion 多环境模型、命名、目录结构、字段契约与边界规则。

**Affected files/modules**
- `docs/plan-excution/Phase9.5-Promotion-Multi-Environment-Registry/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/*`
- `config/promotion-envs/*`（模板）

**Implementation notes**
- 明确至少三种环境：
  - `uat-mockusdt`
  - `testnet-live`
  - `release`
- 明确 manifest 需要覆盖：
  - promotion chainId / rpcUrl
  - payment token / nft sale / merkle claim / settlement
  - finance wallet / check-in receiver / referral signer address
  - promotion startAt / timezone / epochLengthDays / ticketStreakDays / minimumParticipants / referralSignatureTtlSeconds
  - deployment txHash / artifact path / notes
- 明确不进入 manifest 的 secrets 名单。

**Risks**
- schema 未冻结就进入 loader 实现，会导致后续反复迁移环境字段。

**Verification commands**
- `rg -n "PROMOTION_|NEXT_PUBLIC_|USDT_ADDRESS|REFERRAL_SIGNER_ADDRESS" /Users/ygg/vs/ai/3U/3u_aura/apps /Users/ygg/vs/ai/3U/3u_aura/docs`

**Expected outputs**
- 一份明确的 manifest schema 与目录契约
- 一份 secrets / public / infra / fixture 分层规则

### Milestone 2 — Public Config Registry And Secret Boundary
**Goal**
- 新增版本化环境目录，并建立从 manifest 到各 app public env 文件的映射。

**Affected files/modules**
- `config/promotion-envs/<env>/*`
- `apps/contracts/.env.example`
- `apps/server/.env.example`
- `apps/dapp/.env.example`
- `apps/admin/.env.example`

**Implementation notes**
- 每个环境目录至少包含：
  - `manifest.json`
  - `contracts.public.env`
  - `server.public.env`
  - `dapp.public.env`
  - `admin.public.env`
  - `notes.md`
- 为 `uat-mockusdt` 增加 `wallets.example.json`
- `.env.example` 改为引用环境生成后的目标变量，不再承担“跨环境总表”角色。
- 在环境目录内记录数据库命名约定与用途：
  - `3u_aura_uat_mockusdt`
  - `3u_aura_testnet_live`
  - `3u_aura_release`
- 在环境目录内记录 Redis / BullMQ / 端口命名约定与用途：
  - Redis DB / URL
  - BullMQ prefix
  - server port
  - dapp/admin API base

**Risks**
- 若 public env 与 manifest 双写不一致，仍会回到当前手工同步问题。

**Verification commands**
- `find /Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs -maxdepth 2 -type f | sort`
- `jq '.environment, .promotion.chainId, .contracts' /Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/uat-mockusdt/manifest.json`

**Expected outputs**
- 三套环境都有统一目录与 public config 文件
- secrets 不再进入 tracked manifest
- 三套环境的数据库命名与职责边界明确
- 三套环境的 Redis / BullMQ / 端口命名与职责边界明确

### Milestone 3 — Database Isolation And Persistence Wiring
**Goal**
- 为三套环境建立独立数据库、Redis、BullMQ 持久化接线，并统一 server runtime、Prisma CLI、seed/migration 的环境来源。

**Affected files/modules**
- `apps/server/prisma.config.ts`
- `apps/server/src/app.module.ts`
- `apps/server/src/configuration/config.configuration.ts`
- `apps/server/src/configuration/config.types.ts`
- `apps/server/.env.example`
- `config/promotion-envs/<env>/server.public.env`
- `scripts/promotion-env/*`

**Implementation notes**
- 每个环境使用独立数据库：
  - `3u_aura_uat_mockusdt`
  - `3u_aura_testnet_live`
  - `3u_aura_release`
- loader 必须同时为以下入口提供一致的 `DATABASE_URL / DATABASE_HOST / DATABASE_PORT / DATABASE_NAME`：
  - Nest runtime
  - Prisma CLI
  - seed script
- 若 Redis/Bull 不单独分实例，至少要提供逻辑隔离策略：
  - cache Redis DB / URL
  - throttler Redis DB / URL
  - BullMQ prefix / queue namespace
- 建议默认环境矩阵：
  - `uat-mockusdt`: `DB=3u_aura_uat_mockusdt`
  - `testnet-live`: `DB=3u_aura_testnet_live`
  - `release`: `DB=3u_aura_release`
- 同时补充运行端口矩阵，避免本地并行启动串环境：
  - `uat-mockusdt`: server/dapp/admin 独立端口
  - `testnet-live`: server/dapp/admin 独立端口
  - `release`: server/dapp/admin 独立端口
- `uat-mockusdt` 的数据库迁移不应影响当前 `testnet-live`。

**Risks**
- 只隔离数据库名但不隔离 Prisma CLI 入口，migration 仍可能打到错误库。
- 只隔离数据库但不隔离 Redis/BullMQ，会出现跨环境 job/counter/cache 污染。

**Verification commands**
- `pnpm tsx /Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/print-env.ts --env uat-mockusdt --target server`
- `pnpm tsx /Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/print-env.ts --env testnet-live --target server`
- `pnpm tsx /Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/print-env.ts --env release --target server`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec prisma validate --schema prisma/schema.prisma`

**Expected outputs**
- 三套环境各自指向独立数据库
- 三套环境各自指向独立 Redis/BullMQ namespace
- server runtime / Prisma CLI / seed 使用同一环境解析结果

### Milestone 4 — Loader / Generator For Contracts, Server, DApp, Admin
**Goal**
- 让四端都能以 `PROMOTION_ENV=<name>` 选择环境，并生成各自需要的运行变量。

**Affected files/modules**
- `apps/server/src/app.module.ts`
- `apps/server/prisma.config.ts`
- `apps/server/src/configuration/config.configuration.ts`
- `apps/dapp/src/lib/promotion-contracts.ts`
- `apps/dapp/src/lib/wagmi-config.tsx`
- `apps/admin/src/lib/wagmi-config.tsx`
- `scripts/promotion-env/*`（new）

**Implementation notes**
- server:
  - 统一 runtime 与 Prisma CLI 的环境入口
  - 支持 `.env.local` 覆盖 secrets
  - 支持 per-env `CACHE_URL / THROTTLER_REDIS / BULL_* / PORT / HOST`
- dapp/admin:
  - 提供由 manifest 生成 `NEXT_PUBLIC_*` 的构建前步骤
  - 明确“切环境需重启/重建”
  - 切环境时同步切换 `NEXT_PUBLIC_API_BASE_URL`
- contracts:
  - 提供 manifest -> forge deploy env 的导出脚本
- loader 必须对 `release` 做禁止项校验：
  - 不能引用 `MockUSDT`
  - 不能引用 testnet-only RPC

**Risks**
- 不统一 Prisma 与 server 的环境源，会再次出现 CLI/runtime 不同库的问题。

**Verification commands**
- `pnpm tsx /Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/print-env.ts --env uat-mockusdt --target server`
- `pnpm tsx /Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/print-env.ts --env testnet-live --target dapp`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec prisma validate --schema prisma/schema.prisma`

**Expected outputs**
- 四端都可从同一环境源生成自身所需变量
- `PROMOTION_ENV` 成为环境选择入口，而不是孤立标识位
- 环境切换时 DB / Redis / BullMQ / API base / 端口一起切换

### Milestone 5 — UAT MockUSDT Deployment And Funding Workflow
**Goal**
- 部署独立的 `uat-mockusdt` 合约组，并形成可重复的资金准备和角色绑定流程。

**Affected files/modules**
- `apps/contracts/src/mocks/MockUSDT.sol`
- `apps/contracts/script/DeployNFTCore.s.sol`
- `apps/contracts/script/DeploySettlementClaim.s.sol`
- `scripts/promotion-env/*`
- `config/promotion-envs/uat-mockusdt/*`

**Implementation notes**
- `uat-mockusdt` 至少包含一套新地址：
  - MockUSDT
  - FounderNFT
  - NFTSale
  - Settlement
  - MerkleClaim
- 必须记录：
  - deploy txHash
  - owner / finance / receiver / publisher / signer 地址
  - MockUSDT mint/funding 步骤
- 要补 claim 资金前置：
  - `MerkleClaim.depositRewards()`
  - `Settlement.publishSubsidyEpoch()`
- 使用独立数据库 `3u_aura_uat_mockusdt`，避免污染 `testnet-live`。
- 使用独立 Redis/BullMQ namespace，避免自动化任务污染 `testnet-live`。
- 使用独立 server/dapp/admin 端口，允许与 `testnet-live` 并行对照运行。

**Risks**
- 只部署新 token 和 sale，不补 funding/publisher 流程，后续 claim 自动化仍然不可用。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge script script/DeployNFTCore.s.sol:DeployNFTCore --rpc-url $BSC_TESTNET_RPC_URL --broadcast`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge script script/DeploySettlementClaim.s.sol:DeploySettlementClaim --rpc-url $BSC_TESTNET_RPC_URL --broadcast`

**Expected outputs**
- 一套独立的 `uat-mockusdt` 合约环境
- claim / settlement / buyNFT / check-in 所需 token 资金可控
- `uat-mockusdt` 与 `testnet-live` 在数据层和队列层互不污染

### Milestone 6 — Automation / Documentation / Operational Handoff
**Goal**
- 让 `automation-e2e-uat`、手工 UAT 与 deployment manifest 都能消费这套环境体系。

**Affected files/modules**
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/*`
- `apps/e2e/phase94/**/*`（审批后）
- `scripts/uat/*`

**Implementation notes**
- 自动化钱包 fixture 只引用环境目录中的地址与 privateKeyEnv
- report 中要记录当前环境名与 manifest version
- deployment manifest 文档区分：
  - `testnet-live`
  - `uat-mockusdt`
- 提供最小 runbook：
  - 切环境
  - 启动服务
  - 执行部署
  - mint/fund
  - 运行自动化
  - 校验当前 DB / Redis / BullMQ / API base 是否属于目标环境

**Risks**
- 若文档不区分 `testnet-live` 与 `uat-mockusdt`，后续 txHash 审计会混乱。

**Verification commands**
- `rg -n "uat-mockusdt|testnet-live|release" /Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution /Users/ygg/vs/ai/3U/3u_aura/apps/e2e`
- `./scripts/uat/run-phase94-e2e.sh`

**Expected outputs**
- 自动化与手工 UAT 都基于同一环境体系运行
- 运行与审计文档完整

## 8. Approval Checkpoint
该任务属于 `Major/Critical`：
- 涉及支付代币、claim、deployment、环境装配、自动化资金链路
- 在 `plan.md` 获批前，不进入任何实现、部署、重配、重发合约步骤

## 9. Rollback / Recovery Notes
- 配置目录、loader、脚本、env 模板应尽量独立，不直接破坏现有 `Phase9.4` 环境
- `testnet-live` 现有地址集保持只读，不在本任务中强制替换
- `uat-mockusdt` 失败时可整体停用，不影响当前手工 UAT 环境
- 若 loader 方案不稳定，可先保留 manifest-only 阶段，再回退到手工导出 env

## 10. Final Verification Checklist
- [ ] `config/promotion-envs/` 三套环境目录就绪
- [ ] manifest schema 已冻结并包含 promotion 所需全部非敏感字段
- [ ] secrets / infra / fixture / public config 已明确分层
- [ ] `uat-mockusdt / testnet-live / release` 各自拥有独立数据库
- [ ] `uat-mockusdt / testnet-live / release` 各自拥有独立 Redis / BullMQ namespace
- [ ] 环境切换时 server port / `NEXT_PUBLIC_API_BASE_URL` 同步切换
- [ ] `PROMOTION_ENV=<name>` 可为 server / prisma / dapp / admin / contracts 生成对应变量
- [ ] `uat-mockusdt` 有独立部署地址、funding 流程与 artifact 记录
- [ ] `testnet-live` 现有环境不被破坏
- [ ] 自动化 UAT 可读取环境目录并标记当前环境名
- [ ] `execution.md` 记录真实命令、验证结果与偏差
