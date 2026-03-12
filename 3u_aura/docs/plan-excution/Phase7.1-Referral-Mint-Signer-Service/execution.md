# Execution

## Status
Completed.

## Summary
- 新增最终 signer endpoint：`POST /api/v1/signing/referral-mint-signature`
- 保留 `referral-mint-preview`，但改成只读 preview，不再把 preview 误记为已签发
- signer nonce 权威切换为链上 `NFTSale.referralNonces(recipient)`
- EIP712 digest/signature 改为和 `NFTSale.hashReferralMint()` 一致
- eligibility 审计落库改为记录真实 `digest / nonce / expiresAt`

## Files Changed
- `packages/common/src/models/promotion.ts`
- `packages/common/src/validators/promotion.ts`
- `apps/server/src/configuration/config.types.ts`
- `apps/server/src/configuration/config.configuration.ts`
- `apps/server/src/modules/signing/signing.controller.ts`
- `apps/server/src/modules/signing/signing.module.ts`
- `apps/server/src/modules/signing/engines/eip712-payload.engine.ts`
- `apps/server/src/modules/signing/engines/eip712-payload.engine.spec.ts`
- `apps/server/src/modules/signing/repositories/signing-nonce.repository.ts`
- `apps/server/src/modules/signing/services/signing.service.ts`
- `apps/server/src/modules/signing/services/signing.service.spec.ts`
- `apps/server/src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts`

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test --match-path test/NFTSignature.t.sol
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand signing
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint --fix src/modules/signing/**/*.ts src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts src/configuration/config.types.ts src/configuration/config.configuration.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint src/modules/signing/**/*.ts src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts src/configuration/config.types.ts src/configuration/config.configuration.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
```

## Verification Results
- `packages/common` build: passed
- `apps/contracts` `forge test --match-path test/NFTSignature.t.sol`: passed, `8/8` tests
- `apps/server` signing tests: passed, `2` suites / `7` tests
- `apps/server` targeted eslint: passed after `--fix`
- `apps/server` full test: passed, `18` suites / `46` tests
- `apps/server` build: passed

## Deviations and Fixes
- 初版把 `ConfigService` 直接注入到 `SigningService` 后，`AuraDomainModule` 测试报依赖注入错误；修复方式是在 `SigningModule` 显式引入 `ConfigModule`
- 初版 `normalizePrivateKey()` 为满足 `Hex` 返回值做了过度简化，导致 `nest build` 类型报错；后续改为显式归一化后返回 `Hex`
- 旧的 `SigningNonceRepository` 原本依赖数据库递增 `referralNonce`；本阶段没有删除 schema 字段，只是停止在 signer 路径中使用它，以减少 blast radius
- preview endpoint 保留为兼容接口，但不再写 `SIGNED` 状态；真正的审计写入只发生在 final signature endpoint

## Notes
- 新增配置键：
  - `PROMOTION_NFT_SALE_ADDRESS`
  - `PROMOTION_REFERRAL_RPC_URL`
  - `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY`
  - `PROMOTION_REFERRAL_SIGNATURE_TTL_SECONDS`
- 当前 task 没有接 DApp 最终 mint 按钮，前端仍需后续消费新的 final signer payload

## Historical Follow-up
- 上述 DApp 消费 final signer payload 的缺口已在 [Phase9.1 execution](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9.1-Promotion-Closure-Integration/execution.md#L1) 中收口；本文件保留的是 `Phase7.1` 完成当时的历史状态。
