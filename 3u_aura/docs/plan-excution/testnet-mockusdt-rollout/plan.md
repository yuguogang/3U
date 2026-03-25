# Testnet MockUSDT Rollout Plan

## 1. Objective

在 **BSC Testnet（chainId=97）** 上按当前 `fork-anvil` 已验证通过的最新代码与资金分工，部署一套**全新的** `MockUSDT` 测试环境，覆盖：

- 最新合约能力：`rewardFunder`、split funding wallets
- 最新后端：奖励发布、claim 可见性、过期补贴判定
- 最新前端：签到、奖励、NFT、Admin
- 与旧 `testnet-live` 脱钩；允许删除旧 `testnet-live` 服务器侧部署并重新接到新环境

本计划聚焦 **链上环境、应用环境、资金角色、验收链路** 的完整落地，不使用本地 Anvil 节点。

## 2. Scope

- 基于当前最新代码冻结一套新的 BSC Testnet 环境配置
- 决定“新环境命名”与“是否复用 testnet-live 域名/服务位”的切换策略
- 在 BSC Testnet 新发完整合约套件：
  - `MockUSDT`
  - `FounderNFT`
  - `NFTSale`
  - `Settlement`
  - `MerkleClaim`
- 以最新 split funding 架构初始化角色地址与发布权限
- 同步 `server / dapp / admin / contracts` 环境变量
- 设计并执行最小链上资金准备与手工 UAT 验收路径

## 3. Out of Scope

- 本计划不包含 Ubuntu VPS 的系统安装细节与 Nginx/systemd 编排
  - 该部分由 `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md` 承担
- 不修改 `release` 生产环境
- 不尝试兼容旧 `testnet-live` 的链上地址
- 不保留旧 `testnet-live` 的链上状态连续性

## 4. Assumptions

- 用户接受在链上与服务器侧都**重建**测试环境，而不是在旧 `testnet-live` 上局部打补丁
- 目标链为真实 BSC Testnet RPC，不是本地 fork/anvil
- 允许将旧 `testnet-live` 服务器部署删除后重建为新环境
- 当前最新业务架构以 `fork-anvil` 最终验证结果为准
- 有可用的 BSC Testnet 部署私钥、RPC、WalletConnect Project ID、Admin allowlist、域名方案

## 5. Architecture Impact

### 5.1 Verified Reference Architecture From `fork-anvil`

当前应作为 Testnet 新环境基准的，不是旧 `testnet-live`，而是已经在 `fork-anvil` 中验证通过的最新架构：

- `checkinReceiverAddress = rewardFunderAddress`
- `financeWallet` 独立于 `checkinReceiverAddress`
- `settlementPublisher` 与 `financeWallet` 对齐
- `rootPublisher` 与 `owner` 可独立于资金钱包
- `MerkleClaim` 已支持 `rewardFunder`
- NFT 补贴过期必须按**链上最新区块时间**判定，不按服务器本机时间

参考：
- `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/fork-anvil/manifest.json`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claims-read.service.ts`

### 5.2 Funding Model That Must Be Preserved

这次 testnet 新环境必须按已确认的运营口径初始化：

- 抽奖 / 排名 `USDT` 资金来源：
  - `checkinReceiverAddress`
  - 同时作为 `rewardFunderAddress`
- NFT 每周补贴资金来源：
  - `financeWallet`
  - 对应 `Settlement` 的发布/注资链路

不能再退回旧的“全部角色复用同一个地址”的初始化方式。

### 5.3 Coupling That Requires Fresh Redeploy

以下合约能力在部署时绑定关键地址，不能靠改前后端 env 热切换：

- `NFTSale.paymentToken` 为部署期绑定
- `NFTSale.financeWallet` 为部署期绑定
- `Settlement.paymentToken` 为部署期绑定
- `Settlement.epochPublisher` 为部署期绑定
- `MerkleClaim.paymentToken` 为部署期绑定
- `MerkleClaim.rewardFunder` 为部署期绑定/初始化能力相关

因此如果要按最新架构上真实 testnet，必须新发完整合约套件。

### 5.4 Environment Naming Decision

推荐技术方案：

1. 链上环境名使用新的 `testnet-mockusdt`
2. 服务器与域名可以在切换时**取代**旧 `testnet-live` 入口
3. 旧 `testnet-live` 的服务器部署、数据库、Redis 可删除重建
4. 不复用旧 `testnet-live` manifest 中任何链上地址

这样兼顾：

- 链上边界全新、可审计
- 服务器对外入口可以沿用现有测试服域名
- 回滚时仍能保留旧配置备份

## 6. Milestones

### Milestone 1: Freeze Fresh Testnet Topology And Cutover Strategy

- Goal:
  - 明确新环境名、旧 `testnet-live` 的处理方式、链上与服务器切换策略
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-rollout/plan.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-live/*`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/*`
- Implementation notes:
  - 冻结以下决策：
    - 链上合约全部新发
    - 服务器侧允许删除旧 `testnet-live`
    - 新环境配置以 `testnet-mockusdt` 命名保留
    - 对外域名可沿用原测试服域名
  - 明确切换顺序：
    - 先部署链上
    - 再部署新服务
    - 最后替换流量/域名
- Risks:
  - 旧 `testnet-live` 的数据库与 Redis 清理过早
  - 域名复用但环境命名未统一，导致排障混乱
- Verification commands:
  - `rg -n "testnet-live|testnet-mockusdt" config/promotion-envs docs/plan-excution`
- Expected outputs:
  - 一套冻结的 cutover 口径
  - 明确哪些资源“复用入口”、哪些资源“全新重建”

### Milestone 2: Create New Environment Skeleton Using Split Funding Roles

- Goal:
  - 新建并填充 `config/promotion-envs/testnet-mockusdt`，按最新 split funding 角色初始化
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/contracts.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/server.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/dapp.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/admin.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/notes.md`
- Implementation notes:
  - `paymentTokenKind = mockusdt`
  - 初始化角色至少分成：
    - `owner`
    - `rootPublisher`
    - `checkinReceiverAddress`
    - `rewardFunderAddress`
    - `financeWallet`
    - `settlementPublisher`
  - 其中默认口径：
    - `rewardFunderAddress = checkinReceiverAddress`
    - `settlementPublisher = financeWallet`
  - 不再使用单地址收款/注资模型
  - 为数据库、Redis、Bull prefix 设定全新隔离值
- Risks:
  - 地址角色分错，后续发奖/补贴会被资金路径打断
  - dapp/server/env 不一致，导致签到收款地址错配
- Verification commands:
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target contracts`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp`
- Expected outputs:
  - 新环境 manifest 与四套 env 完整可打印
  - 可清晰看到 split funding roles 已写入

### Milestone 3: Deploy Fresh Contract Suite To BSC Testnet

- Goal:
  - 将最新合约部署到真实 BSC Testnet，并把地址回写到新 manifest
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeployMockUSDT.s.sol`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeployNFTCore.s.sol`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeploySettlementClaim.s.sol`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
- Implementation notes:
  - 使用真实 BSC Testnet RPC，不得使用本地 node
  - 执行顺序：
    - `MockUSDT`
    - `FounderNFT + NFTSale`
    - `Settlement + MerkleClaim`
  - 重点确认：
    - `NFTSale.financeWallet == financeWallet`
    - `Settlement.epochPublisher == settlementPublisher`
    - `MerkleClaim.rewardFunder == rewardFunderAddress`
  - 将 broadcast artifacts 回写进 manifest
- Risks:
  - 私钥/RPC 配置错误
  - 合约 owner 与实际运营钱包不一致
  - 广播成功但 manifest 未回写，导致后续服务读旧值
- Verification commands:
  - `node scripts/promotion-env/deploy-contract-suite.mjs --env testnet-mockusdt --force`
  - `cast call <merkleClaim> "rewardFunder()(address)" --rpc-url <bsc-testnet-rpc>`
  - `cast call <nftSale> "financeWallet()(address)" --rpc-url <bsc-testnet-rpc>`
  - `cast call <settlement> "epochPublisher()(address)" --rpc-url <bsc-testnet-rpc>`
- Expected outputs:
  - manifest 中出现全新 testnet 合约地址
  - 三条关键角色校验全部匹配

### Milestone 4: Sync Server/Dapp/Admin To The New Chain Environment

- Goal:
  - 让 `server / dapp / admin / contracts` 全部运行在新合约与新角色配置上
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/*.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/package.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/package.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/package.json`
- Implementation notes:
  - 使用现有 env 体系：
    - `apps/server env:start:prod`
    - `apps/dapp env:build / env:start`
    - `apps/admin env:build / env:start`
  - 确认以下关键值一致：
    - `PROMOTION_CHECKIN_RECEIVER_ADDRESS`
    - `PROMOTION_REWARD_FUNDER_ADDRESS`
    - `PROMOTION_SETTLEMENT_ADDRESS`
    - `NEXT_PUBLIC_CHECKIN_RECEIVER_ADDRESS`
    - `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS`
  - 确认 admin allowlist、WalletConnect、CORS、API_BASE_URL 都指向新测试服
- Risks:
  - 前端 bundle 使用旧 env，导致签到继续打到旧地址
  - server 与 dapp 指向不同 payment token / receiver
- Verification commands:
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp`
  - `node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target admin`
- Expected outputs:
  - 所有服务读取同一套新合约地址和角色地址

### Milestone 5: Fund Operational Wallets And Run Manual UAT On Real Testnet

- Goal:
  - 用真实 BSC Testnet 完成一轮最小闭环验收
- Affected files/modules:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/*`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/*`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/*`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-rollout/execution.md`
- Implementation notes:
  - 资金准备至少覆盖三类钱包：
    - 用户测试钱包：签到 / 购 NFT / claim gas
    - `checkinReceiver/rewardFunder`：抽奖/排名注资
    - `financeWallet/settlementPublisher`：周补贴注资
  - 手工 UAT 覆盖：
    - 签到支付 `3 USDT` -> 获得 `1000 AURA`
    - 手动参与抽奖 / 周结算 / 揭晓
    - 排名奖 claim
    - 购买型 NFT -> 周补贴 claim
    - 过期补贴显示为 `已作废`
- Risks:
  - 测试币不足
  - 真实 testnet 区块时间与 UAT 周期推进成本较高
  - 钱包缓存旧 token / 旧 RPC
- Verification commands:
  - `curl -s <api-domain>/api/v1/health`
  - 手工页面检查：`/checkin` `/rewards` `/claims` `/nft` `/admin`
  - `cast receipt <txHash> --rpc-url <bsc-testnet-rpc>`
- Expected outputs:
  - 一套真实 testnet 的可用测试环境
  - 与 `fork-anvil` 相同的关键业务行为得到验证

## 7. Approval Checkpoint

进入实施前，需要你确认以下执行口径：

- 采用全新合约部署，不复用旧 `testnet-live` 链上地址
- 服务器侧允许删除旧 `testnet-live` 部署并重新接线
- 新环境按 split funding 架构初始化：
  - `checkinReceiverAddress = rewardFunderAddress`
  - `financeWallet = settlementPublisher`
- 验收以真实 BSC Testnet 为准，不依赖本地 fork

## 8. Rollback / Recovery Notes

- 在新 testnet 合约地址完成写回前，不删除旧服务器部署
- 新环境部署失败时：
  - 保留旧服务器
  - 备份新 manifest 与 broadcast artifacts
  - 重新执行链上部署或切换到新的环境名
- 新服务切换失败时：
  - 恢复旧 systemd / Nginx 配置
  - 将对外域名重新指回旧实例
- 若前后端 runtime 使用旧 env：
  - 以 manifest 为单一事实源重做 env 渲染并重启服务

## 9. Final Verification Checklist

- 新 BSC Testnet 合约已完整部署
- `MockUSDT / FounderNFT / NFTSale / Settlement / MerkleClaim` 地址齐全
- `MerkleClaim.rewardFunder` 正确指向 `checkinReceiverAddress`
- `NFTSale.financeWallet` 正确指向 `financeWallet`
- `Settlement.epochPublisher` 正确指向 `settlementPublisher`
- `server / dapp / admin / contracts` 的派生 env 与 manifest 一致
- 签到、抽奖/排名、NFT 购买、NFT 补贴、过期补贴显示均冒烟通过
- 旧 `testnet-live` 是否保留/下线已被明确记录
