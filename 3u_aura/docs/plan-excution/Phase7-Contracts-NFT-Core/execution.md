# Execution

## Status
Completed

## Completed At
2026-03-11 19:11:09 +0800

## Summary
- 新增 `FounderNFT`、`NFTSale`、`MockUSDT` 合约。
- 新增最小 `Ownable / ReentrancyGuard / IERC20Minimal / ECDSA` 支撑模块。
- 新增 `FounderNFT / NFTSale / NFTSignature` 三组 Foundry 测试。
- 新增 `DeployNFTCore.s.sol` 部署脚本。
- 更新 `foundry.toml` remappings 与本地可用编译器版本。

## Implemented Work

### 1. FounderNFT Core
- 新增 [FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol)。
- 使用 `ERC721A` 实现顺序 mint，tokenId 从 `1` 开始。
- 链上追踪：
  - `purchasedMinted`
  - `referralMinted`
  - `isPurchasedNFT[tokenId]`
  - `hasReferralNFT[address]`
- 只允许授权 `saleContract` mint。

### 2. NFTSale Core
- 新增 [NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol)。
- 实现：
  - `buyNFT()`
  - `mintNFTByReferral(nonce, expiry, signature)`
  - `getRemainingNFT()`
  - `domainSeparator()`
  - `hashReferralMint(...)`
- 推广型 NFT replay 防护采用“地址顺序 nonce + EIP712 digest”。
- 购买资金直接转入 `financeWallet`。

### 3. Supporting Contracts
- 新增 [Ownable.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/access/Ownable.sol)。
- 新增 [ReentrancyGuard.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/access/ReentrancyGuard.sol)。
- 新增 [IERC20Minimal.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/interfaces/IERC20Minimal.sol)。
- 新增 [ECDSA.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/libraries/ECDSA.sol)。
- 新增 [MockUSDT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/mocks/MockUSDT.sol) 作为 buy flow 测试 token。

### 4. Tests
- 新增 [FounderNFT.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/FounderNFT.t.sol)。
- 新增 [NFTSale.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/NFTSale.t.sol)。
- 新增 [NFTSignature.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/NFTSignature.t.sol)。
- 覆盖：
  - supply cap
  - one-per-address referral 限制
  - 购买成功路径
  - allowance / transferFrom 失败路径
  - valid signature
  - wrong signer
  - replay
  - expiry
  - wrong chain domain
  - wrong verifyingContract domain
  - 同地址可同时持有购买型与推广型 NFT

### 5. Script / Config
- 新增 [DeployNFTCore.s.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/script/DeployNFTCore.s.sol)。
- 更新 [foundry.toml](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/foundry.toml)：
  - 加入 `ERC721A` / `forge-std` remappings
  - 开启 optimizer
  - 编译器版本固定到本机已安装的 `0.8.19`

## Deviations From Plan
- 原始实现草案使用 `solc 0.8.24`。执行时发现当前机器离线环境只有 `0.8.19 / 0.8.17 / 0.8.15` 等本地编译器，`forge test` 会尝试联网获取 `0.8.24`，因此改为 `0.8.19` 以保证离线可验证。
- 未引入 OpenZeppelin 额外依赖，改为最小自实现 `Ownable / ReentrancyGuard / ECDSA`，以控制 blast radius 并避免依赖下载。

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge fmt
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test
ls -la ~/.svm ~/.foundry 2>/dev/null
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge --version
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && solc --version
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge fmt
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test
```

## Verification Results
- `forge fmt`: passed
- `forge build`: passed
- `forge test`: passed
  - `FounderNFT.t.sol`: 5 passed
  - `NFTSale.t.sol`: 6 passed
  - `NFTSignature.t.sol`: 8 passed
  - total: `19` passed, `0` failed

## Residual Notes
- 部署脚本只完成了编译级验证，没有连接 RPC 做 dry-run broadcast。
- 当前 EIP712 message 结构已冻结为 `recipient / nonce / expiry`；server/common 在后续接入 Phase9 前应按同一 digest 规则对齐。
- `buyNFT()` 当前按单个 NFT 购买实现，不支持一次性批量购买；这与现阶段 plan/spec 一致。
