<!--
Generated: 2026-03-19
Phase: 3 - Notification Center High Reasoning Coordinator
-->

# Notification Center High-Reasoning Coordinator Prompt

Implement the notification-center plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/plan.md

This is a high-reasoning coordination and implementation session. You must treat schema, shared DTOs, server APIs, admin surfaces, and DApp inbox work as one coordinated feature stream.

## Core Objective
Build the first-version multilingual persisted notification center:
- admin-authored notices
- persisted storage
- authenticated user inbox
- unread/read state
- localized content for current DApp locales

## Execution Mode
- Work milestone by milestone.
- Milestone 1 to Milestone 3 must be treated as gates.
- Do not open parallel frontend implementation until shared models, persistence shape, and server APIs stabilize.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/execution.md`
4. `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/i18n/constants.ts`
5. Current baseline files:
   - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma`
   - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/admin/admin-console.controller.ts`
   - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/admin.ts`
   - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/queries/admin.query.ts`

## Hard Boundaries
- Do not add contract changes.
- Do not expand to push/email/SMS/realtime.
- Do not turn this into a generic CMS or rich-text platform.
- Keep first version small, explicit, and auditable.

## Required Deliverables
- Shared enums and DTOs in `packages/common`
- Prisma notification and read-state models with migration
- Server user APIs:
  - list visible notifications
  - unread count
  - mark read
- Server admin APIs:
  - create draft
  - edit localized content
  - publish / unpublish / archive
  - list items
- Admin UI for list and editor
- DApp inbox/badge/read-state UX
- Updated `execution.md` with real steps and verification

## Architecture Rules
- Controllers stay thin.
- Business rules go in services.
- Read-state writes must be idempotent.
- Publish transitions must be auditable.
- Shared DTOs/enums must come from `packages/common`.
- Avoid leaking DApp-only UI types into backend layers.

## Recommended Order
1. Milestone 1: lock domain contract and product boundaries
2. Milestone 2: shared DTOs + Prisma schema/migration
3. Milestone 3: server APIs/services
4. Milestone 4 and Milestone 5: admin and DApp lanes
5. Milestone 6: integrated verification and closeout

## Verification
- `pnpm --dir packages/common build`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/admin build`
- `pnpm --dir apps/dapp build`
- Add narrower tests/verification where appropriate

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/multilingual-notification-center/execution.md`
- Record:
  - milestone progress
  - real commands
  - schema/API decisions
  - deviations from original plan
  - blockers

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- MILESTONES: completed or in-progress milestones
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any
