# Check-in Direct Pay with Manual Fallback Plan

## Objective
Upgrade `apps/dapp` check-in from a tx-hash-only submission screen to a real in-app payment flow:
- primary path: user clicks a check-in button, signs a 3 USDT transfer in wallet, and the DApp auto-submits the resulting tx hash to the existing check-in API
- fallback path: if wallet flow or automatic sync fails, the user can still manually paste a tx hash and recover the check-in

The target is to preserve the existing verified backend check-in policy while removing the need for routine manual tx-hash handling.

## Scope
- `apps/dapp` check-in page UX and wallet interaction
- `apps/dapp` shared contract/env wiring needed for check-in transfer
- reuse of existing server-side `/api/v1/checkin` verification
- explicit manual fallback UI for exceptional cases
- fork-anvil manual verification of:
  - direct payment success
  - auto-submit success
  - fallback manual submission after an already-mined transfer

## Out of Scope
- contract changes
- payment token / receiver business rules
- server-side check-in accounting logic changes
- admin repair flow changes
- automatic retries or background reconciliation jobs
- redesign of unrelated pages

## Assumptions
- The canonical check-in payment remains an ERC20 `Transfer` of exactly `3 USDT` to `PROMOTION_CHECKIN_RECEIVER_ADDRESS`.
- The existing server check-in API remains the source of truth for validating tx hash, payer, amount, token, and receiver.
- `apps/dapp` can safely assemble and submit the ERC20 transfer client-side using the existing wallet stack.
- Manual tx-hash submission must remain available because wallet interruptions, chain RPC issues, or page refreshes can still break the automatic path.

## Architecture Impact
- `apps/dapp`
  - adds an explicit client-side check-in payment write path
  - auto-submits the resulting tx hash into the existing backend API
  - exposes fallback UI only when needed or as a secondary/manual option
- `scripts/promotion-env`
  - may need to expose `NEXT_PUBLIC_CHECKIN_RECEIVER_ADDRESS` so the DApp can build the transfer target deterministically
- `apps/server`
  - no planned business-logic changes unless implementation reveals a missing client-facing contract/env seam

## Milestones

### Milestone 1: Confirm Existing Backend Contract and DApp Gaps
- Goal:
  - Freeze the exact existing check-in verification contract and identify only the missing DApp/client wiring.
- Affected files/modules:
  - `apps/server/src/modules/payment/services/payment.service.ts`
  - `apps/server/src/modules/payment/repositories/payment-verification.repository.ts`
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/api/promotion.ts`
- Implementation notes:
  - Verify the current server requirements:
    - payer address
    - tx hash
    - 3 USDT amount
    - configured receiver
  - Confirm the DApp currently lacks:
    - direct ERC20 transfer action
    - auto-submit of mined tx hash
    - explicit manual fallback presentation
- Risks:
  - Accidentally changing server validation when only client interaction is needed.
- Verification commands:
  - `sed -n '1,260p' apps/server/src/modules/payment/repositories/payment-verification.repository.ts`
  - `sed -n '1,320p' apps/dapp/src/components/pages/checkin-page.tsx`
- Expected outputs:
  - Locked implementation boundary that keeps server verification unchanged unless truly necessary.

### Milestone 2: Expose Check-in Payment Runtime Config to DApp
- Goal:
  - Ensure the DApp has all runtime addresses required to initiate the ERC20 transfer.
- Affected files/modules:
  - `scripts/promotion-env/lib.mjs`
  - `apps/dapp/src/lib/promotion-contracts.ts`
  - env print/manifest verification only if needed
- Implementation notes:
  - Add `NEXT_PUBLIC_CHECKIN_RECEIVER_ADDRESS` to the DApp runtime env if not already exposed.
  - Keep address parsing deterministic and aligned with existing `promotionContracts` helpers.
- Risks:
  - Stale or missing env after dev server restart.
- Verification commands:
  - `node scripts/promotion-env/print-env.mjs --target dapp --env fork-anvil | rg 'CHECKIN_RECEIVER|PAYMENT_TOKEN'`
  - `pnpm --dir apps/dapp typecheck`
- Expected outputs:
  - DApp can deterministically target the check-in receiver without hardcoding addresses in page code.

### Milestone 3: Implement Direct Pay -> Auto Submit Flow
- Goal:
  - Add a real clickable check-in button that sends the 3 USDT transfer and then auto-submits the tx hash to the existing check-in mutation.
- Affected files/modules:
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - possibly `apps/dapp/src/hooks/use-promotion-contract-state.ts` or a new small client helper if needed
  - `apps/dapp/src/lib/promotion-contracts.ts`
- Implementation notes:
  - Use wallet-connected write flow to call ERC20 `transfer(checkinReceiver, 3e6)`.
  - Wait for transaction receipt.
  - On confirmed success, call the existing check-in mutation with:
    - `txHash`
    - `payerAddress`
    - `amountAtomic = 3000000`
    - `tokenSymbol = USDT`
    - `chainId`
  - Preserve clear pending/success/error states.
- Risks:
  - Duplicate submit if the user clicks repeatedly.
  - Wallet/network mismatch causing confusing UI.
  - tx confirmed but API submit fails, requiring explicit fallback state.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - manual fork-anvil:
    - connect wallet
    - click direct check-in
    - approve/sign transfer
    - verify check-in success state
- Expected outputs:
  - Normal check-in no longer requires manual tx-hash copy/paste.

### Milestone 4: Add Manual Recovery / Exceptional Fallback UX
- Goal:
  - Preserve and improve manual tx-hash submission for abnormal cases only.
- Affected files/modules:
  - `apps/dapp/src/components/pages/checkin-page.tsx`
- Implementation notes:
  - Keep manual tx-hash input collapsed or visually secondary by default.
  - Show it explicitly when:
    - direct transfer fails after sending
    - auto-submit to backend fails
    - user chooses manual recovery
  - Present the exact recovery guidance:
    - “Already paid 3 USDT? Paste the tx hash to recover this check-in.”
- Risks:
  - Users accidentally using manual flow first when direct flow should be primary.
- Verification commands:
  - manual fork-anvil:
    - simulate already-mined tx
    - use manual fallback
    - verify duplicate/valid submission behavior
- Expected outputs:
  - Manual flow becomes a recovery tool rather than the primary UX.

### Milestone 5: End-to-End Verification and Documentation
- Goal:
  - Verify the combined direct-pay and fallback flows and record the real result.
- Affected files/modules:
  - `docs/plan-excution/checkin-direct-pay-fallback/execution.md`
  - any DApp files changed above
- Implementation notes:
  - Validate direct flow on fork-anvil with a real wallet.
  - Validate manual fallback with an already existing tx hash.
  - Document any remaining UX caveats or required future work.
- Risks:
  - Manual verification depends on current local wallet state and funds.
- Verification commands:
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp typecheck`
  - manual fork-anvil smoke
- Expected outputs:
  - Recorded evidence that direct flow works and fallback remains usable.

## Approval Checkpoint
This task changes a financial interaction path in the DApp. Do not implement until approved.

## Rollback / Recovery Notes
- If direct pay proves unstable, revert the page to tx-hash-only submission while preserving any harmless runtime config additions.
- Keep server verification unchanged unless a strictly necessary client seam is identified.
- Do not remove the manual fallback path during implementation.

## Final Verification Checklist
- DApp exposes a real clickable check-in payment action.
- Direct wallet transfer targets the configured receiver and exact amount.
- Successful transfer auto-submits to `/api/v1/checkin`.
- Manual tx-hash fallback remains available for exceptional recovery.
- Wrong-network and disconnected-wallet states stay clear.
- `pnpm --dir apps/dapp lint` passes.
- `pnpm --dir apps/dapp typecheck` passes.
- `execution.md` records actual commands and observed results.
