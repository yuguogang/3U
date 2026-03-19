# UI Migration Execution: KimiUI Style to DApp

## Current Progress
-   [x] Analyzed `apps/kimiui`, `apps/dapp`, and project specs.
-   [x] Created `docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`.
-   [x] Re-reviewed the task direction and confirmed the correct source hierarchy is `design spec -> dapp`, with `kimiui` as a supplemental reference, not the reverse.
-   [x] Expanded the plan into low-reasoning-agent-sized tasks.
-   [x] Corrected the primary design reference to `docs/spec/3U_DApp_UI_Improvement_Design.md`.
-   [x] Kept `apps/dapp/src/components/pages/claims-page.tsx` as an implementation target, not the primary design source.
-   [x] Split multilingual notification-center work into a separate sibling plan so this task can stay UI-focused and low-reasoning-agent friendly.

## Execution Log

### Phase 1: Exploration and Analysis
-   **Commands run**: `ls -R apps/kimiui/src`, `ls -R apps/dapp/src`, `cat docs/spec/*.md`.
-   **Findings**: `kimiui` has a more modern UI structure and component set, while `dapp` has the complete functional logic.
-   **Deviations**: None.

### Phase 1.1: Plan Direction Re-Check
-   **Commands run**:
    - `sed -n '1,320p' docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
    - `sed -n '1,320p' docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
    - `sed -n '1,240p' apps/dapp/src/app/globals.css`
    - `sed -n '1,240p' apps/dapp/src/components/layout/mobile-layout.tsx`
    - `sed -n '1,240p' apps/dapp/src/components/ui-custom/bottom-nav.tsx`
    - `sed -n '1,240p' apps/kimiui/src/components/ui-custom/BottomNav.tsx`
    - `sed -n '1,260p' apps/dapp/src/components/pages/checkin-page.tsx`
    - `sed -n '1,260p' apps/kimiui/src/components/pages/Checkin.tsx`
    - `sed -n '1,260p' apps/dapp/src/components/wallet-button.tsx`
    - `sed -n '1,260p' apps/kimiui/src/components/ui-custom/WalletButton.tsx`
    - `sed -n '1,260p' apps/kimiui/src/store/appStore.ts`
    - `sed -n '1,200p' apps/dapp/src/app/layout.tsx`
-   **Findings**:
    - `apps/dapp` is already the real functional app and already contains partial KimiUI convergence.
    - `apps/kimiui` is still best treated as a visual reference because it uses store-driven page switching and mock page state.
    - The original plan was too coarse and treated the work like a full migration instead of a convergence/refinement task.
-   **Deviations**:
    - Reframed the plan from a flat migration outline into a one-directional convergence plan with `dapp` as the canonical target.

### Phase 1.2: Claims Page-Specific Planning Pass
-   **Commands run**:
    - `sed -n '1,320p' apps/dapp/src/components/pages/claims-page.tsx`
    - `sed -n '1,320p' docs/spec/3U_DApp_UI_Improvement_Design.md`
-   **Findings**:
    - `claims-page.tsx` is a high-density file that mixes page structure, section rendering, transaction write handling, receipt syncing, and status presentation.
    - The correct primary reference for Claims work is the design spec section `4.4 Claims 页面`, not the current runtime file itself.
    - The design spec also adds adjacent requirements that affect Claims planning:
      - loading and retry states
      - transaction feedback
      - accessibility
    - `claims-page.tsx` still needs explicit sub-tasking so low-reasoning agents can work on one section at a time without touching claim logic.
-   **Deviations**:
    - Reworked the Claims atomic breakdown to map to the design spec instead of treating the current page file as the main source of truth.

### Phase 1.3: Design Spec Alignment Pass
-   **Commands run**:
    - `sed -n '1,320p' docs/spec/3U_DApp_UI_Improvement_Design.md`
    - `sed -n '321,640p' docs/spec/3U_DApp_UI_Improvement_Design.md`
    - `sed -n '640,780p' docs/spec/3U_DApp_UI_Improvement_Design.md`
    - `rg -n "Claims 页面|交易流程优化|可访问性改进|性能优化|WalletButton|TransactionStatus|StatCard|NFT 页面|Check-in 页面|Dashboard 页面" docs/spec/3U_DApp_UI_Improvement_Design.md`
-   **Findings**:
    - The design spec is broader than a KimiUI visual transplant and explicitly covers:
      - design tokens
      - page-level layout
      - transaction flow feedback
      - loading and retry states
      - accessibility
      - performance follow-ups
    - The plan needed a clearer source hierarchy:
      - spec first
      - real `dapp` runtime constraints second
      - `kimiui` third
    - The Claims planning needed to include:
      - amount prominence
      - available/expiry time treatment
      - batch-claim feasibility validation
      - history presentation
      - transaction feedback integration
-   **Deviations**:
    - Updated `plan.md` to make the design spec the primary reference and expanded the atomic tasks accordingly.

### Phase 1.4: API / Contract Dependency Check
-   **Commands run**:
    - `sed -n '1,240p' apps/dapp/src/queries/claims.query.ts`
    - `sed -n '1,240p' apps/dapp/src/api/claims.ts`
    - `sed -n '1,240p' apps/server/src/modules/claims/controllers/claims.controller.ts`
    - `sed -n '1,220p' apps/server/src/auth/services/auth.service.ts`
    - `sed -n '1,260p' apps/server/src/modules/claims/services/claims-read.service.ts`
    - `sed -n '1,260p' apps/dapp/src/lib/promotion-contracts.ts`
    - `sed -n '1,260p' packages/common/src/models/promotion.ts`
    - `rg -n "CACHE_MANAGER|cacheManager|claims/me|claims/sync|claimPurchasedSubsidyBatch|claim\\(" apps/dapp apps/server packages/common -S`
-   **Findings**:
    - Base UI migration does not require new server-side cache/message work.
    - Auth signature message caching already exists in `server` and is not a blocker for the UI plan.
    - Current Claims UI can already rely on:
      - `GET /api/v1/claims/me`
      - `POST /api/v1/claims/sync`
    - The design spec's richer Claims item shape is not fully present in current shared models:
      - fields like `availableAt`, `expiresAt`, and richer description/history metadata are not exposed in the current promotion claim view contracts.
    - A unified "claim all" design is not automatically available across all claim types:
      - subsidy batch claim exists
      - merkle claim is currently single-claim oriented
-   **Deviations**:
    - Added explicit backend/contract dependency gates to `plan.md` so later UI work can distinguish:
      - safe frontend-only tasks
      - schema/API-dependent tasks
      - contract-dependent tasks

### Phase 1.5: Notification Center Capability Check
-   **Commands run**:
    - `rg -n "notification|announcement|notice|message center|inbox|bulletin|公告|消息" apps packages docs -S`
    - `rg -n "model .*Notification|model .*Announcement|model .*Message|notification|announcement|bulletin|notice|message" apps/server/prisma -S`
    - `sed -n '1,260p' apps/admin/src/api/admin.ts`
    - `sed -n '1,260p' apps/admin/src/queries/admin.query.ts`
    - `sed -n '1,260p' apps/server/src/modules/admin/admin-console.controller.ts`
    - `sed -n '760,840p' apps/server/prisma/schema.prisma`
    - `sed -n '1,220p' apps/dapp/src/i18n/constants.ts`
-   **Findings**:
    - There is currently no dedicated notification/announcement schema in Prisma.
    - There is currently no admin API surface for publishing multilingual notices.
    - There is currently no DApp inbox/message-center API.
    - Existing DApp toast support is ephemeral UI state only and is not a persisted message system.
    - The DApp already has a concrete locale list that a first notification feature can target:
      - `en`
      - `zh`
      - `zh-Hant`
      - `vi`
      - `ko`
      - `ja`
    - This requirement broadens the plan from pure UI convergence into a coordinated data-model/API/admin/DApp feature stream.
-   **Deviations**:
    - Added a new notification-center milestone and atomic tasks to `plan.md`.
    - Kept the first version intentionally scoped to admin-authored multilingual notices viewed inside the DApp.
    - Explicitly left push/email/SMS and automatic event-driven notification infrastructure out of the first version.

### Phase 2: Implementation
- [x] Milestone 1: Design System & Tokens
  - Updated `apps/dapp/src/app/globals.css` with KimiUI's color tokens and design system variables.
- [x] Milestone 2: Core UI Components
  - Created `apps/dapp/src/components/ui-custom/` and ported:
    - `glass-card.tsx`
    - `stat-card.tsx`
    - `transaction-status.tsx`
    - `toast.tsx`
    - `bottom-nav.tsx`
  - Refactored `apps/dapp/src/components/wallet-button.tsx` with KimiUI's styling while preserving SIWE logic.
  - Created `apps/dapp/src/store/ui.store.ts` for UI state.
- [x] Milestone 3: Layout & Navigation
  - Updated `apps/dapp/src/components/layout/mobile-layout.tsx` to use the new converged `BottomNav` and redesigned header.
- [x] Milestone 4: Page Refresh (Progressive)
  - Refactored all major pages in `apps/dapp` to use the new UI components and style:
    - `dashboard-page.tsx`
    - `checkin-page.tsx`
    - `team-page.tsx`
    - `rewards-page.tsx`
    - `nft-page.tsx`
    - `claims-page.tsx`

### Phase 3: Verification
- [ ] Verify UI appearance and responsiveness.
- [ ] Ensure all functional flows (sign-in, check-in, mint, claim) still work.

### Phase 4: Plan Hardening for Low-Reasoning Agents
- [x] Added task sizing rules to `plan.md`.
- [x] Added atomic tasks for the DApp UI milestones and verification closeout.
- [x] Added explicit Claims page sub-tasks suitable for small, disjoint implementation passes.
- [x] Added spec-aligned sub-tasks for:
  - claims amount and time presentation
  - batch-claim feasibility
  - transaction feedback
  - accessibility labels
  - reduced-motion/high-contrast baseline
- [x] Added explicit backend/API dependency gates and a claims schema enrichment gate.
- [x] Separated multilingual notification-center planning into a sibling task directory for later high-reasoning execution.
- [ ] Re-baseline actual implementation progress against the new atomic plan before coding resumes.

### Phase 4.1: Assignment and Parallelism Pass
-   **Commands run**:
    - `rg -n "Recommended Assignment and Parallelism|Wave 0|Task 6\\.1|Task 4\\.14|Approval Checkpoint" docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
    - `sed -n '1120,1368p' docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
-   **Findings**:
    - The plan already had wave-based sequencing, but it still benefited from a more direct lane/ownership mapping for future agent delegation.
    - The work is not fully serial and not fully parallel:
      - schema/API/shared-model gates must go first
      - pure DApp UI work can run in parallel once the token baseline is stable
      - Claims should remain single-owner or tightly coordinated
      - notification admin and DApp inbox work can open only after notification schema and server APIs settle
-   **Deviations**:
    - Added a `Suggested Assignment Matrix` section to `plan.md`.
    - Added a `Parallelism Rule of Thumb` section to `plan.md` so later low-reasoning agents can tell when to queue versus when to run concurrently.

### Phase 4.2: Plan Split for UI vs Notification Streams
-   **Commands run**:
    - `rg -n "notification|Milestone 6|Task 6\\.|Task 7\\.5" docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
    - `sed -n '1,170p' docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
    - `sed -n '300,390p' docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
    - `sed -n '919,1260p' docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
-   **Findings**:
    - Keeping multilingual notifications inside the UI convergence plan would mix low-reasoning DApp work with high-coordination schema/server/admin work.
    - The cleaner split is:
      - keep `ui-migration-kimiui-to-dapp` focused on `apps/dapp` presentation and current-API adaptation
      - move notification-center scope into a sibling plan for high-reasoning execution
    - Claims gating still belongs here because it affects page-level implementation boundaries inside the DApp.
-   **Deviations**:
    - Removed notification milestone/task ownership from this UI plan.
    - Re-scoped the final verification milestone to DApp-only validation.
    - Added an explicit handoff note task so low-reasoning agents know the notification stream has been intentionally moved out.

### Phase 4.3: Prefilled Agent Prompt Pack
-   **Commands run**:
    - `sed -n '1,220p' /Users/ygg/.codex/skills/claude-skills-collection/skills/prompt-generator/SKILL.md`
    - `sed -n '1,260p' /Users/ygg/.codex/skills/claude-skills-collection/skills/prompt-generator/references/implementation-prompt-template.md`
    - `ls /Users/ygg/vs/ai/3U/3u_aura/docs/prompts`
-   **Findings**:
    - The generic worker prompt was useful as a base, but actual delegation is easier if the repository contains prefilled prompts with:
      - concrete task IDs
      - concrete write scopes
      - lane-specific boundaries
    - The cleanest packaging for the UI plan is:
      - multiple low-reasoning DApp worker prompts by file lane
      - one single-owner Claims prompt
      - one late-stage accessibility/loading/final-verification prompt
-   **Deviations**:
    - Added prefilled prompt files under `docs/prompts/` for:
      - shared cards
      - feedback components
      - shell header/wallet
      - bottom nav single-owner
      - dashboard/check-in
      - NFT/team
      - rewards
      - accessibility/loading/final verification
