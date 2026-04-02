# Business Rules: Check-In, Purchase, Referral, Team Visibility Execution

## Status

- Created: 2026-04-02
- State: Implemented and verified

## Notes

- 本任务覆盖 `3 / 4 / 13 / 14 / 15` 五条业务规则。
- 当前阶段仅完成代码边界调研与计划编写，尚未进入实现。

## Initial Findings

1. `3` 当前允许同日多次签到，但抽奖资格仍按 `countedCheckinDays >= 7` 判定，`ticketCount` 当前只按 `0/1` 写入。
2. `4` 当前购买型 NFT 的全局购买上限由合约 [FounderNFT.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/FounderNFT.sol) 中的固定常量控制。
3. `13` 后端已按“直推 `10%` + 间推 `5%`”发放奖励，但 DApp 邀请文案未完整体现。
4. `14` 现有数据库已存左右区/小区业绩，但 admin 暂无“团队长总业绩”专用视图。
5. `15` 当前只有 referral NFT 审批 mint 流程，没有独立“赠送 referral mint 资格”入口；但现有链上 `mintNFTByReferral(...)` 可继续复用。

## Planning Research

- 已检查：
  - `checkin / lottery / rewards / referral / nft-eligibility / signing / admin / tree`
  - `FounderNFT / NFTSale`
  - `apps/dapp` 的 `checkin / nft / team` 页面与多语言文案
- 已并行使用 explorer 做：
  - DApp 触点定位
  - 业务规则是否触及合约 / schema 的边界判断

## Execution Log

### 2026-04-02 - Referral gift flow implementation

- Implemented a separate admin gift path for referral NFT eligibility while keeping the existing approval -> mint flow intact.
- Key code changes:
  - Added `POST /admin/ops/nft-eligibility/gift` in `apps/server/src/modules/admin/admin-ops.controller.ts`.
  - Added a local server-only DTO in `apps/server/src/modules/admin/dto/admin-gift-referral-nft-request.dto.ts`.
  - Added `giftReferralNft(...)` in `apps/server/src/modules/admin/services/admin-ops.service.ts` with audit logging action `admin.ops.nft-eligibility.gift`.
  - Added `giftReferralMintEligibility(...)` in `apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.ts`.
  - Updated `apps/server/src/modules/nft-eligibility/engines/nft-eligibility-policy.engine.ts` so `APPROVED` eligibility is preserved even when the current thresholds are not met, which is required for gifted users to keep mint access.
- No Prisma schema change was required for this iteration.

### 2026-04-02 - Check-in lottery ticket accrual refactor

- Reworked weekly lottery qualification from `countedCheckinDays` to raw `checkinTimes`, using `floor(checkinTimes / 7)` as the effective ticket count.
- Added count-based helpers in `apps/server/src/modules/lottery/engines/lottery-qualification.engine.ts`.
- Added `summarizeEpochCheckinTimes(...)` and `summarizeUserEpochCheckinTimes(...)` in `apps/server/src/modules/stats/repositories/stats.repository.ts`.
- Updated `apps/server/src/modules/lottery/services/lottery-ticket.service.ts` to:
  - expose `currentCheckinCount / currentTicketCount / checkinsPerTicket / checkinsUntilNextTicket`
  - persist multi-ticket counts into `LotteryTicket.ticketCount`
  - refresh qualification based on check-in count instead of counted days
  - aggregate reveal outcome from multiple ticket rewards for the same user
- Updated `apps/server/src/modules/lottery/repositories/lottery-ticket.repository.ts` to sum `ticketCount` for `participantCount` and `qualifiedTicketCount`.
- Updated `apps/server/src/modules/lottery/services/lottery-settlement.service.ts` to expand settlement entries by ticket count and to generate unique consolation distribution keys per losing ticket.
- Updated `apps/server/src/modules/rewards/services/rewards-read.service.ts` so weekly results can aggregate multiple lottery or consolation rewards for one wallet.
- Added/updated tests in:
  - `apps/server/src/modules/lottery/services/lottery-ticket.service.spec.ts`
  - `apps/server/src/modules/lottery/engines/lottery-payout.engine.spec.ts`

### 2026-04-02 - Admin overview + shared model alignment

- Added `teamLeaderCount` and `teamLeaderTotalPerformanceUsdt` to `packages/common/src/models/admin.ts`.
- Added new check-in lottery participation fields and multi-reward outcome fields to `packages/common/src/models/promotion.ts`.
- Added `AdminGiftReferralNftRequestSchema` to `packages/common/src/validators/admin.ts`.
- Rebuilt `packages/common/dist` via `unbuild` so `apps/server` and `apps/admin` resolve the new exports correctly.
- Updated `apps/server/src/modules/admin/repositories/admin-console.repository.ts` to compute team leader totals from existing `UserProfile.leftTeamVolume + rightTeamVolume`.

### 2026-04-02 - Contract / admin / dapp worker integration

- Integrated worker-delivered changes for:
  - contract purchased-cap removal in `apps/contracts`
  - admin frontend gift entry and team overview presentation in `apps/admin`
  - dapp check-in / nft / invite copy updates in `apps/dapp`
- Kept the existing one-wallet-one-referral rule and existing referral mint path intact.

### Verification

- `./node_modules/.bin/jest src/modules/nft-eligibility/services/nft-eligibility-application.service.spec.ts --runInBand`
- `./node_modules/.bin/jest src/modules/admin/services/admin-ops.service.spec.ts --runInBand`
- `./node_modules/.bin/jest src/modules/signing/services/signing.service.spec.ts --runInBand`
- `./node_modules/.bin/jest src/modules/nft-eligibility/services/nft-eligibility-application.service.spec.ts src/modules/admin/services/admin-ops.service.spec.ts src/modules/signing/services/signing.service.spec.ts src/modules/lottery/services/lottery-ticket.service.spec.ts src/modules/lottery/engines/lottery-payout.engine.spec.ts --runInBand`
- `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- `./node_modules/.bin/unbuild`
- `/usr/local/n/versions/node/24.13.0/bin/node apps/admin/node_modules/typescript/bin/tsc -p apps/admin/tsconfig.typecheck.json --noEmit`
- `/usr/local/n/versions/node/24.13.0/bin/node apps/dapp/node_modules/typescript/bin/tsc -p apps/dapp/tsconfig.json --noEmit`
- `forge test --match-contract 'FounderNFTTest|NFTSaleTest'`

### Result

- All targeted tests passed.
- Server TypeScript compilation passed.
- `packages/common` rebuilt successfully and exported the new shared schemas/models.
- Admin and DApp typechecks passed against the merged shared contract.
- Contract tests passed after removing the fixed purchased `30` cap.
- Gifted referral users can now remain `APPROVED` and proceed through the existing signing and mint flow without introducing a new chain-side mint mechanism.
- Weekly lottery qualification now uses check-in counts and true multi-ticket weighting instead of the old “7 counted days = 1 ticket” boolean path.
