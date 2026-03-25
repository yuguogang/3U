# Split Funding Wallet Initialization Execution

## Progress Log

- 2026-03-25: 创建执行记录文件，等待计划批准后实施。
- 2026-03-25: 检查 `fork-anvil` 本地部署链路，确认角色被绑成同一地址的根因在 `scripts/uat/weekly-fork-lib.mjs` 的 `local-deploy` manifest 派生逻辑；同时发现 `scripts/ci/lib/anvil.mjs` 在本地重部署后会把 `rewardFunderAddress` 强行写回 owner。
- 2026-03-25: 修改 `scripts/uat/weekly-fork-lib.mjs`：
  - 保留 target env 自己的 `wallets.example.json`，不再被 source env 模板覆盖；
  - 支持 target env 自定义钱包模板；
  - 为超出默认 anvil 前 5 个账号的 wallet template 生成稳定的 deterministic private key；
  - `local-deploy` 下将角色拆分为：
    - `owner/rootPublisher/referralSignerAddress = admin`
    - `checkinReceiverAddress = rewardFunderAddress = checkinRewardFunder`
    - `financeWallet = settlementPublisher = financeWallet`
- 2026-03-25: 修改 `config/promotion-envs/fork-anvil/wallets.example.json`，新增：
  - `checkinFunder`（role=`checkinRewardFunder`）
  - `financeWallet`（role=`financeWallet`）
- 2026-03-25: 修改 `scripts/ci/lib/anvil.mjs`，本地 fresh deploy 时按 manifest 传入：
  - `FINANCE_WALLET`
  - `REWARD_FUNDER`
  - `SETTLEMENT_PUBLISHER`
  - `ROOT_PUBLISHER`
  并避免把 `rewardFunderAddress` 回写成 owner。
- 2026-03-25: 修改 `scripts/ci/lib/manifest.mjs`，增加一致性校验字段：
  - `roles.checkinReceiverAddress`
  - `roles.financeWallet`
- 2026-03-25: 修改 `scripts/uat/run-weekly-fork-scenarios.mjs`，让本地场景在结算前按角色自动补资：
  - Merkle 抽奖/排名奖励注资前，给 `rewardFunderAddress/checkinReceiverAddress` 补足 `mUSDT`
  - NFT 周补贴发布前，给 `financeWallet` 补足 `mUSDT`
  - NFT 周补贴发布交易由 `financeWallet` 发起
- 2026-03-25: 发现 `scripts/ci/.runtime/fork-anvil/manifest.json` 仍保留旧的单地址角色，导致 scenario runner 因 manifest mismatch 退出；补充修改 `scripts/uat/weekly-fork-lib.mjs`，在创建/重部署 `fork-anvil` 时同步写入 CI runtime manifest，并手动将当前 config manifest 同步到 `scripts/ci/.runtime/fork-anvil/manifest.json`。
- 2026-03-25: 在链上直接验证 split 资金职责：
  - 用 `rewardFunderAddress (0xA5b3...1080)` 独立补资并通过 admin 调用 `depositRewardsFromFunder`，`MerkleDistributor` 余额成功增加到 `36000000` atomic `mUSDT`
  - 用 `financeWallet (0xD906...b080)` 作为 `Settlement.epochPublisher` 独立补资并成功发布 `epochId=1` 的 subsidy epoch
- 2026-03-25: 额外发现并修复一个脚本细节：`Settlement.publishSubsidyEpoch` 会按 `purchasedSupply` 从 publisher `transferFrom` 资金，因此场景脚本除了 mint，还需要先让 `financeWallet -> Settlement` 做 `approve`。已补到 `scripts/uat/run-weekly-fork-scenarios.mjs`。
- 2026-03-25: 在 split 地址环境上重新跑 `prepare` 成功：
  - 目标钱包 `0x3C44...93BC` 已自动报名本周抽奖
  - 已自动购买 Purchased NFT
  - 新的 scenario state 写入 `config/promotion-envs/fork-anvil/weekly-reward-scenario.state.json`
- 2026-03-25: 运行 `settle` 成功：
  - epoch `#3` draft / publish 完成
  - `claimCount = 21`
  - `merkleRoot = 0x80f631b7b7b15e5c85f43f786614e1e221acdeb6fdffc1c87c7406b14d4619a2`
  - 抽奖/排名 USDT 奖励已发布到可进行 UI 验证的状态
- 2026-03-25: 修复 `scripts/uat/sync-weekly-fork-purchased-nft-state.mjs` 错误 import（从 `promotion-env/lib.mjs` 误取 `loadWalletFixture`），并成功执行购买型 NFT 状态同步：
  - `hasPurchasedNft = true`
  - `publishedSubsidyEpochs = 2`
  - `claimsCreated = 2`
  - 当前用户对应 `tokenId = 2`

## Commands Run

```bash
node --check scripts/uat/weekly-fork-lib.mjs
node --check scripts/ci/lib/anvil.mjs
node --check scripts/ci/lib/manifest.mjs
node --check scripts/uat/run-weekly-fork-scenarios.mjs
/bin/zsh -lc "PROMOTION_ENV=fork-anvil pnpm promotion-env:fork:reset"
node scripts/promotion-env/prepare-wallet-fixtures.mjs --env fork-anvil
cast call 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 "rewardFunder()(address)" --rpc-url http://127.0.0.1:18545
cast call 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 "financeWallet()(address)" --rpc-url http://127.0.0.1:18545
cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 "epochPublisher()(address)" --rpc-url http://127.0.0.1:18545
rm -rf apps/server/dist
node scripts/promotion-env/run-with-env.mjs --target server --env fork-anvil -- pnpm --dir apps/server start:dev
curl -s http://127.0.0.1:3210/api/v1/health
node --input-type=module -e "copy config manifest -> scripts/ci/.runtime/fork-anvil/manifest.json"
node --input-type=module -e "mint rewardFunder + depositMerkleRewards(admin) + read distributor balance"
node --input-type=module -e "read purchasedSupply + mint/approve financeWallet + publishSubsidyEpoch(financeWallet) + read subsidy epoch"
node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase prepare --reset --auto-target-lottery --auto-buy-target-nft --target-wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase settle --target-wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
node scripts/uat/sync-weekly-fork-purchased-nft-state.mjs --env fork-anvil --wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

## Verification Results

- `node --check` 全部通过。
- `fork-anvil` reset 后新的 `manifest.json` 已确认拆分成功：
  - `owner = 0xf39F...2266`
  - `checkinReceiverAddress = rewardFunderAddress = 0xA5b3...1080`
  - `financeWallet = settlementPublisher = 0xD906...b080`
- 新增本地 wallet fixture 已生成：
  - `config/promotion-envs/fork-anvil/wallets/checkinFunder.json`
  - `config/promotion-envs/fork-anvil/wallets/financeWallet.json`
- `prepare-wallet-fixtures` 已补齐新增钱包的 `0.1 BNB`，并重写 `funding-report.json`。
- 链上参数已与 manifest 对齐：
  - `MerkleClaim.rewardFunder()` -> `0xA5b3...1080`
  - `NFTSale.financeWallet()` -> `0xD906...b080`
  - `Settlement.epochPublisher()` -> `0xD906...b080`
- `apps/server` 清理 `dist` 后已恢复健康：
  - `GET /api/v1/health` 返回 `{"status":"ok",...}`
- CI/runtime manifest 现已与 config manifest 同步，不再保留旧的单地址 `rewardFunder/checkinReceiver/financeWallet`。
- 直接链上验证结果：
  - `rewardFunder = 0xA5b3...1080`
  - `MerkleDistributor` 余额 = `36000000`
  - `financeWallet = 0xD906...b080`
  - `purchasedSupply = 2`
  - `Settlement subsidy epoch #1` 发布成功，`remainingBudget = 60000000`
- `prepare` 输出确认：
  - `joinedLottery = true`
  - `currentLottery.epochStatus = OPEN`
  - `isParticipating = true`
- `settle` 输出确认：
  - `epoch #3` 的 `published.claimCount = 21`
  - `published.totalAmount = 250000000`
  - `subsidy` 在 runner 中曾被旧 import 挡住，但脚本修复后已单独同步成功
- `sync-weekly-fork-purchased-nft-state` 输出确认：
  - `claimsCreated = 2`
  - `publishedSubsidyEpochs = 2`
  - `tokenId = 2`

## Deviations From Plan

- 原计划中的 “Funding Preparation Flows” 没有单独新建 helper 文件，而是直接把补资逻辑并入了 `scripts/uat/run-weekly-fork-scenarios.mjs`，这样能最小化改动并直接服务现有 UAT runner。
- 本轮已完成 split 地址环境下的干净 `prepare -> settle`，并修复了 NFT 状态同步脚本；剩余的是用户在浏览器中做最终手工 UI 验证。
