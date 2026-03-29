# weak-leg-single-line-auto-placement execution log

## Status
- Implementation completed for server-side auto-placement flow.
- Verification completed for targeted server tests and server build.

## Research summary
- Current referred signup automatically binds `inviterId` during signin but does not auto-place into the tree:
  [`apps/server/src/auth/services/auth.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts)
- Pending placement today is represented by:
  inviter bound
  parent not set
  listed under inviter pending placements
- Invite code issuance for non-root users currently happens only after placement succeeds:
  [`apps/server/src/modules/tree/services/tree-topology.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.ts)
- DApp share access already depends on both tree readiness and invite-code presence:
  [`apps/dapp/src/components/pages/team-page.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)

## Implementation summary
- Added a deterministic auto-placement attempt in
  [`apps/server/src/modules/tree/services/tree-topology.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.ts):
  weak-leg priority uses inviter `leftTeamVolume` vs `rightTeamVolume`; when volume is tied it compares left/right branch member counts so the side with fewer in-tree members is treated as the weak leg; only a full tie falls back to `LEFT`. Placement still traverses only the chosen leg's outer spine until the first empty slot.
- Added repository support in
  [`apps/server/src/modules/tree/repositories/team-closure.repository.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/repositories/team-closure.repository.ts)
  to read inviter profile volumes and follow a direct child on a specified `LEFT` or `RIGHT` branch.
- Added a thin orchestration layer in
  [`apps/server/src/modules/referral/services/referral-onboarding.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/referral/services/referral-onboarding.service.ts)
  so `bind inviter -> commit -> try auto placement` is now split into two phases:
  the inviter binding commits first, and the placement attempt then runs with retry/pending fallback semantics. This prevents concurrent slot races from rolling back a valid registration or valid inviter binding.
- Updated signin recovery and initial referred onboarding in
  [`apps/server/src/auth/services/auth.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts)
  to use the new orchestration flow.
- Updated
  [`apps/server/src/modules/referral/referral.controller.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/referral/referral.controller.ts)
  so `/api/v1/referral/inviter/bind` also attempts auto-placement instead of leaving users in the old manual pending-placement default.

## Deviations from plan
- No DApp code changes were required in this iteration.
- After reviewing
  [`apps/dapp/src/components/wallet-button.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx)
  and
  [`apps/dapp/src/components/pages/team-page.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx),
  existing signin already forwards the referral code and existing query invalidation/profile refresh is sufficient once the backend returns an already-placed user.
- Team page manual placement UI remains as fallback/repair visibility for true pending cases; it is no longer required for the normal referred signup path.
- Concurrency handling was tightened after implementation review:
  repeated `placementKey` unique-key races now retry auto-placement and finally downgrade to pending placement instead of rolling back the entire signup/bind transaction.

## Commands run during implementation
- `sed -n '1,280p' apps/server/src/auth/services/auth.service.ts`
- `sed -n '1,240p' apps/server/src/modules/referral/services/referral.service.ts`
- `sed -n '1,460p' apps/server/src/modules/tree/services/tree-topology.service.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/engines/placement-policy.engine.ts`
- `sed -n '1,180p' packages/common/src/models/promotion.ts`
- `sed -n '1,120p' packages/common/src/validators/promotion.ts`
- `sed -n '150,250p' apps/dapp/src/components/pages/team-page.tsx`
- `sed -n '210,260p' apps/dapp/src/components/wallet-button.tsx`
- `sed -n '1,260p' apps/server/src/modules/tree/services/tree-topology.service.spec.ts`
- `sed -n '1,260p' apps/server/src/auth/services/auth.service.spec.ts`
- `sed -n '1,220p' apps/server/src/modules/referral/referral.controller.ts`
- `sed -n '1,260p' apps/server/src/modules/referral/services/referral.service.spec.ts`
- `sed -n '1,220p' apps/server/src/modules/shared/shared-domain.module.ts`
- `sed -n '1,220p' apps/server/src/auth/auth.module.ts`
- `pnpm --dir apps/server test -- --runInBand auth/services/auth.service.spec.ts modules/referral/services/referral-onboarding.service.spec.ts modules/tree/services/tree-topology.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/server test -- --runInBand modules/tree/services/tree-topology.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/server test -- --runInBand auth/services/auth.service.spec.ts modules/referral/services/referral-onboarding.service.spec.ts modules/tree/services/tree-topology.service.spec.ts`
- `pnpm --dir apps/server build`

## Verification results
- `pnpm --dir apps/server test -- --runInBand auth/services/auth.service.spec.ts modules/referral/services/referral-onboarding.service.spec.ts modules/tree/services/tree-topology.service.spec.ts`
  result: passed
  details:
  3 test suites passed
  20 tests passed
- `pnpm --dir apps/server build`
  result: passed
- `pnpm --dir apps/server test -- --runInBand auth/services/auth.service.spec.ts modules/referral/services/referral-onboarding.service.spec.ts modules/tree/services/tree-topology.service.spec.ts`
  result: passed
  details:
  3 test suites passed
  23 tests passed
- `pnpm --dir apps/server build`
  result: passed
- `pnpm --dir apps/server test -- --runInBand modules/tree/services/tree-topology.service.spec.ts`
  result: passed
  details:
  1 test suite passed
  14 tests passed
- `pnpm --dir apps/server build`
  result: passed

## Test coverage added/updated
- Updated
  [`apps/server/src/modules/tree/services/tree-topology.service.spec.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.spec.ts)
  to cover:
  weak-left selection
  weak-right selection
  volume-tie resolved by branch member count
  single-line depth traversal
  deferred fallback when the chosen spine hits an inactive child
  retry-and-pending behavior for concurrent placement races
- Added
  [`apps/server/src/modules/referral/services/referral-onboarding.service.spec.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/referral/services/referral-onboarding.service.spec.ts)
  to cover bind-plus-auto-place orchestration behavior.
- Updated
  [`apps/server/src/auth/services/auth.service.spec.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.spec.ts)
  to cover auto-placement attempts during both first-time referred signup and recovered signin binding.

## Commands run during planning
- `sed -n '1,260p' apps/server/src/modules/tree/engines/placement-policy.engine.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- `rg -n "pending placement|auto placement|bindPlacementForInviter|initializeRootUserTx|placement policy|selectable slots" apps/server docs/plan-excution -g '!**/node_modules/**'`
- `sed -n '120,240p' apps/server/src/auth/services/auth.service.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/tree.controller.ts`
- `sed -n '1,460p' apps/server/src/modules/tree/services/tree-topology.service.ts`
- `sed -n '1,180p' apps/server/src/modules/referral/repositories/referral.repository.ts`
- `sed -n '1,200p' packages/common/src/models/promotion.ts`
- `sed -n '1,120p' packages/common/src/validators/promotion.ts`
- `sed -n '1,180p' apps/dapp/src/lib/referral.ts`
- `sed -n '1,920p' apps/dapp/src/components/pages/team-page.tsx`
- `nl -ba apps/server/src/auth/services/auth.service.ts | sed -n '138,190p'`
- `nl -ba apps/server/src/modules/referral/services/referral.service.ts | sed -n '24,132p'`
- `nl -ba apps/server/src/modules/tree/services/tree-topology.service.ts | sed -n '56,164p'`
- `nl -ba apps/server/src/modules/tree/services/tree-topology.service.ts | sed -n '340,374p'`
- `nl -ba apps/dapp/src/components/pages/team-page.tsx | sed -n '70,170p'`
- `nl -ba apps/dapp/src/components/pages/team-page.tsx | sed -n '172,250p'`
- `nl -ba apps/dapp/src/components/pages/team-page.tsx | sed -n '560,760p'`
- `nl -ba apps/dapp/src/components/pages/team-page.tsx | sed -n '760,860p'`

## Notes
- Auto-placement now fails safe: if the chosen weak-leg spine cannot produce a legal active parent, the user remains pending and an auto-deferred audit record is emitted instead of corrupting the tree.
- Manual placement endpoints remain available for repair and exception handling.
