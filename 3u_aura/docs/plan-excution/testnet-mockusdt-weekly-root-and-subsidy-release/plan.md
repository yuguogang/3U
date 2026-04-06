# Testnet MockUSDT Weekly Root And Subsidy Release Plan

## 1. Objective
Safely complete the remaining live release steps for `testnet-mockusdt` after the repaired `epoch #1` weekly settlement draft/publish:

- publish the repaired weekly Merkle root on-chain
- activate weekly claims in the database so users can claim lottery/ranking USDT
- publish the purchased NFT subsidy epoch on-chain
- synchronize and verify purchased NFT subsidy projections in the server/database

This plan treats all actions as critical because they affect claimability, rewards, and user-visible balances.

## 2. Scope
In scope:

- `testnet-mockusdt` only
- `epoch #1` weekly promotion reward release
- Merkle reward funding and root publication preflight
- weekly reward activation after root publication
- purchased NFT subsidy epoch publication preflight
- purchased NFT subsidy publication and post-publication projection verification
- real command logging in `execution.md`

## 3. Out Of Scope
Out of scope:

- deploying the new settlement/subsidy admin center
- changing weekly reward business rules again
- schema changes or Prisma migrations
- contract upgrades or redeployments
- modifying production/release environments
- fixing unrelated admin UI bugs

## 4. Assumptions
- The repaired weekly reward state remains as recorded in the previous execution log:
  - `epoch #1` status is `CALCULATING`
  - draft/publish already completed in DB
  - repaired Merkle root is `0x399b247ee8a9de8d7dec37bf6d340fe767aae328d42c115460b627508d3dcf06`
- Remote Postgres for `testnet-mockusdt` is reachable and still uses:
  - host `47.236.39.50`
  - port `5432`
  - db `3u_aura_testnet_mockusdt`
  - user `postgres`
- Remote Redis is reachable and authenticates with password `change-me`.
- On-chain actions require the correct role wallets:
  - weekly root publication: `rootPublisher` or owner
  - subsidy publication: `settlementPublisher` or owner
- If private keys for those live wallets are not available in the repo, the chain-signing step must be executed by the operator manually, and Codex will continue with preflight, calldata/command preparation, and post-tx verification.

## 5. Architecture Impact
- No intended code-path architecture change is required for the live release itself.
- The work touches four control planes:
  - remote database state
  - remote Redis-backed server runtime
  - on-chain `MerkleClaim`
  - on-chain `Settlement`
- The highest-risk operations are immutable contract writes:
  - `MerkleClaim.publishRoot(...)`
  - `Settlement.publishSubsidyEpoch(...)`
- Once written on-chain, these actions are not cleanly reversible, so every write must follow explicit preflight verification.

## 6. Milestones

### Milestone 1: Weekly Reward Release Preflight
Goal:
Confirm `epoch #1` is still ready for root publication and activation, and verify funding/role prerequisites before any irreversible chain write.

Affected files/modules:
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol`
- `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
- `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-epoch1-ticket-recovery/execution.md`

Implementation notes:
- Re-read the repaired weekly epoch, claim rows, and reward rows.
- Verify on-chain:
  - current `epochRootById(1)` is empty
  - `rewardFunder` matches manifest expectation
  - distributor USDT balance and allowance are sufficient for total weekly USDT amount
- Decide whether reward funding deposit is already satisfied or whether `depositRewardsFromFunder(...)` must be called before `publishRoot`.

Risks:
- Wrong root published irreversibly
- Wrong funder/allowance configuration blocks activation
- Publishing root before funding/DB consistency checks

Verification commands:
- `cast call` against `MerkleClaim.epochRootById`
- `cast call` against `MerkleClaim.rewardFunder`
- `cast call` against token `balanceOf` / `allowance`
- read-only DB checks for `WeeklyEpoch`, `WeeklyReward`, `ClaimRecord`

Expected outputs:
- explicit preflight report with:
  - root readiness
  - funding readiness
  - activation blockers or clear-to-proceed decision

### Milestone 2: Weekly Root Publication And Activation
Goal:
Publish the repaired weekly Merkle root on-chain and activate weekly reward claims in the database.

Affected files/modules:
- `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/MerkleClaim.sol`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/settle-weekly-epoch-rewards.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/services/admin-ops.service.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/rewards/services/reward-publication.service.ts`

Implementation notes:
- If required, fund the Merkle distributor first.
- Publish root for `epochNo = 1` with the repaired root.
- Activate weekly rewards using the existing activation path:
  - deployed admin/API route if available
  - otherwise the existing server/script path with the long-transaction helper already used for remote execution
- Verify that:
  - DB `WeeklyEpoch.status` moves to `ROOT_POSTED`
  - DB `merkleRoot` and `rewardJsonUri` are populated
  - related `ClaimRecord` and `WeeklyReward` rows become `CLAIMABLE`

Risks:
- root publication succeeds but DB activation fails
- activation attempted before on-chain root/funding is ready
- lingering Redis auth/runtime issues during remote script execution

Verification commands:
- `cast send` or equivalent wallet action for `publishRoot`
- `cast call` to confirm on-chain root
- admin reward publication preview/execute or server activation script
- SQL verification of claim/reward statuses

Expected outputs:
- transaction hash for root publication
- activated weekly epoch and claimable claim rows

### Milestone 3: Purchased NFT Subsidy Preflight And Sync Readiness
Goal:
Confirm subsidy publication parameters and close the purchased NFT state gap before publishing the subsidy epoch.

Affected files/modules:
- `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/uat/sync-purchased-nft-state.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`

Implementation notes:
- Verify `Settlement.subsidyEpochs(epochNo)` is still unpublished for the target subsidy epoch.
- Verify on-chain purchased supply and DB holdings/projection status.
- Confirm subsidy amount and claim deadline to use.
- Verify settlement publisher wallet, token balance, and allowance are sufficient.
- If needed, run or adapt the purchased NFT sync path against the remote environment before/after publication.

Risks:
- publishing a wrong subsidy amount/deadline irreversibly
- mismatched on-chain purchased supply vs DB causing missing projected claims
- using the wrong subsidy epoch number

Verification commands:
- `cast call` against `Settlement.subsidyEpochs`
- `cast call` against `FounderNFT.purchasedMinted`
- read-only DB checks for `NftHolding`, `NftSubsidyClaim`, and subsidy `WeeklyEpoch`
- server sync script or equivalent service-backed command

Expected outputs:
- subsidy publication decision with explicit amount/deadline
- confirmed sync strategy for DB projection

### Milestone 4: Purchased NFT Subsidy Publication And Verification
Goal:
Publish the subsidy epoch on-chain and verify that projected subsidy claims become visible in the environment.

Affected files/modules:
- `/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/Settlement.sol`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/services/purchased-nft-sync.service.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts`

Implementation notes:
- Publish the subsidy epoch using the approved amount/deadline.
- Run purchased NFT sync/projection after publication.
- Verify:
  - on-chain subsidy epoch is published
  - DB has the corresponding `NFT_SUBSIDY` epoch
  - projected `NftSubsidyClaim` rows exist for eligible purchased holdings
- If practical and explicitly safe, verify one read-only end-to-end user claim view without consuming a claim.

Risks:
- published subsidy epoch cannot be edited
- DB projection may lag if sync is skipped or incomplete
- user holdings mismatch may under-project claims

Verification commands:
- `cast send` or equivalent wallet action for `publishSubsidyEpoch`
- `cast call` to verify published subsidy epoch
- DB queries for `NftSubsidyClaim`
- optional server/API verification of user claim visibility

Expected outputs:
- subsidy publish transaction hash
- verified projected subsidy claims in DB/user view

## 7. Approval Checkpoint
Do not execute live on-chain publication or DB activation steps until this plan is explicitly approved.

## 8. Rollback / Recovery Notes
- `publishRoot(...)` is effectively immutable for the epoch; there is no clean rollback after success.
- `publishSubsidyEpoch(...)` is also effectively immutable for the epoch; there is no clean rollback after success.
- Recovery options after a wrong on-chain publish are compensating actions only:
  - stop DB activation if root/subsidy was wrong
  - document the bad publish in `execution.md`
  - prepare a new corrective epoch/process instead of mutating chain history
- For DB-side activation issues:
  - pause after the failing step
  - inspect `WeeklyEpoch`, `ClaimRecord`, `WeeklyReward`, `NftSubsidyClaim`
  - only apply targeted recovery with auditable scripts/queries

## 9. Final Verification Checklist
- Weekly Merkle root matches the repaired draft root on-chain
- Merkle distributor funding is sufficient for weekly USDT rewards
- `epoch #1` weekly reward records are `CLAIMABLE`
- `epoch #1` DB status is correctly activated
- Subsidy epoch is published on-chain with the intended amount/deadline
- Purchased NFT holdings are synchronized for the target environment
- Subsidy claim projections exist in DB for eligible purchased NFTs
- All real commands, outputs, tx hashes, and deviations are recorded in `execution.md`
