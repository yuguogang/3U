# Fork Anvil CI Critical Flows — Execution Log

## Status

- Approved and implemented
- CI automation completed
- Final `nft / referral / weekly / claims` groups all passing

## Scope Executed

- `admin` only tested through API and contract orchestration, not page clicks
- `fork-anvil + fresh contracts + reset DB + server` used as the default automated harness
- Four CI groups finalized:
  - `nft`
  - `referral`
  - `weekly`
  - `claims`

## Implemented Changes

### CI Coverage And Grouping

- Updated [run.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run.mjs) with:
  - `referral-gift`
  - `weekly-settlement`
- Updated [run-all.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/run-all.mjs) to group flows as:
  - `nft: ['nft-purchase']`
  - `referral: ['referral-gift', 'referral-derived']`
  - `weekly: ['weekly-settlement']`
  - `claims: ['subsidy-claim', 'merkle-claim', 'merkle-lottery-claim']`

### Server/API CI Helpers

- Expanded [server.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/server.mjs) with real business-flow helpers for:
  - purchased NFT refresh
  - referral approve / gift / signature / sync
  - weekly settlement draft / publish
  - reward publication preview / execute
  - subsidy overview / preview
  - lottery result reveal

### Referral CI Refactor

- Reworked [referral-mint.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/referral-mint.flow.mjs) to stop using ad hoc DB patching
- Moved referral CI onto real admin/server business flows
- Added multi-mint same-wallet coverage

### Weekly CI Refactor

- Added [weekly-settlement.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/weekly-settlement.flow.mjs)
- Extracted shared weekly fixture logic into [weekly-fixture.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/weekly-fixture.mjs)
- Refactored [weekly-merkle-claim-flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/weekly-merkle-claim-flow.mjs) to use admin/server APIs instead of old UAT-only materialize/publish scripts

### Subsidy / Purchased Projection Gate

- Enhanced [subsidy-claim.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/subsidy-claim.flow.mjs) to assert:
  - subsidy publish preview is blocked before purchased sync when projection gap exists
  - subsidy publish preview clears after purchased sync
  - on-chain publish, claim, and sync all complete successfully

### Harness Stability Fixes

- Fixed [anvil.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/anvil.mjs) to use `process.execPath` instead of bare `node`
- Fixed [promotion-service-lib.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/promotion-service-lib.mjs) for local `pnpm/node` resolution and forced server rebuilds
- Made [20260327_refresh_token_table/migration.sql](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/migrations/20260327_refresh_token_table/migration.sql) idempotent for repeated fork DB resets
- Stabilized [deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs) with timeout, retry, and `forge --slow`

## Bugs Found And Fixed During Execution

### 1. Referral post-mint summary stayed non-`MINTED`

- Symptom:
  - `referral-derived` failed after successful on-chain mint and sync
- Root cause:
  - eligibility summary prioritization still returned non-minted states after grants were consumed
- Fix:
  - updated [nft-eligibility-policy.engine.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/engines/nft-eligibility-policy.engine.ts) so `mintedReferralCount > 0` resolves to `MINTED`
  - added regression test in [nft-eligibility-application.service.spec.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/nft-eligibility/services/nft-eligibility-application.service.spec.ts)

### 2. Weekly fixture no longer matched current ticket refresh logic

- Symptom:
  - `weekly-settlement` failed because seeded participants did not become qualified
- Root cause:
  - fixture seeded `countedCheckinDays` but current refresh logic depends on `checkinTimes`
- Fix:
  - updated [seed-weekly-fork-fixtures.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/seed-weekly-fork-fixtures.mjs)
  - shared and reused the corrected setup through [weekly-fixture.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/lib/weekly-fixture.mjs)

### 3. Weekly reward funding failed due to missing gas on `rewardFunder`

- Symptom:
  - weekly publish / deposit path failed during funding
- Root cause:
  - fork fixture had token balance but not native gas for the funding address
- Fix:
  - weekly flows now top up `rewardFunder` gas before deposit via existing contract helper

### 4. Ranking merkle CI had an undefined `ENV`

- Symptom:
  - `merkle-claim` crashed in the error path
- Root cause:
  - [merkle-claim.flow.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/ci/commands/merkle-claim.flow.mjs) referenced `ENV` without defining it
- Fix:
  - added `const ENV = 'fork-anvil';`

### 5. Lottery merkle claims were not visible through `/claims/me`

- Symptom:
  - `merkle-lottery-claim` could not discover a claimant even after root publish and activation
- Root cause:
  - lottery claims are hidden until reveal
  - previous flow also relied on non-deterministic participants
- Fix:
  - seeded known candidate wallets only
  - boosted their seeded `checkinTimes`
  - added explicit lottery reveal before fetching claims
  - corrected draft response assertions to current admin API shape

### 6. Fresh contract deploy intermittently hung with `nonce too low`

- Symptom:
  - `run-all` intermittently stalled around `DeploySettlementClaim`
- Root cause:
  - forge broadcast timing / nonce race during repeated fresh deployments on fork anvil
- Fix:
  - added timeout, retry, and `--slow` to [deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs)

## Commands Run

### Syntax / Static Sanity

```bash
/usr/local/bin/node --check scripts/ci/commands/referral-mint.flow.mjs
/usr/local/bin/node --check scripts/ci/commands/weekly-settlement.flow.mjs
/usr/local/bin/node --check scripts/ci/commands/subsidy-claim.flow.mjs
/usr/local/bin/node --check scripts/ci/lib/server.mjs
/usr/local/bin/node --check scripts/ci/run.mjs
/usr/local/bin/node --check scripts/ci/run-all.mjs
/usr/local/bin/node --check scripts/ci/lib/anvil.mjs
/usr/local/bin/node --check scripts/uat/promotion-service-lib.mjs
/usr/local/bin/node --check scripts/promotion-env/deploy-contract-suite.mjs
/usr/local/bin/node --check scripts/ci/lib/harness.mjs
/usr/local/bin/node --check scripts/uat/seed-weekly-fork-fixtures.mjs
/usr/local/bin/node --check scripts/ci/lib/weekly-merkle-claim-flow.mjs
/usr/local/bin/node --check scripts/ci/lib/weekly-fixture.mjs
```

### Targeted Regression Test

```bash
PATH=/usr/local/bin:$PATH /usr/local/bin/pnpm --dir apps/server exec jest src/modules/nft-eligibility/services/nft-eligibility-application.service.spec.ts --runInBand
```

### Individual Flow Verification

```bash
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs referral-gift
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs referral-derived
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs weekly-settlement
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs subsidy-claim
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs merkle-claim
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs merkle-lottery-claim
```

### Final Full Suite

```bash
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run-all.mjs
```

## Verification Results

### Targeted Test

- `nft-eligibility-application.service.spec.ts`: PASS
- `6` tests passed

### Individual CI Flows

- `referral-gift`: PASS
- `referral-derived`: PASS
- `weekly-settlement`: PASS
- `subsidy-claim`: PASS
- `merkle-claim`: PASS
- `merkle-lottery-claim`: PASS

### Final `run-all`

- Exit code: `0`
- Result: PASS

### Group-Level Outcome

- `nft`
  - NFT purchase succeeds on-chain
  - purchased sync creates holdings
  - duplicate sync stays idempotent
- `referral`
  - gift flow succeeds
  - same wallet can mint multiple referral NFTs
  - derived eligibility flow succeeds end-to-end
- `weekly`
  - `50/50` pool split verified
  - happy path verified
  - dual-lane behavior verified:
    - lottery can roll over
    - ranking still settles in the same epoch
- `claims`
  - subsidy claim verified end-to-end
  - ranking merkle claim verified end-to-end
  - lottery merkle claim verified end-to-end after reveal

## Deviations From Original Plan

- Weekly claim verification was refactored more deeply than originally planned because old UAT materialize/publish scripts had drifted from current admin/server API behavior
- Harness stability work extended into deployment and migration idempotency because repeated fork-anvil resets exposed environment-level flakes that would otherwise keep CI unstable

## Residual Risks

- This CI lane intentionally validates `admin` through API only, not browser clicks
- Formal background `indexer worker` is still not implemented; these flows rely on explicit sync / reconcile paths rather than a continuous chain indexer
- Full repo-wide typecheck was not used as the primary gate for this task; the critical-path validation here is the automated fork-anvil CI flow itself plus the targeted regression test

## Completion Summary

- Requested automation mode achieved
- User did not need to manually participate in the test execution
- All four requested CI groups now pass in automated `fork-anvil` mode
