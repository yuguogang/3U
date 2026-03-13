# Plan: Phase 9.4 - Testnet Deployment & Promotion UAT

## 1. Objective
在 `chainId = 97` 测试链上完成 promotion 阶段的真实部署、环境配置、跨端联调和用户验收测试，确认当前 `Phase2` 到 `Phase9.3` 的推广主流程具备测试网闭环，而不是只停留在本地 build/test 通过。

## 2. Scope
- 使用现有 Foundry 脚本部署 promotion 合约到 `chainId = 97`
- 冻结测试链地址清单、部署账户、admin/operator 钱包、测试用户钱包
- 配置 `apps/server`、`apps/dapp`、`apps/admin` 的 promotion 测试链环境变量
- 完成 check-in / tree placement / weekly claim / purchased NFT / referral NFT manual approval 的跨端联调
- 记录真实合约地址、关键 txHash、验收结果、已知问题和阻断项
- 必要时为测试链联调补充最小脚本、配置或只读诊断能力

## 3. Out of Scope
- `Phase10` 的 genesis claim 与发行切换
- `Phase11` 的 token tax / dividend / burn
- 新业务规则设计
- 把 promotion 所有脚本彻底产品化为一键 DevOps 流程
- 主网或其他测试网部署

## 4. Assumptions
- 当前 promotion 代码闭环已完成，见 `Phase2` 到 `Phase9.3` 的 execution 记录
- `apps/contracts/script/DeployNFTCore.s.sol` 与 `apps/contracts/script/DeploySettlementClaim.s.sol` 仍是测试链部署入口
- `apps/server` 已支持：
  - `PROMOTION_CLAIM_CHAIN_ID`
  - `PROMOTION_RPC_URL`
  - `PROMOTION_REFERRAL_RPC_URL`
  - `PROMOTION_NFT_SALE_ADDRESS`
  - `PROMOTION_MERKLE_DISTRIBUTOR_ADDRESS`
  - `PROMOTION_SETTLEMENT_ADDRESS`
  - `PROMOTION_PAYMENT_TOKEN_ADDRESS`
  - `PROMOTION_CHECKIN_RECEIVER_ADDRESS`
  - `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY`
- `apps/dapp` 已支持：
  - `NEXT_PUBLIC_PROMOTION_CHAIN_ID`
  - `NEXT_PUBLIC_NFT_SALE_ADDRESS`
  - `NEXT_PUBLIC_MERKLE_CLAIM_ADDRESS`
  - `NEXT_PUBLIC_SETTLEMENT_ADDRESS`
  - `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS`
- `apps/admin` 继续使用 wallet allowlist 模型，不引入额外 RBAC

## 5. Current State
- 本地验证已通过，但尚未完成真实 `97` 测试链部署与远程联调
- promotion 合约地址尚未冻结为一套可追溯的测试链清单
- signer、admin 审批、claim sync、check-in payment verification 都还缺少真实链上回执验证样例

## 6. Target State
- `chainId = 97` 测试链上拥有一套完整可用的 promotion 合约部署
- server / dapp / admin 指向同一组测试链地址和 RPC 配置
- 核心 UAT 路径均有真实测试记录与 txHash
- 缺陷、阻断项和 go/no-go 结论被明确记录
- promotion 可以被认定为“测试网闭环完成”，再进入 `Phase10`

## 7. Architecture Impact
- Contracts:
  - `apps/contracts/src/*`
  - `apps/contracts/script/DeployNFTCore.s.sol`
  - `apps/contracts/script/DeploySettlementClaim.s.sol`
- Server:
  - `apps/server/src/configuration/*`
  - `apps/server/src/modules/checkin/*`
  - `apps/server/src/modules/signing/*`
  - `apps/server/src/modules/claims/*`
  - `apps/server/src/modules/admin/*`
  - `apps/server/scripts/*`
- DApp:
  - `apps/dapp/src/lib/promotion-contracts.ts`
  - `apps/dapp/src/hooks/*`
  - `apps/dapp/src/components/pages/*`
- Admin:
  - `apps/admin/src/api/*`
  - `apps/admin/src/features/*`
- Docs:
  - `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/*`
  - 如有必要，补 deployment manifest / runbook 说明

## 8. Risks
- 部署地址在 server / dapp / admin 三端不一致，导致联调结果失真
- `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY` 与链上 `REFERRAL_SIGNER` 不一致，导致 referral NFT mint 全部失败
- check-in 使用的 USDT 地址、收款地址或链 ID 配错，导致支付验证结果无效
- claim / settlement 使用错误 epochId 或 proof 数据，出现“本地可过、链上失败”的漂移
- 测试链 UAT 如果不记录真实 txHash、钱包和时间点，后续无法复盘
- 若在 UAT 中临时修代码但不回写 execution，会让 Phase9.4 失去审计价值

## 9. Milestones

### Milestone 1 — Testnet Deployment Inputs & Address Manifest Freeze
**Goal**
- 冻结 `97` 测试链联调所需的钱包、RPC、收款地址、signer 地址和部署参数，避免部署前输入漂移

**Affected files/modules**
- `apps/contracts/script/DeployNFTCore.s.sol`
- `apps/contracts/script/DeploySettlementClaim.s.sol`
- `apps/server/src/configuration/config.configuration.ts`
- `apps/dapp/src/lib/promotion-contracts.ts`
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/*`

**Implementation notes**
- 明确至少四类地址：
  - deployer
  - owner/operator
  - referral signer
  - test users
- 明确至少五类合约/收款配置：
  - Mock/测试 USDT
  - NFTSale
  - FounderNFT
  - Settlement
  - MerkleClaim
  - check-in receiver / finance wallet
- 如缺少测试链稳定 USDT，必须先决定是否部署 MockUSDT 或改用既有测试代币
- 形成一份可审计的地址清单，后续所有 UAT 都锚定它

**Risks**
- 输入未冻结前直接广播，后面很难分辨是代码缺陷还是地址配置错误

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge build`
- `rg -n "PROMOTION_|NEXT_PUBLIC_" /Users/ygg/vs/ai/3U/3u_aura/apps/server /Users/ygg/vs/ai/3U/3u_aura/apps/dapp /Users/ygg/vs/ai/3U/3u_aura/apps/admin`

**Expected outputs**
- 一套明确的 `97` 测试链输入参数清单
- 三端环境变量映射无歧义

### Milestone 2 — Deploy Promotion Contracts To ChainId 97
**Goal**
- 使用现有 Foundry 脚本将 promotion 所需合约真实部署到 `97`

**Affected files/modules**
- `apps/contracts/script/DeployNFTCore.s.sol`
- `apps/contracts/script/DeploySettlementClaim.s.sol`
- 如必要，新增最小 deploy/runbook 文档

**Implementation notes**
- 部署顺序至少为：
  - `FounderNFT + NFTSale`
  - `Settlement + MerkleClaim`
- 部署后记录：
  - chainId
  - contract address
  - txHash
  - constructor inputs
  - owner / publisher / signer 角色绑定结果
- 如果部署中发现脚本缺少输出或参数校验，可做最小修补，但只限于部署可观测性和安全性

**Risks**
- 广播成功但角色绑定错误，会让后续 signer、publish、claim 全部失效

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge script script/DeployNFTCore.s.sol:DeployNFTCore --rpc-url $BSC_TESTNET_RPC_URL --broadcast`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge script script/DeploySettlementClaim.s.sol:DeploySettlementClaim --rpc-url $BSC_TESTNET_RPC_URL --broadcast`

**Expected outputs**
- `97` 测试链上存在一套可用的 promotion 合约地址
- 部署与角色绑定 txHash 已记录

### Milestone 3 — Environment Wiring Across Server, DApp, Admin
**Goal**
- 让 `apps/server`、`apps/dapp`、`apps/admin` 使用同一套测试链配置并成功启动

**Affected files/modules**
- `apps/server/src/configuration/*`
- `apps/dapp/src/lib/promotion-contracts.ts`
- `apps/admin/src/lib/wagmi-config.tsx`
- 环境变量模板或本地运行文档

**Implementation notes**
- server 必须接入：
  - `PROMOTION_CLAIM_CHAIN_ID=97`
  - `PROMOTION_RPC_URL`
  - `PROMOTION_REFERRAL_RPC_URL`
  - 部署后的合约地址
  - signer private key
- dapp 必须接入部署后的 public contract addresses
- admin 必须能在 `97` 上正常连接 allowlist 钱包并调用 admin API
- 若运行时发现链配置或 ABI 偏差，优先修配置，不轻易改业务流程

**Risks**
- 本地 build 通过，但真实 dev server 因环境缺失无法启动

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm start:dev`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm dev`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm dev`

**Expected outputs**
- 三端使用统一 `97` 测试链配置成功启动
- API 和前端页面可以读取到真实测试链地址

### Milestone 4 — Promotion End-to-End UAT
**Goal**
- 完成推广主链路的真实 UAT，并记录每条路径的结果和 txHash

**Affected files/modules**
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/tree/*`
- `apps/server/src/modules/signing/*`
- `apps/server/src/modules/claims/*`
- `apps/dapp/src/components/pages/*`
- `apps/admin/src/features/*`

**Implementation notes**
- UAT 至少覆盖：
  - 钱包连接与登录
  - 推荐绑定
  - inviter 代挂树
  - check-in 支付与 server 验链
  - purchased NFT 购买
  - referral NFT 达标、待审批、admin 批准、最终 mint
  - weekly merkle claim
  - purchased subsidy claim
  - claim sync-back / read model 刷新
- 对每条路径记录：
  - actor wallet
  - API request / response
  - txHash
  - on-chain outcome
  - server / UI outcome
- 如发现阻断 bug，在本 phase 内修复并复验，但必须在 `execution.md` 标记偏差

**Risks**
- 没有真实 UAT 样例，只能证明代码可编译，不能证明测试网可用

**Verification commands**
- `curl -s http://127.0.0.1:4000/api/health`
- `curl -s http://127.0.0.1:4000/api/v1/admin/*`
- 结合 DApp / Admin 页面与链上交易进行人工 UAT

**Expected outputs**
- promotion 主流程在 `97` 测试链上完成至少一轮真实闭环
- 每条关键路径都有真实证据可追溯

### Milestone 5 — Defect Triage, Go/No-Go, And Hand-off To Phase10
**Goal**
- 统一收口 UAT 缺陷、确认 promotion 测试网完成度，并给出是否进入 `Phase10` 的结论

**Affected files/modules**
- `docs/plan-excution/Phase9.4-Testnet-Deployment-UAT/*`
- 如需要，补充少量脚本或 runbook 文档

**Implementation notes**
- 缺陷至少分成：
  - blocker
  - major
  - minor
  - noise/warning
- 必须明确：
  - promotion 是否已具备测试网闭环
  - 还缺哪些前置项才适合进入 `Phase10`
- 如果测试网仍存在 blocker，不得把 Phase9.4 标记为 completed

**Risks**
- 不做 go/no-go 结论，后面会把 promotion 缺陷带进 token launch 阶段

**Verification commands**
- `git status --short`
- 汇总本 phase 实际运行的所有命令与结果

**Expected outputs**
- 一份清晰的测试网验收结论
- 明确是否允许进入 `Phase10`

## 10. Approval Checkpoint
- 本 phase 属于 `Critical`
- 需要先审批本计划，再进行真实测试链部署、环境注入和远程 UAT
- 若执行中需要广播交易、写入测试网状态或修改真实环境变量，应在 `execution.md` 中记录实际命令和结果

## 11. Rollback / Recovery Notes
- 部署前先冻结地址与环境变量清单，避免重复广播
- 测试链部署失败时，不直接覆盖旧地址；先记录失败原因与 txHash
- 若 UAT 中发现 blocker，优先修复代码或配置，再重新执行该用例，不直接跳过
- 若 signer key、owner、publisher 配置错误，先停用相关入口并更正配置，不在错误配置上继续测试

## 12. Final Verification Checklist
- [ ] `97` 测试链部署地址、角色地址、测试钱包清单已冻结
- [ ] `FounderNFT / NFTSale / Settlement / MerkleClaim` 已部署并记录 txHash
- [ ] server / dapp / admin 已指向同一套测试链配置
- [ ] check-in、placement、purchased NFT、referral NFT manual approval、claim 至少完成一轮真实 UAT
- [ ] 所有 blocker 已修复或明确阻断进入 `Phase10`
- [ ] `execution.md` 已记录真实命令、地址、txHash、结果和偏差

## 13. Approval Request
请审批 `Phase9.4-Testnet-Deployment-UAT`。审批后将进入 `chainId = 97` 的真实部署、环境接线和推广阶段 UAT，不会直接跳到 `Phase10`。
