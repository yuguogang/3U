# Testnet MockUSDT Online Repair Plan

## Purpose

Use this playbook when the VPS deployment already exists but one or more of the
public services is unhealthy:

- `api.goldmint.vip`
- `app.goldmint.vip`
- `admin.goldmint.vip`

This plan assumes contracts are already deployed and the repair is limited to
the Ubuntu host, Nginx, Postgres, Redis, and app services.

## Step 1: Refresh Repo And Toolchain

```bash
cd /opt/3u-aura/current
git pull
bash scripts/deploy/bootstrap-vps.sh
node --version
pnpm --version
```

Expected:

- Node `22.x`
- `pnpm 10.13.1`

## Step 2: Verify Secrets

Check these files:

- `/etc/3u-aura/testnet-mockusdt/infra.env`
- `/etc/3u-aura/testnet-mockusdt/shared.env`

`shared.env` must include:

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=change-me
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=124353e5a312fdabb5b1d182ada6eca1
AUTH_JWT_SECRET=<long-random-secret>
AUTH_JWT_REFRESH_SECRET=<another-long-random-secret>
AUTH_JWT_SECRET_EXPIRES_SECONDS=604800
AUTH_JWT_REFRESH_SECRET_EXPIRES_SECONDS=2592000
```

## Step 3: Verify Infra Containers

```bash
bash scripts/deploy/install-docker-stack.sh \
  --infra-env /etc/3u-aura/testnet-mockusdt/infra.env \
  --compose ops/docker/testnet-mockusdt.compose.yml

docker ps
```

Expected:

- Postgres healthy
- Redis healthy

## Step 4: Redeploy App Services

```bash
bash scripts/deploy/deploy-testnet-mockusdt.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

Then inspect:

```bash
systemctl status 3u-aura-server --no-pager
systemctl status 3u-aura-dapp --no-pager
systemctl status 3u-aura-admin --no-pager
```

## Step 4.5: Migrate The VPS Database Schema

App redeploy does **not** automatically migrate Postgres.

Preferred one-step repair:

```bash
bash scripts/deploy/repair-testnet-mockusdt-db.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

This script will:

- align the live Postgres password with `shared.env`
- repair the known failed `20260311_phase2_checkin_pool_split_fact` state
- apply the `20260311_schema_model_alignment_hardening` baseline if needed
- run `prisma migrate deploy`
- restart `server / dapp / admin`

If you need to run the Prisma steps manually, first load the runtime env files
that systemd normally provides:

```bash
cd /opt/3u-aura/current
set -a
source /etc/3u-aura/testnet-mockusdt/shared.env
source /etc/3u-aura/testnet-mockusdt/server.env
set +a
```

Then run:

```bash
PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

If the services are `active (running)` but pages still return `500`, the
database schema is the next thing to verify.

If `env:db:migrate deploy` fails on a fresh VPS database with:

- `P3018`
- `relation "User" does not exist`

then the database is missing the baseline schema that later migrations depend
on. Repair it in this order:

```bash
cd /opt/3u-aura/current
set -a
source /etc/3u-aura/testnet-mockusdt/shared.env
source /etc/3u-aura/testnet-mockusdt/server.env
set +a

node scripts/promotion-env/run-with-env.mjs --target server -- prisma db execute \
  --file apps/server/prisma/migrations/20260311_schema_model_alignment_hardening/migration.sql

node scripts/promotion-env/run-with-env.mjs --target server -- prisma migrate resolve \
  --applied 20260311_schema_model_alignment_hardening

PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

If Prisma instead reports `P3009` and the failed migration is
`20260311_phase2_checkin_pool_split_fact`, check whether the database is in a
half-initialized state with only `_prisma_migrations` and `PoolSplitFact`.

If so, and the environment is disposable or empty, repair it like this:

```bash
cd /opt/3u-aura/current
set -a
source /etc/3u-aura/testnet-mockusdt/shared.env
source /etc/3u-aura/testnet-mockusdt/server.env
set +a

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

If Prisma instead fails with `P1000 Authentication failed`, first reset the
actual Postgres password inside the running container to match
`/etc/3u-aura/testnet-mockusdt/shared.env`:

```bash
docker exec 3u-aura-testnet-mockusdt-postgres \
  psql -U postgres -d postgres \
  -c "ALTER USER postgres WITH PASSWORD 'change-me';"
```

## Step 4.6: Repair Purchased NFT Projection Gaps Before Subsidy Publish

If users report:

- bought cards missing from DApp
- some purchased NFTs showing no `30 USDT` subsidy
- chain purchased supply higher than DB projected purchased holdings

run the purchased reconcile helper before publishing subsidy or sending claim
notifications.

Single wallet repair:

```bash
cd /opt/3u-aura/current
node scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs \
  --env testnet-mockusdt \
  --wallet 0x498a11A96417c56Ac74e7097FA5c916287ec3C91
```

Batch repair for users who already have NFT purchase receipts or were marked as
having purchased NFTs:

```bash
cd /opt/3u-aura/current
node scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs \
  --env testnet-mockusdt \
  --purchase-receipt-users
```

If you only want to sample a subset first:

```bash
cd /opt/3u-aura/current
node scripts/uat/reconcile-weekly-fork-purchased-nft-state.mjs \
  --env testnet-mockusdt \
  --purchase-receipt-users \
  --limit 10
```

Expected result:

- JSON summary with `processedUsers`, `mutatedUsers`, `holdingsCreated`,
  `claimsCreated`, `claimsUpdated`
- each repaired wallet lists current `activePurchasedTokenIds`

After repair, reopen:

- `admin.goldmint.vip/dashboard/subsidy`

and confirm:

- `Chain Purchased Supply`
- `DB Active Purchased`
- `Projection Gap`

are aligned or at least improved before continuing with subsidy publish.

## Step 5: If App Services Still Fail

### A. `status=203/EXEC`

Cause:

- old unit files still reference `/bin/zsh`

Fix:

```bash
git pull
bash scripts/deploy/deploy-testnet-mockusdt.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

### B. `JwtStrategy requires a secret or key`

Cause:

- missing `AUTH_JWT_SECRET` / `AUTH_JWT_REFRESH_SECRET`

Fix:

- add the missing keys to `shared.env`
- restart `3u-aura-server`

### C. `EACCES ... dist/generated`

Cause:

- server build artifacts were produced as `root`

Fix:

- rerun the latest deploy script
- it now restores ownership for the `3u-aura` service user

### D. Prisma / build failures

Run:

```bash
PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate
pnpm --dir packages/common build
pnpm --dir apps/server build
```

Then rerun the deploy script.

### E. Pages still return `500` after all services are healthy

Cause:

- the VPS app code was redeployed, but the Postgres schema was not migrated

First try:

```bash
PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

Then inspect:

```bash
journalctl -u 3u-aura-server -n 200 --no-pager
```

and compare the VPS database schema with current migrations.

## Step 6: Repair Nginx

Render and install the site config:

```bash
node scripts/deploy/render-nginx-config.mjs \
  --api-domain api.goldmint.vip \
  --app-domain app.goldmint.vip \
  --admin-domain admin.goldmint.vip \
  --output /tmp/testnet-mockusdt.conf

sudo cp /tmp/testnet-mockusdt.conf /etc/nginx/sites-available/testnet-mockusdt.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/testnet-mockusdt.conf /etc/nginx/sites-enabled/testnet-mockusdt.conf
sudo nginx -t
sudo systemctl reload nginx
```

Verify local HTTP routing:

```bash
curl -I http://api.goldmint.vip/api/v1/health
curl -I http://app.goldmint.vip
curl -I http://admin.goldmint.vip/dashboard
```

## Step 7: Repair TLS

Request explicit subdomain certificates:

```bash
sudo certbot --nginx \
  -d api.goldmint.vip \
  -d app.goldmint.vip \
  -d admin.goldmint.vip
```

If the VPS cannot curl its own public domain cleanly, verify locally with:

```bash
curl -vk --resolve api.goldmint.vip:443:127.0.0.1 https://api.goldmint.vip/api/v1/health
curl -vk --resolve app.goldmint.vip:443:127.0.0.1 https://app.goldmint.vip
curl -vk --resolve admin.goldmint.vip:443:127.0.0.1 https://admin.goldmint.vip/dashboard
```

## Step 8: Final Smoke Test

```bash
curl -s https://api.goldmint.vip/api/v1/health
curl -I https://app.goldmint.vip
curl -I https://admin.goldmint.vip/dashboard
```

Then run:

```bash
bash scripts/deploy/smoke-test-testnet-mockusdt.sh \
  --api https://api.goldmint.vip \
  --app https://app.goldmint.vip \
  --admin https://admin.goldmint.vip
```

## Step 9: Business UAT

Validate:

1. dapp wallet connect
2. admin wallet login
3. check-in payment path
4. NFT purchase payment path
5. lottery / ranking claim flow
6. NFT subsidy claim flow
7. expired subsidy renders as `已作废`

## Notes

- `owner` deploy private key stays on the trusted local operator machine.
- `rewardFunderAddress` and `settlementPublisher` still need `tBNB` before real testnet reward publication UAT.
