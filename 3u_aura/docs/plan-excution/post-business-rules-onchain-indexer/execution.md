# Post Business Rules Onchain Indexer Execution Log

## Status

- Created on `2026-04-06`
- Current state: `planned`
- Priority note: execute only after the current business-rules change set is completed and approved

## Notes

- This task is intentionally deferred behind the current business-rules work.
- No implementation, schema mutation, migration, or rollout work has started yet.
- The plan for this task lives at:
  - [plan.md](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/post-business-rules-onchain-indexer/plan.md)

## Research Summary

- `check-in / PaymentReceipt` currently relies on user-submitted `txHash` plus immediate on-chain receipt verification, so its primary weakness is repair / reconciliation coverage, not base truth-source ambiguity.
- `PURCHASED NFT -> NftHolding -> NftSubsidyClaim` currently relies too much on wallet-triggered sync and DB projection, while the subsidy contract ultimately validates current on-chain owner.
- The current `30`-supply environment allows temporary `ownerOf(1..30)` repair tactics, but that approach is not suitable once purchased supply becomes unbounded.
- A server-owned indexer worker with persistent cursors, raw event storage, and replayable projections is the recommended long-term direction.

## Commands Run During Planning

- `sed -n '1,220p' /Users/ygg/.codex/skills/claude-skills-collection/skills/create-plan/SKILL.md`
- `ls docs/plan-excution | tail -n 30`
- `find . -name AGENTS.md -print`
- `sed -n '1,220p' docs/plan-excution/admin-settlement-and-subsidy-center/plan.md`
- `sed -n '1,220p' docs/plan-excution/testnet-mockusdt-weekly-root-and-subsidy-release/plan.md`
- `rg -n "syncStateForUser\\(|syncPurchaseForUser\\(|PurchasedNftSyncService|claims.purchased-nft.sync|sync purchased|purchase.*sync|purchased nft sync" apps/server/src apps/dapp/src`
- `sed -n '1,260p' apps/server/src/modules/claims/controllers/claims.controller.ts`
- `sed -n '1,260p' apps/dapp/src/queries/claims.query.ts`
- `rg -n "claimPurchasedSubsidy|ownerOf|isPurchasedNFT|subsidyEpochs|eligiblePurchasedSupply|maxEligibleTokenId" apps/contracts/src/Settlement.sol apps/contracts/src/FounderNFT.sol`
- `sed -n '1,260p' apps/contracts/src/Settlement.sol`
- `rg -n "PaymentReceipt|checkin|receipt|sync.*claim|sync.*nft|listPurchasedMintsForOwner|ownerOf\\(|purchasedMinted|LotteryTicket|WeeklyEpoch|TreeClosure|Placement|Referral" apps/server/src`
- `sed -n '1,280p' apps/server/src/modules/checkin/services/checkin-application.service.ts`
- `sed -n '1,300p' apps/server/src/modules/payment/services/payment.service.ts`
- `sed -n '1,220p' apps/server/src/modules/payment/repositories/payment-verification.repository.ts`

## Pending Before Execution

1. Finish current business-rules implementation and validation.
2. Reconfirm whether the next release truly removes the purchased NFT cap.
3. Reconfirm whether indexer persistence should land in existing server DB schema or a dedicated schema/module namespace.
4. Obtain explicit approval before any implementation starts.
