# Fork Anvil Weekly Reward Scenario Runner - Execution Log

## Status

- In progress
- `prepare` phase validated on `fork-anvil`

## Execution Notes

- User clarified the preferred operator flow:
  - start/reuse local Anvil
  - let runner reset DB and start `server`
  - use scripts for synthetic users / check-in / ranking prep / epoch progression
  - manually open `dapp/admin` only for inspection and claim actions
- Adjusted implementation to match that flow:
  - runner now only manages `server`
  - `dapp/admin` are no longer treated as readiness blockers for the scenario runner
  - `reset` now forcibly stops a matching fork `server` even if it was not recorded in `services.runtime.json`

## Implemented Changes

- Extended [seed-weekly-fork-fixtures.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/seed-weekly-fork-fixtures.mjs):
  - export reusable helpers
  - generate synthetic participant wallets
  - return participant metadata for follow-up lottery shaping
- Added [run-weekly-fork-scenarios.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/run-weekly-fork-scenarios.mjs):
  - `prepare` phase
  - `settle` phase
  - state persistence to `config/promotion-envs/<env>/weekly-reward-scenario.state.json`
- Added purchased NFT sync helpers:
  - [sync-weekly-fork-purchased-nft-state.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/sync-weekly-fork-purchased-nft-state.mjs)
  - [sync-purchased-nft-state.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/uat/sync-purchased-nft-state.ts)
- Updated [promotion-service-lib.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/promotion-service-lib.mjs):
  - `stopPromotionServices(..., includeUnmanaged: true)` can now stop a matching live service even when the runtime file is stale
- Updated [run-weekly-fork-scenarios.mjs](/Users/ygg/vs/ai/3U/3u_aura/scripts/uat/run-weekly-fork-scenarios.mjs):
  - runner manages `server` only
  - output now explicitly instructs the operator to start/open `dapp/admin` manually if needed
  - fixed `LotteryTicket` upsert SQL by generating the synthetic ticket id in JS instead of using `CONCAT($1, ...)`

## Research References

- Existing fork / weekly tooling:
  - `apps/e2e/phase94/package.json`
  - `scripts/uat/weekly-fork-lib.mjs`
  - `scripts/uat/prepare-weekly-fork-db.mjs`
  - `scripts/uat/reset-weekly-fork-db.mjs`
  - `scripts/uat/start-promotion-services.mjs`
  - `scripts/uat/seed-weekly-fork-fixtures.mjs`
  - `scripts/uat/materialize-weekly-fork-draft.mjs`
  - `scripts/uat/publish-weekly-fork-claims.mjs`
  - `scripts/uat/resolve-weekly-fork-epoch.mjs`
- Existing chain helpers:
  - `scripts/ci/lib/contracts.mjs`
- Existing UI validation surfaces:
  - `apps/dapp/src/components/pages/checkin-page.tsx`
  - `apps/dapp/src/components/pages/rewards-page.tsx`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/admin/src/features/overview/components/overview-page.tsx`
  - `apps/admin/src/features/ops/components/ops-page.tsx`

## Commands Run

```bash
sed -n '1,260p' /Users/ygg/.codex/skills/claude-skills-collection/skills/create-plan/SKILL.md
sed -n '1,240p' docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md
sed -n '1,240p' docs/plan-excution/testnet-mockusdt-rollout/plan.md
rg -n "prepare-weekly-fork-db|reset-weekly-fork-db|start-promotion-services|epoch sync|claim sync|promotion-env:fork|anvil_setNextBlockTimestamp|evm_increaseTime|fork-anvil" scripts apps/e2e apps/server apps/admin -g '!**/dist/**'
sed -n '1,260p' scripts/uat/prepare-weekly-fork-db.mjs
sed -n '1,260p' scripts/uat/reset-weekly-fork-db.mjs
sed -n '1,260p' scripts/uat/start-promotion-services.mjs
node --check scripts/uat/run-weekly-fork-scenarios.mjs
node --check scripts/uat/seed-weekly-fork-fixtures.mjs
node --check scripts/uat/sync-weekly-fork-purchased-nft-state.mjs
node --check scripts/uat/promotion-service-lib.mjs
curl -s http://127.0.0.1:3210/api/v1/health
node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase prepare --reset --restart-services
```

## Verification

- `node --check scripts/uat/run-weekly-fork-scenarios.mjs` passed
- `node --check scripts/uat/seed-weekly-fork-fixtures.mjs` passed
- `node --check scripts/uat/sync-weekly-fork-purchased-nft-state.mjs` passed
- `node --check scripts/uat/promotion-service-lib.mjs` passed
- `curl -s http://127.0.0.1:3210/api/v1/health` returned `{"status":"ok",...}`
- `prepare` phase completed successfully with:
  - target wallet `0x3C44...93BC`
  - `currentStreakDays = 7`
  - `canParticipate = true`
  - synthetic participant count `23`
  - pre-shaped lottery participant set where target winner rank is `5 / 6`
  - managed runtime reduced to `server` only
- reran `prepare` for the next weekly epoch after the local date crossed into `2026-03-25`:
  - current epoch moved from `#2` to `#3`
  - target wallet again prepared to `currentStreakDays = 7`
  - target manually joined lottery in DApp
- `settle` phase completed successfully for epoch `#3`:
  - weekly draft produced `23` lottery rewards and `10` ranking rewards
  - merkle publish produced `21` claimable leaves
  - on-chain root published:
    - `0x88c7e07e658031cfae6de1bbcae60f916eb56d998715ec5da9454c92eb20db4e`
  - total deposited merkle reward amount:
    - `250000000` atomic USDT
  - next promotion epoch `#4` opened after sync
- NFT subsidy was intentionally skipped during settlement because reading the founder NFT contract failed:
  - contract read attempted against `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`
  - local fork manifest/runtime contract state needs reconciliation before subsidy testing

## Latest Prepare Output Highlights

- DApp next step:
  - open `http://127.0.0.1:3200/checkin`
  - click `参与本周抽奖`
- Optional NFT step:
  - open `http://127.0.0.1:3200/nft`
  - buy one Purchased NFT with `0x3C44...93BC`
- Settlement step:
  - run `node scripts/uat/run-weekly-fork-scenarios.mjs --env fork-anvil --phase settle --target-wallet 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

## Latest Settle Output Highlights

- Rewards page:
  - open `http://127.0.0.1:3200/rewards`
  - reveal the lottery result for epoch `#3`
- Claims page:
  - open `http://127.0.0.1:3200/claims`
  - claim lottery and ranking rewards
- Admin checks:
  - `http://127.0.0.1:3201/overview`
  - `http://127.0.0.1:3201/ops`
- NFT subsidy:
  - skipped for now due contract address drift in the current fork runtime

## Deviations From Original Request

- Original plan considered auto-starting `server/dapp/admin`
- Actual implementation now treats `dapp/admin` as optional manual UI surfaces and keeps the runner focused on:
  - local Anvil
  - DB reset/bootstrap
  - `server` orchestration
  - chain/data scenario preparation
