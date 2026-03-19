<!--
Generated: 2026-03-19
Phase: 1D - UI Bottom Nav Single Owner
-->

# UI Bottom Nav Single-Owner Worker

Implement the coupled bottom-nav tasks from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

This file is intentionally single-owner. Do not run another worker on the same file in parallel.

## Your Assignment
- You only own these task IDs:
  - `Task 3.2`
  - `Task 3.3`
  - `Task 3.5`
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/messages/`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Do not change route architecture.
- Do not change claim business logic just to support the FAB or badge.
- Do not edit header or wallet-button files.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`
4. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/components/ui-custom/BottomNav.tsx`

## Verification
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp build`

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- TASKS: completed task IDs
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any
