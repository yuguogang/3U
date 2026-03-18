# Plan: Phase 9.4 Automation E2E UAT (Playwright + Synpress + 5 Wallets)

## 1. Objective
在 `chainId=97` 的 promotion 环境建立一套可重复执行的自动化 UAT 框架，覆盖 public testnet 的实时主路径，以及 fork/anvil 的周流程验证层，并输出可审计证据（日志、截图、txHash、接口响应、运行报告）。

## 2. Scope
- 维护 `apps/e2e/phase94` 自动化工程、钱包编排、报告契约与运行脚本
- 维护 public `uat-mockusdt` 的实时主路径自动化：登录、bind/placement、check-in、buy NFT、buy 后 txHash sync-back
- 维护 fork/anvil 的周流程自动化：epoch sync、subsidy claim、lottery、ranking、weekly merkle claim
- 审计并记录 `uat-mockusdt`、`testnet-live`、`release` 的 Prisma schema / baseline 状态
- 把关键风险、阻塞项、偏差与验证证据回写到 `execution.md`

## 3. Out of Scope
- 生产环境自动化执行
- 主网钱包或真实生产私钥接入
- 将 `release` 环境从 `planned` 激活为 `active`
- 以破坏性方式修复数据库一致性（如 `migrate reset`、删库重建）
- 把 weekly / subsidy / lottery / ranking 强塞回 public testnet UAT 主基线

## 4. Assumptions
- `apps/server/.env`、`apps/dapp/.env`、`apps/admin/.env` 已对齐 promotion 测试链配置
- 本地 PostgreSQL 通过 `127.0.0.1:5433` 暴露；若在受限沙箱中执行，需把 `P1001` 与本地 TCP 探测一起解释
- public `test:uat` 负责实时主路径；时间敏感的周流程转入 `fork-anvil`
- fork 层允许使用测试 owner / publisher / buyer 私钥，并允许使用隔离 schema 与 synthetic participants 构造周流程前置

## 5. Architecture Impact
- `apps/e2e/phase94/**/*`
- `scripts/uat/*`
- `scripts/promotion-env/*`
- `config/promotion-envs/*`
- `apps/server/prisma/*`
- `apps/server/src/modules/{admin,claims,epoch,lottery,ranking,rewards,stats}/*`
- `apps/contracts/script/*`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/*`

## 6. Current Snapshot
- `Milestone 1` to `Milestone 7` completed
- public `uat-mockusdt`: login, bind/placement, check-in, buy NFT, buy后 txHash sync-back - all automated
- fork `test:weekly-fork`: subsidy-claim, rollover, threshold-met, lottery, ranking, merkle-claim - all automated
- **Milestone 8**: COMPLETED (2026-03-17)
  - Full test report generated: `TEST-REPORT.md`
  - Coverage: 85% of business paths automated
  - Identified gaps: referral NFT approval flow (G-01, G-02)

## 7. Document Map
- 总执行记录：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/execution.md`
- 覆盖矩阵：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/matrices/coverage.md`
- fork 运行手册：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/runbooks/weekly-fork.md`
- milestones：
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/01-harness-scaffolding.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/02-multi-wallet-role-orchestration.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/03-core-promotion-flows.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/04-runner-and-report-contract.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/05-prisma-reachability-audit.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/06-prisma-baseline-alignment.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/07-fork-anvil-weekly-harness.md`
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/08-weekly-flow-matrix.md`

## 8. Milestones Overview
- `Milestone 1` Harness Scaffolding
  - 目标：建立 Playwright/Synpress 基础工程与 smoke 登录能力
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/01-harness-scaffolding.md`
- `Milestone 2` Multi-Wallet Role Orchestration
  - 目标：固定 5 钱包角色、资金阈值与隔离策略
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/02-multi-wallet-role-orchestration.md`
- `Milestone 3` Core Promotion Flows
  - 目标：覆盖 public 实时主路径
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/03-core-promotion-flows.md`
- `Milestone 4` Runner And Report Contract
  - 目标：统一 runner、exit code、artifacts 与报告格式
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/04-runner-and-report-contract.md`
- `Milestone 5` Prisma Reachability Audit
  - 目标：区分 drift / unreachable / not-runnable
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/05-prisma-reachability-audit.md`
- `Milestone 6` Prisma Baseline Alignment
  - 目标：对可达且 active 的环境做非破坏性 schema/baseline 对齐
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/06-prisma-baseline-alignment.md`
- `Milestone 7` Fork/Anvil Weekly Harness
  - 目标：提供独立、可重置、可控 `referenceAt` 的周流程底座
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/07-fork-anvil-weekly-harness.md`
- `Milestone 8` Weekly Flow Matrix
  - 目标：用 success / blocked / failed 语义覆盖 subsidy、lottery、ranking、merkle claim 的正常与不足条件路径
  - 细节：`docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/automation-e2e-uat/milestones/08-weekly-flow-matrix.md`

## 9. Approval Checkpoint
本子计划仍属于 `Major/Critical`：
- 涉及资金链路、claim、eligibility、weekly settlement、lottery / ranking、以及 Prisma baseline
- 若新增 fork 资金脚本、root publish 桥接、或跨环境 DB 变更，必须继续在 `execution.md` 中记录真实命令、结果与偏差

## 10. Rollback / Recovery Notes
- 优先把自动化能力收敛在 `apps/e2e/phase94`、`scripts/uat`、`scripts/promotion-env`，避免污染主业务路径
- Prisma 对齐必须保留 diff SQL、`migrate resolve` 记录与最终 `migrate status` 结果
- weekly fork 若因 source RPC 不稳定而回退到 local deploy，需要在 `execution.md` 中明确写出与 public testnet 的偏差
- 对于人数不足、未发布 root、未注资等周流程前置，不要误报为代码失败；应按覆盖矩阵标记为 `success` 或 `blocked`

## 11. Final Verification Checklist
- [ ] Playwright + Synpress / bootstrap 登录路径稳定可重复
- [ ] 5 钱包角色映射、资金校验、报告目录契约保持可用
- [ ] public `test:uat` 继续只承担实时主路径
- [ ] `fork-anvil` 可独立启动、停止、重置，并记录 runtime/config 证据
- [ ] `publishSubsidyEpoch -> sync -> claimPurchasedSubsidy` 至少 1 条 fork 自动化通过
- [ ] `participantCount < minimumParticipants` 的 rollover 分支被明确验证为预期成功路径
- [ ] `participantCount >= minimumParticipants` 的 lottery / ranking happy path 有稳定构造方案
- [ ] weekly merkle claim 的 DB publish、链上 root publish、资金注入与 claim sync-back 的职责边界被明确记录
- [ ] 三个 promotion env 的 Prisma 状态都有明确结论
- [ ] `execution.md` 继续记录真实命令、结果、阻塞与偏差

## 12. Preparation Flow
1. 同步 promotion env：`pnpm promotion-env:sync`
2. 准备钱包 fixtures 与资金：`PROMOTION_ENV=<env> pnpm --dir apps/e2e/phase94 run wallets:prepare`
3. 启动对应 stack：public 用现有本地服务；fork 用 `stack:start` + `fork:start`
4. 执行目标 runner：public 用 `test:uat`；weekly 用 `test:weekly-fork`
5. 若结果为 `blocked`，按覆盖矩阵记录缺失前置，而不是直接记为失败
