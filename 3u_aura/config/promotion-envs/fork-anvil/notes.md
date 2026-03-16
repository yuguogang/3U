# fork-anvil

- Status: `generated`
- Purpose: 本地 `fork + anvil` 周流程自动化底座
- Source environment: 默认从 `uat-mockusdt` 派生
- Default ports:
  - Anvil RPC: `18545`
  - Dapp: `3200`
  - Admin: `3201`
  - Server: `3210`
- Generated files:
  - `manifest.json`
  - `*.public.env`
  - `runtime.json`
  - `anvil.log`
  - `wallets/*.json`
- Do not edit generated files manually; use `scripts/uat/*weekly-fork*.mjs`.
