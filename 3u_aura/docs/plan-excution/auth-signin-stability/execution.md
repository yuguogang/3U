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
- Updated the remote handoff document with the same rollout issue summary and the corrected secret / Nginx / certbot flow.
- Added `/Users/ygg/vs/ai/3U/3u_aura/docs/runbooks/testnet-mockusdt-online-repair.md` as a focused production repair plan.

## Additional Verification
- `bash -n scripts/deploy/deploy-testnet-mockusdt.sh`
  - passed after adding the ownership correction step
