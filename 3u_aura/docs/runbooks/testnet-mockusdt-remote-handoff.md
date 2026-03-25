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

- deployment private key
- VPS local infra secrets:
  - Postgres password
  - Redis password
- WalletConnect Project ID secret handling, if reissued
- any per-wallet private keys used for:
  - `owner`
  - `rewardFunderAddress`
  - `settlementPublisher`

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

### 4. Bootstrap VPS

```bash
bash scripts/deploy/bootstrap-vps.sh
bash scripts/deploy/install-docker-stack.sh \
  --infra-env /etc/3u-aura/testnet-mockusdt/infra.env \
  --compose ops/docker/testnet-mockusdt.compose.yml
```

### 5. Confirm Contracts Are Already Deployed

Before the remote operator continues, confirm locally that:

- `config/promotion-envs/testnet-mockusdt/manifest.json` contains fresh contract addresses
- `node scripts/promotion-env/sync-public-envs.mjs` has been run after deployment
- the updated repo content or deployment bundle has been transferred to the VPS

### 6. Build And Start Apps

```bash
bash scripts/deploy/deploy-testnet-mockusdt.sh \
  --env testnet-mockusdt \
  --app-root /opt/3u-aura/current \
  --env-dir /etc/3u-aura/testnet-mockusdt
```

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
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx
```

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
