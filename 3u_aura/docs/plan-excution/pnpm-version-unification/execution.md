# PNPM Version Unification — Execution Log

## Status

- Planned
- Awaiting approval before implementation

## Plan Reference

- Plan: `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/pnpm-version-unification/plan.md`

## Initial Context

- User requested a small dedicated plan before continuing VPS redeployment.
- The immediate motivation is repeated deployment drift caused by mismatched:
  - `packageManager`
  - `pnpm-lock.yaml`
  - local/VPS/runtime `pnpm` versions

## Research Notes

- Current lockfile format observed:
  - `lockfileVersion: '6.0'`
- Version drift has already impacted:
  - `pnpm install --frozen-lockfile`
  - VPS deployment reproducibility
  - remote dependency tree stability

## Commands Run During Planning

- `sed -n '1,220p' /Users/ygg/.codex/skills/plan-work/SKILL.md`
- `ls docs/plan-excution | tail -n 40`
- `sed -n '1,260p' docs/plan-excution/testnet-mockusdt-vps-deployment/plan.md`

## Notes

- No implementation has started in this task yet.
- Any actual version unification changes must wait for approval.

## 2026-03-26 Implementation Progress

- Audited repo version entry points and confirmed the short-term deployment path should stay on `pnpm 8.x` while the committed `pnpm-lock.yaml` remains `lockfileVersion: '6.0'`.
- Confirmed current repo-side unification changes:
  - root `packageManager` pinned to `pnpm@8.15.9`
  - VPS bootstrap pinned to `pnpm@8.15.9`
  - deploy script restored to deterministic `pnpm install --frozen-lockfile`
  - deploy script now builds `packages/common` and runs `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate` before app builds
- Local validation results so far:
  - `CI=1 pnpm install --frozen-lockfile` passed
  - `pnpm --dir packages/common build` passed
  - `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate` passed
  - `pnpm --dir apps/server build` passed after clearing stale `apps/server/dist`
- Additional blocker discovered during local validation:
  - `apps/dapp` and `apps/admin` imported `injected` from `@wagmi/core`
  - but the apps only declare `wagmi`, not `@wagmi/core`
  - this broke `next build` despite the pnpm version path being otherwise correct
- Fix applied:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/wagmi-config.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/lib/wagmi-config.tsx`
  - changed imports to use `wagmi/connectors`

## 2026-03-26 Strategy Pivot

- User explicitly changed direction:
  - pause the current VPS redeploy
  - do the full repository migration to `pnpm 10.13.1` locally first
  - only return to the VPS after the local `pnpm 10.13.1` path is verified
- Therefore the earlier `pnpm 8.x` alignment work is now treated as:
  - useful diagnosis and temporary stabilization research
  - but **not** the final target state
- The authoritative target for this task is now:
  - `packageManager = pnpm@10.13.1`
  - regenerated `pnpm-lock.yaml`
  - updated deploy scripts and runbooks aligned to `pnpm 10.13.1`

## 2026-03-26 Local Verification Results

### Commands Run

- `pnpm --version`
- `CI=1 pnpm install --frozen-lockfile`
- `pnpm --dir packages/common build`
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate`
- `rm -rf apps/server/dist`
- `pnpm --dir apps/server build`
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/admin env:build`

### Results

- Local runtime observed:
  - `pnpm 8.7.5`
- `CI=1 pnpm install --frozen-lockfile`
  - passed
  - lockfile stayed stable under the unified `pnpm 8.x` path
- `pnpm --dir packages/common build`
  - passed
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate`
  - passed
- `pnpm --dir apps/server build`
  - passed
  - required clearing stale `apps/server/dist` once due `ENOTEMPTY`
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/dapp env:build`
  - passed
  - webpack emitted non-fatal optional connector warnings from `@wagmi/connectors`
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/admin env:build`
  - passed
  - webpack emitted the same non-fatal optional connector warnings from `@wagmi/connectors`

### Conclusion

- The temporary `pnpm 8.x` path was locally verified and helped isolate the real deployment issues.
- However, per the updated approved direction, the next phase is now:
  - migrate the repo to `pnpm 10.13.1`
  - regenerate and verify lockfile locally
  - then refresh VPS deployment guidance from that new baseline

## VPS Redeploy Guidance Status

- Previous VPS guidance targeting `pnpm 8.15.9` is now obsolete as the final deployment target.
- That guidance remains useful only as historical troubleshooting context.
- New VPS redeploy instructions will be regenerated after the local `pnpm 10.13.1` migration is completed and validated.

## 2026-03-26 PNPM 10.13.1 Migration

### Repo Alignment Changes

- Restored the repository-wide target version to `pnpm@10.13.1`:
  - `/Users/ygg/vs/ai/3U/3u_aura/package.json`
  - `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/bootstrap-vps.sh`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md`
- Regenerated `pnpm-lock.yaml` with `pnpm 10.13.1`
  - old format: `lockfileVersion: '6.0'`
  - new format: `lockfileVersion: '9.0'`

### Additional Compatibility Fixes Found During Cold Validation

- `pnpm 10` exposed a `pg` type duplication issue between:
  - project imports of `Pool`
  - `@prisma/adapter-pg` constructor expectations
- Fix applied by centralizing the adapter construction in:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/db/prisma-pg-config.ts`
- Updated callers:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/db/db.service.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/seed.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/scripts/reconcile-consolation-aura.ts`

- `pnpm 10` also exposed a hidden hoisting dependency in admin:
  - `apps/admin` imported `zod` directly but did not declare it
- Fix applied:
  - added `"zod": "^4.3.6"` to `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/package.json`

### Commands Run

- `COREPACK_HOME=/tmp/corepack corepack pnpm --version`
- `CI=1 COREPACK_HOME=/tmp/corepack corepack pnpm install --lockfile-only`
- `rm -rf node_modules apps/server/node_modules apps/dapp/node_modules apps/admin/node_modules packages/common/node_modules apps/server/generated apps/server/dist apps/dapp/.next apps/admin/.next`
- `CI=1 COREPACK_HOME=/tmp/corepack corepack pnpm install --frozen-lockfile`
- `COREPACK_HOME=/tmp/corepack corepack pnpm --dir packages/common build`
- `PROMOTION_ENV=testnet-mockusdt COREPACK_HOME=/tmp/corepack corepack pnpm --dir apps/server env:db:generate`
- `COREPACK_HOME=/tmp/corepack corepack pnpm --dir apps/server build`
- `rm -rf apps/server/dist`
- `COREPACK_HOME=/tmp/corepack corepack pnpm --dir apps/server build`
- `PROMOTION_ENV=testnet-mockusdt COREPACK_HOME=/tmp/corepack corepack pnpm --dir apps/dapp env:build`
- `CI=1 COREPACK_HOME=/tmp/corepack corepack pnpm install --lockfile-only`
- `CI=1 COREPACK_HOME=/tmp/corepack corepack pnpm install --frozen-lockfile`
- `PROMOTION_ENV=testnet-mockusdt COREPACK_HOME=/tmp/corepack corepack pnpm --dir apps/admin env:build`

### Results

- `COREPACK_HOME=/tmp/corepack corepack pnpm --version`
  - passed
  - resolved `pnpm 10.13.1`
- `pnpm-lock.yaml`
  - successfully migrated to `lockfileVersion: '9.0'`
- clean `pnpm 10.13.1` frozen install
  - passed
- `packages/common build`
  - passed
- `PROMOTION_ENV=testnet-mockusdt ... env:db:generate`
  - passed after allowing Prisma engine download
- `apps/server build`
  - passed after:
    - clearing stale `apps/server/dist` once
    - fixing `pg` type compatibility
- `apps/dapp env:build`
  - passed
  - still emits existing non-fatal optional connector webpack warnings from `@wagmi/connectors`
- `apps/admin env:build`
  - passed
  - required explicit `zod` dependency declaration
  - still emits the same non-fatal optional connector webpack warnings from `@wagmi/connectors`

### Conclusion

- The repository is now locally validated on the intended final toolchain baseline:
  - `packageManager = pnpm@10.13.1`
  - `pnpm-lock.yaml` format `9.0`
  - clean frozen install succeeds
  - `packages/common`, `apps/server`, `apps/dapp`, `apps/admin` production builds succeed
- The VPS redeploy should now follow this `pnpm 10.13.1` baseline rather than the earlier temporary `pnpm 8.x` workaround.
