# Consolation AURA Profile Projection Fix

## 1. Objective
修复每周抽奖安慰奖 `CONSOLATION_AURA` 在已生成 `WeeklyReward` 奖励记录后，未稳定投影到用户累计资料 `UserProfile.totalAuraFromConsolation` 的问题，并为已遗漏的历史奖励提供可审计、幂等的回填路径，确保：

- `Rewards` 页展示的安慰奖不会“只显示不累计”
- 首页累计 AURA 与奖励账本口径一致
- 重跑发布或回填时不会重复记账

## 2. Scope

### 2.1 In Scope
- `apps/server` 中安慰奖发布、账本写入、日统计投影、用户累计投影链路排查与修复
- 为安慰奖补充“投影缺失但 ledger 已存在”场景的幂等补偿逻辑
- 为已发生遗漏的安慰奖提供 backfill 脚本或服务入口
- 补充针对该问题的 server 单测
- 更新本任务执行记录

### 2.2 Affected Domains
- 周奖励发布
- AURA 账本
- 用户累计画像
- Dashboard 总 AURA 展示

## 3. Out of Scope
- 将安慰奖接入 `claims` 页或链上 claim 流程
- 修改抽奖资格、抽奖揭晓、排名奖励或 NFT 补贴规则
- 修改 `WeeklyReward` / `AuraLedger` 的业务语义
- 处理与本问题无关的 fork runtime / NFT 合约地址漂移

## 4. Assumptions
- 安慰奖的正确产品语义仍然是：发布后直接计入站内 AURA 累计，而不是用户手动 claim
- 当前缺失主要发生在“ledger 已存在但 profile projection 未完成”这一类中断/不一致场景
- 现有 `AuraLedger` 可以作为回填的审计来源，优先信任已确认 ledger 而不是重新推断奖励
- 本轮修复应优先保证幂等与可恢复，不追求一次性大重构

## 5. Architecture Impact

### 5.1 Server Services
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
  - 当前发布安慰奖时，一旦发现已存在 `CONSOLATION` ledger 就直接 `continue`
  - 这会导致“ledger 已存在但 profile/daily projection 缺失”时无法自愈

### 5.2 Stats Projection
- [stats.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats/repositories/stats.repository.ts)
  - 当前 `applyProfileConsolationProjection` 只负责 `increment`
  - 需要由上层决定何时补投影、如何避免重复累计

### 5.3 UI Read Path
- [dashboard-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx)
  - 首页总 AURA 直接依赖 `UserProfile.totalAuraFromConsolation`
  - 因此后端投影缺失会直接表现为首页累计错误

## 6. Milestones

### 6.1 Milestone A — Root Cause Confirmation

#### Goal
确认安慰奖漏累计的具体断点，并把“为什么当前发布逻辑不会自愈”落实到代码与数据证据。

#### Affected Files / Modules
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- [ledger.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/ledger/repositories/ledger.repository.ts)
- [stats.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/stats/repositories/stats.repository.ts)
- 本地 `fork-anvil` 数据库

#### Implementation Notes
- 检查安慰奖发布流程：
  - `WeeklyReward` 是否存在
  - `AuraLedger` 是否存在
  - `UserDailyStat.consolationAura` 是否存在
  - `UserProfile.totalAuraFromConsolation` 是否存在
- 特别验证 `existingLedger -> continue` 是否会跳过后续 projection

#### Risks
- 如果根因不止一处，单点修补可能留下其他不一致入口

#### Verification Commands
- `rg -n "CONSOLATION_AURA|applyProfileConsolationProjection|upsertDailyConsolationProjection" apps/server`
- 本地 Prisma/DB 查询目标用户奖励、ledger、profile 状态

#### Expected Outputs
- 明确的根因结论
- 回填应基于哪张表的结论

### 6.2 Milestone B — Publish Path Self-Heal Fix

#### Goal
让安慰奖发布路径在“ledger 已存在但 projection 缺失”时可以安全补齐，而不是直接跳过。

#### Affected Files / Modules
- [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts)
- 可能新增 server 内部小型 projection helper/service

#### Implementation Notes
- 将“创建 ledger”和“补 projection”从单一 `existingLedger` 分支里拆开
- 需要设计幂等判定，避免对已累计的用户再次 `increment`
- 优先考虑以 reward/ledger 为来源进行差异补投影，而不是无条件重复写

#### Risks
- 最主要风险是重复累计 AURA，影响首页口径和树统计
- 必须确保补投影逻辑可重跑

#### Verification Commands
- `pnpm --dir apps/server test -- rewards.service.spec.ts`
- 视实现情况补充新的 spec

#### Expected Outputs
- 重新发布或重放时，profile projection 能自愈
- 已正确累计的用户不会被重复累计

### 6.3 Milestone C — Historical Backfill

#### Goal
为已经产生但未累计到 `UserProfile` 的安慰奖提供可审计 backfill。

#### Affected Files / Modules
- `apps/server/scripts/...` 或 `scripts/uat/...` 下的回填脚本
- 可能新增 server service 用于回填逻辑复用

#### Implementation Notes
- 回填输入建议基于：
  - `AuraLedger` 中 `sourceType = CONSOLATION`
  - 与 `UserProfile.totalAuraFromConsolation` / `UserDailyStat.consolationAura` 对比
- 回填过程必须输出：
  - 扫描数量
  - 补齐数量
  - 跳过数量
  - 用户维度明细或摘要

#### Risks
- 跨多期回填时容易重复计入
- 回填脚本如果直接用 `increment`，必须先有差异判定

#### Verification Commands
- 在 `fork-anvil` 上 dry-run 或针对目标钱包试跑
- DB 查询回填前后 profile 字段变化

#### Expected Outputs
- 目标用户 `0x3C44...93BC` 的安慰奖 100 AURA 能进入首页累计
- 回填结果具备审计日志

### 6.4 Milestone D — Verification and Regression Guard

#### Goal
确保修复不会破坏现有奖励发布与 dashboard 展示。

#### Affected Files / Modules
- server 单测
- dapp 读模型验证

#### Implementation Notes
- 增加“ledger 已存在但 profile 未投影”的测试夹具
- 验证 dashboard 读取的 profile 总额符合预期

#### Risks
- 只测单条安慰奖可能漏掉多期累计场景

#### Verification Commands
- `pnpm --dir apps/server test -- rewards.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/dapp typecheck`

#### Expected Outputs
- 新增测试覆盖关键回归点
- `fork-anvil` 目标用户首页累计修复为正确值

## 7. Approval Checkpoint
本任务属于 **Critical**：
- 影响奖励累计口径
- 影响用户首页总 AURA 展示
- 涉及历史数据 backfill

在开始实现前，需要你确认这份计划，尤其是：
- 安慰奖仍保持“直接累计，不进 claims”
- 本轮允许做一次幂等 backfill

## 8. Rollback / Recovery Notes
- 代码层：若发布路径修复引入异常，可回退到修复前版本
- 数据层：backfill 必须先提供 dry-run 或可审计输出，避免不可逆重复累计
- 如果发现历史数据污染，应优先停用 backfill 脚本，保留扫描结果，再决定是否做反向修正

## 9. Final Verification Checklist
- 安慰奖 `WeeklyReward`、`AuraLedger`、`UserDailyStat`、`UserProfile` 口径一致
- `Rewards` 页安慰奖展示与首页累计一致
- 目标钱包 `0x3C44...93BC` 的 100 AURA 已进入首页总额
- 发布路径对“已存在 ledger”场景具备自愈能力
- 单测覆盖“首次发布”和“缺失投影回补”场景
- `execution.md` 记录真实命令、结果与任何偏差
