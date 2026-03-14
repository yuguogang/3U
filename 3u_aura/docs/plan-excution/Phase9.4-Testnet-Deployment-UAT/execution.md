# Execution

## Status
In progress. `Milestone 1` to `Milestone 3` are effectively complete; `Milestone 4` UAT evidence and `Milestone 5` go/no-go conclusion are still pending, so `Phase9.4` cannot be marked completed yet.

## Last Updated
2026-03-14 10:32:59 +0800

## Summary
- 已完成 `97` 测试链 promotion 合约部署、三端环境接线、signer 对齐校验，以及本地运行可达性验证。
- 当前不再受“配置缺失”阻塞；真实剩余工作是执行并记录 `Milestone 4` 的手工 UAT，以及形成 `Milestone 5` 的 go/no-go 结论。
- 本文件已按真实状态回写：保留部署证据来源、记录运行验证结果，并移除此前“已部署”与“尚未配置”并存的矛盾描述。

## Work Completed

### 1. Initial Readiness Audit
- 在本 phase 早期检查了仓库中的环境文件与当前 shell 环境。
- 当时确认 promotion testnet 所需关键变量尚未冻结，且测试链部署与联调输入并不完整。
- 检查了 Foundry 部署脚本与 promotion 相关配置入口：
  - `apps/contracts/script/DeployNFTCore.s.sol`
  - `apps/contracts/script/DeploySettlementClaim.s.sol`
  - `apps/server/src/configuration/config.configuration.ts`
  - `apps/dapp/src/lib/promotion-contracts.ts`

### 2. Contract Baseline Verification
- 复验了 `apps/contracts` 基线：
  - `forge build` passed
  - `forge test` passed
- 结论是：合约本地基线可用，可以继续进入真实测试链部署与联调。

### 3. Environment Template Hardening
- 更新 `apps/server/.env.example`
  - 新增 admin allowlist 和 promotion testnet 所需的完整变量模板。
- 新增 `apps/contracts/.env.example`
  - 覆盖 Foundry 部署脚本所需的 broadcaster、owner、publisher、signer 地址、payment token、RPC 等参数。
- 新增 `apps/dapp/.env.example`
  - 覆盖 public API base URL、WalletConnect、promotion 合约地址与 `chainId = 97`。
- 新增 `apps/admin/.env.example`
  - 覆盖后台联调所需的 API base URL 与 WalletConnect project id。
- 更新 `apps/dapp/.gitignore`
  - 允许 `.env.example` 进仓库，继续忽略真实 `.env*`。

### 4. Deployment Manifest Documentation
- 新增 `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/deployment-manifest.template.md`。
- 模板覆盖：
  - 网络信息
  - 角色钱包
  - 合约地址
  - 部署 txHash
  - 四侧环境变量映射
  - UAT 检查表
- 后续为避免在跟踪文档中残留敏感值，已将模板恢复为空白占位；真实部署证据转而锚定在 Foundry broadcast logs。

### 5. Testnet Deployment (BSC Testnet chainId 97)
- 成功执行了 `DeployNFTCore.s.sol`：
  - `FounderNFT`: `0x96f91e11dF8D15033ed5EEc4b547789A0862Ebb7`
  - `NFTSale`: `0x3fBE7773787a9c6b89e5C6dfdC135b9b378CD778`
  - `FounderNFT deploy tx`: `0xb80d8fcb20e552963108f6bef4a43cdc217ea9e9d1cb92732d6b49b1b45f44f2`
  - `NFTSale deploy tx`: `0x3e737c85b4caeb1e306db40de1bcfd91e6e75143e13cc917dcc6888fd5f8b01f`
  - `Sale role bind tx`: `0x00964a7beb93c5e77bf8c48844ec758e10aed96e959d110d292a902a7698cf0c`
- 成功执行了 `DeploySettlementClaim.s.sol`：
  - `Settlement`: `0xc7Df92B52D2285e1c3cD2ED39028a6A9dD5EF1CC`
  - `MerkleClaim`: `0x2bA5e14713CE0f2a78036386342c982a284b26aD`
  - `Settlement deploy tx`: `0xd6b2b517677dc12e0fc804274de9797f539136bcd38e8417ac79fcd7e6be1f00`
  - `MerkleClaim deploy tx`: `0xb6848444e9d8b186db04a85b002f2c953df409ed0fd105a3bfca09d35cd117f7`
  - `Settlement publisher tx`: `0xf657d1d4fb3861fc42214aa74ade0d50fa8e9b82d9f35ec992f9f37d44bd8c67`
  - `Root publisher tx`: `0xc8fb22503f72ef1042b561572fff212b03c3bfaf7ae72102eac972c122f9fc0a`
- 当前部署证据来源：
  - `apps/contracts/broadcast/DeployNFTCore.s.sol/97/run-1773387582.json`
  - `apps/contracts/broadcast/DeploySettlementClaim.s.sol/97/run-1773387637.json`

### 6. Environment Wiring
- 更新了 `apps/server/.env`
- 创建并配置了 `apps/dapp/.env`
- 创建并配置了 `apps/admin/.env`
- 已确认 contracts / server / dapp / admin 之间的关键地址、RPC 和 chain ID 配置彼此一致。

### 7. Signer Alignment And Runtime Verification
- 将合约部署侧变量名从 `REFERRAL_SIGNER` 明确为 `REFERRAL_SIGNER_ADDRESS`，避免与 server 侧私钥变量混淆。
- 已确认 `apps/server/.env` 中的 `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY` 推导出的地址，与 `apps/contracts/.env` 中的 `REFERRAL_SIGNER_ADDRESS` 一致。
- 已确认本地运行状态：
  - `apps/server` 在 `3010` 监听，`/api/v1/health` 返回 `{"status":"ok",...}`
  - `apps/dapp` 在 `3000` 返回 `200 OK`
  - `apps/admin` 在 `3001` 返回 `307` 并跳转到 `/dashboard`

## Open Findings
- `Milestone 4` 的手工 UAT 证据尚未录入。本 phase 的 UAT checklist 仍未逐项标记完成，因此 `Phase9.4` 不能收口。
- `Milestone 5` 的 defect triage 与 go/no-go 结论尚未形成。
- `apps/server` 的默认启动路径仍有本地可复现性问题：
  - `pnpm start:dev` 会在当前结构下报 `Cannot find module '../../generated/prisma/client'`
  - `pnpm start:prod` 期待 `dist/main`，但当前 build 产物入口是 `dist/src/main.js`
- Foundry 部署证据目前主要保存在未跟踪的 `apps/contracts/broadcast/` 下；若需要更强审计可追溯性，应决定是提交、归档还是在单独受控文档中固化。

## Commands Run
- `cd apps/contracts && forge build`
- `cd apps/contracts && forge test`
- `find . -maxdepth 3 \( -name '.env' -o -name '.env.local' -o -name '.env.development' -o -name '.env.production' -o -name '.env.test' -o -name '.env.*.local' \) | sort`
- `rg -n 'PROMOTION_|NEXT_PUBLIC_PROMOTION_CHAIN_ID|BSC_TESTNET_RPC_URL|PRIVATE_KEY|ADMIN_ALLOWLIST_WALLETS' apps/contracts/.env.example apps/server/.env.example apps/dapp/.env.example apps/admin/.env.example docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/deployment-manifest.template.md`
- `sed -n '1,220p' apps/contracts/broadcast/DeployNFTCore.s.sol/97/run-1773387582.json`
- `sed -n '1,260p' apps/contracts/broadcast/DeploySettlementClaim.s.sol/97/run-1773387637.json`
- `cast wallet address --private-key <PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY>` to verify signer/address alignment without printing the secret
- `cd apps/server && pnpm build`
- `cd apps/server && pnpm start:dev` (failed: generated Prisma client path mismatch)
- `cd apps/server && pnpm start:prod` (failed: entry path mismatch)
- `cd apps/server && ln -snf ../generated dist/generated`
- `cd apps/server && node dist/src/main.js`
- `lsof -i :3000`
- `lsof -i :3001`
- `lsof -i :3010`
- `curl -s http://127.0.0.1:3010/api/v1/health`
- `curl -I -s http://127.0.0.1:3000`
- `curl -I -s http://127.0.0.1:3001`

## Verification Results
- Contract baseline
  - `forge build` passed
  - `forge test` passed
- Deployment evidence
  - `DeployNFTCore.s.sol` broadcast log contains deployed addresses and txHash evidence for `FounderNFT`, `NFTSale`, and `setSaleContract`
  - `DeploySettlementClaim.s.sol` broadcast log contains deployed addresses and txHash evidence for `Settlement`, `MerkleClaim`, `setEpochPublisher`, and `setRootPublisher`
- Configuration alignment
  - contracts / server / dapp / admin 的核心 testnet 地址、RPC 和 chain ID 已对齐
  - `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY` now matches `REFERRAL_SIGNER_ADDRESS`
- Runtime verification
  - `server`: `http://127.0.0.1:3010/api/v1/health` returned `status=ok`
  - `dapp`: `http://127.0.0.1:3000` returned `200 OK`
  - `admin`: `http://127.0.0.1:3001` returned `307 Temporary Redirect` to `/dashboard`
- Not yet verified
  - wallet login
  - inviter bind
  - inviter-operated placement
  - check-in payment and server verification
  - purchased NFT buy
  - referral NFT approval and mint
  - merkle claim
  - purchased subsidy claim
  - claim sync-back / read model refresh

## Deviations From Original Plan
- 真实部署证据没有最终固化在跟踪文档中，而是保留在 Foundry broadcast logs；模板文档已回退为安全占位版本。
- `apps/server` 未能按计划直接通过 `pnpm start:dev` / `pnpm start:prod` 完成可重复启动，本次采用 `pnpm build` + `dist/generated` 软链接 + `node dist/src/main.js` 作为临时运行路径。
- 本次尚未执行 `Milestone 4` 的人工 UAT，因此也未产出 `Milestone 5` 的 go/no-go 结论。

## Next Required Actions
- 按 UAT checklist 执行真实链路联调，并记录每条路径的 actor wallet、API 结果、txHash、链上结果和 UI 结果。
- 为 `apps/server` 修正可重复的本地启动路径，避免后续 UAT 依赖手工链接与自定义入口。
- 完成 defect triage，并明确是否满足进入 `Phase10` 的条件。
