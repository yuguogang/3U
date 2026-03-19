<!--
Generated: 2026-03-19
Phase: 2 - UI Claims Single Owner
-->

# UI Claims Single-Owner Prompt

Implement the Claims page work from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

This is a single-owner Claims lane. Do not split the page across multiple low-reasoning agents in this session.

## Your Assignment
- You own only these task IDs:
  - `Task 4.5` through `Task 4.18`
- Your primary write scope is:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx`
  - optional extracted components under `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/transaction-status.tsx` only when a Claims task explicitly needs it
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Do not edit server, contracts, admin, or shared models.
- Do not invent new claim fields if they are not available.
- Respect these gates:
  - `Task 4.14` Claims Batch-Action Feasibility Check
  - `Task 4.14a` Claims Schema Enrichment Gate
- If those gates conclude a dependency is missing, stop at the UI boundary and document it.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`
4. `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/claims-page.tsx`
5. Read claim query/api/runtime files only as needed for understanding current available data.

## Implementation Rules
- Prioritize section extraction and section-by-section refinement over giant rewrites.
- Preserve:
  - current claim write flow
  - receipt sync flow
  - wrong-network behavior
  - operational clarity of error banners and tx feedback
- Improve presentation, hierarchy, loading/empty states, and feedback without mutating business semantics.
- If a design-spec field is unavailable, present the best version possible with existing data and note the limitation in `execution.md`.

## Verification
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp build`
- If possible, record a manual Claims smoke note using the current fork-anvil workflow.

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Record:
  - which Claims tasks were completed
  - extraction boundaries, if any
  - commands run
  - remaining UI-only limitations

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- TASKS: completed task IDs
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any
