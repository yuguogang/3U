# Admin Settlement And Subsidy Center

## 1. Objective

为 `admin` 建立一套可视化、可解释、可分步执行的运营中心，覆盖两条高风险流程：

- `Weekly Settlement`
- `Purchased NFT Subsidy`

目标不是把所有动作“隐藏成黑盒一键完成”，而是把当前分散在后台、脚本、链上钱包之间的步骤，收敛成数据清晰、步骤清晰、界面简洁、易操作且带说明的向导式流程。

本任务属于 `Critical`，因为它直接触达周奖励、补贴、claimability、链上发布与资金前置检查。

## 2. Scope

### 2.1 In Scope

- 设计并实现新的 `admin` 运营中心信息架构：
  - `Weekly Settlement`
  - `Purchased NFT Subsidy`
- 为两条流程补齐“前置条件可视化”：
  - 时间窗口
  - epoch 状态
  - 参与门槛
  - draft / publish / activate 状态
  - on-chain root / subsidy epoch 状态
  - 钱包角色、余额、allowance、gas、权限匹配状态
- 把当前 server 脚本路径中的关键后端步骤 API 化：
  - weekly `draft`
  - weekly `publish`
  - weekly `activate`
  - 对应 preview / readiness / blockers 返回
- 在 `admin` 中引入受控的链上操作步骤说明与执行面：
  - 周奖励 `deposit/fund` 与 `publish root`
  - 购买型 NFT 补贴 `publishSubsidyEpoch`
- 为两条流程增加操作结果、审计信息、失败原因、下一步建议
- 扩展 shared admin DTO / query hooks / 页面模型，统一 server 与 admin 口径
- 补齐 runbook / execution 记录 / targeted verification

### 2.2 Touched Modules

- [apps/admin/src/components/layout/admin-shell.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/layout/admin-shell.tsx)
- [apps/admin/src/features/ops/components/ops-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/ops/components/ops-page.tsx)
- `apps/admin/src/features/**/components/*settlement*`
- `apps/admin/src/features/**/components/*subsidy*`
- [apps/admin/src/api/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
- [apps/admin/src/queries/admin.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
- [apps/admin/src/lib/wagmi-config.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/lib/wagmi-config.tsx)
- [apps/server/src/modules/admin/admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
- [apps/server/src/modules/admin/services/admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [apps/server/src/modules/rewards/services/reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts)
- [apps/server/src/modules/rewards/services/rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- [apps/server/src/modules/shared/services/promotion-chain-client.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/services/promotion-chain-client.service.ts)
- [apps/server/src/configuration/config.types.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.types.ts)
- [apps/server/src/configuration/config.configuration.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts)
- [apps/server/src/modules/claims/services/purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- [apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- `docs/runbooks/*`

### 2.3 User-Facing Outcomes

- 运营在后台可以看清“这周能不能结算、为什么不能结算、下一步该点什么”
- 运营不需要再记忆 `draft -> publish -> 链上动作 -> activate` 的散乱顺序
- 购买型 NFT 补贴发布不再只依赖命令行与口口相传的 wallet 规则
- 页面能明确说明：
  - 成功
  - 失败
  - 条件不足
  - 需要切换哪个钱包或补足什么链上资源

## 3. Out Of Scope

- 不改动周奖励数学规则、抽奖规则、业绩奖规则
- 不改动 `MerkleClaim`、`Settlement`、`FounderNFT`、`NFTSale` 合约逻辑
- 不把 server 改造成托管私钥的热钱包执行器
- 不引入自动 cron “到点全自动结算”
- 不改 Prisma schema，除非实施阶段发现完全无法满足审计需求
- 不重做整个 admin 视觉系统，只在现有设计语言上扩展高可读流程页面

## 4. Assumptions

### 4.1 Product / Ops Assumptions

- `Weekly Settlement` 与 `Purchased NFT Subsidy` 必须拆成两个独立页面或两个主模块，不做 giant form 合并
- 每一步都必须有简短说明，避免运营只看到按钮却不知道副作用
- `Weekly Settlement` 需要把“可执行”和“可见但被阻塞”区分清楚
- `Purchased NFT Subsidy` 需要明确说明当前权限/出资模型与周奖励不同

### 4.2 Technical Assumptions

- `admin` 已具备钱包连接能力，可作为链上执行面的 UI 容器
- V1 默认采用“后台分步向导 + 已连接管理员钱包确认链上动作”模式
- server 负责：
  - 业务计算
  - preview / blockers
  - 状态判断
  - DB 内部步骤执行
- 前端钱包负责：
  - 需要 operator 明确确认的链上写操作
- 现有 `manifest` 中已经有 `financeWallet / rewardFunderAddress / settlementPublisher / rootPublisher`，但 server runtime 目前没有完整暴露这些角色，需要补齐只读配置透传

### 4.3 Safety Assumptions

- 不在 V1 中把 `rootPublisher`、`settlementPublisher`、`financeWallet` 私钥放进 server
- 高风险步骤必须可重试、可审计、可解释
- 激活 claimability 前必须明确校验：
  - on-chain root
  - distributor funding
  - allowance / balance
  - epoch state

## 5. Architecture Impact

### 5.1 Current Constraints

- 当前 [apps/admin/src/features/ops/components/ops-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/ops/components/ops-page.tsx) 只暴露 `epoch sync` 与 reward `activate`，并明确把 root/funding/manual UAT 留在页面外。
- 当前 [apps/server/src/modules/rewards/services/reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts) 只做 preview 与 activate readiness 判断，没有把 `draft` / `publish` 收进 admin API。
- 当前 [apps/server/scripts/settle-weekly-epoch-rewards.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/settle-weekly-epoch-rewards.ts) 仍承载 `draft/publish/activate` 脚本入口。
- 当前 [apps/server/src/modules/shared/services/promotion-chain-client.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/services/promotion-chain-client.service.ts) 主要提供 promotion 公共链读能力，没有通用链上写入编排层。
- 当前 `manifest` 已有 `financeWallet / settlementPublisher / rootPublisher`，但 [apps/server/src/configuration/config.types.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.types.ts) 尚未完整暴露这些角色到 server/admin 视图。
- 周奖励与购买补贴的链上权限模型并不对称：
  - `MerkleClaim` 可由 `owner/rootPublisher` 调用，并从 `rewardFunder` allowance 拉取资金
  - `Settlement.publishSubsidyEpoch()` 由 `owner/epochPublisher` 调用，且资金直接来自 `msg.sender`

### 5.2 Target Architecture

- 在 server 内形成两个受控 read/write 流程：
  - `Weekly Settlement Center Service`
  - `Purchased NFT Subsidy Center Service`
- 在 admin 内形成两个清晰的 operator surface：
  - `Settlement Overview + Stepper`
  - `Subsidy Overview + Publish Flow`
- 统一 UI 状态词：
  - `Ready`
  - `Blocked`
  - `Completed`
  - `Failed`
- 统一步骤说明：
  - 当前做什么
  - 依赖什么
  - 成功会产出什么
  - 失败通常意味着什么
- 对链上动作采用“准备数据由 server 给、交易由前端钱包确认”的受控边界

### 5.3 V1 Recommended Flow

#### Weekly Settlement

1. `Epoch Sync`
2. `Generate Draft`
3. `Publish Draft`
4. `Fund Distributor`（仅在 distributor 余额不足时出现或标记阻塞）
5. `Publish Merkle Root`
6. `Activate Claims`

#### Purchased NFT Subsidy

1. 选择 `epochNo / subsidyAmount / claimDeadline`
2. 预检查当前连接钱包是否满足 `settlementPublisher / financeWallet / gas / balance` 约束
3. 执行 `publishSubsidyEpoch`
4. 回显链上结果、已发布 epoch 信息、claim deadline、预算与下一步说明

### 5.4 Why Two Pages Instead Of One

- `Weekly Settlement` 是“server 计算 + DB 步骤 + 部分链上动作”的混合流程
- `Purchased NFT Subsidy` 是“链上发布即资金锁定”的单笔重动作
- 两者在角色要求、资金来源、失败恢复、结果查看方式上都不同
- 强行合并会让页面看起来统一，但操作认知反而更差

## 6. Milestones

## 6.1 Milestone A: Workflow Freeze And Shared View Models

### goal

冻结 V1 的页面边界、步骤名称、状态词、钱包角色模型，以及 server/admin 共享视图结构。

### affected files/modules

- [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- [packages/common/src/validators/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/admin.ts)
- [apps/server/src/configuration/config.types.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.types.ts)
- [apps/server/src/configuration/config.configuration.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts)
- [apps/server/src/modules/shared/services/promotion-chain-client.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/services/promotion-chain-client.service.ts)

### implementation notes

- 为 `Weekly Settlement` 定义新的 overview / preconditions / steps / action-result 视图模型
- 为 `Purchased NFT Subsidy` 定义新的 overview / publish-preview / publish-result 视图模型
- 透传并标准化 runtime role/address：
  - `owner`
  - `rootPublisher`
  - `rewardFunderAddress`
  - `financeWallet`
  - `settlementPublisher`
  - `merkleDistributorAddress`
  - `settlementAddress`
- 统一 blockers / warnings / next action 文案结构，避免 server 返回自由文本碎片

### risks

- shared model 设计过窄会导致后续页面继续塞 JSON preview
- role/config 没有统一口径，会让“为什么不能执行”解释不可信

### verification commands

- `pnpm --dir packages/common exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`

### expected outputs

- shared admin view/model 定稿
- server 能稳定读到 settlement/operator 相关 runtime roles

## 6.2 Milestone B: Weekly Settlement Readiness APIs

### goal

把周结算需要的全部前置检查、当前状态、最近执行结果和步骤阻塞原因做成可视化 API。

### affected files/modules

- [apps/server/src/modules/admin/admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
- [apps/server/src/modules/admin/services/admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [apps/server/src/modules/rewards/services/reward-publication.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts)
- [apps/server/src/modules/rewards/services/rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- `apps/server/src/modules/epoch/**`

### implementation notes

- 新增“周结算详情/预检查”接口，而不是继续让前端自己拼多个 preview
- 接口需一次返回：
  - 当前 epoch 与边界
  - latest epochs
  - participantCount / qualifiedTicketCount
  - draft/publish/activate 状态
  - distributor balance
  - rewardFunder balance / allowance
  - on-chain merkle root vs draft root
  - epoch 是否已到结算时间
  - 下一步推荐动作
- 明确区分：
  - `blocked by business rule`
  - `blocked by chain state`
  - `blocked by wallet role`
  - `already completed`

### risks

- 若仍沿用多个独立 preview，前端状态组合会继续复杂且容易不一致
- 若不把 blockers 结构化，页面只能回退到原始 JSON

### verification commands

- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec jest src/modules/admin/services/admin-ops.service.spec.ts src/modules/rewards/services/reward-publication.service.spec.ts --runInBand`

### expected outputs

- admin 能拿到单一来源的 weekly settlement readiness 数据
- 所有阻塞原因都能结构化展示

## 6.3 Milestone C: Weekly Settlement Execution APIs

### goal

把当前脚本依赖的周结算后端步骤收进安全的 admin API，覆盖 `draft / publish / activate`，并保留幂等与审计。

### affected files/modules

- [apps/server/src/modules/admin/admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
- [apps/server/src/modules/admin/services/admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [apps/server/src/modules/rewards/services/rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- [apps/server/src/modules/audit/**](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/audit)
- [apps/server/scripts/settle-weekly-epoch-rewards.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/settle-weekly-epoch-rewards.ts)

### implementation notes

- 将脚本背后的核心 service 作为 admin execute 接口暴露，而不是在 controller 中复制逻辑
- 对每一步提供：
  - preview
  - execute
  - last result / error envelope
- `draft` 与 `publish` 必须支持安全重试
- `activate` 保留“只有 root/funding 条件达标才允许执行”的守门逻辑
- 脚本可继续保留为 fallback，但后台路径应成为默认操作面

### risks

- 若执行 API 直接复用脚本输出结构，前端交互体验会很差
- 若幂等/状态检查不足，重复点击可能导致重复 publish 或误判下一步

### verification commands

- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/server exec jest src/modules/rewards/services/rewards.service.spec.ts src/modules/admin/services/admin-ops.service.spec.ts --runInBand`

### expected outputs

- 周结算的 server 内部步骤无需依赖命令行即可执行
- 所有执行动作都有审计日志与可读结果

## 6.4 Milestone D: Admin Weekly Settlement Wizard

### goal

在 admin 中落地周结算向导页面，做到“数据清晰、步骤清晰、界面简洁、按钮可执行、说明可读”。

### affected files/modules

- [apps/admin/src/components/layout/admin-shell.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/layout/admin-shell.tsx)
- [apps/admin/src/api/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
- [apps/admin/src/queries/admin.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
- [apps/admin/src/features/ops/components/ops-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/ops/components/ops-page.tsx)
- `apps/admin/src/app/dashboard/settlement/page.tsx`
- `apps/admin/src/features/settlement/components/*`
- [apps/admin/src/lib/wagmi-config.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/lib/wagmi-config.tsx)

### implementation notes

- 独立页面，不把新流程继续堆进现有 `OpsPage`
- 页面结构建议：
  - overview cards
  - preconditions checklist
  - stepper cards
  - action result / audit panel
- 链上动作默认采用已连接钱包确认：
  - `depositRewardsFromFunder`
  - `publishRoot`
- 若当前连接钱包不匹配 `rootPublisher / owner / admin allowlist`，页面明确阻塞原因和切换建议
- 默认隐藏低层 JSON，必要时提供“技术详情”折叠区

### risks

- 若继续保留大段 JSON preview，页面会看起来像 debug console 而不是 operator center
- 若链上步骤没有钱包角色说明，运营会误以为任意 admin 钱包都能完成所有动作

### verification commands

- `pnpm --dir apps/admin exec tsc -p tsconfig.typecheck.json --noEmit`
- `pnpm --dir apps/admin exec eslint src --ext .ts,.tsx`
- `pnpm run local:testnet:admin`

### expected outputs

- admin 中出现可用的 weekly settlement 页面
- 运营无需脚本即可完成 server-side 结算步骤，并能按引导执行链上动作

## 6.5 Milestone E: Purchased NFT Subsidy Center

### goal

为购买型 NFT 周补贴建立独立的后台中心，覆盖发布前检查、链上发布、发布后结果与说明。

### affected files/modules

- [apps/server/src/modules/admin/admin-ops.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-ops.controller.ts)
- [apps/server/src/modules/admin/services/admin-ops.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts)
- [apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts)
- [apps/server/src/modules/claims/services/purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts)
- [apps/admin/src/api/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts)
- [apps/admin/src/queries/admin.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts)
- `apps/admin/src/app/dashboard/subsidy/page.tsx`
- `apps/admin/src/features/subsidy/components/*`

### implementation notes

- 展示已发布 subsidy epochs、claim deadline、remaining budget、eligible purchased supply、claimed progress
- 提供发布前预检查：
  - settlement address
  - 当前连接钱包是否为 `settlementPublisher / owner`
  - 当前连接钱包是否也是资金提供者模型下可执行钱包
  - `MockUSDT` 余额
  - gas 预估
- 链上发布步骤由当前连接钱包执行 `publishSubsidyEpoch`
- 页面需明确说明该流程与 weekly settlement 的不同点：
  - 资金来自调用者自己
  - publish 即锁定预算
  - claim deadline 到期后才可回收剩余预算

### risks

- 如果不把资金来源差异讲清楚，运营会误以为 subsidy publish 也能像 merkle funding 一样从第三方 allowance 拉款
- 若缺少已发布 epoch 回显，页面会再次退化成“点完不知道有没有成功”

### verification commands

- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/admin exec tsc -p tsconfig.typecheck.json --noEmit`
- `pnpm run local:testnet:server`
- `pnpm run local:testnet:admin`

### expected outputs

- admin 中出现独立的 purchased NFT subsidy operator center
- operator 能明确知道何时可发、为什么不可发、发完后结果如何

## 6.6 Milestone F: Docs, Runbooks, And End-To-End Verification

### goal

把新流程文档化、验证化、可交接化，避免页面上线后仍依赖口头说明。

### affected files/modules

- `docs/runbooks/*weekly*`
- `docs/runbooks/*subsidy*`
- [docs/plan-excution/admin-settlement-and-subsidy-center/execution.md](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/admin-settlement-and-subsidy-center/execution.md)

### implementation notes

- 更新 runbook，明确：
  - 哪些步骤是后台按钮
  - 哪些步骤是链上钱包确认
  - 常见 blockers 与处理方法
- 本地 `testnet-mockusdt` 下进行一轮手工联调
- 记录实际执行顺序、钱包要求、预期输出、失败恢复路径

### risks

- 若只改页面不改 runbook，运营迁移成本仍然高
- 若不做 end-to-end 联调，步骤间断层会在上线后暴露

### verification commands

- `pnpm run local:testnet:common`
- `pnpm run local:testnet:server`
- `pnpm run local:testnet:admin`
- `curl -s http://127.0.0.1:3110/api/health`
- 手工验证 weekly settlement 和 subsidy publish 流程各 1 次

### expected outputs

- 新 operator flow 有可交接 runbook
- execution.md 记录真实验证证据

## 6.7 Recommended Parallel Agent Execution

### wave 1

- `Agent A`: shared models + config/runtime role exposure + weekly readiness API
- `Agent B`: weekly execute API + audit/result envelopes

### wave 2

- `Agent C`: admin weekly settlement UI + wallet execution hooks
- `Agent D`: subsidy center backend + admin UI

### wave 3

- `Integrator`: docs/runbook/end-to-end verification/final polish

### coordination notes

- `Agent A` 与 `Agent B` 可以并行，但需先约定 shared DTO shape
- `Agent C` 依赖 weekly API shape 稳定后再接入
- `Agent D` 可与 `Agent C` 并行，只要 subsidy DTO 不与 weekly DTO 相互耦合
- `Integrator` 负责统一 blockers 文案、状态词、按钮说明和最终验证

## 7. Approval Checkpoint

进入实现前，需要你确认以下 V1 决策：

- 采用“两页/两模块”而不是单页 giant form
- 采用“后台分步向导 + 已连接钱包确认链上动作”而不是 server 托管私钥
- 周结算页面显式包含 `Fund Distributor` 步骤
- 购买补贴页面显式强调其资金来源与权限模型不同于 weekly settlement
- 本轮默认不改 Prisma schema，不改合约

若以上方向继续成立，即可进入实施。

## 8. Rollback / Recovery Notes

- 若 weekly settlement 新 UI 未完成，可继续保留现有：
  - `OpsPage` 的 `epoch sync`
  - `Reward Publication preview/activate`
  - `settle-weekly-epoch-rewards.ts`
- 若 subsidy center 未完成，可继续保留现有链上手工 publish 路径
- 新增页面与 API 应尽量 additive，不覆盖旧入口，直到端到端验证完成
- 若链上交互部分风险过高，可先上线“可视化检查 + 服务端步骤 + 手工钱包说明”，把 wallet 按钮延后到下一轮

## 9. Final Verification Checklist

- [ ] `Weekly Settlement` 页面能清晰展示当前 epoch、状态、池子、blockers、下一步
- [ ] `draft / publish / activate` 不再依赖命令行脚本才能完成
- [ ] `Fund Distributor` 与 `Publish Root` 的钱包角色要求可视化且可操作
- [ ] `Purchased NFT Subsidy` 页面能展示 preflight、已发布 epochs、预算、claim deadline、结果
- [ ] 所有高风险动作都有审计记录
- [ ] `packages/common`、`apps/server`、`apps/admin` 通过 typecheck / targeted tests
- [ ] `testnet-mockusdt` 本地联调验证 weekly settlement 与 subsidy publish 各至少 1 次
- [ ] `execution.md` 记录真实命令、结果、偏差与遗留风险
