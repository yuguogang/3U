## Objective
- Add a local-only override workflow for `testnet-mockusdt` so local bring-up is convenient on this machine without changing the committed shared deployment configuration.
- Make the workflow reusable for Codex and humans via stable scripts and documented conventions.

## Scope
- Extend `scripts/promotion-env` to optionally load gitignored local override env files for a promotion environment.
- Add root convenience scripts for local `testnet-mockusdt` bring-up.
- Add gitignore coverage and a checked-in example template for local override files.
- Update docs/instructions so local bring-up uses the override layer instead of ad hoc shell overrides.

## Out of Scope
- Changing the canonical committed values under `config/promotion-envs/testnet-mockusdt/*.public.env` or `manifest.json` to local-machine-specific values.
- Changing remote deploy scripts or VPS runbooks to consume local override files.
- Refactoring application runtime behavior outside env loading and developer startup workflow.

## Assumptions
- The desired local workflow should preserve remote `testnet-mockusdt` deployment behavior unchanged.
- A gitignored file such as `config/promotion-envs/testnet-mockusdt/local.override.env` is acceptable for machine-specific values like DB port and local base URLs.
- Existing app scripts (`env:start:dev`, `env:dev`) should remain the primary app-level entrypoints.

## Architecture Impact
- Environment assembly in [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs) will gain an extra local override layer, affecting local runtime composition for server/dapp/admin.
- Repo developer UX will change through new root scripts in [`package.json`](/Users/ygg/vs/ai/3U/3u_aura/package.json).
- Git hygiene will change through `.gitignore` and a checked-in example override file under `config/promotion-envs/testnet-mockusdt/`.

## Milestones

### Milestone 1
- Goal:
  Design and implement a local override resolution layer for promotion env loading.
- Affected files/modules:
  [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)
  [`scripts/promotion-env/run-with-env.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/run-with-env.mjs) if plumbing needs adjustment
- Implementation notes:
  Load optional override files from `config/promotion-envs/<env>/`.
  Keep shell-provided env vars as the final precedence.
  Prefer one shared local override file plus optional target-specific override files only if needed.
- Risks:
  Incorrect precedence could accidentally override explicit shell env or break current deployment flows.
  Server `DATABASE_URL` synthesis must still reflect the effective local DB override.
- Verification commands:
  `node scripts/promotion-env/print-env.mjs --target server --env testnet-mockusdt`
  `node scripts/promotion-env/print-env.mjs --target dapp --env testnet-mockusdt`
- Expected outputs:
  Local override values appear only when local override files exist.

### Milestone 2
- Goal:
  Add convenient root-level startup scripts and local override templates.
- Affected files/modules:
  [`package.json`](/Users/ygg/vs/ai/3U/3u_aura/package.json)
  [`.gitignore`](/Users/ygg/vs/ai/3U/3u_aura/.gitignore)
  `config/promotion-envs/testnet-mockusdt/local.override.env.example`
- Implementation notes:
  Add root scripts for local server/dapp/admin bring-up.
  Ignore the real local override file, but commit an example file documenting the expected keys.
- Risks:
  Script naming could collide with existing conventions if too generic.
- Verification commands:
  `pnpm run`
  `test -f config/promotion-envs/testnet-mockusdt/local.override.env.example && echo "example exists"`
- Expected outputs:
  New `local:testnet:*` scripts are visible.
  The example override file exists while the real override file remains ignored.

### Milestone 3
- Goal:
  Document the local workflow and validate it against the current machine setup.
- Affected files/modules:
  [`AGENTS.md`](/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md)
  [`docs/plan-excution/local-testnet-mockusdt-overrides/execution.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/local-testnet-mockusdt-overrides/execution.md)
- Implementation notes:
  Replace the ad hoc override note with the new canonical local override file workflow.
  Validate with local env printouts and at least one service start command if dependencies remain available.
- Risks:
  Documentation may drift from actual precedence if not updated after implementation details settle.
- Verification commands:
  `pnpm run local:testnet:server -- --help` if implemented with pass-through support, otherwise env print commands plus one real start command
  `rg -n "local.override.env|local:testnet" AGENTS.md package.json config/promotion-envs/testnet-mockusdt`
- Expected outputs:
  The new local override workflow is discoverable and aligned with actual scripts.

## Approval Checkpoint
- Proposed direction:
  implement a gitignored local override file workflow in `scripts/promotion-env`, add root `local:testnet:*` helper scripts, and keep remote deployment config untouched.

## Rollback / Recovery Notes
- If the override precedence causes regressions, remove the override-loading layer and revert to explicit shell overrides.
- If root helper scripts prove too opinionated, keep the env loader change and drop only the helper aliases.
- Do not change the committed canonical `testnet-mockusdt` deployment values during rollback.

## Final Verification Checklist
- Local override files are optional and gitignored.
- Shell env still overrides everything else.
- `testnet-mockusdt` committed deployment config remains unchanged.
- Root helper scripts exist and reflect the current machine’s local bring-up pattern.
- Documentation and `execution.md` reflect the real implementation and verification steps.
