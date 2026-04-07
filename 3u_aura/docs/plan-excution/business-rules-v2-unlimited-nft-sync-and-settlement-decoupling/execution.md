# Execution Log: Business Rules V2

## Status

- In progress
- Milestone 2 contract + dapp baseline completed
- Milestone 3 referral grant schema + signing/sync baseline completed
- Weekly settlement dual-lane baseline completed
- Purchased NFT background refresh baseline completed

## Planning Notes

- 重新核对了当前 contracts / server / dapp / admin 代码，确认旧任务中的两个关键假设已经失效：
  - `FounderNFT` 仍保留总量、referral 总量与单钱包 referral 限制
  - `WeeklyEpoch` 仍用整期 `CANCELLED` 语义把 ranking lane 一起取消
- 重新确认了 `admin` 的 `Settlement` / `Subsidy` 页面已经存在，因此新任务不需要从零起页面，而是要扩展已有能力
- 重新确认了 purchased NFT / subsidy 的同步问题目前仍主要来自链上 owner 与 DB projection 失配，而不是单纯前端刷新问题

## Implementation Progress

### 2026-04-06 — Unlimited NFT baseline slice

- 已移除 [FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol) 中的以下旧限制：
  - `MAX_TOTAL_SUPPLY`
  - `MAX_REFERRAL_SUPPLY`
  - `hasReferralNFT`
  - purchased / referral mint 对总量与单钱包 referral 的 revert gate
- 已把 [NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol) 的读取接口从 `getRemainingNFT()` 改为 `getNFTMintStats()`，避免无限供应语义下继续暴露“剩余库存”接口
- 已同步更新 contract tests：
  - [FounderNFT.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/FounderNFT.t.sol)
  - [NFTSale.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/NFTSale.t.sol)
  - [NFTSignature.t.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/test/NFTSignature.t.sol)
- 已同步更新 DApp：
  - [promotion-contracts.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/promotion-contracts.ts)
  - [use-promotion-contract-state.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/hooks/use-promotion-contract-state.ts)
  - [nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
  - 多语言文案新增 `nft.purchased.minted`
- 已同步更新手工/CI/E2E 读取脚本：
  - [scripts/ci/lib/contracts.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/contracts.mjs)
  - [scripts/ci/commands/nft-purchase.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/nft-purchase.flow.mjs)
  - [apps/e2e/phase94/src/nft-purchase.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/e2e/phase94/src/nft-purchase.ts)

### 2026-04-06 — Referral multi-grant baseline slice

- 已为 `server schema` 新增 [NftReferralGrant](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma) 模型与对应 migration：
  - [20260406_referral_grants_unlimited_multi_issue/migration.sql](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/migrations/20260406_referral_grants_unlimited_multi_issue/migration.sql)
- 设计上把“资格快照”和“grant 生命周期”拆开：
  - [NftReferralEligibility](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma) 继续承载单用户资格快照与 summary status
  - [NftReferralGrant](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma) 承载每一张 referral/gift 的审批、签名、过期、mint 生命周期
- 已重写 eligibility repository / policy / application service：
  - [nft-eligibility.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts)
  - [nft-eligibility-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/engines/nft-eligibility-policy.engine.ts)
  - [nft-eligibility-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts)
- 新逻辑要点：
  - qualified approval 与 manual gift 都会创建新的 `grant`
  - 同一钱包可累计多个 claimable referral mint
  - DApp / signing 不再依赖单钱包单 `MINTED` 语义，而是依赖 `claimableMintCount`
  - 保留 `NftReferralEligibility.status` 作为 admin 列表和老接口的 summary status，减少读接口爆炸式改动
- 已扩展 shared model：
  - [aura.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/enums/aura.ts) 新增 `NftReferralGrantSource` / `NftReferralGrantStatus`
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts) 为 `NftEligibilityView` 新增 `claimableMintCount` / `mintedReferralCount`
  - [admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts) 为 admin eligibility item 预留同名字段
- 已把签名与 referral sync 链路接到 grant 语义：
  - [referral-nft-chain.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/referral-nft-chain.repository.ts) 开始读 `ReferralNFTMinted` 事件里的 `nonce` / `digest`
  - [referral-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/referral-nft-sync.service.ts) 会用 `payloadHash` / `signedNonce` 对应具体 grant
  - `markMinted` 还加了一个兼容回填分支，避免老环境里“先 minted、后引入 grant 模型”的历史数据直接失配
- 已同步更新 DApp 与 admin 的最小消费口径：
  - [dashboard-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx)
  - [nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
  - [nft-eligibility-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/lists/components/nft-eligibility-page.tsx)
  - DApp 现在展示真实 `claimable referral mint count`，不再写死成 `1/0`

## Notes / Deviations

- 本轮先完成“无限 NFT”最底层的 contract + dapp 口径校正，没有在同一批次里直接推进 `server schema` 的 referral issuance 重构
- 原因是当前 `NftReferralEligibility @@unique([userId])` 和 weekly settlement 单状态模型都属于高风险 schema 级调整，适合在 contract baseline 落稳后单独推进
- DApp 当前“claimable referral count”仍然是基于现有 eligibility 状态计算的 `1/0` 口径；等 referral issuance 模型重构后需要再统一
- 上面第三条已在本批次完成修正：DApp 已改成消费 `claimableMintCount`
- `NftReferralEligibility` 这一轮没有直接删除原来的 `approved/signed/minted` 字段，而是把它保留成 summary / latest-* 快照
  - 这是一个有意保守的过渡方案，用来降低 admin 列表、overview 计数和旧接口的改动面
  - 真正的多卡真相现在在新增的 `NftReferralGrant` 表
- 本轮还没有把 admin eligibility 列表彻底升级成“按 grant 展示”，目前仍是用户级 summary view

### 2026-04-06 — Weekly settlement dual-lane baseline slice

- 已为 [WeeklyEpoch](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma) 新增双轨字段，并补上 migration：
  - `lotteryStatus`
  - `rankingStatus`
  - `lotteryRolloverUsdt`
  - `rankingRolloverUsdt`
  - [20260406_weekly_epoch_dual_lane_settlement/migration.sql](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/migrations/20260406_weekly_epoch_dual_lane_settlement/migration.sql)
- 已把 [weekly-epoch-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/engines/weekly-epoch-policy.engine.ts) 的奖池切分改为 `50 / 50`
- 已重写 [weekly-epoch-application.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/services/weekly-epoch-application.service.ts) 的 prepare 逻辑：
  - lottery lane 参与人数不足时，只把 `lotteryPool` 滚到下一期
  - ranking lane 继续保留在本期进入 `CALCULATING`
  - `calculationRemark` 改成记录 lane 级标记，例如 `LOTTERY_ROLLOVER_TO:*` / `RANKING_READY`
  - 整期 `status` 不再因为 lottery 不达门槛就直接 `CANCELLED`
- 已扩展 [weekly-epoch.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/epoch/repositories/weekly-epoch.repository.ts)：
  - create 时初始化双轨状态
  - `finalizeEpochPreparation()` 接收 lane status
  - `incrementRolloverPools()` 取代旧的 prepared-pool 直灌方式
  - `publishMerkleRoot()` 开始同步 lane status
- 已把奖励链路改成按 lane 处理：
  - [lottery-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-settlement.service.ts) 在 `lotteryStatus = CANCELLED` 时跳过抽奖 draft，只保留 rollover 语义
  - [rewards.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards.service.ts) 在 publish 阶段不再对已取消的 lottery lane 二次 rollover
  - ranking rollover 改成进入下一期的 `rankingRolloverUsdt`
  - activate 前校验也改成 lane-aware
- 已把读模型改成“lottery lane 单独 rolled over”：
  - [lottery-ticket.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/lottery/services/lottery-ticket.service.ts)
  - [rewards-read.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards-read.service.ts)
  - 现在 `myLottery.resultStatus = ROLLED_OVER` 取决于 `epoch.lotteryStatus === CANCELLED`，不再要求整期 `epoch.status === CANCELLED`
- 已把 admin settlement 视图补成兼容双轨与旧数据：
  - [admin-settlement.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-settlement.service.ts)
  - [packages/common/src/models/admin.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/admin.ts)
- `selectedEpoch` 现在会返回 `lotteryStatus/rankingStatus` 和两条 lane rollover；缺字段的老 epoch 仍会 fallback 到旧 `status`

### 2026-04-06 — Purchased NFT background refresh baseline slice

- 已把 [purchased-nft-sync.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts) 的 `syncStateForUser()` 改成正式对外返回可消费的 refresh 视图：
  - `activePurchasedTokenIds`
  - `holdingsCreated`
  - `claimsCreated`
  - `claimsUpdated`
  - `publishedSubsidyEpochs`
- 已新增无 `txHash` 的后台刷新入口：
  - [claims.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/controllers/claims.controller.ts)
  - `POST /api/v1/claims/purchased-nft/refresh`
- 已把 `GET /api/v1/claims/me` 收口成 best-effort purchased holding refresh + claim list：
  - 如果链上刷新失败，会记录 warning，但不会直接把 claims 页面打挂
  - 这是一个有意的 UX 优先保护，用来缓解 RPC 波动导致的“刷新就 500”
- 已为 DApp 加入登录后的背景刷新触发：
  - [api/claims.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/claims.ts)
  - [claims.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/claims.query.ts)
  - [wallet-button.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx)
- 当前行为是：
  - 用户完成认证后，`WalletButton` 会按钱包地址只触发一次 background purchased refresh
  - refresh 成功后会统一 invalidate `profile / claims / rewards`
  - 这样 `hasPurchasedNft`、补贴 claim 投影和奖励页能更快靠近链上真实状态，不再完全依赖“刚买完卡那笔 txHash 同步”

## Commands Run During Planning

```bash
rg -n "MAX_TOTAL_SUPPLY|MAX_REFERRAL_SUPPLY|hasReferralNFT|buyNFT|mintReferralNFT" apps/contracts/src/FounderNFT.sol apps/contracts/src/NFTSale.sol
rg -n "lotteryPoolAtomic|rankingPoolAtomic|minParticipants|minimumParticipants|CANCELLED|rolloverUsdt|CALCULATING" apps/server/src/modules/epoch apps/server/src/modules/rewards apps/server/prisma/schema.prisma
rg -n "syncPurchasedNft|NftHolding|NftSubsidyClaim|gift|REFERRAL" apps/dapp apps/server packages/common apps/admin
sed -n '600,760p' apps/server/prisma/schema.prisma
sed -n '90,170p' apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts
sed -n '100,180p' apps/contracts/src/FounderNFT.sol
sed -n '110,170p' apps/contracts/src/NFTSale.sol
rg -n "Settlement|Subsidy|weekly settlement" apps/admin/src
sed -n '1,240p' apps/admin/src/components/layout/admin-shell.tsx
sed -n '1,260p' apps/admin/src/features/subsidy/components/subsidy-center-page.tsx
cast sig "getNFTMintStats()"
/Users/ygg/.foundry/bin/forge test --match-contract 'FounderNFTTest|NFTSaleTest|NFTSignatureTest'
export PATH=/Users/ygg/.nvm/versions/node/v20.19.6/bin:$PATH; /Users/ygg/.nvm/versions/node/v20.19.6/bin/node apps/dapp/node_modules/typescript/bin/tsc -p apps/dapp/tsconfig.json --noEmit
sed -n '620,760p' apps/server/prisma/schema.prisma
sed -n '1,260p' apps/server/src/modules/nft-eligibility/repositories/nft-eligibility.repository.ts
sed -n '1,260p' apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts
sed -n '1,260p' apps/server/src/modules/nft-eligibility/engines/nft-eligibility-policy.engine.ts
sed -n '1,260p' apps/server/src/modules/signing/services/signing.service.ts
sed -n '1,260p' apps/server/src/modules/claims/repositories/referral-nft-chain.repository.ts
sed -n '1,260p' apps/server/src/modules/claims/services/referral-nft-sync.service.ts
sed -n '1,260p' apps/admin/src/features/lists/components/nft-eligibility-page.tsx
sed -n '1,220p' apps/dapp/src/components/pages/dashboard-page.tsx
sed -n '250,620p' apps/dapp/src/components/pages/nft-page.tsx
export PATH=/Users/ygg/.nvm/versions/node/v20.19.6/bin:$PWD/apps/server/node_modules/.bin:$PATH; apps/server/node_modules/.bin/prisma generate --schema apps/server/prisma/schema.prisma
export PATH=/Users/ygg/.nvm/versions/node/v20.19.6/bin:$PATH; node_modules/.bin/unbuild
export PATH=/Users/ygg/.nvm/versions/node/v20.19.6/bin:$PATH; node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
export PATH=/Users/ygg/.nvm/versions/node/v20.19.6/bin:$PATH; node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit
export PATH=/Users/ygg/.nvm/versions/node/v20.19.6/bin:$PATH; node_modules/.bin/jest src/modules/nft-eligibility/services/nft-eligibility-application.service.spec.ts src/modules/signing/services/signing.service.spec.ts src/modules/claims/services/referral-nft-sync.service.spec.ts --runInBand
/usr/local/bin/node apps/server/node_modules/prisma/build/index.js generate --schema apps/server/prisma/schema.prisma
PATH="/usr/local/bin:/Users/ygg/vs/ai/3U/3u_aura/apps/server/node_modules/.bin:$PATH" /usr/local/bin/node apps/server/node_modules/prisma/build/index.js generate --schema apps/server/prisma/schema.prisma
/usr/local/bin/node apps/server/node_modules/typescript/bin/tsc -p apps/server/tsconfig.json --noEmit
/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/epoch/engines/weekly-epoch-policy.engine.spec.ts src/modules/epoch/services/weekly-epoch-application.service.spec.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/services/reward-publication.service.spec.ts --runInBand
/usr/local/bin/node packages/common/node_modules/unbuild/bin/unbuild.mjs
PATH="/usr/local/bin:$PATH" ./node_modules/.bin/unbuild
/usr/local/bin/node apps/admin/node_modules/typescript/bin/tsc -p apps/admin/tsconfig.typecheck.json --noEmit
/usr/local/bin/node apps/dapp/node_modules/typescript/bin/tsc -p apps/dapp/tsconfig.json --noEmit
/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/admin/services/admin-settlement.service.spec.ts src/modules/epoch/engines/weekly-epoch-policy.engine.spec.ts src/modules/epoch/services/weekly-epoch-application.service.spec.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/services/reward-publication.service.spec.ts --runInBand
/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/claims/services/purchased-nft-sync.service.spec.ts src/modules/admin/services/admin-settlement.service.spec.ts src/modules/epoch/engines/weekly-epoch-policy.engine.spec.ts src/modules/epoch/services/weekly-epoch-application.service.spec.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/services/reward-publication.service.spec.ts --runInBand
```

## Verification Results

- `forge test --match-contract 'FounderNFTTest|NFTSaleTest|NFTSignatureTest'`
  - `21` tests passed
  - foundry 仍有本机 cache 写入 warning，但不影响测试结果
- `node apps/dapp/node_modules/typescript/bin/tsc -p apps/dapp/tsconfig.json --noEmit`
  - passed
- `apps/server/node_modules/.bin/prisma generate --schema apps/server/prisma/schema.prisma`
  - passed after补上 `NftReferralGrant <-> NftReferralEligibility.grants` 反向 relation
  - 首次尝试还暴露出 `prisma-json-types-generator` 不在默认 PATH，需要把 `apps/server/node_modules/.bin` 显式加入 PATH
- `packages/common/node_modules/.bin/unbuild`
  - passed
- `apps/server/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`
  - passed
- `apps/admin/node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit`
  - passed
- `apps/dapp/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`
  - passed
- `apps/server/node_modules/.bin/jest ...nft-eligibility... signing... referral-nft-sync... --runInBand`
  - `3` suites passed, `12` tests passed
  - `ts-jest` 对生成的 Prisma `.js` 文件给了 `allowJs` warning，但不影响测试通过
- `/usr/local/bin/node apps/server/node_modules/prisma/build/index.js generate --schema apps/server/prisma/schema.prisma`
  - 第一次失败，原因是 `node` 与 `prisma-json-types-generator` 不在默认 PATH
  - 加上 `PATH="/usr/local/bin:/Users/ygg/vs/ai/3U/3u_aura/apps/server/node_modules/.bin:$PATH"` 后通过
- `/usr/local/bin/node apps/server/node_modules/typescript/bin/tsc -p apps/server/tsconfig.json --noEmit`
  - passed
- `PATH="/usr/local/bin:$PATH" ./node_modules/.bin/unbuild` in `packages/common`
  - passed
- `/usr/local/bin/node apps/admin/node_modules/typescript/bin/tsc -p apps/admin/tsconfig.typecheck.json --noEmit`
  - passed
- `/usr/local/bin/node apps/dapp/node_modules/typescript/bin/tsc -p apps/dapp/tsconfig.json --noEmit`
  - passed
- `/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/admin/services/admin-settlement.service.spec.ts src/modules/epoch/engines/weekly-epoch-policy.engine.spec.ts src/modules/epoch/services/weekly-epoch-application.service.spec.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/services/reward-publication.service.spec.ts --runInBand` in `apps/server`
  - `5` suites passed, `21` tests passed
  - `ts-jest` 仍会对 Prisma 生成的 `.js` 文件给出 `allowJs` warning，但不影响通过
- `/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/claims/services/purchased-nft-sync.service.spec.ts src/modules/admin/services/admin-settlement.service.spec.ts src/modules/epoch/engines/weekly-epoch-policy.engine.spec.ts src/modules/epoch/services/weekly-epoch-application.service.spec.ts src/modules/rewards/services/rewards.service.spec.ts src/modules/rewards/services/reward-publication.service.spec.ts --runInBand` in `apps/server`
  - `6` suites passed, `25` tests passed
  - 覆盖了新加入的 purchased refresh 返回值语义
- `pnpm/corepack` 无法直接用于验证
  - 原因 1：shell 默认环境没有 `pnpm` / `corepack`
  - 原因 2：沙箱不能访问 npm registry 下载 `pnpm`
  - 因此本轮改用本机绝对路径的 `node`、本地 `typescript` 与 `forge`

## Pending

- Purchased/referral holding reconcile 过渡方案
- admin settlement/subsidy center 语义对齐
- DApp 团队页、购买记录、同步体验改造

## 2026-04-06 — DApp purchase activity / sync UX / team slimming

### Completed

- 为 `ClientUser` 增加最近购买型 NFT 记录视图，并在 profile API 中基于 `PaymentReceipt(NFT_PURCHASE)` 与 `NftHolding(PURCHASED)` 聚合最近购买记录，支持在 DApp 内展示 `1000 USDT` 扣款与对应 token 同步状态。
- `NFT` 页面增加：
  - 链上持仓 / 补贴同步中的说明 banner
  - 最近购买记录列表
  - 购买成功后更明确的“系统正在同步”反馈
  - 加载期不再直接用 `0` 覆盖已购/可领摘要
- `Team` 页面收掉一层重复左右区概览卡，并在 profile / tree 刷新时显示轻量同步提示。
- 顺手清理了 `Rewards` 页面里未使用的 `useMemo` 聚合结果，避免无效计算。

### Files Changed

- `packages/common/src/models/aura.ts`
- `apps/server/src/user/services/user.service.ts`
- `apps/dapp/src/hooks/use-promotion-contract-state.ts`
- `apps/dapp/src/lib/promotion-format.ts`
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/dapp/src/components/pages/rewards-page.tsx`
- `apps/dapp/messages/zh/common.json`
- `apps/dapp/messages/en/common.json`

### Commands

```bash
sed -n '1,240p' apps/dapp/src/hooks/use-promotion-contract-state.ts
sed -n '1,260p' apps/dapp/src/components/pages/team-page.tsx
sed -n '1,260p' apps/dapp/src/components/pages/rewards-page.tsx
sed -n '1,320p' apps/dapp/src/components/pages/claims-page.tsx
sed -n '1,340p' apps/dapp/src/components/pages/nft-page.tsx
rg -n "PaymentReceipt|purchase record|txHash|purchased-nft/refresh|claims/me|My Activity|activity" apps/dapp apps/server packages/common -g '!**/dist/**'
sed -n '1,260p' apps/dapp/src/queries/user.query.ts
sed -n '1,280p' apps/dapp/src/api/user.ts
sed -n '1,240p' apps/server/src/user/controllers/user.controller.ts
sed -n '1,300p' apps/server/src/user/services/user.service.ts
sed -n '1,220p' packages/common/src/models/aura.ts
sed -n '1,360p' packages/common/src/models/promotion.ts
sed -n '345,390p' apps/server/prisma/schema.prisma
sed -n '600,690p' apps/server/prisma/schema.prisma
sed -n '1,220p' apps/dapp/src/lib/promotion-format.ts
PATH="/usr/local/bin:$PATH" ./node_modules/.bin/unbuild
/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

### Verification Results

- `PATH="/usr/local/bin:$PATH" ./node_modules/.bin/unbuild` in `packages/common`
  - passed
- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` in `apps/dapp`
  - passed
- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` in `apps/server`
  - passed

### Notes

- 本轮没有新增 schema / migration，也没有新增链上步骤。
- 购买记录目前是 profile 附带的最近记录视图，属于“先让用户能稳定看到扣款记录”的最小实现，不是完整 activity feed。

## 2026-04-06 — Claims / Rewards refresh-state polish

### Completed

- `Rewards` 页面增加顶部轻量刷新状态条，在 profile / rewards / latest weekly / claims 任一数据源处于 `isFetching` 时，明确告诉用户系统仍在刷新奖励与结算状态。
- `Claims` 页面增加领取状态刷新提示，覆盖：
  - claims query 后台刷新
  - claim sync mutation
  - merkle / subsidy 写链中
  - receipt 等待确认中
- 中英双语文案同步补齐，减少“页面内容一部分先出、一部分后出但没有说明”的体感。

### Files Changed

- `apps/dapp/src/components/pages/rewards-page.tsx`
- `apps/dapp/src/components/pages/claims-page.tsx`
- `apps/dapp/messages/zh/common.json`
- `apps/dapp/messages/en/common.json`

### Commands

```bash
sed -n '1,260p' apps/dapp/src/queries/claims.query.ts
sed -n '1,260p' apps/dapp/src/queries/rewards.query.ts
sed -n '1,260p' apps/dapp/src/queries/promotion.query.ts
sed -n '1,220p' apps/dapp/src/components/pages/claims/claims-summary.tsx
sed -n '1,220p' apps/dapp/src/components/pages/claims/claims-loading.tsx
/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

### Verification Results

- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` in `apps/dapp`
  - passed

## 2026-04-06 — Admin subsidy projection gap / release gate

### Completed

- `AdminSettlementService` 现在会把链上购买型 NFT 总量、数据库已投影持仓数量、以及两者之间的 gap 一起返回给 subsidy center 和 publish preview。
- 已发布补贴 epoch 卡片补充了 `projectedClaimCount` / `projectionGapCount`，方便直接看“这期链上应有多少补贴 claim、库里已投影多少”。
- subsidy publish preview 增加 release gate：当数据库购买型 NFT 投影数量落后于链上 `purchasedSupply` 时，直接给出 blocker，避免继续发布补贴后再出现用户“有卡但没补贴”。
- admin subsidy 页面同步展示了链上总量、DB 已投影总量和 projection gap，并把此前错误使用的 `MetricCard` tone 收敛为现有组件支持的色板。

### Files Changed

- `packages/common/src/models/admin.ts`
- `apps/server/src/modules/claims/repositories/nft-holding.repository.ts`
- `apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts`
- `apps/server/src/modules/admin/services/admin-settlement.service.ts`
- `apps/server/src/modules/admin/services/admin-settlement.service.spec.ts`
- `apps/admin/src/features/subsidy/components/subsidy-center-page.tsx`

### Commands

```bash
rg -n "chainPurchasedSupply|dbActivePurchasedSupply|dbProjectionGapCount|projectedClaimCount|projectionGapCount" packages/common/src packages/common/dist apps/server apps/admin
sed -n '1,260p' packages/common/src/models/admin.ts
sed -n '1,320p' apps/admin/src/features/subsidy/components/subsidy-center-page.tsx
PATH="/usr/local/bin:$PATH" ./node_modules/.bin/unbuild
/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/admin/services/admin-settlement.service.spec.ts --runInBand
/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit
```

### Verification Results

- `PATH="/usr/local/bin:$PATH" ./node_modules/.bin/unbuild` in `packages/common`
  - passed
- `/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/admin/services/admin-settlement.service.spec.ts --runInBand` in `apps/server`
  - `1` suite passed, `3` tests passed
- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` in `apps/server`
  - passed
- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit` in `apps/admin`
  - passed

### Notes

- 这一轮仍然是“发布前 gate + 可视化差异”，不是正式常驻 indexer worker。
- 目的先是避免在 DB 持仓落后链上时继续发布补贴，降低已知同步缺口的业务伤害面。

## 2026-04-06 — Weekly settlement lane visibility in admin

### Completed

- `Weekly Settlement` 页面补上了 lane 级展示，不再只给出一个笼统的 epoch status。
- 顶部概览现在会同时显示：
  - `lottery lane`
  - `ranking lane`
  - 两条 lane 的 pool / rollover
- 页面增加了单独的 `Lane Outcome` 区块，明确告诉运营：
  - 抽奖参与不足时，只会影响 lottery lane
  - ranking lane 仍按当期小区业绩增量结算
- 这样 admin 展示口径终于和当前已落地的双轨结算语义一致，不再把“lottery rollover”误读成“整期 rewards 都取消”。

### Files Changed

- `apps/admin/src/features/settlement/components/weekly-settlement-page.tsx`

### Commands

```bash
sed -n '1,360p' apps/admin/src/features/settlement/components/weekly-settlement-page.tsx
sed -n '460,860p' apps/server/src/modules/admin/services/admin-settlement.service.ts
rg -n "lotteryStatus|rankingStatus|lotteryRolloverUsdt|rankingRolloverUsdt" apps/server/src/modules/admin apps/admin/src packages/common/src
/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit
```

### Verification Results

- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit` in `apps/admin`
  - passed

### Notes

- 这一步主要是 admin 语义对齐，没有新增 server schema 或 API。
- 运营现在可以直接在页面上区分：
  - `lottery lane rolled over`
  - `ranking lane settled / root posted`
  而不需要再靠人工理解单一 `epoch.status`。

## 2026-04-06 — Purchased NFT reconcile backfill script

### Completed

- 新增了可重复执行的 purchased holding / subsidy projection backfill 脚本：
  - [reconcile-purchased-nft-state.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/reconcile-purchased-nft-state.ts)
- 这条脚本复用现有 `PurchasedNftSyncService.syncStateForUser()`，支持按以下范围重投影：
  - `--wallet <address>`
  - `--user-id <id>`
  - `--purchase-receipt-users`
  - `--all-users`
- 脚本会汇总：
  - `processedUsers`
  - `mutatedUsers`
  - `holdingsCreated`
  - `claimsCreated`
  - `claimsUpdated`
  并输出每个用户的 purchased token / 补贴投影结果，作为 testnet 修复和补贴发布前的过渡工具。

### Files Changed

- `apps/server/scripts/reconcile-purchased-nft-state.ts`

### Commands

```bash
ls apps/server/scripts
sed -n '1,320p' apps/server/src/modules/claims/services/purchased-nft-sync.service.ts
sed -n '1,320p' apps/server/src/modules/claims/repositories/purchased-nft-chain.repository.ts
sed -n '1,320p' apps/server/src/modules/claims/repositories/nft-holding.repository.ts
sed -n '1,260p' apps/server/scripts/uat/sync-purchased-nft-state.ts
/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit
```

### Verification Results

- `/usr/local/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` in `apps/server`
  - passed

### Notes

- 这是完整 indexer 落地前的可执行 backfill 工具，不替代常驻索引。
- 当前脚本优先服务“购买事件 buyer 与当前 DB 投影不一致”的补投影场景；更彻底的 owner-level reconcile 仍属于后续 indexer / release gate 规划范围。

## 2026-04-06 — Purchased NFT reconcile wrapper and runbook updates

### Completed

- 为 purchased NFT backfill 脚本补了统一的 UAT wrapper：
  - `scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs`
- 这个 wrapper 会通过 `scripts/promotion-env/run-with-env.mjs` 注入目标环境配置，统一转发到：
  - `apps/server/scripts/reconcile-purchased-nft-state.ts`
- 更新了两份 testnet runbook，把 purchased projection gap 修复纳入正式操作路径：
  - `docs/runbooks/testnet-mockusdt-online-repair.md`
  - `docs/runbooks/testnet-mockusdt-remote-handoff.md`
- 这样线上测试环境在遇到“买了卡但补贴 claim 缺失 / DB 持仓落后链上”时，有明确的：
  - 单钱包修复命令
  - 批量修复命令
  - admin subsidy center 复核步骤

### Files Changed

- `scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs`
- `docs/runbooks/testnet-mockusdt-online-repair.md`
- `docs/runbooks/testnet-mockusdt-remote-handoff.md`

### Commands

```bash
sed -n '1,220p' scripts/uat/reconcile-weekly-fork-consolation-aura.mjs
sed -n '1,220p' scripts/promotion-env/run-with-env.mjs
sed -n '1,220p' scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs
sed -n '1,240p' docs/runbooks/testnet-mockusdt-online-repair.md
sed -n '1,200p' docs/runbooks/testnet-mockusdt-remote-handoff.md
/usr/local/bin/node --check scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs
```

### Verification Results

- `/usr/local/bin/node --check scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs`
  - passed

### Notes

- 这一步没有新增业务逻辑，只是把既有 purchased reconcile 能力变成了更可执行的 operator 路径。
- runbook 里明确要求在 subsidy publish 或大范围通知前，先对齐：
  - `Chain Purchased Supply`
  - `DB Active Purchased`
  - `Projection Gap`
