# Testnet MockUSDT VPS Deployment Runbook

## Purpose

Deploy the latest 3U AURA promotion stack to a fresh Ubuntu VPS using:

- real BSC Testnet
- locally deployed fresh `testnet-mockusdt` contracts
- split funding wallets
- Docker for Postgres/Redis
- systemd for `server / dapp / admin`

This runbook is for manual verification and remote bring-up only.
Automated CI should stay on `scripts/ci/*`; `apps/e2e/phase94` and `scripts/uat/*` are manual tooling, not default CI gates.

## Required Inputs

Before remote execution, prepare:

- VPS IP and SSH access
- target domains:
  - `api.<domain>`
  - `app.<domain>`
  - `admin.<domain>`
- BSC Testnet RPC
- WalletConnect Project ID
- deployment private key
  - local operator machine only
  - do not place it on the VPS
- final role addresses:
  - `owner`
  - `rootPublisher`
  - `checkinReceiverAddress`
  - `rewardFunderAddress`
  - `financeWallet`
  - `settlementPublisher`
  - `referralSignerAddress`
  - admin allowlist wallets

## Funding Rules

- Lottery / ranking funding source:
  - `checkinReceiverAddress = rewardFunderAddress`
- NFT subsidy funding source:
  - `financeWallet = settlementPublisher`

## Step 1: Prepare Local Config

1. Fill `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
2. Replace all `__UNSET__` role addresses
3. Set final public domains under `infra`
4. Keep `paymentTokenKind=mockusdt`
5. Run:

```bash
pnpm promotion-env:sync
node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target server
node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target dapp
node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target admin
node scripts/promotion-env/print-env.mjs --env testnet-mockusdt --target contracts
```

## Manual Verification Boundary

- Use `scripts/ci/*` for automated CI checks.
- Use `apps/e2e/phase94` and `scripts/uat/*` only when you explicitly want manual UAT or local smoke validation.
- Do not wire `test:uat` or `test:weekly-fork` into new default CI jobs; keep them as opt-in operator commands.

## Step 2: Deploy Contracts To BSC Testnet (Local Operator Machine)

This step is expected to be executed on the trusted local operator machine,
not on the Ubuntu VPS.

From the repo root on the local operator machine:

```bash
node scripts/promotion-env/deploy-contract-suite.mjs --env testnet-mockusdt --force
pnpm promotion-env:sync
```

Verify:

```bash
cast call <merkleClaim> "rewardFunder()(address)" --rpc-url <rpc>
cast call <nftSale> "financeWallet()(address)" --rpc-url <rpc>
cast call <settlement> "epochPublisher()(address)" --rpc-url <rpc>
```

After deployment:

- ensure the freshly written `manifest.json` is committed or securely copied
- ensure `pnpm promotion-env:sync` has regenerated the new public env files

## Step 3: Bootstrap Ubuntu VPS

Important:

- do **not** rely on plain `apt install nodejs`
- this project requires a modern Node runtime that supports ESM `.mjs` scripts
- `scripts/promotion-env/*.mjs` and deploy helpers are validated against Node `22`
- deployment is standardized on `pnpm@10.13.1` and the committed `pnpm-lock.yaml` must match it

On the VPS:

```bash
bash scripts/deploy/bootstrap-vps.sh
```

The bootstrap script will now:

- install Node `22`
- enable `corepack`
- activate `pnpm@10.13.1`
- print `node --version` and `pnpm --version`

Expected result:

```bash
node --version
pnpm --version
```

should show a modern Node 22 runtime and `pnpm 10.13.1` before you continue.

Create infra env from:

- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.server.env.example`

Write it to:

- `/etc/3u-aura/testnet-mockusdt/infra.env`

Create shared runtime secrets from:

- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.shared.env.example`

Write it to:

- `/etc/3u-aura/testnet-mockusdt/shared.env`

At minimum, `shared.env` must contain:

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=change-me
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=change-me
AUTH_JWT_SECRET=<long-random-secret>
AUTH_JWT_REFRESH_SECRET=<another-long-random-secret>
AUTH_JWT_SECRET_EXPIRES_SECONDS=604800
AUTH_JWT_REFRESH_SECRET_EXPIRES_SECONDS=2592000
```

Then install Docker stack:

```bash
bash scripts/deploy/install-docker-stack.sh \
  --infra-env /etc/3u-aura/testnet-mockusdt/infra.env \
  --compose ops/docker/testnet-mockusdt.compose.yml
```

## Step 4: Build And Start Apps

On the VPS from the checked-out repo:

```bash
bash scripts/deploy/deploy-testnet-mockusdt.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

This will:

- generate env files
- install dependencies
- use `pnpm install --frozen-lockfile`
- build `packages/common`
- run `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate`
- build server/dapp/admin
- chown build artifacts back to `3u-aura` so systemd services can start cleanly
- read shared secrets from `/etc/3u-aura/testnet-mockusdt/shared.env`
- install systemd units
- restart services

Important:

- the deploy script currently does **not** run `prisma migrate deploy`
- on a fresh or stale VPS database, app services may start successfully while some API routes still fail at runtime because required tables / columns are missing

Before continuing to Nginx and smoke tests, run:

```bash
bash scripts/deploy/repair-testnet-mockusdt-db.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

If that migration step fails on a fresh VPS database with
`relation "User" does not exist`, the schema baseline has not been applied yet.
Repair it once with:

```bash
node scripts/promotion-env/run-with-env.mjs --target server -- prisma db execute \
  --file apps/server/prisma/migrations/20260311_schema_model_alignment_hardening/migration.sql

node scripts/promotion-env/run-with-env.mjs --target server -- prisma migrate resolve \
  --applied 20260311_schema_model_alignment_hardening

PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

If Prisma reports `P3009` for
`20260311_phase2_checkin_pool_split_fact` and the database only contains
`_prisma_migrations` plus `PoolSplitFact`, the first migration partially ran
before the base schema existed. For a disposable fresh VPS database, repair it
with:

```bash
docker exec 3u-aura-testnet-mockusdt-postgres \
  psql -U postgres -d 3u_aura_testnet_mockusdt \
  -c 'DROP TABLE IF EXISTS "PoolSplitFact" CASCADE;'

node scripts/promotion-env/run-with-env.mjs --target server -- prisma migrate resolve \
  --rolled-back 20260311_phase2_checkin_pool_split_fact

node scripts/promotion-env/run-with-env.mjs --target server -- prisma db execute \
  --file apps/server/prisma/migrations/20260311_schema_model_alignment_hardening/migration.sql

node scripts/promotion-env/run-with-env.mjs --target server -- prisma migrate resolve \
  --applied 20260311_schema_model_alignment_hardening

PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

## Step 5: Configure Nginx And TLS

Render Nginx config:

```bash
node scripts/deploy/render-nginx-config.mjs \
  --api-domain api.example.com \
  --app-domain app.example.com \
  --admin-domain admin.example.com \
  --output /tmp/testnet-mockusdt.conf
```

Install config into Nginx, disable the Ubuntu default site, enable the rendered site, then:

```bash
sudo cp /tmp/testnet-mockusdt.conf /etc/nginx/sites-available/testnet-mockusdt.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/testnet-mockusdt.conf /etc/nginx/sites-enabled/testnet-mockusdt.conf
sudo nginx -t
sudo systemctl reload nginx
```

Verify plain HTTP before requesting TLS:

```bash
curl -I http://api.example.com/api/v1/health
curl -I http://app.example.com
curl -I http://admin.example.com/dashboard
```

Then request the subdomain certificate explicitly:

```bash
sudo certbot --nginx \
  -d api.example.com \
  -d app.example.com \
  -d admin.example.com
```

## Step 6: Smoke Check

If you run smoke checks from the VPS itself and the public domain does not loop back cleanly,
first verify local Nginx routing with:

```bash
curl -vk --resolve api.example.com:443:127.0.0.1 https://api.example.com/api/v1/health
curl -vk --resolve app.example.com:443:127.0.0.1 https://app.example.com
curl -vk --resolve admin.example.com:443:127.0.0.1 https://admin.example.com/dashboard
```

Then run the external smoke check:

```bash
bash scripts/deploy/smoke-test-testnet-mockusdt.sh \
  --api https://api.example.com \
  --app https://app.example.com \
  --admin https://admin.example.com
```

## Step 7: Manual UAT

Validate:

1. Connect wallet in dapp
2. Check-in sends `3 USDT` to `checkinReceiverAddress`
3. Check-in produces `1000 AURA`
4. Purchase Founder NFT sends `1000 USDT` to `financeWallet`
5. Publish and claim lottery / ranking rewards
6. Publish and claim NFT subsidy
7. Expired NFT subsidy displays as `已作废`
8. Admin wallet can log in and inspect ops

## Operational Notes

- If dapp sends check-in to the wrong address, restart dapp after env refresh
- If claims show expired subsidy as claimable, ensure server is running the latest code and not an old build
- Keep manifest as the single source of truth for addresses and public URLs
- The Ubuntu VPS does not need Foundry if contracts are already deployed locally
- If server fails with:
  - `JwtStrategy requires a secret or key`
  add `AUTH_JWT_SECRET` and `AUTH_JWT_REFRESH_SECRET` to `shared.env`, then restart `3u-aura-server`
- If you see:
  - `SyntaxError: Unexpected identifier`
  - failing at `import path from 'node:path'`
  then the VPS is still using an old Node runtime; rerun bootstrap or install Node 22 manually before continuing
- If `apps/server build` fails with:
  - `Property 'user' does not exist on type 'DbService'`
  - or similar missing Prisma model properties
  then Prisma client generation was skipped or stale; rerun deployment after `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate`
- If Prisma generation fails with:
  - `Cannot resolve environment variable: DATABASE_URL`
  then the wrong command was used; `db:generate` does not inject promotion-env runtime config, use `env:db:generate`
- If pages still show `500 Internal server error` after all services are `active (running)`, inspect the database schema next; app redeploy alone does not guarantee the Postgres schema has been migrated
- If TypeScript cannot resolve `3u-aura-common`, ensure `pnpm --dir packages/common build` has been run before the app builds
- If any systemd unit exits with:
  - `status=203/EXEC`
  inspect `/etc/systemd/system/3u-aura-*.service`; old deployments may still reference `/bin/zsh`. Pull the latest repo and rerun the deploy script so the units are re-rendered with `/bin/bash`
- If `3u-aura-server` exits with:
  - `EACCES: permission denied, symlink '../generated' -> .../apps/server/dist/generated`
  the app was built as `root` but started as `3u-aura`. Pull the latest repo and rerun the deploy script; it now fixes build artifact ownership automatically
- If the subdomains return the Ubuntu default Nginx page or `404`, the default site is still enabled or the rendered `testnet-mockusdt` site was not installed
- If `certbot --nginx` says it cannot find a matching server block, install the rendered Nginx config first and request certificates for the explicit subdomains instead of relying on the default `goldmint.vip` site
