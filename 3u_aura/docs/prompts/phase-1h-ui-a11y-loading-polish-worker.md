<!--
Generated: 2026-03-19
Phase: 1H - UI A11y Loading Polish Worker
-->

# UI Accessibility and Loading Polish Worker

Implement final UI polish tasks from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

This worker should start after the shared UI primitives and shell-level components are already stable.

## Your Assignment
- You only own these task IDs:
  - `Task 5.5`
  - `Task 5.6`
  - `Task 5.7`
  - `Task 5.8`
  - `Task 6.1`
  - `Task 6.2`
  - `Task 6.3`
  - `Task 6.4`
  - `Task 6.5`
  - `Task 6.6`
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/globals.css`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/transaction-status.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Do not reopen broad visual rewrites on pages already finished.
- Do not change auth semantics, transaction semantics, or server contracts.
- Focus on accessibility, loading/empty/error consistency, and final closeout verification.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`

## Verification
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
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
