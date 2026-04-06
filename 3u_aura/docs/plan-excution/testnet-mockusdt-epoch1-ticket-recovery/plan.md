# Testnet MockUSDT Epoch #1 Ticket Recovery Plan

## 1. Objective

Recover `testnet-mockusdt` `epoch #1` so it can be settled under the intended "every 7 check-ins earns lottery qualification" business rule, instead of staying `CANCELLED` from the old live rule.

## 2. Scope

- Remote test database recovery for `3u_aura_testnet_mockusdt`
- Reverse the current `epoch #1` cancellation side effects
- Recompute / repair `LotteryTicket` eligibility for `2026-03-27` through `2026-04-02`
- Re-run weekly sync and, if eligible, weekly settlement for `epoch #1`
- Verify lottery and ranking settlement readiness after recovery

## 3. Out Of Scope

- Deploying new backend code to the online environment
- Changing old admin page validation bugs
- Changing contract code or redeploying contracts
- Production / non-testnet data changes

## 4. Assumptions

- This work targets only the online test environment database `3u_aura_testnet_mockusdt`.
- The intended recovery rule for `epoch #1` is based on raw `Checkin` count in the inclusive window `2026-03-27` to `2026-04-02`.
- Current live code did not apply the new ticket rule online; therefore DB repair is required for this epoch.
- `epoch #1` has not published a merkle root and has not reached a claimable reward state.
- Because `participantCount` is derived from `isEligible=true` and `isParticipating=true`, reaching the 12-person threshold may require setting repaired qualified users to participating status for this recovery.

## 5. Architecture Impact

- No repo code change is required for the immediate recovery itself.
- This is a high-risk data repair touching settlement-critical tables:
  - `WeeklyEpoch`
  - `LotteryTicket`
  - potentially `WeeklyReward`, `MerkleLeaf`, `ClaimRecord` if rerun state needs cleanup
- `CANCELLED` affects the whole weekly promotion epoch, not just the lottery surface:
  - lottery rewards are not issued
  - ranking rewards are not issued
  - the promotion pool is rolled into the next epoch

## 6. Milestones

### Milestone 1: Snapshot Current State

#### Goal

Capture the exact current state before any repair so rollback remains possible.

#### Affected Files / Modules

- Remote DB rows only
- Reference code:
  - `apps/server/src/modules/epoch/services/weekly-epoch-application.service.ts`
  - `apps/server/src/modules/lottery/services/lottery-ticket.service.ts`
  - `apps/server/src/modules/rewards/services/rewards.service.ts`

#### Implementation Notes

- Export current rows for:
  - `WeeklyEpoch` for `epochNo in (1, 2)`
  - `LotteryTicket` for `epochId = cmne80qp900008wpj44hy91qv`
  - any `WeeklyReward`, `MerkleLeaf`, and `ClaimRecord` tied to `epoch #1`
- Record current rollover target and amounts.

#### Risks

- Missing a dependent table would make rollback incomplete.

#### Verification Commands

- Read-only SQL for the affected rows

#### Expected Outputs

- Snapshot of the pre-repair state
- Exact rollback values for `epoch #1` and `epoch #2`

### Milestone 2: Build Repair Candidate Set

#### Goal

Identify which users should receive repaired epoch-1 ticket eligibility under the intended rule.

#### Affected Files / Modules

- Remote DB tables:
  - `Checkin`
  - `User`
  - `LotteryTicket`

#### Implementation Notes

- Count raw check-ins per user for `2026-03-27` through `2026-04-02`.
- Candidate baseline:
  - users with `confirmedCount >= 7`
- Compute intended ticket counts with `floor(confirmedCount / 7)`.
- Compare candidate list against existing `LotteryTicket` rows.

#### Risks

- The live threshold uses participant count, not merely qualified users.
- If we repair only eligibility but not participation, the epoch may still fail the 12-person minimum.

#### Verification Commands

- Read-only SQL aggregation over `Checkin` and `LotteryTicket`

#### Expected Outputs

- Candidate user list
- Intended repaired `ticketCount` per user
- Count of users that would satisfy the minimum threshold

### Milestone 3: Reverse Current Cancellation Side Effects

#### Goal

Undo the current `epoch #1` cancellation state so the epoch can be processed again.

#### Affected Files / Modules

- Remote DB tables:
  - `WeeklyEpoch`

#### Implementation Notes

- Revert `epoch #1` from `CANCELLED` to a reprocessable state.
- Remove `epoch #1` cancellation markers:
  - `status`
  - `calculationRemark`
  - `settledAt`
  - `snapshotAt`
  - `lotteryPoolUsdt`
  - `rankingPoolUsdt`
- Remove the rollover amount previously pushed into `epoch #2`.

#### Risks

- If rollover reversal is incomplete, pool amounts will be double-counted on rerun.
- If epoch state is restored incorrectly, reward scripts will reject the epoch.

#### Verification Commands

- SQL checks for `WeeklyEpoch` rows before and after reversal

#### Expected Outputs

- `epoch #1` restored to a state that can be re-synced
- `epoch #2` no longer contains the carried-over amount from the cancelled run

### Milestone 4: Repair Ticket Eligibility And Participation

#### Goal

Patch epoch-1 ticket rows so the repaired rule is reflected in settlement inputs.

#### Affected Files / Modules

- Remote DB tables:
  - `LotteryTicket`

#### Implementation Notes

- Upsert / update `LotteryTicket` for the repaired candidate set.
- Set:
  - `isEligible = true`
  - `ticketCount = floor(confirmedCount / 7)`
  - `streakDays` to the repaired count basis used for this recovery
- For threshold recovery, set qualifying users to `isParticipating = true` for this epoch.

#### Risks

- This is a business override for a test environment and should be explicitly documented.
- Incorrect participation handling could still leave the epoch below threshold.

#### Verification Commands

- SQL counts for:
  - repaired eligible users
  - repaired participating users
  - aggregate `participantCount`
  - aggregate `qualifiedTicketCount`

#### Expected Outputs

- At least 12 repaired participating eligible users for `epoch #1`

### Milestone 5: Re-Sync And Re-Settle Epoch #1

#### Goal

Re-run the normal weekly processing path after repair.

#### Affected Files / Modules

- Online admin / API
- Server settlement script:
  - `apps/server/scripts/settle-weekly-epoch-rewards.ts`

#### Implementation Notes

- Execute weekly epoch sync again so `epoch #1` is reprocessed.
- If the repaired epoch reaches `CALCULATING`, run:
  - `draft`
  - `publish`
  - chain root publish
  - `activate`

#### Risks

- If repair inputs are inconsistent, `sync` may still roll over or settlement may fail.
- If rewards or merkle rows from a prior partial run exist, they must be cleaned before rerun.

#### Verification Commands

- `epoch sync` execution
- settlement script with `--mode draft`
- settlement script with `--mode publish`
- reward publication preview / activation checks

#### Expected Outputs

- `epoch #1` no longer `CANCELLED`
- weekly rewards materialized for lottery and ranking
- publication path ready

## 7. Approval Checkpoint

Do not mutate the remote test database until this plan is explicitly approved.

## 8. Rollback / Recovery Notes

- Restore the saved `WeeklyEpoch` rows for `epoch #1` and `epoch #2`
- Restore the saved `LotteryTicket` rows for `epoch #1`
- Remove any newly created `WeeklyReward`, `MerkleLeaf`, and `ClaimRecord` rows from the rerun if rollback is required

## 9. Final Verification Checklist

- `epoch #1` no longer remains `CANCELLED`
- repaired `participantCount >= 12`
- repaired `qualifiedTicketCount` reflects the intended rule
- `epoch #2` rollover amount is correct after rerun
- lottery reward draft is created
- ranking reward draft is created
- no duplicate rollover or duplicate reward rows remain
