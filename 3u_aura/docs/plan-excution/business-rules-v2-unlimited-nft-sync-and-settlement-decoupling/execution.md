# Execution Log: Business Rules V2

## Status

- Planning drafted
- No implementation started
- Awaiting user approval

## Planning Notes

- 重新核对了当前 contracts / server / dapp / admin 代码，确认旧任务中的两个关键假设已经失效：
  - `FounderNFT` 仍保留总量、referral 总量与单钱包 referral 限制
  - `WeeklyEpoch` 仍用整期 `CANCELLED` 语义把 ranking lane 一起取消
- 重新确认了 `admin` 的 `Settlement` / `Subsidy` 页面已经存在，因此新任务不需要从零起页面，而是要扩展已有能力
- 重新确认了 purchased NFT / subsidy 的同步问题目前仍主要来自链上 owner 与 DB projection 失配，而不是单纯前端刷新问题

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
```

## Verification Results

- Planning-only research completed
- No code changes outside this task directory
- No runtime / tests executed yet

## Pending

- User approval on the new task scope and assumptions
- Implementation after approval
