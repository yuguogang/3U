# remove-kimiui-app execution log

## Status
- Planning completed.
- User approved the default execution scope.
- Implementation in progress.

## Research summary
- `apps/kimiui` is a full Vite app with its own `package.json`, build scripts, lint config, Tailwind config, and built `dist/` output.
- Active non-doc references found during research:
  [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)
  [`pnpm-lock.yaml`](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml)
- Historical references were also found under `docs/prompts/**` and the old DApp UI migration task directory; these were later removed after follow-up approval.

## Commands run during planning
- `pwd`
- `rg --files apps | rg 'kimiui'`
- `rg -n "apps/kimiui|kimiui" .`
- `sed -n '1,220p' package.json`
- `sed -n '1,220p' pnpm-workspace.yaml`
- `sed -n '1,420p' scripts/promotion-env/lib.mjs`
- `rg -n "infra\\.(kimiui|dapp|admin)|kimiui" config scripts apps packages --glob '!apps/kimiui/**' --glob '!docs/**'`
- `git status --short`
- `find apps/kimiui -maxdepth 2 -type f | sort | sed -n '1,120p'`
- `sed -n '1,220p' apps/kimiui/package.json`
- `rg -n '"3u-aura-kimiui"|apps/kimiui|target kimiui|--target kimiui|case '\''kimiui'\''' . --glob '!apps/kimiui/**' --glob '!docs/**'`

## Notes
- Existing unrelated worktree changes were detected and must be preserved:
  [`docs/plan-excution/auth-signin-stability/execution.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/auth-signin-stability/execution.md)
  [`docs/runbooks/testnet-mockusdt-online-repair.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md)
  [`docs/runbooks/testnet-mockusdt-remote-handoff.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md)
  [`docs/runbooks/testnet-mockusdt-vps-deployment.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md)
  [`apps/server/prisma/migrations/20260327_refresh_token_table`](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/migrations/20260327_refresh_token_table)
  [`scripts/deploy/repair-testnet-mockusdt-db.sh`](/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/repair-testnet-mockusdt-db.sh)

## Execution log
- 2026-03-28 14:53:40 CST
  Approved default scope: remove `apps/kimiui`, remove active config support, refresh lockfile state, preserve historical docs.
- 2026-03-28 14:53:40 CST
  Confirmed active cleanup targets before editing:
  [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)
  [`pnpm-lock.yaml`](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml)
- 2026-03-28 14:53:40 CST
  Applied text edits:
  removed `kimiui` from `TARGETS`
  removed `case 'kimiui'` env mapping
  removed `apps/kimiui` importer block from `pnpm-lock.yaml`
- 2026-03-28 14:53:40 CST
  Deleted the `apps/kimiui` directory tree.
- 2026-03-28 14:53:40 CST
  Targeted repo verification after deletion:
  `test ! -d apps/kimiui && echo "apps/kimiui removed"` passed
  `rg -n "apps/kimiui|target kimiui|--target kimiui|case 'kimiui'|\"3u-aura-kimiui\"" . --glob '!docs/**'` returned no matches
  `rg -n '^  apps/kimiui:$|apps/kimiui' pnpm-lock.yaml` returned no matches
- 2026-03-28 15:16:14 CST
  Investigated the lockfile warning and confirmed the repo/tool mismatch:
  repo lockfile is `9.0` and expects `pnpm 10.13.1`
  local default `pnpm` was still `8.7.5`
  `corepack` could resolve `10.13.1`, but shell default was an older global install
- 2026-03-28 15:16:14 CST
  Updated local default `pnpm` to `10.13.1` via global install so `pnpm` now aligns with the repo standard.
- 2026-03-28 15:18:47 CST
  Re-ran lockfile validation with local `pnpm 10.13.1`:
  first `CI=1 pnpm install --lockfile-only --ignore-scripts` completed successfully and rewrote the lockfile into pnpm 10's canonical shape
  second `CI=1 pnpm install --lockfile-only --ignore-scripts` completed in 669ms with no `Ignoring not compatible lockfile` warning
  remaining warnings were limited to existing deprecated subdependencies and `@rainbow-me/rainbowkit` peer warnings against `wagmi@3`
- 2026-03-28 15:24:31 CST
  Extended cleanup approved for historical docs:
  removed the obsolete `docs/plan-excution/ui-migration-kimiui-to-dapp` task directory
  removed the associated phase prompt files under `docs/prompts/`
  updated a remaining cross-reference in multilingual notification planning docs to use a generic legacy UI migration description

## Final verification results
- `apps/kimiui` has been removed from the workspace.
- Active non-doc references to `kimiui` are gone.
- [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs) no longer supports `kimiui` as a target.
- [`pnpm-lock.yaml`](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml) no longer contains an `apps/kimiui` importer entry.
- Local default `pnpm` now reports `10.13.1`.
- A second `pnpm 10.13.1` lockfile-only run completed cleanly without the incompatible-lockfile warning.
- Obsolete migration prompts and the dedicated `ui-migration-kimiui-to-dapp` task docs have been removed.
