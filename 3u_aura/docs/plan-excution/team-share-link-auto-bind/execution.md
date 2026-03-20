# Team Share Link Auto-Bind Execution

## Status

- State: In Progress
- Approved: Yes
- Started: 2026-03-20

## Baseline Research

- Current DApp `/team` page always shows `user?.inviteCode || "---"` and only conditionally shows manual bind UI based on `!user?.inviterId`.
- Current server auth sign-in path creates a new user with `inviteCode: this.generateInviteCode()` immediately on first login.
- Current referral binding exists only as an explicit authenticated action through `POST /referral/inviter/bind`.
- No current DApp mechanism was confirmed for carrying referral code from URL into first-login sign-in.
- No existing QR-code helper or QR UI dependency was found in `apps/dapp` or root dependency manifests during initial search.

## Commands Run

- `sed -n '1,260p' apps/dapp/src/components/pages/team-page.tsx`
- `sed -n '1,260p' apps/server/src/auth/services/auth.service.ts`
- `sed -n '1,240p' apps/server/src/modules/referral/referral.controller.ts`
- `sed -n '1,280p' apps/server/src/modules/referral/services/referral.service.ts`
- `sed -n '1,220p' apps/dapp/src/api/auth.ts`
- `sed -n '1,260p' apps/dapp/src/components/wallet-button.tsx`
- `sed -n '1,220p' packages/common/src/models/aura.ts`
- `rg -n "inviteCode|inviterId|bind inviter|bindInviter|referral|placement|pendingPlacement|share code|promo code|ref code" apps/server apps/dapp packages/common -g '!**/dist/**'`
- `rg -n "qrcode|qr code|QRCode|qr-code|react-qr|qrcode.react|QRCodeSVG" apps/dapp package.json pnpm-lock.yaml -g '!**/dist/**'`

## Key Findings

- Desired behavior conflicts with current backend issuance semantics: current first-login always mints an `inviteCode`, while the new requirement wants "no own share code until inviter binding exists".
- This is not a front-end-only change.
- The smallest likely solution is:
  - make referral code optional on sign-in
  - auto-bind inviter for new referred users during first login
  - delay own invite-code issuance until inviter binding is established
- Manual bind flow should remain in place for users who entered without referral code.
- QR sharing should be implemented as a representation of the canonical referral link, not as a separate business object.

## Pending

- Manual browser verification of the new `/team` behavior with fresh referred and unreferred users

## Implementation Progress

- Added optional `referralCode` to shared signature sign-in input in `packages/common`.
- Updated auth sign-in DTOs to accept `referralCode`.
- Changed backend first-login behavior:
  - new users are created with `inviteCode = null`
  - when `referralCode` is present on first login, auth triggers referral auto-bind in the same transaction
  - invite code is issued only after inviter binding is established
- Updated manual inviter bind so it also issues the user's own invite code if one does not exist yet.
- Updated DApp wallet login bootstrap to capture `?ref=CODE` from URL and submit it during first signature sign-in.
- Updated `/team` page to:
  - hide share assets until inviter binding exists
  - show invite code after binding
  - show canonical referral link after binding
  - show QR code for the canonical referral link after binding
  - retain the existing manual bind flow for users without inviter binding

## Deviation From Plan

- Planned QR implementation assumed a local QR library might be added.
- Attempting to install a lightweight QR package (`qrcode`) stalled on local pnpm/network/store conditions.
- Current implementation uses a canonical referral-link QR image endpoint instead of adding a new package, to keep delivery moving with minimal blast radius.

## Additional Commands Run

- `pnpm --dir apps/dapp add qrcode --store-dir /Users/ygg/Library/pnpm/store/v3` (stalled; not adopted)
- `pnpm --dir packages/common build`
- `pnpm --dir apps/server test -- --runInBand src/modules/referral/services/referral.service.spec.ts src/auth/services/auth.service.spec.ts`
- `pnpm --dir apps/server build`
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp build`
- `PORT=3200 HOSTNAME=127.0.0.1 PROMOTION_ENV=fork-anvil pnpm --dir apps/dapp env:dev`

## Verification Results

- `packages/common build`: passed
- `apps/server` targeted tests: passed
- `apps/server build`: passed
- `apps/dapp typecheck`: passed after regenerating `.next` via build
- `apps/dapp lint`: passed with warnings only
  - remaining warnings are existing/acceptable `img` usage warnings on `team-page.tsx` and `wallet-button.tsx`
- `apps/dapp build`: passed with pre-existing wallet connector module warnings, but completed successfully
- Local DApp dev server restarted on `http://localhost:3200`
