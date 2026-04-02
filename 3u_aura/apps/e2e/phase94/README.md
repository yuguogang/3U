# Phase 94 Manual Verification Toolkit

`apps/e2e/phase94` is kept as an explicit manual verification toolkit.
It is not part of the default CI path.
It is also no longer part of the default pnpm workspace install.

## What CI Uses

- Automated CI should continue to use `scripts/ci/*`
- Do not add `test:uat` or `test:weekly-fork` to default CI jobs

## Manual Install

Install this toolkit only when you intentionally need browser-driven manual verification.

From `apps/e2e/phase94`:

```bash
pnpm install
```

That local install may create `apps/e2e/phase94/pnpm-lock.yaml`; the repo ignores it on purpose so ad hoc manual setup does not churn the root lockfile.

## Manual Entry Points

From this directory, the main opt-in commands are:

```bash
pnpm run manual:core
pnpm run manual:uat
pnpm run manual:weekly-fork
```

The legacy `test:*` commands still exist as compatibility aliases, but the `manual:*` names are the preferred entry points.

Those commands are intended for operator-run smoke checks and manual UAT, not for the default CI lane.

## Notes

- The folder depends on Playwright and Synpress for browser-driven verification.
- Use the repo runbooks under `docs/runbooks/` for environment bring-up and manual deployment guidance.
