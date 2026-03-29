## Objective
- Replace the default inviter-operated manual placement happy path with automatic placement that follows the business rule:
  weak-leg priority first, then single-line depth placement inside the chosen leg.
- Preserve auditability, idempotency, and recoverability for referral binding and tree placement.

## Scope
- Introduce a deterministic server-side auto-placement policy for inviter-bound users.
- Trigger auto-placement during the existing signin/onboarding flow after inviter binding.
- Keep manual placement as an exception/fallback path for repair or edge cases rather than the default customer journey.
- Update DApp UX so normal users no longer depend on manual pending-placement operations in the happy path.
- Add/adjust tests for success, idempotent retry, and tree-conflict edge cases.

## Out of Scope
- Changing reward, settlement, claim, or NFT eligibility rules.
- Reworking the referral invite-link format itself.
- Replacing existing admin/operator repair capabilities.
- Changing canonical binary-tree ownership semantics: only the direct inviter subtree remains valid for placement.

## Assumptions
- Approved business rule is:
  weak-leg priority determines the destination big leg
  single-line depth means the system extends one outer spine inside that chosen leg instead of filling nearby slots breadth-first.
- “Do not raise lazy users” is a product requirement, so breadth-first nearest-slot placement is intentionally rejected.
- Pending placement should remain available only for exception handling:
  full subtree
  invalid inviter subtree state
  conflict/retry anomalies
  historical repair needs

## Architecture Impact
- Core placement policy changes in the server domain layer, likely centered around:
  [`apps/server/src/modules/tree/services/tree-topology.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.ts)
  [`apps/server/src/modules/tree/engines/placement-policy.engine.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/engines/placement-policy.engine.ts)
  [`apps/server/src/modules/tree/repositories/team-closure.repository.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/repositories/team-closure.repository.ts)
- Signin/onboarding flow changes in:
  [`apps/server/src/auth/services/auth.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts)
- DApp team page behavior changes in:
  [`apps/dapp/src/components/pages/team-page.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
  [`apps/dapp/src/queries/promotion.query.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/promotion.query.ts)
- This is a critical tree/business-rule change because it affects eligibility to share referral links and downstream topology growth.

## Milestones

### Milestone 1
- Goal:
  Define and implement the automatic placement selection algorithm in the server domain layer.
- Affected files/modules:
  [`apps/server/src/modules/tree/engines/placement-policy.engine.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/engines/placement-policy.engine.ts)
  [`apps/server/src/modules/tree/repositories/team-closure.repository.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/repositories/team-closure.repository.ts)
  [`apps/server/src/modules/tree/services/tree-topology.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.ts)
- Implementation notes:
  Add a deterministic selector that:
  1. resolves the inviter subtree root
  2. compares left/right leg state to determine weak-leg priority
  3. traverses only the chosen leg’s outer spine to find the first legal slot
  4. returns a concrete `(parentId, teamPosition)` target or a structured “no auto slot” result
  Keep manual `bindPlacementForInviter` intact.
- Risks:
  Weak-leg definition may be ambiguous if based on subtree size vs volume vs open-slot depth.
  Depth-line traversal must be deterministic and stable under retries.
  Full-leg / missing-root / malformed-tree cases must fail safely rather than auto-place incorrectly.
- Verification commands:
  `pnpm --dir apps/server test -- --runInBand tree-topology`
  `pnpm --dir apps/server test -- --runInBand referral`
- Expected outputs:
  New tests prove chosen-leg and single-line placement behavior.

### Milestone 2
- Goal:
  Integrate auto-placement into signin/onboarding and fallback behavior.
- Affected files/modules:
  [`apps/server/src/auth/services/auth.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts)
  [`apps/server/src/modules/tree/services/tree-topology.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/tree/services/tree-topology.service.ts)
  [`apps/server/src/modules/referral/services/referral.service.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/referral/services/referral.service.ts) if orchestration needs extraction
- Implementation notes:
  After successful inviter bind during onboarding/signin recovery, attempt auto-placement within the same transactional flow if possible.
  If auto-placement cannot produce a legal slot, preserve the current pending-placement state and record auditable reasoning.
  Ensure invite-code issuance still occurs only after confirmed placement.
- Risks:
  Combining bind+place in signin increases transaction complexity.
  Retry/idempotency must not double-place or reissue inconsistent invite codes.
  Failure semantics must be explicit so pending state remains understandable.
- Verification commands:
  `pnpm --dir apps/server test -- --runInBand auth`
  `pnpm --dir apps/server test -- --runInBand tree-topology`
- Expected outputs:
  Normal referred signup lands directly in-tree and becomes share-ready.
  Fallback cases remain pending without corrupting tree state.

### Milestone 3
- Goal:
  Align DApp UX with auto-placement-first behavior while keeping repair/fallback visibility.
- Affected files/modules:
  [`apps/dapp/src/components/pages/team-page.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx)
  [`apps/dapp/src/queries/promotion.query.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/promotion.query.ts)
  relevant localized copy files under `apps/dapp/messages/`
- Implementation notes:
  Remove manual placement as the default customer journey.
  Keep pending-placement UI only when the backend actually reports fallback cases.
  Update share-state messaging to reflect “auto placement complete” vs “exception pending”.
- Risks:
  UI could still imply manual placement is the normal path if copy is not tightened.
  Existing team-page interactions may need pruning to avoid confusing mixed modes.
- Verification commands:
  `pnpm --dir apps/dapp typecheck`
  `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
- Expected outputs:
  Team page reflects auto-placement-first behavior without breaking share-link access.

### Milestone 4
- Goal:
  Verify the complete flow and document deviations/fallback behavior.
- Affected files/modules:
  [`docs/plan-excution/weak-leg-single-line-auto-placement/execution.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/weak-leg-single-line-auto-placement/execution.md)
- Implementation notes:
  Validate:
  new referred signup
  auto-placement into weak leg
  invite-code issuance after placement
  retry/idempotent signin
  fallback to pending when no legal auto slot exists
- Risks:
  Local test fixtures may not cover all leg-shape edge cases without targeted unit tests.
- Verification commands:
  `pnpm --dir apps/server test`
  `pnpm --dir apps/dapp typecheck`
  `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
- Expected outputs:
  Execution log contains real evidence for server and dapp validation.

## Approval Checkpoint
- Proposed implementation direction:
  adopt `weak-leg priority + single-line depth placement` as the automatic default
  keep manual placement only as fallback/repair
  integrate auto-placement into signup/signin referral onboarding

## Rollback / Recovery Notes
- If auto-placement introduces unsafe topology changes, revert the onboarding integration first and restore pending-placement as the default path.
- If the selector algorithm is disputed, keep the integration scaffolding but disable the selector behind a server-side guard or revert the policy changes.
- Preserve existing audit logging and frozen-placement safeguards during rollback.

## Final Verification Checklist
- Auto-placement follows weak-leg priority and single-line depth behavior.
- Signin referral onboarding auto-places users when a legal slot exists.
- Invite codes are still issued only after confirmed placement.
- Manual placement remains available only for fallback/repair paths.
- Server tests and relevant DApp validation pass.
- `execution.md` records actual commands, results, and any deviations.
