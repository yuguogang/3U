<!--
Generated: 2026-03-19
Phase: 1A - UI Shared Cards Worker
-->

# UI Shared Cards Worker

Implement a small DApp UI task from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

This is a low-reasoning implementation session. Stay narrow, do not redesign architecture, and do not broaden scope.

## Your Assignment
- You only own these task IDs:
  - `Task 2.3`
  - `Task 2.4`
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/glass-card.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/stat-card.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Do not edit:
  - `apps/server`
  - `apps/admin`
  - `packages/common`
  - `apps/contracts`
  - page files
  - notification-center plan files
- Do not restyle unrelated components “while you are here”.
- Do not change business behavior or component public API unless the current task truly requires a small compatibility adjustment.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`
4. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/components/ui-custom/GlassCard.tsx`
5. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/components/ui-custom/StatCard.tsx`

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
