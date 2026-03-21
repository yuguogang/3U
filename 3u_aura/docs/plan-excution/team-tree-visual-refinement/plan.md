# Team Tree Visual Refinement

## 1. Objective

Refine the `/team` tree display and placement flow so mobile users can quickly understand:

1. where they are in the binary tree
2. which pending member is being placed
3. which node/side will receive that placement
4. whether the next action is “bind”, “wait for upstream placement”, or “place a descendant”

This task builds on the completed visual tree placement foundation and focuses on UX clarity, node semantics, and placement affordance quality. It does **not** change binary-tree rules, server business policy, or already-placed member topology.

The refined target experience should support:

1. icon-first tree display, with detailed node information shown on tap/click (and hover on desktop where available)
2. expand / collapse behavior so subtree navigation stays compact
3. different visual treatment for direct-referral relationship vs merely being inside the operator subtree
4. drag-like placement for **pending** members only, with explicit confirmation before mutation
5. a tighter, more elegant structure than the current always-open card stack

## 2. Scope

- Refine `apps/dapp` `/team` tree presentation and placement interaction
- Improve visual differentiation between:
  - root node
  - direct-referral node
  - subtree-descendant node
  - internal node
  - leaf node
  - occupied node
  - selectable open slot
  - selected pending member
- Improve pending placement selection UX for mobile
- Add expandable/collapsible tree navigation for compact browsing
- Add node detail reveal interaction:
  - mobile: tap
  - desktop: click, with hover as optional enhancement
- Add constrained drag-style placement affordance for pending members into valid open slots
- Improve “placement confirmation” readability so the operator always knows:
  - selected pending member
  - selected parent node
  - selected side (`LEFT` / `RIGHT`)
- Improve empty/loading/error states around tree snapshot and placement
- Add tree-level guidance so the user understands why they may not yet be share-ready or why deeper placement is possible beyond the inviter’s first two direct children

## 3. Out of Scope

- Server API changes
- Contract changes
- Rebinding already placed members
- Drag-and-drop mutation of existing placed tree topology
- New `POST /api/team/rebind` semantics
- Changes to `inviterId`, `parentId`, `teamPosition`, or volume business rules
- Full tree virtualization or lazy child expansion beyond light UI preparation
- ENS resolution implementation (node layout should leave room for it, but no new ENS fetch layer is required here)

## 4. Assumptions

- The current subtree snapshot API from `team-tree-visual-placement` is sufficient for this refinement iteration
- Placement still uses the current `bindPlacement` mutation
- Mobile-first interaction remains click/tap based, with drag-style behavior limited to pending-member selection and valid slot targeting
- Current tree depth is still small enough that refinement can focus on clarity before virtualization
- Pending users are placed one at a time; placement mode should therefore bias toward reducing ambiguity, not maximizing parallel manipulation
- “Direct push” and “tree placement” are not identical:
  - `inviterId` = referral relationship
  - `parentId` + `teamPosition` = tree placement relationship
- Any visual distinction between “direct referral” and “subtree descendant” must preserve that semantic difference instead of collapsing them into one concept

## 5. Architecture Impact

### DApp

- `apps/dapp/src/components/pages/team-page.tsx`
  - currently carries too much placement-mode orchestration and should be clarified, but can remain the coordinator for this task
- `apps/dapp/src/components/team/team-tree-view.tsx`
  - should better communicate subtree shape, expand/collapse state, and selected placement target
- `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - should distinguish node role/status more clearly and support compact detail-reveal behavior
- `apps/dapp/src/components/team/team-tree-pending-summary.tsx`
  - should remain high-level summary only, not absorb pending member card UX
- New small DApp-only refinements may be added under `apps/dapp/src/components/team/*` if needed for:
  - pending member pills/cards
  - selection status row
  - placement mode hint block
  - expand/collapse control
  - node detail popover/sheet

### Shared / Server

- No contract changes expected
- No business-rule changes expected
- Only additive presentation logic on top of existing snapshot payload

## 6. Current UX Gaps To Address

### 6.1 Tree Readability Gap

Current tree rendering proves the backend supports subtree placement, but it still feels developer-facing:

- node cards are information-dense without clear hierarchy cues
- open slots read as technical state more than user action targets
- internal-node vs leaf-node distinction is too subtle
- direct-referral vs deeper-subtree descendants are not visually separated enough
- everything stays too “fully open”, so the page consumes too much space for routine browsing

### 6.2 Placement Flow Gap

Current placement flow is technically correct but still cognitively split:

- pending member is chosen in one section
- target slot is chosen in another section
- confirmation is in a third section

This is safer than drag-and-drop, but still needs stronger visual continuity.

The refinement target is not unconstrained drag-and-drop. It is:

- pending member feels draggable/selectable
- tree slots feel like clear drop targets
- actual mutation still passes through an explicit confirmation step

### 6.3 “Only Two Slots” Perception Gap

Even with subtree snapshots available, users can still infer that placement is limited to the current user’s direct two children if:

- the tree does not visually emphasize deeper available branches
- open slots do not glow or stand out once a pending member is selected
- placement helper copy does not explicitly say “any open node inside your subtree”
- collapsed vs expanded subtree context is not helping the operator understand deeper branches

### 6.4 Root / Awaiting / Share-Ready State Gap

The `/team` page now has better state logic, but visual explanation is still not strong enough. The page should make it immediately obvious whether the user is:

- root and share-ready
- bound but awaiting their own upstream placement
- fully placed and able to grow their subtree

### 6.5 Node Detail Interaction Gap

Users should not need every node card fully expanded all the time. The refined tree should make the compact state beautiful and scannable, and reveal rich node information only when requested.

## 7. Milestones

### Milestone 1: Refine Node Visual Semantics

- Goal:
  - make node role/status readable at a glance
- Affected files/modules:
  - `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - `apps/dapp/src/components/team/team-tree-placement-legend.tsx`
- Implementation notes:
  - distinguish root / internal / leaf visually
  - distinguish direct-referral nodes from deeper subtree descendants
  - use icon semantics that match the current node state:
    - root
    - team-bearing node
    - leaf
    - direct-referral marker
  - replace text-heavy open-slot pills with clearer icon-led affordances while preserving accessibility text
  - make selected slot state much more visually explicit than ordinary “open”
- Risks:
  - over-styling at the cost of readability
  - losing clarity on mobile if icon-only affordances are too compact
- Verification commands:
  - `pnpm --dir apps/dapp lint`
- Expected outputs:
  - node state and slot state are easier to scan without reading every label

### Milestone 2: Pending Placement Card Refinement

- Goal:
  - turn pending member selection into a compact, touch-friendly, low-ambiguity interaction
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - optional new helper under `apps/dapp/src/components/team/*`
- Implementation notes:
  - replace the current generic pending list cards with compact member chips/cards
  - selected state should be unmistakable
  - cards should feel “movable” without implying unsupported rebind mutation
  - include:
    - avatar/identicon
    - truncated wallet
    - joined date or lightweight context
    - selected indicator
    - drag handle affordance
- Risks:
  - making cards too small for reliable tap targets
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
- Expected outputs:
  - pending user selection becomes quick and obvious on mobile

### Milestone 3: Placement Mode & Slot Highlight Refinement

- Goal:
  - make the relationship between selected pending member and valid open slots visually continuous
- Affected files/modules:
  - `apps/dapp/src/components/team/team-tree-view.tsx`
  - `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - `apps/dapp/src/components/pages/team-page.tsx`
- Implementation notes:
  - when a pending member is selected:
    - all valid open slots become visually elevated
    - the chosen slot becomes clearly “locked in”
  - support constrained drag-style interaction:
    - pick pending member
    - drag or pseudo-drag toward valid slot
    - fall back to tap-select on mobile or where drag is unreliable
    - always require final confirmation before mutation
  - add a placement-mode hint row above or inside the tree
  - explicitly teach that placement may target any open node inside the inviter subtree, not just the inviter’s own direct left/right
- Risks:
  - too much glow/motion becoming noisy
  - drag affordance becoming misleading if not tightly constrained to pending members only
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
- Expected outputs:
  - users can tell exactly where placement is possible before they confirm

### Milestone 4: Placement Confirmation Context Upgrade

- Goal:
  - make final confirmation read like a precise action summary instead of a generic form footer
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
- Implementation notes:
  - confirmation block should show:
    - selected pending member
    - target parent node
    - target side
    - short consequence statement
  - if drag-style targeting is used, confirmation should still render the final chosen target in plain text before submit
  - should degrade gracefully when either selection is missing
  - mutation state should remain close to the confirmation block
- Risks:
  - duplicate information between tree card and confirmation block
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
- Expected outputs:
  - placement confirmation is understandable without re-reading the full tree

### Milestone 5: Tree State Messaging Refinement

- Goal:
  - improve top-level explanation of tree state and growth readiness
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/team/team-tree-pending-summary.tsx`
  - `apps/dapp/src/components/team/team-tree-placement-legend.tsx`
- Implementation notes:
  - clarify distinctions among:
    - root share-ready
    - awaiting own placement
    - share unlocked after placement
    - no pending members
    - direct referral vs placed child vs deeper subtree descendant
  - refine copy so the page teaches the binary-tree flow rather than just exposing raw sections
  - keep copy concise and operational
- Risks:
  - copy changes drifting from actual business rules
- Verification commands:
  - `pnpm --dir apps/dapp lint`
- Expected outputs:
  - fewer ambiguous states on `/team`

### Milestone 6: Manual Mobile Walkthrough Validation

- Goal:
  - validate the refined flow in the live `fork-anvil` environment
- Affected files/modules:
  - `docs/plan-excution/team-tree-visual-refinement/execution.md`
- Implementation notes:
  - verify:
    - root sees visually clear subtree
    - pending member selection is obvious
    - open slot highlighting is understandable
    - compact tree can be expanded/collapsed without losing orientation
    - node details can be revealed on demand without making the default view bloated
    - placement confirmation reads clearly
    - placed user sees their share assets unlock as before
  - test at least:
    - root -> userA
    - userA -> userB
- Risks:
  - wallet switching causing stale state during manual validation
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
  - manual validation on `http://127.0.0.1:3200/team`
- Expected outputs:
  - execution log with real observations on the refined tree UX

## 8. Approval Checkpoint

Do not implement until approved. This is a Major DApp refinement task because it touches the primary team-growth interaction and can confuse placement behavior if executed sloppily, even though it does not change server or contract rules.

## 9. Rollback / Recovery Notes

- Keep tree snapshot API and placement business rules unchanged
- Constrain edits to DApp presentation and selection flow
- If the refined interaction becomes too dense, revert to:
  - existing tree snapshot rendering
  - existing placement confirmation
  - existing pending list cards

## 10. Final Verification Checklist

- Tree node role/state is visually clearer than the current baseline
- Direct-referral vs deeper-subtree nodes are visually distinguishable without confusing inviter vs parent semantics
- Pending placement cards are mobile-friendly and clearly selectable
- Selecting a pending member highlights valid subtree placement targets
- Tree supports compact browsing through expand/collapse behavior
- Node detail can be revealed on demand via tap/click, with hover optional on desktop
- Open slots are understandable without reading technical labels
- If drag-style placement is introduced, it remains restricted to pending members and still requires explicit confirmation
- Placement confirmation clearly summarizes member + parent + side
- `/team` better explains root / awaiting / placed share states
- Existing placement mutation flow remains unchanged
- No rebind / already-placed-node movement is introduced
- `pnpm --dir apps/dapp lint` passed
- `pnpm --dir apps/dapp typecheck` passed
- `pnpm --dir apps/dapp build` passed
- `execution.md` records real implementation and live validation evidence
