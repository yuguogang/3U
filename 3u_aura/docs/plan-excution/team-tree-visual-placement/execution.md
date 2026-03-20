# Team Tree Visual Placement — Execution Log

## Status

- Planning only
- Not yet approved for implementation

## Baseline Research

- Current `/team` page shows pending placements and flat selectable slots, but no visual tree.
- Current server placement service already supports selecting parents from the inviter subtree, not just the inviter's two direct child slots.
- Current UX therefore under-represents actual placement capability.

## Commands Run

- `rg -n "selectable slots|listSelectable|placement.*slot|tree.*graph|closure|pending placement|TeamClosure" apps/server/src apps/dapp/src packages/common -S`
- `sed -n '1,260p' apps/server/src/modules/tree/services/tree-topology.service.ts`
- `sed -n '1,240p' apps/server/src/modules/tree/repositories/team-closure.repository.ts`
- `sed -n '1,240p' apps/dapp/src/components/pages/team-page.tsx`
- `sed -n '1,220p' packages/common/src/models/promotion.ts`
- `sed -n '1,220p' packages/common/src/validators/promotion.ts`

## Findings

- `listSelectableSlotsForInviter()` already enumerates selectable parents inside inviter subtree via closure-table traversal.
- DApp currently flattens those slots into a simple list, which makes deeper placement feel impossible even when backend allows it.
- No tree graph or subtree snapshot contract exists yet in shared models.
- `docs/spec/3U_DApp_UI_Improvement_Design.md#12.1` is compatible with this task for visual tree rendering, node identity, placement mode, and virtualization, but its generic `rebind` idea is not compatible with current audited binary-tree semantics without a separate Critical task.

## Pending

- User approval for implementation
