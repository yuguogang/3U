# Lottery Opt-In And Weekly Results Publication

## 1. Objective

Reshape the weekly promotion participation model so:

1. weekly lottery becomes an explicit user action instead of a fully passive background inclusion flow
2. weekly ranking rewards remain automatic
3. both lottery and ranking gain a visible weekly publication flow in DApp and Admin

The target UX is:

- users earn lottery eligibility automatically from check-in streaks
- users must explicitly confirm `participate in this week's lottery` before the epoch cutoff
- after the epoch is settled, eligible participants can actively trigger a reveal interaction such as dice / roulette animation
- the reveal interaction should expose an already-settled result immediately after the animation
- claiming remains a separate post-reveal action
- weekly ranking remains auto-enrolled once a user meets the business threshold
- weekly results become viewable, not only claimable
- existing claim flows remain compatible wherever possible

## 2. Scope

- Add a weekly lottery opt-in concept to the promotion flow
- Define the weekly lottery participation state machine for the current epoch
- Extend server-side weekly epoch / lottery processing to distinguish:
  - eligible
  - opted-in
  - settled
- Add DApp surfaces for:
  - current lottery eligibility
  - current epoch opt-in status
  - lottery participation CTA
  - post-settlement lottery reveal CTA
  - revealed lottery outcome state
  - weekly result display for lottery and ranking
- Add Admin surfaces for:
  - weekly result visibility
  - publication status
  - operator confirmation / publication workflow where appropriate
- Reconcile result publication with the existing weekly merkle claim generation flow
- Preserve existing NFT weekly subsidy behavior as automatic generation + manual claim
- Document operational rollout and migration considerations

## 3. Out of Scope

- Reworking NFT weekly subsidy business rules
- Changing MerkleClaim or Settlement contract interfaces unless an unexpected blocker is discovered
- Rewriting the existing weekly payout math for lottery and ranking
- Public marketing site / off-platform announcement automation
- Multi-environment deployment execution
- Backfilling historic epochs unless explicitly requested later

## 4. Assumptions

- The current weekly lottery and ranking claim contracts can remain unchanged because claim occurs after weekly result settlement, not during opt-in
- Lottery opt-in can be represented off-chain in server persistence and applied before payout materialization
- Lottery reveal animation can also remain off-chain because it reveals a server-settled result rather than determining randomness at click time
- The current epoch sync flow remains the weekly orchestration entry point
- Ranking reward qualification remains automatic and should not require a user-side confirmation step
- “Weekly publication” should mean an in-product readable result surface, not only a claim record becoming available
- A first implementation can publish current and latest settled epoch results without needing a full historical archive UI
- “Dice / roulette” is a presentation layer for reveal, not the source of truth for winner selection

## 5. Architecture Impact

### Server

- `apps/server/src/modules/lottery/services/lottery-ticket.service.ts`
  - currently only derives eligibility from check-in streaks
  - must support a separate opt-in state instead of treating all eligible users as active participants
- `apps/server/src/modules/lottery/services/lottery-settlement.service.ts`
  - currently settles all eligible tickets
  - must settle only opted-in tickets
- weekly epoch orchestration under `apps/server/src/modules/epoch/**`
  - likely needs an explicit “lottery participation closed / ready for draw / published” step
- publication / claim modules under `apps/server/src/modules/claims/**`
  - should continue driving Merkle claimability
  - may need a new readable weekly results projection for DApp/Admin
- likely new or extended controller/service modules for:
  - current-epoch lottery participation query
  - opt-in command
  - weekly result query

### Database / Persistence

- Current ticket persistence likely needs additional fields or a dedicated related record for:
  - `isEligible`
  - `isParticipating`
  - `optedInAt`
  - optional `publicationStatus`
- This is a schema-affecting, reward-path change and should be treated as Critical
- Migration design must preserve auditability and avoid ambiguous inferred participation

### Shared Models

- `packages/common`
  - add or extend DApp/Admin API response models for:
    - current lottery participation status
    - weekly result summaries
    - weekly leaderboards / winners
    - admin publication status

### DApp

- `apps/dapp/src/components/pages/checkin-page.tsx`
  - current page already exposes lottery progress to next ticket
  - likely best place for current-epoch opt-in CTA
- `apps/dapp/src/components/pages/rewards-page.tsx`
  - should become the main weekly results viewing surface
  - should also host the post-settlement lottery reveal interaction
- `apps/dapp/src/components/pages/claims-page.tsx`
  - should stay focused on claiming rather than becoming the primary results page
- localized copy in `apps/dapp/messages/*/common.json`
  - will need new strings for opt-in, deadline, status, winners, ranking, and publication badges

### Admin

- `apps/admin/src/features/ops/components/ops-page.tsx`
  - current weekly epoch sync remains relevant
  - may need a publication step or at least a visibility panel for weekly result generation state
- `apps/admin/src/features/overview/components/overview-page.tsx`
  - should surface latest weekly epoch result / publish status
- likely a new or extended Admin list/detail surface for:
  - lottery participants
  - ranking results
  - weekly publication summary

### Contracts

- No contract redeploy is expected in the recommended plan
- Claim contracts continue to operate on post-settlement claim data
- If later requirements demand on-chain participation commitment, that would be a separate design and likely a different task

## 6. Current-State Findings

### 6.1 Lottery Is Currently Automatic After Eligibility

- `LotteryTicketService` derives eligibility directly from counted check-in days and writes `ticketCount = 1` for every eligible user
- `participantCount` and `qualifiedTicketCount` currently equal the eligible user count
- reference:
  - `apps/server/src/modules/lottery/services/lottery-ticket.service.ts`

### 6.2 Lottery Settlement Consumes All Eligible Tickets

- `LotterySettlementService` currently settles against `listEligibleTicketsForSettlement(...)`
- there is no separate participation confirmation layer
- reference:
  - `apps/server/src/modules/lottery/services/lottery-settlement.service.ts`

### 6.3 Ranking Is Already Automatic And Fits The Desired Rule

- `RankingSettlementService` computes winners directly from weekly small-leg snapshots
- this already matches the desired “automatic ranking participation” model
- reference:
  - `apps/server/src/modules/ranking/services/ranking-settlement.service.ts`

### 6.4 Claimability Exists, Readable Result Publication Does Not

- current claim publication resolves Merkle roots and claimable records
- DApp claims page is already wired for weekly lottery/ranking claims
- but there is no dedicated weekly public result model or result list surface
- references:
  - `apps/server/src/modules/claims/services/claim-publication.service.ts`
  - `apps/dapp/src/components/pages/claims-page.tsx`

### 6.5 Admin Currently Focuses On Sync / Repair, Not Weekly Result Publication

- Admin has `Weekly Epoch Sync`
- Admin has `Claim Sync Replay`
- Admin overview shows latest weekly epoch counts but not winners / rankings / publish status
- references:
  - `apps/admin/src/features/ops/components/ops-page.tsx`
  - `apps/admin/src/features/overview/components/overview-page.tsx`

## 7. Design Recommendation

### Recommended Product Rule

- Lottery:
  - eligibility is automatic
  - participation is manual
  - participation applies to the current epoch only
  - unconfirmed eligible tickets expire with the epoch unless future product rules explicitly change this
  - if the user participated and the epoch is settled, the user may actively trigger a reveal animation
  - the reveal animation displays a precomputed result; it does not perform a fresh draw on click
- Ranking:
  - fully automatic
- Weekly results:
  - readable in DApp
  - reviewable in Admin
  - claim remains a separate user action

### Recommended Technical Direction

- Keep opt-in entirely off-chain
- Add a server-owned participation record tied to `epochId + userId`
- Filter lottery settlement to `eligible && opted-in`
- Publish readable result snapshots from server-side settled data
- Add a user-facing reveal status tied to the settled lottery result so DApp can show:
  - pending reveal
  - revealed win / loss
  - claim action after reveal
- Reuse current Merkle claim generation rather than redesigning reward delivery
- Do not convert weekly lottery into an instant-draw product; that would require a separate redesign of settlement semantics

## 8. Milestones

### Milestone 1: Rule Finalization And Data Contract

- Goal:
  - lock the business rules and persistence model for lottery opt-in and weekly results
- Affected files/modules:
  - `packages/common/src/models/promotion.ts`
  - `packages/common/src/models/admin.ts`
  - `packages/common/src/validators/**`
  - likely Prisma schema and related DB migration files under `apps/server/prisma/**`
- Implementation notes:
  - define the lottery participation lifecycle:
    - eligible
    - opted-in
    - cutoff passed
    - settled
    - reveal available
    - revealed
  - define result read models for:
    - DApp weekly result summary
    - DApp ranking board / lottery winners
    - DApp reveal payload for current user
    - Admin publication overview
  - explicitly separate:
    - settlement-time winner determination
    - user-triggered reveal-time presentation
  - explicitly decide whether non-opted-in eligibility expires at epoch end
- Risks:
  - ambiguous business rules around expiry / rollover
  - confusing “reveal” with “draw”
  - mixing “eligibility” and “participation” into one flag and losing audit clarity
- Verification commands:
  - `rg -n "LotteryTicket|WeeklyEpoch|AdminOverviewLatestEpochView|PromotionMerkleClaimView" apps/server packages/common`
- Expected outputs:
  - finalized shared model and persistence design

### Milestone 2: Server Lottery Opt-In Flow

- Goal:
  - add server support for querying and mutating current-epoch lottery participation
- Affected files/modules:
  - `apps/server/src/modules/lottery/services/lottery-ticket.service.ts`
  - `apps/server/src/modules/lottery/repositories/lottery-ticket.repository.ts`
  - `apps/server/src/modules/lottery/**/controller*.ts` or equivalent API surface
  - Prisma schema / migration files
- Implementation notes:
  - preserve current eligibility refresh logic
  - add a separate opt-in update path with transactional audit logging
  - enforce that only eligible users can opt in
  - enforce epoch cutoff rules
- Risks:
  - double opt-in and replay behavior
  - race conditions near epoch cutoff
  - schema drift on high-risk reward data
- Verification commands:
  - `pnpm --dir apps/server test -- lottery-ticket.service.spec.ts`
  - targeted repository / controller tests as added
  - `pnpm --dir apps/server build`
- Expected outputs:
  - current-epoch lottery participation API
  - persisted, auditable opt-in state

### Milestone 3: Settlement And Publication Pipeline

- Goal:
  - ensure settlement and publication reflect the new product rules
- Affected files/modules:
  - `apps/server/src/modules/lottery/services/lottery-settlement.service.ts`
  - `apps/server/src/modules/ranking/services/ranking-settlement.service.ts`
  - `apps/server/src/modules/claims/services/claim-publication.service.ts`
  - weekly epoch orchestration under `apps/server/src/modules/epoch/**`
  - any new results read service / repository under `apps/server/src/modules/**`
- Implementation notes:
  - lottery settlement must consume only opted-in participants
  - ranking remains unchanged in qualification, but gains explicit readable publication output
  - lottery result publication must support two user states:
    - settled but unrevealed
    - settled and revealed
  - add a weekly results query model for:
    - lottery winners / my status
    - ranking leaderboard / my rank
    - publication timestamps / claim readiness
- Risks:
  - mismatch between readable results and claimable records
  - mismatch between reveal state and already claimable reward state
  - accidentally changing payout math while adding publication views
- Verification commands:
  - `pnpm --dir apps/server test -- lottery-settlement.service.spec.ts`
  - `pnpm --dir apps/server test -- ranking-settlement.service.spec.ts`
  - `pnpm --dir apps/server test -- claim-publication.service.spec.ts`
  - `pnpm --dir apps/server build`
- Expected outputs:
  - opt-in-aware lottery settlement
  - weekly result publication payloads for DApp/Admin

### Milestone 4: DApp Opt-In And Weekly Result UX

- Goal:
  - add user-facing weekly lottery participation and weekly result viewing
- Affected files/modules:
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/components/pages/rewards-page.tsx`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - related queries/hooks under `apps/dapp/src/queries/**` and `apps/dapp/src/hooks/**`
  - `apps/dapp/messages/*/common.json`
- Implementation notes:
  - recommended CTA placement:
    - current-epoch lottery opt-in on check-in page after eligibility progress
  - recommended results placement:
    - rewards page shows current / latest weekly lottery and ranking results
    - rewards page also hosts the dice / roulette reveal entry after settlement
  - claims page should deep-link from results to claim, not absorb all results UX
  - show:
    - my eligibility
    - my participation status
    - opt-in deadline
    - result published / pending
    - reveal available / revealed
    - my rank or my lottery outcome when available
    - claim button only after reveal when the outcome is a win
- Risks:
  - overcrowding already dense mobile pages
  - animation obscuring the fact that result was already settled server-side
  - confusing users by mixing result browsing and claim actions
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - visible lottery opt-in flow
  - visible weekly result display
  - localized copy for all new statuses and CTAs

### Milestone 5: Admin Weekly Publication Surface

- Goal:
  - give operators a clear weekly publication view without overloading the existing repair console
- Affected files/modules:
  - `apps/admin/src/features/overview/components/overview-page.tsx`
  - `apps/admin/src/features/ops/components/ops-page.tsx`
  - likely a new or extended feature under `apps/admin/src/features/**`
  - `packages/common/src/models/admin.ts`
- Implementation notes:
  - show latest weekly epoch status plus:
    - eligible count
    - opted-in count
    - lottery publish status
    - ranking publish status
    - claimable count if available
  - if a publish button is added, keep it gated and dry-run-able where possible
  - prefer a dedicated result page over turning Ops into one giant form
- Risks:
  - exposing high-risk publish actions without enough guardrails
  - duplicating data already present in audit / claim pages
- Verification commands:
  - `pnpm --dir apps/admin typecheck`
  - `pnpm --dir apps/admin lint`
  - `pnpm --dir apps/admin build`
- Expected outputs:
  - operator-readable weekly results / publish surface

### Milestone 6: End-To-End Verification And Ops Notes

- Goal:
  - verify the new business flow end to end and document rollout cautions
- Affected files/modules:
  - tests in `apps/server`
  - optional smoke coverage in DApp/Admin
  - `docs/plan-excution/lottery-opt-in-ranking-results/execution.md`
- Implementation notes:
  - verify these paths:
    - eligible but not opted-in user is excluded from lottery settlement
    - opted-in eligible user can win / lose and see a result
    - settled lottery result can be actively revealed through animation
    - claim is still available after reveal and not incorrectly blocked before settlement
    - ranking remains automatic
    - weekly results become viewable before claim
    - claim remains functional after result publication
  - record any migration or operator sequencing notes explicitly
- Risks:
  - payout regressions in high-risk reward flows
  - inconsistent state between result publication and claim availability
- Verification commands:
  - `pnpm --dir packages/common build`
  - `pnpm --dir apps/server test`
  - `pnpm --dir apps/server build`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
  - `pnpm --dir apps/admin typecheck`
  - `pnpm --dir apps/admin lint`
  - `pnpm --dir apps/admin build`
- Expected outputs:
  - verified end-to-end weekly participation / publication flow
  - execution log with real commands, deviations, and residual risks

## 9. Approval Checkpoint

Do not implement until approved.

This task is Critical because it changes weekly reward participation semantics and touches high-risk reward settlement / publication paths.

## 10. Rollback / Recovery Notes

- Keep claim contract interfaces unchanged unless a blocker forces reconsideration
- Favor additive schema changes over destructive reinterpretation of historic ticket data
- If the opt-in flow causes unexpected settlement risk, revert to the current automatic lottery participation model while preserving any newly added result-read surfaces
- Ship DApp/Admin result views behind server-ready APIs; do not fake publication state from client-side heuristics

## 11. Final Verification Checklist

- [ ] Lottery eligibility and lottery participation are separate states
- [ ] Only opted-in eligible users enter lottery settlement
- [ ] Lottery reveal animation only reveals a pre-settled result
- [ ] Ranking reward participation remains automatic
- [ ] DApp shows lottery opt-in state and weekly result state
- [ ] DApp supports post-settlement lottery reveal and post-reveal claim
- [ ] DApp shows weekly ranking results in a readable form
- [ ] Admin shows weekly publish / result status
- [ ] Existing claim flows still work for lottery, ranking, and NFT subsidy
- [ ] Required schema changes include migration notes
- [ ] Relevant server tests passed
- [ ] Relevant dapp/admin typecheck, lint, and build passed
- [ ] `execution.md` contains real implementation evidence
