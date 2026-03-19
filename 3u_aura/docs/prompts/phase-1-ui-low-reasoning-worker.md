<!--
Generated: 2026-03-19
Phase: 1 - UI Low Reasoning Worker
-->

# UI Low-Reasoning Worker Prompt

Implement a small DApp UI task from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

This is a low-reasoning implementation session. Stay narrow, do not redesign architecture, and do not broaden scope.

## Your Assignment
- You only own these task IDs:
  - `{TASK_IDS}`
- Your write scope is only:
  - `{WRITE_SCOPE}`
- You may also update:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Do not edit:
  - `apps/server`
  - `apps/admin`
  - `packages/common`
  - `apps/contracts`
  - notification-center plan files
- Do not touch claims gating decisions unless your assigned task explicitly says so.
- Do not restyle unrelated pages “while you are here”.
- Do not change wallet auth semantics, contract write logic, or API contracts.

## Required Reading
1. Read the root repo instructions:
   - `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. Read the assigned task sections in:
   - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. Read only the files inside your write scope plus any directly referenced design/spec file.

## Implementation Rules
- Preserve existing business behavior.
- Use the design spec as the primary visual source:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`
- Use `apps/kimiui` only as a supplemental visual reference.
- Keep changes small and reviewable.
- If the task touches a dense file, avoid broad refactors unless the task explicitly asks for extraction.
- If you discover a missing API/schema/contract dependency, stop, document the blocker in `execution.md`, and do not invent backend changes.

## Verification
- Run the narrowest relevant command for your touched files:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- If you cannot run a command, record that clearly in `execution.md`.

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Record:
  - task IDs worked on
  - files changed
  - commands run
  - results
  - blockers or deviations

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- TASKS: completed task IDs
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any
