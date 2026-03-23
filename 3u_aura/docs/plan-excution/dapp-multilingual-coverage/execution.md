# DApp Multilingual Coverage — Execution Log

## Status

- Planning created
- Plan iterated after new feedback
- User approved the next implementation increment
- Increment implementation completed
- Increment verification completed

## Plan Reference

- Plan: `docs/plan-excution/dapp-multilingual-coverage/plan.md`
- Related prior work:
  - `docs/plan-excution/multilingual-notification-center/plan.md`
  - `docs/plan-excution/team-tree-focus-navigation/plan.md`

## Scope Summary

This task will expand the existing DApp `next-intl` coverage so the main end-user pages stop mixing Chinese and English and instead render from locale-backed messages across the six already configured DApp locales.

## Research Summary

- The DApp already has working locale infrastructure via `next-intl`
- Supported locales already exist:
  - `en`
  - `zh`
  - `zh-Hant`
  - `vi`
  - `ko`
  - `ja`
- `apps/dapp/src/i18n/request.ts` currently loads only:
  - `Common`
  - `Language`
- Notifications and bottom navigation already use translation hooks successfully
- Most major DApp product pages still contain hard-coded copy

## Relevant Files Investigated

- `apps/dapp/src/i18n/constants.ts`
- `apps/dapp/src/i18n/request.ts`
- `apps/dapp/src/i18n/locale-actions.ts`
- `apps/dapp/src/app/layout.tsx`
- `apps/dapp/messages/en/common.json`
- `apps/dapp/messages/zh/common.json`
- `apps/dapp/messages/zh/language.json`
- `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- `apps/dapp/src/components/pages/notifications-page.tsx`
- `apps/dapp/src/components/pages/dashboard-page.tsx`
- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/dapp/src/components/pages/checkin-page.tsx`
- `apps/dapp/src/components/pages/rewards-page.tsx`
- `apps/dapp/src/components/pages/claims-page.tsx`
- `apps/dapp/src/components/pages/nft-page.tsx`

## Commands Run During Planning

- `sed -n '1,240p' /Users/ygg/.codex/skills/claude-skills-collection/skills/create-plan/SKILL.md`
- `find apps/dapp/messages -maxdepth 2 -type f | sort`
- `sed -n '1,240p' apps/dapp/messages/zh/common.json`
- `sed -n '1,240p' apps/dapp/messages/en/common.json`
- `find apps/dapp/src/components/pages -maxdepth 1 -type f | sort`
- `sed -n '1,220p' apps/dapp/src/app/layout.tsx`
- `sed -n '1,220p' apps/dapp/src/i18n/request.ts`
- `rg -n 'useTranslations\\(' apps/dapp/src/components/pages apps/dapp/src/components -g '!**/node_modules/**'`
- `rg -n 'eyebrow=\"|title=\"|label=\"|description=\"|Loading|Details|Current Epoch|Small Leg Volume|Daily Check-in|My Team|Rewards|NFT Market|Claims|Lottery|Wallet sign-in required' apps/dapp/src/components/pages -g '!**/node_modules/**'`
- `sed -n '1,220p' apps/dapp/messages/zh/language.json`
- `sed -n '1,220p' apps/dapp/src/i18n/locale-actions.ts`
- `sed -n '1,220p' apps/dapp/src/components/pages/notifications-page.tsx`
- `sed -n '1,260p' docs/plan-excution/multilingual-notification-center/plan.md`
- `sed -n '1,220p' docs/plan-excution/multilingual-notification-center/execution.md`

## Findings

- The DApp does not need a new i18n framework
- The current problem is coverage and namespace loading, not locale detection
- `dashboard-page.tsx`, `team-page.tsx`, `checkin-page.tsx`, `rewards-page.tsx`, `claims-page.tsx`, and `nft-page.tsx` all contain user-facing hard-coded copy
- Existing translated surfaces provide a working implementation baseline that should be extended rather than replaced

## Notes For Execution

- Preserve current locale list and default locale
- Prefer minimal-risk localization changes over page refactors
- Keep real verification evidence here once implementation begins

## Execution Updates

- New user feedback after the first localization pass:
  - some date/time surfaces still render in English
  - there is still no in-app language switch button
  - the mobile header may need a dropdown-style menu to avoid overcrowding
- Re-researched the affected implementation areas:
  - `apps/dapp/src/lib/promotion-format.ts`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/i18n/locale-actions.ts`
  - `apps/dapp/src/components/wallet-button.tsx`
  - existing dropdown primitives under `apps/dapp/src/components/ui/dropdown-menu.tsx`
- Updated `plan.md` to include:
  - locale-aware formatting
  - header language switch UI
  - compact dropdown treatment for mobile header density
- User approved the increment in chat.
- Implemented locale-aware date formatting by updating:
  - `apps/dapp/src/lib/promotion-format.ts`
  - `apps/dapp/src/components/pages/rewards-page.tsx`
- Added a compact header locale switch dropdown in:
  - `apps/dapp/src/components/i18n/locale-switcher.tsx`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
- Expanded `apps/dapp/messages/*/language.json` so the new switcher has translated menu copy and accessibility labels.
- Tightened the mobile header layout with truncation and narrower spacing so the new control fits without pushing existing controls into awkward wrapping.
- Follow-up header density hotfix after user review:
  - the first compact locale button still consumed too much horizontal space on very narrow mobile widths
  - `apps/dapp/src/components/i18n/locale-switcher.tsx` was reduced to an icon-only trigger while preserving the dropdown menu and accessibility label
  - `apps/dapp/src/components/layout/mobile-layout.tsx` spacing was tightened slightly again so the title block keeps more usable width

## Prior Increment Record

- User approval received in chat before implementation started.
- Audited the remaining hard-coded copy across:
  - `apps/dapp/src/components/pages/dashboard-page.tsx`
  - `apps/dapp/src/components/pages/team-page.tsx`
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/components/pages/rewards-page.tsx`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - team / claims child components used by those pages
- Localized the major DApp user surfaces by switching them to `useTranslations("Common")`.
- Expanded `apps/dapp/messages/*/common.json` for all six configured locales so the existing `next-intl` loader could keep working without request-time namespace changes.
- Localized the team tree interaction copy, claim rows, summary cards, button labels, empty states, errors, and NFT / dashboard / check-in / rewards pages.
- Added shared enum-backed labels under `Common.shared.promotion` for:
  - epoch status
  - NFT eligibility status
  - reward type
  - claim type
  - claim status
  - left / right / tree interaction labels
- Preserved the existing locale list:
  - `en`
  - `zh`
  - `zh-Hant`
  - `vi`
  - `ko`
  - `ja`

## Files Changed

- `apps/dapp/messages/en/common.json`
- `apps/dapp/messages/zh/common.json`
- `apps/dapp/messages/zh-Hant/common.json`
- `apps/dapp/messages/vi/common.json`
- `apps/dapp/messages/ko/common.json`
- `apps/dapp/messages/ja/common.json`
- `apps/dapp/src/components/pages/dashboard-page.tsx`
- `apps/dapp/src/components/pages/team-page.tsx`
- `apps/dapp/src/components/pages/checkin-page.tsx`
- `apps/dapp/src/components/pages/rewards-page.tsx`
- `apps/dapp/src/components/pages/claims-page.tsx`
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/components/pages/claims/claims-summary.tsx`
- `apps/dapp/src/components/pages/claims/merkle-claim-row.tsx`
- `apps/dapp/src/components/pages/claims/subsidy-claim-row.tsx`
- `apps/dapp/src/components/team/pending-member-card.tsx`
- `apps/dapp/src/components/team/team-tree-node-card.tsx`
- `apps/dapp/src/components/team/team-tree-pending-summary.tsx`
- `apps/dapp/src/components/team/team-tree-placement-legend.tsx`
- `apps/dapp/src/components/team/team-tree-view.tsx`
- `apps/dapp/messages/en/language.json`
- `apps/dapp/messages/zh/language.json`
- `apps/dapp/messages/zh-Hant/language.json`
- `apps/dapp/messages/vi/language.json`
- `apps/dapp/messages/ko/language.json`
- `apps/dapp/messages/ja/language.json`
- `apps/dapp/src/components/i18n/locale-switcher.tsx`
- `apps/dapp/src/components/layout/mobile-layout.tsx`
- `apps/dapp/src/lib/promotion-format.ts`
- `apps/dapp/src/components/i18n/locale-switcher.tsx`

## Verification

### Commands Run

- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp build`
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp build`

### Results

- `pnpm --dir apps/dapp typecheck`
  - Passed
- `pnpm --dir apps/dapp lint`
  - Passed with existing warnings only
  - Remaining warnings:
    - `apps/dapp/src/components/pages/team-page.tsx` uses `<img>`
    - `apps/dapp/src/components/wallet-button.tsx` uses `<img>`
- `pnpm --dir apps/dapp build`
  - Passed
  - Existing wallet connector dependency warnings from Next / wagmi / rainbowkit remained unchanged
- Incremental verification after the follow-up feedback:
  - `pnpm --dir apps/dapp lint`
    - Passed with the same existing `<img>` warnings only
  - first rerun of `pnpm --dir apps/dapp typecheck`
    - failed because `.next/types` files were being regenerated concurrently by a running build
    - no code-level TypeScript error was reported
  - second rerun of `pnpm --dir apps/dapp typecheck`
    - Passed when run sequentially after build output stabilized
  - final rerun of `pnpm --dir apps/dapp build`
    - Passed
    - same existing wallet connector dependency warnings remained unchanged
- Header density hotfix verification:
  - `pnpm --dir apps/dapp typecheck`
    - Passed
  - `pnpm --dir apps/dapp lint`
    - Passed with the same existing `<img>` warnings only
- Manual browser smoke across locale switches
  - Not run in this execution log

## Deviations From Plan

- Instead of introducing multiple new message namespaces and updating `apps/dapp/src/i18n/request.ts`, the implementation expanded the existing `Common` namespace across all locales.
- Reason:
  - lower blast radius
  - no loader contract change
  - faster rollout for the immediate “mixed Chinese / English” problem
- This keeps the current runtime behavior stable while still making the major user-visible pages translatable.

## Remaining Follow-Up Ideas

- Refine `vi`, `ko`, and `ja` page copy beyond the current coverage baseline if product-grade native translations are needed.
- Sweep older, currently unused components such as `team-tree-node-details-sheet.tsx` if that UI path becomes active again.
- Consider splitting the expanded `Common` namespace later if message maintenance becomes unwieldy.
