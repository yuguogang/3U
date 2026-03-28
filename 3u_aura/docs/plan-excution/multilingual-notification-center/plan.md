# Multilingual Notification Center Plan

## Objective
Add a first-version persisted multilingual notification center that lets admins author and publish announcements, and lets DApp users view them with unread/read state.

This plan is intentionally separate from the earlier DApp UI migration stream:
- the earlier UI migration stays focused on DApp presentation and current-API adaptation.
- This task owns the new shared models, persistence, server APIs, admin authoring flows, and DApp inbox integration needed for notifications.

## Scope
- Define shared notification enums, request/response DTOs, and locale-aware content contracts in `packages/common`.
- Add persisted notification and read-state models in Prisma with migrations.
- Add server-side user APIs for:
  - listing visible notifications
  - fetching unread count
  - marking notifications as read
- Add server-side admin APIs for:
  - creating drafts
  - editing localized content
  - publishing / unpublishing / archiving
  - listing existing notifications
- Add admin UI for notification listing and editing.
- Add DApp inbox/badge/read-state UX.
- Support first-version categories such as:
  - project activity
  - team activity
  - upcoming launch
- Support current DApp locales:
  - `en`
  - `zh`
  - `zh-Hant`
  - `vi`
  - `ko`
  - `ja`

## Out of Scope
- Smart contract changes.
- On-chain event driven notifications in the first version.
- Push notifications, email, SMS, or external messaging delivery.
- WebSocket or realtime transport requirements.
- Rich audience segmentation beyond a practical first publish model.
- Full CMS/media management, attachments, or complex templating.
- Replacing existing ephemeral toast UI with the notification center for transient in-session feedback.

## Assumptions
- Current DApp locales remain the canonical locale list for the first version.
- Existing admin auth and wallet guard patterns are sufficient to protect new admin endpoints.
- Existing user auth is sufficient to attach read-state to authenticated DApp users.
- First version content can be modeled with explicit structured fields such as title/body/optional CTA instead of introducing a rich text editor requirement.
- Read-state must be auditable and retry-safe.
- This task should be owned by a high-reasoning coordinator through the schema/API milestones before wider delegation.

## Architecture Impact
- `packages/common`
  - new enums and DTOs for notification category, publish status, locale content map, admin CRUD payloads, and DApp read/list responses
- `apps/server/prisma/schema.prisma`
  - persisted notification model
  - persisted per-user read-state model
- `apps/server/src/modules/`
  - a dedicated notification module or equivalent service/controller structure
  - admin endpoints may live under existing admin modules or a dedicated admin notification slice
- `apps/admin`
  - typed API/query layer additions
  - notification list/editor screens
- `apps/dapp`
  - typed API/query layer additions
  - inbox entry point, unread badge, inbox view, and read-state UX
- `apps/contracts`
  - no expected changes in the first version

## Milestones

### Milestone 1: Domain Contract and Delivery Boundaries
- Goal:
  - Lock the first-version product contract so implementation does not drift into a full messaging platform.
- Affected files/modules:
  - `docs/plan-excution/multilingual-notification-center/plan.md`
  - `docs/plan-excution/multilingual-notification-center/execution.md`
  - reference files in `apps/dapp/src/i18n/constants.ts`, `apps/server/prisma/schema.prisma`, `apps/server/src/modules/admin/`, `apps/admin/src/api/`, `apps/admin/src/queries/`
- Implementation notes:
  - Decide and record:
    - category enum
    - publish status enum
    - locale payload shape
    - audience scope for first version
    - unread/read semantics
    - archive behavior
    - deterministic locale fallback rule
  - Explicitly record what is deferred:
    - push/email/SMS
    - websocket/realtime
    - automated event-generated notifications
- Risks:
  - Overdesigning a generalized message platform.
  - Leaving product semantics vague and forcing later schema churn.
- Verification commands:
  - `rg -n "notification|announcement|notice|message center|inbox|bulletin|公告|消息" apps packages docs -S`
  - `sed -n '1,220p' apps/dapp/src/i18n/constants.ts`
  - `sed -n '1,260p' apps/server/src/modules/admin/admin-console.controller.ts`
  - `sed -n '1,260p' apps/admin/src/api/admin.ts`
  - `sed -n '1,260p' apps/admin/src/queries/admin.query.ts`
- Expected outputs:
  - A documented first-version contract that is small enough to build and review safely.

### Milestone 2: Shared Model and Persistence Foundation
- Goal:
  - Create the canonical shared notification contracts and Prisma persistence shape.
- Affected files/modules:
  - `packages/common/src/models/`
  - `packages/common/src/validators/`
  - `apps/server/prisma/schema.prisma`
  - migration files
- Implementation notes:
  - Prefer explicit enums and DTOs in `packages/common`.
  - Keep locale content storage auditable and deterministic.
  - Model read-state separately from the notification content row.
  - Choose a practical first data model for publish window and category.
- Risks:
  - Encoding locale payloads in a way that is hard to validate or evolve.
  - Over-normalizing or under-normalizing read-state and publish metadata.
- Verification commands:
  - `pnpm --dir packages/common build`
  - relevant Prisma generate/migration/build command when implementation begins
- Expected outputs:
  - Shared contracts and DB schema exist and are aligned.

### Milestone 3: Server API and Service Layer
- Goal:
  - Implement authenticated user APIs and admin CRUD/publish APIs with safe persistence semantics.
- Affected files/modules:
  - `apps/server/src/modules/`
  - `apps/server/src/modules/admin/`
  - `packages/common`
- Implementation notes:
  - User APIs should support:
    - list visible notifications
    - unread count
    - mark read
  - Admin APIs should support:
    - create draft
    - edit localized content
    - publish / unpublish / archive
    - list existing items
  - Keep controllers thin and business rules in services.
  - Make read-state mutations idempotent.
  - Preserve auditability of publish transitions.
- Risks:
  - Authorization gaps between admin and normal user surfaces.
  - Non-idempotent read-state mutations.
  - Leaking DApp-only locale assumptions into unvalidated server code.
- Verification commands:
  - `pnpm --dir apps/server build`
  - relevant server tests when implementation begins
- Expected outputs:
  - Stable server API contract ready for admin and DApp clients.

### Milestone 4: Admin Authoring Surfaces
- Goal:
  - Give admins a practical UI to create, edit, review, and publish multilingual notices.
- Affected files/modules:
  - `apps/admin/src/api/`
  - `apps/admin/src/queries/`
  - `apps/admin/src/app/` or `apps/admin/src/features/`
- Implementation notes:
  - Keep first version simple:
    - list screen
    - filter by status/category if practical
    - editor with per-locale fields
    - explicit publish/archive actions
  - Reuse current admin shell conventions.
- Risks:
  - Editor UX becoming much larger than needed.
  - Publishing invalid locale payloads because of weak client validation.
- Verification commands:
  - `pnpm --dir apps/admin build`
- Expected outputs:
  - Admin can manage notifications end to end without direct DB edits.

### Milestone 5: DApp Inbox and Read-State UX
- Goal:
  - Expose a user-facing inbox entry, list view, localized content rendering, and predictable read-state handling.
- Affected files/modules:
  - `apps/dapp/src/api/`
  - `apps/dapp/src/queries/`
  - `apps/dapp/src/components/`
  - `apps/dapp/src/app/` if a route is added
  - `packages/common` if locale helper alignment is needed
- Implementation notes:
  - Keep the DApp shell entry lightweight:
    - inbox entry point
    - unread badge
    - inbox/list surface
  - Locale resolution should follow the current DApp locale with deterministic fallback.
  - Do not replace toasts used for transient transaction feedback.
- Risks:
  - Badges or read-state becoming stale because client invalidation rules are weak.
  - Mixing notification-center responsibilities with transaction toasts.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - Users can see published localized notifications and clear unread state predictably.

### Milestone 6: Integration, Verification, and Rollout Readiness
- Goal:
  - Validate the full admin-to-DApp flow and record any deliberate first-version limitations.
- Affected files/modules:
  - `docs/plan-excution/multilingual-notification-center/execution.md`
  - relevant changed files in `packages/common`, `apps/server`, `apps/admin`, and `apps/dapp`
- Implementation notes:
  - Validate the real integrated flow:
    - admin creates draft
    - admin publishes
    - DApp shows unread badge
    - DApp resolves locale content correctly
    - DApp marks notification read
  - Record any first-version limitations explicitly so later agents do not "fill in" unintended scope.
- Risks:
  - Declaring completion based only on static screens.
  - Missing stale-cache or read-state bugs in integrated use.
- Verification commands:
  - `pnpm --dir packages/common build`
  - `pnpm --dir apps/server build`
  - `pnpm --dir apps/admin build`
  - `pnpm --dir apps/dapp build`
  - integrated manual smoke when implementation begins
- Expected outputs:
  - A release-ready judgment on whether the first notification center is functionally safe and coherent.

## Execution Shape
- Wave 0:
  - high-reasoning coordinator only
  - Milestone 1 and Milestone 2
- Wave 1:
  - high-reasoning coordinator still owns Milestone 3
  - no parallel frontend work until shared types and server APIs stabilize
- Wave 2:
  - parallel implementation may open:
    - admin lane for Milestone 4
    - DApp lane for Milestone 5
- Wave 3:
  - sequential integrated verification and closeout

## Approval Checkpoint
Approval is needed before implementation begins:
- Confirm that notification-center work is intentionally split out from the UI convergence plan.
- Confirm that first version is admin-authored, multilingual, persisted, and DApp-readable.
- Confirm that push/email/SMS/realtime are deferred.
- Confirm that no contract work is expected in the first version.
- Confirm that implementation should stay behind schema/API gates before parallel frontend work begins.

## Rollback / Recovery Notes
- Keep schema, shared-model, server, admin, and DApp changes in reviewable steps.
- Do not merge admin or DApp clients against unstable notification contracts.
- Keep read-state mutations idempotent so repeated user actions are recoverable.
- If the product contract expands mid-implementation, stop and update this plan rather than improvising in code.

## Final Verification Checklist
- [ ] Notification scope is clearly split from the UI convergence task.
- [ ] Shared notification DTOs/enums live in `packages/common`.
- [ ] Prisma schema and migrations are in place.
- [ ] User list/unread/read APIs exist and are authenticated.
- [ ] Admin create/edit/publish/archive APIs exist and are protected.
- [ ] Admin authoring UI is functional.
- [ ] DApp inbox/badge/read-state UX is functional.
- [ ] Locale resolution and fallback are deterministic.
- [ ] `pnpm --dir packages/common build` passed.
- [ ] `pnpm --dir apps/server build` passed.
- [ ] `pnpm --dir apps/admin build` passed.
- [ ] `pnpm --dir apps/dapp build` passed.
- [ ] Integrated manual validation is recorded in `execution.md`.
