# Admin Settlement And Subsidy Center — Execution

## Status

- Phase: Implementation complete
- Implementation: Completed
- Approval: Approved and executed

## Planning Log

### 2026-04-02

- Reviewed current admin ops surface and confirmed it only covers `epoch sync` plus reward `activate`, while `draft/publish/root` remain outside the web flow.
- Reviewed weekly reward publication readiness logic and confirmed current server-side checks already cover root, distributor balance, reward funder allowance, and DB activation blockers.
- Reviewed subsidy contract flow and confirmed it uses a different permission/funding model from weekly merkle rewards.
- Reviewed current promotion runtime config exposure and confirmed `manifest` role data is richer than what server runtime currently returns.
- Drafted the implementation plan for a two-module admin operator center:
  - `Weekly Settlement`
  - `Purchased NFT Subsidy`

## Implementation Log

### 2026-04-02

- Added server-side `AdminSettlementService` and wired it into `AdminModule`, `AdminConsoleController`, and `AdminOpsController`.
- Normalized settlement/subsidy admin DTO exports so the active controllers and generated DTO classes refer to real files/classes.
- Consolidated shared admin settlement/subsidy response types in `packages/common/src/models/admin.ts` so admin UI and server now use one consistent response shape.
- Extended promotion runtime config exposure with owner / finance wallet / root publisher / settlement publisher role fields and aligned shared env generation with those addresses.
- Reused the existing admin settlement/subsidy page scaffolding already present in the worktree and aligned the backend/common contracts to that UI surface instead of introducing a second API shape.
- Added `AdminSettlementService` unit coverage for weekly readiness/wallet action composition and subsidy publish preview argument assembly.

## Commands Run

- `sed -n '1,220p' /Users/ygg/.codex/skills/claude-skills-collection/skills/create-plan/SKILL.md`
- `sed -n '1,240p' docs/plan-excution/reward-funder-contract-rollout/plan.md`
- `sed -n '1,240p' apps/admin/src/features/ops/components/ops-page.tsx`
- `sed -n '1,260p' apps/server/src/modules/shared/services/promotion-chain-client.service.ts`
- `rg -n "previewEpochSync|executeEpochSync|previewRewardPublication|executeRewardPublication|publish.*subsidy|subsidy" apps/server/src/modules/admin apps/server/src/modules/claims apps/server/src/modules/rewards apps/server/src/modules/epoch apps/server/src/modules/shared apps/contracts/src/Settlement.sol apps/server/scripts`
- `sed -n '1,260p' apps/server/src/modules/admin/services/admin-ops.service.ts`
- `sed -n '1,260p' apps/server/src/modules/claims/services/purchased-nft-sync.service.ts`
- `sed -n '1,260p' apps/contracts/src/Settlement.sol`
- `sed -n '260,420p' apps/server/src/modules/admin/services/admin-ops.service.ts`
- `sed -n '1,260p' apps/server/src/modules/rewards/services/reward-publication.service.ts`
- `sed -n '1,260p' apps/server/src/configuration/config.types.ts`
- `sed -n '1,260p' packages/common/src/models/admin.ts`
- `rg -n "dashboard/ops|OpsPage|overview-page|subsidy" apps/admin/src -g'*.tsx' -g'*.ts'`
- `sed -n '1,260p' apps/admin/src/queries/admin.query.ts`
- `sed -n '1,260p' apps/admin/src/api/admin.ts`
- `sed -n '1,260p' apps/admin/src/features/overview/components/overview-page.tsx`
- `rg -n "publishRoot|rewardJsonUri|epochRootById|MerkleClaim" apps/contracts/src apps/server/src apps/admin/src packages/common/src`
- `sed -n '1,260p' apps/server/scripts/settle-weekly-epoch-rewards.ts`
- `sed -n '1,260p' apps/contracts/src/MerkleClaim.sol`
- `rg -n "rootPublisher|financeWallet|epochPublisher|rewardFunderAddress|settlementPublisher|checkinReceiverAddress" config/promotion-envs apps/server/src apps/admin/src packages/common/src`
- `sed -n '1,220p' config/promotion-envs/testnet-mockusdt/manifest.json`
- `rg -n "publishEpochRewards|materializeEpochRewards|activateEpochRewards" apps/server/src/modules/rewards -g'*.ts'`
- `sed -n '1,360p' apps/server/src/modules/rewards/services/rewards.service.ts`
- `sed -n '1,260p' apps/server/src/configuration/config.configuration.ts`
- `rg -n "wagmi|RainbowKit|Wallet|useAccount|useWalletClient|createConfig" apps/admin/src -g'*.tsx' -g'*.ts'`
- `sed -n '1,220p' apps/admin/src/store/auth.store.ts`
- `sed -n '1,220p' apps/admin/src/app/layout.tsx`
- `rg -n "useWriteContract|useReadContract|simulateContract|writeContract|waitForTransactionReceipt" apps/admin/src -g'*.tsx' -g'*.ts'`
- `sed -n '1,200p' apps/admin/src/lib/wagmi-config.tsx`
- `mkdir -p docs/plan-excution/admin-settlement-and-subsidy-center`
- `sed -n '1,260p' apps/server/src/modules/admin/admin-ops.controller.ts`
- `sed -n '1,260p' apps/server/src/modules/admin/admin-console.controller.ts`
- `sed -n '1,320p' apps/server/src/modules/admin/services/admin-settlement.service.ts`
- `sed -n '1,320p' apps/admin/src/queries/admin.query.ts`
- `sed -n '1,320p' apps/admin/src/api/admin.ts`
- `sed -n '1,520p' apps/admin/src/features/settlement/components/weekly-settlement-page.tsx`
- `sed -n '1,520p' apps/admin/src/features/subsidy/components/subsidy-center-page.tsx`
- `sed -n '1,260p' apps/server/src/modules/admin/services/admin-console.service.ts`
- `sed -n '1,260p' apps/server/src/modules/admin/services/admin-ops.service.ts`
- `sed -n '1,260p' packages/common/src/models/admin.ts`
- `sed -n '1,260p' packages/common/src/validators/admin.ts`
- `sed -n '1,260p' apps/server/src/modules/rewards/rewards.module.ts`
- `sed -n '1,260p' apps/server/src/modules/claims/claims.module.ts`
- `sed -n '1,260p' apps/server/src/modules/epoch/epoch.module.ts`
- `sed -n '1,260p' apps/server/src/modules/shared/shared-domain.module.ts`
- `/usr/local/bin/node node_modules/unbuild/dist/cli.mjs`
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/modules/admin/admin-console.controller.ts src/modules/admin/admin-ops.controller.ts src/modules/admin/admin.module.ts src/modules/admin/dto/admin-weekly-settlement-query.dto.ts src/modules/admin/dto/admin-subsidy-publish-preview-request.dto.ts src/modules/admin/services/admin-settlement.service.ts src/modules/admin/services/admin-settlement.service.spec.ts`
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/features/settlement/components/weekly-settlement-page.tsx`
- `/usr/local/bin/node apps/server/node_modules/typescript/bin/tsc -p apps/server/tsconfig.json --noEmit`
- `/usr/local/bin/node apps/admin/node_modules/typescript/bin/tsc -p apps/admin/tsconfig.typecheck.json --noEmit`
- `/usr/local/bin/node node_modules/jest/bin/jest.js src/modules/admin/services/admin-ops.service.spec.ts src/modules/admin/services/admin-settlement.service.spec.ts --runInBand`

## Verification

- `packages/common` build passed via `unbuild`, regenerating `dist/index.{cjs,mjs,d.ts}` against the new shared admin types.
- `apps/server` typecheck passed via `/usr/local/bin/node apps/server/node_modules/typescript/bin/tsc -p apps/server/tsconfig.json --noEmit`.
- `apps/admin` typecheck passed via `/usr/local/bin/node apps/admin/node_modules/typescript/bin/tsc -p apps/admin/tsconfig.typecheck.json --noEmit`.
- Targeted lint passed for:
  - `apps/server/src/modules/admin/**` files touched in this task
  - `apps/admin/src/features/settlement/components/weekly-settlement-page.tsx`
- Jest passed for:
  - `src/modules/admin/services/admin-settlement.service.spec.ts`
  - `src/modules/admin/services/admin-ops.service.spec.ts`
- Manual browser/operator validation was not run in this task.

## Deviations

- The local shell environment did not expose `node`, `pnpm`, or `corepack` on `PATH`, so verification commands were executed with the explicit binary `/usr/local/bin/node`.
- The admin settlement/subsidy page scaffolding already existed in the working tree before this implementation pass; work focused on wiring server/common contracts to that UI surface and validating the full path.
- `packages/common` does not have a standalone ESLint config in this repo layout, so verification there used `unbuild` plus downstream `server/admin` typechecks against the rebuilt `dist` output instead of a direct lint step.

## Next Step

- Optional next step: run a localhost manual smoke flow against `testnet-mockusdt` to confirm wallet-driven `depositRewardsFromFunder`, `publishRoot`, and `publishSubsidyEpoch` transactions behave correctly with the new readiness UI.
