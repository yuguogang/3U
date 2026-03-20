# Tree Root Sharing Readiness Execution

## Status

- State: Planning
- Approved: No
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

- User approval of `plan.md`
- Implementation after approval
