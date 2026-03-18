# Execution: Server + Contract CI Full Coverage

## Status
Planned. Awaiting approval on `plan.md` before implementation.

## Last Updated
2026-03-18 12:17:28 +0800

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

## Open Items
- 等待用户批准 `plan.md`
- 批准后开始 `Milestone 1` 盘点与覆盖矩阵收敛
- 批准后在 `Milestone 2` 明确落实 fork/anvil 产物隔离方案
- 批准后优先锁定 server bootstrap helper 与 runtime manifest 真相源

## Commands Run
- `mv docs/plan-excution/ci-contract-tests docs/plan-excution/server-contract-ci-full-coverage`
- `sed -n '1,220p' apps/server/package.json`
- `sed -n '1,220p' scripts/ci/package.json`
- `rg -n "start:dev|start:prod|dist/src/main|generated/prisma|health" apps/server scripts/ci -g '!**/node_modules/**'`
- `date '+%Y-%m-%d %H:%M:%S %z'`

## Deviations From Original Task
- 不再沿用原 `ci-contract-tests` 的“轻量 contract integration test”狭义目标
- 新任务显式升级为 `server + contract CI full coverage`
- 原 execution 中的局部完成项不会自动继承为新任务已完成里程碑
