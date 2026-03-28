## Objective
- Remove the redundant `apps/kimiui` application from the monorepo and clean up runtime/build configuration that still treats it as an active target.
- Keep the cleanup auditable and low-risk by limiting changes to active workspace/build tooling unless explicitly approved otherwise.

## Scope
- Delete the `apps/kimiui` directory and its local app-specific files.
- Remove active environment/build configuration that still supports `kimiui` as a runnable target.
- Update workspace metadata generated from active package topology if needed, including `pnpm-lock.yaml`.
- Verify that the remaining workspace no longer references `kimiui` in active code/config paths.

## Out of Scope
- Rewriting or deleting historical planning records under `docs/plan-excution/**` that mention `kimiui` as a past migration reference.
- Rewriting prompt files under `docs/prompts/**` unless explicitly approved.
- Refactoring `apps/dapp` or any production UI behavior unrelated to removing the redundant app.

## Assumptions
- `apps/kimiui` is no longer a supported runtime target and exists only as an obsolete reference implementation.
- Historical documentation should be preserved by default unless the user explicitly wants documentation cleanup too.
- No deployment, CI, or runtime path outside current repo search results depends on `apps/kimiui`.

## Architecture Impact
- Monorepo topology changes by removing one frontend app under `apps/*`.
- Environment orchestration changes in [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs) because `kimiui` is currently accepted as a promotion-env target and has a dedicated env mapping branch.
- Package manager metadata may change in [`pnpm-lock.yaml`](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml) because it currently contains an importer entry for `apps/kimiui`.
- No backend, contract, schema, settlement, or funds path is expected to change.

## Milestones

### Milestone 1
- Goal:
  Remove the obsolete app directory and active code paths that consider it a runnable project.
- Affected files/modules:
  [`apps/kimiui`](/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui)
  [`scripts/promotion-env/lib.mjs`](/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs)
- Implementation notes:
  Delete the `apps/kimiui` tree.
  Remove `kimiui` from `TARGETS`.
  Remove the `case 'kimiui'` env builder branch.
  Re-scan the repo excluding historical docs to confirm no active references remain.
- Risks:
  Hidden local scripts may still expect `--target kimiui`.
  Deleting the app without removing target support would leave a broken env entrypoint.
- Verification commands:
  `rg -n "apps/kimiui|target kimiui|--target kimiui|case 'kimiui'|\"kimiui\"" . --glob '!docs/**'`
  `test ! -d apps/kimiui && echo "apps/kimiui removed"`
- Expected outputs:
  No active non-doc references to `kimiui`.
  `apps/kimiui removed`

### Milestone 2
- Goal:
  Refresh generated workspace/package metadata so the repo no longer advertises `apps/kimiui` as a workspace importer.
- Affected files/modules:
  [`pnpm-lock.yaml`](/Users/ygg/vs/ai/3U/3u_aura/pnpm-lock.yaml)
  [`pnpm-workspace.yaml`](/Users/ygg/vs/ai/3U/3u_aura/pnpm-workspace.yaml) if investigation shows an explicit change is required
- Implementation notes:
  Because the workspace glob is `apps/*`, no explicit workspace entry is expected to need removal.
  Regenerate or minimally update the lockfile so the `apps/kimiui` importer entry disappears.
- Risks:
  Lockfile regeneration may touch unrelated sections if the package manager version normalizes formatting.
  Some validation commands may require already-installed dependencies.
- Verification commands:
  `rg -n "^  apps/kimiui:$|apps/kimiui" pnpm-lock.yaml`
  `pnpm install --lockfile-only`
- Expected outputs:
  No importer entry for `apps/kimiui` remains in `pnpm-lock.yaml`.
  `pnpm install --lockfile-only` completes without reintroducing `kimiui`.

### Milestone 3
- Goal:
  Validate the repo after cleanup and record any intentional leftover historical references.
- Affected files/modules:
  [`docs/plan-excution/remove-kimiui-app/execution.md`](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/remove-kimiui-app/execution.md)
  Optional doc paths only if separately approved
- Implementation notes:
  Run targeted verification and record exact outcomes in `execution.md`.
  If historical docs are left intact, document that choice explicitly as an approved non-goal.
- Risks:
  A broad `rg` across the repo will still find legacy docs, which could be mistaken for active config drift.
- Verification commands:
  `git status --short`
  `rg -n "apps/kimiui|kimiui" .`
- Expected outputs:
  Remaining hits, if any, are limited to approved historical documentation or logs.

## Approval Checkpoint
- Default implementation scope:
  Remove `apps/kimiui`, remove active config/code references, refresh lockfile, preserve historical docs.
- Explicit approval question for execution:
  Approve the default scope above, or extend the task to also rewrite/delete historical `docs/**` references to `kimiui`.

## Rollback / Recovery Notes
- If removal causes an unexpected dependency, restore the deleted `apps/kimiui` tree from git history and reintroduce the `promotion-env` target in one revert.
- If lockfile regeneration causes unrelated churn, restore the previous lockfile and apply a narrower update strategy.
- Preserve all unrelated user changes already present in the worktree.

## Final Verification Checklist
- `apps/kimiui` is removed.
- Active code/config no longer references `kimiui`.
- `pnpm-lock.yaml` no longer contains an `apps/kimiui` importer entry.
- Verification commands and outcomes are recorded in `execution.md`.
- Any intentionally preserved historical references are documented as approved out-of-scope items.
