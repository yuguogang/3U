# Plan: Phase 9.4 Automation E2E UAT (Playwright + Synpress + 5 Wallets)

## 1. Objective
在 `chainId=97` 环境建立一套可重复执行的自动化 UAT 框架，使用 `Playwright + Synpress + 5` 个测试钱包，覆盖 Phase9.4 关键链路，并输出可审计证据（日志、截图、txHash、接口响应）。

同时新增一套独立于 public testnet UAT 的“周流程自动化层”，使用 `fork + anvil + 可控 referenceAt` 覆盖不适合等待真实时间推进的链路：
- `publishSubsidyEpoch`
- `claimPurchasedSubsidy`
- weekly lottery / ranking / team incentive
- 每周 purchased NFT 补贴分红

同时补齐 `promotion env` 相关数据库的 Prisma schema 一致性，确保 `uat-mockusdt`、`testnet-live`、`release` 三个环境对仓库当前 `apps/server/prisma/schema.prisma` 的状态有明确、可审计的结论：已对齐、待对齐、或因前置条件阻塞而暂不可执行。

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
- 将 public `uat-mockusdt` 自动 UAT 基线限定为“实时主路径”：
  - 登录
  - bind / placement
  - check-in
  - buy NFT
  - buy 后 txHash -> server sync
- 新增独立的 `fork/anvil` 周流程自动化层：
  - 本地 fork testnet 状态
  - 控制链上时间与 `referenceAt`
  - 自动执行 weekly epoch / lottery / ranking / subsidy claim 相关验证
- 输出统一 artifacts 目录（trace/screenshot/video/json 报告）
- 审计 `uat-mockusdt`、`testnet-live`、`release` 的 Prisma migration / schema 状态
- 对可达且可运行的非空数据库执行非破坏性 schema 对齐与 migration baseline 修复
- 将跨环境 schema 对齐前置条件、阻塞项与真实验证结果记录进 `execution.md`

## 3. Out of Scope
- 绕过链上前置条件的业务逻辑改造
- 人工审批策略重设计
- 生产环境自动化执行
- 主网钱包或真实生产私钥接入
- 将 `release` 环境从 `planned` 激活为 `active`
- 对不可达数据库进行基础设施层排障（例如外部网络、宿主机端口策略、容器运行策略重构）
- 使用 `prisma migrate reset`、删库重建或其他破坏性方式“强行一致化”
- 把 weekly / subsidy / lottery / ranking 这类时间敏感流程继续硬塞进 public testnet UAT 主基线
- 依赖“链上自然过一周”作为自动化通过条件

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
- 本地 `PostgreSQL` 通过 `127.0.0.1:5433` 暴露，且对执行 Prisma 命令的上下文可达
- 若命令运行在受限沙箱中，访问本机 `127.0.0.1:5433` 可能需要额外授权；`P1001` 必须与本地 TCP 探测结果一起解释，不能直接等价为数据库宕机
- `release` 只有在 manifest 变为 runnable 且数据库可达后，才进入实际 schema 对齐步骤
- local fork runner 允许使用 `anvil` 连接 `chainId=97` 的 testnet RPC，并在本机暴露独立端口
- weekly 流程的 server 侧 epoch 推进可通过已有 `referenceAt` 参数或脚本显式驱动，而不是依赖宿主机真实时间等待
- fork 层允许使用测试 owner/publisher 私钥，为 `publishSubsidyEpoch`、root publish、claim 等链路注入资金与权限
- 若上游 `chainId=97` RPC 在 anvil fork 场景下持续返回 `missing trie node` 或无法稳定读取 promotion 合约状态，则允许回退为“本地 anvil 重新部署 promotion 合约 + 生成独立 manifest/wallet/runtime”的 weekly UAT 基座，但必须在 `execution.md` 中明确记录与 public testnet 的偏差

## 5. Architecture Impact
- `apps/dapp-e2e` (new) 或 `apps/dapp/tests/e2e` (repo pattern 待确认)
- `apps/admin` E2E page objects / fixtures
- `scripts/uat/` 运行编排脚本（启动服务、注入钱包、收集 artifacts）
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/migrations/*`
- `config/promotion-envs/*/manifest.json`
- `scripts/promotion-env/*`
- `apps/contracts/foundry.toml`
- `apps/contracts/script/*`
- `apps/server/scripts/sync-weekly-epoch.ts`
- `apps/e2e/phase94/src/**/*`
- `apps/e2e/phase94/tests/**/*`
- `scripts/uat/*`

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

### Milestone 5 — Promotion Env Prisma Reachability Audit
Goal
- 为 `uat-mockusdt`、`testnet-live`、`release` 建立 Prisma 一致性审计矩阵，先区分“schema 漂移”、“数据库不可达”、“环境配置不可运行”。

Affected files/modules
- `apps/server/prisma/schema.prisma`
- `config/promotion-envs/uat-mockusdt/manifest.json`
- `config/promotion-envs/testnet-live/manifest.json`
- `config/promotion-envs/release/manifest.json`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`

Implementation notes
- 统一使用 `scripts/promotion-env/run-with-env.mjs` + `prisma migrate status` 采集各环境状态。
- 对本地 `5433` 端口额外执行独立探测，避免把执行环境的 TCP 限制误判为 Postgres 故障。
- `release` 若仍为 `status=planned`，明确记录为“配置阻塞”，不进入实际 DB 修复。
- 所有结论必须带环境名、数据库名、真实错误码或真实阻塞原因。

Risks
- 将沙箱对 `127.0.0.1:5433` 的访问限制误判成数据库故障，导致错误修复方向。
- 在未确认 manifest 可运行前就尝试操作 `release`，会得到误导性失败。

Verification commands
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate status`
- `lsof -nP -iTCP:5433 -sTCP:LISTEN`
- `docker ps -a --filter name=aura_postgres --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'`
- `nc -vz 127.0.0.1 5433`

Expected outputs
- 一份三环境审计结论：
  - `up-to-date`
  - `drifted-but-repairable`
  - `blocked-unreachable`
  - `blocked-not-runnable`

### Milestone 6 — Reachable Env Prisma Baseline Alignment
Goal
- 对所有“可达且可运行”的非空数据库执行非破坏性 Prisma schema 对齐，并为已有 migrations 建立 baseline。

Affected files/modules
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/migrations/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/execution.md`

Implementation notes
- 非空库默认采用：
  - `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
  - 人工审阅 SQL
  - `prisma db execute --file <diff.sql>`
  - `prisma migrate resolve --applied <migration>`
- 禁止使用 `migrate reset` 或删除现有数据的方式求快。
- `uat-mockusdt` 已按该模式完成一次对齐，可作为执行模板；`testnet-live` 仅在数据库可达时执行；`release` 仅在 manifest runnable 且数据库可达时执行。
- 对每个环境单独确认数据库名，防止 baseline 应用到错误实例。

Risks
- 对错误环境执行 baseline，造成审计记录失真或真实数据结构被误改。
- diff SQL 在重复执行时可能非幂等，需要先确认目标环境当前状态。
- 将“schema 已一致”与“migrations 历史已 baseline”混为一谈，留下后续 deploy 隐患。

Verification commands
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --output /tmp/<env>_schema_diff.sql`
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma db execute --file /tmp/<env>_schema_diff.sql`
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate resolve --applied <migration_name>`
- `node scripts/promotion-env/run-with-env.mjs --target server --env <env> -- pnpm --dir apps/server exec prisma migrate status`
- `PROMOTION_ENV=uat-mockusdt pnpm --dir apps/e2e/phase94 run test:uat`

Expected outputs
- 所有可达且 active 的环境在 `prisma migrate status` 下报告 schema 已对齐。
- 所有未修复环境在 `execution.md` 中有精确阻塞原因，而不是模糊“未完成”。

### Milestone 7 — Fork/Anvil Weekly Flow Harness
Goal
- 建立独立于 public UAT 的本地 `anvil` 周流程测试底座，优先复用 `fork + anvil`；若 source RPC 不稳定，则切换为“本地重部署合约 + 生成独立环境”的可重复周流程基座，并继续支持链上时间推进与 server `referenceAt` 协同驱动。

Affected files/modules
- `apps/contracts/foundry.toml`
- `apps/contracts/script/*`
- `apps/e2e/phase94/package.json`
- `apps/e2e/phase94/src/runtime.ts`
- `apps/e2e/phase94/src/server-api.ts`
- `scripts/uat/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`

Implementation notes
- 新增本地 fork runner：
  - 从 `chainId=97` RPC fork
  - 使用独立本地端口，避免污染 public UAT 进程
  - 提供启动、停止、时间推进、状态重置脚本
- 为 fork 不稳定场景预留 fallback：
  - 在 clean anvil 上重新部署 `MockUSDT / FounderNFT / NFTSale / Settlement / MerkleDistributor`
  - 重新生成 `manifest.json`、钱包 fixtures、runtime 端口与 server/dapp/admin 公共环境
  - 保持 weekly suite 的 API/UI/链上断言接口不变，尽量只替换环境生成层
- 将 weekly 流程测试与 public `test:uat` 解耦：
  - public `test:uat` 继续只跑实时主路径
  - weekly 流程新增独立命令，例如 `test:weekly-fork`
- 统一注入以下可控参数：
  - 本地 fork RPC URL
  - owner / publisher / buyer 测试私钥
  - server `referenceAt`
- 复用现有 server 能力：
  - `WeeklyEpochApplicationService.syncEpochLifecycle(referenceAt)`
  - `AdminOps` 的 epoch preview / sync 能力
  - `apps/server/scripts/sync-weekly-epoch.ts`

Risks
- fork 状态与 public testnet 最新状态不完全一致，可能导致用例数据预期漂移。
- 若切换为本地 anvil 重部署，将失去“直接复用 testnet 最新链上状态”的属性；需要通过 `execution.md` 明确说明该周流程基座验证的是“当前仓库合约 + server 投影 + UI 交互”的一致性，而不是 public testnet 实时数据一致性。
- 若权限钱包或资金注入脚本设计不清晰，容易让 fork 用例变成不可重复的“手工拼接环境”。
- anvil 时间推进只覆盖链上时间，不覆盖 server 侧 `new Date()` 逻辑；必须同时显式控制 `referenceAt`。

Verification commands
- `anvil --fork-url <bsc-testnet-rpc> --port <fork-port>`
- `pnpm promotion-env:sync`
- `node scripts/promotion-env/deploy-contract-suite.mjs --env <fork-env>`
- `pnpm --dir apps/contracts test`
- `pnpm --dir apps/server exec tsx scripts/sync-weekly-epoch.ts --reference-at <iso-datetime>`
- `PROMOTION_ENV=<fork-env> pnpm --dir apps/e2e/phase94 run test:precheck`

Expected outputs
- 本地可重复启动/销毁的 fork 环境
- 一组独立于 public UAT 的 weekly-flow runner 命令
- 可审计的 fork 配置、端口、referenceAt、钱包角色记录

### Milestone 8 — Weekly Subsidy / Lottery / Ranking Automation On Fork
Goal
- 在 fork 层自动验证时间敏感周流程，不再依赖 public testnet 上自然形成的业务前置。

Affected files/modules
- `apps/e2e/phase94/tests/**/*`
- `apps/e2e/phase94/src/**/*`
- `apps/server/src/modules/admin/**/*`
- `apps/server/src/modules/epoch/**/*`
- `apps/server/src/modules/claims/**/*`
- `apps/contracts/src/Settlement.sol`

Implementation notes
- 最小优先链路：
  - buyer `buyNFT`
  - publisher `publishSubsidyEpoch`
  - buyer `sync purchased nft by txHash`
  - buyer `claimPurchasedSubsidy`
  - server `claims/sync`
- 第二优先链路：
  - weekly epoch sync
  - lottery qualification / settlement
  - ranking / team incentive settlement
- 对“最小参与门槛”明确拆成两类测试：
  - `insufficient-participants path`
    - 继续使用当前已构建的少量真实测试账户
    - 验证 `participantCount < minimumParticipants` 时的 rollover / no-settlement 分支
  - `threshold-met happy path`
    - 不依赖现有 5 个真实账户硬凑人数
    - 在 fork 初始化阶段额外生成或注入一批 synthetic participants，使 `participantCount >= minimumParticipants`
    - `minimumParticipants` 在 happy path 中保持真实配置，不为了省事下调阈值
- synthetic participants 的职责仅限于“构造 epoch 资格前置”，不承担需要 UI 观察的主角行为：
  - 可通过 setup script、隔离 seed、或专用 fixture 直接生成用户与 check-in 条件
  - 至少保留 1~2 个真实可控账户作为页面/claim 断言对象
- 断言必须分三层：
  - 链上合约状态
  - server DB / API 投影
  - dapp/admin 页面可见状态
- 对周流程统一记录：
  - `epochNo`
  - `referenceAt`
  - `claimDeadline`
  - `publish txHash`
  - `claim txHash`

Risks
- 一旦同时覆盖 subsidy、lottery、ranking，测试体量和运行时会迅速膨胀，需要控制最小主路径优先级。
- fork 环境若没有固定初始 block/seed，claimable 数量与 pool 金额可能随时间漂移，影响断言稳定性。
- 若 DB 投影依赖历史已有数据，fork 测试需要显式说明是否使用隔离数据库或专用 schema。
- 若 synthetic participants 的生成方式不稳定，happy path 会退化成“人数偶尔够、偶尔不够”的脆弱测试。
- 若通过降低 `minimumParticipants` 来伪造 happy path，会失去产品级验收价值，只能算快速分支测试。

Verification commands
- `PROMOTION_ENV=<fork-env> pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/subsidy-claim.spec.ts`
- `PROMOTION_ENV=<fork-env> pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/lottery.spec.ts`
- `PROMOTION_ENV=<fork-env> pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/ranking.spec.ts`
- `PROMOTION_ENV=<fork-env> pnpm --dir apps/e2e/phase94 run test:weekly-fork`

Expected outputs
- `publishSubsidyEpoch` 与 `claimPurchasedSubsidy` 有一条可重复自动化通过路径
- `participantCount < minimumParticipants` 的 rollover / blocked 路径有一条可重复自动化通过路径
- `participantCount >= minimumParticipants` 的 lottery / ranking / settlement happy path 有一条可重复自动化通过路径
- lottery / ranking / team incentive 至少各有一条 fork 自动化验证路径
- public `test:uat` 与 weekly fork suite 的职责边界清晰分离

## 7. Approval Checkpoint
本计划属于 `Major/Critical`（涉及资金链路、claim、eligibility），需你确认后再进入实现阶段。

本次新增的“跨环境 Prisma schema 一致性”同样属于 `Critical`：
- 涉及数据库结构、已有数据、migrations baseline
- 在你明确批准前，只允许更新计划与执行记录，不执行任何新的 DB 变更

本次新增的“fork/anvil 周流程自动化层”同样属于 `Critical`：
- 涉及资金注入、claim、weekly settlement、lottery/ranking 资格与时间推进
- 在你明确批准前，不进入任何新的 fork runner、合约资金脚本、或周流程自动化实现

## 8. Rollback / Recovery Notes
- 自动化相关改动独立在测试目录，不直接修改生产业务逻辑
- 若引入不稳定依赖，可仅回滚 e2e 模块与脚本，不影响主应用运行
- Prisma 对齐必须保留每个环境的 diff SQL、`migrate resolve` 记录与最终 `migrate status` 结果，便于审计与回放
- 若某环境 diff SQL 审阅后存在风险，应停在审阅点，不做 `db execute`

## 9. Final Verification Checklist
- [ ] Playwright + Synpress 能稳定启动并导入测试钱包
- [ ] 5 钱包角色映射无硬编码泄露
- [ ] 至少 1 条完整登录+团队链路自动化通过
- [ ] 至少 1 条 admin 审批链路自动化通过
- [ ] 报告包含 txHash/API 证据并可回溯
- [ ] `execution.md` 记录真实命令与结果
- [ ] `wallets/*.json` 与 `reports/uat-report.json` 目录契约落地
- [ ] 资金前置检查（`0.1 BNB` / `1000 USDT`）在测试前自动校验
- [ ] 三个 promotion env 的 Prisma 状态都有明确结论
- [ ] 所有 active 且可达的环境完成 schema 对齐或被证明已对齐
- [ ] `release` 若仍为 `planned`，其阻塞原因被明确记录，而不是被误标为 schema 问题
- [ ] 本地 `127.0.0.1:5433` 连通性与 Prisma 结果已交叉验证，避免误判 `P1001`
- [ ] public `test:uat` 仅承担实时主路径，不再依赖 weekly / subsidy 业务前置
- [ ] `fork/anvil` 周流程 runner 可独立启动、停止、重置
- [ ] `publishSubsidyEpoch -> sync -> claimPurchasedSubsidy` 至少有 1 条 fork 自动化通过
- [ ] lottery / ranking / team incentive 的时间推进与 `referenceAt` 驱动方式已被记录并验证

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
