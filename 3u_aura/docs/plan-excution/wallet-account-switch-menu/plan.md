# Wallet Account Switch Menu

## 1. Objective

Add an in-app account menu for the DApp wallet button so users can switch wallet addresses from the header interaction surface instead of relying only on the wallet extension UI.

The first iteration should keep the existing wallet authentication behavior intact while replacing the current limited RainbowKit account modal entry point with a DApp-controlled account menu that supports:

1. copy address
2. switch address
3. disconnect

## 2. Scope

- Update the DApp wallet button interaction in `apps/dapp`
- Replace the current `openAccountModal`-only account action with a DApp-owned dropdown/menu
- Add a visible `switch address` action
- Implement switch-address behavior as a safe reconnect flow
- Preserve current auto-login / re-sign behavior when the wallet address actually changes
- Keep current chain switch button behavior intact
- Add or update localized wallet menu copy as needed

## 3. Out of Scope

- Server auth changes
- Wallet connector dependency changes
- New wallet providers
- Direct programmatic account switching inside every wallet extension
- Changing the existing chain switch flow
- Redesigning the whole header

## 4. Assumptions

- The current app already handles address changes correctly after reconnect
- A universal EVM “switch account” RPC is not guaranteed across wallets, so the safe cross-wallet implementation is:
  - disconnect current session
  - reopen wallet connect flow
  - let the user pick / expose another account in the wallet
- The current `ConnectButton.Custom` integration remains the outer shell
- The new account menu can be implemented fully inside `apps/dapp`

## 5. Architecture Impact

### DApp

- `apps/dapp/src/components/wallet-button.tsx`
  - replace the `openAccountModal` path with a DApp-controlled account menu
  - preserve connect / sign / chain switch logic
  - add copy address / switch address / disconnect actions
- `apps/dapp/src/components/ui/dropdown-menu.tsx`
  - reuse existing dropdown primitives; no primitive changes expected
- `apps/dapp/messages/*/common.json`
  - add wallet menu labels if current copy is still hard-coded

### Shared / Server

- No impact expected

## 6. Current UX Gaps

### 6.1 Account Modal Limitation

- the current wallet button opens RainbowKit’s built-in account modal
- that modal exposes copy/disconnect but not a DApp-level switch-address action
- the user must leave the DApp flow and manually switch in the wallet UI

### 6.2 Existing Logic Already Supports Address Drift

- the DApp already reacts correctly when the connected address changes
- what is missing is a discoverable header action to initiate the address switch flow

### 6.3 Need For Cross-Wallet Safety

- forcing account changes through wallet-specific behavior would be brittle
- the safest first implementation is a reconnect-based switch action that works across connectors

## 7. Milestones

### Milestone 1: Wallet Menu Refactor

- Goal:
  - replace the limited account modal entry with a DApp-owned account dropdown
- Affected files/modules:
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/dapp/src/components/ui/dropdown-menu.tsx` (reuse only)
- Implementation notes:
  - keep the existing connected-state button shape
  - open a custom dropdown instead of calling `openAccountModal`
  - show current shortened address in the trigger as today
- Risks:
  - accidentally regressing connect/sign behavior
  - menu state conflicting with RainbowKit modal state
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
- Expected outputs:
  - account trigger opens a DApp-owned menu

### Milestone 2: Switch Address Action

- Goal:
  - add a cross-wallet-safe `switch address` flow
- Affected files/modules:
  - `apps/dapp/src/components/wallet-button.tsx`
- Implementation notes:
  - use disconnect + reconnect/open connect modal flow
  - preserve automation injected-wallet behavior if possible
  - keep auth state consistent during reconnect
- Risks:
  - reconnect flow causing confusing transient auth state
  - some wallets reopening to the same account if the user does not change it in-wallet
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - wallet menu includes a working switch-address action

### Milestone 3: Copy + Verification

- Goal:
  - align user-facing labels and verify no regressions
- Affected files/modules:
  - `apps/dapp/messages/*/common.json`
  - `docs/plan-excution/wallet-account-switch-menu/execution.md`
- Implementation notes:
  - localize wallet menu labels instead of hard-coding them if practical
  - record any known connector limitations explicitly
- Risks:
  - leaving stale hard-coded copy in the final menu
- Verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
  - `pnpm --dir apps/dapp build`
- Expected outputs:
  - localized wallet menu actions
  - execution log with real verification results

## 8. Approval Checkpoint

Do not implement until approved. This is a Major DApp interaction change because it alters the connected-wallet account menu behavior.

## 9. Rollback / Recovery Notes

- Keep all changes inside `apps/dapp`
- If the custom account menu proves unstable, revert to the previous RainbowKit account modal trigger
- Do not change the existing auth effects that respond to real address changes

## 10. Final Verification Checklist

- [ ] Connected wallet trigger opens the new account menu
- [ ] Menu includes copy address, switch address, and disconnect actions
- [ ] Switch-address flow safely reconnects without breaking current auth behavior
- [ ] `pnpm --dir apps/dapp typecheck` passed
- [ ] `pnpm --dir apps/dapp lint` passed
- [ ] `pnpm --dir apps/dapp build` passed
- [ ] `execution.md` contains real commands and results
