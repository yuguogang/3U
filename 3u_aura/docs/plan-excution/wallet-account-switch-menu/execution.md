# Wallet Account Switch Menu — Execution Log

## Status

- Planning created
- Awaiting approval

## Plan Reference

- Plan: `docs/plan-excution/wallet-account-switch-menu/plan.md`
- Related context:
  - `docs/plan-excution/dapp-multilingual-coverage/plan.md`

## Scope Summary

This task adds a DApp-owned wallet account menu so users can copy address, switch address, and disconnect from the same header entry point.

## Research Summary

- `apps/dapp/src/components/wallet-button.tsx` currently uses `ConnectButton.Custom`
- the connected-account path still relies on RainbowKit’s `openAccountModal`
- the app already reacts to address changes via existing auth/logout/login effects
- the missing piece is a DApp-level switch-address action in the account menu

## Relevant Files Investigated

- `apps/dapp/src/components/wallet-button.tsx`
- `apps/dapp/src/components/ui/dropdown-menu.tsx`
- `apps/dapp/src/components/providers/web3-provider.tsx`
- `apps/dapp/messages/en/common.json`
- `apps/dapp/messages/zh/common.json`

## Commands Run During Planning

- `sed -n '1,360p' apps/dapp/src/components/wallet-button.tsx`
- `sed -n '1,260p' apps/dapp/src/components/providers/web3-provider.tsx`
- `sed -n '1,220p' apps/dapp/src/components/ui/dropdown-menu.tsx`
- `rg -n 'useAccount|useConnect|disconnect|switchAccount|watchAccount|useWallet|RainbowKit|ConnectButton|openAccountModal|openConnectModal' apps/dapp/src -g '!**/node_modules/**'`
- `rg -n 'copy address|disconnect|wallet|connect|switch address|account' apps/dapp/messages/en/common.json apps/dapp/messages/zh/common.json apps/dapp/src/components/wallet-button.tsx`

## Findings

- The DApp already synchronizes correctly after a real wallet address change.
- The current UX gap is menu capability, not auth-state handling.
- A reconnect-based switch-address action is safer than assuming a universal wallet account-switch API.

## Notes For Execution

- Preserve current auto-login behavior after reconnect
- Keep the chain switch button unchanged
- Prefer a compact custom dropdown over a broad header redesign
