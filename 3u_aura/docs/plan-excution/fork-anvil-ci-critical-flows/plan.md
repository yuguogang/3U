# Fork Anvil CI Critical Flows

## 1. Objective

把当前 `fork-anvil + fresh contracts + reset DB + server` 能力收敛成一条正式的 CI 关键链路，覆盖你指定的高价值路径：

- 购买 NFT
- 周结算 admin / server 编排
- 领取奖励
- 审批 / 发放 / 赠予 NFT

目标不是把整个 `dapp/admin` 页面交互搬进 CI，而是让：

- 链上状态
- server / admin API
- 数据库投影
- claim / settlement 状态机

在一条可重复、确定性的 fork 流程里完成验证。

## 2. Scope

### 2.1 In Scope

- 扩展 [scripts/ci](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci) 下的关键流分组
- 复用 [scripts/ci/lib/harness.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/harness.mjs) 的 `fork-anvil + server` 启动能力
- 把 weekly settlement 关键编排从现有 `uat` 脚本抽成可进 CI 的稳定路径：
  - epoch sync
  - weekly draft
  - weekly publish
  - funding
  - publish root
  - activate
- 把 referral 的审批 / gift / multi-mint same wallet 收进 CI
- 把 purchased reconcile / subsidy projection gate 接入 weekly / subsidy 相关验证
- 明确哪些页面层验证只做 smoke，哪些不进默认 CI
- 更新执行计划与命令说明

### 2.2 Affected Modules

- [scripts/ci/run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs)
- [scripts/ci/run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs)
- [scripts/ci/lib/harness.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/harness.mjs)
- [scripts/ci/lib/server.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/server.mjs)
- [scripts/ci/lib/contracts.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/contracts.mjs)
- [scripts/ci/lib/weekly-merkle-claim-flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/weekly-merkle-claim-flow.mjs)
- [scripts/ci/commands](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands)
- [scripts/uat/run-weekly-fork-scenarios.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/run-weekly-fork-scenarios.mjs)
- [scripts/uat/materialize-weekly-fork-draft.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/materialize-weekly-fork-draft.mjs)
- [scripts/uat/publish-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/publish-weekly-fork-claims.mjs)
- [scripts/uat/activate-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/activate-weekly-fork-claims.mjs)
- [scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs)
- [apps/server/src/modules/admin](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin)
- [apps/server/src/modules/claims](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims)
- [apps/server/src/modules/nft-eligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility)

### 2.3 Out of Scope

- 把复杂 `dapp/admin` 浏览器页面交互纳入默认 CI
- 完整 indexer worker
- 线上 testnet / VPS 自动部署
- GitHub Actions workflow 细节以外的仓库外基础设施改造

## 3. Assumptions

- 默认 CI 仍以 `fork-anvil` 环境为主，不直接依赖外部 testnet
- 页面层只做少量 smoke 或显式 UAT，不作为高价值路径主 gate
- weekly settlement 在 CI 中优先验证 server/admin API 与链上编排，而不是点 admin 页面按钮
- purchased reconcile 属于 weekly/subsidy 相关 flow 的前置保护，不单独替代 indexer

## 4. Architecture Impact

### 4.1 Current State

- 当前 CI 已经覆盖：
  - login / inviter bind / tree placement
  - checkin
  - nft purchase
  - referral mint
  - subsidy claim
  - merkle claim
  入口在 [run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs) 与 [run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs)
- 当前 weekly 更强的编排主要在 `uat`：
  - [run-weekly-fork-scenarios.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/run-weekly-fork-scenarios.mjs)
  - [materialize-weekly-fork-draft.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/materialize-weekly-fork-draft.mjs)
  - [publish-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/publish-weekly-fork-claims.mjs)
  - [activate-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/activate-weekly-fork-claims.mjs)
- referral CI 仍偏旧：
  - [referral-mint.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/referral-mint.flow.mjs) 里还含有 ad hoc DB 写入思路，需要收敛到新的 eligibility / gift API

### 4.2 Target State

- `scripts/ci` 成为默认关键业务 gate
- `scripts/uat` 保留为：
  - 更长链路
  - 页面 smoke
  - operator 手工验证
- weekly settlement 在 CI 中具备一条明确的、可断言的 server/admin API 编排流程
- referral 审批 / gift / multi-issue 进入 CI，而不是只靠单测和手工验证
- purchased reconcile 被纳入 subsidy / weekly 关键路径前置检查

## 5. Milestones

### Milestone 1 — Freeze CI Coverage Matrix

#### goal

确定哪些场景进入默认 CI，哪些保留为显式 UAT / smoke，避免范围继续膨胀。

#### affected files/modules

- [scripts/ci/run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs)
- [scripts/ci/run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs)
- 本计划文件

#### implementation notes

- 建议分成 4 组：
  - `nft`
  - `referral`
  - `weekly`
  - `claims`
- 明确：
  - admin 页面不作为主 gate
  - admin API / server API / contract writes 作为主 gate

#### risks

- 如果 coverage matrix 不先冻结，很容易把 flaky 页面交互混进默认 CI

#### verification commands

- `sed -n '1,260p' scripts/ci/run.mjs`
- `sed -n '1,260p' scripts/ci/run-all.mjs`

#### expected outputs

- CI 分组边界清晰
- 页面 smoke 与默认 gate 的职责分开

### Milestone 2 — Referral Approval / Gift / Multi-Mint CI

#### goal

把新的 referral 业务语义真正纳入 CI：

- 审批 mint
- gift mint
- 同钱包多次 mint

#### affected files/modules

- [scripts/ci/commands/referral-mint.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/referral-mint.flow.mjs)
- [scripts/ci/commands/referral-mint-derived.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/referral-mint-derived.flow.mjs)
- [scripts/ci/lib/server.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/server.mjs)
- 可能新增 `gift` flow

#### implementation notes

- 去掉 ad hoc DB patch 做法
- 改为走新的 admin `nft-eligibility approve/gift` API
- 加入同钱包第二次 mint 的断言

#### risks

- 如果继续靠临时 DB 脚本，CI 会和真实 server 业务流脱节

#### verification commands

- `node scripts/ci/run.mjs referral-approval`
- `node scripts/ci/run.mjs referral-derived`
- 新增 `gift` flow 验证命令

#### expected outputs

- referral 审批 / gift / multi-mint 被 CI 主链路覆盖

### Milestone 3 — Weekly Settlement CI Lane

#### goal

把 weekly settlement 的关键编排从长 UAT 流中抽成正式 CI 关键组。

#### affected files/modules

- [scripts/ci/lib/weekly-merkle-claim-flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/weekly-merkle-claim-flow.mjs)
- 新增/重构 weekly settlement CI flow
- [scripts/ci/lib/server.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/server.mjs)
- 复用 [scripts/uat/materialize-weekly-fork-draft.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/materialize-weekly-fork-draft.mjs)
- 复用 [scripts/uat/publish-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/publish-weekly-fork-claims.mjs)
- 复用 [scripts/uat/activate-weekly-fork-claims.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/activate-weekly-fork-claims.mjs)

#### implementation notes

- 直接验证：
  - epoch sync
  - draft
  - publish
  - funding
  - publish root
  - activate
- 增加双轨断言：
  - lottery lane rollover 不影响 ranking lane
  - `50/50` pool split 生效

#### risks

- 如果 weekly 仍只靠 UAT，关键结算变更不会进入默认 gate

#### verification commands

- 新 weekly CI flow 单独运行
- `node scripts/ci/run-all.mjs`

#### expected outputs

- weekly settlement 关键路径进入默认 CI
- 双轨结算语义有自动回归保护

### Milestone 4 — Subsidy / Purchased Reconcile CI Gate

#### goal

让 subsidy / purchased 持仓同步缺口在 CI 里可见且可断言。

#### affected files/modules

- [scripts/ci/commands/subsidy-claim.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/subsidy-claim.flow.mjs)
- [scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs)
- [scripts/ci/lib/server.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/server.mjs)
- 必要时新增 admin subsidy preview 校验 flow

#### implementation notes

- 把 purchased reconcile 放进 subsidy 发布或 claim 前
- 断言：
  - projection gap 为 0，或至少在预期范围内被修复
  - claimability 与 DB 投影一致

#### risks

- 如果只测 subsidy claim 成功，不测 projection gap，之前“12 张卡只有 8 个补贴”的问题仍可能漏出

#### verification commands

- `node scripts/ci/run.mjs subsidy-claim`
- 新增 reconcile/gate flow

#### expected outputs

- purchased projection 差异不再静默漏过

### Milestone 5 — CI Grouping And Operator Docs Alignment

#### goal

把新的 CI 入口、分组和 operator 说明收口，避免脚本存在但没人知道怎么用。

#### affected files/modules

- [scripts/ci/run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs)
- [scripts/ci/run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs)
- [docs/runbooks/testnet-mockusdt-online-repair.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md)
- [docs/runbooks/testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
- 本任务 `execution.md`

#### implementation notes

- `run-all` 按新的 group 组织
- 文档中明确：
  - 默认 CI 做什么
  - 显式 UAT 做什么

#### risks

- 如果入口分散，团队会继续把关键流程放回手工验证

#### verification commands

- `sed -n '1,260p' scripts/ci/run-all.mjs`
- `node scripts/ci/run-all.mjs`

#### expected outputs

- CI / UAT 分工清楚
- 关键流能用一条命令跑完

## 6. Approval Checkpoint

开始实现前，请确认这两个执行边界：

1. `周结算 admin` 默认指 **admin/server API 编排 + 链上调用验证**，不是浏览器点页面按钮。
2. `dapp/admin` 页面层只保留 smoke 或显式 UAT，不进入默认 CI 主 gate。

## 7. Rollback / Recovery Notes

- 如果 weekly CI lane 不稳定，可先只保留：
  - nft
  - referral
  - claims
  三组进入默认 CI，weekly 继续留在 opt-in
- 如果 referral gift flow 依赖的 server/admin API 还不稳定，可先单独落一个 flow，不并入 `run-all`
- 所有新增 CI flow 都应基于 `fork-anvil` 独立 reset，避免组间污染

## 8. Final Verification Checklist

- [ ] 新增 CI flow 都能在 `fork-anvil + server` 下独立通过
- [ ] `run-all` 能按新 grouping 完整运行
- [ ] referral 审批 / gift / multi-mint 已被 CI 覆盖
- [ ] weekly settlement 双轨语义已被 CI 覆盖
- [ ] subsidy / purchased reconcile gap 已被 CI 显式检查
- [ ] `execution.md` 记录了真实命令与结果
