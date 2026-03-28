# Auth Signin Stability Execution Log

## Status
- Implementation in progress.
- Auth flow code changes completed locally.
- Local manual verification environment is running on `3110 / 3100 / 3101`.

## Findings Collected During Planning
- Repeated `SIGNIN` prompts occur because the dapp auto-login path re-runs whenever wallet connection exists but app auth state has been cleared.
- The dapp currently hard-logs out on any `401 Unauthorized`.
- The signin request path in the dapp has the `credentials: "include"` comment present but not enabled.
- Team page share access currently requires both tree readiness and `inviteCode`.
- Backend signin challenge generation depends on cache-backed challenge storage.
- `testnet-mockusdt` deployment configuration appears to omit Redis password propagation for server cache usage while Docker Redis is password-protected.

## Implementation Progress

### 1. Shared contract and DTO updates
- Added optional `message` to shared auth signin payload so the exact challenge message can be sent back during signature signin.
- Updated server signin DTO to accept the optional `message`.

### 2. Server auth hardening
- Refactored auth challenge creation to use explicit helpers for:
  - challenge message construction
  - challenge message validation
- Updated signin verification to prefer the client-returned challenge message instead of requiring a fresh cache lookup.
- Added cache-failure fallback during challenge generation so signin challenge creation no longer hard-depends on Redis availability.

### 3. Dapp/admin auth flow fixes
- Enabled `auth: false` for unauthenticated signature bootstrap requests.
- Enabled `credentials: "include"` for signature signin requests.
- Updated wallet button signin flow to submit the original challenge `message` back to the server.
- Relaxed global `401` handling so unauthenticated bootstrap requests no longer force an immediate logout loop.
- Applied the same signin payload / credentials changes to admin auth flow.

### 4. Deployment/runtime config fixes
- Updated server config to support password-injected Redis URLs for:
  - cache
  - throttler
  - bull
- Updated `deploy-testnet-mockusdt.sh` so remote `server.env` inherits Redis password fields from `infra.env`.
- Updated systemd templates from `zsh` to `bash` for Ubuntu compatibility.

## Local Verification Work Performed

### Build / type validation
- `pnpm --dir packages/common build`
- `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:generate`
- `pnpm --dir apps/server exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/dapp exec tsc -p tsconfig.json --noEmit`
- `pnpm --dir apps/admin env:build`
- `pnpm --dir apps/server build`

### Local runtime setup
- Removed stale server build artifacts after Nest watch repeatedly failed with `ENOTEMPTY` on `apps/server/dist`.
- Re-generated Prisma client.
- Fixed `scripts/promotion-env/lib.mjs` so explicit shell overrides for:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `CORS_ORIGIN`
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_NAME`
  are no longer overwritten by manifest-derived defaults.
- Created local-only database `3u_aura_testnet_mockusdt` inside the existing Docker Postgres on port `5433` by cloning local `3u_aura_uat_mockusdt`.
- Confirmed the cloned local schema was stale versus current code:
  - missing `Notification` / `NotificationRead` tables
  - missing `LotteryTicket.isParticipating`
  - missing `LotteryTicket.participatedAt`
  - missing `LotteryTicket.isResultRevealed`
  - missing `LotteryTicket.revealedAt`
- Applied the missing local-only schema migrations directly to `3u_aura_testnet_mockusdt`:
  - `20260319_multilingual_notification_center_foundation`
  - `20260324_lottery_opt_in_reveal_state`
- Inserted matching rows into local `_prisma_migrations` so Prisma history now reflects the repaired schema.
- Started local verification stack with:
  - server: `PROMOTION_ENV=testnet-mockusdt DATABASE_PORT=5433 DATABASE_NAME=3u_aura_testnet_mockusdt DATABASE_USER=postgres DATABASE_PASSWORD=password CORS_ORIGIN=http://127.0.0.1:3100,http://127.0.0.1:3101 pnpm --dir apps/server env:start:prod`
  - dapp: `PROMOTION_ENV=testnet-mockusdt NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110 pnpm --dir apps/dapp env:dev`
  - admin: `PROMOTION_ENV=testnet-mockusdt NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110 pnpm --dir apps/admin env:dev`

### Local runtime checks
- `curl -sS http://127.0.0.1:3110/api/v1/health`
  - returned `{"status":"ok",...}`
- `curl -I http://127.0.0.1:3100`
  - returned `HTTP/1.1 200 OK`
- `curl -I http://127.0.0.1:3101/dashboard`
  - returned `HTTP/1.1 200 OK`
- `curl -i http://127.0.0.1:3110/api/v1/auth/signature_message?... -H 'Origin: http://127.0.0.1:3100'`
  - returned `HTTP/1.1 200 OK`
  - returned `Access-Control-Allow-Origin: http://127.0.0.1:3100`
- `docker exec aura_postgres psql -U postgres -d 3u_aura_testnet_mockusdt -c '\d "LotteryTicket"'`
  - confirmed the local table now includes:
    - `isParticipating`
    - `participatedAt`
    - `isResultRevealed`
    - `revealedAt`
- `docker exec aura_postgres psql -U postgres -d 3u_aura_testnet_mockusdt -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('Notification', 'NotificationRead');"`
  - confirmed both notification tables exist
- `pnpm --dir apps/server test -- --runInBand src/modules/notification/services/notification-read.service.spec.ts src/modules/claims/services/claims-read.service.spec.ts`
  - passed (`2` suites, `5` tests)
- `pnpm --dir apps/server build`
  - passed after local server processes were stopped

## Files Updated During Implementation
- `/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/models/aura.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/packages/common/src/validators/aura.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/dto/signature-signin.dto.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/auth.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/fetch.client.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/api/auth.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/lib/fetch.client.ts`
- `/Users/ygg/vs/ai/3U/3u_aura/apps/admin/src/components/auth/admin-wallet-button.tsx`
- `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/deploy-testnet-mockusdt.sh`
- `/Users/ygg/vs/ai/3U/3u_aura/scripts/promotion-env/lib.mjs`
- `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-server.service.template`
- `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-dapp.service.template`
- `/Users/ygg/vs/ai/3U/3u_aura/ops/systemd/3u-aura-admin.service.template`
- `/Users/ygg/vs/ai/3U/3u_aura/ops/env/testnet-mockusdt.shared.env.example`
- `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/deploy-testnet-mockusdt.sh`
- `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-vps-deployment.md`
- `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-remote-handoff.md`
- `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md`

## Commands / Evidence Gathered During Planning
- Reviewed auth/cache configuration and dapp auth flow via repository inspection.
- Confirmed relevant files:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/services/auth.service.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/controllers/auth.controller.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/app.module.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/configuration/config.configuration.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/api/auth.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/lib/fetch.client.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/pages/team-page.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/store/auth.store.ts`
  - `/Users/ygg/vs/ai/3U/3u_aura/config/promotion-envs/testnet-mockusdt/server.public.env`
  - `/Users/ygg/vs/ai/3U/3u_aura/ops/docker/testnet-mockusdt.compose.yml`

## Deviations
- Local watch-mode server startup was not reliable because Nest repeatedly failed to remove `apps/server/dist` with `ENOTEMPTY`.
- Switched local verification to `build + env:start:prod` for server instead of `env:start:dev`.

## Deployment Documentation Updates
- Added JWT secret placeholders to `ops/env/testnet-mockusdt.shared.env.example` so VPS secret preparation matches real runtime requirements.
- Updated the VPS deployment runbook to reflect the issues seen during the previous rollout:
  - Node / pnpm version drift
  - missing JWT secrets
  - stale `zsh`-based systemd units
  - root-owned server build artifacts
  - Nginx default site conflicts
  - explicit subdomain `certbot` issuance
  - manual Prisma commands must source `/etc/3u-aura/testnet-mockusdt/shared.env` and `server.env`
  - fresh VPS databases may require a one-time baseline alignment using `20260311_schema_model_alignment_hardening` before `prisma migrate deploy` can succeed
- Updated the remote handoff document with the same rollout issue summary and the corrected secret / Nginx / certbot flow.
- Added `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md` as a focused production repair plan.

## Additional Remote Findings
- Remote VPS app services can be `active (running)` while page routes still return `500` if the Postgres schema baseline is missing.
- Manual `env:db:migrate deploy` on the VPS initially failed with:
  - `P1000 Authentication failed`
  - because interactive shells did not load `/etc/3u-aura/testnet-mockusdt/shared.env` / `server.env`
- After loading the env files explicitly, the real blocker became:
  - `P3018`
  - `relation "User" does not exist`
  - while applying `20260311_phase2_checkin_pool_split_fact`
- Repository inspection confirmed this is a baseline-order problem on fresh databases:
  - `20260311_phase2_checkin_pool_split_fact` adds foreign keys to `User`, `Checkin`, and `PaymentReceipt`
  - those base tables are actually created in `20260311_schema_model_alignment_hardening`
- The repair path was documented as:
  - use `node scripts/promotion-env/run-with-env.mjs --target server -- prisma ...` for manual Prisma commands so `DATABASE_URL` is present
  - if the fresh VPS database is half-initialized with only `_prisma_migrations` and `PoolSplitFact`, drop `PoolSplitFact` and mark `20260311_phase2_checkin_pool_split_fact` as rolled back
  - `prisma db execute --file apps/server/prisma/migrations/20260311_schema_model_alignment_hardening/migration.sql`
  - `prisma migrate resolve --applied 20260311_schema_model_alignment_hardening`
  - rerun `PROMOTION_ENV=testnet-mockusdt pnpm --dir apps/server env:db:migrate deploy`
- Remote auth signin still returned `500` after the baseline repair because `RefreshToken` was missing from the VPS database.
- Repository inspection confirmed `apps/server/prisma/schema.prisma` defines `model RefreshToken`, but no existing migration created that table.
- Added a new Prisma migration:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/migrations/20260327_refresh_token_table/migration.sql`
  - to create `RefreshToken`, its unique token index, the `userId` index, and the `User` foreign key.
- Added `/Users/ygg/vs/ai/3U/3u_aura/scripts/deploy/repair-testnet-mockusdt-db.sh` so VPS operators can repair and migrate the testnet-mockusdt database in one command instead of manually running:
  - password alignment
  - failed phase2 rollback
  - baseline SQL execution
  - `prisma migrate deploy`

## Additional Verification
- `bash -n scripts/deploy/deploy-testnet-mockusdt.sh`
  - passed after adding the ownership correction step
