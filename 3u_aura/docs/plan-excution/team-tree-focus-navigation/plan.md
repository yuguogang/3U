# Team Tree Focus Navigation

## 1. Objective

Add subtree focus navigation to the `/team` tree so an operator can tap a visible node, make that node the current tree focus, continue exploring from that subtree, and return to the original root without losing orientation.

This task should reduce the current “deep tree gets narrower every level” problem by combining:

1. subtree re-rooting via an explicit focus query
2. breadcrumb / return-to-root navigation
3. tree container width rules that expand by content instead of endlessly compressing descendant nodes

The target experience is:

1. default entry still opens at the inviter/root subtree
2. any visible node can become the next focus root
3. the user can move deeper without always rendering the original root at the top
4. the user can return to the original root in one action
5. tree cards and leaves stop collapsing into unusably narrow columns when depth grows

## 2. Scope

- Extend the subtree snapshot contract to support an optional focus node id
- Keep subtree access restricted to the current inviter-visible tree only
- Re-root subtree results on the requested focus node when valid
- Update DApp query plumbing so focus changes trigger a refetch of the subtree snapshot
- Add focus-mode UI on `/team`:
  - focus action on nodes
  - breadcrumb or focus trail
  - return-to-root control
  - state reset rules for invalidated selection/placement context
- Improve tree layout scalability:
  - width by content instead of repeated shrink-to-fit
  - horizontal overflow where needed
  - minimum node/card widths for deep branches
- Add focused verification for both server authorization logic and DApp tree navigation behavior

## 3. Out of Scope

- Changing binary-tree placement business rules
- Rebinding, moving, or re-parenting already placed members
- Making nodes draggable as a topology mutation
- Changing inviter / parent / teamPosition semantics
- Full tree virtualization or canvas-based rendering
- Persisting focus mode in URL or cross-session storage for this first iteration
- Admin console changes
- Contract or schema migration work

## 4. Assumptions

- The desired behavior is “focus a node that is already visible in the current tree”, not arbitrary free search across all descendants
- `focusUserId` is optional; omitting it must preserve the current behavior exactly
- Focus is limited to nodes inside the current inviter subtree; any node outside that boundary must be rejected
- The first implementation may keep breadcrumb history in DApp state rather than adding a new server-side breadcrumb payload
- When focus changes, stale placement selections may be cleared if the selected parent/slot is no longer visible
- The current `/team` page remains the orchestrator for focus state and placement state
- Existing detail-sheet / inline-expansion behavior should continue to work, but may reset to a safe default when subtree focus changes

## 5. Architecture Impact

### Shared Contracts

- `packages/common/src/validators/promotion.ts`
  - extend `TeamTreeSnapshotQuerySchema` with an optional `focusUserId`
- `packages/common/src/models/promotion.ts`
  - confirm whether the existing `rootUserId` remains sufficient once the returned subtree is re-rooted on focus
  - keep response changes minimal unless frontend research during implementation proves extra metadata is required

### Server

- `apps/server/src/modules/tree/dto/tree-snapshot-query.dto.ts`
  - inherit the new optional focus query field
- `apps/server/src/modules/tree/tree.controller.ts`
  - keep controller thin; only pass validated query through
- `apps/server/src/modules/tree/services/tree-topology.service.ts`
  - resolve inviter root as today
  - validate optional focus node belongs to inviter subtree
  - switch subtree ancestor from inviter root to focus node when provided
  - preserve idempotent, read-only snapshot semantics
- `apps/server/src/modules/tree/repositories/team-closure.repository.ts`
  - add or refine a repository helper that can validate whether a requested focus node is inside a given ancestor subtree without leaking policy into controller/service branches
- `apps/server/src/modules/tree/services/tree-topology.service.spec.ts`
  - add tests for allowed focus, rejected focus, and unchanged legacy snapshot behavior

### DApp

- `apps/dapp/src/api/promotion.ts`
  - pass `focusUserId` in subtree requests
- `apps/dapp/src/queries/promotion.query.ts`
  - include focus in query keys so cache separation is correct
- `apps/dapp/src/components/pages/team-page.tsx`
  - own focus state, breadcrumb stack, return-to-root action, and safe reset of placement-related state on focus changes
- `apps/dapp/src/components/team/team-tree-view.tsx`
  - expose a focus action on visible nodes
  - preserve existing select-slot and expand/collapse behavior
  - support layout rules that allow deep branches to expand horizontally
- `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - add a compact “Focus subtree” affordance without overloading placement controls
- `apps/dapp/src/components/team/team-tree-utils.ts`
  - may need a helper to compute breadcrumb path client-side from current snapshot before focus changes

## 6. Milestones

### Milestone 1: Shared + Server Focus Query Contract

- Goal:
  - make subtree snapshots optionally re-rootable by a validated `focusUserId`
- Affected files/modules:
  - `packages/common/src/validators/promotion.ts`
  - `packages/common/src/models/promotion.ts`
  - `apps/server/src/modules/tree/dto/tree-snapshot-query.dto.ts`
  - `apps/server/src/modules/tree/tree.controller.ts`
  - `apps/server/src/modules/tree/services/tree-topology.service.ts`
  - `apps/server/src/modules/tree/repositories/team-closure.repository.ts`
  - `apps/server/src/modules/tree/services/tree-topology.service.spec.ts`
- Implementation notes:
  - keep current behavior as the default path when `focusUserId` is absent
  - validate that the requested focus node belongs to the current inviter subtree before listing nodes
  - use repository-level subtree checks so business policy stays explicit and testable
  - continue returning relative depths from the chosen subtree root
  - ensure occupied-slot summary and open child positions still reflect the re-rooted subtree correctly
- Risks:
  - accidentally allowing focus outside the inviter subtree
  - returning inconsistent depth/root metadata when focus is active
  - breaking current clients that rely on legacy no-focus behavior
- Verification commands:
  - `pnpm --dir apps/server test -- tree-topology.service.spec.ts`
  - `pnpm --dir apps/server build`
- Expected outputs:
  - subtree snapshot can be requested for a validated descendant focus node
  - invalid focus requests are rejected safely
  - legacy `/api/v1/tree/subtree?depth=N` behavior remains unchanged

### Milestone 2: DApp Focus State, Breadcrumb, and Return Flow

- Goal:
  - let the operator move focus deeper into the tree and return to the original root cleanly
- Affected files/modules:
  - `apps/dapp/src/api/promotion.ts`
  - `apps/dapp/src/queries/promotion.query.ts`
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/team/team-tree-view.tsx`
  - `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - `apps/dapp/src/components/team/team-tree-utils.ts`
- Implementation notes:
  - store current focus node id in page state
  - compute a breadcrumb/history stack before switching focus so the user can return to the original root
  - add a node-level action that is clearly different from “open details” and “select placement slot”
  - when focus changes, clear or recompute invalid placement state:
    - selected parent
    - selected slot
    - dragging/selected pending target
  - preserve current subtree expansion defaults as much as possible, but prefer correctness over clever state retention
- Risks:
  - interaction overload if focus action competes visually with expand/details/placement controls
  - breadcrumb desynchronization if focus state changes after data refresh
  - stale placement state pointing to nodes no longer in the visible subtree
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - manual: open `/team`, focus a visible descendant, verify breadcrumb/return action, and confirm placement UI resets safely when focus hides the previous target
- Expected outputs:
  - tapping focus on a visible node refetches and shows that node as the new subtree root
  - breadcrumb or equivalent focus trail appears
  - “Back to root” restores the inviter-root snapshot

### Milestone 3: Deep-Tree Layout Hardening

- Goal:
  - stop deep trees from collapsing leaf nodes and cards into unreadable narrow columns
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/team/team-tree-view.tsx`
  - `apps/dapp/src/components/team/team-tree-node-card.tsx`
- Implementation notes:
  - make the tree render at content width rather than forcing every nested branch into the parent’s current width
  - add horizontal overflow at the tree container level instead of squeezing descendants
  - introduce minimum widths for collapsed/expanded nodes so labels and controls remain usable
  - verify branch connectors still align once widths are no longer purely percentage-based
  - keep mobile behavior intentional: scroll horizontally when needed instead of clipping
- Risks:
  - connector SVG alignment may drift when switching from percentage compression to content-width layout
  - expanded cards may still dominate narrow screens if minimums are too large
  - horizontal overflow could feel uncontrolled without sensible padding and centering
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
  - manual: load `/team` with depth 4-8 on fork env, confirm leaf nodes no longer overlap or clip and tree can pan horizontally
- Expected outputs:
  - deep branches remain legible
  - cards do not become abnormally skinny
  - users can explore larger trees without always seeing the original root

### Milestone 4: Regression and Fork-Env Validation

- Goal:
  - verify the new focus navigation does not regress placement semantics or team-tree safety
- Affected files/modules:
  - `apps/server/src/modules/tree/services/tree-topology.service.spec.ts`
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/team/*`
  - optional targeted E2E/manual notes under `apps/e2e/phase94` only if needed during execution
- Implementation notes:
  - validate both legacy root mode and focused subtree mode
  - verify direct-referral vs subtree-descendant semantics remain presentation-only
  - verify slot targeting still operates on actual `parentId + teamPosition`, not breadcrumb history
  - document any manual-only gaps if a focused E2E is not added in this iteration
- Risks:
  - focus mode masking placement bugs that only show when returning to root
  - test coverage remaining too server-heavy if DApp behavior is only manually checked
- Verification commands:
  - `pnpm --dir apps/server test -- tree-topology.service.spec.ts`
  - `pnpm --dir apps/server build`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
  - manual: fork-anvil `/team` flow covering root view, focus descendant, return to root, select slot, focus another node, and confirm UI state remains coherent
- Expected outputs:
  - focus mode is safe, bounded, and does not change placement business rules
  - both server and DApp verification evidence are recorded in `execution.md`

## 7. Approval Checkpoint

Implementation should not begin until this plan is approved.

Approval for this task means agreement on:

1. the server contract change to support optional `focusUserId`
2. the DApp interaction model of:
   - focus subtree
   - breadcrumb / focus trail
   - back to original root
3. the layout strategy of content-width tree + horizontal overflow instead of further compressing deep descendants

If any of those three decisions change, this plan should be updated before coding starts.

## 8. Rollback / Recovery Notes

- Keep `focusUserId` optional and additive so removing focus mode is a small revert
- Preserve the current root-based subtree query path as the default branch throughout implementation
- If DApp focus mode proves unstable, frontend can temporarily disable the focus affordance while keeping server support dormant
- If content-width layout introduces unacceptable connector regressions, revert the layout hardening separately from the server query changes
- Record any temporary feature-flag or guarded UI behavior in `execution.md` if used during implementation

## 9. Final Verification Checklist

- [ ] `TeamTreeSnapshotQuery` supports optional `focusUserId` without breaking existing callers
- [ ] Server rejects focus requests outside the inviter subtree
- [ ] Legacy subtree snapshot behavior still works with no focus query
- [ ] `/team` can focus a visible node and refetch that subtree as the new root
- [ ] `/team` can return to the original root cleanly
- [ ] Placement selection state is reset or preserved safely when focus changes
- [ ] Deep tree layout no longer squeezes descendant nodes into unreadable widths
- [ ] `pnpm --dir apps/server test -- tree-topology.service.spec.ts` passes
- [ ] `pnpm --dir apps/server build` passes
- [ ] `pnpm --dir apps/dapp lint` passes
- [ ] `pnpm --dir apps/dapp typecheck` passes
- [ ] `pnpm --dir apps/dapp build` passes
- [ ] `execution.md` records actual commands, results, and any deviations from this plan
