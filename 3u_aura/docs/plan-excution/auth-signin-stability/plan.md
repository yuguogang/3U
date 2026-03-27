# Auth Signin Stability

## 1. Objective
- Stabilize the wallet-signin flow so a successful signature login produces a durable authenticated session instead of re-triggering `SIGNIN` on every tab switch.
- Eliminate the current `401 Unauthorized` failures observed on both `auth/signature_message` and `auth/signature_signin`.
- Preserve the existing referral/tree business rule for share-code unlocks while making the UI state easier to reason about during unauthenticated or partially provisioned states.

## 2. Scope
- `apps/server` auth challenge generation, cache/cookie/auth env handling, and any related configuration needed for `testnet-mockusdt`.
- `apps/dapp` signin request flow, credential handling, auth persistence, 401 handling, and auto-login behavior.
- Team/share gating copy or state handling only where needed to distinguish “not logged in” from “logged in but not share-eligible”.
- `testnet-mockusdt` environment config and deployment notes if auth/cache secrets or Redis URLs need correction.

## 3. Out of Scope
- Referral placement policy changes.
- Invite-code issuance policy changes beyond clarifying existing behavior.
- NFT, reward, or settlement business rules unrelated to signin/auth persistence.
- Full redesign of auth architecture beyond what is required to make the current flow reliable.

## 4. Assumptions
- The current repeated signature prompts are unintended behavior.
- A successful signin should survive route changes without re-signing unless the user explicitly disconnects, signs out, or the session truly expires.
- `testnet-mockusdt` Redis currently requires a password, and auth challenge caching may be misconfigured in deployed environments.
- Existing access-token plus refresh-cookie design is intended to work in production, but the dapp is not currently completing that design correctly.

## 5. Architecture Impact
- Backend auth remains NestJS-based with challenge message generation in `AuthService` and cookie issuance in `AuthController`.
- Frontend auth remains wallet-first with Zustand persistence and wagmi connection state, but the session bootstrap / refresh boundary may need tightening.
- Environment/configuration may need explicit Redis password propagation and possibly auth-secret completeness for both local and VPS deployments.
- No contract changes are expected.

## 6. Milestones

### Milestone 1: Reproduce and pinpoint the failing auth path
- Goal
  - Confirm which failures are caused by challenge generation, challenge persistence, signin verification, missing cookies, or aggressive 401 logout behavior.
- Affected files/modules
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/controllers/auth.controller.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/app.module.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/auth.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/fetch.client.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/store/auth.store.ts`
- Implementation notes
  - Trace `signature_message -> signMessage -> signature_signin -> /auth/me` end to end.
  - Verify whether Redis-backed cache is actually writable/readable in `testnet-mockusdt`.
  - Verify whether refresh cookie is ever written and whether the browser sends it.
  - Confirm whether any request 401 is causing premature auth teardown.
- Risks
  - Multiple overlapping auth bugs may be present at once, making the first fix appear incomplete.
- Verification commands
  - `pnpm --dir apps/server build`
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
  - Browser network verification for `signature_message`, `signature_signin`, `auth/me`
- Expected outputs
  - A concrete root-cause matrix with at least one confirmed failure mode and any secondary contributing issues.

### Milestone 2: Fix backend challenge/cache/session correctness
- Goal
  - Make backend auth challenge generation and signin verification deterministic and deployable in `testnet-mockusdt`.
- Affected files/modules
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/controllers/auth.controller.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/app.module.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/server.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
  - Any deployment/runbook docs that must mention new auth/cache env requirements
- Implementation notes
  - If needed, propagate Redis password or authenticated Redis URLs for cache/throttler/bull.
  - Ensure auth env defaults/requirements are explicit enough for deployment.
  - Keep cookie behavior compatible with HTTPS deployment.
- Risks
  - Fixing cache connectivity may surface a second issue in cookie/session handling.
- Verification commands
  - `pnpm --dir apps/server build`
  - Server health/auth endpoint smoke tests
  - Manual `signature_message` and `signature_signin` requests against the environment under test
- Expected outputs
  - `signature_message` reliably returns 200 and `signature_signin` no longer fails due to stale/missing backend challenge state.

### Milestone 3: Fix dapp auth persistence and 401 handling
- Goal
  - Prevent route changes from re-triggering signin after a successful login unless the session is genuinely invalid.
- Affected files/modules
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/auth.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/fetch.client.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/store/auth.store.ts`
  - Any related query/auth bootstrap modules discovered during implementation
- Implementation notes
  - Re-enable cookie credential transport if the backend relies on refresh cookie persistence.
  - Avoid turning every 401 into a hard logout if a refresh/bootstrap attempt should happen first.
  - Keep wallet connection state and app auth state consistent enough that logout behavior is understandable.
- Risks
  - Over-correcting 401 handling could mask legitimate expired/invalid-session states.
- Verification commands
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
  - Manual browser validation: login once, switch among dashboard/team/nft/rewards, confirm no repeated signature prompt
- Expected outputs
  - A single successful signin should survive page navigation without repeated `SIGNIN` prompts.

### Milestone 4: Clarify share-code unlock state and regressions
- Goal
  - Ensure users who are logged in but not share-eligible get an accurate explanation instead of ambiguous auth-looking failure states.
- Affected files/modules
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx`
  - Any shared translation or formatting files needed for clearer copy
- Implementation notes
  - Preserve the existing business rule: share assets unlock only when the user is tree-ready and has an invite code.
  - If needed, sharpen copy for “awaiting binding” vs “awaiting placement” vs “not authenticated”.
- Risks
  - UI-only fixes must not accidentally loosen the underlying share-access gate.
- Verification commands
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
  - Manual team-page validation with at least one non-root / non-placed user state if available
- Expected outputs
  - Team page states remain correct and easier to interpret after auth stabilization.

## 7. Approval Checkpoint
- Wait for user approval before editing code or environment files for this task.
- Once approved, implementation will proceed milestone by milestone with real progress appended to `execution.md`.

## 8. Rollback / Recovery Notes
- Backend auth/cache changes can be reverted by restoring the previous env/config and auth module behavior.
- Frontend auth-flow changes can be rolled back by restoring prior request/logout logic.
- Deployment/env changes must be recorded with exact diffs so VPS rollback is possible if new auth behavior regresses.

## 9. Final Verification Checklist
- `signature_message` returns 200 consistently in the target environment.
- `signature_signin` succeeds with a valid wallet signature.
- Route changes do not trigger repeated re-signin after successful login.
- Wallet-connected but app-logged-out states are either eliminated or clearly represented.
- Team page share section behavior matches the intended invite-code / tree-placement policy.
- Relevant build/tests pass and are recorded in `execution.md`.
