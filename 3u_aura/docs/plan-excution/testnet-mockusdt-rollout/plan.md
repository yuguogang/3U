# Testnet MockUSDT Rollout Plan

## 1. Objective

在 BSC Testnet 上为测试服务器提供一套使用 `MockUSDT` 的可部署环境，并明确判断：

- 是否可以直接复用现有 `testnet-live`
- 是否需要新发行 `MockUSDT`
- 是否需要一起重发依赖支付代币地址的业务合约

推荐目标是提供一套与当前 `testnet-live` 隔离、但部署流程与现有 promotion-env 体系保持一致的测试环境。

## 2. Scope

- 研究并确认 `testnet-live` 与 `uat-mockusdt` 的差异
- 评估 `MockUSDT` 与付款代币地址在合约层的耦合方式
- 设计一套新的 BSC Testnet MockUSDT 环境落地方案
- 规划配置、部署、验收、回滚步骤
- 明确“是否需要新发合约”的判断与条件

## 3. Out of Scope

- 本轮不实际修改任何环境配置
- 本轮不实际广播部署交易
- 本轮不做数据库迁移或数据清洗
- 本轮不做生产链或 `release` 环境变更

## 4. Assumptions

- 目标不是把正式发布环境切到 mock token，而是给测试服务器提供独立的 MockUSDT 测试环境
- 目标链保持为 BSC Testnet `chainId=97`
- 目标环境需要与当前 `testnet-live` 及 `uat-mockusdt` 保持数据边界隔离
- 环境命名暂按 `testnet-mockusdt` 规划；如果你们有既定命名规范，执行前再调整

## 5. Architecture Impact

### 5.1 Current State

- 当前 `testnet-live` 使用的付款代币地址为 `0x64544969ed7EBf5f083679233325356EbE738930`
  - `config/promotion-envs/testnet-live/manifest.json`
  - `config/promotion-envs/testnet-live/dapp.public.env`
- 仓库中已存在完整的 `uat-mockusdt` 参考环境，使用 `MockUSDT`
  - `config/promotion-envs/uat-mockusdt/manifest.json`
- `promotion-env` 脚本已经支持：
  - 当 `paymentTokenKind === "mockusdt"` 时自动部署 `DeployMockUSDT`
  - 再继续部署 `DeployNFTCore` 与 `DeploySettlementClaim`
  - 文件：`scripts/promotion-env/deploy-contract-suite.mjs`

### 5.2 Coupling That Drives The Decision

- `NFTSale` 在构造函数里把 `paymentToken` 设为 `immutable`
  - `apps/contracts/src/NFTSale.sol`
- `Settlement` 在构造函数里把 `paymentToken` 设为 `immutable`
  - `apps/contracts/src/Settlement.sol`
- `DeployNFTCore.s.sol` 通过 `USDT_ADDRESS` 部署 `NFTSale`
  - `apps/contracts/script/DeployNFTCore.s.sol`
- `DeploySettlementClaim.s.sol` 通过 `USDT_ADDRESS` 部署 `Settlement` 和 `MerkleClaim`
  - `apps/contracts/script/DeploySettlementClaim.s.sol`

### 5.3 Decision

结论分两档：

1. 如果只是“复用现有 `uat-mockusdt` 整套链上地址”，则不需要新发任何合约。
   代价是测试服务器会与 `uat-mockusdt` 共用链上状态，不具备独立边界。

2. 如果目标是“测试服务器有自己独立的 MockUSDT 测试环境”，则需要新发链上合约。
   推荐不是只发 `MockUSDT`，而是新发整套环境合约：
   - `MockUSDT`
   - `FounderNFT`
   - `NFTSale`
   - `Settlement`
   - `MerkleClaim`

### 5.4 Why The Recommended Scope Is Full Redeploy

- 只换 token 地址时，`NFTSale / Settlement / MerkleClaim` 必须重发，因为它们在部署时绑定 `USDT_ADDRESS`
- `FounderNFT` 理论上可以复用，但会继承原环境的 NFT 铸造状态与销售关系，破坏测试边界
- `MockUSDT` 的 `mint` 是公开可调用的，文件：`apps/contracts/src/mocks/MockUSDT.sol`
  - 如果复用现有 `uat-mockusdt` token，任何共享该环境的人都能污染余额与测试结果

因此，推荐方案是：

- 新建并行环境 `testnet-mockusdt`
- 新发整套合约，而不是复用 `testnet-live` 或 `uat-mockusdt` 的链上地址

## 6. Milestones

### Milestone 1: Create New Environment Skeleton

- Goal:
  - 新建独立环境目录，例如 `config/promotion-envs/testnet-mockusdt`
- Affected files/modules:
  - `config/promotion-envs/testnet-mockusdt/manifest.json`
  - `config/promotion-envs/testnet-mockusdt/dapp.public.env`
  - `config/promotion-envs/testnet-mockusdt/server.public.env`
  - `config/promotion-envs/testnet-mockusdt/admin.public.env`
  - `config/promotion-envs/testnet-mockusdt/contracts.public.env`
  - `config/promotion-envs/testnet-mockusdt/notes.md`
- Implementation notes:
  - 以 `testnet-live` 为基底复制业务参数与角色
  - 将 DB 名、Redis DB、Bull prefix、端口全部切成新的隔离值
  - 将 `contracts.paymentTokenKind` 改为 `mockusdt`
  - 初始阶段把链上地址清空，等待部署脚本回填
- Risks:
  - 环境名冲突
  - DB/Redis 端口或命名与既有环境重叠
- Verification commands:
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server`
- Expected outputs:
  - 新环境的派生 env 能正常打印
  - 配置项中不再引用 `testnet-live` 的 DB/Redis/端口

### Milestone 2: Deploy Independent Mock Contract Suite

- Goal:
  - 在 BSC Testnet 上部署独立 MockUSDT 套件
- Affected files/modules:
  - `scripts/promotion-env/deploy-contract-suite.mjs`
  - `apps/contracts/script/DeployMockUSDT.s.sol`
  - `apps/contracts/script/DeployNFTCore.s.sol`
  - `apps/contracts/script/DeploySettlementClaim.s.sol`
  - `config/promotion-envs/testnet-mockusdt/manifest.json`
- Implementation notes:
  - 执行 `pnpm promotion-env:deploy-suite --env testnet-mockusdt`
  - 由 manifest 驱动部署顺序：
    - MockUSDT
    - FounderNFT + NFTSale
    - Settlement + MerkleClaim
  - 确认 broadcast artifacts 被写回 manifest
- Risks:
  - 合约 owner / finance wallet / publisher 地址填错
  - 测试网 gas 或 RPC 不稳定
- Verification commands:
  - `pnpm promotion-env:deploy-suite --env testnet-mockusdt`
  - `cat config/promotion-envs/testnet-mockusdt/manifest.json`
- Expected outputs:
  - manifest 中出现新的 paymentTokenAddress / founderNftAddress / nftSaleAddress / settlementAddress / merkleDistributorAddress
  - artifacts 路径完整可追溯

### Milestone 3: Sync App/Server/Admin To New Environment

- Goal:
  - 让 dapp / server / admin 全部读取新合约地址与新基础设施边界
- Affected files/modules:
  - `scripts/promotion-env/sync-public-envs.mjs`
  - `scripts/promotion-env/lib.mjs`
  - `config/promotion-envs/testnet-mockusdt/*.public.env`
  - `apps/dapp/package.json`
  - `apps/server/package.json`
  - `apps/admin/package.json`
- Implementation notes:
  - 运行全量 env sync
  - 确认 `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS` 与 `PROMOTION_PAYMENT_TOKEN_ADDRESS` 都指向新 MockUSDT
  - 确认钱包连接 project id 与测试服务器域名/CORS 正确
- Risks:
  - 只改了 dapp 没改 server，导致链上验证仍查旧 token
  - CORS / API_BASE_URL 指向旧地址
- Verification commands:
  - `pnpm promotion-env:sync`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server`
- Expected outputs:
  - dapp/server/admin/contracts 四套 public env 与 manifest 完整一致

### Milestone 4: Infra Bring-Up And UAT Smoke

- Goal:
  - 在测试服务器拉起新环境并完成最小验收
- Affected files/modules:
  - `scripts/uat/start-promotion-services.mjs`
  - `scripts/promotion-env/prepare-wallet-fixtures.mjs`
  - `apps/e2e/phase94/*`
- Implementation notes:
  - 先启动 server/dapp/admin
  - 再准备测试钱包余额
  - 重点验证：
    - Check-in 3 USDT
    - NFT purchase 1000 USDT
    - Settlement / claim 读取新 token 地址
- Risks:
  - 钱包仍连接旧环境
  - MockUSDT 没有给测试钱包 mint/approve
  - 旧浏览器缓存了旧地址
- Verification commands:
  - `node scripts/uat/start-promotion-services.mjs --env testnet-mockusdt`
  - `node scripts/promotion-env/prepare-wallet-fixtures.mjs --env testnet-mockusdt`
  - `pnpm --dir apps/e2e/phase94 run test:uat`
- Expected outputs:
  - 关键支付路径全部基于新 MockUSDT 通过
  - 测试服务器不再依赖 `testnet-live` 的 live-test-token 地址

## 7. Approval Checkpoint

执行前需要你确认这一个关键决策：

- 采用推荐方案：新建并行 `testnet-mockusdt` 环境，并部署独立 MockUSDT 套件

不推荐直接修改现有 `testnet-live`，因为：

- 会破坏现有测试网环境的可追踪性
- 代币地址变更会牵动合约重部署
- 回滚成本明显更高

## 8. Rollback / Recovery Notes

- 如果新环境部署失败，不动现有 `testnet-live`
- 若 MockUSDT 已部署但后续核心合约失败：
  - 保留 broadcast 记录
  - 清空新环境 manifest 中不完整地址
  - 重新执行 `deploy-suite --force` 或重建新环境名
- 若 server/dapp/admin 指向错误地址：
  - 以 manifest 为单一事实源重新执行 `pnpm promotion-env:sync`

## 9. Final Verification Checklist

- 新环境 manifest 已生成且地址齐全
- `paymentTokenKind` 为 `mockusdt`
- dapp/server/admin/contracts 的派生 env 与 manifest 一致
- `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS` 与 `PROMOTION_PAYMENT_TOKEN_ADDRESS` 指向新 MockUSDT
- Check-in / NFT purchase / settlement / claim 冒烟通过
- 旧 `testnet-live` 未被修改

