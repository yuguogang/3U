# DApp Multilingual Coverage

## 1. Objective

Expand the existing DApp internationalization layer so the main product surfaces stop mixing Chinese and English, and instead render consistently from the current locale across all supported DApp languages.

The task now also includes locale-aware formatting and a user-facing language switch entry in the mobile header, because message translation alone is not sufficient if dates still render in English or the user cannot change locale in-app.

This task is not about introducing i18n from scratch. The repository already has:

- `next-intl` wired into the DApp shell
- locale persistence via cookie
- supported locales:
  - `en`
  - `zh`
  - `zh-Hant`
  - `vi`
  - `ko`
  - `ja`
- an existing `Common` / `Language` message pattern

The goal is to close the current coverage gap so high-traffic DApp pages such as dashboard, team, rewards, claims, check-in, and NFT surfaces no longer rely on hard-coded English copy.

## 2. Scope

- Audit and replace hard-coded page/UI copy in the DApp with locale-backed messages
- Make high-visibility date/time formatting locale-aware for the currently selected DApp locale
- Add an in-app locale switch control to the DApp header
- Adjust header interaction density so language switching does not crowd the notification / chain / wallet controls
- Extend the current DApp message-loading strategy beyond the current `Common` and `Language` namespaces
- Standardize translation key organization for page-level copy, section copy, status copy, and reusable CTA text
- Localize the main end-user DApp pages:
  - dashboard
  - team
  - check-in
  - rewards
  - claims
  - NFT
- Localize supporting high-visibility UI around those pages where needed:
  - page headers / `MobileLayout` usage
  - section headers
  - buttons / empty states / loading states / error states
  - summary cards / stat labels
- Preserve existing locale behavior and default locale selection
- Verify all configured locales have corresponding message coverage for newly introduced keys

## 3. Out of Scope

- Admin app localization
- Server API localization
- Notification content localization changes beyond keeping current behavior intact
- Broad visual redesign of the header beyond what is needed to make locale switching fit cleanly
- URL-based locale routing changes
- New locale additions beyond the six already configured
- Machine translation quality review with native-language copy editing beyond a practical first-pass product translation

## 4. Assumptions

- The DApp should continue using `next-intl` as the canonical i18n layer
- Current locale cookie behavior in `apps/dapp/src/i18n/locale-actions.ts` is sufficient
- The default locale remains `zh`
- The current mixed-language problem is primarily caused by hard-coded client-page strings, not missing locale detection
- It is acceptable to restructure message files if that reduces long-term translation sprawl
- Existing translation coverage in notifications and bottom navigation should be preserved and used as the reference pattern
- A compact dropdown-style language selector is preferable to adding another always-expanded header button on narrow mobile widths

## 5. Architecture Impact

### DApp i18n Runtime

- `apps/dapp/src/i18n/request.ts`
  - currently loads only `Common` and `Language`
  - likely needs extension so additional namespaces can be loaded deterministically
- `apps/dapp/src/i18n/constants.ts`
  - locale list and default locale remain the canonical configuration
- `apps/dapp/src/i18n/locale-actions.ts`
  - already supports cookie updates
  - expected to be reused by the new language switch UI

### Locale-Aware Formatting

- `apps/dapp/src/lib/promotion-format.ts`
  - currently hard-codes `en-US` for date formatting
  - must be updated so formatting can follow the selected app locale
- any page currently using `formatDateTime(...)`
  - needs a locale-aware call path rather than server-default English formatting

### Header Interaction Density

- `apps/dapp/src/components/layout/mobile-layout.tsx`
  - current header only exposes notifications + wallet controls
  - needs a language switch entry without breaking the existing compact mobile layout
- likely supporting UI:
  - a new locale switcher component under `apps/dapp/src/components/**`
  - reuse of existing dropdown primitives under `apps/dapp/src/components/ui/dropdown-menu.tsx`

### Message Assets

- `apps/dapp/messages/*/common.json`
  - currently contains only nav + notifications
- `apps/dapp/messages/*/language.json`
  - currently minimal
- Additional message organization will likely be needed, for example:
  - page-scoped namespaces such as `Dashboard`, `Team`, `Checkin`, `Rewards`, `Claims`, `Nft`
  - or a deliberately expanded `Common` if the team prefers fewer files

### DApp Pages With Confirmed Hard-Coded Copy

- `apps/dapp/src/components/pages/dashboard-page.tsx`
- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/dapp/src/components/pages/checkin-page.tsx`
- `apps/dapp/src/components/pages/rewards-page.tsx`
- `apps/dapp/src/components/pages/claims-page.tsx`
- `apps/dapp/src/components/pages/nft-page.tsx`

### DApp Pages Already Using i18n

- `apps/dapp/src/components/pages/notifications-page.tsx`
- `apps/dapp/src/components/ui-custom/bottom-nav.tsx`

These files should serve as the existing implementation baseline rather than be rewritten wholesale.

## 6. Current Coverage Findings

### 6.1 Framework Baseline Exists

The DApp already has working locale infrastructure:

- `NextIntlClientProvider` is mounted in `apps/dapp/src/app/layout.tsx`
- the locale is resolved from cookie in `apps/dapp/src/i18n/request.ts`
- `Common` and `Language` messages are loaded successfully

### 6.2 Coverage Gap Is Primarily Page-Layer Copy

Most product pages still render direct strings in JSX, including:

- page titles / eyebrows
- stat labels
- section headings
- empty / loading / error copy
- CTA labels
- feature-card titles and descriptions

### 6.3 Message Loading Strategy Is Too Narrow

The current request config only loads:

- `Common`
- `Language`

That is sufficient for the notification center and bottom nav, but not for the broader product pages unless all strings are forced into one oversized common namespace.

### 6.4 Existing Translation Pattern Is Reusable

Notifications already demonstrate the expected usage pattern:

- `useTranslations("Common")`
- locale-specific message files under `apps/dapp/messages/<locale>/`

This should be extended rather than replaced.

### 6.5 Locale Formatting Is Still Partially Hard-Coded

- `apps/dapp/src/lib/promotion-format.ts` formats date/time with `en-US`
- this causes screens such as rewards schedule cards to keep English month/day formatting even when copy is translated
- this is now an explicit part of the scope gap

### 6.6 Locale Switching Is Implemented In State, But Not In UI

- locale persistence already exists through `NEXT_LOCALE`
- there is no user-visible language switch control in the DApp header
- the new UI should prioritize compactness on mobile and may need a dropdown / overflow treatment rather than another always-visible full-width button

## 7. Milestones

### Milestone 1: i18n Contract and Message Organization

- Goal:
  - lock the message organization and runtime loading approach before bulk copy replacement
- Affected files/modules:
  - `apps/dapp/src/i18n/request.ts`
  - `apps/dapp/messages/*/*.json`
  - reference usage in `apps/dapp/src/components/pages/notifications-page.tsx`
  - reference usage in `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- Implementation notes:
  - decide whether to:
    - keep everything under `Common`
    - or introduce page-scoped namespaces
  - recommended direction:
    - keep shared reusable strings in `Common`
    - add page-scoped namespaces for larger page surfaces
  - ensure every configured locale loads the same namespace set
  - keep runtime loading deterministic in `request.ts`
- Risks:
  - overloading `Common` into an unmaintainable translation dump
  - fragmenting messages into too many tiny files and increasing maintenance overhead
  - forgetting to update all locales when adding new namespaces
- Verification commands:
  - `sed -n '1,220p' apps/dapp/src/i18n/request.ts`
  - `find apps/dapp/messages -maxdepth 2 -type f | sort`
  - `sed -n '1,240p' apps/dapp/messages/zh/common.json`
  - `sed -n '1,240p' apps/dapp/messages/en/common.json`
- Expected outputs:
  - a clear, minimal namespace/file strategy for the DApp

### Milestone 2: Locale-Aware Formatting + Header Locale Switch

- Goal:
  - ensure translated pages also format dates/times in the active locale and provide a practical in-app language switch entry
- Affected files/modules:
  - `apps/dapp/src/lib/promotion-format.ts`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/i18n/locale-actions.ts`
  - likely a new header locale switcher component
  - any page currently displaying formatted schedule dates
- Implementation notes:
  - remove the hard-coded `en-US` formatting path for end-user date/time surfaces
  - prefer passing the active locale explicitly from client pages/components
  - add a compact locale switch control in the header
  - recommended direction:
    - use a dropdown-style menu rather than a permanently expanded extra button
    - keep notification + chain/account controls readable on narrow widths
- Risks:
  - hydration mismatches if locale formatting is changed inconsistently between server and client
  - making the header overly dense or causing chain/account controls to wrap awkwardly
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - manual smoke of locale switching on a narrow mobile viewport
- Expected outputs:
  - visible language switch entry in the header
  - date/time formatting that follows the selected locale

### Milestone 3: Dashboard + Shared Shell Coverage

- Goal:
  - localize the most visible landing surface and any shared shell copy it depends on
- Affected files/modules:
  - `apps/dapp/src/components/pages/dashboard-page.tsx`
  - `apps/dapp/src/components/layout/mobile-layout.tsx` if needed
  - message files for all locales
- Implementation notes:
  - replace hero, stat-card, feature-card, milestone, and auth-required copy with translation keys
  - avoid changing business logic or data fetching
  - normalize repeated strings such as:
    - `Loading...`
    - `Details`
    - section headers
    - short CTA labels
- Risks:
  - mixing page-specific keys and generic keys inconsistently
  - leaving enum/status labels partially untranslated
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - manual dashboard smoke in at least `zh` and `en`
- Expected outputs:
  - dashboard and shared shell render consistently in the selected locale

### Milestone 4: Team / Check-In / Rewards / Claims / NFT Page Coverage

- Goal:
  - localize the remaining core product pages that still contain hard-coded copy
- Affected files/modules:
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/components/pages/rewards-page.tsx`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - related local page helpers under `apps/dapp/src/components/pages/**`
  - message files for all locales
- Implementation notes:
  - keep page logic unchanged; localize copy only
  - translate:
    - titles / eyebrows
    - card labels
    - helper descriptions
    - empty/loading/error states
    - button labels
  - pay special attention to newly added team-tree focus copy so it lands in all locales too
- Risks:
  - hidden hard-coded strings inside nested helper components
  - partial translations causing mixed-language screens even after page files are updated
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - the main product journey is locale-backed rather than hard-coded

### Milestone 5: Coverage Audit and Locale Completeness

- Goal:
  - confirm there are no major untranslated user-facing gaps in the main DApp path
- Affected files/modules:
  - `apps/dapp/messages/*`
  - `apps/dapp/src/components/pages/*`
  - `apps/dapp/src/components/ui-custom/*` where touched
- Implementation notes:
  - run a final audit for residual hard-coded copy in the targeted DApp scope
  - verify every newly added key exists in every locale file
  - document any intentional leftovers instead of silently skipping them
- Risks:
  - runtime missing-key issues hidden until a non-default locale is selected
  - leaving hard-coded fallback copy that defeats the purpose of the coverage pass
- Verification commands:
  - `rg -n '\"[A-Za-z][^\"]{2,}\"' apps/dapp/src/components/pages apps/dapp/src/components/ui-custom -g '!**/node_modules/**'`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp build`
  - manual locale smoke for at least:
    - `zh`
    - `en`
- Expected outputs:
  - a documented and mostly complete multilingual DApp coverage baseline

## 8. Approval Checkpoint

Do not implement until this plan is approved.

Approval for this task means agreement on:

1. treating this as a DApp-only localization coverage task
2. extending the current `next-intl` message loading strategy rather than replacing it
3. adding locale-aware formatting for user-visible dates/times
4. adding a compact header locale switch entry, with dropdown-style interaction if space is tight
5. allowing message-file restructuring if needed for maintainability
6. prioritizing the main product pages first, not every edge surface in one pass

## 9. Rollback / Recovery Notes

- Keep message namespace changes additive so the existing `Common` and `Language` flow still works during the migration
- Land translation replacement in small, reviewable page batches
- If a namespace restructuring proves too invasive, fall back to a single expanded `Common` namespace for the first pass and record the compromise in `execution.md`
- If a locale file cannot be completed safely in the same pass, document it explicitly instead of relying on accidental fallback behavior

## 10. Final Verification Checklist

- [ ] The DApp i18n runtime loads all namespaces required by the updated pages
- [ ] User-visible schedule/date formatting follows the selected locale instead of forcing `en-US`
- [ ] The mobile header exposes a working locale switch entry without overcrowding wallet / chain / notifications
- [ ] `dashboard-page.tsx` no longer relies on hard-coded user-facing English copy
- [ ] `team-page.tsx` no longer relies on hard-coded user-facing English copy
- [ ] `checkin-page.tsx` no longer relies on hard-coded user-facing English copy
- [ ] `rewards-page.tsx` no longer relies on hard-coded user-facing English copy
- [ ] `claims-page.tsx` no longer relies on hard-coded user-facing English copy
- [ ] `nft-page.tsx` no longer relies on hard-coded user-facing English copy
- [ ] Newly added translation keys exist for all configured locales
- [ ] `pnpm --dir apps/dapp lint` passes
- [ ] `pnpm --dir apps/dapp typecheck` passes
- [ ] `pnpm --dir apps/dapp build` passes
- [ ] `execution.md` records actual commands, results, and any translation-coverage gaps left for follow-up
