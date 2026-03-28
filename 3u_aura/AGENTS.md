# AGENTS.md — 3U AURA Codex Project Instructions

## Project Overview
This repository is the monorepo for the **3U AURA** Web3 protocol.

### Architecture
- **Frontend**: `apps/dapp` — Next.js 16, Wagmi, TailwindCSS
- **Backend**: `apps/server` — NestJS 11, Prisma, BullMQ, Redis
- **Smart Contracts**: `apps/contracts` — Foundry, Solidity
- **Shared Models**: `packages/common` — Types, Zod schemas, shared enums, queue payload schemas

### Core Business Domains
- Binary tree volume calculation
- Daily check-ins (`$3 USDT`)
- AURA reward accounting
- Weekly lottery and settlement
- Founder NFT (`ERC721A`)
- Claim / eligibility / reward distribution

## Why this file exists
Codex reads `AGENTS.md` before it starts working in a repository, and OpenAI recommends using it for project-specific instructions and layered guidance. For longer or more complex work, OpenAI also recommends pairing `AGENTS.md` with a separate `PLANS.md` / execution-plan workflow rather than overloading `AGENTS.md` itself. citeturn256092search0turn256092search1turn256092search10

## Engineering Priorities
1. Keep the codebase auditable, deterministic, and easy to review.
2. Preserve strict separation between UI, business logic, persistence, and on-chain logic.
3. Treat financial, reward, and claim flows as high-risk paths.
4. Prefer safe, reversible, small iterations over broad speculative edits.
5. Always leave a trace of planning, execution, and verification.

---

## Required Working Mode

### Plan → Approval → Execution
For any **Major** or **Critical** task, Codex must first create a task-specific plan file and wait for approval before implementation. This matches OpenAI guidance that `AGENTS.md` is best for standing instructions, while `PLANS.md` / execution plans are better for multi-hour or multi-phase work. citeturn256092search0turn256092search1turn256092search10

### Task Directory Convention
Create a task directory under:

- `docs/plan-excution/<task-name>/`

Every task directory must contain:

- `plan.md`
- `execution.md`

For especially large tasks, milestones may also be split into:

- `docs/plan-excution/<task-name>/milestones/01-...md`
- `docs/plan-excution/<task-name>/milestones/02-...md`

### Required Planning Structure
Each `plan.md` must be **hierarchical**, not flat. It must contain at least:

1. Objective
2. Scope
3. Out of Scope
4. Assumptions
5. Architecture Impact
6. Milestones
   - For each milestone:
     - goal
     - affected files/modules
     - implementation notes
     - risks
     - verification commands
     - expected outputs
7. Approval Checkpoint
8. Rollback / Recovery Notes
9. Final Verification Checklist

Milestones must be small enough to implement and verify in one iteration.

### Approval Rule
- Do **not** implement Major or Critical work until the user has reviewed and approved `plan.md`.

### Execution Rule
After approval:
- implement in small steps
- append real progress to `execution.md`
- record real commands run
- record verification results
- record deviations from the original plan

### Completion Rule
Do not treat a task as complete until:
- code changes are finished
- relevant tests are finished
- validation commands were run where relevant
- `execution.md` reflects the real work performed

### Task Severity
- **Minor**: small fix / localized refactor
- **Major**: multi-file change / feature / structural refactor
- **Critical**: any change affecting funds, rewards, claims, settlement, permissions, contracts, eligibility, schema, or tree logic

Critical tasks require extra caution, clearer notes, and stronger verification.

---

## Architecture Rules

### Controllers
- Controllers must stay thin.
- Controllers may:
  - parse request input
  - enforce auth / permission
  - call services
  - map responses
- Controllers must not contain:
  - binary tree logic
  - reward logic
  - settlement logic
  - lottery qualification logic
  - complex branching business rules

### Services / Engines
- Business rules belong in Services or Engine / Domain modules.
- Complex deterministic logic should be extracted into framework-agnostic modules whenever possible.
- Examples:
  - tree traversal and volume aggregation
  - check-in qualification
  - weekly ranking logic
  - lottery qualification
  - NFT eligibility
  - reward distribution

### Prisma / Repositories
- Prisma code should focus on persistence and query composition.
- Do not bury business policy inside Prisma query blocks.
- Financial operations must use explicit transaction boundaries.
- Use idempotency protection for all reward/payment/claim flows.

### Shared Models
- Shared enums, Zod schemas, API contracts, queue payloads, and constants must come from `packages/common`.
- Do not redefine equivalent DTOs or enums separately in apps unless explicitly justified.

---

## Stack-Specific Rules

### NestJS (`apps/server`)
- Use `nestjs-zod` for validation.
- Keep orchestration in Services.
- Keep core business logic in Engines / Domain modules.
- Keep infrastructure concerns in adapters, repositories, queue processors, and Prisma access layers.
- Any financial or settlement mutation must be:
  - transactional
  - idempotent
  - auditable

### Prisma
- All financial operations must run inside `Prisma.$transaction`.
- Do not perform external RPC calls, HTTP requests, or long-running computations inside DB transactions.
- Preserve:
  - `chainId`
  - raw `txHash`
  - normalized unique key when needed
- Schema changes affecting high-risk tables require extra review.

### BullMQ
- Queue payloads must use shared Zod schemas from `packages/common`.
- Jobs must be:
  - idempotent
  - retry-safe
  - resumable when practical
- Queue processors should orchestrate services, not implement core business rules.
- Settlement / distribution jobs must persist progress.

### Foundry / Solidity (`apps/contracts`)
- Prefer audited OpenZeppelin patterns first.
- Use gas optimization only after correctness and safety are clear.
- Use ERC721A where appropriate.
- Write NatSpec for all public/external functions and important state variables.
- Explicitly test:
  - replay protection
  - nonce handling
  - signer validation
  - chain/domain mismatch
  - expiry
  - unauthorized access
  - revert paths

### Next.js (`apps/dapp`)
- Separate Web3 hooks from UI components.
- Use `use client` only where required.
- UI components must not directly own complex contract call assembly logic.
- Prefer:
  - `hooks/` for wallet/chain interaction
  - adapters/services for contract-specific logic
  - presentational components for rendering

---

## Testing Requirements

### Backend
Critical business logic requires unit tests:
- binary tree volume calculation
- lottery qualification
- weekly settlement
- NFT eligibility
- reward allocation

Financial workflows require integration tests for:
- happy path
- duplicate / retry path
- failure / rollback path

### Contracts
Use `forge test` for:
- happy path
- revert path
- access control
- event emission
- replay / edge cases

Prefer fork-based testing over rushed testnet deployments.

### Frontend
Critical user flows should have at least smoke coverage:
- connect wallet
- daily check-in
- claim
- NFT purchase / mint

---

## Financial Safety Rules
All balance, claim, reward, payment, and eligibility mutations are high-risk.

They must have:
- transaction boundaries
- idempotency protection
- audit trail
- explicit status transitions
- traceable business keys

Never rely on a single in-memory step for settlement-critical flows.

If an action changes:
- money
- rewards
- claimability
- eligibility
- tree-dependent totals

then the result must be recoverable and auditable afterward.

---

## Database & Schema Rules
- All Prisma schema changes must come with migrations.
- Breaking schema changes must include compatibility notes and, if needed, a data migration plan.
- High-risk tables include:
  - ledger
  - claim
  - payment receipt
  - settlement / epoch
  - referral tree
  - NFT eligibility
- Be careful with nullable unique constraints and multi-chain uniqueness assumptions.
- Prefer robust uniqueness patterns for tx / token / claim records.

---

## Debugging & Command Safety

### Never do this
- Do not run interactive commands that may hang, such as `docker exec -it ...`.
- Do not use risky ad hoc database writes outside approved scripts or Prisma flows.
- Do not deploy contracts hastily to testnets as a substitute for testing.

### Preferred workflow
- Use `npx prisma studio` or local Prisma scripts for DB inspection.
- Use package scripts and reproducible commands.
- Use `forge test` and fork tests for contracts.
- Keep iterations small and reviewable.

### Local `testnet-mockusdt` Bring-Up
- For local manual validation of `server` / `dapp` / `admin` against the developer's real localhost Postgres/Redis, prefer direct non-sandbox execution instead of first attempting sandboxed runs.
- When the user asks to start the local `testnet-mockusdt` stack, Codex should immediately request escalated execution for long-running dev servers and localhost health checks.
- Do not change committed `config/promotion-envs/testnet-mockusdt/**` values just to fit one developer machine. Treat those files as the canonical shared environment definition for deployment.
- Machine-specific values must live in gitignored override files under `config/promotion-envs/testnet-mockusdt/`.
- Supported local override files:
  - `config/promotion-envs/testnet-mockusdt/local.override.env`
  - `config/promotion-envs/testnet-mockusdt/server.local.override.env`
  - `config/promotion-envs/testnet-mockusdt/dapp.local.override.env`
  - `config/promotion-envs/testnet-mockusdt/admin.local.override.env`
- Current known local overrides for this repo are:
  - `DATABASE_PORT=5433`
  - `CORS_ORIGIN=http://127.0.0.1:3100,http://127.0.0.1:3101`
  - `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3110`
- Preferred local start commands:
  - `pnpm run local:testnet:common`
  - `pnpm run local:testnet:server`
  - `pnpm run local:testnet:dapp`
  - `pnpm run local:testnet:admin`
- Preferred debug commands:
  - `pnpm run local:testnet:print:server`
  - `pnpm run local:testnet:print:dapp`
  - `pnpm run local:testnet:print:admin`
- Before starting those services, check whether ports `3100`, `3101`, or `3110` are already occupied and stop the conflicting processes if the user requested a clean relaunch.

---

## Verification & Completion Rules
A non-trivial task is not complete until all of the following are true:

- code changes are done
- relevant tests were run
- lint/typecheck/build were run where relevant
- `execution.md` contains real verification evidence
- any skipped validation is explicitly documented

Recommended commands when relevant:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:server`
- `pnpm test:dapp`
- `pnpm test:contracts`
- `pnpm build`

Record the commands actually run and summarize the result in `execution.md`.

---

## Review Checklist Before Completion
Before asking for approval on a completed task, verify:

- architecture boundaries were preserved
- shared models stayed consistent
- transaction boundaries are safe
- idempotency is preserved where needed
- tests cover success and failure/retry paths
- execution logs reflect the real work performed

---

## Behavioral Expectations for Codex
When working in this repo:

1. Prefer minimal, high-confidence edits.
2. Avoid speculative refactors unless requested.
3. Preserve existing naming and module structure unless the task requires change.
4. If a task is risky, say so clearly in `plan.md`.
5. If a rule conflict appears, prioritize:
   - financial safety
   - auditability
   - testability
   - minimal blast radius
6. Do not proceed to the next major phase without explicit review approval.

---

## Final Principle
Prefer explicit structure over convenience, deterministic workflows over ad hoc fixes, and traceable implementation over hidden complexity.
