# Weekly Fork Scale Up - Support 20+ Eligible Participants

## 1. Objective

Extend `seed-weekly-fork-fixtures.mjs` to support **20+ eligible participants** for lottery full-bucket coverage and deterministic ranking validation. Currently limited to 12 participants, which blocks full-bucket lottery testing.

## 2. Scope

- Modify `scripts/uat/seed-weekly-fork-fixtures.mjs` to support 20+ participants
- Optionally update test specs to use increased participant count
- Verify tests pass with new scale

## 3. Out of Scope

- No contract changes
- No database schema changes
- No new test specs (reuse existing)
- No changes to core business logic

## 4. Assumptions

- Fork-anvil environment is functional
- Synthetic participants can be created via DB insert
- Ranking logic handles 10+ qualified candidates correctly

## 5. Current State

| Test | Status | Limitation |
|------|--------|------------|
| `lottery.spec.ts` | ✅ PASS | partial bucket (participantCount < 20) |
| `lottery-blocked.spec.ts` | ✅ PASS | marks < 20 as blocked |
| `ranking.spec.ts` | ✅ PASS | expects draftRewardCount === 10 |
| `ranking-blocked.spec.ts` | ✅ PASS | marks insufficient scale as blocked |

**Current seed limits** (`seed-weekly-fork-fixtures.mjs`):
- `syntheticParticipantCount`: max 7 (default 7)
- `participantWallets`: hardcoded `slice(0, 12)`
- `qualifiedRankingCount`: max 12 (default 12)

## 6. Target State

- Seed script supports **20+ synthetic participants**
- Lottery full-bucket test can achieve success (not blocked)
- Ranking test continues to pass with deterministic top10

## 7. Architecture Impact

| Module | Impact |
|--------|--------|
| `scripts/uat/seed-weekly-fork-fixtures.mjs` | Modify participant generation logic |
| `apps/e2e/phase94/tests/weekly-fork/*.spec.ts` | May need param updates |

## 8. Risks

- **Low**: Pure DB seed script modification
- **Low**: No financial logic changes

## 9. Milestones

### Milestone 1 — Extend Seed Script to 20+ Participants

**Goal**
- Remove 12-participant cap
- Support configurable syntheticParticipantCount up to 25

**Affected files/modules**
- `scripts/uat/seed-weekly-fork-fixtures.mjs`

**Implementation notes**
- Remove `slice(0, 12)` limitation on line ~321
- Increase default `syntheticParticipantCount` from 7 to 18 (to reach 20+ with existing wallets)
- Extend `qualifiedRankingCount` default to 15 for robust top10 testing

**Risks**
- None - this is a test fixture script

**Verification**
- commands:
  ```bash
  node scripts/uat/seed-weekly-fork-fixtures.mjs --help
  ```
- expected result: Shows support for participant count > 12

**Approval checkpoint**
- No - minor task

### Milestone 2 — Run Tests to Verify

**Goal**
- Verify lottery test can pass with 20+ participants
- Verify ranking test continues to pass

**Affected files/modules**
- `apps/e2e/phase94/tests/weekly-fork/lottery.spec.ts`
- `apps/e2e/phase94/tests/weekly-fork/ranking.spec.ts`

**Implementation notes**
- Run existing tests with new seed
- If lottery still blocked, increase syntheticParticipantCount further

**Risks**
- None - validation only

**Verification**
- commands:
  ```bash
  PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/lottery.spec.ts
  PROMOTION_ENV=fork-anvil pnpm --dir apps/e2e/phase94 exec playwright test tests/weekly-fork/ranking.spec.ts
  ```
- expected result: Tests pass

**Approval checkpoint**
- No - verification only

## 10. Rollback / Recovery Notes

```bash
# Rollback code changes
git checkout -- .

# Delete branch
git branch -D feature/weekly-fork-scale-up

# Reset fork DB if needed
node scripts/uat/reset-weekly-fork-db.mjs --env fork-anvil
```

## 11. Final Verification Checklist

- [ ] Seed script modified to support 20+ participants
- [ ] TypeScript compiles without errors
- [ ] lottery.spec.ts passes or shows improved coverage
- [ ] ranking.spec.ts continues to pass

## 12. Approval Request

This is a **Minor** task (local test fixture modification only). Proceeding with implementation.
