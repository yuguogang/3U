# Execution

## Status
Completed

## Completed At
2026-03-12 10:49:17 +0800

## Summary
- 完成了 promotion MVP 的前端主路径：dashboard、check-in、team、rewards、nft、claims。
- 为 DApp 补了最小 server 只读面：真实 `user/profile`、用户 rewards feed、用户 claims feed。
- 接上了 Phase2/3.1/5/6/7/8 的真实接口与合约动作，而不是继续停留在 placeholder routes。
- 保留了一个明确边界：推广型 NFT 仍只能做 preview，不能做最终 mint，因为 backend 目前没有返回真正的签名 bytes。

## Implemented Work

### 1. Shared Contracts And Read Models
- 扩展 [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/promotion.ts)：
  - `PromotionRewardView`
  - `PromotionMerkleClaimView`
  - `PromotionNftSubsidyClaimView`
  - `PromotionClaimsView`
- 这些模型用于冻结 DApp 消费的 reward/claim 读接口，不再让页面自己拼 DB 字段。

### 2. Server Read-Only Support
- 修正 [user.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/user/controllers/user.controller.ts) 和 [user.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/user/services/user.service.ts)，让 `GET /api/v1/user/profile` 真正返回带 `profile` relation 的用户事实，而不是 JWT payload 快照。
- 新增 rewards 只读层：
  - [rewards.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/controllers/rewards.controller.ts)
  - [rewards-read.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/rewards-read.service.ts)
  - [weekly-reward.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/repositories/weekly-reward.repository.ts)
- 新增 claims 只读层：
  - [claims.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/controllers/claims.controller.ts)
  - [claims-read.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claims-read.service.ts)
  - [claim-record.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/claim-record.repository.ts)
  - [nft-subsidy-claim.repository.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts)
- 对应 module/index 已同步更新：
  - [rewards.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/rewards.module.ts)
  - [claims.module.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/claims.module.ts)

### 3. DApp API / Query / Contract Adapters
- 新增 promotion API/query 层：
  - [promotion.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/promotion.ts)
  - [promotion.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/promotion.query.ts)
- 新增 rewards/claims API/query 层：
  - [rewards.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/rewards.ts)
  - [claims.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/claims.ts)
  - [rewards.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/rewards.query.ts)
  - [claims.query.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/claims.query.ts)
- 新增合约与格式化适配层：
  - [promotion-contracts.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/promotion-contracts.ts)
  - [promotion-format.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/promotion-format.ts)
  - [use-promotion-contract-state.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/hooks/use-promotion-contract-state.ts)

### 4. Promotion Pages
- 重写 dashboard：
  - [dashboard-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx)
  - 显示 profile、current epoch、pending placements、NFT eligibility 摘要
- 新增 check-in 页面：
  - [checkin-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx)
  - 走 `POST /api/v1/checkin` 提交 tx hash
- 新增 team 页面：
  - [team-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
  - 支持 inviter code 绑定、pending placement 列表、selectable slots 选择和 placement bind
- 新增 rewards 页面：
  - [rewards-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/rewards-page.tsx)
  - 展示 epoch 摘要、AURA totals、reward feed
- 新增 NFT 页面：
  - [nft-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/nft-page.tsx)
  - 接上购买型 NFT 的 approve/buy 动作
  - 接上推广型 NFT 的 eligibility + preview
- 新增 claims 页面：
  - [claims-page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx)
  - 直接消费 merkle proof rows 与 subsidy claim rows，并调用合约 claim
- 路由文件全部替换 placeholder：
  - [checkin/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/checkin/page.tsx)
  - [team/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/team/page.tsx)
  - [rewards/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/rewards/page.tsx)
  - [nft/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/nft/page.tsx)
  - [claims/page.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/claims/page.tsx)

## Deviations From Plan
- `Phase9` 原计划默认 server API 已基本稳定；实际执行发现 `GET /user/profile` 只能返回认证用户快照，DApp 无法展示累计统计，所以补了最小只读 server 支撑。这是 read-only 偏差，没有触碰任何结算、奖励、claim 写路径。
- `Milestone 3` 里“推广型 NFT 签名 mint”没有完全闭环。原因不是前端，而是现有 [signing.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/signing.controller.ts) 只返回 preview，不返回最终签名 bytes。前端因此明确落成 `preview-only` UX，而没有伪造或客户端生成签名。
- `Claims` 页面虽然已经能发起链上 claim，但当前 server 没有回写同步路径，链上成功后 server 状态会有延迟；因此 UI 增加了本地 `submitted` 标记，而不是自造一套新的 claim 状态机。
- `dapp` 仍然没有 `test` 脚本，本阶段验证仍以 `lint / typecheck / build` 为主。

## Commands Run
```bash
cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck
cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand
cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint
```

## Verification Results
- `packages/common` `pnpm run build`: passed
- `apps/server` `pnpm run build`: passed
- `apps/server` `pnpm test -- --runInBand`: passed
  - `17` suites / `41` tests
- `apps/dapp` `pnpm run lint`: passed
- `apps/dapp` `pnpm run typecheck`: passed
- `apps/dapp` `pnpm run build`: passed
  - routes emitted:
    - `/`
    - `/checkin`
    - `/team`
    - `/rewards`
    - `/nft`
    - `/claims`

## Residual Notes
- `apps/dapp` build 仍然会输出 RainbowKit / wagmi optional connector 的 `Module not found` warnings，来源还是 [web3-provider.tsx](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/providers/web3-provider.tsx) 当前把整套 connector 能力带进来了；这次没有继续清理 connector 集合。
- 推广型 NFT 最终 mint 仍依赖 server 返回真实签名 bytes。这是进入后续联调前必须补的后端项，不属于当前 DApp 可单独解决的问题。
- claim 成功后的 server 状态同步仍缺索引/回写路径；当前 UI 只能本地提示 tx 已提交或确认。

## Historical Follow-up
- 上述“推广型 NFT 最终 mint”和“claim 成功后 server 状态同步”两项缺口已在 [Phase9.1 execution](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9.1-Promotion-Closure-Integration/execution.md#L1) 中收口；本文件保留的是 `Phase9` 完成当时的历史状态。
