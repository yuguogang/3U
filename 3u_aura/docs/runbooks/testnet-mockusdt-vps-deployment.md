# Testnet MockUSDT VPS Deployment Runbook

## Purpose

Deploy the latest 3U AURA promotion stack to a fresh Ubuntu VPS using:

- real BSC Testnet
- locally deployed fresh `testnet-mockusdt` contracts
- split funding wallets
- Docker for Postgres/Redis
- systemd for `server / dapp / admin`

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

On the VPS:

```bash
bash scripts/deploy/bootstrap-vps.sh
```

Create infra env from:

- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.server.env.example`

Write it to:

- `/etc/3u-aura/testnet-mockusdt/infra.env`

Create shared runtime secrets from:

- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.shared.env.example`

Write it to:

- `/etc/3u-aura/testnet-mockusdt/shared.env`

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
- build server/dapp/admin
- read shared secrets from `/etc/3u-aura/testnet-mockusdt/shared.env`
- install systemd units
- restart services

## Step 5: Configure Nginx And TLS

Render Nginx config:

```bash
node scripts/deploy/render-nginx-config.mjs \
  --api-domain api.example.com \
  --app-domain app.example.com \
  --admin-domain admin.example.com \
  --output /tmp/testnet-mockusdt.conf
```

Install config into Nginx and enable it, then:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx
```

## Step 6: Smoke Check

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
