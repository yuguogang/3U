# Execution

## Status
Completed with verification notes.

## Completed At
2026-03-12 12:33:10 +0800

## Summary
- 完成了 promotion 剩余三条关键闭环：推广型 NFT 最终 signer/mint、check-in 真实链上 payment verification seam、claim 成功后的 server sync-back。
- promotion chain 相关默认值已统一切到 `chainId = 97` 的测试链配置口径，server 和 dapp 都不再把 `56` 写死在主流程默认值上。
- promotion 阶段的本地验证链路已闭环；但本阶段没有执行真实 `chainId = 97` 远程 RPC dry-run、testnet 广播或部署后联调。

## Implemented Work

### 1. Referral NFT Final Mint Closure
- 扩展 shared model / validator：
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/promotion.ts)
- DApp 新增最终 signer 调用并真正执行 `mintNFTByReferral(...)`：
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/promotion.ts)
  - [promotion.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/promotion.query.ts)
  - [nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
- promotion contract defaults 切到 `97`：
  - [promotion-contracts.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/promotion-contracts.ts)
- 页面文案同步修正，不再把 referral NFT 描述成 preview-only。

### 2. Promotion Chain Runtime And `97` Config Alignment
- server 新增统一 promotion chain runtime client：
  - [promotion-chain-client.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/services/promotion-chain-client.service.ts)
- 相关配置项补齐并统一默认到 `97`：
  - [config.types.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.types.ts)
  - [config.configuration.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts)
- `SharedDomainModule` 现在显式依赖 `ConfigModule`，不再隐式假设全局注入：
  - [shared-domain.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/shared-domain.module.ts)
- signer / merkle 相关服务改用统一 runtime config：
  - [signing-nonce.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/repositories/signing-nonce.repository.ts)
  - [signing.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/services/signing.service.ts)
  - [merkle-draft.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/merkle/services/merkle-draft.service.ts)

### 3. Check-in On-Chain Payment Verification Seam
- 新增基于 receipt + ERC20 `Transfer` log 的即时查链验证：
  - [payment-verification.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/repositories/payment-verification.repository.ts)
  - [payment-verification.repository.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/repositories/payment-verification.repository.spec.ts)
- `PaymentService.prepareSubmittedCheckin()` 改为先过 policy，再过真实链上验证：
  - [payment.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/services/payment.service.ts)
  - [payment-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/payment/engines/payment-policy.engine.ts)
- check-in 主写路径保持“事务外验链，事务内落库”不变：
  - [checkin-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.ts)
  - [checkin.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/checkin.controller.ts)
  - [checkin-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/engines/checkin-policy.engine.ts)

### 4. Claim Sync-Back And Idempotent Server Writeback
- shared request/response contract 新增 claim sync：
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/promotion.ts)
- server 新增链上 claim 验证与幂等回写服务：
  - [claim-sync-request.dto.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/dto/claim-sync-request.dto.ts)
  - [claim-sync-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/claim-sync-chain.repository.ts)
  - [claim-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claim-sync.service.ts)
  - [claims.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/controllers/claims.controller.ts)
- 相关 repository 补充 sync 所需的 query / update：
  - [claim-record.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/claim-record.repository.ts)
  - [nft-subsidy-claim.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts)
  - [weekly-reward.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/repositories/weekly-reward.repository.ts)
- DApp claims 页面改成 receipt 成功后触发 server sync，不再只依赖 local submitted marker：
  - [claims.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/claims.ts)
  - [claims.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/claims.query.ts)
  - [claims-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx)

### 5. Supporting Fixes For Verification Closure
- check-in 相关 strict typing / test doubles 补齐，保证目标范围 eslint 与全量 server tests 通过：
  - [checkin-application.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/checkin/services/checkin-application.service.spec.ts)
  - [aura-domain.module.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/aura-domain.module.spec.ts)
- DApp 说明文案同步刷新：
  - [checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
  - [dashboard-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx)

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand payment
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec prettier --write src/modules/checkin/checkin.controller.ts src/modules/checkin/checkin.module.ts src/modules/checkin/engines/checkin-policy.engine.ts src/modules/checkin/services/checkin-application.service.ts src/modules/checkin/services/checkin-application.service.spec.ts src/modules/payment/engines/payment-policy.engine.ts src/modules/payment/services/payment.service.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint src/modules/checkin/**/*.ts src/modules/payment/**/*.ts src/configuration/*.ts
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand checkin
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand claims
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand
cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test
```

## Verification Results
- `packages/common` `pnpm run build`: passed
- `apps/server` targeted `payment` test: passed, `1` suite / `2` tests
- `apps/server` targeted `eslint`: passed
  - 保留 `checkin-policy.engine.spec.ts` 的 `2` 条 `no-unsafe-argument` warning，没有 error
- `apps/server` targeted `checkin` test: passed, `2` suites / `6` tests
- `apps/server` targeted `claims` test: passed, `1` suite / `5` tests
- `apps/server` `pnpm run build`: passed
- `apps/server` `pnpm test -- --runInBand`: passed, `20` suites / `53` tests
- `apps/dapp` `pnpm run lint`: passed
- `apps/dapp` `pnpm run typecheck`: passed
- `apps/dapp` `pnpm run build`: passed
  - 产出路由：
    - `/`
    - `/checkin`
    - `/claims`
    - `/nft`
    - `/rewards`
    - `/team`
- `apps/contracts` `forge test`: passed, `33` tests全部通过

## Deviations And Fixes
- `apps/server` 目标范围 eslint 初次执行失败。
  - Reason: `checkin/payment` 新增验链 seam 后，服务返回类型和测试 double 的类型精度不够，触发了 `no-unsafe-*` 和 `prettier` error。
  - Fix: 补显式 return type、generic、typed mock，并统一格式化。
- `apps/server` 全量测试初次执行失败于 [aura-domain.module.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/aura-domain.module.spec.ts)。
  - Reason: `PromotionChainClientService` 新增了 `ConfigService` 依赖，但 [shared-domain.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/shared/shared-domain.module.ts) 没有显式导入 `ConfigModule`。
  - Fix: `SharedDomainModule` 显式导入 `ConfigModule`，测试同时提供 stub config。
- 本阶段把 promotion 默认链切到 `97`，但没有执行真实远程 testnet dry-run。
  - Reason: 当前任务聚焦代码闭环与本地验证，没有部署地址注入、RPC 凭据校验或广播脚本执行。
  - Outcome: `97` 的代码路径和配置边界已固定；真实测试网联调仍需在提供环境变量后单独执行。

## Closure Note
- `Phase2` 中“尚未接入真实 RPC / USDT 合约事件解析”的缺口，已在本 phase 通过即时查链 verification seam 收口。
- `Phase7.1` 中“DApp 仍需后续消费 final signer payload”的缺口，已在本 phase 收口。
- `Phase9` 中“preview-only referral NFT”和“claim local submitted marker”两项缺口，已在本 phase 收口。

## Residual Notes
- 当前仍按你确认的业务口径使用“自动资格签名”；没有引入 referral NFT 人工审批流，也没有 admin console。
- `apps/dapp` build 仍会输出 RainbowKit / wagmi optional connector 的 `Module not found` warning；它不阻塞产物，但后续可以再清理 connector 集合。
- 本 phase 不替代 `Phase12`，也没有完成主网上线前的安全、运维、发布流程。
