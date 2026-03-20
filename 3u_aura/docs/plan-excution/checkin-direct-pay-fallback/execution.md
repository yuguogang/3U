# Check-in Direct Pay with Manual Fallback Execution Log

## Baseline
- Status: planned
- Started: 2026-03-20
- Approved: pending

## Notes
- User requested a real clickable check-in button that directly performs the 3 USDT transfer.
- Manual tx-hash submission should remain only as an exceptional fallback when automatic submission fails or recovery is needed.
- Initial repo inspection confirms:
  - server-side verification for tx-hash-based check-in already exists
  - DApp currently exposes only manual tx-hash submission
  - check-in receiver address exists in server runtime config but is not yet exposed to DApp runtime

## Progress

### 2026-03-20 - Direct pay implementation pass
- Confirmed existing backend contract:
  - `POST /api/v1/checkin` remains the canonical verified entrypoint
  - server verification still checks:
    - `payerAddress`
    - `amountAtomic = 3000000`
    - configured payment token
    - configured check-in receiver
- Implemented DApp runtime config additions:
  - exposed `NEXT_PUBLIC_CHECKIN_RECEIVER_ADDRESS` from `scripts/promotion-env/lib.mjs`
  - exposed `checkinReceiverAddress` in `apps/dapp/src/lib/promotion-contracts.ts`
- Implemented DApp direct pay UX in `apps/dapp/src/components/pages/checkin-page.tsx`:
  - large red hero button now initiates ERC20 `transfer(receiver, 3000000)`
  - waits for receipt
  - auto-submits the resulting tx hash to the existing check-in mutation
  - preserves manual recovery input only for exceptional cases / recovery
- Added ERC20 `transfer` ABI to `apps/dapp/src/lib/promotion-contracts.ts`
- Updated shared `Input` component to support `ref` forwarding for manual recovery autofocus

### Commands run
- `sed -n '1,260p' apps/server/src/modules/checkin/checkin.controller.ts`
- `sed -n '1,260p' apps/server/src/modules/payment/services/payment.service.ts`
- `sed -n '1,260p' apps/server/src/modules/payment/repositories/payment-verification.repository.ts`
- `node scripts/promotion-env/print-env.mjs --target dapp --env fork-anvil | rg 'CHECKIN_RECEIVER|PAYMENT_TOKEN|PROMOTION_CHAIN_ID'`

### Verification in progress
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp exec eslint src/components/pages/checkin-page.tsx src/components/ui/input.tsx src/lib/promotion-contracts.ts`
- `pnpm --dir apps/dapp exec tsc --noEmit --pretty false --incremental false`
- restarted DApp with:
  - `PROMOTION_ENV=fork-anvil pnpm --dir apps/dapp env:dev`

### Deviations
- No server-side business logic changes were needed in this pass.
- Manual fallback is still always user-accessible once explicitly opened, but it is no longer the primary UX.

### 2026-03-20 - AURA display fix after successful check-in
- Observed runtime failure on dashboard:
  - `Cannot convert 2e+21 to a BigInt`
- Root cause:
  - some profile atomic amounts arrive from the server serialized in scientific notation
  - `DashboardPage` and `RewardsPage` were directly calling `BigInt(...)` on those strings
- Fix applied:
  - added `parseAtomicToBigInt(...)` to `apps/dapp/src/lib/promotion-format.ts`
  - updated dashboard and rewards aggregation to use the safe parser
  - updated atomic formatting path to normalize scientific notation before display
