# Plan: Phase 7.1 - Referral Mint Signer Service

## 1. Objective
实现推广型 NFT 的后端 signer 闭环：服务端基于**真实资格**、**链上当前 nonce** 和 **合约 EIP712 口径**生成可直接用于 `NFTSale.mintNFTByReferral()` 的签名 payload。

## 2. Scope
- `apps/server` 的 referral mint signer 服务
- signer 配置与密钥读取边界
- 链上 `referralNonces(recipient)` 读取
- EIP712 typed-data / digest / signature 生成
- eligibility 二次校验与审计落库
- shared response model / validator 更新
- 保留现有 preview 语义的兼容方案或新增清晰的签名 endpoint
- 相关单测与构建验证

## 3. Out of Scope
- DApp 页面改造与钱包交互优化
- 链上 claim / settlement / indexer 回写
- KMS / HSM / MPC 等正式密钥托管系统
- 删除 Prisma 里的遗留 `referralNonce` 字段
- 推广型 NFT mint 成功后的链上事件同步

## 4. Assumptions
- 推广型 NFT 合约入口已固定为 [NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol#L109) 的 `mintNFTByReferral(uint256 nonce, uint256 expiry, bytes signature)`
- message 结构固定为 `recipient / nonce / expiry`
- domain 结构固定为 `name / version / chainId / verifyingContract`
- 签名私钥第一版通过 server 配置注入，后续如迁移 KMS，应保留 adapter 边界
- signer 服务不在数据库事务内执行外部 RPC 调用
- 当前 `NftReferralEligibility.signedNonce / signedPayloadHash` 只作为审计镜像，不再作为 nonce 权威来源

## 5. Current State
- server 现有 [signing.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/services/signing.service.ts#L1) 只返回 preview，不返回真正签名
- 当前 [eip712-payload.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/engines/eip712-payload.engine.ts#L1) 只做 `sha256(JSON.stringify(preview))`，不是合约真实 digest
- 当前 [signing-nonce.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/repositories/signing-nonce.repository.ts#L1) 使用数据库自增 `referralNonce`
- 合约实际信任的是链上 [referralNonces](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol#L56) 映射，而不是数据库字段
- DApp 当前只能做 preview，不能真正发起 referral NFT mint

## 6. Target State
- server 返回可直接用于 referral mint 的最终 payload：
  - `recipient`
  - `chainId`
  - `contractAddress`
  - `nonce`
  - `expiresAt`
  - `digest`
  - `signature`
- nonce 与合约链上状态严格对齐
- eligibility 在签名前重新校验
- 签名请求具备审计痕迹，可追溯谁、何时、签了什么 digest
- preview-only 路径不再被误当成最终 mint 能力

## 7. Architecture Impact
- `packages/common/src/models/promotion.ts`
- `packages/common/src/validators/promotion.ts`
- `apps/server/src/configuration/*`
- `apps/server/src/modules/signing/*`
- `apps/server/src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts`
- `apps/server/src/modules/signing/services/signing.service.spec.ts`

## 8. Risks
- 使用数据库 nonce 会和链上 nonce 漂移，直接导致签名失效
- EIP712 domain 或 digest 与合约不一致，会导致链上全部 revert
- signer 私钥暴露或配置错误，会造成错误授权
- `contractAddress / chainId` 不做白名单校验，会让 signer 被用于错误目标
- 如果签名前不重新校验 eligibility，会放大资格漂移风险
- 如果重复签发缺少审计与速率边界，后续排查会非常困难

## 9. Milestones

### Milestone 1 — Freeze signed payload contract
**Goal**
- 冻结 server 与 contract 对齐的最终签名 payload 结构与配置边界

**Affected files/modules**
- `packages/common/src/models/promotion.ts`
- `packages/common/src/validators/promotion.ts`
- `apps/server/src/configuration/config.types.ts`
- `apps/server/src/configuration/config.configuration.ts`
- `apps/server/src/modules/signing/*`

**Implementation notes**
- 明确新增最终返回模型，例如 `ReferralMintSignaturePayload`
- payload 至少包含：`recipient / chainId / contractAddress / nonce / expiresAt / digest / signature`
- 明确 signer 只允许对**配置内的 chainId + NFTSale contract**签名
- 如需保留 preview endpoint，必须把“preview”和“final signature”语义分开，不能继续混名

**Risks**
- shared model 改名或接口语义不清，后续 DApp 会继续误用 preview

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- common build 通过
- server build 通过
- payload 结构、配置键名、endpoint 命名被正式冻结

### Milestone 2 — Chain nonce reader and EIP712 signer engine
**Goal**
- 使用链上 nonce 生成真正可用的 EIP712 digest 与 signature

**Affected files/modules**
- `apps/server/src/modules/signing/engines/eip712-payload.engine.ts`
- `apps/server/src/modules/signing/services/signing.service.ts`
- `apps/server/src/modules/signing/repositories/signing-nonce.repository.ts`
- `apps/server/src/modules/signing/services/signing.service.spec.ts`

**Implementation notes**
- 停止把数据库 `referralNonce` 当作签名 nonce 权威
- 新增链上只读 adapter，通过 RPC 读取 `NFTSale.referralNonces(recipient)`
- 使用 `viem` 的 typed-data / signTypedData 路径生成真实签名
- `digest` 必须和合约 [hashReferralMint](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol#L164) 口径一致
- `expiresAt` 应限制在合理时间窗内，例如 15 分钟或可配置上限
- `signedPayloadHash` 应改为记录真实 digest 或明确记录“签名 payload digest”，不再使用 JSON sha256 占位

**Risks**
- RPC 不可用导致 signer 降级失败
- 本地 typed-data 定义与合约 typehash 不一致

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand signing`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- signing 相关单测通过
- 至少有一组固定向量可恢复出配置 signer 地址
- 同一 recipient 在链上 nonce 不变时，服务端签名 nonce 与合约一致

### Milestone 3 — Eligibility recheck, audit persistence, and API surface
**Goal**
- 在最终 endpoint 上完成 eligibility 重验、审计持久化和安全边界

**Affected files/modules**
- `apps/server/src/modules/signing/signing.controller.ts`
- `apps/server/src/modules/signing/services/signing.service.ts`
- `apps/server/src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts`
- `apps/server/src/modules/signing/services/signing.service.spec.ts`

**Implementation notes**
- 最终 endpoint 必须再次校验：
  - recipient == authenticated wallet
  - eligibility status 允许签名
  - request chainId / contractAddress 在配置白名单内
- 将签名结果审计化：
  - `signedNonce`
  - `expiresAt`
  - `digest`
  - `issuedAt`
- 明确 preview endpoint 的后续命运：
  - 保留为调试接口并标注 deprecated，或
  - 直接切换为最终 signer endpoint
- 本 milestone 不要求 DApp 全量接线，但 shared surface 必须已具备前端消费能力

**Risks**
- endpoint 兼容策略不清，会让 DApp 调错接口
- 审计字段写入与签名结果不一致

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand signing`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test --match-path test/NFTSignature.t.sol`

**Expected outputs**
- 全量 server test 通过
- 现有 NFTSignature 合约测试继续通过
- endpoint 返回的 payload 可被合约接受，不因 nonce 或 digest 不匹配而失败

## 10. Approval Checkpoint
- 这是 `Critical` 任务，涉及授权签名与 NFT mint 权限
- 必须在 plan 审批后再进入实现

## 11. Rollback / Recovery Notes
- 如果 signer 配置错误，优先关闭 endpoint，而不是继续返回无效签名
- signer key 若暴露，需立即轮换配置并同步更新合约 `referralSigner`
- 如上线中发现 nonce 口径错误，禁止继续签发，先修复链上 nonce 对齐逻辑
- 遗留 `referralNonce` 字段本阶段不删除，以减少 blast radius；如后续废弃，应单独开 schema 清理任务

## 12. Final Verification Checklist
- [ ] server 不再使用数据库 nonce 作为签名权威
- [ ] signer 读取链上 `referralNonces(recipient)`
- [ ] payload / digest / signature 与 NFTSale 合约完全对齐
- [ ] recipient、chainId、contractAddress 均经过安全校验
- [ ] eligibility 在签名前重新校验
- [ ] 审计记录保存真实 digest / nonce / expiry
- [ ] common build 通过
- [ ] server build 通过
- [ ] signing tests 通过
- [ ] NFTSignature contract tests 通过

## 13. Approval Request
请审批 `Phase7.1-Referral-Mint-Signer-Service`；通过后再开始实现。
