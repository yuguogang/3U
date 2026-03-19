<!--
Generated: 2026-03-19
Phase: 4 - Notification Center Admin Worker
-->

# Notification Center Admin Worker Prompt

Implement only the admin-authoring lane of the notification-center plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/plan.md

Only start after the high-reasoning coordinator confirms that shared DTOs, persistence, and server admin APIs are stable.

## Your Assignment
- You own:
  - Milestone 4
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/app/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/features/`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/execution.md`

## Hard Boundaries
- Do not edit Prisma schema.
- Do not redesign server API contracts.
- Do not edit DApp inbox UI.
- Do not expand scope beyond list/editor/publish surfaces.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/plan.md`
3. Relevant admin API/query/server contract files already prepared by the coordinator

## Implementation Rules
- Follow existing admin shell and query conventions.
- Prefer simple, explicit forms for localized content.
- Validate per-locale fields according to the settled DTO contract.
- Keep publish/archive actions explicit and reviewable.

## Verification
- `pnpm --dir apps/admin build`

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/execution.md`

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- MILESTONE: Milestone 4
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any
