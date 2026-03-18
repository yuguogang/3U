# Execution: Server + Contract CI Full Coverage

## Status
In progress. `Milestone 1` 已收敛为可执行的覆盖/运行契约，`Milestone 2` 已完成第一轮 harness 落地与入口修复；最小真实 flow (`login`) 已验证通过，但 fork-anvil 在当前沙箱中仍需要提权运行 anvil。

## Last Updated
2026-03-18 14:35:00 +0800

## Summary
- 本任务由原 `ci-contract-tests` 过继并重命名而来。
- 旧任务中的基础设施探索与脚本雏形被视为“可参考现状”，但不再作为新任务完成度依据。
- 新任务目标是把 `server + contract CI` 建成 promotion 主业务回归层，覆盖完整业务流程。
- 已纳入 fork/anvil runtime manifest 与 Foundry broadcast 保留/清理策略，避免本地 `chainId = 97` 运行污染真实测试网广播证据。
- 已根据计划完备性复查结果补强：
  - 高风险流程的 happy / duplicate-retry / failure-recovery 覆盖要求
  - 更细粒度的里程碑拆分
  - harness 管理的 server bootstrap 契约
  - 地址真相源优先级与 runtime manifest 过渡策略
- 已开始实现 `scripts/ci` 基础设施收敛：
  - 统一 runner 入口
  - 统一 harness 生命周期
  - runtime manifest 优先读取
  - fork/anvil 本地归档目录
- 已确认 anvil 最小启动命令在提权环境下可正常运行，说明当前阻塞来自沙箱权限而非 CI harness 设计

## Re-baseline Notes
- 原目录：`docs/plan-excution/ci-contract-tests`
- 新目录：`docs/plan-excution/server-contract-ci-full-coverage`
- 处理原则：
  - 保留已有探索上下文
  - 重置完成度判断
  - 以新计划重新定义范围、里程碑和验收标准

## Work Completed
- 已完成任务目录重命名
- 已完成 `plan.md` 重写
- 已完成 `execution.md` 基线重写
- 已完成一次计划完备性复查
- 已将 `plan.md` 细化为 8 个可单轮验证的 milestones
- 已新增 `scripts/ci/lib/runtime.mjs`
- 已新增 `scripts/ci/lib/harness.mjs`
- 已新增 `scripts/ci/run.mjs`
- 已新增 `scripts/ci/run-all.mjs`
- 已新增 `scripts/ci/commands/login.flow.mjs`
- 已更新 `scripts/ci/package.json`，将入口从不存在的 `.ts` 修正为真实 `.mjs` / runner
- 已更新 `scripts/ci/lib/manifest.mjs`，使 fork/anvil 优先读取 CI runtime manifest
- 已更新 `scripts/ci/lib/anvil.mjs`：
  - 新增 anvil 健康探测与可复用判断
  - 部署后将广播文件复制到 `scripts/ci/.runtime/<env>/broadcasts/`
  - 写入 CI runtime/manifest
- 已更新现有 flow，使其共用 `prepareHarness` / `cleanupHarness`
- 已新增 `scripts/ci/.gitignore` 忽略 `.runtime/`
- 已完成一次真实 `login` flow 验证：
  - 复用运行中的 anvil
  - DB reset 成功
  - server auth + profile API 成功
  - cleanup 后 server 进程已停止
- 已完成一次真实 `inviter-bind` flow 验证：
  - anvil 启动/停止成功
  - 登录与 inviter 绑定 happy path 成功
  - duplicate bind 被验证为幂等成功，返回同一绑定结果
- 已完成一次真实 `tree-placement` flow 验证：
  - selectable slots 读取成功
  - placement bind happy path 成功
  - duplicate placement 被验证为幂等成功，返回同一 placement 结果
- 已完成一次真实 `checkin` flow 验证：
  - 链上转账 + API 提交成功
  - duplicate check-in 被验证为幂等成功
  - profile 总签到次数保持为 1，没有重复累加
- 已完成一次真实 `nft-purchase` flow 验证：
  - fresh contracts 部署成功
  - 链上购买成功
  - purchased NFT sync 成功
  - duplicate sync 保持相同 `tokenId/txHash`，且 `holdingsCreated` 从 `1` 变为 `0`

## Open Items
- 继续完成 `Milestone 2`：
  - 验证 server lifecycle helper 在可用 fork 环境下能稳定启动
  - 进一步确认 broadcast 隔离策略是否需要“复制后删除原文件”
- 继续推进 `Milestone 3+`：
  - 为 topology/payment/referral flow 增加更多非 happy-path 断言
  - 补齐 grouped runner 与更多 flow
- 需要补一条 harness 约束：
  - 当前 flow 共享同一 `fork-anvil/server` 运行时，不应并行执行；并行时 cleanup 会互相影响
- 当前需要先解决 fork-anvil 环境启动不稳定：
  - anvil nightly 参数兼容问题
  - 在当前沙箱中直接启动 anvil 需要提权

## Commands Run
- `mv docs/plan-excution/ci-contract-tests docs/plan-excution/server-contract-ci-full-coverage`
- `sed -n '1,220p' apps/server/package.json`
- `sed -n '1,220p' scripts/ci/package.json`
- `rg -n "start:dev|start:prod|dist/src/main|generated/prisma|health" apps/server scripts/ci -g '!**/node_modules/**'`
- `date '+%Y-%m-%d %H:%M:%S %z'`
- `rg --files scripts/ci`
- `find scripts/ci -maxdepth 2 -type f | sort`
- `sed -n '1,220p' scripts/ci/lib/anvil.mjs`
- `sed -n '1,220p' scripts/ci/lib/server.mjs`
- `sed -n '1,220p' scripts/ci/lib/manifest.mjs`
- `sed -n '1,320p' scripts/ci/lib/contracts.mjs`
- `for f in scripts/ci/commands/*.mjs; do sed -n '1,260p' "$f"; done`
- `find config/promotion-envs/fork-anvil -maxdepth 3 -type f | sort`
- `sed -n '1,260p' config/promotion-envs/fork-anvil/manifest.json`
- `sed -n '1,360p' scripts/uat/weekly-fork-lib.mjs`
- `sed -n '1,260p' config/promotion-envs/fork-anvil/services.runtime.json`
- `rg -n "services.runtime|readyUrl|env:start:prod|publicApiBaseUrl|runtime.json" scripts apps -g '!**/node_modules/**'`
- `rg -n "signature_signin|signature_message|inviter/bind|placement/bind|claims/referral-nft/sync|referral-mint-signature|selectable-slots|admin/ops/epochs/sync|claims/purchased-nft/sync|/api/v1/checkin" apps/server/src -g '!**/node_modules/**'`
- `node scripts/ci/run.mjs --help`
- `node scripts/ci/run-all.mjs --help`
- `node scripts/ci/run.mjs login`
- `sed -n '1,220p' config/promotion-envs/fork-anvil/anvil.log`
- `lsof -i :18545`
- `sed -n '940,1020p' scripts/uat/weekly-fork-lib.mjs`
- `tail -n 120 config/promotion-envs/fork-anvil/anvil.log`
- `node scripts/uat/start-weekly-fork.mjs --env fork-anvil`
- `tail -n 80 config/promotion-envs/fork-anvil/anvil.log`
- `/Users/ygg/.foundry/bin/anvil --help | sed -n '1,120p'`
- `/Users/ygg/.foundry/bin/anvil --host 127.0.0.1 --port 18545 --chain-id 97` (escalated)
- `node scripts/ci/run.mjs login` (escalated)
- `curl -s http://127.0.0.1:3210/api/v1/health`
- `kill -9 20546`
- `node scripts/ci/run.mjs inviter-bind` (escalated)
- `node scripts/ci/run.mjs tree-placement` (escalated)
- `node scripts/ci/run.mjs checkin` (escalated)
- `node scripts/ci/run.mjs nft-purchase` (escalated)

## Verification Results
- `node scripts/ci/run.mjs --help` passed
  - runner aliases resolve correctly
- `node scripts/ci/run-all.mjs --help` passed after fixing accidental execution-on-help behavior
- `node scripts/ci/run.mjs login` failed before reaching server auth assertions
  - failure point: `start-weekly-fork` could not bring up a healthy fork-anvil RPC
  - log evidence: `config/promotion-envs/fork-anvil/anvil.log`
  - observed issues in log:
    - nightly anvil flag compatibility noise (`--auto-impersonate`)
    - external fork RPC resolution failure
    - intermittent `Address already in use` messages from repeated starts
- Added `isAnvilReady()` short-circuit in `scripts/ci/lib/anvil.mjs` so future runs reuse a healthy local anvil instead of always re-spawning
- Minimal escalated verification passed
  - standalone anvil start works outside sandbox
  - `node scripts/ci/run.mjs login` works when reusing that anvil
  - login assertions succeeded:
    - access token flow passed
    - profile lookup returned valid `userId`
    - invite code returned as expected
  - post-cleanup `curl http://127.0.0.1:3210/api/v1/health` failed as expected because server had been stopped
- `node scripts/ci/run.mjs inviter-bind` passed outside sandbox
  - inviter bind happy path succeeded
  - duplicate inviter bind returned the same binding payload
  - inferred behavior: inviter bind endpoint is idempotent for same inviter/user pair
- `node scripts/ci/run.mjs tree-placement` passed outside sandbox
  - placement selectable slots read succeeded
  - placement bind happy path succeeded
  - duplicate placement returned the same placement payload
- `node scripts/ci/run.mjs checkin` passed outside sandbox
  - check-in happy path succeeded
  - duplicate check-in returned the same check-in payload
  - profile total check-in count remained `1`, confirming duplicate submission did not double count
- `node scripts/ci/run.mjs nft-purchase` passed outside sandbox
  - fresh contract deploy + purchase happy path succeeded
  - backend purchased NFT sync succeeded
  - duplicate sync preserved `tokenId` / `txHash`
  - duplicate sync changed `holdingsCreated` from `1` to `0`, confirming idempotent “no new insert” behavior

## Open Findings
- `scripts/uat/start-weekly-fork.mjs` currently depends on a fork environment that is not reliably reproducible in the present sandbox
- `fork-anvil` startup failure inside sandbox is upstream of the new CI harness; current blocker is environment permissions/readiness, not runner wiring
- Broadcast isolation is currently implemented as “copy into `scripts/ci/.runtime`”; original Foundry files are not yet auto-deleted to avoid accidental loss of evidence during first rollout
- duplicate inviter bind is not rejected; current business behavior is idempotent success, so CI assertions were adjusted to reflect that contract
- duplicate placement bind is also idempotent success for the same parent/slot/user combination
- duplicate check-in submission is idempotent success for the same txHash and does not increase aggregate profile counts
- duplicate purchased NFT sync is idempotent, but not byte-for-byte identical; repeated sync reports no new holding creation while preserving the same business identity
- running multiple flows in parallel against the same `fork-anvil` / server runtime is unsafe today because one flow's cleanup can stop shared processes used by another flow

## Deviations From Original Task
- 不再沿用原 `ci-contract-tests` 的“轻量 contract integration test”狭义目标
- 新任务显式升级为 `server + contract CI full coverage`
- 原 execution 中的局部完成项不会自动继承为新任务已完成里程碑
- `Milestone 2` 当前先采取保守的 broadcast 归档策略：复制隔离而非立即删除原文件
- 本轮已完成最小 flow 验证，但后续更深的 flow 断言仍依赖提权运行 anvil 或改造本地启动策略
