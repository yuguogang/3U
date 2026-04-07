# Testnet MockUSDT V2 Rollout — Execution Log

## Status

- Planning created
- Awaiting approval before implementation

## Research Notes

- Current `deploy-contract-suite.mjs --force` will redeploy `MockUSDT` when `paymentTokenKind=mockusdt`, which conflicts with this rollout requirement
- Current deployment scripts support build/start and DB repair, but do not provide a dedicated “clear online data then rebuild schema” flow
- Current contract role surface does not introduce new wallet roles beyond:
  - `owner`
  - `rootPublisher`
  - `checkinReceiverAddress`
  - `rewardFunderAddress`
  - `financeWallet`
  - `settlementPublisher`
  - `referralSignerAddress`
  - `adminAllowlistWallets`

## Commands Run During Planning

```bash
sed -n '1,240p' config/promotion-envs/testnet-mockusdt/manifest.json
find docs/runbooks -maxdepth 2 -type f | sort
rg -n "testnet-mockusdt|deploy-contract-suite|publishRoot|publishSubsidyEpoch|role|owner|rootPublisher|settlementPublisher|rewardFunder|financeWallet|treasury" docs/runbooks scripts/promotion-env apps/contracts apps/server -g '!**/node_modules/**'
sed -n '1,260p' docs/runbooks/testnet-mockusdt-vps-deployment.md
sed -n '1,260p' docs/runbooks/testnet-mockusdt-remote-handoff.md
find scripts/deploy -maxdepth 2 -type f | sort
sed -n '1,280p' scripts/promotion-env/deploy-contract-suite.mjs
sed -n '1,260p' apps/contracts/src/FounderNFT.sol
sed -n '1,260p' apps/contracts/src/NFTSale.sol
sed -n '1,240p' apps/contracts/src/MerkleClaim.sol
sed -n '1,240p' apps/contracts/src/Settlement.sol
sed -n '1,260p' scripts/deploy/deploy-testnet-mockusdt.sh
sed -n '1,260p' scripts/deploy/repair-testnet-mockusdt-db.sh
sed -n '1,220p' apps/server/prisma/seed.ts
sed -n '1,220p' apps/server/prisma/seeds/user.seed.ts
```

## Verification Results

- Planning-only phase
- No deployment, chain writes, DB reset, or VPS mutations executed yet

## Deviations

- None yet
