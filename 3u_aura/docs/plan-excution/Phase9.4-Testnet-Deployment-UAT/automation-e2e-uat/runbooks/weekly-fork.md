# Weekly Fork Runbook

## Purpose
为 `fork-anvil` 周流程自动化提供统一的启动、重置、执行、收证、清理流程。

## Environment boundary
- public `uat-mockusdt`
  - 负责实时主路径：登录、bind/placement、check-in、buy NFT、buy 后 txHash sync-back
- `fork-anvil`
  - 负责周流程：epoch sync、subsidy、lottery、ranking、weekly merkle claim

## Startup
1. 同步环境派生文件
   - `pnpm promotion-env:sync`
2. 准备 fork schema / runtime
   - `node scripts/uat/prepare-weekly-fork-db.mjs --env fork-anvil`
   - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run fork:start`
3. 启动服务栈
   - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run stack:stop`
   - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run stack:start`
4. 准备钱包与 precheck
   - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run wallets:prepare`
   - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run test:precheck`

## Recommended execution order
1. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/fork-precheck.spec.ts`
2. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/subsidy-claim.spec.ts`
3. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/rollover.spec.ts`
4. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/threshold-met.spec.ts`
5. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/lottery.spec.ts`
6. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/ranking.spec.ts`
7. `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/merkle-claim.spec.ts`
8. 需要按推荐顺序跑完整 pack 时执行：`PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run test:weekly-pack`
   - `test:weekly-pack` / `test:weekly-fork` 现会先执行 `stack:stop`，避免复用旧 server runtime 导致 `purchased-nft/sync` 或后续 weekly draft 断言漂移
9. 需要全量跑目录时再执行：`PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run test:weekly-fork`

## Preferred orchestration per wave
- Wave 1 — rollover
  - 登录 admin
  - 调用 `/api/v1/admin/ops/epochs/sync`
  - 断言 `rolledOver=true`
  - 断言 `/rewards` 与 `/claims` 对观察钱包仍为空
- Wave 2 — threshold-met minimal happy path
  - 先执行 synthetic fixture seeding
  - 再执行 epoch sync
  - 再执行 `pnpm --dir apps/server exec tsx scripts/settle-weekly-epoch-rewards.ts --epoch-id <id> --mode draft`
  - 断言 rewards draft / claim rows 已生成
- Wave 3 — lottery / ranking
  - 复用 Wave 2 的 seeding 与 epoch sync
  - 调整 synthetic participants 的数量与 `smallLegVolumeUsdt` 增量
  - 继续通过 rewards draft 脚本生成 payout 结果
- Wave 4 — merkle claim
  - 先执行 `--mode publish`
  - 再执行 `MerkleClaim.depositRewards()` 与 `publishRoot()` bridge
  - 最后从 dapp `/claims` 页面发起 claim，并执行 sync-back

## Remaining helper gaps
- 目前主缺口已从 helper 缺失转为稳定性收尾
- 若后续继续增强，优先项是：
  - 将本地 bytecode 自检前置到更靠近 `fork:start` 的阶段
  - 修复 `/rewards` 页面 client-side exception 后补回 UI 断言

## Evidence to capture
- `referenceAt`
- `epochNo`
- `participantCount`
- `publish txHash`
- `claim txHash`
- 相关 API response snapshot
- `uat-report.json` 记录

## Reset / cleanup
- clean baseline reset
  - `node scripts/uat/reset-weekly-fork-db.mjs --env fork-anvil`
- stop stack
  - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run stack:stop`
- stop anvil
  - `PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 run fork:stop`

## Troubleshooting notes
- 若 `P1001` 出现在受限沙箱，要先用 `lsof` / `docker ps` / `nc` 交叉验证本地 DB 可达性
- 若 public RPC 在 fork 场景下出现 `missing trie node`，优先确认当前 runner 是否仍错误复用了 public 钱包策略
- 若 weekly merkle claim 只能到 DB `ROOT_POSTED`，说明还缺 `MerkleClaim.depositRewards()` 或 `publishRoot()` 的链上 bridge，而不是 claim 页面本身出错
- 若 `participantCount` 已达标但 reward 仍全为零，优先检查 `PoolSplitFact` 是否有真实或 synthetic funding 输入
