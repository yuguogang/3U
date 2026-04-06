# Testnet MockUSDT Weekly Root And Subsidy Release Execution Log

## Status
- Created on `2026-04-05`
- Live execution completed on `2026-04-05`

## Notes
- This task continues after the repaired `epoch #1` weekly draft/publish work recorded in:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/testnet-mockusdt-epoch1-ticket-recovery/execution.md`
- The user provided private keys for:
  - `0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64` (`owner` / `rootPublisher`)
  - `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `MockUSDT` on this environment is an open-mint test token, which allowed safe funding of the owner wallet without needing the configured `rewardFunder` private key.

## Planned Live Sequence
1. Weekly reward release preflight
2. Weekly root publication
3. Weekly activation
4. Subsidy preflight and purchased NFT sync readiness
5. Subsidy publication
6. Subsidy projection verification

## Commands Run
- `rg -n "publishRoot|activateEpochRewardPublication|publishSubsidyEpoch|subsidyEpochs|rewards/publish|ops/settlement|MerkleClaim|Settlement" apps/server apps/contracts scripts packages/common -g '!**/dist/**'`
- `rg --files . | rg 'AGENTS\.md$|settle-weekly-epoch-rewards\.ts$|run-with-env\.mjs$|uat|promotion-env'`
- `sed -n '1,220p' apps/server/scripts/settle-weekly-epoch-rewards.ts`
- `sed -n '1,240p' apps/contracts/src/MerkleClaim.sol`
- `sed -n '1,260p' apps/contracts/src/Settlement.sol`
- `sed -n '260,420p' apps/server/src/modules/admin/services/admin-ops.service.ts`
- `sed -n '1,260p' apps/server/src/modules/rewards/services/reward-publication.service.ts`
- `sed -n '260,520p' scripts/ci/lib/contracts.mjs`
- `sed -n '1,240p' scripts/uat/publish-weekly-fork-claims.mjs`
- `sed -n '1,240p' scripts/uat/activate-weekly-fork-claims.mjs`
- `sed -n '1,220p' config/promotion-envs/testnet-mockusdt/manifest.json`
- `sed -n '1,220p' scripts/promotion-env/lib.mjs`
- `sed -n '1,260p' apps/server/src/modules/claims/services/purchased-nft-sync.service.ts`
- `sed -n '1,260p' apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts`
- `command -v redis-cli`
- `nc -vz 47.236.39.50 6379`
- raw Redis auth verification against `47.236.39.50:6379` using `/usr/local/bin/node`
- `cast call 0x2d069889DE1d664f3440bEC8030B176019A8823F "owner()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x2d069889DE1d664f3440bEC8030B176019A8823F "rootPublisher()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x2d069889DE1d664f3440bEC8030B176019A8823F "rewardFunder()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x2d069889DE1d664f3440bEC8030B176019A8823F "epochRootById(uint256)(bytes32)" 1 --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC "owner()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC "epochPublisher()(address)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC "subsidyEpochs(uint256)((uint64,uint64,uint32,uint32,uint32,uint128,uint128,bool))" 1 --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x5E8D0bBD325c13d661396E7E1eAD7DAD2d902EC2 "purchasedMinted()(uint256)" --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast call 0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF "balanceOf(address)(uint256)" ...`
- `cast call 0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF "allowance(address,address)(uint256)" ...`
- `cast wallet address --private-key ...`
- `/usr/local/bin/node /tmp/testnet_epoch1_verify_state.mjs`
- `cast send 0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF "mint(address,uint256)" 0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64 1275727500 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast send 0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF "approve(address,uint256)" 0x2d069889DE1d664f3440bEC8030B176019A8823F 1275727500 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast send 0x2d069889DE1d664f3440bEC8030B176019A8823F "depositRewards(uint256)" 1275727500 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast send 0x2d069889DE1d664f3440bEC8030B176019A8823F "publishRoot(uint256,bytes32)" 1 0x399b247ee8a9de8d7dec37bf6d340fe767aae328d42c115460b627508d3dcf06 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `PATH=/usr/local/bin:$PATH PROMOTION_ENV=testnet-mockusdt DATABASE_HOST=47.236.39.50 DATABASE_PORT=5432 DATABASE_USER=postgres DATABASE_PASSWORD=change-me CACHE_URL=redis://47.236.39.50:6379/11 CACHE_PASSWORD=change-me THROTTLER_REDIS=redis://47.236.39.50:6379/12 BULL_HOST=47.236.39.50 BULL_PORT=6379 /usr/local/bin/node scripts/promotion-env/run-with-env.mjs --target server -- /usr/local/bin/pnpm --dir apps/server exec ts-node --project tsconfig.json -r tsconfig-paths/register .tmp/testnet_weekly_rewards_long_tx.ts --epoch-id cmne80qp900008wpj44hy91qv --mode activate --reward-json-uri ipfs://testnet-mockusdt/epoch-1-recovered-weekly.json`
- `cast block latest --json --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast send 0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF "approve(address,uint256)" 0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC 900000000 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast send 0x3639e64AB81769fEbBDA96Fd8e5BB9922D8053fF "mint(address,uint256)" 0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64 900000000 --gas-price 200000000 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `cast send 0x7Ab52fEaE668b2f012945Db8840498C3A3BCb7eC "publishSubsidyEpoch(uint256,uint128,uint64)" 1 30000000 1776000162 --private-key <owner> --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/`
- `PATH=/usr/local/bin:$PATH PROMOTION_ENV=testnet-mockusdt DATABASE_HOST=47.236.39.50 DATABASE_PORT=5432 DATABASE_USER=postgres DATABASE_PASSWORD=change-me CACHE_URL=redis://47.236.39.50:6379/11 CACHE_PASSWORD=change-me THROTTLER_REDIS=redis://47.236.39.50:6379/12 BULL_HOST=47.236.39.50 BULL_PORT=6379 /usr/local/bin/node scripts/promotion-env/run-with-env.mjs --target server -- /usr/local/bin/pnpm --dir apps/server exec ts-node --project tsconfig.json -r tsconfig-paths/register .tmp/testnet_project_subsidy_claims_from_existing_holdings.ts`
- `/usr/local/bin/node /tmp/testnet_post_release_verify.mjs`
- `kill -9 4541 4550 4554 5570 5575 5581 7164`

## Findings
- Deployed live admin/API still uses the older reward activation route, not the new settlement center route.
- Weekly activation can still use the existing reward publication path after root publication.
- `testnet-mockusdt` manifest does not include local wallet fixtures in the repo, so live chain writes may require manual operator signing unless private keys are supplied separately.
- Remote Redis is reachable and authenticates successfully with password `change-me`.
- Live on-chain role check:
  - `MerkleClaim.owner = 0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
  - `MerkleClaim.rootPublisher = 0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
  - `MerkleClaim.rewardFunder = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - `Settlement.owner = 0x951f5f74f8a5b480DC42aA41c04522C8eCED6d64`
  - `Settlement.epochPublisher = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Weekly reward release completed successfully:
  - Merkle funding tx: `0xd52e1f5a94e3136052efdb67734c4fce4f6659ee2164f61f24587a9332c9bd40`
  - Root publication tx: `0x46a5c1ebe0eaef1f3874b47864138d82858858843ab21c7070ac4748754a929d`
  - DB activation completed with:
    - `epoch #1 status = ROOT_POSTED`
    - `rewardJsonUri = ipfs://testnet-mockusdt/epoch-1-recovered-weekly.json`
    - `MERKLE_LOTTERY` claims `7 x CLAIMABLE`
    - `MERKLE_RANKING` claims `1 x CLAIMABLE`
    - `LOTTERY_USDT` rewards `7 x CLAIMABLE`
    - `RANKING_USDT` rewards `1 x CLAIMABLE`
- Subsidy publication completed successfully:
  - Subsidy publish tx: `0xb1563d59be918464e27772f884c6963050134ab9235ac7cb26d4629d8361abc1`
  - Published params:
    - `epochNo = 1`
    - `subsidyAmountAtomic = 30000000` (`30 USDT`)
    - `eligiblePurchasedSupply = 30`
    - `fundingAmountAtomic = 900000000` (`900 USDT`)
    - `claimDeadline = 2026-04-12T13:22:42.000Z`
- Deterministic DB projection from existing purchased holdings completed successfully:
  - created `1` `NFT_SUBSIDY` DB epoch
  - created `23` `NftSubsidyClaim` rows
  - covered `12` users with existing purchased holdings
  - final DB verification:
    - subsidy epoch `#1` exists with status `CALCULATING`
    - subsidy claims `23 x PENDING`
    - subsidy claim users `12`

## Deviations
- Attempting to sync purchased NFT subsidy state by replaying on-chain purchase logs hit BSC testnet RPC `eth_getLogs` limit errors and long-running sessions.
- To avoid unsafe ad hoc SQL while still unblocking users, claim projection switched to a deterministic helper based on:
  - already-persisted `PURCHASED` holdings in DB
  - the successfully published on-chain subsidy epoch
- Residual gap remains for purchased NFTs that exist on-chain but still do not exist in `NftHolding`; those users will need either:
  - a later holding backfill repair, or
  - a user-specific sync path once RPC limits are handled.
