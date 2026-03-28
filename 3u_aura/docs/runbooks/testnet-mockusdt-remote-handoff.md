# Testnet MockUSDT Remote Handoff

## Purpose

This document is the operator-facing handoff for bringing up the new
`testnet-mockusdt` environment on the isolated Ubuntu VPS after contracts
have already been deployed from the local operator machine.

It assumes:

- repo contains the latest deployment assets
- chain target is real BSC Testnet
- contract deployment is executed locally by the operator controlling the deploy key
- app deployment is executed by a remote operator who has SSH access
- this workstation does **not** SSH into the VPS directly

## Target Host

- Public IP: `47.236.39.50`
- Private IP: `172.21.249.249`
- Root domain: `goldmint.vip`
- API domain: `api.goldmint.vip`
- DApp domain: `app.goldmint.vip`
- Admin domain: `admin.goldmint.vip`

## Runtime Domains Already Wired Into Repo Config

These are already written into:

- `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
- `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/*.public.env`

## Deployed Contract Addresses (BSC Testnet)

- `MockUSDT`
  - `0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF`
- `FounderNFT`
  - `0x5E8D0bBD325c13d661396E7E1eAD7DAD2d902EC2`
- `NFTSale`
  - `0xa8C4bc346fFCba0F806629F9939BEF722e75c0C2`
- `Settlement`
  - `0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC`
- `MerkleClaim`
  - `0x2d069889DE1d664f3440bEC8030B176019A8823F`

## Chain Config

- Chain ID: `97`
- RPC:
  - `https://data-seed-prebsc-1-s1.binance.org:8545/`
- Referral RPC:
  - `https://data-seed-prebsc-1-s1.binance.org:8545/`
- WalletConnect Project ID:
  - `124353e5a312fdabb5b1d182ada6eca1`

## Role Addresses

- `owner`
  - `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
- `rootPublisher`
  - `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
- `checkinReceiverAddress`
  - `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- `rewardFunderAddress`
  - `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- `financeWallet`
  - `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `settlementPublisher`
  - `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `referralSignerAddress`
  - `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
- `adminAllowlistWallets`
  - `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
  - `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

## Gas Status Confirmed On BSC Testnet

- `owner = 0x951f...6d64`
  - has gas
  - balance checked: about `9.6535354352 tBNB`
- `rewardFunder = 0x3C44...93BC`
  - `0 tBNB`
- `settlementPublisher = 0xf39F...2266`
  - `0 tBNB`

## Important Operational Warning

Before reward publication UAT on real testnet:

- `rewardFunderAddress` must receive some `tBNB`
- `settlementPublisher` must receive some `tBNB`

Otherwise:

- lottery/ranking funding actions may fail
- subsidy publish/funding actions may fail

## Secrets The Remote Operator Must Supply

These must **not** be committed into the repo:

- VPS local infra secrets:
  - Postgres password
  - Redis password
- JWT secrets for app auth
- WalletConnect Project ID, if it is reissued

Do **not** place the deployment private key for `owner` on the VPS.
Contracts are already deployed from the trusted local operator machine.

## Remote Execution Order

### 1. Prepare DNS

Create A records:

- `api.goldmint.vip` -> `47.236.39.50`
- `app.goldmint.vip` -> `47.236.39.50`
- `admin.goldmint.vip` -> `47.236.39.50`

### 2. Prepare Repo On VPS

Checkout the repo on the Ubuntu host under:

- `/opt/3u-aura/current`

cd /opt
sudo mkdir -p 3u-aura
cd 3u-aura
sudo curl -L https://github.com/your-org/3u-aura/archive/refs/heads/main.zip -o main.zip
sudo unzip main.zip
sudo mv 3u-aura-main current

### 3. Prepare Local Secret Files On VPS

Create:

- `/etc/3u-aura/testnet-mockusdt/infra.env`
- `/etc/3u-aura/testnet-mockusdt/shared.env`

Use examples:

- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.server.env.example`
- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.shared.env.example`

`shared.env` must include at least:

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=change-me
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=124353e5a312fdabb5b1d182ada6eca1
AUTH_JWT_SECRET=<long-random-secret>
AUTH_JWT_REFRESH_SECRET=<another-long-random-secret>
AUTH_JWT_SECRET_EXPIRES_SECONDS=604800
AUTH_JWT_REFRESH_SECRET_EXPIRES_SECONDS=2592000
```

### 4. Bootstrap VPS

Do **not** use the distro default `apt install nodejs` alone. It may install an old Node
release that cannot run repo ESM scripts such as:

- `scripts/promotion-env/sync-public-envs.mjs`
- `scripts/deploy/render-nginx-config.mjs`

The required runtime is Node `22` with `pnpm@10.13.1`.

```bash
bash scripts/deploy/bootstrap-vps.sh
bash scripts/deploy/install-docker-stack.sh \
  --infra-env /etc/3u-aura/testnet-mockusdt/infra.env \
  --compose ops/docker/testnet-mockusdt.compose.yml
```

After bootstrap, verify:

```bash
node --version
pnpm --version
```

If bootstrap was skipped and you already installed an old Node version, fix it with:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.13.1 --activate
node --version
pnpm --version
```

### 5. Confirm Contracts Are Already Deployed

Before the remote operator continues, confirm locally that:

- `config/promotion-envs/testnet-mockusdt/manifest.json` contains fresh contract addresses
- `node scripts/promotion-env/sync-public-envs.mjs` has been run after deployment
- the updated repo content or deployment bundle has been transferred to the VPS

If `node scripts/promotion-env/sync-public-envs.mjs` fails with:

- `SyntaxError: Unexpected identifier`
- pointing at `import path from 'node:path'`

the VPS is still using an outdated Node runtime. Upgrade Node first, then rerun the command.

### 6. Build And Start Apps

```bash
bash scripts/deploy/deploy-testnet-mockusdt.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

Notes:

- the deploy script uses `pnpm install --frozen-lockfile`
- use the repository-standard `pnpm@10.13.1`; do not fall back to pnpm 8 or mix pnpm major versions during deployment
- the deploy script builds `packages/common` before app builds
- the deploy script now also runs `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate` before `apps/server build`
- the deploy script now also fixes build artifact ownership for the `3u-aura` service user
- do not use `pnpm install --force` or `--no-frozen-lockfile` manually unless you are debugging outside the scripted flow
- the deploy script does **not** run `prisma migrate deploy`; you must run the DB migration step explicitly on a fresh or stale VPS database

After the deploy script finishes, run:

```bash
PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

If `apps/server build` fails with TypeScript errors such as:

- `Property 'user' does not exist on type 'DbService'`

that means Prisma client generation did not happen. Fix with:

```bash
PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate
```

then rerun the deploy script.

If Prisma generation fails with:

- `Cannot resolve environment variable: DATABASE_URL`

you used the wrong command. Do not run bare `pnpm --dir apps/server db:generate` on the VPS; it bypasses promotion-env injection.

If TypeScript cannot resolve `3u-aura-common`, that means the shared package was not built. Fix with:

```bash
pnpm --dir packages/common build
```

then rerun the deploy script.

If `3u-aura-server` crashes with:

- `JwtStrategy requires a secret or key`

then `shared.env` is missing JWT secrets. Add `AUTH_JWT_SECRET` and
`AUTH_JWT_REFRESH_SECRET`, then restart the service.

If any of the systemd services fail with:

- `status=203/EXEC`

you are still using an older deployment that rendered `/bin/zsh` into the unit
files. Pull the latest repo and rerun the deploy script so the units are
rewritten with `/bin/bash`.

If `3u-aura-server` fails with:

- `EACCES: permission denied, symlink '../generated'`

the repo was built as `root` but the service runs as `3u-aura`. Pull the latest
repo and rerun the deploy script; it now applies the required ownership fix.

### 7. Render And Install Nginx Config

```bash
node scripts/deploy/render-nginx-config.mjs \
  --api-domain api.goldmint.vip \
  --app-domain app.goldmint.vip \
  --admin-domain admin.goldmint.vip \
  --output /tmp/testnet-mockusdt.conf
```

Install the rendered file into Nginx, then:

```bash
sudo cp /tmp/testnet-mockusdt.conf /etc/nginx/sites-available/testnet-mockusdt.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/testnet-mockusdt.conf /etc/nginx/sites-enabled/testnet-mockusdt.conf
sudo nginx -t
sudo systemctl reload nginx
curl -I http://api.goldmint.vip/api/v1/health
curl -I http://app.goldmint.vip
curl -I http://admin.goldmint.vip/dashboard
sudo certbot --nginx \
  -d api.goldmint.vip \
  -d app.goldmint.vip \
  -d admin.goldmint.vip
```

If you see the default Ubuntu Nginx page or `404`, the default site is still
enabled or the rendered config was not installed. If `certbot --nginx` says it
cannot find a matching server block, install the rendered config first and
request certificates for the three explicit subdomains.

### 8. Smoke Check

```bash
bash scripts/deploy/smoke-test-testnet-mockusdt.sh \
  --api https://api.goldmint.vip \
  --app https://app.goldmint.vip \
  --admin https://admin.goldmint.vip
```

## Remote Operator Must Report Back

After execution, operator should return:

- deployed contract addresses as seen in the final manifest used on the VPS
- final `config/promotion-envs/testnet-mockusdt/manifest.json`
- output of:
  - `systemctl status 3u-aura-server`
  - `systemctl status 3u-aura-dapp`
  - `systemctl status 3u-aura-admin`
- output of:
  - `curl -s https://api.goldmint.vip/api/v1/health`
  - `curl -I https://app.goldmint.vip`
  - `curl -I https://admin.goldmint.vip/dashboard`
- any tx hashes for:
  - initial reward funding
  - subsidy publish/funding

## Local Operator Must Keep

- deployment broadcast artifacts
- final `manifest.json`
- the tx hashes for:
  - `MockUSDT`
  - `FounderNFT`
  - `NFTSale`
  - `Settlement`
  - `MerkleClaim`

## Manual UAT After Remote Bring-Up

Use:

- `app.goldmint.vip`
- `admin.goldmint.vip`

Validate:

1. wallet connect
2. check-in sends `3 USDT` to `checkinReceiverAddress`
3. dashboard shows `1000 AURA`
4. founder NFT purchase sends `1000 USDT` to `financeWallet`
5. ranking/lottery rewards become claimable
6. NFT subsidy becomes claimable
7. expired subsidy shows as `已作废`

## Last Rollout Issue Summary

The previous VPS rollout hit these real issues:

1. Old distro Node could not run repo `.mjs` scripts.
2. Mixed `pnpm` versions caused lockfile and dependency drift.
3. `shared.env` was missing JWT secrets, causing `JwtStrategy requires a secret or key`.
4. Older systemd units still referenced `zsh`, which was not installed on Ubuntu.
5. Root-owned server build artifacts caused `EACCES` when `3u-aura-server` tried to create the Prisma runtime symlink.
6. The default Ubuntu Nginx site stayed enabled, so subdomains served the wrong content.
7. Certbot was first run against the wrong site context, so certificates were not installed onto the subdomain reverse proxies.
8. App redeploy alone did not migrate the VPS database schema, so some pages still returned `500` even though all systemd services showed `active (running)`.

The current repo now includes:

- Node 22 + `pnpm@10.13.1` bootstrap instructions
- `env:db:generate` in the deploy flow
- `bash`-based systemd templates
- Redis password propagation into generated `server.env`
- build artifact ownership correction in the deploy script

See also:

- `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md`
