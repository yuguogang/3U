<!--
Generated: 2026-03-19
Phase: 5 - Notification Center DApp Worker
-->

# Notification Center DApp Worker Prompt

Implement only the DApp inbox lane of the notification-center plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/plan.md

Only start after the high-reasoning coordinator confirms that shared DTOs and user-facing server APIs are stable.

## Your Assignment
- You own:
  - Milestone 5
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/queries/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/execution.md`

## Hard Boundaries
- Do not edit server APIs or shared DTO contracts.
- Do not replace transient transaction toasts with the inbox.
- Do not redesign unrelated DApp routes while adding the notification entry.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/plan.md`
3. The finalized notification DTOs and DApp query/client files

## Implementation Rules
- Add:
  - inbox entry point
  - unread badge
  - inbox/list surface
  - mark-read UX
  - deterministic locale fallback rendering
- Keep the shell integration lightweight and consistent with the existing DApp.
- Preserve current route and auth behavior.

## Verification
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp build`

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/execution.md`

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- MILESTONE: Milestone 5
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any
