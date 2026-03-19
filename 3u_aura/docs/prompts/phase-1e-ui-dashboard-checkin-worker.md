<!--
Generated: 2026-03-19
Phase: 1E - UI Dashboard Checkin Worker
-->

# UI Dashboard and Check-in Worker

Implement page-level DApp UI tasks from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

## Your Assignment
- You only own these task IDs:
  - `Task 4.1`
  - `Task 4.2`
  - `Task 4.3`
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/dashboard-page.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/checkin-page.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Preserve current check-in transaction flow and tx-hash behavior.
- Do not edit claims, team, rewards, NFT, or shared UI primitives unless strictly needed for a tiny compatibility fix.
- Do not touch server/admin/shared-model/contracts.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`
4. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/components/pages/Dashboard.tsx`
5. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/components/pages/Checkin.tsx`

## Verification
- `pnpm --dir apps/dapp lint`

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
