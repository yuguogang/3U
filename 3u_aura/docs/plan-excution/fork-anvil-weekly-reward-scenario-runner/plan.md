# Fork Anvil Weekly Reward Scenario Runner Plan

## 1. Objective

为 `fork-anvil` 环境提供一套可重复执行的“周奖励场景编排方案”，让目标账号
`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
能够在同一套 fork 测试栈中完成并验证：

- 抽奖资格 -> 手动参与 -> 周结算 -> 揭晓 -> Claim
- 排名奖达标 -> 周结算 -> 结果公布 -> Claim
- 购买型 NFT -> 周补贴发布 -> Claim

同时交付：

- 一份从空白 `fork-anvil` 状态开始的操作文档
- 一套自动脚本，用于造用户、补签到、造团队业绩、推进时间、触发结算/发布
- 一份 DApp / Admin 侧的 UI 验证路径说明

## 2. Scope

- 研究并复用现有 `scripts/uat/*` 与 `scripts/ci/*` 的 weekly fork 能力
- 设计并实现目标账号的三类周奖励测试场景
- 提供环境重启与服务同步步骤，确保新路由与 UI 都是最新代码
- 提供“自动造数 + 自动结算 + UI 验证”的组合流程
- 交付操作文档与自动脚本

## 3. Out of Scope

- 本轮不改生产/测试网真实环境
- 本轮不引入新的链上合约或测试代币部署
- 本轮不把三类场景全部改写成 Playwright 全自动 UI 用例
- 本轮不重构现有 weekly settlement / merkle / subsidy 业务逻辑
- 本轮不修改 Anvil fork 的基础网络来源或 RPC 提供商

## 4. Assumptions

- 当前目标环境是 `fork-anvil`
- `fork-anvil` 已具备 Anvil、本地数据库、server/dapp/admin 的启动能力
- 现有工具链可复用：
  - `scripts/uat/prepare-weekly-fork-db.mjs`
  - `scripts/uat/reset-weekly-fork-db.mjs`
  - `scripts/uat/start-promotion-services.mjs`
  - `scripts/uat/seed-weekly-fork-fixtures.mjs`
  - `scripts/uat/materialize-weekly-fork-draft.mjs`
  - `scripts/uat/publish-weekly-fork-claims.mjs`
  - `scripts/uat/resolve-weekly-fork-epoch.mjs`
  - `scripts/ci/lib/contracts.mjs`
- 目标账号 `0x3C44...93BC` 可作为主要 UI 操作钱包
- 新增的 weekly results 路由需要确保 server 是最新构建并已重启

## 5. Architecture Impact

### 5.1 Existing Building Blocks

- `apps/e2e/phase94/package.json` 已有 weekly fork 的成套脚本入口：
  - `fork:start`
  - `fork:db:reset`
  - `fork:advance-time`
  - `test:weekly-pack`
- `scripts/uat/weekly-fork-lib.mjs` 已经承载：
  - DB 准备 / 重置
  - fork 时间推进
  - fixture 注入
  - 周结算相关编排
- `scripts/ci/lib/contracts.mjs` 已经有链上辅助能力：
  - `increaseForkTime`
  - `mintUsdt`
  - `approveUsdt`
  - `buyNft`
  - `claimSubsidy`
  - `depositMerkleRewards`
  - `publishMerkleRoot`
  - `impersonateAccount`
- 现有业务 UI 入口已存在：
  - DApp `checkin / rewards / claims / nft`
  - Admin `overview / ops / claims`

### 5.2 Current Gap

- 目前 weekly fork 工具更偏“底层工具箱 + 分散的单点 flow”
- 缺少一条面向业务验收的高层场景编排：
  - 为指定用户自动补足抽奖条件
  - 为指定用户自动造排名达标团队
  - 为指定用户自动准备 NFT 周补贴
  - 自动推进到周结算节点并发布结果
- 缺少一份能指导测试同学直接点 UI 验证的中文操作文档

### 5.3 Recommended Approach

采用“两层编排”：

- 底层继续复用已有 `weekly-fork-lib` / `contracts.mjs`
- 新增一个“场景 runner” 脚本层，把三种业务串成可复用的标准流程

推荐输出形式：

- 一个总 orchestrator，例如：
  - `scripts/uat/run-weekly-fork-scenarios.mjs`
- 若干可单独执行的子场景脚本，例如：
  - `scripts/uat/scenarios/fork-lottery-scenario.mjs`
  - `scripts/uat/scenarios/fork-ranking-scenario.mjs`
  - `scripts/uat/scenarios/fork-nft-subsidy-scenario.mjs`
- 一份 runbook，例如：
  - `docs/runbooks/fork-anvil-weekly-reward-testing.md`

### 5.4 Why Not Pure UI

- 加用户、补签到、造团队结构、推进链上时间、触发周结算，都不适合靠 UI 手动完成
- 纯 UI 只能承担最后的观察与领取动作：
  - 手动参与抽奖
  - 揭晓结果
  - 查看排名榜
  - 领取 merkle claim / subsidy claim

所以本任务的正确边界是：

- 数据准备与结算发布：脚本自动化
- 用户体验验收：UI 手动 smoke

## 6. Milestones

### Milestone 1: Stabilize Fork Runtime And Entry Points

- Goal:
  - 确认 `fork-anvil` 服务栈可稳定启动，并确保 server 使用的是包含最新 weekly results 路由的代码
- Affected files/modules:
  - `scripts/uat/start-promotion-services.mjs`
  - `scripts/uat/promotion-service-lib.mjs`
  - `config/promotion-envs/fork-anvil/*`
  - `apps/server/src/modules/rewards/controllers/rewards.controller.ts`
- Implementation notes:
  - 检查并记录 `fork-anvil` 的：
    - anvil RPC
    - server base URL
    - dapp base URL
    - admin base URL
  - 确保 `/api/v1/rewards/me/latest-weekly-results` 可访问
  - 若服务进程仍在跑旧构建，补充标准的 stop/start / restart 说明
- Risks:
  - 使用旧 server 进程会导致新路由不存在，UI 误判为业务失败
  - 环境变量指向错误会导致 dapp/admin 验证失真
- Verification commands:
  - `node scripts/uat/start-promotion-services.mjs --env fork-anvil`
  - `curl -s http://127.0.0.1:3210/api/v1/health`
  - `curl -s http://127.0.0.1:3210/api/v1/rewards/me/latest-weekly-results`
- Expected outputs:
  - `fork-anvil` 服务地址稳定
  - 新 rewards route 已在本地 server 中生效

### Milestone 2: Design Reusable Fixture Strategy For Three Reward Flows

- Goal:
  - 明确三条业务线分别需要哪些前置数据、链上状态与时间窗口
- Affected files/modules:
  - `scripts/uat/weekly-fork-lib.mjs`
  - `scripts/ci/lib/contracts.mjs`
  - `scripts/uat/seed-weekly-fork-fixtures.mjs`
  - `apps/e2e/phase94/tests/weekly-fork/*`
- Implementation notes:
  - 抽奖场景：
    - 至少 12 名有效参与者
    - 目标账号 7 天签到达标
    - 目标账号需手动点“参与本周抽奖”
  - 排名奖场景：
    - 目标账号所在树产生足够小区增量
    - 保证目标账号落入前 10
  - NFT 补贴场景：
    - 目标账号持有购买型 NFT
    - 对应补贴 epoch 已发布
  - 决定哪些部分脚本自动完成，哪些步骤保留给 UI
- Risks:
  - 三条场景相互污染，导致一个场景满足条件时破坏另一个场景排序或奖池
  - 时间推进次序不当，导致 epoch 状态错位
- Verification commands:
  - `rg -n "weekly-fork" apps/e2e/phase94/tests/weekly-fork`
  - `node scripts/uat/seed-weekly-fork-fixtures.mjs --env fork-anvil --help`
- Expected outputs:
  - 一份明确的三场景数据矩阵
  - 一套可复用的 fixture 设计

### Milestone 3: Implement Scenario Runner Scripts

- Goal:
  - 交付自动化脚本，能够一键或分步准备三类周奖励测试场景
- Affected files/modules:
  - `scripts/uat/run-weekly-fork-scenarios.mjs`（planned）
  - `scripts/uat/scenarios/fork-lottery-scenario.mjs`（planned）
  - `scripts/uat/scenarios/fork-ranking-scenario.mjs`（planned）
  - `scripts/uat/scenarios/fork-nft-subsidy-scenario.mjs`（planned）
  - `scripts/uat/weekly-fork-lib.mjs`（possibly extended）
- Implementation notes:
  - runner 支持：
    - `--env fork-anvil`
    - `--target-user 0x3C44...93BC`
    - `--scenario lottery|ranking|subsidy|all`
    - `--reset`
  - 抽奖子场景负责：
    - 造至少 12 个达标用户
    - 让目标账号达标
    - 保留 UI 手动点参与/揭晓
  - 排名子场景负责：
    - 构造团队与 volume
    - 触发结算后让目标账号在榜单内
  - NFT 补贴子场景负责：
    - mint USDT / approve / buy NFT
    - 推进时间与发布补贴 claim
- Risks:
  - 直接硬编码钱包或 tokenId 会降低复用性
  - 同一个 reset 入口如果不彻底，重复跑会积累脏状态
- Verification commands:
  - `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --scenario lottery --reset`
  - `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --scenario ranking --reset`
  - `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --scenario subsidy --reset`
- Expected outputs:
  - 三条场景都能自动把环境准备到“可 UI 验证”的状态

### Milestone 4: Add Weekly Settlement / Publish Orchestration

- Goal:
  - 把时间推进、epoch sync、draft materialization、claim publish 串成标准流程
- Affected files/modules:
  - `scripts/uat/materialize-weekly-fork-draft.mjs`
  - `scripts/uat/publish-weekly-fork-claims.mjs`
  - `scripts/uat/resolve-weekly-fork-epoch.mjs`
  - `scripts/uat/advance-weekly-fork-time.mjs`
  - `apps/admin/src/features/ops/components/ops-page.tsx`
- Implementation notes:
  - 标准化每条场景结束前的处理：
    - 推进时间到 epoch cutoff
    - 运行 epoch sync
    - materialize settlement draft
    - publish merkle / subsidy claims
  - 输出结构化结果：
    - 当前 epochNo
    - participantCount
    - target user reward summary
    - target user claim ids
- Risks:
  - 抽奖与排名是同一个 weekly promotion epoch，发布逻辑必须一次性考虑
  - subsidy 与 promotion epoch 可能不是同一类 epoch，容易混淆
- Verification commands:
  - `node scripts/uat/advance-weekly-fork-time.mjs --env fork-anvil --help`
  - `node scripts/uat/materialize-weekly-fork-draft.mjs --env fork-anvil`
  - `node scripts/uat/publish-weekly-fork-claims.mjs --env fork-anvil`
- Expected outputs:
  - 一套稳定的周结算/发布编排步骤
  - 运行后 UI 可直接看到对应结果或可领取状态

### Milestone 5: Document DApp / Admin Verification Playbook

- Goal:
  - 提供测试同学可直接照着执行的 UI 验收手册
- Affected files/modules:
  - `docs/runbooks/fork-anvil-weekly-reward-testing.md`（planned）
  - `docs/spec/assets/`（if screenshots are captured later）
  - `docs/plan-excution/fork-anvil-weekly-reward-scenario-runner/execution.md`
- Implementation notes:
  - DApp 路径至少覆盖：
    - `Check-In` 页查看达标/参与状态
    - `Rewards` 页手动揭晓抽奖结果
    - `Claims` 页领取抽奖 / 排名 / NFT 补贴
    - `NFT` 页确认购买型 NFT 状态
  - Admin 路径至少覆盖：
    - `Overview` 页检查最新 weekly results
    - `Ops` 页查看 weekly epoch sync 入口
    - `Claims` 页必要时做 replay/sync
  - 文档应区分：
    - 纯脚本步骤
    - 需要手点 UI 的步骤
- Risks:
  - 没有明确“什么时候需要手动报名/揭晓”，测试时容易误判业务逻辑
- Verification commands:
  - 文档 walkthrough 自检
  - 至少一次按文档执行抽奖/排名/补贴完整 smoke
- Expected outputs:
  - 一份完整 runbook
  - 目标账号三条奖励链路的清晰 UI 验证步骤

## 7. Approval Checkpoint

执行前需要你确认这三点：

- 目标账号固定使用 `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- 测试目标优先是“把环境准备到可 UI 验证”，而不是把所有步骤都做成纯 UI
- 抽奖场景保留“手动参与 + 手动揭晓”两个用户动作，不由脚本代点

如果这三点保持不变，下一步就进入实现。

## 8. Rollback / Recovery Notes

- 若新脚本污染 fork 状态：
  - 直接执行 fork reset / DB reset，回到干净 `fork-anvil`
- 若服务跑旧版本：
  - 停止 `fork-anvil` server/dapp/admin
  - 重新 build 并重启
- 若结算/发布脚本只执行到一半：
  - 记录当前 epoch 状态
  - 重新 reset fork 后再按文档完整重跑，不建议手工修补数据库

## 9. Final Verification Checklist

- `fork-anvil` server/dapp/admin 使用最新构建并成功启动
- `/api/v1/rewards/me/latest-weekly-results` 在 fork 环境可访问
- 抽奖场景可将目标账号准备到：
  - 达标
  - 已参与
  - 结算完成
  - 可在 UI 揭晓并 claim
- 排名奖场景可将目标账号准备到：
  - 进入榜单
  - 结算完成
  - UI 可见结果并 claim
- NFT 补贴场景可将目标账号准备到：
  - 已购购买型 NFT
  - 补贴已发布
  - UI 可 claim
- 提供一份完整 runbook
- `execution.md` 记录真实命令、验证结果与偏差
