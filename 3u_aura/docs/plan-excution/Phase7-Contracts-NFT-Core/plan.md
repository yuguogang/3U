# Plan: Phase 7 - Contracts NFT Core (FounderNFT + NFTSale)

## 1. Objective
实现 FounderNFT 与 NFTSale 的推广阶段核心入口：购买型 NFT、推广型签名 mint、供给上限、每地址限制、事件与部署脚本。

## 2. Scope
- FounderNFT 合约
- NFTSale 合约
- MockUSDT 测试合约
- 购买型 30 个，1000 USDT / 个
- 推广型 70 个，后端签名 mint
- 查询剩余数量
- EIP712 nonce / chainId / expiry 防重放
- 测试与部署脚本

## 3. Out of Scope
- Settlement
- MerkleClaim
- Token 税逻辑
- 治理权

## 4. Assumptions
- 购买资金进入财务钱包而非 Treasury
- 推广型 NFT 资格由后端验证后签名
- 每地址限 1 个推广型 NFT
- 同一地址允许同时持有购买型 NFT 和推广型 NFT；限制只作用于推广型
- 总供应上限达到后停止 mint
- EIP712 的 `chainId / verifyingContract` 放在 domain，message 至少包含 `recipient / nonce / expiry`
- contracts 工程当前只有 Foundry skeleton，Phase7 需同时创建 `src / test / script` 下首批业务文件

## 5. Current State
- contracts 工程已存在，但当前仅有 Foundry skeleton
- 尚无 `FounderNFT / NFTSale / MockUSDT` 具体实现
- 尚无部署脚本与业务测试目录

## 6. Target State
- 用户可购买购买型 NFT
- 合格用户可用后端签名 mint 推广型 NFT
- supply、one-per-address、nonce 防重放均被严格约束

## 7. Architecture Impact
- `apps/contracts/src/FounderNFT.sol`
- `apps/contracts/src/NFTSale.sol`
- `apps/contracts/src/mocks/MockUSDT.sol`
- `apps/contracts/test/*`
- `apps/contracts/script/*`

## 8. Risks
- EIP712 payload 不稳定
- 购买资金流向错误
- purchased / referral 类型标记不清
- supply cap 与单地址限制未封严
- signer / owner / financeWallet 权限边界不清
- 本地测试缺少稳定 USDT mock 时，buy flow 难以验证 allowance / transferFrom 边界

## 9. Milestones

### Milestone 1 — FounderNFT storage and mint model
**Goal**
- 定义 NFT 类型标记、mint 接口约束、事件

**Affected files/modules**
- `apps/contracts/src/FounderNFT.sol`
- `apps/contracts/test/FounderNFT*`

**Implementation notes**
- purchased / referral 类型必须链上可追踪
- 总量应至少同时追踪 `purchasedMinted / referralMinted / totalSupply`
- 不要把“推广型每地址限 1 个”错误扩大成“全 NFT 每地址限 1 个”

**Risks**
- token metadata / type tracking 后续难扩展

**Verification**
- commands:
  - `forge test --match-path test/FounderNFT*`
- expected result:
  - mint / type tracking / supply checks 通过

**Approval checkpoint**
- yes

### Milestone 2 — NFTSale buy flow
**Goal**
- 完成 buyNFT() 与财务钱包收款路径

**Affected files/modules**
- `apps/contracts/src/NFTSale.sol`
- `apps/contracts/test/NFTSale*`

**Implementation notes**
- USDT transfer / allowance 流程要有测试
- 购买型上限 30 个
- 需要 `MockUSDT` 覆盖 allowance 不足、余额不足、transferFrom 失败、mint 成功收款成功路径
- buy flow 应保证“付款失败则整体回滚，不会出现收款成功但 mint 失败后资产悬空”

**Risks**
- 付款成功但 mint 失败的边界问题

**Verification**
- commands:
  - `forge test --match-path test/NFTSale*`
- expected result:
  - buyNFT 流程、上限控制、收款路径测试通过

**Approval checkpoint**
- yes

### Milestone 3 — Referral signature mint
**Goal**
- 完成 mintNFTByReferral(signature) 及 replay 防护

**Affected files/modules**
- `apps/contracts/src/NFTSale.sol`
- `apps/contracts/test/NFTSignature*`

**Implementation notes**
- payload 至少包含 user / nonce / chainId / expiry
- one-per-address 必须强制
- 需明确链上 replay 防护口径：domain 固定 `name / version / chainId / verifyingContract`，message 固定 `recipient / nonce / expiry`
- 合约端应追踪已使用 nonce 或 digest，避免同签名在同链重复消费

**Risks**
- signer / domain mismatch
- 重放攻击

**Verification**
- commands:
  - `forge test --match-path test/NFTSignature*`
- expected result:
  - valid signature 成功，expired / wrong signer / replay 均失败

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 未审计前仅本地和 fork 测试
- payload 结构一旦确定，尽量冻结并同步给 server / common
- 如果 Phase7 实现时发现需引入 OpenZeppelin 额外依赖，应单独记录依赖变更，不要静默改写签名与权限模型

## 11. Final Verification Checklist
- [ ] 购买型 30 个上限正确
- [ ] 推广型 70 个上限正确
- [ ] 每地址限 1 个推广型 NFT
- [ ] 同一地址可同时持有购买型与推广型 NFT
- [ ] EIP712 含 nonce / chainId / expiry
- [ ] domain / message 结构已冻结并可同步到 server
- [ ] 事件与部署脚本完整

## 12. Approval Request
请审批 Phase 7 计划；通过后进入 FounderNFT / NFTSale 合约实现。
