# Plan: Phase 1 - Infrastructure & Data Models

## Objectives
- Scaffold the Monorepo environment.
- Reconstruct the Prisma schema from the protocol specification.
- Setup the PostgreSQL database and migration pipeline.
- Synchronize the shared types in `packages/common`.

## Tasks
1. [x] Switch database from MySQL to PostgreSQL.
2. [x] Reconstruct `schema.prisma` with `txHashKey` and `placementKey`.
3. [x] Configure `docker-compose.yml` for port 5433 (Postgres) and 5050 (pgAdmin).
4. [x] Reset and seed the database with an Admin root user.
5. [x] Clean up `packages/common` to remove legacy code.
