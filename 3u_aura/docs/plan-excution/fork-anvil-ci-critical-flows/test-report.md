# Fork Anvil CI Critical Flows — Test Report

## Objective

验证 `fork-anvil + fresh contracts + reset DB + server` 这条自动化链路，确保以下四组关键业务流全部通过：

- `nft`
- `referral`
- `weekly`
- `claims`

本次测试按要求仅验证 `admin` API 与链上编排，不测试页面点击路径。

## Environment

- Workspace: `/Users/ygg/vs/ai/3U/3u_aura`
- Mode: fully automated
- Admin coverage: API only
- Chain environment: `fork-anvil`
- App orchestration: contracts + server + DB reset + fresh fixture setup

## Coverage Matrix

| Group | Flow | Coverage |
| --- | --- | --- |
| `nft` | `nft-purchase` | on-chain purchase, backend sync, idempotent resync |
| `referral` | `referral-gift` | admin gift, multi-mint same wallet, sync, replay rejection |
| `referral` | `referral-derived` | checkin/tree growth, approval, signature, mint, sync |
| `weekly` | `weekly-settlement` | epoch sync, draft, publish, funding, root publish, activate |
| `weekly` | `weekly-settlement` | dual-lane behavior: lottery rollover does not cancel ranking |
| `claims` | `subsidy-claim` | projection gate, publish subsidy, claim, duplicate protection |
| `claims` | `merkle-claim` | ranking merkle publish, activate, claim, duplicate protection |
| `claims` | `merkle-lottery-claim` | lottery reveal, claim discovery, claim, duplicate protection |

## Results

### NFT

- NFT purchase succeeded on-chain
- Purchased holding synced into backend projection
- Duplicate purchased sync remained idempotent
- Result: PASS

### Referral

#### Gift / Multi-Mint

- First gift issued successfully
- First mint and sync succeeded
- Replay mint rejected as expected
- Second gift issued successfully to the same wallet
- Second mint and sync succeeded
- Final eligibility summary correctly resolved to `MINTED`
- On-chain referral NFT balance reflected multiple mints for the same wallet

#### Derived Eligibility

- Weekly fixture drove checkin and tree growth into derived eligibility
- Admin approval succeeded
- Signature issuance succeeded
- On-chain mint succeeded
- Referral sync succeeded
- Final eligibility summary correctly resolved to `MINTED`

- Result: PASS

### Weekly

#### Happy Path

- `epoch sync` moved both lanes into settlement
- Pool split verified at `50/50`
- Draft, publish, funding, root publish, and activate all succeeded
- Final lane state reached publishable / claimable end state

#### Decoupled Path

- Lottery lane rolled over when participation was insufficient
- Ranking lane still settled in the same epoch
- Root publish and activate still completed for the ranking lane
- Verified the original coupling bug is no longer present

- Result: PASS

### Claims

#### Subsidy Claim

- Subsidy preview correctly blocked before purchased projection was repaired
- Purchased refresh removed projection gap
- Subsidy publish succeeded
- On-chain claim succeeded
- Duplicate on-chain claim rejected
- Duplicate claim sync remained idempotent

#### Ranking Merkle Claim

- Draft/publish/root/activate sequence succeeded
- Claimant was found through backend claim surface
- On-chain claim succeeded
- Duplicate protections behaved correctly

#### Lottery Merkle Claim

- Deterministic participant set was seeded
- Lottery result reveal executed before reading claim surface
- Claimant was found successfully
- On-chain claim succeeded
- Duplicate protections behaved correctly

- Result: PASS

## Bugs Found During Testing

1. Referral post-mint summary did not transition to `MINTED`
   - Fixed in eligibility summary policy and covered by regression test.

2. Weekly seeded fixtures no longer produced qualified tickets
   - Fixed by seeding `checkinTimes`, not only `countedCheckinDays`.

3. Weekly funding step failed due to missing gas on `rewardFunder`
   - Fixed by funding native gas in flow setup.

4. Ranking merkle flow referenced undefined `ENV`
   - Fixed in CI command.

5. Lottery claims remained invisible until reveal
   - Fixed by explicitly revealing before querying `/claims/me`.

6. Fresh fork contract deploy intermittently failed with nonce issues
   - Fixed with deploy timeout, retry, and `forge --slow`.

## Commands Used For Final Verification

```bash
PATH=/usr/local/bin:$PATH /usr/local/bin/pnpm --dir apps/server exec jest src/modules/nft-eligibility/services/nft-eligibility-application.service.spec.ts --runInBand
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs referral-gift
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs referral-derived
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs weekly-settlement
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs subsidy-claim
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs merkle-claim
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run.mjs merkle-lottery-claim
PATH=/usr/local/bin:$PATH /usr/local/bin/node scripts/ci/run-all.mjs
```

## Final Outcome

- `nft`: PASS
- `referral`: PASS
- `weekly`: PASS
- `claims`: PASS
- final `run-all`: PASS

## Residual Notes

- This report covers API-level and chain-level automation, not browser click testing
- Continuous background indexer coverage is still a future task; current automation validates explicit sync/reconcile flows
