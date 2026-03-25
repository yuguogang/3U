# Testnet MockUSDT Rollout — Execution Log

## Status

- In progress
- Local BSC Testnet contract deployment completed
- Repo-side rollout assets created
- Awaiting remote Ubuntu execution for app/server/admin deployment

## Plan Reference

- Plan: `docs/plan-excution/testnet-mockusdt-rollout/plan.md`

## Research Summary

- `testnet-live` 当前使用 `paymentTokenKind = live-test-token`
- `uat-mockusdt` 已经提供了完整的 mock token 参考环境
- `promotion-env` 脚本原生支持 `mockusdt` 类型环境
- `NFTSale` / `Settlement` / `MerkleClaim` 在部署时绑定 `USDT_ADDRESS`
- 如果目标是测试服务器独立环境，推荐新发整套合约，不建议与 `uat-mockusdt` 共享链上地址

## Commands Run During Planning

- `rg -n "mockusdt|USDT|PAYMENT_TOKEN|payment token|MockUSDT|mock usdt|ERC20" apps config packages scripts -S`
- `sed -n '1,220p' config/promotion-envs/testnet-live/manifest.json`
- `sed -n '1,220p' config/promotion-envs/uat-mockusdt/manifest.json`
- `sed -n '1,260p' scripts/promotion-env/deploy-contract-suite.mjs`
- `sed -n '1,220p' apps/contracts/script/DeployNFTCore.s.sol`
- `sed -n '1,260p' apps/contracts/script/DeploySettlementClaim.s.sol`
- `sed -n '1,260p' apps/contracts/src/NFTSale.sol`
- `sed -n '1,220p' apps/contracts/src/Settlement.sol`
- `sed -n '1,200p' apps/contracts/src/mocks/MockUSDT.sol`
- `sed -n '1,220p' scripts/promotion-env/sync-public-envs.mjs`
- `sed -n '1,260p' scripts/uat/start-promotion-services.mjs`

## Preliminary Decision

- Recommendation:
  - create a new parallel environment, tentatively `testnet-mockusdt`
  - deploy a fresh MockUSDT-based full contract suite
- Non-recommended shortcut:
  - repoint a server to the existing `uat-mockusdt` chain addresses
  - this avoids new deployment, but shares on-chain state and weakens environment isolation

## 2026-03-25 Plan Refresh Notes

- Updated the rollout plan to align with the latest verified `fork-anvil` outcome instead of the older single-wallet model.
- Refreshed plan assumptions to require:
  - real BSC Testnet deployment
  - split funding roles
  - fresh contract redeploy
  - optional deletion/rebuild of the old `testnet-live` server deployment
- Added explicit contract-role verification targets:
  - `MerkleClaim.rewardFunder == checkinReceiverAddress`
  - `NFTSale.financeWallet == financeWallet`
  - `Settlement.epochPublisher == settlementPublisher`

## Additional Commands Run During Plan Refresh

- `sed -n '1,260p' docs/plan-excution/testnet-mockusdt-rollout/plan.md`
- `sed -n '1,260p' scripts/promotion-env/deploy-contract-suite.mjs`
- `sed -n '1,260p' scripts/promotion-env/lib.mjs`
- `node --input-type=module -e "import fs from 'fs'; const p=['apps/server/package.json','apps/dapp/package.json','apps/admin/package.json']; for (const f of p){ const j=JSON.parse(fs.readFileSync(f,'utf8')); console.log('FILE',f); console.log(JSON.stringify(j.scripts,null,2)); }"`
- `sed -n '1,260p' config/promotion-envs/fork-anvil/manifest.json`

## 2026-03-25 Implementation Progress

### Environment Assets Added

- Created `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/manifest.json`
- Created `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/notes.md`
- Generated:
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/contracts.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/server.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/dapp.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/admin.public.env`

### Key Decisions Materialized

- `paymentTokenKind` initialized as `mockusdt`
- Split funding roles initialized in manifest shape:
  - `checkinReceiverAddress`
  - `rewardFunderAddress`
  - `financeWallet`
  - `settlementPublisher`
- Contract addresses intentionally left empty pending real BSC Testnet deployment
- Environment status left as `planned` until real addresses and role wallets are supplied

### Supporting Code Change

- Updated `/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs`
  - `dapp/admin` now respect explicit `infra.dapp.port` and `infra.admin.port`
  - avoids incorrectly deriving `443` from HTTPS public URLs during production startup

## Verification Run

### Commands

- `node scripts/promotion-env/sync-public-envs.mjs`
- `sed -n '1,240p' config/promotion-envs/testnet-mockusdt/server.public.env`
- `sed -n '1,240p' config/promotion-envs/testnet-mockusdt/dapp.public.env`
- `sed -n '1,240p' config/promotion-envs/testnet-mockusdt/contracts.public.env`
- `node --check scripts/promotion-env/lib.mjs`

### Results

- New environment was discovered by `promotion-env:sync`
- `server/dapp/admin/contracts` public env files were generated successfully
- `dapp/admin` ports now render correctly as `3100/3101`
- No real chain deployment executed yet

## Remaining Blockers

- Remote VPS execution still needs to be performed by the isolated server operator
- `rewardFunderAddress` and `settlementPublisher` need `tBNB` before real funding/publish UAT

## 2026-03-25 Local Testnet Deployment

### Deployer Readiness

- Confirmed `apps/contracts/.env` exists
- Confirmed `PRIVATE_KEY` exists
- Derived deployer address from local private key:
  - `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
- This matches configured `owner`
- Confirmed `owner` BSC Testnet balance:
  - `9653535435200000000` wei
  - about `9.6535354352 tBNB`

### Deployed Contracts

- `MockUSDT`
  - `0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF`
  - tx: `0xfbc240f87c5ec91828abe69c4ac3194fd48c17519819d7f90aa1af31265c2c5d`
- `FounderNFT`
  - `0x5E8D0bBD325c13d661396E7E1eAD7DAD2d902EC2`
  - tx: `0x6793dca2ada9b1ee52b5a8cae57bf9bee3550cc8d88769c66e4ba0e857c72865`
- `NFTSale`
  - `0xa8C4bc346fFCba0F806629F9939BEF722e75c0C2`
  - tx: `0x302ee464d5d49452f0cca3625540cc3559a8dea7dfb166a9446f5dd684e5317a`
- `Settlement`
  - `0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC`
  - tx: `0xb4195bbf7a854cfee76cec5d7cc13fe5f01ec305af13b0f99f7fc820a28e5a35`
- `MerkleClaim`
  - `0x2d069889DE1d664f3440bEC8030B176019A8823F`
  - tx: `0xe3093f6e638932464f63ef5225f95de91ede344d0971a214c00a7124b9c0fad2`

### Role Verification On Chain

- `MerkleClaim.rewardFunder()`
  - `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- `NFTSale.financeWallet()`
  - `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `Settlement.epochPublisher()`
  - `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Balance Checks For Operational Wallets

- `owner = 0x951f...6d64`
  - has gas
- `rewardFunder = 0x3C44...93BC`
  - `0`
- `settlementPublisher = 0xf39F...2266`
  - `0`

### Commands Run

- `node --input-type=module -e "import fs from 'fs'; const p='apps/contracts/.env'; if(!fs.existsSync(p)){console.log(JSON.stringify({exists:false})); process.exit(0);} const txt=fs.readFileSync(p,'utf8'); const hasPrivateKey=/^PRIVATE_KEY=.+$/m.test(txt); const hasRpc=/^BSC_TESTNET_RPC_URL=.+$/m.test(txt); console.log(JSON.stringify({exists:true,hasPrivateKey,hasRpc}));"`
- `PRIVATE_KEY=$(sed -n 's/^PRIVATE_KEY=//p' apps/contracts/.env | head -n 1) && cast wallet address --private-key "$PRIVATE_KEY"`
- `cast balance 0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64 --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast balance 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `node scripts/promotion-env/deploy-contract-suite.mjs --env testnet-mockusdt --force`
- `cast call 0x2d069889DE1d664f3440bEC8030B176019A8823F "rewardFunder()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0xa8C4bc346fFCba0F806629F9939BEF722e75c0C2 "financeWallet()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC "epochPublisher()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`

### Outputs

- `config/promotion-envs/testnet-mockusdt/manifest.json` now contains fresh contract addresses
- `config/promotion-envs/testnet-mockusdt/contracts.public.env` updated
- `config/promotion-envs/testnet-mockusdt/server.public.env` updated
- `config/promotion-envs/testnet-mockusdt/dapp.public.env` updated
