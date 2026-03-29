## Objective
- Add user-selectable DApp visual themes without cluttering the top navigation.
- Consolidate theme and language controls into the bottom `More` panel instead of scattering standalone top-bar buttons.
- Keep the rollout low-risk by reusing the existing `next-themes` and `next-intl` foundations already present in the DApp.

## Scope
- Introduce a multi-theme system for the DApp with at least:
  `Night` (current style baseline)
  `Day` (bright daytime variant)
  `Aura` or another branded alternate style for product differentiation
- Replace the current standalone language trigger in the header by moving language and theme controls into the bottom `More` panel.
- Add a settings surface that contains:
  theme selection
  language selection
  reserved room for future preferences such as notification and display options
- Persist the selected theme locally per browser without affecting remote deployment configuration.
- Preserve current page IA and avoid adding more top-bar buttons.

## Out of Scope
- Full desktop redesign or information architecture rewrite.
- Rebuilding every page into a distinct layout system in one pass.
- Server-side storage of user preferences.
- Notification preference backend or push-delivery settings.
- Admin panel theme support.

## Assumptions
- The user preference is to avoid increasing the number of top-right buttons.
- The current header language button should be removed rather than replaced by another top-bar button.
- The bottom center action entry can evolve from a pure quick-action `+` into a `More` panel that mixes actions and global preferences.
- Existing multi-language support remains cookie-based and should continue to work unchanged.
- Theme persistence should be client-side first:
  `next-themes` + local storage is acceptable for phase 1
  no DB schema or API change is required
- The current dark style remains the default and becomes the formal `Night` theme.

## Current State Findings
- Theme plumbing already exists but is underused:
  [`apps/dapp/src/app/layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/layout.tsx)
  [`apps/dapp/src/components/providers/theme-provider.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/providers/theme-provider.tsx)
- The visual system is effectively single-theme today because most tokens and hard-coded surfaces assume the current dark presentation:
  [`apps/dapp/src/app/globals.css`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/globals.css)
  [`apps/dapp/src/components/layout/mobile-layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)
- Multi-language support is already in place and production-shaped:
  [`apps/dapp/src/i18n/constants.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/i18n/constants.ts)
  [`apps/dapp/src/components/i18n/locale-switcher.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/i18n/locale-switcher.tsx)
- Header space is already crowded, so adding separate theme or settings buttons would make the UI noisier:
  [`apps/dapp/src/components/layout/mobile-layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)
- The bottom center entry already opens a sheet-like action menu, making it the natural extension point for a grouped `More` panel:
  [`apps/dapp/src/components/ui-custom/bottom-nav.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/bottom-nav.tsx)

## Recommended Direction
- Upgrade the bottom center `+` entry into a `More` panel rather than introducing any new top-bar controls.
- Keep the bottom navigation structure as:
  `Dashboard / Team / NFT / Rewards / More`
- Inside the `More` panel, split content into two groups:
  `Quick Actions`
  `Preferences`
- `Quick Actions` should contain high-frequency secondary destinations such as:
  check-in
  claims
  notifications
- `Preferences` should contain:
  theme cards / segmented selector
  language list
  reserved room for future display and notification preferences
- Keep wallet-specific actions in the wallet menu and do not mix them with global app preferences.
- Build the theme system on semantic CSS variables rather than page-by-page color overrides.

## Alternatives Considered

### Option 1
- Add a separate theme toggle button next to language and wallet.
- Pros:
  low implementation effort
- Cons:
  directly conflicts with the “do not add many top buttons” requirement
  scales poorly once more settings are added
- Decision:
  reject

### Option 2
- Put all preferences only inside the wallet/account menu.
- Pros:
  no extra top-level entry
- Cons:
  weak discoverability before login
  language/theme are global app preferences, not wallet-only actions
- Decision:
  reject as the primary pattern

### Option 3
- Replace the language-only trigger with a unified bottom `More` panel.
- Pros:
  reduces header clutter further
  works before login
  gives a durable place to add more controls later
  fits one-handed mobile usage better than a top-right settings target
- Cons:
  requires the existing `+` semantics to shift from “do something” to “open more”
- Decision:
  recommend

## Architecture Impact
- Root theme configuration updates:
  [`apps/dapp/src/app/layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/layout.tsx)
  [`apps/dapp/src/components/providers/theme-provider.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/providers/theme-provider.tsx)
- Global token and preset work:
  [`apps/dapp/src/app/globals.css`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/globals.css)
- New `More` panel / preferences UI and shared state:
  [`apps/dapp/src/store/ui.store.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/store/ui.store.ts)
  [`apps/dapp/src/components/ui-custom/bottom-nav.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/bottom-nav.tsx)
- Header simplification:
  [`apps/dapp/src/components/layout/mobile-layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)
- Language selector reuse or refactor:
  [`apps/dapp/src/components/i18n/locale-switcher.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/i18n/locale-switcher.tsx)
- Copy additions:
  `apps/dapp/messages/*/common.json`
  potentially `apps/dapp/messages/*/language.json` or a new preferences namespace

## Milestones

### Milestone 1
- Goal:
  Formalize a semantic multi-theme token system that can support several visual presets without page-level hacks.
- Affected files/modules:
  [`apps/dapp/src/app/globals.css`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/globals.css)
  [`apps/dapp/src/app/layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/app/layout.tsx)
  [`apps/dapp/src/components/providers/theme-provider.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/providers/theme-provider.tsx)
- Implementation notes:
  Move from one hard-coded dark palette toward semantic tokens such as app background, elevated surface, border, text-secondary, accent glow, and brand gradient.
  Configure `next-themes` with named themes rather than only `dark/light`.
  Keep `Night` mapped to the current visual baseline so the first migration is non-breaking.
- Risks:
  Hard-coded `bg-[#050505]` and similar classes can bypass theme tokens and leave pages inconsistent.
  Some glass-card and gradient components may require targeted tokenization after the base refactor.
- Verification commands:
  `pnpm --dir apps/dapp typecheck`
  `pnpm --dir apps/dapp build`
- Expected outputs:
  Theme switching can change the global look without breaking layout or contrast.

### Milestone 2
- Goal:
  Introduce a unified bottom `More` panel that combines quick actions and preferences.
- Affected files/modules:
  [`apps/dapp/src/store/ui.store.ts`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/store/ui.store.ts)
  [`apps/dapp/src/components/ui-custom/bottom-nav.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/bottom-nav.tsx)
  [`apps/dapp/src/components/layout/mobile-layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)
- Implementation notes:
  Remove the header `LocaleSwitcher`.
  Rework the bottom center menu into a `More` panel.
  Inside the panel, separate global app preferences from wallet/account actions.
- Risks:
  The `+` icon alone may no longer communicate the new `More` meaning clearly and may need icon or label adjustment.
  The panel may become overloaded if action and preference groups are not visually distinct.
- Verification commands:
  `pnpm --dir apps/dapp typecheck`
- Expected outputs:
  Theme and language become reachable from the bottom `More` panel with less header clutter.

### Milestone 3
- Goal:
  Merge language control into the preferences surface and localize the new copy.
- Affected files/modules:
  [`apps/dapp/src/components/i18n/locale-switcher.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/i18n/locale-switcher.tsx)
  `apps/dapp/messages/*/common.json`
  optional new `apps/dapp/src/components/preferences/preferences-sheet.tsx`
- Implementation notes:
  Reuse the existing locale metadata and cookie-setting behavior.
  Keep the language list logic separate from theme logic, but present both in one sheet.
  Add copy for section titles, descriptions, and theme names.
- Risks:
  Locale copy drift across six languages can slow rollout if over-designed.
  The current dropdown UI may not transfer directly into a sheet without minor refactor.
- Verification commands:
  `pnpm --dir apps/dapp typecheck`
- Expected outputs:
  Language switching remains stable and now lives under the unified preferences surface.

### Milestone 4
- Goal:
  Apply theme tokens to the highest-visibility shell surfaces and validate the user experience end-to-end.
- Affected files/modules:
  [`apps/dapp/src/components/layout/mobile-layout.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx)
  [`apps/dapp/src/components/ui-custom/glass-card.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/glass-card.tsx)
  [`apps/dapp/src/components/ui-custom/bottom-nav.tsx`](/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/ui-custom/bottom-nav.tsx)
  selected page-level surfaces as needed
- Implementation notes:
  Prioritize shell consistency first:
  app background
  sticky header
  bottom nav
  cards
  primary buttons
  Then patch remaining hard-coded surfaces only where the theme visibly breaks.
- Risks:
  Some pages may retain old accent assumptions and need a second cleanup pass.
  Overreaching here can turn a controlled UX enhancement into a broad redesign.
- Verification commands:
  `pnpm --dir apps/dapp typecheck`
  `pnpm --dir apps/dapp build`
  local manual check on `http://127.0.0.1:3100`
- Expected outputs:
  The shell feels coherent across at least three selectable themes and language switching still works.

## Approval Checkpoint
- Recommended implementation choices:
  use the bottom center entry as a `More` panel instead of introducing a top settings entry
  ship three presets first: `Night`, `Day`, `Aura`
  persist theme locally in browser storage via `next-themes`
  keep settings client-side only for phase 1
- If approved, implementation should proceed in the milestone order above with small, reviewable commits.

## Rollback / Recovery Notes
- If the multi-theme token refactor causes widespread regressions, keep the new `More` panel but temporarily expose only language while restoring the current Night palette.
- If the preferences sheet proves confusing, retain the unified trigger and simplify the first release to language + theme only, with no extra placeholders.
- Because no backend or deployment configuration changes are planned, rollback is limited to DApp code and localized copy.

## Final Verification Checklist
- Header button count decreases or stays lower than today.
- Users can switch among at least three visual themes.
- The current dark experience remains available as the default Night theme.
- Language switching still works from the bottom `More` panel.
- Theme persistence survives reload in the same browser.
- DApp typecheck/build pass and manual local validation is recorded in `execution.md`.
