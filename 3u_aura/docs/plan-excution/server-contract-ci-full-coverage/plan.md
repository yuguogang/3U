# Plan: Server + Contract CI Full Coverage

## 1. Objective
建立一套以 `server + contract` 为主的 CI 业务回归层，在不依赖 DApp/Admin 浏览器自动化的前提下，覆盖 promotion 关键业务流程，并把它作为 `forge test` 与少量 E2E 冒烟之间的主验证层。

## 2. Scope
- 重构并收敛 `scripts/ci`，使其真正成为可执行、可组合、可在 CI 运行的测试入口
- 统一 `anvil/fork` 启停、数据库重置、server 启动探活、时间推进、钱包/manifest 装载
- 为 fork/anvil 场景建立独立 runtime manifest，并定义 Foundry broadcast 的保留与清理策略
- 明确区分两类 CI flow：
  - `seeded`：直接准备数据库/运行时状态，用于验证资格满足后的 server + contract 业务编排
  - `derived`：通过真实业务事件或 domain/job 重算推进状态，用于验证资格、累计值和读模型推导逻辑
- 对高风险资金、资格、claim、settlement 流程，明确覆盖 happy path、duplicate/retry path、failure/recovery path 中适用的场景
- 覆盖 promotion 关键业务流程的 server + contract 测试：
  - 登录 / 签名换 token
  - inviter bind
  - tree placement
  - check-in 提交与验链
  - purchased NFT 购买
  - referral NFT eligibility -> admin approval -> mint
  - purchased subsidy claim
  - weekly rollover / threshold-met
  - lottery / ranking
  - merkle publish / claim / sync-back
- 提供单 flow 运行、分组运行与全量运行入口
- 补齐运行文档、输出约定和执行记录

## 3. Out of Scope
- 替代 `forge test` 的纯合约逻辑单测
- 完全移除 `apps/e2e/phase94` 的浏览器 E2E
- 新业务规则设计或 promotion 流程改版
- 主网、测试网部署与 `Phase9.4` 手工 UAT 收尾
- CI 平台工作流 YAML 的全面建设，除非为接入此测试层所必需

## 4. Assumptions
- `Phase9.4` 当前先冻结，不作为本轮主工作面
- `scripts/uat/*` 仍然是 fork-anvil 环境的基础设施入口
- `apps/server` 现有 API 已能支撑核心 promotion 业务编排
- `apps/server` 已存在更适合 CI 的非 watch 启动路径，可由 harness 统一封装
- `apps/contracts` 广播产物和 manifest 信息可继续作为 fork 环境 bootstrap 输入来源
- 允许对现有 `scripts/ci` 做重命名、重组和脚本接口调整
- 真实测试网与主网的 Foundry broadcast 记录属于审计证据，默认保留
- CI 中的 server 生命周期将统一由 harness 管理；单个 flow 不再自行选择 `start:dev` 或其他启动命令

## 5. Current State
- 现有任务目录原名为 `ci-contract-tests`，目标偏向“轻量 CI flow”，但执行状态与仓库现状已经脱节
- `scripts/ci` 已有部分基础设施与若干流程脚本，但入口命名、脚本扩展名、计划文档和执行记录互相不一致
- `scripts/ci/package.json` 仍引用不存在的 `.ts` 入口，而当前仓库主要存在 `.mjs` 脚本
- fork/anvil 使用测试网 `chainId = 97`，会与真实测试网广播目录混用，导致本地 CI 部署产物污染 `apps/contracts/broadcast/*/97/`
- `apps/server` 已提供更适合 CI 的非 watch 启动脚本（如 `env:start:prod`），但 `scripts/ci` 仍未定义统一的 server 启动契约
- runtime manifest、显式环境变量、deployment manifest、Foundry broadcast 之间尚无明确的真相源优先级
- 目前已有能力片段包括：
  - anvil 启停
  - DB reset
  - manifest / server helper
  - check-in / bind / placement / nft purchase / referral mint 等脚本雏形
- 当前缺少：
  - 明确的分层策略
  - 完整流程矩阵
  - 稳定的 `run` / `run-all`
  - 与现有脚本一致的文档和执行记录
  - 明确的完成标准
  - 对高风险流程的 duplicate/retry/failure 覆盖约束

## 6. Target State
- `server + contract CI` 成为 promotion 的主业务回归层
- 每条关键业务路径都可在不启动浏览器的情况下执行并验证
- `seeded` 与 `derived` flow 的职责边界清晰，避免为了速度而误把资格推导测试降级成纯 DB 造数
- 所有 flow 统一通过 harness 管理的非交互式 server bootstrap 运行，并仅依赖 health probe 判断服务就绪
- fork/anvil 运行时地址优先来自独立 runtime manifest，而不是混入正式 `broadcast/` 目录
- 地址真相源优先级清晰且文档化：
  - fork/anvil: runtime manifest
  - 真实链: 显式环境变量或受控 deployment manifest
  - Foundry broadcast: 只作为审计证据或 bootstrap fallback
- 真实测试网 / 主网广播与本地 fork 产物的保留边界清晰
- 高风险流程至少具备一条非 happy-path 断言，用于验证幂等、重试安全或失败恢复
- 测试入口统一，支持：
  - 单 flow 调试
  - 分组执行
  - 全量执行
- `forge test`、`server + contract CI`、少量 E2E 的职责边界清晰
- 文档、计划、执行记录、脚本命名和实际仓库状态保持一致

## 7. Architecture Impact
- CI Harness
  - `scripts/ci/package.json`
  - `scripts/ci/lib/*`
  - `scripts/ci/commands/*` 或其重组后的目录
  - `scripts/ci/run.*`
  - `scripts/ci/run-all.*`
  - `scripts/ci/.runtime/*` 或等效 runtime manifest 目录
- Existing UAT infra
  - `scripts/uat/*`
- Promotion env helpers
  - `scripts/promotion-env/*`
- Contract deployment artifacts
  - `apps/contracts/broadcast/*`
- Server
  - `apps/server/package.json`
  - `apps/server/src/modules/checkin/*`
  - `apps/server/src/modules/referral/*`
  - `apps/server/src/modules/tree/*`
  - `apps/server/src/modules/signing/*`
  - `apps/server/src/modules/claims/*`
  - `apps/server/src/modules/admin/*`
  - `apps/server/src/modules/epoch/*`
  - `apps/server/src/modules/lottery/*`
  - `apps/server/src/modules/ranking/*`
- Shared contracts / schemas
  - `packages/common/src/*`
  - `apps/contracts/src/*`
- Docs
  - `docs/plan-excution/server-contract-ci-full-coverage/*`

## 8. Risks
- 为追求“全流程”而把 UI 假设或浏览器行为偷偷塞回脚本层，导致 CI 再次变脆
- 现有 fork 环境状态与真实业务前置条件不一致，导致部分流程看似“脚本问题”，实则是环境装配问题
- server 默认启动链路、Prisma 生成路径、manifest 来源不稳定，会拖累测试层可靠性
- 过度耦合广播产物路径或本地临时文件，降低 CI 可移植性
- 若不先拆分 fork runtime manifest 与真实链 broadcast，CI 每次部署都会继续污染 `97` 广播记录
- 若只验证 happy path 而不验证 duplicate/retry/failure path，会在高风险业务上留下回归盲区
- 流程编排如果没有清晰分层，未来新增 case 会继续复制粘贴
- 若不明确哪些场景仍归 `forge` / E2E，会造成重复测试和维护浪费

## 9. Milestones

### Milestone 1 — Re-baseline And Coverage Contract
**Goal**
- 明确这层测试的职责边界、覆盖矩阵、server 启动契约、地址真相源优先级，并把旧 `ci-contract-tests` 正式过继为新任务。

**Affected files/modules**
- `docs/plan-excution/server-contract-ci-full-coverage/plan.md`
- `docs/plan-excution/server-contract-ci-full-coverage/execution.md`
- `scripts/ci/package.json`
- `scripts/ci/*`
- `apps/server/package.json`

**Implementation notes**
- 先做盘点，不急于补代码。
- 输出 flow inventory 与 coverage matrix：
  - 已有
  - 可复用
  - 缺失
  - 应下放到 `forge`
  - 应保留在 E2E
- 对每条高风险 flow 标注：
  - happy path
  - duplicate/retry
  - failure/recovery
  - read-model / sync-back 断言
- 明确统一命名规范与运行入口。
- 锁定 server bootstrap 契约：
  - 由 harness 统一启动和停止
  - 优先采用非 watch 模式
  - flow 只依赖 health endpoint，不直接管理进程
- 锁定地址真相源优先级：
  - `scripts/ci/.runtime/*.json`
  - 显式环境变量 / 受控 deployment manifest
  - `apps/contracts/broadcast/*` 仅作审计或 bootstrap fallback

**Risks**
- 若边界不先定清楚，后续会一边实现一边反复改目录和脚本接口。

**Verification commands**
- `rg --files /Users/ygg/vs/ai/3U/3u_aura/scripts/ci`
- `sed -n '1,220p' /Users/ygg/vs/ai/3U/3u_aura/scripts/ci/package.json`
- `sed -n '1,220p' /Users/ygg/vs/ai/3U/3u_aura/apps/server/package.json`

**Expected outputs**
- 新任务目录、计划与执行基线完成
- 覆盖矩阵和职责边界明确
- server bootstrap 契约明确
- 地址真相源优先级明确

### Milestone 2 — Harness Stabilization And Runtime Contract
**Goal**
- 统一 anvil、DB、server、manifest、wallet、time travel 的基础设施，使所有 flow 共享同一套运行时装配，并解决 fork/anvil broadcast 污染问题。

**Affected files/modules**
- `scripts/ci/lib/*`
- `scripts/ci/package.json`
- `scripts/uat/*`
- `scripts/promotion-env/*`
- `apps/contracts/broadcast/*`
- `apps/server/package.json`

**Implementation notes**
- 统一解决：
  - `.mjs` / `.ts` 混用
  - `package.json` 脚本指向不存在文件
  - server 健康检查与启动等待
  - reset / advance-time / stop 清理
- 增加统一 server runtime helper，负责：
  - 必要的 Prisma generate / build 前置
  - 通过非 watch 命令启动 server
  - 等待健康检查成功
  - 捕获日志与停止进程
- 优先封装 `pnpm --dir apps/server env:start:prod` 或等效非 watch 启动路径，而不是让 flow 直接调用 `start:dev`
- 为 fork/anvil 建立独立 runtime manifest，作为 CI 地址真相源
- 明确保留策略：
  - 保留真实测试网 / 主网 broadcast
  - fork/anvil 产物移动到独立目录、忽略提交，或在运行后自动清理
- 区分规则不能只依赖 `chainId = 97`，必须结合环境名、RPC 或运行时上下文
- 优先提高稳定性与可组合性，不做业务扩张。
- 对 fresh deploy 场景，允许 harness 以 runtime env override 的方式向 server 注入本次 fork 合约地址与 signer 私钥，确保 signer 配置与链上部署一致，而不放宽 server 的 signer 校验逻辑。

**Risks**
- 若基础设施仍不稳定，后续每个 flow 都会携带自己的隐式前置步骤。
- 若清理策略设计粗糙，可能误删真实测试网广播证据。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run run -- --help`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run checkin`
- `ls -la /Users/ygg/vs/ai/3U/3u_aura/scripts/ci/.runtime`
- `curl -s http://127.0.0.1:3010/api/v1/health`
- `find /Users/ygg/vs/ai/3U/3u_aura/apps/contracts/broadcast -maxdepth 4 -type f | sort`

**Expected outputs**
- harness 入口统一可执行
- 基础设施可重复启动、重置、清理
- 所有 flow 共用同一套 server lifecycle helper
- fork/anvil 地址产物与真实链 broadcast 分离
- 本地 CI 运行不再把临时部署记录长期混入正式 `broadcast/`

### Milestone 3 — Identity And Tree Topology Flows
**Goal**
- 打通不涉及资金扣转的身份与拓扑基础路径，为后续高风险流程提供稳定前置。

**Affected files/modules**
- `scripts/ci/commands/*`
- `scripts/ci/lib/*`
- 必要时最小调整 `apps/server/src/modules/referral/*`
- 必要时最小调整 `apps/server/src/modules/tree/*`
- 必要时最小调整 `apps/server/src/modules/signing/*`

**Implementation notes**
- 至少覆盖：
  - login
  - inviter bind
  - tree placement
- 为拓扑类 flow 增加至少一条非 happy-path 断言，例如：
  - duplicate bind / rebinding rejection
  - invalid inviter / invalid placement slot
  - unauthorized actor
- 每条 flow 输出最少包括：
  - actor
  - 请求/交易摘要
  - 核心断言
  - 成功/失败状态

**Risks**
- 若拓扑前置状态不稳定，后续所有 payment / claim flow 都会出现级联失败。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run run -- login`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run run -- inviter-bind`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run run -- tree-placement`

**Expected outputs**
- login / bind / placement 可单独运行并稳定通过
- 基础拓扑前置可被其他 flow 复用

### Milestone 4 — Payment And Purchase Flows
**Goal**
- 覆盖 check-in 与 purchased NFT 购买两条高风险资金入口，并验证至少一条非 happy-path。

**Affected files/modules**
- `scripts/ci/commands/*`
- `scripts/ci/lib/*`
- 必要时最小调整 `apps/server/src/modules/checkin/*`
- 必要时最小调整 `apps/server/src/modules/claims/*`

**Implementation notes**
- 至少覆盖：
  - check-in happy path
  - check-in duplicate / retry 或 invalid receipt path
  - purchased NFT buy happy path
  - purchased NFT allowance / balance / revert path
- 对高风险路径增加：
  - 幂等或重复提交断言
  - 失败后不产生脏状态断言
  - 关键 read-model / profile / supply 结果断言

**Risks**
- 资金入口如果只验证 happy path，后续 claim 与 settlement 流程的可信度会明显不足。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run checkin`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run nft-purchase`

**Expected outputs**
- check-in 与 purchased NFT buy 可稳定回归
- 至少一条 payment 类非 happy-path 已被自动验证

### Milestone 5 — Referral Eligibility, Approval, And Mint Flows
**Goal**
- 覆盖 referral NFT 从资格达成、后台审批、签名发放到链上 mint 的完整链路。

**Affected files/modules**
- `scripts/ci/commands/*`
- `scripts/ci/lib/*`
- 必要时最小调整 `apps/server/src/modules/referral/*`
- 必要时最小调整 `apps/server/src/modules/admin/*`
- 必要时最小调整 `apps/server/src/modules/signing/*`
- 必要时最小调整 `apps/server/src/modules/claims/*`

**Implementation notes**
- 至少覆盖：
  - eligibility ready
  - admin approval happy path
  - referral mint happy path
  - duplicate approval / replay / wrong signer / nonce misuse 中至少一条非 happy-path
- 将本里程碑拆成两类 case：
  - `seeded` case：直接准备 `UserProfile` / eligibility 阈值，用于验证审批、签名、mint、sync、replay rejection
  - `derived` case：通过 check-in / tree / volume 或 domain/job 重算，验证资格确实能由真实事件推导出来
- 对该链路明确职责边界：
  - server + contract CI 负责后台审批与业务编排
  - 低层 EIP712 回放 / signer / revert 细节继续由 `forge test` 深挖
- 验证 server 记录、链上 mint 结果与后续 sync-back 之间的一致性。

**Risks**
- 该链路横跨 admin、signing、contract mint，是最容易被 UI 手工测试掩盖的关键缺口。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run referral-approval`

**Expected outputs**
- referral NFT 审批到 mint 的完整链路可自动回归
- 至少一条 replay / duplicate / signer failure 断言成立

### Milestone 6 — Weekly Qualification And Settlement Preparation Flows
**Goal**
- 覆盖周结算资格形成路径，包括 rollover、threshold-met、lottery、ranking。

**Affected files/modules**
- `scripts/ci/commands/*`
- `scripts/ci/lib/*`
- 必要时最小调整 `apps/server/src/modules/epoch/*`
- 必要时最小调整 `apps/server/src/modules/lottery/*`
- 必要时最小调整 `apps/server/src/modules/ranking/*`

**Implementation notes**
- 至少覆盖：
  - weekly rollover
  - threshold-met
  - lottery
  - ranking
- 至少增加一条非 happy-path 或边界场景：
  - consecutive rollover accumulation
  - threshold boundary
  - zero-pool / partial-bucket / full-top10 之一
- 对结果验证：
  - epoch 状态
  - pool split
  - qualification / winner / ranking 读模型

**Risks**
- 周结算类逻辑如果不单独成组，失败定位会被 claim 流程噪声掩盖。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run weekly-rollover`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run weekly-threshold`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run lottery`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run ranking`

**Expected outputs**
- 周资格与奖励分配前置路径在 server + contract 层稳定回归
- 至少一条多 epoch 或边界 case 被自动验证

### Milestone 7 — Claim Publication, Claim Execution, And Sync-Back Flows
**Goal**
- 覆盖 subsidy claim、merkle publish、merkle claim、sync-back 等高风险 claim 路径。

**Affected files/modules**
- `scripts/ci/commands/*`
- `scripts/ci/lib/*`
- 必要时最小调整 `apps/server/src/modules/claims/*`
- 必要时最小调整 `apps/server/src/modules/admin/*`
- 必要时最小调整 `apps/server/src/modules/epoch/*`

**Implementation notes**
- 至少覆盖：
  - subsidy claim happy path
  - subsidy claim duplicate / wrong owner / failure path 之一
  - merkle publish happy path
  - merkle claim happy path
  - merkle duplicate claim / invalid proof / expired case 之一
  - sync-back idempotency
- 对高风险 claim 路径明确验证：
  - `chainId`
  - `txHash`
  - business key / claim record
  - 状态流转与 read-model 一致性

**Risks**
- claim 路径是资金与资格最终落账点，如果没有 negative-path 断言，CI 价值会明显不足。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run subsidy-claim`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run merkle-claim`

**Expected outputs**
- claim publish / execute / sync-back 全链路可自动回归
- 至少一条 duplicate / invalid / expired 类断言成立

### Milestone 8 — Suite Integration And CI Hand-off
**Goal**
- 提供全量执行入口、分组执行约定、文档和最终验证结论。

**Affected files/modules**
- `scripts/ci/run.*`
- `scripts/ci/run-all.*`
- `scripts/ci/package.json`
- `docs/plan-excution/server-contract-ci-full-coverage/execution.md`
- 如需要，补充 `README` 或 runbook

**Implementation notes**
- 定义最小运行模式：
  - single flow
  - topology group
  - payment group
  - weekly group
  - claims group
  - full suite
- 明确 CI 中的推荐执行顺序和失败诊断入口。
- 文档中明确：
  - `forge test`
  - server + contract CI
  - 浏览器 E2E
  三层各自负责的覆盖面。

**Risks**
- 若只拼一个 `run-all` 而没有分组能力，失败定位成本会很高。

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run all`
- `cd /Users/ygg/vs/ai/3U/3u_aura/scripts/ci && pnpm run all:no-reset`

**Expected outputs**
- 全量 suite 可执行
- 分组 suite 可执行
- 文档与执行记录能反映真实完成状态

## 10. Approval Checkpoint
- 本任务属于 Major。
- 在你明确批准本 `plan.md` 前，不进入代码实现阶段。
- 批准后将从 `Milestone 1` 开始执行，并把真实进展持续追加到 `execution.md`。

## 11. Rollback / Recovery Notes
- 若重构 `scripts/ci` 过程中方向错误，可回退到当前目录结构，只保留新任务文档
- 任何对 server 的改动都应限制在最小可测试性修补，不借机改业务规则
- 可以为了 `seeded` flow 直接准备 DB 状态，但不得用它替代 `derived` 资格推导测试
- 若某个流程最终证明更适合 `forge` 或 E2E，应在 execution 中明确迁移结论，而不是强行塞进本层
- 任何 broadcast 清理逻辑都必须以“保留真实测试网 / 主网证据”为前提，必要时先改为“搬移隔离”而不是删除

## 12. Final Verification Checklist
- `scripts/ci` 文档、目录结构、`package.json` 脚本与实际文件一致
- 所有 flow 共用同一套 harness 管理的 server bootstrap
- 单 flow 入口可运行
- 分组入口可运行
- 全量入口可运行
- 覆盖矩阵中的核心流程均有可执行测试
- 高风险 claim / settlement / approval 路径至少有一层稳定回归
- 高风险 flow 已覆盖适用的 happy / duplicate-retry / failure-recovery 场景
- `seeded` 与 `derived` flow 的边界已文档化，并在高风险资格流程中分别落地
- fork/anvil runtime manifest 已落地并被 CI 使用
- 地址真相源优先级已文档化并在实现中贯彻
- 真实测试网 / 主网 broadcast 被保留，本地 fork 产物已隔离或自动清理
- 任何 server 侧调整仍保持 controller thin、业务逻辑留在 service / engine
- `forge` / server+contract CI / E2E 职责边界已在文档中明确
- `execution.md` 记录了真实命令、真实结果和偏差
