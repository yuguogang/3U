# Testnet MockUSDT V2 Rollout — Execution Log

## Status

- Approved and implementation started
- Local rollout assets completed
- New testnet contracts deployed
- Manual server deployment still pending because SSH is not available from this workstation

## Work Completed

### 1. Safe Contract Redeploy Path

- Updated [deploy-contract-suite.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/deploy-contract-suite.mjs)
- Added:
  - `--reuse-payment-token`
  - alias `--skip-payment-token-deploy`
- Result:
  - `testnet-mockusdt` can now redeploy core contracts while preserving the existing `MockUSDT`

### 2. Controlled DB Reset Script

- Added [reset-testnet-mockusdt-db.sh](/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/reset-testnet-mockusdt-db.sh)
- Script behavior:
  - requires explicit `--confirm reset-testnet-mockusdt`
  - aligns Postgres password
  - drops and recreates target schema
  - reapplies baseline schema
  - runs Prisma migrations
  - runs Prisma seed
  - optionally restarts services

### 3. Runbook Updates

- Updated [testnet-mockusdt-vps-deployment.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
- Updated [testnet-mockusdt-remote-handoff.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
- Updated [testnet-mockusdt-online-repair.md](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md)

Key documentation changes:

- explicit reuse of the existing `MockUSDT`
- explicit “no new role wallet” statement
- explicit disposable testnet DB reset path

### 4. Contract Deployment Completed

- Deployed new `FounderNFT`
- Deployed new `NFTSale`
- Deployed new `Settlement`
- Deployed new `MerkleClaim`
- Preserved the existing `MockUSDT`
- Synced updated public env files

## Commands Run

### Planning / Research

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

### Local Verification

```bash
/usr/local/bin/node --check scripts/promotion-env/deploy-contract-suite.mjs
bash -n scripts/deploy/reset-testnet-mockusdt-db.sh
```

### Contract Deployment

```bash
PRIVATE_KEY=74a3dca344c57ff50e0afba380300249a9ff8e7b85e7d0f9fb4a9d90e2b79839 \
  /usr/local/bin/node scripts/promotion-env/deploy-contract-suite.mjs \
  --env testnet-mockusdt \
  --force \
  --reuse-payment-token
```

### Post-Deploy Verification

```bash
sed -n '1,240p' config/promotion-envs/testnet-mockusdt/manifest.json
cast call 0x1cEA1aBD04Ba5178e17F31954749824f3495B8A0 "paymentToken()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
cast call 0x1cEA1aBD04Ba5178e17F31954749824f3495B8A0 "financeWallet()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
cast call 0x2998d910B4c22C765B0ba3e82018f7D04Ee7c1c0 "rewardFunder()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
cast call 0x2998d910B4c22C765B0ba3e82018f7D04Ee7c1c0 "rootPublisher()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
cast call 0x992ED6f4AE1a5aF6eF427Ab8507431Af1B5C2615 "epochPublisher()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
```

## Verification Results

### Contract Addresses

- `paymentTokenAddress`: `0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF`
  - unchanged
- `founderNftAddress`: `0xe299aE531c962476B1b5E5CF9A09a866B8618454`
- `nftSaleAddress`: `0x1cEA1aBD04Ba5178e17F31954749824f3495B8A0`
- `merkleDistributorAddress`: `0x2998d910B4c22C765B0ba3e82018f7D04Ee7c1c0`
- `settlementAddress`: `0x992ED6f4AE1a5aF6eF427Ab8507431Af1B5C2615`

### Chain Role Verification

- `NFTSale.paymentToken()` = existing `MockUSDT`
- `NFTSale.financeWallet()` = `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `MerkleClaim.rewardFunder()` = `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- `MerkleClaim.rootPublisher()` = `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
- `Settlement.epochPublisher()` = `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Role Surface Conclusion

- No new wallet role is required for this version
- Existing `testnet-mockusdt` role model remains valid

## Blocking Constraint

- SSH access to the test server is not available from this workstation
- Therefore the following steps were not executed remotely:
  - copying updated repo to `/opt/3u-aura/current`
  - running `reset-testnet-mockusdt-db.sh` on VPS
  - running `deploy-testnet-mockusdt.sh` on VPS
  - running service smoke tests on VPS

## Manual Server Steps Prepared

Prepared for manual operator execution:

1. Pull updated repo with the new deployment/reset scripts
2. Run:

```bash
bash scripts/deploy/deploy-testnet-mockusdt.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

3. Run:

```bash
bash scripts/deploy/reset-testnet-mockusdt-db.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt \
  --confirm reset-testnet-mockusdt
```

4. Run smoke test:

```bash
bash scripts/deploy/smoke-test-testnet-mockusdt.sh \
  --api https://api.goldmint.vip \
  --app https://app.goldmint.vip \
  --admin https://admin.goldmint.vip
```

## Deviations

- Original goal included direct test server rollout, but remote execution could not be completed because SSH is unavailable
- Contract deployment and rollout preparation were completed locally instead
