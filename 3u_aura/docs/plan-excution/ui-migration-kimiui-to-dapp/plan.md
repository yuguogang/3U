# UI Convergence Plan: Design Spec + KimiUI Reference into DApp

## Objective
Converge `apps/dapp` toward the visual language, interaction patterns, and implementation priorities defined in `docs/spec/3U_DApp_UI_Improvement_Design.md`, while using `apps/kimiui` only as a supplemental visual/runtime reference and keeping `apps/dapp` as the canonical functional application.

This task is intentionally one-directional:
- `apps/dapp` is the implementation target.
- `apps/kimiui` is a design and interaction reference.
- We do **not** reverse-migrate `apps/dapp` business logic into `apps/kimiui`.

## Scope
- Align `apps/dapp` visual tokens, gradients, spacing, surface treatment, and mobile chrome with the design system described in `docs/spec/3U_DApp_UI_Improvement_Design.md`.
- Converge shared presentational components in `apps/dapp/src/components/ui-custom/`.
- Refine route shell and bottom navigation in `apps/dapp` using the design spec as primary guidance and `kimiui` interaction patterns only where they fit Next.js routing.
- Refresh the key promotion pages in `apps/dapp` to match the target presentation described in the design spec while preserving real server/contract flows.
- Preserve and improve transaction, auth, wallet, loading, error, success, pending, and claims states in the functional DApp.
- Fold in high-value accessibility and motion-reduction improvements that are explicitly called out in the design spec.

## Out of Scope
- Replatforming `apps/dapp` from Next.js App Router to a Vite SPA model.
- Replacing `apps/dapp` route-driven navigation with `apps/kimiui`'s `currentPage` store routing.
- Porting `apps/kimiui` mock state, fake timers, or simulated business flows into `apps/dapp`.
- Making `apps/kimiui` the production app.
- Backend, contract, settlement, reward, eligibility, or schema changes except for minor UI-facing text or client wiring that is strictly necessary for presentation.
- Multilingual notification center work.
  - This has been split into `docs/plan-excution/multilingual-notification-center/`.
- Push notifications, email, SMS, or external messaging delivery.
- WebSocket/live push delivery for in-app notices.
- Fully automatic event-generated team activity notifications in the first version.
- Rich audience segmentation beyond a first practical publish model.

## Assumptions
- `apps/dapp` remains the production-facing application because it already owns real routing, i18n, wallet auth, query state, and API/contract integration.
- `docs/spec/3U_DApp_UI_Improvement_Design.md` is the primary design source for this task.
- `apps/kimiui` is useful as a supplemental visual reference and interaction prototype, but many of its page flows are mock-driven and must not become the source of truth for business behavior.
- `apps/dapp` already contains partial convergence, so this work is an incremental refinement and consolidation task, not a net-new migration.
- The canonical styling pipeline for implementation is the existing `apps/dapp` Next.js + Tailwind v4 setup, not the current `apps/kimiui` CSS toolchain.
- Mobile-first presentation matters, but desktop usability and App Router compatibility must still hold.
- Notification work now lives in a separate high-reasoning plan and should not block pure UI execution in this task.

## Task Sizing Rules
- Every implementation task must be small enough for a low-reasoning agent to finish safely.
- Prefer one task per:
  - one file
  - one presentational component
  - one page section
  - one interaction state
- Avoid combining these concerns in a single task:
  - wallet auth behavior
  - contract write behavior
  - route shell changes
  - page visual restructuring
- When possible, give each task:
  - a single write scope
  - a narrow read scope
  - one local verification command or one manual check
- If multiple agents are used later, assign disjoint write scopes to avoid merge conflicts.

## Design Source Hierarchy
1. Primary reference:
   - `docs/spec/3U_DApp_UI_Improvement_Design.md`
2. Secondary reference:
   - current `apps/dapp` runtime constraints and real business flows
3. Tertiary reference:
   - `apps/kimiui` visual patterns that do not conflict with the design spec or the real DApp architecture

When references disagree:
- prefer the design spec over `kimiui`
- prefer real `dapp` business safety over both
- document any intentional divergence in `execution.md`

## Architecture Impact
- Primary reference document:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- `apps/dapp` keeps ownership of:
  - App Router pages under `apps/dapp/src/app/`
  - real business page components under `apps/dapp/src/components/pages/`
  - wallet auth semantics in `apps/dapp/src/components/wallet-button.tsx`
  - query and store integration in `apps/dapp/src/queries/` and `apps/dapp/src/store/`
  - i18n text under `apps/dapp/messages/`
- `apps/kimiui` should be treated as a supplemental reference set of:
  - visual patterns
  - section hierarchy
  - page rhythm
  - animation and feedback ideas
- We should not directly copy:
  - `apps/kimiui` store-driven navigation
  - mock page data
  - CSS/build configuration
- Existing partial convergence in `apps/dapp` should be preserved and completed rather than rewritten:
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `apps/dapp/src/components/wallet-button.tsx`

## Backend / Contract Dependency Gates
- Default rule:
  - Do **not** change `server` or contracts just because a UI element can be redesigned.
  - Prefer implementing the UI against existing `dapp` queries and runtime behavior first.
- Explicitly confirmed non-blockers:
  - Auth signature message caching already exists in `server`; no new cache/message mechanism is required for the base UI migration.
  - Current claims list and claim sync APIs are sufficient for a first-pass Claims UI refresh.
  - Toasts, loading skeletons, explorer links, and most transaction-state presentation are frontend concerns and do not require backend work by default.
- Potential dependency gates that must be checked before implementing certain spec items:
  - Claims schema enrichment gate:
    - The design spec mentions `availableAt`, `expiresAt`, and richer claim item metadata.
    - Current shared claim view models do not expose the full shape described in the spec.
    - If strict spec fidelity is required for these fields, update `packages/common` and `server` before or alongside the affected Claims UI tasks.
  - Claim-all capability gate:
    - `settlement` supports subsidy batch claim.
    - `merkle` currently exposes single-claim behavior only.
    - A unified "claim all" experience across all claim types may require either:
      - a reduced frontend-only scope
      - a new orchestration API
      - or contract changes
  - Team tree data gate:
    - If later scope includes the design spec's lazy-loaded team tree experience, verify whether current tree APIs are sufficient before assigning page tasks.
- Decision rule:
  - When a task crosses one of these gates, stop treating it as pure UI work and document the dependency in `execution.md` before implementation proceeds.
  - Notification-center work is now explicitly out of scope here and belongs to `docs/plan-excution/multilingual-notification-center/`.

## Direction Decision
The correct direction is:

`Design spec -> DApp implementation target`, with `kimiui` as a supplemental reference

Rejected alternative:

`DApp logic -> KimiUI as the main runtime app`

Why the reverse direction is not appropriate:
- The design intent is already documented explicitly in `docs/spec/3U_DApp_UI_Improvement_Design.md`, so `kimiui` does not need to become the canonical source.
- `apps/dapp` already has real Next.js route boundaries and providers.
- `apps/dapp` already handles real auth, query hydration, translations, and contract-facing flows.
- `apps/kimiui` currently relies on a single-page local store navigation model and mock page state.
- Directly making `apps/kimiui` the main app would turn a UI migration into an app-platform rewrite with unnecessary risk.

## Milestones

### Milestone 1: Audit Existing Convergence and Define the Canonical Map
- Goal:
  - Produce a file-level inventory of what is already converged in `apps/dapp` and what should be implemented from the design spec, with `kimiui` only as a secondary reference.
- Affected files/modules:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/components/ui-custom/`
  - `apps/dapp/src/components/pages/`
  - `apps/kimiui/src/components/ui-custom/`
  - `apps/kimiui/src/components/pages/`
- Implementation notes:
  - Treat this as a decision milestone, not a copy milestone.
  - Mark each candidate item as one of:
    - already converged in `dapp`
    - needs visual refinement in `dapp`
    - reference only, do not port
  - Explicitly identify places where `apps/dapp` already diverged correctly because of real business constraints.
- Risks:
  - Re-implementing components that are already sufficiently aligned.
  - Accidentally planning to port mock behavior into production pages.
- Verification commands:
  - `sed -n '1,320p' docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `rg -n "GlassCard|BottomNav|WalletButton|TransactionStatus|StatCard" apps/dapp apps/kimiui`
  - `sed -n '1,240p' apps/dapp/src/app/globals.css`
  - `sed -n '1,240p' apps/dapp/src/components/layout/mobile-layout.tsx`
- Expected outputs:
  - A canonical source map showing what stays owned by `dapp` and what visual patterns still need convergence.

### Milestone 2: Consolidate Design Tokens and Shared Visual Primitives in DApp
- Goal:
  - Make `apps/dapp` the single source of truth for the shared AURA design system.
- Affected files/modules:
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/src/components/ui/`
  - `apps/dapp/src/components/ui-custom/`
  - `apps/dapp/components.json`
- Implementation notes:
  - Port only the visual tokens and stable utility patterns described in sections 2 and 3 of the design spec and compatible with the existing Tailwind v4 stack.
  - Do not copy `apps/kimiui` PostCSS/Tailwind config into `apps/dapp`.
  - Normalize duplicated `GlassCard`, `StatCard`, `Toast`, and `TransactionStatus` styling into reusable primitives.
  - Keep gradients, radii, shadows, and safe-area behavior centralized.
- Risks:
  - Token drift between base UI and page-local classes.
  - Breaking current `dapp` styles by importing incompatible KimiUI config assumptions.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - `apps/dapp` owns a stable, centralized visual system and no longer depends on ad hoc page-local styling for the main KimiUI look.

### Milestone 3: Converge Shell, Navigation, and Wallet Interaction Surfaces
- Goal:
  - Bring the page shell, header, wallet entry point, and bottom action/navigation behavior in `apps/dapp` to the intended KimiUI level without changing route architecture.
- Affected files/modules:
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/dapp/src/store/ui.store.ts`
- Implementation notes:
  - Use sections 3.1, 4.1, and the P0 priorities in the design spec as the primary guide.
  - Preserve `next/navigation` and route URLs.
  - Preserve `next-intl` labels.
  - Preserve the extra login/signature semantics already embedded in the DApp wallet button.
  - Only migrate the interaction pattern, visual behavior, and state presentation.
  - Keep action-sheet logic traceable and route-safe.
- Risks:
  - Breaking auth flow by swapping in the simpler KimiUI wallet component.
  - Regressing route highlighting or quick-action behavior.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
  - Manual:
    - connect wallet
    - sign in
    - navigate between `/`, `/checkin`, `/team`, `/nft`, `/rewards`, `/claims`
- Expected outputs:
  - A DApp shell that looks and feels like the intended KimiUI experience while still behaving like a real Next.js app.

### Milestone 4: Refresh High-Value Functional Pages First
- Goal:
  - Update the most important user-facing pages first, using KimiUI as a presentation reference and `dapp` as the functional implementation.
- Affected files/modules:
  - `apps/dapp/src/components/pages/dashboard-page.tsx`
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - related translation files in `apps/dapp/messages/`
- Implementation notes:
  - Use section 4 of the design spec as the primary page-level target.
  - Reuse existing queries, mutations, stores, and wallet hooks.
  - Translate the design spec page composition into real `dapp` data states:
    - loading
    - empty
    - success
    - failure
    - pending transaction
  - Where KimiUI uses fake numbers, replace them with real derived values or clearly labeled placeholders already supported by `dapp`.
- Risks:
  - Visual convergence that hides real transaction or verification detail.
  - Over-fitting to the prototype and losing operational clarity for tx-hash-driven flows.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
  - Manual fork-anvil smoke:
    - sign in
    - submit check-in
    - open NFT page
    - open Claims page
- Expected outputs:
  - The most important `dapp` routes feel visually modern and coherent without regressing business usability.

### Milestone 5: Refresh Secondary Pages and Cross-Page Feedback
- Goal:
  - Finish convergence on lower-frequency pages and shared status, loading, error, accessibility, and transaction feedback so the product feels coherent end-to-end.
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/pages/rewards-page.tsx`
  - `apps/dapp/src/components/ui-custom/toast.tsx`
  - `apps/dapp/src/components/ui-custom/transaction-status.tsx`
  - `apps/dapp/src/components/ui-custom/stat-card.tsx`
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/dapp/src/app/globals.css`
- Implementation notes:
  - Use sections 5, 6, and 7 of the design spec as the primary source for:
    - loading states
    - error and retry treatment
    - transaction progress
    - ARIA/live-region improvements
    - reduced-motion and high-contrast support
  - Align visual density, spacing, icon treatment, and callout hierarchy across all routes.
  - Make sure real async states remain explicit and auditable.
  - Prefer small, testable page-level changes instead of one giant visual rewrite.
- Risks:
  - Inconsistent polish where only hero sections are updated.
  - Losing transaction clarity by over-optimizing for aesthetics.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
  - Manual route walkthrough for all 6 primary pages
- Expected outputs:
  - All main routes share a coherent interaction language and feedback model.

### Milestone 6: Manual Validation, Regression Review, and Rollout Readiness
- Goal:
  - Confirm that the visual convergence did not break real promotion workflows.
- Affected files/modules:
  - `apps/dapp`
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Implementation notes:
  - Validate against fork-anvil, not against mock-only assumptions.
  - Use the design spec priority model to judge what must be complete for P0 closure and what can stay as later enhancements.
  - Record screenshots or notes for major routes before/after if useful.
  - Capture any remaining differences that are intentionally kept because of functional constraints.
- Risks:
  - Declaring UI work done based only on screenshots or static rendering.
  - Missing regressions in wallet auth, tx submission, or claim UX.
- Verification commands:
  - `PROMOTION_ENV=fork-anvil pnpm promotion-env:fork:reset`
  - `node scripts/uat/start-promotion-services.mjs --env fork-anvil --services server`
  - `PROMOTION_ENV=fork-anvil pnpm --dir apps/dapp env:dev`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - A release-ready judgment on whether the converged DApp is visually improved and the system remains functionally safe.

## Atomic Task Breakdown

### Milestone 1 Task Breakdown

#### Task 1.1: Audit Global Tokens Already Present in DApp
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/dapp/src/app/globals.css`
  - `apps/kimiui/src/index.css`
- Done condition:
  - Record which tokens are already converged and which are missing.
- Verification:
  - `sed -n '1,240p' apps/dapp/src/app/globals.css`

#### Task 1.2: Audit Shell Component Parity
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/kimiui/src/components/ui-custom/BottomNav.tsx`
  - `apps/kimiui/src/components/ui-custom/WalletButton.tsx`
- Done condition:
  - Record which shell pieces are already aligned and which still need work.
- Verification:
  - `rg -n "BottomNav|WalletButton|MobileLayout" apps/dapp apps/kimiui`

#### Task 1.3: Audit Page-Level Parity for the Six Main Routes
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/dapp/src/components/pages/`
  - `apps/kimiui/src/components/pages/`
- Done condition:
  - Produce a keep/adapt/do-not-port list for dashboard, check-in, NFT, claims, team, rewards.
- Verification:
  - `rg --files apps/dapp/src/components/pages apps/kimiui/src/components/pages`

#### Task 1.4: Claims Page-Specific Design Map
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/dapp/src/components/pages/claims-page.tsx`
- Done condition:
  - Document which parts of the design spec Claims section can be implemented directly and which require functional validation in the current DApp.
- Verification:
  - `sed -n '1,320p' apps/dapp/src/components/pages/claims-page.tsx`

#### Task 1.5: Priority Map from Design Spec to DApp Scope
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Record which spec items are treated as:
    - P0 for this task
    - follow-up enhancement
    - deferred because of business/runtime constraints
- Verification:
  - `sed -n '640,780p' docs/spec/3U_DApp_UI_Improvement_Design.md`

#### Task 1.6: Backend / Contract Dependency Audit
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `apps/dapp/src/api/`
  - `apps/dapp/src/queries/`
  - `apps/server/src/modules/claims/`
  - `apps/server/src/auth/services/auth.service.ts`
  - `apps/dapp/src/lib/promotion-contracts.ts`
  - `packages/common/src/models/promotion.ts`
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Record which design-spec items:
    - can ship on current APIs/contracts
    - need server/shared-model changes
    - may need contract support
- Verification:
  - `rg -n "claims/me|claims/sync|signature_message|claimPurchasedSubsidyBatch|claim\\(" apps/dapp apps/server packages/common -S`

#### Task 1.7: Non-UI Stream Handoff Note
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/plan-excution/multilingual-notification-center/plan.md`
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Record which design-spec items have been intentionally moved out of this UI plan so later low-reasoning agents do not reopen them here.
- Verification:
  - review sibling plan and `execution.md`

### Milestone 2 Task Breakdown

#### Task 2.1: Normalize Global AURA Tokens
- Write scope:
  - `apps/dapp/src/app/globals.css`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/index.css`
- Done condition:
  - Colors, radii, shadows, gradients, and text tokens are defined once in `dapp`.
- Verification:
  - `pnpm --dir apps/dapp build`

#### Task 2.2: Normalize Safe-Area and Animation Utilities
- Write scope:
  - `apps/dapp/src/app/globals.css`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/index.css`
- Done condition:
  - Shared safe-area and animation utilities used by page chrome exist in `dapp`.
- Verification:
  - `pnpm --dir apps/dapp build`

#### Task 2.3: Converge `glass-card.tsx`
- Write scope:
  - `apps/dapp/src/components/ui-custom/glass-card.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/GlassCard.tsx`
- Done condition:
  - `dapp` owns the canonical glass card primitive.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 2.4: Converge `stat-card.tsx`
- Write scope:
  - `apps/dapp/src/components/ui-custom/stat-card.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/StatCard.tsx`
- Done condition:
  - The stat card API and styling are stable for reuse across pages.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 2.5: Converge `transaction-status.tsx`
- Write scope:
  - `apps/dapp/src/components/ui-custom/transaction-status.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/TransactionStatus.tsx`
- Done condition:
  - Pending, success, and error transaction states share one presentational pattern.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 2.6: Converge `toast.tsx`
- Write scope:
  - `apps/dapp/src/components/ui-custom/toast.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/Toast.tsx`
- Done condition:
  - Toast visuals are consistent with the target design while preserving current app behavior.
- Verification:
  - `pnpm --dir apps/dapp lint`

### Milestone 3 Task Breakdown

#### Task 3.1: Refine Header Container and Spacing
- Write scope:
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/App.tsx`
  - `apps/kimiui/src/components/pages/Checkin.tsx`
  - `apps/kimiui/src/components/pages/Claims.tsx`
- Done condition:
  - Header rhythm, eyebrow, title spacing, and top chrome align with the intended design.
- Verification:
  - `pnpm --dir apps/dapp build`

#### Task 3.2: Refine Bottom Nav Main Items
- Write scope:
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/BottomNav.tsx`
- Done condition:
  - Main nav item spacing, active state, and icon treatment are aligned.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 3.3: Refine Bottom Nav FAB and Action Sheet
- Write scope:
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/BottomNav.tsx`
- Done condition:
  - FAB placement, overlay, sheet, and claim badge behavior are visually coherent.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 3.4: Refine Wallet Button Visual States Only
- Write scope:
  - `apps/dapp/src/components/wallet-button.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/ui-custom/WalletButton.tsx`
- Done condition:
  - Connect, wrong-network, connected, and signing states look polished without changing auth semantics.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 3.5: Route and i18n Regression Pass for Shell
- Write scope:
  - `apps/dapp/messages/`
  - small shell files only if needed
- Read scope:
  - `apps/dapp/src/app/`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
- Done condition:
  - Shell labels and route highlighting remain correct after visual changes.
- Verification:
  - `pnpm --dir apps/dapp build`

### Milestone 4 Task Breakdown

#### Task 4.1: Dashboard Hero and Summary Layout
- Write scope:
  - `apps/dapp/src/components/pages/dashboard-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Dashboard.tsx`
- Done condition:
  - Dashboard adopts the intended section rhythm without changing data sources.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.2: Check-in CTA Section Only
- Write scope:
  - `apps/dapp/src/components/pages/checkin-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Checkin.tsx`
- Done condition:
  - The top CTA and surrounding explanatory card feel closer to KimiUI while keeping tx-hash flow intact.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.3: Check-in Secondary Stats and Info Sections
- Write scope:
  - `apps/dapp/src/components/pages/checkin-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Checkin.tsx`
- Done condition:
  - Stats cards, calendar/progress analogs, and info treatment are improved where appropriate.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.4: NFT Page Hero and Card Layout
- Write scope:
  - `apps/dapp/src/components/pages/nft-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/NFT.tsx`
- Done condition:
  - NFT purchase page card hierarchy and CTA treatment are aligned with the target visual direction.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.5: Claims Page Section Inventory and Optional Extraction Boundary
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - optionally `apps/dapp/src/components/pages/claims/`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - The current `claims-page.tsx` is partitioned into clear sections that map to the design spec so later tasks can touch one section at a time.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.6: Claims Top Summary and Total Available Block
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted summary component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - The top summary area reflects the design spec's "金额突出 + 可领取概览" intent without changing claim calculations.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.7: Claims List Item Shell and Amount Emphasis
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted claim-row shell component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Claim rows clearly emphasize amount, currency, and type in the way the design spec expects.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.8: Claims Time Metadata and Expiry Presentation
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted metadata component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Available time, expiry time, and supporting timestamps are presented clearly for each claim type where data exists.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.9: Claims Wrong-Network and Sync-Error Banners
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted banner components
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Network warning and sync error cards are visually consistent and remain operationally explicit.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.10: Claims Merkle Section Header and Empty State
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted merkle section component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - The merkle claims area has clear title, count, and empty state treatment.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.11: Claims Merkle Claim Row Visuals
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted merkle row component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Each merkle claim row has refined icon, amount, status, and button layout without touching write logic.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.12: Claims Subsidy Section Header and Empty State
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted subsidy section component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - The subsidy claims area has clear title, count, and empty state treatment.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.13: Claims Subsidy Claim Row Visuals
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted subsidy row component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Each subsidy claim row has refined icon, amount, status, and button layout without touching write logic.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.14: Claims Batch-Action Feasibility Check
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/dapp/src/queries/claims.query.ts`
  - `apps/dapp/src/lib/promotion-contracts.ts`
- Done condition:
  - Record whether "一键领取所有可领取项" is:
    - feasible now
    - feasible only per claim type
    - not feasible without new product/backend/contract work
- Verification:
  - `rg -n "claim|sync|merkle|subsidy" apps/dapp/src/components/pages/claims-page.tsx apps/dapp/src/queries/claims.query.ts apps/dapp/src/lib/promotion-contracts.ts`

#### Task 4.14a: Claims Schema Enrichment Gate
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `packages/common/src/models/promotion.ts`
  - `apps/server/src/modules/claims/services/claims-read.service.ts`
- Done condition:
  - Decide whether Claims UI will:
    - stay within current fields
    - or require new API/shared-model fields for `availableAt`, `expiresAt`, `description`, or richer history metadata
- Verification:
  - `sed -n '374,410p' docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `sed -n '146,179p' packages/common/src/models/promotion.ts`

#### Task 4.15: Claims History and Collapsible Record Treatment
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or extracted history component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - If claimed history data exists, it is presented in a compact/collapsible way aligned with the design spec.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.16: Claims Transaction Feedback and Explorer Links
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/dapp/src/components/ui-custom/transaction-status.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Claim flows expose better transaction state and block explorer affordances where the current runtime data allows.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.17: Claims Loading, Empty, and Retry States
- Write scope:
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - or small shared state component
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Claims page has clear loading, empty, error, and retry treatment aligned with the design spec.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 4.18: Claims Page Manual Functional Smoke
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Read scope:
  - running `apps/dapp`
  - fork-anvil environment
- Done condition:
  - Manual notes recorded for:
    - wrong network state
    - claimable merkle state
    - claimable subsidy state
    - sync success or failure state
- Verification:
  - `PROMOTION_ENV=fork-anvil pnpm --dir apps/dapp env:dev`

### Milestone 5 Task Breakdown

#### Task 5.1: Team Page Hero and Top Stats
- Write scope:
  - `apps/dapp/src/components/pages/team-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Team.tsx`
- Done condition:
  - Team page top section is visually converged without changing tree/business semantics.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 5.2: Team Page Secondary Sections
- Write scope:
  - `apps/dapp/src/components/pages/team-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Team.tsx`
- Done condition:
  - Secondary cards and list/tree sections are visually aligned.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 5.3: Rewards Page Hero and Top Summary
- Write scope:
  - `apps/dapp/src/components/pages/rewards-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Rewards.tsx`
- Done condition:
  - Rewards top section matches the intended KimiUI hierarchy.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 5.4: Rewards Page Secondary Content
- Write scope:
  - `apps/dapp/src/components/pages/rewards-page.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - `apps/kimiui/src/components/pages/Rewards.tsx`
- Done condition:
  - Secondary rewards sections are polished without changing data logic.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 5.5: Cross-Page Loading, Empty, and Error Treatment
- Write scope:
  - small shared components under `apps/dapp/src/components/ui-custom/`
  - or page-local small components
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
  - main page files
- Done condition:
  - Common empty/loading/error presentation feels coherent across routes.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 5.6: Wallet and Transaction Accessibility Labels
- Write scope:
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/dapp/src/components/ui-custom/transaction-status.tsx`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - Important wallet and transaction status surfaces expose sensible `aria-*` and live-region support.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 5.7: Reduced-Motion and High-Contrast CSS Pass
- Write scope:
  - `apps/dapp/src/app/globals.css`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - The DApp includes baseline support for `prefers-reduced-motion` and high-contrast-friendly adjustments.
- Verification:
  - `pnpm --dir apps/dapp build`

#### Task 5.8: Skeleton and Shimmer Pattern Baseline
- Write scope:
  - small shared loading component or page-local loading sections under `apps/dapp/src/components/`
- Read scope:
  - `docs/spec/3U_DApp_UI_Improvement_Design.md`
- Done condition:
  - At least one reusable skeleton/shimmer pattern exists for major async sections.
- Verification:
  - `pnpm --dir apps/dapp lint`

### Milestone 6 Task Breakdown

#### Task 6.1: Lint Pass
- Write scope:
  - none unless fixes are needed
- Done condition:
  - `apps/dapp` lint passes.
- Verification:
  - `pnpm --dir apps/dapp lint`

#### Task 6.2: Typecheck Pass
- Write scope:
  - none unless fixes are needed
- Done condition:
  - `apps/dapp` typecheck passes.
- Verification:
  - `pnpm --dir apps/dapp typecheck`

#### Task 6.3: Build Pass
- Write scope:
  - none unless fixes are needed
- Done condition:
  - `apps/dapp` build passes.
- Verification:
  - `pnpm --dir apps/dapp build`

#### Task 6.4: Fork-Anvil Manual Smoke
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Done condition:
  - Manual route checks are recorded for dashboard, check-in, NFT, claims, team, rewards.
- Verification:
  - `PROMOTION_ENV=fork-anvil pnpm promotion-env:fork:reset`
  - `node scripts/uat/start-promotion-services.mjs --env fork-anvil --services server`
  - `PROMOTION_ENV=fork-anvil pnpm --dir apps/dapp env:dev`

#### Task 6.5: Claims Functional Smoke
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Done condition:
  - Manual end-to-end notes are recorded for:
    - wrong-network state
    - claimable merkle state
    - claimable subsidy state
    - claim sync success or failure state
- Verification:
  - integrated DApp/server smoke when implementation begins

#### Task 6.6: Final Divergence Note
- Write scope:
  - `docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`
- Done condition:
  - Any intentional differences from the design spec or `kimiui` are documented so later low-reasoning agents do not "fix" them incorrectly.
- Verification:
  - review `execution.md`

## Recommended Assignment and Parallelism

### High-Level Rule
- This plan supports **mixed execution**:
  - some tasks can run in parallel
  - some tasks must be done in sequence
- The dividing line in this UI-only plan is:
  - pure DApp UI/presentation work can usually parallelize
  - dense single-file refactors and Claims gating work should queue first

### Tasks That Must Be Done First
- These should be owned by a high-reasoning agent or main coordinator before wider delegation:
  - `Task 1.6` Backend / Contract Dependency Audit
  - `Task 1.7` Non-UI Stream Handoff Note
  - `Task 4.14` Claims Batch-Action Feasibility Check
  - `Task 4.14a` Claims Schema Enrichment Gate

### Tasks Suitable for Low-Reasoning Agents
- Good low-reasoning targets are tasks with:
  - one file owner
  - clear visual acceptance
  - no business-rule redesign
  - no schema or contract change
- Best candidates:
  - `Task 2.3`
  - `Task 2.4`
  - `Task 2.5`
  - `Task 2.6`
  - `Task 3.1`
  - `Task 3.4`
  - `Task 4.1`
  - `Task 4.4`
  - `Task 5.1`
  - `Task 5.3`
  - `Task 5.5`
  - `Task 5.8`

### Tasks That Should Stay Single-Owner
- These touch one dense file or one tightly coupled area and should not be split across multiple low-reasoning agents at the same time:
  - `Task 3.2` + `Task 3.3`
    - same file: `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `Task 4.2` + `Task 4.3`
    - same file: `apps/dapp/src/components/pages/checkin-page.tsx`
  - `Task 4.5` through `Task 4.18`
    - same functional area: Claims page
  - `Task 5.1` + `Task 5.2`
    - same file: `apps/dapp/src/components/pages/team-page.tsx`
  - `Task 5.3` + `Task 5.4`
    - same file: `apps/dapp/src/components/pages/rewards-page.tsx`

### Recommended Execution Waves

#### Wave 0: Gates and Boundaries
- Mode:
  - sequential
- Owner:
  - high-reasoning agent / main coordinator
- Tasks:
  - `Task 1.6`
  - `Task 1.7`
  - `Task 4.14`
  - `Task 4.14a`
- Why:
  - These tasks decide whether later UI work can stay frontend-only and prevent low-reasoning agents from reopening moved server/admin scope.

#### Wave 1: Shared DApp Visual Foundation
- Mode:
  - parallel, with disjoint write scopes
- Suggested lanes:
  - Lane A:
    - `Task 2.1`
    - `Task 2.2`
  - Lane B:
    - `Task 2.3`
    - `Task 2.4`
  - Lane C:
    - `Task 2.5`
    - `Task 2.6`
  - Lane D:
    - `Task 3.1`
  - Lane E:
    - `Task 3.4`
- Queue note:
  - `Task 3.2` and `Task 3.3` should wait until the shell styling baseline is stable, then stay single-owner.

#### Wave 2: Shell Finalization
- Mode:
  - mixed
- Suggested order:
  - first `Task 3.2`
  - then `Task 3.3`
  - then `Task 3.5`
- Why:
  - Bottom nav and action sheet are coupled and easier to validate when edited in sequence.

#### Wave 3: Main DApp Pages
- Mode:
  - parallel by page
- Suggested lanes:
  - Lane A:
    - `Task 4.1`
  - Lane B:
    - `Task 4.2`
    - `Task 4.3`
  - Lane C:
    - `Task 4.4`
  - Lane D:
    - `Task 5.1`
    - `Task 5.2`
  - Lane E:
    - `Task 5.3`
    - `Task 5.4`
- Queue note:
  - Claims work should not be split across multiple agents unless the page has already been extracted into disjoint subcomponents.

#### Wave 4: Claims Track
- Mode:
  - single-owner or tightly coordinated pair at most
- Suggested order:
  - `Task 4.5`
  - `Task 4.6`
  - `Task 4.7`
  - `Task 4.8`
  - `Task 4.9`
  - `Task 4.10`
  - `Task 4.11`
  - `Task 4.12`
  - `Task 4.13`
  - `Task 4.15`
  - `Task 4.16`
  - `Task 4.17`
  - `Task 4.18`
- Why:
  - Claims mixes transaction feedback, status display, and possible API/schema gates; fragmentation increases regression risk.

#### Wave 5: Final Verification
- Mode:
  - sequential closeout
- Tasks:
  - `Task 6.1`
  - `Task 6.2`
  - `Task 6.3`
  - `Task 6.4`
  - `Task 6.5`
  - `Task 6.6`

### Practical Staffing Recommendation
- If only 1 agent:
  - run mostly in queue order by wave
- If 2 to 3 agents:
  - one high-reasoning coordinator
  - one DApp UI worker
  - one optional second DApp page worker after Wave 1 opens
- If 4 to 5 agents:
  - 1 coordinator for gates and integration
  - 1 shared UI/components worker
  - 2 DApp page workers on disjoint files
  - 1 claims/smoke worker after Wave 3 opens

### Suggested Assignment Matrix
- Coordinator lane:
  - own `Task 1.6`, `Task 1.7`, `Task 4.14`, `Task 4.14a`
  - approve when later lanes may start
  - keep `execution.md` aligned with dependency decisions
- Shared UI lane:
  - own `Task 2.1`, `Task 2.2`, `Task 2.3`, `Task 2.4`, `Task 2.5`, `Task 2.6`
  - stay inside `apps/dapp/src/app/globals.css` and shared `ui` / `ui-custom` primitives
- Shell lane:
  - own `Task 3.1`, `Task 3.2`, `Task 3.3`, `Task 3.4`, `Task 3.5`
  - start only after the shared UI lane produces a stable token baseline
- Page lane A:
  - own `Task 4.1`, `Task 4.2`, `Task 4.3`
  - write scope stays in dashboard/check-in surfaces
- Page lane B:
  - own `Task 4.4`, `Task 5.1`, `Task 5.2`, `Task 5.3`, `Task 5.4`
  - write scope stays in NFT, team, and rewards surfaces
- Claims lane:
  - own `Task 4.5` through `Task 4.18`
  - do not split across multiple low-reasoning agents unless the page is first extracted into clearly disjoint components
- Verification lane:
  - own `Task 6.1` through `Task 6.6`
  - should be the final queue stage, not a parallel starting lane

### Parallelism Rule of Thumb
- Can run in parallel:
  - disjoint DApp page tasks
  - shared UI work and later page work once tokens stabilize
- Must queue first:
  - any task that edits one dense file already owned by another lane
  - any task that depends on `Claims` contract/API decisions
  - any task that reintroduces notification/admin/server work into this UI-only plan
- Default safe rule:
  - if two tasks touch the same file, the same API contract, or the same page container, queue them
  - if two tasks touch disjoint DApp files and depend only on already-settled frontend boundaries, parallelize them

## Approval Checkpoint
Approval is needed on the direction and shell strategy before implementation begins:
- Confirm that `apps/dapp` remains the target app.
- Confirm that `apps/kimiui` is reference-only.
- Confirm that we are doing selective convergence, not literal component-for-component transplantation.
- Confirm after Milestone 2 or Milestone 3 before broad page refresh if the visual direction needs adjustment.

## Rollback / Recovery Notes
- Keep changes incremental and page-scoped so rollback can happen by component or route.
- Do not remove existing `dapp` business hooks or route files in the same change where visual convergence is introduced.
- Preserve the current working `dapp` shell until the converged shell has passed manual smoke checks.
- If a KimiUI-inspired interaction conflicts with real auth or transaction behavior, prefer the existing `dapp` behavior and document the intentional divergence.

## Final Verification Checklist
- [ ] `apps/dapp` is explicitly the canonical implementation target.
- [ ] No runtime dependency is introduced from `apps/dapp` to `apps/kimiui`.
- [ ] Shared design tokens and visual primitives are centralized in `apps/dapp`.
- [ ] Bottom navigation and wallet entry behavior remain route-safe and auth-safe.
- [ ] Dashboard, Check-in, NFT, Claims, Team, and Rewards pages are visually coherent.
- [ ] Loading, empty, error, pending, and success states remain explicit.
- [ ] `pnpm --dir apps/dapp lint` passed.
- [ ] `pnpm --dir apps/dapp typecheck` passed.
- [ ] `pnpm --dir apps/dapp build` passed.
- [ ] Manual fork-anvil smoke validation was completed and recorded in `execution.md`.
