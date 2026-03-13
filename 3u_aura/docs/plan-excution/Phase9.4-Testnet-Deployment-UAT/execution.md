# Execution

## Status
In progress, currently blocked by missing `chainId = 97` testnet configuration.

## Last Updated
2026-03-13 10:01:01 +0800

## Summary
- 已开始执行 `Phase9.4`，先完成了联调前置检查。
- 当前 blocker 已确认不是代码构建问题，而是测试链部署和联调所需的 RPC、私钥、角色钱包和合约地址均未配置。
- 为减少后续启动成本，已补齐 `contracts / server / dapp / admin` 四侧的 `.env.example` 模板，以及一份 `97` 测试链 deployment manifest 模板。

## Work Completed

### 1. Testnet Readiness Audit
- 检查了仓库中的环境文件与当前 shell 环境。
- 确认仓库只有 `apps/server/.env`，且当前 Phase9.4 所需的关键测试链变量均未配置。
- 检查了现有 Foundry 部署脚本：
  - `apps/contracts/script/DeployNFTCore.s.sol`
  - `apps/contracts/script/DeploySettlementClaim.s.sol`
- 检查了 server / dapp 当前对 promotion 链配置的读取入口：
  - `apps/server/src/configuration/config.configuration.ts`
  - `apps/dapp/src/lib/promotion-contracts.ts`

### 2. Preflight Verification
- `apps/contracts` 的构建与测试已复验：
  - `forge build` passed
  - `forge test` passed
- 结论是：本地合约基线可用，但没有足够的测试链输入，不能进入真实广播。

### 3. Environment Template Hardening
- 更新 `apps/server/.env.example`
  - 新增 admin allowlist 和 promotion testnet 所需的完整变量模板
- 新增 `apps/contracts/.env.example`
  - 覆盖 Foundry 部署脚本所需的 broadcaster、owner、publisher、signer、payment token、RPC 等参数
- 新增 `apps/dapp/.env.example`
  - 覆盖 public API base URL、WalletConnect、promotion 合约地址与 `chainId = 97`
- 新增 `apps/admin/.env.example`
  - 覆盖后台联调所需的 API base URL 与 WalletConnect project id
- 更新 `apps/dapp/.gitignore`
  - 允许 `.env.example` 进仓库，继续忽略真实 `.env*`

### 4. Deployment Manifest Template
- 新增 `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/deployment-manifest.template.md`
- 模板内容覆盖：
  - 网络信息
  - 角色钱包
  - 合约地址
  - 部署 txHash
  - 四侧环境变量映射
  - UAT 检查表

## Blocking Findings
- 缺失的关键配置包括：
  - `BSC_TESTNET_RPC_URL`
  - `PRIVATE_KEY`
  - `OWNER`
  - `USDT_ADDRESS`
  - `FINANCE_WALLET`
  - `REFERRAL_SIGNER`
  - `SETTLEMENT_PUBLISHER`
  - `ROOT_PUBLISHER`
  - `PROMOTION_RPC_URL`
  - `PROMOTION_REFERRAL_RPC_URL`
  - `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY`
  - `PROMOTION_CHECKIN_RECEIVER_ADDRESS`
  - `PROMOTION_PAYMENT_TOKEN_ADDRESS`
  - `PROMOTION_NFT_SALE_ADDRESS`
  - `PROMOTION_MERKLE_DISTRIBUTOR_ADDRESS`
  - `PROMOTION_SETTLEMENT_ADDRESS`
  - `ADMIN_ALLOWLIST_WALLETS`
- 在这些值未准备完成前，不能执行：
  - 真实合约部署
  - 三端环境接线
  - admin 审批联调
  - referral NFT 最终 mint UAT

## Commands Run
- `env | rg '^(BSC_TESTNET_RPC_URL|PROMOTION_|NEXT_PUBLIC_|ADMIN_ALLOWLIST_WALLETS|PRIVATE_KEY|OWNER|USDT_ADDRESS|FINANCE_WALLET|REFERRAL_SIGNER|FOUNDER_NFT_ADDRESS|SETTLEMENT_PUBLISHER|ROOT_PUBLISHER)='`
- `cd apps/contracts && forge build`
- `cd apps/contracts && forge test`
- `find . -maxdepth 3 \\( -name '.env' -o -name '.env.local' -o -name '.env.development' -o -name '.env.production' -o -name '.env.test' -o -name '.env.*.local' \\) | sort`
- `rg -n '^(BSC_TESTNET_RPC_URL|PROMOTION_|ADMIN_ALLOWLIST_WALLETS|PRIVATE_KEY|OWNER|USDT_ADDRESS|FINANCE_WALLET|REFERRAL_SIGNER|FOUNDER_NFT_ADDRESS|SETTLEMENT_PUBLISHER|ROOT_PUBLISHER)=' apps/server/.env`
- `python3 - <<'PY' ... PY` to enumerate missing Phase9.4 environment keys without printing secret values
- `find apps -maxdepth 2 -name '.env.example' | sort`
- `rg -n 'PROMOTION_|NEXT_PUBLIC_PROMOTION_CHAIN_ID|BSC_TESTNET_RPC_URL|PRIVATE_KEY|ADMIN_ALLOWLIST_WALLETS' apps/contracts/.env.example apps/server/.env.example apps/dapp/.env.example apps/admin/.env.example docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/deployment-manifest.template.md`
- `git check-ignore -v apps/dapp/.env.example`
- `git status --short --untracked-files=all | rg '\\.env\\.example|Phase9\\.4'`

## Verification Results
- `apps/contracts`
  - `forge build` passed
  - `forge test` passed
- Environment audit
  - shell 环境未发现 Phase9.4 所需关键变量
  - `apps/server/.env` 中也未配置 Phase9.4 所需关键变量
- Template verification
  - `apps/contracts/.env.example` exists
  - `apps/server/.env.example` updated
  - `apps/dapp/.env.example` exists
  - `apps/admin/.env.example` exists
  - deployment manifest template exists

## Deviations From Original Plan
- 原计划的 `Milestone 2` 到 `Milestone 5` 需要真实测试链配置与广播能力；由于配置为空，本次只完成了 `Milestone 1` 的环境冻结准备和模板化工作。
- 本次没有进行任何真实 `97` 测试链交易广播，因此也没有生成合约地址、部署 txHash 或 UAT txHash。

## Next Required Inputs
- 一套可用的 `97` 测试链 RPC
- deployer private key
- owner / finance / signer / publisher / admin wallets
- 测试用 payment token 地址
- check-in receiver 地址
- WalletConnect project id

## Next Action After Inputs Are Ready
- 填充四侧 `.env` / deployment manifest
- 广播部署 `FounderNFT + NFTSale`
- 广播部署 `Settlement + MerkleClaim`
- 回填 server / dapp / admin 配置
- 启动三端并执行真实 UAT
