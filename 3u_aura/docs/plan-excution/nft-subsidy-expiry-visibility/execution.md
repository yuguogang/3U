# Execution Log

## 2026-03-25
- Created task plan after reproducing that `NFT #2 / epoch #1` remained visible as claimable in DApp while chain reverted with `EpochDeadlinePassed(1)`.
- Confirmed on-chain:
  - `Settlement.claimPurchasedSubsidy(1, 2)` reverts with `EpochDeadlinePassed(1)`.
  - Claim deadline for epoch `#1` is earlier than current fork-anvil block timestamp.
- Confirmed DB state:
  - `NftSubsidyClaim(epochNo=1, tokenId=2)` remains `PENDING`.
  - `NftSubsidyClaim(epochNo=2, tokenId=2)` is `CLAIMED`.
- Approved and implemented fix.

### Code changes
- Updated [apps/server/src/modules/claims/services/claims-read.service.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claims-read.service.ts)
  - Injected `PurchasedNftChainRepository`.
  - Added `resolveNftSubsidyClaims(...)`.
  - For NFT subsidy rows whose local status is still `PENDING`, claims read now loads published subsidy epochs from chain and maps rows to `VOIDED` when `claimDeadline <= now`.
- Updated [apps/server/src/modules/claims/services/claims-read.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/claims-read.service.spec.ts)
  - Added regression coverage for one expired epoch and one still-valid epoch.
  - Hardened default mocks for `listMerkleClaimsForUser`.

### Commands run
- `rg -n "NftSubsidyClaim|claimDeadline|EpochDeadlinePassed|NFT subsidy|NFT 补贴|claimable|expired|Claims" apps/server/src apps/dapp/src packages/common | head -n 200`
- `cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 "claimPurchasedSubsidy(uint256,uint256)" 1 2 --from 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url http://127.0.0.1:18545`
- `cast block latest --rpc-url http://127.0.0.1:18545 | rg -n "timestamp|number"`
- `pnpm --dir apps/server test -- claims-read.service.spec.ts purchased-nft-sync.service.spec.ts`
- `rm -rf apps/server/dist`
- `pnpm --dir apps/server build`

### Verification results
- Chain revert reason confirmed as `EpochDeadlinePassed(1)` for `epoch #1 / tokenId 2`.
- Current block timestamp confirmed later than the epoch #1 claim deadline.
- Targeted server tests passed:
  - `2/2` suites passed
  - `7/7` tests passed
- `pnpm --dir apps/server build` passed after clearing stale `dist/`.

### Outcome
- Expired NFT subsidy rows are no longer exposed to dapp as claimable `PENDING`.
- Existing dapp logic will now render the row as non-claimable using `VOIDED`, and claims summary / badge will stop counting it as claimable.
