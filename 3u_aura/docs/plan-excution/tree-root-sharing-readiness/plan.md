# Tree Root Sharing Readiness

## 1. Objective

Stabilize the promotion tree onboarding rules so referral sharing, inviter binding, and placement readiness behave consistently.

The target outcome is:

- the promotion tree has a clearly initialized root
- a user can only share when their state is compatible with downstream placement
- pending invitees do not get stuck behind inviters who are not yet tree-ready
- `/team` reflects the real tree state instead of implying share readiness too early

## 2. Scope

### In Scope

- `apps/server` tree topology policy and selectable-slot readiness rules
- `apps/server` onboarding/share-readiness rules where they intersect with referral binding
- `apps/dapp` `/team` state presentation for:
  - pending placement
  - tree-ready sharing
  - blocked-by-parent-readiness states
- environment/bootstrap handling for the first/root user if needed
- explicit verification for:
  - first/root user
  - inviter already in tree
  - inviter bound but not yet in tree
  - downstream pending placement behavior

### Out of Scope

- changes to reward formulas
- changes to check-in, claim, or NFT mint economics
- redesign of admin tree tooling beyond what is needed to support the new readiness model
- multi-tree or forest support

## 3. Out of Scope

- retroactive migration of all historical environments beyond local/test workflow support
- changing binary tree from `LEFT/RIGHT` semantics
- replacing manual placement with a fully automatic placement engine in this iteration

## 4. Assumptions

- the system is intended to operate as a single active promotion tree, not multiple independent trees
- a root user is required for the tree to function predictably
- users should not appear fully “share-ready” if their downstream referrals would immediately be blocked from placement
- keeping pending placement is still acceptable, but it should represent a deliberate transitional state rather than the default happy path
- the current `TeamClosure` / `placementKey` model remains the persistence basis

## 5. Architecture Impact

### Server

- tree topology rules are the primary source of truth for placement readiness
- referral/share readiness should align with tree readiness, rather than only inviter-binding state
- onboarding may need to recognize a special root-ready case or environment-provisioned root

### DApp

- `/team` should stop equating “inviter bound” with “safe to keep sharing”
- UI likely needs separate states for:
  - not bound
  - bound but waiting for own placement
  - tree-ready and share-enabled

### Environment / Operations

- local and test environments may need explicit root initialization or bootstrap seeding
- CI/manual test scripts may need to guarantee a root-ready inviter chain before testing downstream referrals

## 6. Design Direction

### Recommended Model

Adopt a **single-tree, explicit-root, share-after-tree-ready** policy:

- one explicit root user exists per active environment
- the root is initialized in the tree automatically
- non-root users may bind inviters first
- non-root users only become “share-ready” after they themselves are placed in the tree
- downstream referrals can still bind early, but UI and operational flows must make it clear when placement is blocked by upstream readiness

### Why This Direction

- it removes the misleading state where a user can share successfully but cannot host any descendants
- it matches the current tree service’s assumption that a subtree must already exist before descendants can be placed beneath it
- it reduces dead-end pending placement states in the normal user journey

### Alternative Considered

Allow inviter binding alone to unlock sharing immediately, and rely on later manual placement recovery.

#### Why Not Preferred

- this is the current failure mode
- it creates valid referrals that cannot be placed
- it pushes a structural issue into later manual recovery

## 7. Milestones

### Milestone 1: Tree State Model and Root Policy Lock

#### Goal

Define the official user-state model and root initialization policy.

#### Affected Files / Modules

- `apps/server/src/modules/tree/services/tree-topology.service.ts`
- `apps/server/src/modules/tree/engines/placement-policy.engine.ts`
- `apps/server/src/modules/referral/services/referral.service.ts`
- `apps/dapp/src/components/pages/team-page.tsx`

#### Implementation Notes

- document the effective state machine:
  - unbound
  - inviter-bound but not tree-placed
  - tree-placed/share-ready
  - pending descendants waiting for placement
- decide how root is established:
  - environment-seeded root
  - or first eligible user auto-root
- explicitly decide whether sharing is gated by:
  - inviter binding
  - or tree placement readiness

#### Risks

- mixing root policy between environments
- accidental backward-incompatible behavior for existing local data

#### Verification Commands

- `sed -n '1,280p' apps/server/src/modules/tree/services/tree-topology.service.ts`
- `sed -n '1,260p' apps/server/src/modules/tree/engines/placement-policy.engine.ts`
- `sed -n '1,220p' apps/dapp/src/components/pages/team-page.tsx`

#### Expected Outputs

- approved state model and root policy

### Milestone 2: Root Initialization Strategy

#### Goal

Make root readiness explicit and deterministic.

#### Affected Files / Modules

- `apps/server/src/modules/tree/services/tree-topology.service.ts`
- `apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- environment/bootstrap scripts if needed
- `docs/plan-excution/server-contract-ci-full-coverage/*` only if test harness assumptions must be updated later

#### Implementation Notes

- choose one minimal approach:
  - pre-seeded root user with self-closure
  - or first-user auto-root initialization under strict conditions
- ensure root user always yields selectable slots
- avoid hidden “root by accident” behavior

#### Risks

- first-user auto-root can be ambiguous across persistent environments
- bootstrap-based root requires stricter environment discipline

#### Verification Commands

- targeted local inspection of root user fields and self-closure
- `pnpm --dir apps/server test -- --runInBand`

#### Expected Outputs

- deterministic root initialization behavior

### Milestone 3: Share Readiness Gate

#### Goal

Align share availability with actual tree readiness.

#### Affected Files / Modules

- `apps/server` user/referral read models if additional status fields are needed
- `apps/dapp/src/components/pages/team-page.tsx`
- possibly `packages/common` if explicit readiness fields are introduced

#### Implementation Notes

- recommended gating rule:
  - root user: share-ready immediately after root initialization
  - non-root user: share-ready only after placement is confirmed
- keep inviter bind possible before placement
- do not expose full share center merely because `inviterId` exists
- add explicit UI state for “bound, waiting for your own placement”

#### Risks

- current task `team-share-link-auto-bind` assumes share-after-bind; this milestone would intentionally tighten that behavior
- DApp wording must stay aligned with backend truth

#### Verification Commands

- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp build`

#### Expected Outputs

- users do not get misleading share affordances before they are tree-ready

### Milestone 4: Pending Placement Experience

#### Goal

Make blocked placement understandable and recoverable.

#### Affected Files / Modules

- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/server/src/modules/tree/services/tree-topology.service.ts`
- `apps/server/src/modules/tree/tree.controller.ts`

#### Implementation Notes

- differentiate:
  - no selectable slots because inviter subtree is full
  - no selectable slots because inviter is not yet initialized in tree
- consider whether the API needs a richer empty-state reason instead of just returning `[]`
- show a specific message when upstream placement is required first

#### Risks

- empty-array responses are currently ambiguous
- adding reason codes may require shared-model/API changes

#### Verification Commands

- manual `/team` verification in local fork-anvil
- targeted server tests for slot selection conditions

#### Expected Outputs

- users and testers can tell *why* placement is blocked

### Milestone 5: Verification Matrix and Environment Rules

#### Goal

Lock verification scenarios and update environment expectations.

#### Affected Files / Modules

- task execution docs
- possibly promotion env setup docs/scripts if root seeding becomes mandatory

#### Implementation Notes

- verify at least:
  - root user has immediate slots
  - user bound to root can be placed
  - placed non-root user becomes share-ready
  - unplaced non-root user is not share-ready
  - downstream invitee of unplaced inviter shows explicit upstream-blocked state

#### Risks

- local environments with dirty state can hide or distort root behavior

#### Verification Commands

- local fork reset/start commands
- targeted browser validation on `/team`
- relevant server tests/builds

#### Expected Outputs

- repeatable validation path for root/share/tree readiness

## 8. Approval Checkpoint

Do not implement until this plan is approved.

This is a **Critical** task because it changes core tree readiness behavior and directly affects inviter/share semantics for downstream users.

## 9. Rollback / Recovery Notes

- keep root policy changes isolated and explicit
- if regressions appear, rollback should restore:
  - current placement gating
  - current share visibility rules
- avoid silent one-off DB fixes as the primary solution
- if environment bootstrap is introduced, make it idempotent and reversible

## 10. Final Verification Checklist

- root user policy is explicit and documented
- root-ready user has selectable slots
- non-root user cannot appear share-ready before tree readiness, if that policy is adopted
- pending placement empty states distinguish tree-not-ready vs subtree-full where relevant
- `/team` messaging matches backend truth
- relevant server tests pass
- relevant dapp lint/typecheck/build pass
- execution log records real commands, evidence, and deviations
