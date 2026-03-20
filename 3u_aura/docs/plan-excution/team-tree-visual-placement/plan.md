# Team Tree Visual Placement

## 1. Objective

Add a visual tree-based placement experience to `/team` so inviter-operated placement is understandable and scalable beyond the first two direct child slots. The UI should make it clear that placement may target any selectable node inside the inviter subtree, not only the inviter's own `LEFT` / `RIGHT`.

## 2. Scope

- Add a tree-oriented placement UX in `apps/dapp` `/team`
- Expose enough tree snapshot data from `apps/server` to render inviter subtree structure and selectable placement slots with context
- Keep existing placement business rules and binary-tree constraints unchanged
- Preserve current pending-placement and placement binding flows while improving discoverability and operator clarity
- Align the implementation with `docs/spec/3U_DApp_UI_Improvement_Design.md#12.1` where compatible with current business rules

## 3. Out of Scope

- Changing binary-tree business rules
- Changing inviter / parent semantics
- Multi-root or non-binary tree models
- Arbitrary tree re-parenting / drag-and-drop restructuring of already placed users
- New `POST /api/team/rebind` semantics that would move existing placed members without a separate financial/tree-consistency design
- Admin-side tree management
- New reward / volume logic
- Drag-and-drop placement if a simpler tap/select model is sufficient

## 4. Assumptions

- Backend placement authority remains the same: inviters may place descendants only within their authorized subtree
- Root remains auto-initialized and participates in the same binary-tree structure
- Existing `bindPlacement` API remains the mutation used to confirm placement
- The missing capability is primarily visualization and context, not new business logic
- "Mounting" in this task means placing pending invitees into open binary-tree slots, not re-parenting already placed members
- Team graph rendering should be read-only by default and enter an explicit placement-selection mode when the operator is placing a pending member
- ENS / avatar enrichment is desirable but should be treated as additive polish unless it blocks core placement comprehension

## 5. Architecture Impact

### DApp

- `apps/dapp/src/components/pages/team-page.tsx` is currently overloaded and should be decomposed
- A new tree view component set will likely be needed, with clear separation between:
  - tree rendering
  - pending-placement selection
  - selectable-slot selection
  - placement confirmation
- A node card should support:
  - blockies / jazzicon-style wallet identity
  - short address fallback
  - optional ENS name and ENS avatar when available
  - NFT level badge
  - contribution / reward summary fields if those values are available or can be added safely
- SVG connectors should be used for parent-child readability
- Large expanded child lists may require `@tanstack/react-virtual` or equivalent virtualization once subtree payload shape is settled

### Server

- Current `GET /api/v1/tree/placement/selectable-slots` returns flat selectable slots only
- A subtree snapshot endpoint or enriched tree view response is likely required so the DApp can render parent-child relationships with placement affordances
- The current server model supports placement within inviter subtree, but not arbitrary rebind of already placed nodes
- Any future "rebind" API would be a separate Critical task because it can affect tree topology, left/right leg volume, reward attribution, and auditability

### Shared Models

- `packages/common` will likely need a new tree snapshot view contract and validator
- Existing placement request/response contracts should remain stable if possible
- Shared tree node view should reserve space for additive identity/metadata fields such as:
  - ENS name / avatar
  - reward totals
  - NFT tier
  - placement openness

## 5.1 UISpec Alignment Notes

The UI spec section `12.1 Team 模块：Web3 链上/链下数据树状展示 (Tree Component)` is directionally correct, but it mixes two levels of capability:

- Compatible with current task and current backend rules:
  - node avatars
  - ENS-first display fallback
  - NFT level and reward summary on nodes
  - SVG parent-child lines
  - explicit placement mode
  - virtualized rendering for large subtrees
  - transaction status feedback during placement

- Not directly compatible with the current task without a separate design:
  - drag-and-drop or arbitrary parent reassignment of already placed members
  - `POST /api/team/rebind` for general re-parenting
  - any operation that mutates existing tree structure after placement without first defining effects on volume propagation, small-leg logic, rewards, and audit trail

For this task, the plan should interpret "挂载" as placement of pending members into valid open slots, not free-form re-structuring of an existing tree.

## 6. Milestones

### Milestone 1: Current Tree Data Contract Assessment

- Goal:
  - confirm exactly what server data is available today and define the minimum tree snapshot needed by the DApp
- Affected files/modules:
  - `apps/server/src/modules/tree/services/tree-topology.service.ts`
  - `apps/server/src/modules/tree/repositories/team-closure.repository.ts`
  - `packages/common/src/models/promotion.ts`
  - `packages/common/src/validators/promotion.ts`
- Implementation notes:
  - document why flat slot data is insufficient for UX
  - define a tree node view that can show:
    - node identity
    - wallet label
    - optional ENS label and avatar
    - parent-child relationship
    - depth
    - occupied children
    - selectable open positions
    - whether a node is inside inviter subtree and placement-eligible
    - optional NFT tier and reward contribution summary
- Risks:
  - over-designing payload shape
- Verification commands:
  - `sed -n '1,260p' apps/server/src/modules/tree/services/tree-topology.service.ts`
  - `sed -n '1,240p' apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- Expected outputs:
  - agreed tree snapshot contract shape

### Milestone 2: Shared Tree Snapshot Contract

- Goal:
  - add shared models and validators for tree snapshot response
- Affected files/modules:
  - `packages/common/src/models/promotion.ts`
  - `packages/common/src/validators/promotion.ts`
- Implementation notes:
  - prefer additive contracts
  - keep existing placement request unchanged
- Risks:
  - type drift between server and DApp
- Verification commands:
  - `pnpm --dir packages/common build`
- Expected outputs:
  - typed shared tree snapshot contract

### Milestone 3: Server Tree Snapshot Read API

- Goal:
  - expose inviter subtree graph data through a dedicated read endpoint
- Affected files/modules:
  - `apps/server/src/modules/tree/tree.controller.ts`
  - `apps/server/src/modules/tree/services/tree-topology.service.ts`
  - `apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- Implementation notes:
  - derive subtree from closure table
  - include selectable-slot metadata in the tree response where possible to avoid extra joining in DApp
  - keep controller thin
  - support bounded depth / lazy expansion so large subtrees do not require full DOM expansion by default
- Risks:
  - accidentally leaking nodes outside inviter subtree
  - returning too much tree data for large inviters
- Verification commands:
  - `pnpm --dir apps/server test -- --runInBand src/modules/tree/services/tree-topology.service.spec.ts`
  - `pnpm --dir apps/server build`
- Expected outputs:
  - authenticated tree snapshot endpoint returning inviter subtree

### Milestone 4: Team Page Tree Component Skeleton

- Goal:
  - add tree visualization components and integrate them into `/team`
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - new `apps/dapp/src/components/team/*`
  - `apps/dapp/src/api/promotion.ts`
  - `apps/dapp/src/queries/promotion.query.ts`
- Implementation notes:
  - show clear hierarchy and depth
  - show occupied and open child positions
  - use SVG connectors between nodes
  - design node cards around wallet identity first, with room for optional ENS / NFT / rewards metadata
  - keep mobile-first layout
  - avoid mixing mutation logic into pure render components
- Risks:
  - cramped mobile rendering
  - excessive visual complexity
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
- Expected outputs:
  - visible subtree graph on `/team`

### Milestone 5: Visual Placement Selection Flow

- Goal:
  - allow operator to select pending invitee, inspect subtree, choose target node + position, then confirm placement
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - new `apps/dapp/src/components/team/*`
- Implementation notes:
  - selection flow should make clear:
    - which pending user is being placed
    - which node is selected as parent
    - whether `LEFT` or `RIGHT` is open
  - entering placement mode should be explicit and visually distinct from read-only tree browsing
  - transaction / mutation state should be visible in context near the affected node and confirmation area
  - do not remove the current mutation safety checks
- Risks:
  - ambiguous selection state
  - accidental placement against wrong node
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - tree-driven placement UX replacing the current flat slot ambiguity

### Milestone 6: Manual Verification in fork-anvil

- Goal:
  - validate `root -> userA -> userB` placement flow using actual local promotion environment
- Affected files/modules:
  - `docs/plan-excution/team-tree-visual-placement/execution.md`
- Implementation notes:
  - verify:
    - root sees pending child
    - root can choose node and side from graph
    - userA unlocks share assets after placement
    - userA can later place userB into its subtree
    - placement UI still behaves coherently once subtree depth exceeds the first two direct child slots
- Risks:
  - stale client state during wallet switching
- Verification commands:
  - `curl -s http://127.0.0.1:3210/api/v1/health`
  - manual browser validation on `http://127.0.0.1:3200/team`
- Expected outputs:
  - execution log with real screenshots/observations or explicit notes

## 7. Approval Checkpoint

Do not implement until approved. This is a Major task spanning DApp UI, shared contracts, and server read APIs around tree placement.

## 8. Rollback / Recovery Notes

- Keep existing placement bind mutation intact during rollout
- Prefer additive read APIs and UI components so current flow can remain as a fallback until new tree UI is verified
- If tree visualization proves unstable, temporarily keep flat slot list behind a feature fallback in the same page

## 9. Final Verification Checklist

- Shared tree snapshot contract added and built
- Server tree snapshot API implemented and verified
- `/team` shows subtree context instead of only flat placement slots
- Placement selection works for descendant nodes, not only direct inviter slots
- Tree node cards show wallet identity clearly and leave room for ENS / NFT / reward enrichment
- Placement mode is explicit and does not imply unsupported arbitrary re-parenting
- Root and non-root placement behavior remain consistent with binary-tree rules
- `pnpm --dir packages/common build` passed
- `pnpm --dir apps/server build` passed
- `pnpm --dir apps/dapp typecheck` passed
- `pnpm --dir apps/dapp lint` passed
- `pnpm --dir apps/dapp build` passed
- `execution.md` contains real commands and results
