# Tree Root Sharing Readiness Execution

## Status

- State: Completed
- Approved: Yes
- Started: 2026-03-20

## Baseline Research

- Current `TreeTopologyService.listSelectableSlotsForInviter()` only exposes slots from the inviter subtree, or from the inviter itself when the inviter has both `parentId === null` and `inviterId === null`.
- This means a non-root inviter who is inviter-bound but not yet tree-placed can accumulate pending invitees while still exposing zero selectable slots.
- Current `/team` UX already shows pending placements and a placement section, so the missing piece is not the existence of placement UI but the readiness model behind it.
- The recently implemented `team-share-link-auto-bind` task enables earlier referral binding and sharing, which surfaced this readiness mismatch more clearly.

## Commands Run

- `sed -n '1,280p' apps/server/src/modules/tree/services/tree-topology.service.ts`
- `sed -n '1,240p' apps/server/src/modules/tree/tree.controller.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/engines/placement-policy.engine.ts`
- `sed -n '1,280p' apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- `sed -n '1,220p' docs/plan-excution/team-share-link-auto-bind/plan.md`
- `rg --files apps/server/src/modules | rg 'placement|tree'`
- `rg -n "selectable-slots|placement/bind|pending-placement|placementKey|teamPosition" apps/server/src/modules -g '!**/dist/**'`

## Key Findings

- There is already placement UI and placement API support.
- The real issue is policy: share/bind readiness is currently looser than placement readiness.
- The current code implicitly assumes one active tree with a special root case, but that root policy is not made explicit at the product level.
- This mismatch causes a common failure mode:
  - inviter can bind and share
  - downstream user can bind
  - downstream user appears in pending placements
  - but no selectable slots exist because inviter is not yet tree-ready

## Pending

- Manual user retest of `/team` in the refreshed `fork-anvil` DApp session

## Implementation Notes

- Tightened share-readiness from “inviter bound” to “tree-ready with invite code”.
- Root share-readiness is now explicit:
  - the very first user can receive an invite code immediately
  - non-root users do not receive an invite code at inviter-bind time
  - non-root users receive an invite code only after placement is confirmed
- `/team` now distinguishes:
  - not bound yet
  - bound but waiting for own placement
  - tree-ready and share-enabled
- Placement empty-state copy now explains when the inviter subtree is blocked because the current user is still waiting for upstream placement.
- The explicit root bootstrap is now complete:
  - the first user still receives the first invite code
  - the first user now also receives a `TeamClosure` self-row inside the same signup transaction
  - root does not occupy `LEFT/RIGHT`; it remains `parentId = null`, `teamPosition = null`, while exposing both child slots

## Commands Run After Approval

- `git diff -- apps/server/src/auth/services/auth.service.ts apps/server/src/modules/referral/services/referral.service.ts apps/server/src/modules/tree/services/tree-topology.service.ts apps/server/src/modules/tree/tree.module.ts apps/server/src/auth/services/auth.service.spec.ts apps/server/src/modules/referral/services/referral.service.spec.ts apps/server/src/modules/tree/services/tree-topology.service.spec.ts apps/dapp/src/components/pages/team-page.tsx docs/plan-excution/tree-root-sharing-readiness/plan.md docs/plan-excution/tree-root-sharing-readiness/execution.md`
- `sed -n '1,240p' apps/dapp/src/components/pages/team-page.tsx`
- `sed -n '240,520p' apps/dapp/src/components/pages/team-page.tsx`
- `sed -n '1,260p' apps/server/src/auth/services/auth.service.spec.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/services/tree-topology.service.spec.ts`
- `sed -n '1,260p' apps/server/src/modules/referral/services/referral.service.spec.ts`
- `sed -n '1,260p' apps/server/src/auth/services/auth.service.ts`
- `rg -n "parentId|inviterId|inviteCode" apps/dapp/src packages/common/src -g '!**/dist/**'`
- `sed -n '1,220p' apps/dapp/src/queries/user.query.ts`
- `sed -n '1,220p' apps/dapp/src/api/user.ts`
- `sed -n '1,140p' packages/common/src/models/aura.ts`
- `sed -n '1,160p' packages/common/src/validators/aura.ts`
- `sed -n '1,220p' apps/server/src/user/services/user.service.ts`
- `pnpm --dir apps/server test -- --runInBand src/modules/referral/services/referral.service.spec.ts src/modules/tree/services/tree-topology.service.spec.ts src/auth/services/auth.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp build`
- `rm -rf apps/server/dist`
- `lsof -i :3210`
- `ps -ef | rg "43200|apps/server|3210|nest"`
- `kill -9 43200 43181 43168`
- `node scripts/uat/start-promotion-services.mjs --env fork-anvil --services server`
- `curl -s http://127.0.0.1:3210/api/v1/health`
- `lsof -i :3200`
- `sed -n '1,320p' apps/server/src/modules/tree/services/tree-topology.service.ts`
- `sed -n '1,320p' apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/engines/placement-policy.engine.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/tree.controller.ts`
- `sed -n '260,520p' apps/server/src/modules/tree/services/tree-topology.service.spec.ts`
- `sed -n '1,240p' apps/server/src/auth/auth.module.ts`
- `sed -n '1,220p' apps/server/src/modules/referral/referral.module.ts`
- `sed -n '1,220p' apps/server/src/modules/tree/tree.module.ts`
- `pnpm --dir apps/server test -- --runInBand src/modules/tree/services/tree-topology.service.spec.ts src/auth/services/auth.service.spec.ts`
- `rm -rf apps/server/dist`
- `pnpm --dir apps/server build`

## Verification Results

- `pnpm --dir apps/server test -- --runInBand ...`: passed after adding the `nanoid` mock to `tree-topology.service.spec.ts`
  - `3/3` suites passed
  - `14/14` tests passed
- `pnpm --dir apps/server build`: passed after cleaning a stale `apps/server/dist` directory that previously failed with `ENOTEMPTY`
- `pnpm --dir apps/dapp lint`: passed with existing `<img>` warnings only
- `pnpm --dir apps/dapp build`: passed
- `pnpm --dir apps/dapp typecheck`: passed after `.next/types` was regenerated by the successful build
- `curl -s http://127.0.0.1:3210/api/v1/health`: returned `{"status":"ok",...}`
- `pnpm --dir apps/server test -- --runInBand src/modules/tree/services/tree-topology.service.spec.ts src/auth/services/auth.service.spec.ts`: passed
  - `2/2` suites passed
  - `11/11` tests passed
- `pnpm --dir apps/server build`: passed after cleaning `apps/server/dist`

## Deviations / Notes

- The original plan left room for a richer placement-block reason code from the API. For this iteration, the minimal-change implementation kept the API shape unchanged and clarified the blocked state in the DApp using existing `inviterId`, `parentId`, and `inviteCode` fields.
- The managed `fork-anvil` server stop script did not terminate the nested child process chain in this run, so the server was manually killed and restarted.
- Existing local `fork-anvil` users created before the root bootstrap change will not automatically gain a historical root self-closure; the cleanest validation path is to reset `fork-anvil` and recreate the first user under the new logic.
