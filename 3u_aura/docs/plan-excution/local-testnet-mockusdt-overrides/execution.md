# local-testnet-mockusdt-overrides execution log

## Status
- Planning completed.
- User approved implementation.
- Implementation completed.

## Research summary
- Current local bring-up works only via ad hoc shell overrides:
  - `DATABASE_PORT=5433`
  - `CORS_ORIGIN=http://127.0.0.1:3100,http://127.0.0.1:3101`
  - `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110`
- The canonical committed `testnet-mockusdt` env files still point at deployment values such as `5432` and `https://api.goldmint.vip`.
- `scripts/promotion-env/lib.mjs` already centralizes env merging, making it the best insertion point for a local-only override layer.

## Commands run during planning
- `sed -n '1,220p' .gitignore`
- `sed -n '1,220p' package.json`
- `rg -n "loadBaseEnv|parseEnvFile|run-with-env|print-env|promotion-env" scripts/promotion-env -g '!**/node_modules/**'`
- `ls -la scripts/promotion-env`
- `sed -n '1,220p' scripts/promotion-env/run-with-env.mjs`
- `sed -n '400,470p' scripts/promotion-env/lib.mjs`
- `ls -la config/promotion-envs/testnet-mockusdt`

## Notes
- The goal was to preserve remote deployment behavior and remove repeated ad hoc local overrides.

## Execution log
- 2026-03-28 15:48:37 CST
  User approved the local override workflow implementation.
- 2026-03-28 15:48:37 CST
  Implemented local override loading in [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs):
  added `getPromotionEnvDir`
  added `loadLocalOverrideEnv`
  merged `local.override.env` and optional `<target>.local.override.env` before explicit shell env
  kept explicit shell env as the final precedence
  updated `DATABASE_URL` synthesis to honor local DB overrides
- 2026-03-28 15:48:37 CST
  Updated [`scripts/promotion-env/print-env.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/print-env.mjs) to print the effective target env including local override keys and runtime-derived `DATABASE_URL`.
- 2026-03-28 15:48:37 CST
  Added root convenience scripts in [`package.json`](/Users/ygg/vs/ai/3U/3u_aura/package.json):
  `local:testnet:common`
  `local:testnet:server`
  `local:testnet:dapp`
  `local:testnet:admin`
  `local:testnet:print:server`
  `local:testnet:print:dapp`
  `local:testnet:print:admin`
- 2026-03-28 15:48:37 CST
  Added gitignore coverage for local override files in [`.gitignore`](/Users/ygg/vs/ai/3U/3u_aura/.gitignore).
- 2026-03-28 15:48:37 CST
  Added the checked-in example file [`local.override.env.example`](/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/local.override.env.example) and created the real gitignored local override file for this machine with:
  `DATABASE_PORT=5433`
  `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110`
  `CORS_ORIGIN=http://127.0.0.1:3100,http://127.0.0.1:3101`
- 2026-03-28 15:48:37 CST
  Updated [`AGENTS.md`](/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md) so future local `testnet-mockusdt` bring-up uses the override-file workflow and the new root scripts instead of ad hoc shell overrides.

## Commands run during implementation
- `sed -n '1,140p' scripts/promotion-env/lib.mjs`
- `sed -n '274,308p' AGENTS.md`
- `pnpm run local:testnet:print:server`
- `pnpm run local:testnet:print:dapp`
- `pnpm run local:testnet:print:admin`
- `pnpm run local:testnet:common`
- `rg -n "local.override.env|local:testnet" AGENTS.md package.json config/promotion-envs/testnet-mockusdt scripts/promotion-env`
- `git status --short`

## Verification results
- `pnpm run local:testnet:print:server`
  passed
  confirmed `DATABASE_PORT=5433`, local `CORS_ORIGIN`, local `NEXT_PUBLIC_API_BASE_URL`, and `DATABASE_URL=...@127.0.0.1:5433/...`
- `pnpm run local:testnet:print:dapp`
  passed
  confirmed `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110`
- `pnpm run local:testnet:print:admin`
  passed
  confirmed `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110`
- `pnpm run local:testnet:common`
  passed
  verified the new root alias can build `packages/common`
- `git status --short`
  confirmed the real `config/promotion-envs/testnet-mockusdt/local.override.env` file is ignored
  confirmed only the example file is visible to git
- `rg -n "local.override.env|local:testnet" ...`
  confirmed the new workflow is wired into `scripts/promotion-env`, `package.json`, `AGENTS.md`, and the example file
