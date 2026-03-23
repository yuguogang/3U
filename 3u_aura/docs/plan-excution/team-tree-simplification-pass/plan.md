# Team Tree Simplification Pass

## 1. Objective

Simplify the `/team` tree interaction and visual language so the mobile tree stays readable without repeated or low-signal controls.

This pass is specifically about removing redundant UI and replacing heavy placement affordances with cleaner slot semantics. It does **not** change subtree focus, binary-tree rules, or placement permissions.

The target experience is:

1. one obvious way to expand a branch
2. fewer repeated labels around every split
3. empty / open positions rendered as actual slot placeholders instead of extra floating action buttons
4. less visual noise around occupied nodes so the tree reads more like structure and less like a legend demo

## 2. Scope

- Refine the DApp `/team` tree presentation in `apps/dapp`
- Remove or consolidate redundant expand controls on team-bearing nodes
- Reduce repeated left/right branch chrome when the tree geometry already communicates branch side
- Remove or soften occupied-state lock affordances where they do not add decision value
- Replace standalone left/right placement arrow buttons with cleaner empty-slot placeholders when the user is choosing a placement target
- Keep placement selection, drag-drop targeting, focus navigation, and node detail expansion working
- Update any related legend / translation copy so the UI matches the simplified interaction

## 3. Out of Scope

- Server API changes
- Shared contract changes
- Tree focus / breadcrumb behavior changes
- Binary-tree business rule changes
- Rebinding or moving existing placed members
- Full visual redesign of the `/team` page outside the tree components

## 4. Assumptions

- The current subtree data contract is already sufficient for this simplification pass
- The user prefers structural clarity over explicitly labeling every branch with text chips
- A single expand affordance is enough when it remains discoverable and accessible
- “Open slot” should be represented inline in the tree rather than by detached arrow buttons where possible
- Placement still needs accessible labels and explicit confirmation, even if the visible UI becomes more minimal

## 5. Architecture Impact

### DApp

- `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - likely remove the bottom lock-only occupied badge in collapsed mode
  - likely reduce or repurpose per-node placement controls
  - likely keep only one branch expand affordance
- `apps/dapp/src/components/team/team-tree-view.tsx`
  - likely remove always-visible `LEFT` / `RIGHT` pills above both child columns
  - likely turn empty child columns into clearer inline open-slot placeholders
  - likely remove the separate “expand N children” button if node-level chevron remains the primary branch control
- `apps/dapp/src/components/team/team-tree-placement-legend.tsx`
  - legend entries must match the simplified tree interaction
- `apps/dapp/messages/*/common.json`
  - any removed controls / labels must have matching message cleanup

### Shared / Server

- No impact expected

## 6. Current UX Gaps

### 6.1 Expand Control Duplication

- team-bearing nodes currently show a chevron on the node itself
- collapsed branches also show a separate `展开 N 个子节点` button below
- these controls communicate the same action and compete for attention

### 6.2 Branch Label Repetition

- each split renders visible `左区` / `右区` chips above the child columns
- the connector layout already establishes left/right relationship
- repeated branch chips consume width and add scanning noise on deep trees

### 6.3 Occupied Lock Noise

- collapsed nodes without open slots show a dedicated lock badge/button area
- this advertises “nothing to do here” more loudly than needed
- the occupied state can be implied by the absence of an open slot affordance

### 6.4 Placement Arrow Noise

- open child positions currently render as detached circular arrow buttons
- this makes the tree feel more control-heavy than structure-first
- empty child placeholders can communicate both “this branch is empty” and “you may place here” with less clutter

## 7. Milestones

### Milestone 1: Tree Interaction Simplification

- Goal:
  - reduce duplicated controls so each branch has one clear expand path and one clear placement target style
- Affected files/modules:
  - `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - `apps/dapp/src/components/team/team-tree-view.tsx`
- Implementation notes:
  - keep the node chevron as the primary expand affordance
  - remove the separate collapsed “expand children” button if subtree discoverability remains acceptable
  - remove lock-only occupied badges in collapsed mode
  - preserve accessible labels on any remaining interactive elements
- Risks:
  - oversimplifying branch affordances so users miss how to expand
  - reducing occupied-state clarity too far for first-time users
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
- Expected outputs:
  - fewer redundant controls around each node

### Milestone 2: Inline Slot Placeholder Redesign

- Goal:
  - render empty child positions as clean inline slot placeholders instead of floating arrow buttons
- Affected files/modules:
  - `apps/dapp/src/components/team/team-tree-node-card.tsx`
  - `apps/dapp/src/components/team/team-tree-view.tsx`
  - optional helper under `apps/dapp/src/components/team/*`
- Implementation notes:
  - empty branch column should visually read as a structural slot card/pill
  - selected placement state should still stand out clearly
  - left/right meaning should remain inferable from physical position, with text added only where still necessary for accessibility or confirmation
  - if drag/drop remains enabled, placeholders must still accept drops
- Risks:
  - making empty slots look disabled instead of actionable
  - losing left/right semantics if the placeholder design becomes too neutral
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - tree looks cleaner while placement remains obvious

### Milestone 3: Legend / Copy Alignment

- Goal:
  - ensure help copy and legend match the simplified tree semantics
- Affected files/modules:
  - `apps/dapp/src/components/team/team-tree-placement-legend.tsx`
  - `apps/dapp/messages/*/common.json`
- Implementation notes:
  - remove legend items for controls no longer shown
  - prefer explaining “empty slot” over “left-arrow button / right-arrow button”
  - keep onboarding hints short and high-signal
- Risks:
  - stale copy drifting from the final UI
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
- Expected outputs:
  - supporting copy matches the actual simplified tree

## 8. Approval Checkpoint

Do not implement until approved. This is a Major DApp UI refinement because it spans multiple tree components and interaction patterns.

## 9. Rollback / Recovery Notes

- Keep changes DApp-only and localized to tree presentation components
- Avoid changing placement request payloads or confirmation flow
- If placeholder-based slots prove less clear than expected, revert to the current arrow-button affordance without touching focus navigation or subtree rendering

## 10. Final Verification Checklist

- [ ] Branch expansion has one primary affordance instead of duplicated controls
- [ ] Repeated `左区` / `右区` branch chips are removed or materially reduced
- [ ] Occupied nodes no longer spend dedicated space on non-actionable lock chrome
- [ ] Empty/open child positions render as clean inline placeholders while remaining selectable
- [ ] Placement selection and drag/drop still work
- [ ] `pnpm --dir apps/dapp typecheck` passed
- [ ] `pnpm --dir apps/dapp lint` passed
- [ ] `pnpm --dir apps/dapp build` passed
- [ ] `execution.md` records the real work and verification
