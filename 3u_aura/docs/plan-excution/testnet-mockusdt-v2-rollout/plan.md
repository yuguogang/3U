# Testnet MockUSDT V2 Rollout

## 1. Objective

将当前新版本发布到现有 `testnet-mockusdt` 测试服务器，并满足以下上线约束：

- 重发新版本合约，但继续复用当前 `testnet-mockusdt` 环境的 `MockUSDT`
- 清空线上业务数据，并把数据库升级到新版本 schema / migration 状态
- 对照现有 runbook 检查并补齐新的上线步骤
- 维持与 [manifest.json](/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json) 一致的合约角色配置
- 如新版本引入额外链上角色，给出明确规划；若没有新增角色，也要明确说明

## 2. Scope

### 2.1 In Scope

- 审核并必要时调整 `testnet-mockusdt` 合约部署策略，确保保留现有 `MockUSDT`
- 更新 [manifest.json](/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json) 中的新合约地址与 artifacts
- 在测试服务器环境执行数据库清空、migration、seed、服务重启
- 按 runbook 对照核查并补充遗漏项
- 验证：
  - payment token 仍为旧 `MockUSDT`
  - 新合约地址已生效
  - 数据库已清空并迁移到新 schema
  - server / dapp / admin 能正常启动

### 2.2 Affected Files / Modules

- [config/promotion-envs/testnet-mockusdt/manifest.json](/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json)
- [scripts/promotion-env/deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs)
- [scripts/promotion-env/lib.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)
- [scripts/deploy/deploy-testnet-mockusdt.sh](/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/deploy-testnet-mockusdt.sh)
- [scripts/deploy/repair-testnet-mockusdt-db.sh](/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/repair-testnet-mockusdt-db.sh)
- [docs/runbooks/testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
- [docs/runbooks/testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
- [docs/runbooks/testnet-mockusdt-online-repair.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md)
- [apps/server/prisma/migrations/*](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma)
- VPS runtime env files under `/etc/3u-aura/testnet-mockusdt/*`

## 3. Out of Scope

- 正式背景 indexer worker 落地
- 生产环境发布
- 页面点按 UAT
- 新增独立钱包体系或重新设计运营角色

## 4. Assumptions

- 当前目标环境就是 `config/promotion-envs/testnet-mockusdt`
- 当前 `MockUSDT` 地址必须保持为 `0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF`
- 测试服务器允许清空当前业务数据
- 新版本数据库可以从空库重新 migrate + seed 到目标状态
- 现有链上角色仍以 `owner / rootPublisher / checkinReceiverAddress / rewardFunderAddress / financeWallet / settlementPublisher / referralSignerAddress / adminAllowlistWallets` 为准

## 5. Architecture Impact

### 5.1 Deployment Constraint

当前 [deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs) 在 `--force` + `paymentTokenKind=mockusdt` 时会连 `MockUSDT` 一起重发，这与本次“保留旧 MockUSDT”的要求冲突。

因此上线前必须先处理其一：

1. 为部署脚本增加“复用现有 paymentTokenAddress，仅重发 core + settlement”模式
2. 或通过受控 manifest/edit 流程只清空非 `paymentTokenAddress` 地址后执行部署

推荐方案是 `1`，因为更可审计、更不容易误发。

### 5.2 Database Reset Constraint

现有 [repair-testnet-mockusdt-db.sh](/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/repair-testnet-mockusdt-db.sh) 负责“修复并迁移”，不负责“清空线上业务数据”。

本次还需要增加一条受控数据库 reset 路径，建议：

- drop `public` schema
- recreate `public`
- rerun baseline + Prisma migrations
- rerun seed

且该步骤必须是可重复、显式、可审计的脚本，不做 ad hoc SQL 手敲。

### 5.3 Role Surface

基于当前新合约：

- [FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)
- [NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)
- [MerkleClaim.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol)
- [Settlement.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol)

目前没有发现新增链上管理角色；角色集合仍然是：

- `owner`
- `rootPublisher`
- `rewardFunderAddress`
- `checkinReceiverAddress`
- `financeWallet`
- `settlementPublisher`
- `referralSignerAddress`
- `adminAllowlistWallets`

因此本次上线原则上不需要新增钱包角色，只需要维持与当前 manifest 一致的角色映射。

## 6. Milestones

### Milestone 1 — Freeze Rollout Strategy

#### goal

确认“保留旧 MockUSDT、重发其余合约、清空 DB 再迁移”的技术路径，并锁定角色结论。

#### affected files/modules

- [manifest.json](/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json)
- [deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs)
- runbooks

#### implementation notes

- 明确 `MockUSDT` 地址保留不变
- 明确没有新增链上角色
- 明确 `deploy-contract-suite` 必须改成支持“skip token redeploy”

#### risks

- 如果直接 `--force`，会误发新 `MockUSDT`

#### verification commands

- `sed -n '1,280p' scripts/promotion-env/deploy-contract-suite.mjs`
- `sed -n '1,260p' config/promotion-envs/testnet-mockusdt/manifest.json`

#### expected outputs

- 部署边界冻结
- 角色边界冻结

### Milestone 2 — Add Safe Contract Redeploy Path

#### goal

实现只重发 `FounderNFT / NFTSale / Settlement / MerkleClaim`、复用旧 `MockUSDT` 的部署路径。

#### affected files/modules

- [deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs)
- 可能影响 [scripts/promotion-env/lib.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)

#### implementation notes

- 增加显式 flag，例如：
  - `--reuse-payment-token`
  - 或 `--skip-payment-token-deploy`
- 保证：
  - `paymentTokenAddress` 为有效地址时直接复用
  - 只更新 core / settlement 合约地址与 artifacts

#### risks

- 如果逻辑写得含糊，可能导致 manifest 地址与链上实际不一致

#### verification commands

- `node --check scripts/promotion-env/deploy-contract-suite.mjs`
- 本地 dry-run / 受控 test deploy 验证

#### expected outputs

- 新部署路径不会动旧 `MockUSDT`

### Milestone 3 — Add Safe DB Reset + Migrate Path

#### goal

提供一条受控脚本，能清空测试服务器业务数据并重建数据库 schema。

#### affected files/modules

- 新增 `scripts/deploy/*reset*testnet-mockusdt*.sh` 或等效脚本
- [repair-testnet-mockusdt-db.sh](/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/repair-testnet-mockusdt-db.sh)
- runbooks

#### implementation notes

- 推荐步骤：
  - drop schema public cascade
  - create schema public
  - baseline / migrate deploy
  - `env:db:seed`
  - restart services
- 必须要求显式参数或确认开关，避免误清库

#### risks

- 测试服务器数据会被完全清空
- 如果 seed 不完整，admin 登录或基础配置可能缺失

#### verification commands

- `bash scripts/deploy/<new-reset-script>.sh --help`
- 本地/受控容器验证 reset + migrate + seed

#### expected outputs

- 清库与迁移流程标准化

### Milestone 4 — Runbook Alignment

#### goal

把现有 runbook 和这次新流程对齐，补齐遗漏。

#### affected files/modules

- [testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
- [testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
- [testnet-mockusdt-online-repair.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md)

#### implementation notes

- 新增“复用旧 MockUSDT”的说明
- 新增“测试服务器清库重建”的标准步骤
- 新增“角色无新增”的说明
- 新增新版本重点验证点：
  - unlimited NFT
  - dual-lane weekly settlement
  - purchased refresh / projection gate

#### risks

- 文档不更新会导致下次又按旧 runbook 重发 `MockUSDT`

#### verification commands

- `sed -n '1,260p' docs/runbooks/testnet-mockusdt-vps-deployment.md`
- `sed -n '1,260p' docs/runbooks/testnet-mockusdt-remote-handoff.md`

#### expected outputs

- runbook 可直接指导后续 operator 重复执行

### Milestone 5 — Execute Remote Rollout

#### goal

实际将新版本发布到测试服务器。

#### affected files/modules

- manifest
- deploy scripts
- VPS env / services
- Postgres schema/data

#### implementation notes

- 顺序建议：
  1. 更新部署脚本
  2. 本地部署新合约但复用旧 MockUSDT
  3. `pnpm promotion-env:sync`
  4. 将新 repo/manifest 发到 VPS
  5. 执行清库脚本
  6. 执行 deploy script
  7. 执行 DB migrate/seed
  8. smoke verify

#### risks

- 需要真实网络、真实 VPS、真实链上写操作
- 任一步骤失败都可能导致“新合约 + 旧 DB”或“新 DB + 旧服务”不一致窗口

#### verification commands

- `bash scripts/deploy/deploy-testnet-mockusdt.sh ...`
- `bash scripts/deploy/<new-reset-script>.sh ...`
- `bash scripts/deploy/smoke-test-testnet-mockusdt.sh ...`
- 链上 `cast call` 校验关键角色

#### expected outputs

- 测试服务器切换到新版本
- 旧 `MockUSDT` 保留
- DB 重建完成
- 基础 smoke 正常

## 7. Approval Checkpoint

在执行任何真实链上部署、线上清库、VPS 变更之前，必须先确认本计划。

本计划里的关键决策有两个：

1. 部署脚本先改成支持复用旧 `MockUSDT`
2. 线上测试库采用“drop schema + migrate + seed”重建，而不是做保守 data patch

## 8. Rollback / Recovery Notes

- 如果新合约已部署但 VPS 还没切换：
  - 保留旧 manifest 备份
  - 不执行 `promotion-env:sync` 到线上
- 如果 VPS 已切换但服务失败：
  - 回滚到上一个 repo 版本
  - 恢复上一个 manifest
  - 重启 systemd
- 如果 DB 重建后发现 schema/seed 异常：
  - 再次执行标准 reset + migrate + seed
  - 测试环境不保留旧数据，避免局部修补

## 9. Final Verification Checklist

- [ ] `MockUSDT` 地址保持不变
- [ ] 新 `FounderNFT / NFTSale / Settlement / MerkleClaim` 地址已写入 manifest
- [ ] `pnpm promotion-env:sync` 已执行
- [ ] VPS 上 server/dapp/admin 全部重启成功
- [ ] 数据库已清空并按最新 migration 重建
- [ ] seed 已执行
- [ ] 合约角色与 manifest 一致
- [ ] runbook 已补齐新流程
- [ ] smoke test 通过
- [ ] execution.md 记录真实命令与结果
