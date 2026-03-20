# Team Share Link Auto-Bind

## 1. Objective

Implement the `/team` referral UX and supporting backend behavior so that:

- users can share both an invite code and a referral link containing that code
- users can display a QR code for the referral link
- first login through a referral link can bind the inviter automatically
- users who did not enter through a referral link do not receive their own share code immediately
- users without an inviter can still manually bind an upstream invite code using the existing bind flow
- a user's own share code/link appears only after they have an inviter binding established

## 2. Scope

### In Scope

- `apps/dapp` team page UX updates for:
  - invite link display
  - QR-code display for the invite link
  - conditional share-code visibility
  - retained manual bind flow
- `apps/dapp` login bootstrap updates so referral code from URL can participate in first-login flow
- `apps/server` auth / referral behavior updates so first-login auto-binding can happen safely
- `packages/common` shared DTO / response shape updates if needed to expose referral-share readiness cleanly
- traceable verification for:
  - referred first login
  - non-referred first login
  - manual bind after login

### Out of Scope

- multi-level campaign attribution beyond direct inviter binding
- deep link generation for mobile apps outside current web URL routing
- retroactive migration of historical production users
- changes to placement mechanics beyond existing pending-placement behavior
- admin console redesign

## 3. Out of Scope

- changing reward percentages or referral economics
- changing placement slot selection logic
- changing wallet login signature format unless strictly required
## 4. Assumptions

- first-login auto-binding only applies when the user is new and the referral code arrives via the DApp URL
- existing users without an inviter can still use manual bind once, subject to existing policy checks
- existing users who already have an inviter remain unchanged
- "having your own share code" is a business-level readiness state, not merely a front-end presentation toggle
- if current schema already allows nullable `inviteCode`, we can implement issuance-on-bind without a breaking table redesign
- QR code is a presentation of the same canonical referral link, not a separate referral artifact

## 5. Architecture Impact

### DApp

- `wallet-button` or adjacent auth bootstrap will need a small, explicit mechanism to capture a referral code from URL/query storage and pass it during first sign-in
- `team-page` will move from "always show invite code" to state-based rendering:
  - no inviter and no issued share code: show manual bind UI only
  - inviter bound and share code issued: show code + share link + QR code

### Server

- auth creation flow currently issues `inviteCode` immediately on new-user sign-in
- referral-aware onboarding will likely require:
  - optional referral code intake during sign-in
  - transactional new-user creation + inviter bind + conditional invite-code issuance
- referral service should remain the owner of bind policy checks; auth should orchestrate but not duplicate referral rules

### Shared Models

- if UI should distinguish:
  - `hasInviter`
  - `hasShareCode`
  - `shareLink`
  - `shareQrValue`
  then shared response shape may need a small extension rather than overloading `inviteCode`

## 6. Milestones

### Milestone 1: Current-State Contract and UX Decision

#### Goal

Lock the exact first-login, share-code issuance, and QR-backed sharing behavior against the current codebase.

#### Affected Files / Modules

- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/dapp/src/components/wallet-button.tsx`
- `apps/server/src/auth/services/auth.service.ts`
- `apps/server/src/modules/referral/services/referral.service.ts`
- `packages/common/src/models/aura.ts`

#### Implementation Notes

- document the exact state machine for:
  - new user from referral link
  - new user without referral link
  - existing user without inviter
  - existing user with inviter
- confirm whether `inviteCode` becomes nullable-unissued until inviter binding
- define DApp referral-link format, preferably stable and simple:
  - `/team?ref=CODE`
  - or `/ ?ref=CODE`
- define whether QR renders inline on the team page by default or via a secondary action/modal

#### Risks

- ambiguous source-of-truth between auth and referral modules
- accidental behavior drift for existing users
- unnecessary dependency growth if QR rendering is implemented with a heavy package

#### Verification Commands

- `sed -n '1,260p' apps/dapp/src/components/pages/team-page.tsx`
- `sed -n '1,260p' apps/dapp/src/components/wallet-button.tsx`
- `sed -n '1,260p' apps/server/src/auth/services/auth.service.ts`

#### Expected Outputs

- approved behavioral contract for onboarding and share visibility

### Milestone 2: Shared Contract and Persistence Readiness

#### Goal

Prepare any shared-model or persistence changes required for conditional share-code issuance and canonical share-link exposure.

#### Affected Files / Modules

- `packages/common/src/models/aura.ts`
- `packages/common/src/validators/*`
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/migrations/*` if schema change is required

#### Implementation Notes

- prefer the smallest compatible shape
- if possible, keep `inviteCode` nullable and issue only on successful inviter binding
- add explicit shared fields only if the UI cannot safely derive state from current fields

#### Risks

- schema change may affect existing assumptions in admin / profile reads
- nullable handling regressions

#### Verification Commands

- `pnpm --dir packages/common build`
- `pnpm --dir apps/server prisma validate`

#### Expected Outputs

- stable DTO/model contract for team/referral UI

### Milestone 3: Server Onboarding and Auto-Bind Flow

#### Goal

Implement safe first-login auto-binding and share-code issuance rules on the backend.

#### Affected Files / Modules

- `apps/server/src/auth/services/auth.service.ts`
- `apps/server/src/modules/referral/services/referral.service.ts`
- related repositories / DTOs as needed

#### Implementation Notes

- extend sign-in input only as needed to accept optional referral code
- for brand-new users signing in with referral code:
  - create user
  - bind inviter
  - issue invite code for the newly bound user
- for new users without referral code:
  - create user without inviter
  - do not issue invite code yet
- for manual bind on existing eligible users:
  - preserve current button/API
  - issue invite code at successful first bind if absent
- keep operations transactional and idempotent

#### Risks

- duplicate user creation / duplicate bind edge cases
- self-referral or invalid code handling
- regression in existing sign-in flow

#### Verification Commands

- `pnpm --dir apps/server test -- --runInBand`
- `pnpm --dir apps/server build`

#### Expected Outputs

- backend supports referred and non-referred onboarding correctly

### Milestone 4: DApp Referral Link Intake and Team Page UX

#### Goal

Update DApp login bootstrap and `/team` presentation to match the new contract.

#### Affected Files / Modules

- `apps/dapp/src/components/wallet-button.tsx`
- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/dapp/src/store/*` or helper utilities if referral-code persistence is needed

#### Implementation Notes

- capture `ref` from URL
- persist it only long enough to finish first authenticated sign-in
- team page should:
  - show share link + share code + QR code when available
  - show only bind UI when no inviter/no share code
  - preserve manual bind CTA
- copy actions should support both:
  - code copy
  - link copy
- QR rendering should derive from the same canonical share link

#### Risks

- referral code getting lost across wallet connect/signature round trip
- stale UI state after bind success
- QR renderer compatibility / bundle-size overhead if dependency choice is poor

#### Verification Commands

- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp build`

#### Expected Outputs

- `/team` reflects the intended business state cleanly

### Milestone 5: Manual and Local Integration Verification

#### Goal

Verify the three primary user journeys end-to-end in local fork-anvil/DApp.

#### Affected Files / Modules

- no new modules required beyond test helpers / execution log updates

#### Implementation Notes

- verify:
  - new user through referral link auto-binds and receives share code/link/QR
  - new user without referral link sees bind UI and no share code/link/QR
  - manual bind grants share code/link/QR afterward
- verify existing manual bind button still works

#### Risks

- wallet auth state and query caching may mask first-login behavior

#### Verification Commands

- `PROMOTION_ENV=fork-anvil pnpm --dir apps/dapp env:dev`
- manual browser verification on `/team`
- targeted server tests if added

#### Expected Outputs

- execution evidence for all three core flows

## 7. Approval Checkpoint

Do not implement until this plan is approved, because the requirement changes onboarding behavior and referral-code issuance semantics across `dapp + server`.

## 8. Rollback / Recovery Notes

- keep backend change small and reversible around auth/referral issuance logic
- if onboarding regressions appear, rollback to:
  - immediate invite-code issuance on create
  - manual bind only
- avoid destructive data rewrites for existing users during this iteration

## 9. Final Verification Checklist

- first login with referral link auto-binds inviter
- first login with referral link receives own share code/link/QR after binding
- first login without referral link does not show own share code/link/QR
- manual bind still works for eligible users without inviter
- share link includes referral code
- QR encodes the same canonical share link shown in the UI
- no duplicate bind or duplicate share-code issuance regression
- `packages/common` build passes if touched
- `apps/server` build/tests pass where relevant
- `apps/dapp` lint/typecheck/build pass
- `execution.md` reflects actual commands and outcomes
